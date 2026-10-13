import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/lib/db';
import { authService } from '@/server/services/auth.service';
import { COOKIE_CONFIG } from '@/server/lib/auth';
import { requireRole } from '@/server/middleware/rbac';
import { AppError } from '@/server/core/errors/app-error';

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get(COOKIE_CONFIG.name)?.value;
    const session = token ? await authService.verifyToken(token) : null;
    requireRole(session, 'ADMIN');

    const customers = await db.user.findMany({
      where: { role: 'CUSTOMER' },
      select: {
        id: true,
        email: true,
        fullName: true,
        phoneNumber: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: { bookings: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: customers,
    });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ success: false, error: 'Lỗi tải danh sách khách hàng' }, { status: 500 });
  }
}
