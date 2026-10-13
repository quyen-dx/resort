import { NextRequest, NextResponse } from 'next/server';
import { bookingService } from '@/server/services/booking.service';
import { authService } from '@/server/services/auth.service';
import { COOKIE_CONFIG } from '@/server/lib/auth';
import { AppError } from '@/server/core/errors/app-error';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const body = await req.json().catch(() => ({}));
    const reason = body.reason || 'Khách yêu cầu hủy phòng';

    const token = req.cookies.get(COOKIE_CONFIG.name)?.value;
    const sessionUser = token ? await authService.verifyToken(token) : null;

    const cancelledBooking = await bookingService.cancelBooking(code, sessionUser, reason);

    return NextResponse.json({
      success: true,
      message: 'Hủy đơn đặt phòng thành công. Tồn kho đã được hoàn trả.',
      data: cancelledBooking,
    });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode }
      );
    }
    return NextResponse.json(
      { error: 'Lỗi khi hủy đơn đặt phòng.', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
