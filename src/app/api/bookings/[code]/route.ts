import { NextRequest, NextResponse } from 'next/server';
import { bookingService } from '@/server/services/booking.service';
import { authService } from '@/server/services/auth.service';
import { COOKIE_CONFIG } from '@/server/lib/auth';
import { AppError } from '@/server/core/errors/app-error';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const token = req.cookies.get(COOKIE_CONFIG.name)?.value;
    const sessionUser = token ? await authService.verifyToken(token) : null;

    const booking = await bookingService.getBookingByCode(code, sessionUser);

    return NextResponse.json({
      success: true,
      data: booking,
    });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode }
      );
    }
    return NextResponse.json(
      { error: 'Lỗi truy xuất đơn đặt phòng.', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
