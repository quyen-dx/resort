import { NextRequest, NextResponse } from 'next/server';
import { authService } from '@/server/services/auth.service';
import { COOKIE_CONFIG } from '@/server/lib/auth';
import { AppError } from '@/server/core/errors/app-error';
import { rateLimiter, RATE_LIMIT_RULES, getClientIp } from '@/server/lib/rate-limiter';
import { logger } from '@/server/lib/logger';

export async function POST(req: NextRequest) {
  const clientIp = getClientIp(req.headers);
  const identifier = `auth-login:${clientIp}`;

  // 1. Kiểm tra Rate Limiting chống Brute-force (SEC-06)
  const rateLimit = rateLimiter.check(identifier, RATE_LIMIT_RULES.AUTH_LOGIN);
  if (!rateLimit.allowed) {
    logger.warn('Rate limit exceeded on login attempt', { clientIp, resetSeconds: rateLimit.resetSeconds });
    return NextResponse.json(
      {
        error: `Quá nhiều lần thử đăng nhập. Vui lòng thử lại sau ${rateLimit.resetSeconds} giây.`,
        code: 'TOO_MANY_REQUESTS',
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(rateLimit.resetSeconds),
          'X-RateLimit-Limit': String(RATE_LIMIT_RULES.AUTH_LOGIN.maxRequests),
          'X-RateLimit-Remaining': '0',
        },
      }
    );
  }

  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Vui lòng cung cấp đầy đủ email và mật khẩu.' },
        { status: 400 }
      );
    }

    const { session, token } = await authService.login(email, password);

    // Xóa đếm rate limit khi đăng nhập thành công
    rateLimiter.reset(identifier);

    const response = NextResponse.json({
      success: true,
      user: session,
    });

    // Set secure HttpOnly cookie (SEC-02)
    response.cookies.set({
      name: COOKIE_CONFIG.name,
      value: token,
      ...COOKIE_CONFIG.options,
    });

    return response;
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode }
      );
    }
    return NextResponse.json(
      { error: 'Lỗi xác thực máy chủ.', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
