import { NextRequest, NextResponse } from 'next/server';
import { TransportService } from '@/server/services/transport.service';
import { RideStatus } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
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
    const message = error instanceof Error ? error.message : 'Lỗi cập nhật trạng thái chuyến xe';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
