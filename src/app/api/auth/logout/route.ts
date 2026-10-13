import { NextResponse } from 'next/server';
import { COOKIE_CONFIG } from '@/server/lib/auth';

export async function POST() {
  const response = NextResponse.json({
    success: true,
    message: 'Đăng xuất thành công.',
  });

  // Clear session cookie
  response.cookies.set({
    name: COOKIE_CONFIG.name,
    value: '',
    ...COOKIE_CONFIG.options,
    maxAge: 0,
  });

  return response;
}
