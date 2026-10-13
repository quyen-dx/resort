import { NextRequest, NextResponse } from 'next/server';
import { receptionService } from '@/server/services/reception.service';
import { authService } from '@/server/services/auth.service';
import { COOKIE_CONFIG } from '@/server/lib/auth';
import { requireRole } from '@/server/middleware/rbac';
import { AppError } from '@/server/core/errors/app-error';

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get(COOKIE_CONFIG.name)?.value;
    const sessionUser = token ? await authService.verifyToken(token) : null;

    // Strict Server-Side RBAC (SEC-03): Only RECEPTIONIST and ADMIN can access front desk data
    requireRole(sessionUser, 'RECEPTIONIST', 'ADMIN');

    const bookings = await receptionService.getDeskBookings();

    return NextResponse.json({
      success: true,
      data: bookings,
    });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode }
      );
    }
    return NextResponse.json(
      { error: 'Lỗi tải danh sách bàn lễ tân.', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
