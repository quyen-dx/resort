import { NextRequest, NextResponse } from 'next/server';
import { bookingService } from '@/server/services/booking.service';
import { authService } from '@/server/services/auth.service';
import { COOKIE_CONFIG } from '@/server/lib/auth';
import { AppError } from '@/server/core/errors/app-error';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { bookingCode, assignedRoomId } = body;

    if (!bookingCode || !assignedRoomId) {
      return NextResponse.json(
        { error: 'Vui lòng cung cấp mã đặt phòng và số phòng vật lý được gán.' },
        { status: 400 }
      );
    }

    const token = req.cookies.get(COOKIE_CONFIG.name)?.value;
    const sessionUser = token ? await authService.verifyToken(token) : null;

    // Default to receptionist session if logged in or mock desk session
    const receptionist = sessionUser || {
      id: 'rec-desk-system',
      email: 'reception@annamresort.vn',
      fullName: 'Trần Thị Lễ Tân',
      role: 'RECEPTIONIST' as const,
    };

    const updatedBooking = await bookingService.checkIn(
      bookingCode,
      assignedRoomId,
      receptionist
    );

    return NextResponse.json({
      success: true,
      message: 'Làm thủ tục Check-in và gán phòng thành công!',
      data: updatedBooking,
    });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode }
      );
    }
    return NextResponse.json(
      { error: 'Lỗi thực hiện Check-in.', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
