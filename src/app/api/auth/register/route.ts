import { NextRequest, NextResponse } from 'next/server';
import { authService } from '@/server/services/auth.service';
import { COOKIE_CONFIG } from '@/server/lib/auth';
import { AppError } from '@/server/core/errors/app-error';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fullName, email, password, phoneNumber } = body;

    if (!fullName || !email || !password) {
      return NextResponse.json(
        { error: 'Vui lòng điền đầy đủ: Họ tên, Email và Mật khẩu.' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Mật khẩu phải có tối thiểu 6 ký tự.' },
        { status: 400 }
      );
    }

    const { session, token } = await authService.registerCustomer({
      fullName,
      email,
      password,
      phoneNumber,
    });

    const response = NextResponse.json({
      success: true,
      message: 'Đăng ký tài khoản thành công!',
      user: session,
    });

    // Set secure HttpOnly session cookie
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
      { error: 'Lỗi đăng ký tài khoản.', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
