import { NextRequest, NextResponse } from 'next/server';
import { authService } from '@/server/services/auth.service';
import { COOKIE_CONFIG } from '@/server/lib/auth';
import { AppError } from '@/server/core/errors/app-error';

export async function POST(req: NextRequest) {
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
