import { NextResponse } from 'next/server';
import { roomService } from '@/server/services/room.service';

export async function GET() {
  const rooms = await roomService.getAllRoomTypes();
  return NextResponse.json({
    success: true,
    data: rooms,
  });
}
