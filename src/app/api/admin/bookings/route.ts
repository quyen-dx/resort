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

    const bookings = await db.booking.findMany({
      include: {
        roomType: { select: { name: true, code: true } },
        assignedRoom: { select: { roomNumber: true } },
        payments: {
          select: { id: true, amount: true, method: true, createdAt: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: bookings,
    });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ success: false, error: 'Lỗi tải danh sách đặt phòng' }, { status: 500 });
  }
}
