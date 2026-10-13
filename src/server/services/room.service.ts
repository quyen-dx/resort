import { db } from '../lib/db';

import { RoomTypeDTO, FALLBACK_ROOM_TYPES } from '@/shared/types/room';
export type { RoomTypeDTO };
export { FALLBACK_ROOM_TYPES };


export class RoomService {
  public async getAllRoomTypes(): Promise<RoomTypeDTO[]> {
    try {
      const roomTypes = await db.roomType.findMany({
        where: { isActive: true },
        orderBy: { basePricePerNight: 'desc' },
      });
      if (roomTypes.length > 0) {
        return roomTypes;
      }
    } catch {
      // Fallback to high-fidelity resort catalog if database is not migrated locally
    }
    return FALLBACK_ROOM_TYPES;
  }

  public async getRoomTypeById(idOrCode: string): Promise<RoomTypeDTO | null> {
    try {
      const roomType = await db.roomType.findFirst({
        where: {
          OR: [{ id: idOrCode }, { code: idOrCode }],
          isActive: true,
        },
      });
      if (roomType) return roomType;
    } catch {
      // Ignore
    }
    return FALLBACK_ROOM_TYPES.find((r) => r.id === idOrCode || r.code === idOrCode) || null;
  }
}

export const roomService = new RoomService();
