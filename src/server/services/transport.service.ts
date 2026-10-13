import { db } from '@/server/lib/db';
import { RideStatus, UserRole } from '@prisma/client';

export const TRANSPORT_SANDBOX_RATE_PER_KM = 4000; // 4,000 VND/km mock sandbox rate (AGENTS.md Decision Rule 5)

export interface RideEstimate {
  distanceKm: number;
  unitPricePerKm: number;
  totalPrice: number;
  estimatedDurationMinutes: number;
  currency: 'VND';
  provider: string;
  isSandbox: boolean;
}

export interface RideRequestPayload {
  bookingId: string;
  passengerName: string;
  passengerPhone: string;
  flightNumber?: string;
  pickupLocation: string;
  dropoffLocation: string;
  distanceKm: number;
  pickupTime: string;
}

/**
 * Interface cho đơn vị vận tải (Adapter Pattern - INT-01)
 * Giúp dễ dàng tráo đổi giữa Sandbox Adapter và Real Provider Adapter (VinFast/Xanh SM) sau này
 */
export interface ITransportAdapter {
  getProviderName(): string;
  isSandbox(): boolean;
  calculateEstimate(distanceKm: number): RideEstimate;
  simulateGpsCoordinate(currentLat?: number, currentLng?: number): { latitude: number; longitude: number };
}

/**
 * Mock Provider Adapter Sandbox (INT-01, Decision Rule 5)
 */
export class MockTransportSandboxAdapter implements ITransportAdapter {
  private readonly providerName = 'Mock Sandbox Electric Shuttle (VinFast/Xanh SM Prototype)';
  private readonly unitPricePerKm = TRANSPORT_SANDBOX_RATE_PER_KM;

  getProviderName(): string {
    return this.providerName;
  }

  isSandbox(): boolean {
    return true;
  }

  calculateEstimate(distanceKm: number): RideEstimate {
    const validDistance = Math.max(1, distanceKm);
    const totalPrice = Math.round(validDistance * this.unitPricePerKm);
    // Giả lập tốc độ trung bình 45 km/h
    const estimatedDurationMinutes = Math.round((validDistance / 45) * 60);

    return {
      distanceKm: validDistance,
      unitPricePerKm: this.unitPricePerKm,
      totalPrice,
      estimatedDurationMinutes,
      currency: 'VND',
      provider: this.providerName,
      isSandbox: true,
    };
  }

  /**
   * Giả lập dịch chuyển tọa độ GPS từ Sân bay Cam Ranh về Resort (Khu Bãi Dài)
   */
  simulateGpsCoordinate(currentLat?: number, currentLng?: number): { latitude: number; longitude: number } {
    // Tọa độ sân bay Cam Ranh: 11.9982, 109.2194
    // Tọa độ Resort Bãi Dài: 12.0850, 109.1950
    if (!currentLat || !currentLng) {
      return { latitude: 11.9982, longitude: 109.2194 };
    }

    // Nhích tọa độ thêm 0.005 dọc theo lộ trình
    const nextLat = Math.min(12.0850, currentLat + 0.0087);
    const nextLng = Math.max(109.1950, currentLng - 0.0024);

    return {
      latitude: parseFloat(nextLat.toFixed(6)),
      longitude: parseFloat(nextLng.toFixed(6)),
    };
  }
}

// Khởi tạo Singleton Adapter
export const transportAdapter = new MockTransportSandboxAdapter();

// -----------------------------------------------------------------------------
// TRANSPORT SERVICE (MAP-01, INT-01)
// -----------------------------------------------------------------------------

export class TransportService {
  /**
   * Lấy tổng quan các chuyến xe theo từng trạng thái
   */
  static async getTransportSummary() {
    const [allRides, drivers] = await Promise.all([
      db.transportRide.findMany({
        select: { status: true },
      }),
      db.user.findMany({
        where: { role: UserRole.DRIVER },
        select: { id: true, fullName: true, phoneNumber: true },
      }),
    ]);

    const summary = {
      total: allRides.length,
      requested: allRides.filter((r) => r.status === RideStatus.REQUESTED).length,
      assigned: allRides.filter((r) => r.status === RideStatus.ASSIGNED).length,
      inTransit: allRides.filter((r) => r.status === RideStatus.IN_TRANSIT).length,
      completed: allRides.filter((r) => r.status === RideStatus.COMPLETED).length,
      cancelled: allRides.filter((r) => r.status === RideStatus.CANCELLED).length,
      totalDrivers: drivers.length,
    };

    return summary;
  }

  /**
   * Lấy danh sách toàn bộ chuyến xe với bộ lọc
   */
  static async getRides(filter?: { status?: RideStatus; driverId?: string }) {
    return db.transportRide.findMany({
      where: {
        ...(filter?.status ? { status: filter.status } : {}),
        ...(filter?.driverId ? { driverId: filter.driverId } : {}),
      },
      include: {
        booking: {
          select: {
            bookingCode: true,
            checkInDate: true,
            checkOutDate: true,
            customerName: true,
            customerPhone: true,
            roomType: { select: { name: true } },
          },
        },
        driver: {
          select: {
            id: true,
            fullName: true,
            phoneNumber: true,
            email: true,
          },
        },
      },
      orderBy: { pickupTime: 'asc' },
    });
  }

  /**
   * Lấy danh sách tài xế sẵn sàng nhận chuyến (Role: DRIVER)
   */
  static async getAvailableDrivers() {
    return db.user.findMany({
      where: { role: UserRole.DRIVER },
      select: {
        id: true,
        fullName: true,
        phoneNumber: true,
        email: true,
      },
      orderBy: { fullName: 'asc' },
    });
  }

  /**
   * Điều phối viên phân tài xế cho chuyến xe (MAP-01)
   */
  static async assignDriver(rideId: string, driverId: string) {
    const ride = await db.transportRide.findUnique({
      where: { id: rideId },
    });

    if (!ride) {
      throw new Error('Chuyến xe không tồn tại');
    }

    if (ride.status === RideStatus.COMPLETED || ride.status === RideStatus.CANCELLED) {
      throw new Error(`Không thể phân tài xế cho chuyến đã ${ride.status}`);
    }

    const driver = await db.user.findUnique({
      where: { id: driverId },
    });

    if (!driver || driver.role !== UserRole.DRIVER) {
      throw new Error('Tài xế được chọn không hợp lệ hoặc không có quyền DRIVER');
    }

    return db.transportRide.update({
      where: { id: rideId },
      data: {
        driverId,
        status: RideStatus.ASSIGNED,
        // Khởi tạo tọa độ xuất phát ban đầu tại sân bay
        lastLatitude: 11.998200,
        lastLongitude: 109.219400,
      },
      include: {
        driver: { select: { fullName: true, phoneNumber: true } },
        booking: true,
      },
    });
  }

  /**
   * Tài xế cập nhật trạng thái chuyến đi & tọa độ GPS (MAP-01)
   */
  static async updateRideStatus(
    rideId: string,
    newStatus: RideStatus,
    options?: { latitude?: number; longitude?: number; notes?: string }
  ) {
    const ride = await db.transportRide.findUnique({
      where: { id: rideId },
    });

    if (!ride) {
      throw new Error('Chuyến xe không tồn tại');
    }

    // Kiểm tra quy tắc chuyển đổi trạng thái hợp lệ
    const validTransitions: Record<RideStatus, RideStatus[]> = {
      [RideStatus.REQUESTED]: [RideStatus.ASSIGNED, RideStatus.CANCELLED],
      [RideStatus.ASSIGNED]: [RideStatus.IN_TRANSIT, RideStatus.CANCELLED],
      [RideStatus.IN_TRANSIT]: [RideStatus.COMPLETED, RideStatus.CANCELLED],
      [RideStatus.COMPLETED]: [],
      [RideStatus.CANCELLED]: [],
    };

    if (!validTransitions[ride.status].includes(newStatus)) {
      throw new Error(
        `Không thể chuyển đổi trạng thái chuyến từ ${ride.status} sang ${newStatus}`
      );
    }

    return db.transportRide.update({
      where: { id: rideId },
      data: {
        status: newStatus,
        completedTime: newStatus === RideStatus.COMPLETED ? new Date() : undefined,
        ...(options?.latitude !== undefined ? { lastLatitude: options.latitude } : {}),
        ...(options?.longitude !== undefined ? { lastLongitude: options.longitude } : {}),
        ...(options?.notes ? { notes: options.notes } : {}),
      },
      include: {
        driver: { select: { fullName: true, phoneNumber: true } },
        booking: true,
      },
    });
  }

  /**
   * Giả lập đẩy tọa độ GPS xe đang di chuyển (Simulation Sandbox)
   */
  static async simulateVehiclePing(rideId: string) {
    const ride = await db.transportRide.findUnique({
      where: { id: rideId },
    });

    if (!ride) {
      throw new Error('Chuyến xe không tồn tại');
    }

    const currentLat = ride.lastLatitude ? Number(ride.lastLatitude) : undefined;
    const currentLng = ride.lastLongitude ? Number(ride.lastLongitude) : undefined;

    const nextCoord = transportAdapter.simulateGpsCoordinate(currentLat, currentLng);

    return db.transportRide.update({
      where: { id: rideId },
      data: {
        lastLatitude: nextCoord.latitude,
        lastLongitude: nextCoord.longitude,
      },
    });
  }
}
