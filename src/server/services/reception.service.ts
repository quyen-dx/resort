import { db } from '../lib/db';
import { PaymentMethod, BookingStatus, RoomStatus } from '@prisma/client';
import { AppError } from '../core/errors/app-error';
import { UserSession } from '../core/types/user';
import { requireRole } from '../middleware/rbac';
import { inventoryService } from './inventory.service';
import { logger } from '../lib/logger';

export interface CounterPaymentInput {
  bookingId: string;
  amount: number;
  method: PaymentMethod;
  notes?: string;
}

export class ReceptionService {
  /**
   * Helper: Generates luxury receipt number e.g. "RCT-202610-741"
   */
  private generateReceiptNumber(): string {
    const date = new Date();
    const ym = `${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}`;
    const rand = Math.floor(100 + Math.random() * 900);
    return `RCT-${ym}-${rand}`;
  }

  /**
   * Fetch check-in and check-out candidates for receptionist desk
   */
  public async getDeskBookings() {
    try {
      const bookings = await db.booking.findMany({
        where: {
          status: { in: [BookingStatus.CONFIRMED, BookingStatus.CHECKED_IN] },
        },
        include: {
          roomType: {
            include: { physicalRooms: true },
          },
          assignedRoom: true,
          payments: {
            include: { actor: { select: { fullName: true } } },
          },
        },
        orderBy: { checkInDate: 'asc' },
      });
      return bookings;
    } catch {
      // Return empty if database not connected yet
      return [];
    }
  }

  /**
   * Record Counter Payment at Resort Desk (BIZ-01)
   */
  public async recordCounterPayment(
    input: CounterPaymentInput,
    receptionist: UserSession
  ) {
    requireRole(receptionist, 'RECEPTIONIST', 'ADMIN');

    if (input.amount <= 0) {
      throw new AppError('VALIDATION_ERROR', 'Số tiền thanh toán phải lớn hơn 0.', 400);
    }

    const booking = await db.booking.findUnique({
      where: { id: input.bookingId },
    });

    if (!booking) {
      throw new AppError('NOT_FOUND', 'Không tìm thấy đơn đặt phòng.', 404);
    }

    if (input.amount > booking.balance) {
      throw new AppError(
        'VALIDATION_ERROR',
        `Số tiền thu (${input.amount.toLocaleString()} ₫) vượt quá số tiền còn nợ (${booking.balance.toLocaleString()} ₫).`,
        400
      );
    }

    const receiptNumber = this.generateReceiptNumber();

    return db.$transaction(async (tx) => {
      // 1. Create PaymentTransaction
      const payment = await tx.paymentTransaction.create({
        data: {
          receiptNumber,
          bookingId: booking.id,
          amount: input.amount,
          method: input.method,
          actorId: receptionist.id,
          notes: input.notes,
        },
      });

      // 2. Update booking balance
      const newPaid = booking.amountPaid + input.amount;
      const newBalance = booking.amountDue - newPaid;

      const updatedBooking = await tx.booking.update({
        where: { id: booking.id },
        data: {
          amountPaid: newPaid,
          balance: newBalance,
        },
      });

      // 3. Audit logging (SEC-07, BIZ-01)
      await tx.auditLog.create({
        data: {
          actorId: receptionist.id,
          actorRole: receptionist.role,
          action: 'RECORD_COUNTER_PAYMENT',
          resource: 'PAYMENT',
          resourceId: payment.id,
          newValues: {
            receiptNumber,
            amount: input.amount,
            method: input.method,
            newBalance,
          },
        },
      });

      logger.info('Counter payment recorded successfully', {
        receiptNumber,
        bookingCode: booking.bookingCode,
        amount: input.amount,
        receptionist: receptionist.fullName,
      });

      return { payment, booking: updatedBooking };
    });
  }

  /**
   * Handle Check-out (Standard or Early Check-out with audit - BIZ-02)
   */
  public async processCheckOut(
    bookingId: string,
    actualCheckOutDateStr: string,
    adjustedAmountDue: number | null,
    receptionist: UserSession,
    notes?: string
  ) {
    requireRole(receptionist, 'RECEPTIONIST', 'ADMIN');

    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      include: { assignedRoom: true },
    });

    if (!booking) {
      throw new AppError('NOT_FOUND', 'Không tìm thấy đơn đặt phòng.', 404);
    }

    if (booking.status !== BookingStatus.CHECKED_IN) {
      throw new AppError(
        'CONFLICT',
        `Chỉ có thể làm thủ tục check-out cho đơn đang lưu trú (CHECKED_IN). Trạng thái hiện tại: ${booking.status}`,
        409
      );
    }

    const actualCheckOut = new Date(actualCheckOutDateStr);
    const scheduledCheckOut = new Date(booking.checkOutDate);
    const isEarlyCheckOut = actualCheckOut < scheduledCheckOut;

    return db.$transaction(async (tx) => {
      // 1. Calculate final bill
      const finalAmountDue = adjustedAmountDue !== null ? adjustedAmountDue : booking.amountDue;
      const finalBalance = finalAmountDue - booking.amountPaid;

      // 2. If early check-out, release inventory for unused nights (BIZ-02)
      if (isEarlyCheckOut) {
        try {
          await inventoryService.releaseInventoryAtomic(
            tx,
            booking.roomTypeId,
            actualCheckOut.toISOString().split('T')[0],
            scheduledCheckOut.toISOString().split('T')[0],
            booking.numberOfRooms
          );
        } catch {
          // If inventory release encounters non-fatal log
        }
      }

      // 3. Update booking status
      const updatedBooking = await tx.booking.update({
        where: { id: booking.id },
        data: {
          status: BookingStatus.CHECKED_OUT,
          actualCheckOutDate: actualCheckOut,
          amountDue: finalAmountDue,
          balance: finalBalance,
          notes: notes ? `${booking.notes || ''} | Check-out: ${notes}` : booking.notes,
        },
      });

      // 4. Release physical room to CLEANING status
      if (booking.assignedRoomId) {
        await tx.room.update({
          where: { id: booking.assignedRoomId },
          data: { status: RoomStatus.CLEANING },
        });
      }

      // 5. Audit Log (BIZ-02)
      await tx.auditLog.create({
        data: {
          actorId: receptionist.id,
          actorRole: receptionist.role,
          action: isEarlyCheckOut ? 'EARLY_CHECK_OUT' : 'STANDARD_CHECK_OUT',
          resource: 'BOOKING',
          resourceId: booking.id,
          oldValues: {
            scheduledCheckOut: booking.checkOutDate,
            initialAmountDue: booking.amountDue,
          },
          newValues: {
            actualCheckOutDate: actualCheckOut,
            finalAmountDue,
            finalBalance,
            isEarlyCheckOut,
          },
        },
      });

      return updatedBooking;
    });
  }
}

export const receptionService = new ReceptionService();
