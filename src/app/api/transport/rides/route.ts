import { NextRequest, NextResponse } from 'next/server';
import { TransportService } from '@/server/services/transport.service';
import { RideStatus } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get('status') as RideStatus | null;
    const driverIdParam = searchParams.get('driverId') || undefined;

    const [summary, rides, drivers] = await Promise.all([
      TransportService.getTransportSummary(),
      TransportService.getRides({
        status: statusParam || undefined,
        driverId: driverIdParam,
      }),
      TransportService.getAvailableDrivers(),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        summary,
        rides,
        drivers,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Lỗi lấy danh sách chuyến xe';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
