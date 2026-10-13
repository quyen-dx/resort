import { PrismaClient, Prisma } from '@prisma/client';
import { db } from '../lib/db';
import { AppError } from '../core/errors/app-error';
import { logger } from '../lib/logger';

export type PrismaTransaction = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

export interface NightlyAvailability {
  date: string;
  availableCount: number;
  totalCapacity: number;
  pricePerNight: number;
}

export interface AvailabilityResult {
  isAvailable: boolean;
  totalNights: number;
  totalAmount: number;
  nightlyBreakdown: NightlyAvailability[];
  bottleneckDate?: string;
}

export class InventoryService {
  /**
   * Helper: Calculates stay night dates (excluding check-out date)
   * Strictly conforms to BOOK-01
   */
  public calculateStayNights(checkInDateStr: string, checkOutDateStr: string): string[] {
    const checkIn = new Date(checkInDateStr);
    const checkOut = new Date(checkOutDateStr);

    if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
      throw new AppError('VALIDATION_ERROR', 'Định dạng ngày nhận/trả phòng không hợp lệ.', 400);
    }

    // Strip time to UTC midnight
    checkIn.setUTCHours(0, 0, 0, 0);
    checkOut.setUTCHours(0, 0, 0, 0);

    if (checkOut <= checkIn) {
      throw new AppError('VALIDATION_ERROR', 'Ngày trả phòng phải sau ngày nhận phòng ít nhất 1 đêm.', 400);
    }

    const nights: string[] = [];
    const current = new Date(checkIn);

    // Loop through each night until the day BEFORE check-out
    while (current < checkOut) {
      nights.push(current.toISOString().split('T')[0]);
      current.setUTCDate(current.getUTCDate() + 1);
    }

    return nights;
  }

  /**
   * Checks real-time availability across all requested nights (BOOK-01)
   */
  public async checkAvailability(
    roomTypeId: string,
    checkInDate: string,
    checkOutDate: string,
    quantity: number = 1
  ): Promise<AvailabilityResult> {
    if (quantity <= 0) {
      throw new AppError('VALIDATION_ERROR', 'Số lượng phòng đặt phải lớn hơn 0.', 400);
    }

    const nights = this.calculateStayNights(checkInDate, checkOutDate);
    const nightDates = nights.map((n) => new Date(n));

    // Fetch inventory records for all requested nights in a single query (PERF-03)
    const records = await db.nightlyInventory.findMany({
      where: {
        roomTypeId,
        date: { in: nightDates },
      },
      orderBy: { date: 'asc' },
    });

    const inventoryMap = new Map<string, (typeof records)[0]>();
    for (const rec of records) {
      const dateKey = rec.date.toISOString().split('T')[0];
      inventoryMap.set(dateKey, rec);
    }

    let isAvailable = true;
    let totalAmount = 0;
    let bottleneckDate: string | undefined;
    const nightlyBreakdown: NightlyAvailability[] = [];

    for (const night of nights) {
      const rec = inventoryMap.get(night);

      if (!rec || rec.availableCount < quantity) {
        isAvailable = false;
        if (!bottleneckDate) {
          bottleneckDate = night;
        }
      }

      const availableCount = rec ? rec.availableCount : 0;
      const pricePerNight = rec ? rec.pricePerNight : 0;
      totalAmount += pricePerNight * quantity;

      nightlyBreakdown.push({
        date: night,
        availableCount,
        totalCapacity: rec ? rec.totalCapacity : 0,
        pricePerNight,
      });
    }

    return {
      isAvailable,
      totalNights: nights.length,
      totalAmount,
      nightlyBreakdown,
      bottleneckDate,
    };
  }

  /**
   * Atomic Conditional Inventory Reservation Engine (BOOK-02, BOOK-03)
   * Principle: "First successful atomic commit wins"
   * Decrements inventory conditionally where availableCount >= quantity.
   * If any night fails, throws SOLD_OUT to trigger immediate transaction rollback.
   */
  public async reserveInventoryAtomic(
    tx: PrismaTransaction,
    roomTypeId: string,
    checkInDate: string,
    checkOutDate: string,
    quantity: number
  ): Promise<{ nights: string[]; totalAmount: number }> {
    const nights = this.calculateStayNights(checkInDate, checkOutDate);
    let totalAmount = 0;

    for (const night of nights) {
      const nightDate = new Date(night);

      // 1. Fetch current price for billing calculation
      const currentRec = await tx.nightlyInventory.findUnique({
        where: {
          roomTypeId_date: {
            roomTypeId,
            date: nightDate,
          },
        },
      });

      if (!currentRec) {
        logger.warn('Inventory record not configured for night', { roomTypeId, date: night });
        throw new AppError(
          'SOLD_OUT',
          `Hệ thống chưa mở bán phòng cho đêm ${night}. Vui lòng chọn ngày khác.`,
          409
        );
      }

      totalAmount += currentRec.pricePerNight * quantity;

      // 2. ATOMIC CONDITIONAL UPDATE (Row-level Lock)
      // Only decrements if availableCount >= quantity at commit time
      const updateResult = await tx.nightlyInventory.updateMany({
        where: {
          roomTypeId,
          date: nightDate,
          availableCount: { gte: quantity },
        },
        data: {
          availableCount: { decrement: quantity },
          reservedCount: { increment: quantity },
        },
      });

      if (updateResult.count === 0) {
        logger.info('Race condition detected: Room sold out during atomic reserve', {
          roomTypeId,
          date: night,
          requestedQuantity: quantity,
        });
        throw new AppError(
          'SOLD_OUT',
          `Rất tiếc! Loại phòng này vừa hết chỗ cho đêm ${night}. Giao dịch khác đã hoàn tất trước.`,
          409
        );
      }
    }

    return { nights, totalAmount };
  }

  /**
   * Atomic Inventory Release Engine (for cancellations & modifications - BOOK-06)
   */
  public async releaseInventoryAtomic(
    tx: PrismaTransaction,
    roomTypeId: string,
    checkInDate: string,
    checkOutDate: string,
    quantity: number
  ): Promise<void> {
    const nights = this.calculateStayNights(checkInDate, checkOutDate);

    for (const night of nights) {
      const nightDate = new Date(night);
      await tx.nightlyInventory.updateMany({
        where: {
          roomTypeId,
          date: nightDate,
        },
        data: {
          availableCount: { increment: quantity },
          reservedCount: { decrement: quantity },
        },
      });
    }
    logger.info('Inventory successfully released', { roomTypeId, nights: nights.length, quantity });
  }
}

export const inventoryService = new InventoryService();
