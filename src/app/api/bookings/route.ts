import { NextRequest, NextResponse } from 'next/server';
import { bookingService } from '@/server/services/booking.service';
import { authService } from '@/server/services/auth.service';
import { COOKIE_CONFIG } from '@/server/lib/auth';
import { AppError } from '@/server/core/errors/app-error';

export async function POST(req: NextRequest) {
  try {
    const idempotencyKey = req.headers.get('Idempotency-Key') ?? undefined;
    const body = await req.json();

    // Check optional authenticated user session
    const token = req.cookies.get(COOKIE_CONFIG.name)?.value;
    const sessionUser = token ? await authService.verifyToken(token) : null;

    const result = await bookingService.createBooking(
      {
        ...body,
        idempotencyKey: idempotencyKey || body.idempotencyKey,
      },
      sessionUser
    );

    return NextResponse.json(
      {
        success: true,
        data: result.booking,
        isDuplicate: result.isDuplicate,
      },
      { status: result.isDuplicate ? 200 : 201 }
    );
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode }
      );
    }
    return NextResponse.json(
      { error: 'Lỗi máy chủ khi tạo đơn đặt phòng.', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
