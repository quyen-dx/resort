import { NextRequest, NextResponse } from 'next/server';
import { inventoryService } from '@/server/services/inventory.service';
import { AppError } from '@/server/core/errors/app-error';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const roomTypeId = searchParams.get('roomTypeId');
    const checkIn = searchParams.get('checkIn');
    const checkOut = searchParams.get('checkOut');
    const quantityStr = searchParams.get('quantity') || '1';

    if (!roomTypeId || !checkIn || !checkOut) {
      return NextResponse.json(
        { error: 'Vui lòng cung cấp đầy đủ roomTypeId, checkIn (YYYY-MM-DD), checkOut (YYYY-MM-DD).' },
        { status: 400 }
      );
    }

    const quantity = parseInt(quantityStr, 10);
    if (isNaN(quantity) || quantity <= 0) {
      return NextResponse.json(
        { error: 'Số lượng phòng không hợp lệ.' },
        { status: 400 }
      );
    }

    const availability = await inventoryService.checkAvailability(
      roomTypeId,
      checkIn,
      checkOut,
      quantity
    );

    return NextResponse.json({
      success: true,
      data: availability,
    });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode }
      );
    }
    return NextResponse.json(
      { error: 'Lỗi kiểm tra tính khả dụng tồn kho.', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
