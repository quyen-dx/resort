import { PrismaClient, UserRole, RoomStatus, BookingStatus, PaymentMethod } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Bắt đầu khởi tạo dữ liệu mẫu (Seeding Database) ---');

  // Mật khẩu mặc định: '123456'
  const defaultPasswordHash = '$2b$10$GFVLU92fqv04A3oqGr7ote4X0r7YJKyTRVCaxRCHv6Li/45MwSUty';

  const users = [
    // Standard accounts (@resort.com)
    {
      email: 'admin@resort.com',
      fullName: 'Nguyễn Văn Quản Trị',
      phoneNumber: '0901000001',
      role: UserRole.ADMIN,
      passwordHash: defaultPasswordHash,
    },
    {
      email: 'reception@resort.com',
      fullName: 'Trần Thị Lễ Tân',
      phoneNumber: '0901000002',
      role: UserRole.RECEPTIONIST,
      passwordHash: defaultPasswordHash,
    },
    {
      email: 'dispatch@resort.com',
      fullName: 'Lê Hoàng Điều Phối',
      phoneNumber: '0901000003',
      role: UserRole.DISPATCHER,
      passwordHash: defaultPasswordHash,
    },
    {
      email: 'driver@resort.com',
      fullName: 'Phạm Minh Tài Xế',
      phoneNumber: '0901000004',
      role: UserRole.DRIVER,
      passwordHash: defaultPasswordHash,
    },
    {
      email: 'guest@resort.com',
      fullName: 'Đặng Tuấn Khách',
      phoneNumber: '0912345678',
      role: UserRole.CUSTOMER,
      passwordHash: defaultPasswordHash,
    },
    // Domain aliases (@annamresort.vn)
    {
      email: 'admin@annamresort.vn',
      fullName: 'Nguyễn Văn Quản Trị',
      phoneNumber: '0901000001',
      role: UserRole.ADMIN,
      passwordHash: defaultPasswordHash,
    },
    {
      email: 'reception@annamresort.vn',
      fullName: 'Trần Thị Lễ Tân',
      phoneNumber: '0901000002',
      role: UserRole.RECEPTIONIST,
      passwordHash: defaultPasswordHash,
    },
    {
      email: 'dispatcher@annamresort.vn',
      fullName: 'Lê Hoàng Điều Phối',
      phoneNumber: '0901000003',
      role: UserRole.DISPATCHER,
      passwordHash: defaultPasswordHash,
    },
    {
      email: 'driver@annamresort.vn',
      fullName: 'Phạm Minh Tài Xế',
      phoneNumber: '0901000004',
      role: UserRole.DRIVER,
      passwordHash: defaultPasswordHash,
    },
    {
      email: 'khachhang@gmail.com',
      fullName: 'Đặng Tuấn Khách',
      phoneNumber: '0912345678',
      role: UserRole.CUSTOMER,
      passwordHash: defaultPasswordHash,
    },
  ];


  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: u,
    });
  }
  console.log(`✓ Đã tạo/kiểm tra 5 tài khoản nhân viên & khách hàng mẫu.`);

  // 2. Khởi tạo Loại phòng (Room Types)
  const roomTypesData = [
    {
      code: 'VILLA_OCEAN',
      name: 'Beachfront Pool Villa',
      nameEn: 'Beachfront Pool Villa',
      description: 'Biệt thự hướng biển với hồ bơi riêng biệt lập, đón bình minh trực diện, nội thất gỗ tếch cao cấp.',
      maxGuests: 4,
      totalInventory: 5,
      basePricePerNight: 6500000, // 6.500.000 VND
      amenities: ['Hồ bơi riêng', 'Bãi biển riêng', 'Bồn tắm đá cẩm thạch', 'Bữa sáng phục vụ tại villa'],
      images: ['/images/rooms/villa-ocean-1.jpg', '/images/rooms/villa-ocean-2.jpg'],
    },
    {
      code: 'DELUXE_OCEAN',
      name: 'Ocean View Deluxe',
      nameEn: 'Ocean View Deluxe Room',
      description: 'Phòng Deluxe ban công rộng mở ôm trọn vịnh biển An Nam, đón gió biển tự nhiên.',
      maxGuests: 2,
      totalInventory: 10,
      basePricePerNight: 3200000, // 3.200.000 VND
      amenities: ['Ban công hướng biển', 'Giường King-size', 'Smart TV 65-inch', 'Minibar miễn phí'],
      images: ['/images/rooms/deluxe-ocean-1.jpg'],
    },
    {
      code: 'SUITE_GARDEN',
      name: 'Garden Heritage Suite',
      nameEn: 'Garden Heritage Suite',
      description: 'Không gian tĩnh lặng giữa khu vườn nhiệt đới xanh mướt, kiến trúc mang âm hưởng cung đình Huế.',
      maxGuests: 3,
      totalInventory: 8,
      basePricePerNight: 2400000, // 2.400.000 VND
      amenities: ['Vườn hoa riêng', 'Phòng khách biệt lập', 'Trà chiều miễn phí hàng ngày'],
      images: ['/images/rooms/suite-garden-1.jpg'],
    },
  ];

  const createdRoomTypes = [];
  for (const rt of roomTypesData) {
    const created = await prisma.roomType.upsert({
      where: { code: rt.code },
      update: {},
      create: rt,
    });
    createdRoomTypes.push(created);
  }
  console.log(`✓ Đã tạo 3 loại phòng cao cấp.`);

  // 3. Khởi tạo phòng vật lý cho từng loại phòng (BOOK-07)
  for (const rt of createdRoomTypes) {
    for (let i = 1; i <= rt.totalInventory; i++) {
      const roomNum = rt.code === 'VILLA_OCEAN' ? `V-${i.toString().padStart(2, '0')}` : `${rt.code === 'DELUXE_OCEAN' ? '1' : '2'}${i.toString().padStart(2, '0')}`;
      await prisma.room.upsert({
        where: { roomNumber: roomNum },
        update: {},
        create: {
          roomNumber: roomNum,
          roomTypeId: rt.id,
          status: RoomStatus.AVAILABLE,
          floor: rt.code === 'VILLA_OCEAN' ? 1 : rt.code === 'DELUXE_OCEAN' ? 1 : 2,
        },
      });
    }
  }
  console.log(`✓ Đã tạo danh sách phòng vật lý.`);

  // 4. Khởi tạo Tồn kho theo từng đêm cho 60 ngày tới (BOOK-01, BOOK-02)
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  for (const rt of createdRoomTypes) {
    for (let dayOffset = 0; dayOffset < 60; dayOffset++) {
      const targetDate = new Date(today);
      targetDate.setUTCDate(today.getUTCDate() + dayOffset);

      await prisma.nightlyInventory.upsert({
        where: {
          roomTypeId_date: {
            roomTypeId: rt.id,
            date: targetDate,
          },
        },
        update: {},
        create: {
          roomTypeId: rt.id,
          date: targetDate,
          totalCapacity: rt.totalInventory,
          availableCount: rt.totalInventory,
          reservedCount: 0,
          pricePerNight: rt.basePricePerNight,
        },
      });
    }
  }
  console.log(`✓ Đã khởi tạo 60 ngày tồn kho (Nightly Inventory) cho tất cả loại phòng.`);

  console.log('--- Hoàn tất Seeding thành công! ---');
}

main()
  .catch((e) => {
    console.error('Lỗi seed database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
