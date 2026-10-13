import { NextRequest, NextResponse } from 'next/server';
import { bookingService } from '@/server/services/booking.service';
import { authService } from '@/server/services/auth.service';
import { COOKIE_CONFIG } from '@/server/lib/auth';
import { AppError } from '@/server/core/errors/app-error';
import { rateLimiter, RATE_LIMIT_RULES, getClientIp } from '@/server/lib/rate-limiter';
import { logger } from '@/server/lib/logger';

export async function POST(req: NextRequest) {
  const clientIp = getClientIp(req.headers);
  const identifier = `booking-create:${clientIp}`;

  // 1. Kiểm tra Rate Limiting chống spam đơn đặt phòng (SEC-06)
  const rateLimit = rateLimiter.check(identifier, RATE_LIMIT_RULES.CREATE_BOOKING);
  if (!rateLimit.allowed) {
    logger.warn('Rate limit exceeded on booking creation', { clientIp, resetSeconds: rateLimit.resetSeconds });
    return NextResponse.json(
      {
        error: `Quý khách đang thao tác quá nhanh. Vui lòng thử lại sau ${rateLimit.resetSeconds} giây.`,
        code: 'TOO_MANY_REQUESTS',
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(rateLimit.resetSeconds),
          'X-RateLimit-Limit': String(RATE_LIMIT_RULES.CREATE_BOOKING.maxRequests),
          'X-RateLimit-Remaining': '0',
        },
      }
    );
  }

  try {
    const idempotencyKey = req.headers.get('Idempotency-Key') ?? undefined;
    const body = await req.json();

    // Check optional authenticated user session
    const token = req.cookies.get(COOKIE_CONFIG.name)?.value;
    const sessionUser = token ? await authService.verifyToken(token) : null;

    const result = await bookingService.createBooking(
      {
        ...body,
        idempotencyKey: idempotencyKey || body.idempotencyKey,
      },
      sessionUser
    );

    return NextResponse.json(
      {
        success: true,
        data: result.booking,
        isDuplicate: result.isDuplicate,
      },
      { status: result.isDuplicate ? 200 : 201 }
    );
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode }
      );
    }
    return NextResponse.json(
      { error: 'Lỗi máy chủ khi tạo đơn đặt phòng.', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
