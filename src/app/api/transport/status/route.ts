import { NextRequest, NextResponse } from 'next/server';
import { TransportService } from '@/server/services/transport.service';
import { authService } from '@/server/services/auth.service';
import { COOKIE_CONFIG } from '@/server/lib/auth';
import { requireRole } from '@/server/middleware/rbac';
import { AppError } from '@/server/core/errors/app-error';
import { db } from '@/server/lib/db';
import { RideStatus } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get(COOKIE_CONFIG.name)?.value;
    const session = token ? await authService.verifyToken(token) : null;

    // Strict RBAC: Only Driver, Dispatcher or Admin can update ride status
    const user = requireRole(session, 'DRIVER', 'DISPATCHER', 'ADMIN');

    const body = await request.json();
    const { rideId, status, latitude, longitude, notes } = body;

    if (!rideId || !status) {
      return NextResponse.json(
        { success: false, error: 'Thiếu rideId hoặc status' },
        { status: 400 }
      );
    }

    if (!Object.values(RideStatus).includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Trạng thái chuyển đổi không hợp lệ' },
        { status: 400 }
      );
    }

    // Driver Ownership Check: A Driver can ONLY update rides assigned to themselves
    if (user.role === 'DRIVER') {
      const existingRide = await db.transportRide.findUnique({
        where: { id: rideId },
        select: { driverId: true },
      });

      if (!existingRide) {
        throw new AppError('NOT_FOUND', 'Không tìm thấy chuyến xe.', 404);
      }

      if (existingRide.driverId !== user.id) {
        throw new AppError(
          'FORBIDDEN',
          'Bạn không có quyền cập nhật chuyến xe được phân công cho tài xế khác.',
          403
        );
      }
    }

    const updatedRide = await TransportService.updateRideStatus(rideId, status, {
      latitude,
      longitude,
      notes,
    });

    return NextResponse.json({
      success: true,
      message: `Đã cập nhật trạng thái chuyến sang ${status}`,
      data: updatedRide,
    });
  } catch (error: unknown) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, error: error.message, code: error.code },
        { status: error.statusCode }
      );
    }
    const message = error instanceof Error ? error.message : 'Lỗi cập nhật trạng thái chuyến xe';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
