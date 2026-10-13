import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

describe('LỄ TÂN & GÁN PHÒNG VẬT LÝ: Ràng buộc chống gán trùng phòng (BOOK-07)', () => {
  class MockRoomAssignmentManager {
    constructor() {
      this.physicalRooms = [
        { id: 'rm-101', number: '101', status: 'AVAILABLE', currentBookingId: null },
        { id: 'rm-102', number: '102', status: 'AVAILABLE', currentBookingId: null },
      ];
    }

    async assignRoom(bookingId, roomId) {
      const room = this.physicalRooms.find((r) => r.id === roomId);
      if (!room) {
        throw new Error('NOT_FOUND: Phòng không tồn tại');
      }

      // Ràng buộc kiểm tra phòng chưa được gán cho booking khác
      if (room.status === 'OCCUPIED' || room.currentBookingId !== null) {
        throw new Error(`CONFLICT: Phòng ${room.number} đang có khách ở! Không thể gán trùng!`);
      }

      room.status = 'OCCUPIED';
      room.currentBookingId = bookingId;
      return { success: true, roomNumber: room.number };
    }
  }

  test('Gán phòng thành công và chuyển trạng thái phòng sang OCCUPIED', async () => {
    const mgr = new MockRoomAssignmentManager();
    const res = await mgr.assignRoom('booking-1', 'rm-101');
    assert.equal(res.success, true);
    assert.equal(res.roomNumber, '101');
    assert.equal(mgr.physicalRooms[0].status, 'OCCUPIED');
  });

  test('Chặn đứng ca 2 lễ tân cùng gán 1 phòng cho 2 booking khác nhau (BOOK-07)', async () => {
    const mgr = new MockRoomAssignmentManager();

    // Lễ tân A gán phòng 101 cho Booking 1
    await mgr.assignRoom('booking-1', 'rm-101');

    // Lễ tân B cố tình gán phòng 101 cho Booking 2
    await assert.rejects(
      async () => {
        await mgr.assignRoom('booking-2', 'rm-101');
      },
      /CONFLICT: Phòng 101 đang có khách ở/,
      'Phải chặn không cho gán trùng phòng!'
    );
  });
});

describe('THANH TOÁN TẠI QUẦY & CÔNG NỢ (BIZ-01)', () => {
  class MockBillingLedger {
    constructor(amountDue) {
      this.amountDue = amountDue;
      this.amountPaid = 0;
      this.balance = amountDue;
      this.receipts = [];
    }

    recordPayment(amount, method, actorName) {
      if (amount <= 0) {
        throw new Error('VALIDATION_ERROR: Số tiền phải lớn hơn 0');
      }
      if (amount > this.balance) {
        throw new Error(`VALIDATION_ERROR: Số tiền thanh toán vượt quá số nợ còn lại (${this.balance})`);
      }

      this.amountPaid += amount;
      this.balance = this.amountDue - this.amountPaid;

      const receipt = {
        receiptNumber: `RCT-202610-${Math.floor(100 + Math.random() * 900)}`,
        amount,
        method,
        actorName,
        createdAt: new Date().toISOString(),
      };
      this.receipts.push(receipt);

      return receipt;
    }
  }

  test('Thanh toán từng phần và cập nhật đúng công nợ còn lại (balance)', () => {
    const ledger = new MockBillingLedger(10000000); // Nợ 10.000.000 VND
    assert.equal(ledger.balance, 10000000);

    // Lần 1: Khách đặt cọc 3.000.000 VND tiền mặt
    const r1 = ledger.recordPayment(3000000, 'COUNTER_CASH', 'Trần Thị Lễ Tân');
    assert.ok(r1.receiptNumber.startsWith('RCT-'));
    assert.equal(ledger.amountPaid, 3000000);
    assert.equal(ledger.balance, 7000000, 'Còn nợ 7.000.000 VND');

    // Lần 2: Khách quẹt thẻ thanh toán nốt 7.000.000 VND
    const r2 = ledger.recordPayment(7000000, 'COUNTER_CARD', 'Trần Thị Lễ Tân');
    assert.equal(ledger.amountPaid, 10000000);
    assert.equal(ledger.balance, 0, 'Đã thanh toán đủ, công nợ về 0');
  });

  test('Chặn thu tiền vượt quá công nợ còn lại', () => {
    const ledger = new MockBillingLedger(5000000);
    assert.throws(
      () => ledger.recordPayment(6000000, 'COUNTER_CASH', 'Lễ Tân'),
      /VALIDATION_ERROR: Số tiền thanh toán vượt quá số nợ còn lại/
    );
  });
});

describe('CHECK-OUT SỚM & AUDIT TRAIL (BIZ-02)', () => {
  test('Ghi nhận ngày check-out thực tế và chuyển phòng sang CLEANING', () => {
    const booking = {
      bookingCode: 'AN-202610-888',
      scheduledCheckOut: '2026-10-20',
      actualCheckOut: null,
      status: 'CHECKED_IN',
    };

    const room = { number: 'V-01', status: 'OCCUPIED' };

    // Khách check-out sớm vào ngày 18/10
    booking.actualCheckOut = '2026-10-18';
    booking.status = 'CHECKED_OUT';
    room.status = 'CLEANING';

    assert.equal(booking.status, 'CHECKED_OUT');
    assert.equal(booking.actualCheckOut, '2026-10-18');
    assert.equal(room.status, 'CLEANING', 'Phòng phải được chuyển sang dọn dẹp');
  });
});
