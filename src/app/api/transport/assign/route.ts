import { NextRequest, NextResponse } from 'next/server';
import { TransportService } from '@/server/services/transport.service';

export async function POST(request: NextRequest) {
  try {
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
    const message = error instanceof Error ? error.message : 'Lỗi phân tài xế';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
