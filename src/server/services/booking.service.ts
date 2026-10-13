import { db } from '../lib/db';
import { inventoryService } from './inventory.service';
import { BookingStatus, UserRole } from '@prisma/client';
import { AppError } from '../core/errors/app-error';
import { assertOwnership, requireRole } from '../middleware/rbac';
import { UserSession } from '../core/types/user';
import { logger } from '../lib/logger';

export interface CreateBookingInput {
  roomTypeId: string;
  checkInDate: string;  // YYYY-MM-DD
  checkOutDate: string; // YYYY-MM-DD
  numberOfRooms: number;
  numberOfGuests: number;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  notes?: string;
  idempotencyKey?: string;
  // Optional airport transport (INT-01)
  airportTransport?: {
    flightNumber?: string;
    pickupLocation: string;
    dropoffLocation: string;
    distanceKm: number;
    pickupTime: string;
  };
}

export class BookingService {
  /**
   * Helper: Generates unique luxury booking code e.g. "AN-202610-8A3F"
   */
  private generateBookingCode(): string {
    const date = new Date();
    const yearMonth = `${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}`;
    const randomHex = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `AN-${yearMonth}-${randomHex}`;
  }

  /**
   * Create Booking with Idempotency Protection (DB-02, BOOK-04, BOOK-08)
   */
  public async createBooking(
    input: CreateBookingInput,
    userSession?: UserSession | null
  ) {
    const { idempotencyKey } = input;

    // 1. Idempotency Check: Return existing booking if key was already processed (BOOK-04)
    if (idempotencyKey) {
      const existing = await db.booking.findUnique({
        where: { idempotencyKey },
        include: { roomType: true, transport: true },
      });

      if (existing) {
        logger.info('Idempotency match: returning previously processed booking', {
          idempotencyKey,
          bookingCode: existing.bookingCode,
        });
        return {
          booking: existing,
          isDuplicate: true,
        };
      }
    }

    // 2. Validate basic input
    if (!input.customerName || !input.customerPhone || !input.customerEmail) {
      throw new AppError('VALIDATION_ERROR', 'Vui lòng cung cấp đầy đủ họ tên, số điện thoại và email.', 400);
    }

    if (input.numberOfRooms <= 0 || input.numberOfGuests <= 0) {
      throw new AppError('VALIDATION_ERROR', 'Số lượng phòng và số lượng khách phải lớn hơn 0.', 400);
    }

    const checkIn = new Date(input.checkInDate);
    const checkOut = new Date(input.checkOutDate);
    const bookingCode = this.generateBookingCode();

    // 3. ATOMIC TRANSACTION: Inventory reservation + Booking record + Transport creation
    const createdBooking = await db.$transaction(async (tx) => {
      // Step A: Atomic conditional inventory decrement ("First commit wins")
      const { nights, totalAmount } = await inventoryService.reserveInventoryAtomic(
        tx,
        input.roomTypeId,
        input.checkInDate,
        input.checkOutDate,
        input.numberOfRooms
      );

      // Step B: Calculate transport fee if requested (INT-01 mock rate: 4,000 VND/km)
      let transportTotal = 0;
      if (input.airportTransport) {
        const ratePerKm = 4000;
        transportTotal = Math.round(input.airportTransport.distanceKm * ratePerKm);
      }

      const totalBill = totalAmount + transportTotal;

      // Step C: Create Booking record in database
      const booking = await tx.booking.create({
        data: {
          bookingCode,
          customerId: userSession ? userSession.id : null,
          customerName: input.customerName.trim(),
          customerPhone: input.customerPhone.trim(),
          customerEmail: input.customerEmail.toLowerCase().trim(),
          roomTypeId: input.roomTypeId,
          checkInDate: checkIn,
          checkOutDate: checkOut,
          numberOfRooms: input.numberOfRooms,
          numberOfGuests: input.numberOfGuests,
          totalNights: nights.length,
          amountDue: totalBill,
          amountPaid: 0,
          balance: totalBill,
          status: BookingStatus.CONFIRMED,
          idempotencyKey: idempotencyKey ?? null,
          notes: input.notes,
        },
        include: { roomType: true },
      });

      // Step D: Create Transport ride record if requested
      if (input.airportTransport) {
        await tx.transportRide.create({
          data: {
            rideCode: `TR-${bookingCode.replace('AN-', '')}`,
            bookingId: booking.id,
            passengerName: input.customerName,
            passengerPhone: input.customerPhone,
            flightNumber: input.airportTransport.flightNumber,
            pickupLocation: input.airportTransport.pickupLocation,
            dropoffLocation: input.airportTransport.dropoffLocation,
            distanceKm: input.airportTransport.distanceKm,
            unitPricePerKm: 4000,
            totalPrice: transportTotal,
            pickupTime: new Date(input.airportTransport.pickupTime),
            status: 'REQUESTED',
          },
        });
      }

      // Step E: Audit logging (SEC-07)
      await tx.auditLog.create({
        data: {
          actorId: userSession ? userSession.id : null,
          actorRole: userSession ? userSession.role : 'GUEST',
          action: 'CREATE_BOOKING',
          resource: 'BOOKING',
          resourceId: booking.id,
          newValues: {
            bookingCode: booking.bookingCode,
            amountDue: totalBill,
            numberOfRooms: input.numberOfRooms,
            totalNights: nights.length,
          },
        },
      });

      return booking;
    });

    logger.info('Booking successfully confirmed and committed', {
      bookingCode: createdBooking.bookingCode,
      amountDue: createdBooking.amountDue,
    });

    return {
      booking: createdBooking,
      isDuplicate: false,
    };
  }

  /**
   * Get Booking Details with Anti-IDOR validation (SEC-04)
   */
  public async getBookingByCode(bookingCode: string, sessionUser?: UserSession | null) {
    const booking = await db.booking.findUnique({
      where: { bookingCode },
      include: {
        roomType: true,
        assignedRoom: true,
        payments: true,
        transport: true,
      },
    });

    if (!booking) {
      throw new AppError('NOT_FOUND', 'Không tìm thấy thông tin đặt phòng.', 404);
    }

    // If booking is tied to a user account, enforce strict ownership (SEC-04)
    if (booking.customerId) {
      if (!sessionUser) {
        throw new AppError(
          'UNAUTHORIZED',
          'Vui lòng đăng nhập để xem thông tin đặt phòng của tài khoản này.',
          401
        );
      }
      assertOwnership(sessionUser, booking.customerId, ['ADMIN', 'RECEPTIONIST']);
    }

    return booking;

  }

  /**
   * Cancel Booking with atomic inventory restoration (BOOK-06)
   */
  public async cancelBooking(
    bookingCode: string,
    sessionUser: UserSession | null,
    reason: string = 'Khách yêu cầu hủy'
  ) {
    const booking = await this.getBookingByCode(bookingCode, sessionUser);

    // State machine check: Can only cancel CONFIRMED bookings
    if (booking.status !== BookingStatus.CONFIRMED) {
      throw new AppError(
        'CONFLICT',
        `Không thể hủy đơn đặt phòng ở trạng thái ${booking.status}. Chỉ có thể hủy đơn CONFIRMED.`,
        409
      );
    }

    // Atomic transaction: Status update + Inventory release + Audit
    const cancelledBooking = await db.$transaction(async (tx) => {
      // 1. Release inventory
      await inventoryService.releaseInventoryAtomic(
        tx,
        booking.roomTypeId,
        booking.checkInDate.toISOString().split('T')[0],
        booking.checkOutDate.toISOString().split('T')[0],
        booking.numberOfRooms
      );

      // 2. Update status
      const updated = await tx.booking.update({
        where: { id: booking.id },
        data: {
          status: BookingStatus.CANCELLED,
          notes: booking.notes ? `${booking.notes} | Lý do hủy: ${reason}` : `Lý do hủy: ${reason}`,
        },
      });

      // 3. Cancel transport if attached
      if (booking.transport) {
        await tx.transportRide.update({
          where: { id: booking.transport.id },
          data: { status: 'CANCELLED' },
        });
      }

      // 4. Audit
      await tx.auditLog.create({
        data: {
          actorId: sessionUser ? sessionUser.id : null,
          actorRole: sessionUser ? sessionUser.role : 'CUSTOMER',
          action: 'CANCEL_BOOKING',
          resource: 'BOOKING',
          resourceId: booking.id,
          newValues: { reason, status: BookingStatus.CANCELLED },
        },
      });

      return updated;
    });

    logger.info('Booking cancelled and inventory returned to pool', { bookingCode });
    return cancelledBooking;
  }

  /**
   * Check-in and Assign Physical Room (Receptionist counter operation - BOOK-07)
   */
  public async checkIn(
    bookingCode: string,
    assignedRoomId: string,
    receptionistUser: UserSession
  ) {
    requireRole(receptionistUser, 'RECEPTIONIST', 'ADMIN');

    const booking = await this.getBookingByCode(bookingCode);

    if (booking.status !== BookingStatus.CONFIRMED) {
      throw new AppError('CONFLICT', `Chỉ có thể check-in đơn đặt phòng có trạng thái CONFIRMED (Hiện tại: ${booking.status}).`, 409);
    }

    return db.$transaction(async (tx) => {
      // 1. Verify physical room belongs to matching room type and is not assigned for overlapping dates
      const physicalRoom = await tx.room.findUnique({
        where: { id: assignedRoomId },
      });

      if (!physicalRoom) {
        throw new AppError('NOT_FOUND', 'Số phòng vật lý không tồn tại.', 404);
      }

      if (physicalRoom.roomTypeId !== booking.roomTypeId) {
        throw new AppError('VALIDATION_ERROR', 'Số phòng được gán không khớp với loại phòng khách đã đặt.', 400);
      }

      // Check conflict: No other checked-in booking assigned to this physical room
      const conflictingBooking = await tx.booking.findFirst({
        where: {
          assignedRoomId: physicalRoom.id,
          status: BookingStatus.CHECKED_IN,
          id: { not: booking.id },
        },
      });

      if (conflictingBooking) {
        throw new AppError(
          'CONFLICT',
          `Phòng ${physicalRoom.roomNumber} hiện đang có khách ở (Booking ${conflictingBooking.bookingCode}). Không thể gán trùng!`,
          409
        );
      }

      // 2. Update booking and room status
      const updatedBooking = await tx.booking.update({
        where: { id: booking.id },
        data: {
          assignedRoomId: physicalRoom.id,
          status: BookingStatus.CHECKED_IN,
        },
      });

      await tx.room.update({
        where: { id: physicalRoom.id },
        data: { status: 'OCCUPIED' },
      });

      // 3. Audit
      await tx.auditLog.create({
        data: {
          actorId: receptionistUser.id,
          actorRole: receptionistUser.role,
          action: 'CHECK_IN_AND_ASSIGN_ROOM',
          resource: 'BOOKING',
          resourceId: booking.id,
          newValues: { assignedRoomNumber: physicalRoom.roomNumber },
        },
      });

      return updatedBooking;
    });
  }
}

export const bookingService = new BookingService();
