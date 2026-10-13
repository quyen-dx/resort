import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/lib/db';
import { logger } from '@/server/lib/logger';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const requestId = request.headers.get('x-request-id') || logger.generateRequestId();
  const { searchParams } = new URL(request.url);
  const includeLogs = searchParams.get('includeLogs') === 'true';

  let dbStatus: 'CONNECTED' | 'DISCONNECTED' | 'ERROR' = 'DISCONNECTED';
  let dbLatencyMs = 0;
  let overallStatus: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY' = 'HEALTHY';
  let dbError: string | null = null;

  try {
    const dbStartTime = Date.now();
    await db.$queryRaw`SELECT 1`;
    dbLatencyMs = Date.now() - dbStartTime;
    dbStatus = 'CONNECTED';

    if (dbLatencyMs > 500) {
      overallStatus = 'DEGRADED';
      logger.warn('Database latency exceeded 500ms threshold', { dbLatencyMs }, requestId);
    }
  } catch (err: unknown) {
    dbStatus = 'ERROR';
    overallStatus = 'UNHEALTHY';
    dbError = err instanceof Error ? err.message : 'Unknown database error';
    logger.error('Health check database probe failed', { error: dbError }, requestId);
  }

  const memory = process.memoryUsage();
  const totalDurationMs = Date.now() - startTime;

  const healthData = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    service: 'resort-management-ecosystem',
    version: '1.0.0',
    requestId,
    uptimeSeconds: Math.floor(process.uptime()),
    database: {
      status: dbStatus,
      latencyMs: dbLatencyMs,
      error: dbError,
    },
    system: {
      nodeVersion: process.version,
      platform: process.platform,
      memory: {
        rssMb: Math.round((memory.rss / 1024 / 1024) * 100) / 100,
        heapUsedMb: Math.round((memory.heapUsed / 1024 / 1024) * 100) / 100,
        heapTotalMb: Math.round((memory.heapTotal / 1024 / 1024) * 100) / 100,
      },
    },
    checkDurationMs: totalDurationMs,
    recentLogs: includeLogs ? logger.getRecentLogs(25) : undefined,
  };

  logger.info(`Health check probe: ${overallStatus}`, { dbStatus, dbLatencyMs }, requestId);

  const response = NextResponse.json(healthData, {
    status: overallStatus === 'UNHEALTHY' ? 503 : 200,
  });

  // Attach X-Request-ID to response headers for end-to-end tracing (OBS-01)
  response.headers.set('x-request-id', requestId);
  response.headers.set('cache-control', 'no-store, no-cache, must-revalidate');

  return response;
}
