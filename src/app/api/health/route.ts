import { NextResponse } from 'next/server';
import { logger } from '@/server/lib/logger';

export async function GET() {
  const uptime = process.uptime();
  const timestamp = new Date().toISOString();

  logger.info('Health check ping received', { uptime, status: 'healthy' });

  return NextResponse.json({
    status: 'ok',
    timestamp,
    uptimeSeconds: Math.floor(uptime),
    service: 'resort-management-ecosystem',
    version: '1.0.0',
  });
}
