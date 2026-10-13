import { PrismaClient } from '@prisma/client';
import { logger } from './logger';

// Prevent multiple instances of Prisma Client in development (Next.js hot reload)
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? [
            { emit: 'event', level: 'query' },
            { emit: 'stdout', level: 'error' },
            { emit: 'stdout', level: 'warn' },
          ]
        : ['error'],
  });

if (process.env.NODE_ENV === 'development') {
  globalForPrisma.prisma = db;
}

// Log slow queries in development if event emitter is available
if (process.env.NODE_ENV === 'development' && typeof (db as any)?.$on === 'function') {
  try {
    (db as any).$on('query', (e: { query: string; duration: number }) => {
      if (e.duration > 100) {
        logger.warn('Slow database query detected (>100ms)', {
          durationMs: e.duration,
          query: e.query,
        });
      }
    });
  } catch {
    // Event listener not supported in current environment
  }
}

