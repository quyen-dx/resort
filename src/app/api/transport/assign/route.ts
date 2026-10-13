import { NextRequest, NextResponse } from 'next/server';
import { TransportService } from '@/server/services/transport.service';
import { authService } from '@/server/services/auth.service';
import { COOKIE_CONFIG } from '@/server/lib/auth';
import { requireRole } from '@/server/middleware/rbac';
import { AppError } from '@/server/core/errors/app-error';

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get(COOKIE_CONFIG.name)?.value;
    const session = token ? await authService.verifyToken(token) : null;

    // Strict RBAC: Only Dispatchers and Admins can assign drivers to rides (SEC-03)
    requireRole(session, 'DISPATCHER', 'ADMIN');

    const body = await request.json();
    const { rideId, driverId } = body;

    if (!rideId || !driverId) {
      return NextResponse.json(
        { success: false, error: 'Thiếu rideId hoặc driverId' },
        { status: 400 }
      );
    }

    const updatedRide = await TransportService.assignDriver(rideId, driverId);

    return NextResponse.json({
      success: true,
      message: 'Phân tài xế thành công',
      data: updatedRide,
    });
  } catch (error: unknown) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, error: error.message, code: error.code },
        { status: error.statusCode }
      );
    }
    const message = error instanceof Error ? error.message : 'Lỗi phân tài xế';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
