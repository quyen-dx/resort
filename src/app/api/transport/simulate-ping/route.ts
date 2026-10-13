import { NextRequest, NextResponse } from 'next/server';
import { TransportService } from '@/server/services/transport.service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { rideId } = body;

    if (!rideId) {
      return NextResponse.json(
        { success: false, error: 'Thiếu rideId' },
        { status: 400 }
      );
    }

    const updatedRide = await TransportService.simulateVehiclePing(rideId);

    return NextResponse.json({
      success: true,
      message: 'Đã cập nhật tọa độ GPS giả lập',
      data: {
        latitude: updatedRide.lastLatitude,
        longitude: updatedRide.lastLongitude,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Lỗi ping tọa độ';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
