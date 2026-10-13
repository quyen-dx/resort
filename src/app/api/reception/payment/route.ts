import { NextRequest, NextResponse } from 'next/server';
import { receptionService } from '@/server/services/reception.service';
import { authService } from '@/server/services/auth.service';
import { COOKIE_CONFIG } from '@/server/lib/auth';
import { AppError } from '@/server/core/errors/app-error';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { bookingId, amount, method, notes } = body;

    if (!bookingId || !amount || !method) {
      return NextResponse.json(
        { error: 'Vui lòng cung cấp đầy đủ thông tin: bookingId, amount, method.' },
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

    const result = await receptionService.recordCounterPayment(
      {
        bookingId,
        amount: parseInt(amount, 10),
        method,
        notes,
      },
      receptionist
    );

    return NextResponse.json({
      success: true,
      message: 'Ghi nhận thanh toán tại quầy thành công!',
      data: result,
    });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode }
      );
    }
    return NextResponse.json(
      { error: 'Lỗi ghi nhận thanh toán quầy.', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
