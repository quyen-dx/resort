import { NextRequest, NextResponse } from 'next/server';
import { authService } from '@/server/services/auth.service';
import { COOKIE_CONFIG } from '@/server/lib/auth';

export async function GET(req: NextRequest) {
  const token = req.cookies.get(COOKIE_CONFIG.name)?.value;

  if (!token) {
    return NextResponse.json(
      { error: 'Chưa đăng nhập.', user: null },
      { status: 401 }
    );
  }

  const session = await authService.verifyToken(token);
  if (!session) {
    return NextResponse.json(
      { error: 'Phiên làm việc đã hết hạn hoặc không hợp lệ.', user: null },
      { status: 401 }
    );
  }

  return NextResponse.json({
    success: true,
    user: session,
  });
}
