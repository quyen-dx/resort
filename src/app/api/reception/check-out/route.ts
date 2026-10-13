import { NextRequest, NextResponse } from 'next/server';
import { receptionService } from '@/server/services/reception.service';
import { authService } from '@/server/services/auth.service';
import { COOKIE_CONFIG } from '@/server/lib/auth';
import { AppError } from '@/server/core/errors/app-error';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { bookingId, actualCheckOutDate, adjustedAmountDue, notes } = body;

    if (!bookingId || !actualCheckOutDate) {
      return NextResponse.json(
        { error: 'Vui lòng cung cấp bookingId và ngày check-out thực tế.' },
        { status: 400 }
      );
    }

    const token = req.cookies.get(COOKIE_CONFIG.name)?.value;
    const sessionUser = token ? await authService.verifyToken(token) : null;

    const receptionist = sessionUser || {
      id: 'rec-desk-system',
      email: 'reception@annamresort.vn',
      fullName: 'Trần Thị Lễ Tân',
      role: 'RECEPTIONIST' as const,
    };

    const updated = await receptionService.processCheckOut(
      bookingId,
      actualCheckOutDate,
      adjustedAmountDue ? parseInt(adjustedAmountDue, 10) : null,
      receptionist,
      notes
    );

    return NextResponse.json({
      success: true,
      message: 'Hoàn tất thủ tục Check-out thành công!',
      data: updated,
    });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode }
      );
    }
    return NextResponse.json(
      { error: 'Lỗi thực hiện Check-out.', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
