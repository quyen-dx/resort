import { db } from '../lib/db';

export interface RoomTypeDTO {
  id: string;
  code: string;
  name: string;
  nameEn?: string | null;
  description: string;
  maxGuests: number;
  totalInventory: number;
  basePricePerNight: number;
  images: string[];
  amenities: string[];
}

export const FALLBACK_ROOM_TYPES: RoomTypeDTO[] = [
  {
    id: 'rt-villa-ocean',
    code: 'VILLA_OCEAN',
    name: 'Beachfront Pool Villa',
    nameEn: 'Beachfront Pool Villa',
    description: 'Biệt thự hướng biển với hồ bơi vô cực biệt lập, đón bình minh trực diện trên bãi cát trắng riêng tư. Nội thất gỗ tếch thủ công kết hợp bồn tắm đá cẩm thạch lộ thiên.',
    maxGuests: 4,
    totalInventory: 5,
    basePricePerNight: 6500000, // 6.500.000 VND
    images: [
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800&q=80',
    ],
    amenities: ['Hồ bơi riêng vô cực', 'Bãi biển riêng tư', 'Bữa sáng phục vụ tại villa', 'Quản gia riêng 24/7', 'Đón tiễn sân bay VIP'],
  },
  {
    id: 'rt-deluxe-ocean',
    code: 'DELUXE_OCEAN',
    name: 'Ocean View Deluxe',
    nameEn: 'Ocean View Deluxe Room',
    description: 'Phòng Deluxe ban công rộng mở ôm trọn vịnh biển An Nam, đón làn gió biển trong lành. Thiết kế tối giản tinh tế với giường King-size và khu vực thưởng trà hoàng hôn.',
    maxGuests: 2,
    totalInventory: 10,
    basePricePerNight: 3200000, // 3.200.000 VND
    images: [
      'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80',
    ],
    amenities: ['Ban công ngắm biển', 'Giường King-size êm ái', 'Bồn tắm nằm cao cấp', 'Trà chiều chào đón', 'Minibar miễn phí'],
  },
  {
    id: 'rt-suite-garden',
    code: 'SUITE_GARDEN',
    name: 'Garden Heritage Suite',
    nameEn: 'Garden Heritage Suite',
    description: 'Không gian tĩnh lặng nép mình giữa khu vườn nhiệt đới xanh mướt, kiến trúc mang âm hưởng cung đình Á Đông cổ điển, thư thái tuyệt đối cho tâm hồn.',
    maxGuests: 3,
    totalInventory: 8,
    basePricePerNight: 2400000, // 2.400.000 VND
    images: [
      'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=800&q=80',
    ],
    amenities: ['Vườn nhiệt đới bao quanh', 'Phòng khách biệt lập', 'Liệu trình Spa chân 30p', 'Không gian thiền tịnh', 'Xe đạp dạo resort'],
  },
];

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
