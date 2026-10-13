import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

describe('ĐẶT PHÒNG & IDEMPOTENCY: Chống Double-Click & Retry Lặp (DB-02, BOOK-04)', () => {
  class MockIdempotentBookingStore {
    constructor() {
      this.bookingsByIdempotencyKey = new Map();
      this.inventoryCount = 5;
      this.createdBookings = [];
    }

    async processBookingRequest(request, idempotencyKey) {
      // 1. Idempotency Check (DB-02, BOOK-04)
      if (idempotencyKey && this.bookingsByIdempotencyKey.has(idempotencyKey)) {
        return {
          booking: this.bookingsByIdempotencyKey.get(idempotencyKey),
          isDuplicate: true,
        };
      }

      // 2. Inventory check & decrement
      if (this.inventoryCount < request.rooms) {
        throw new Error('SOLD_OUT: Không đủ tồn kho');
      }

      this.inventoryCount -= request.rooms;

      // 3. Create booking
      const newBooking = {
        id: `book-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        bookingCode: `AN-202610-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
        customerName: request.name,
        rooms: request.rooms,
        idempotencyKey,
        status: 'CONFIRMED',
      };

      this.createdBookings.push(newBooking);

      if (idempotencyKey) {
        this.bookingsByIdempotencyKey.set(idempotencyKey, newBooking);
      }

      return {
        booking: newBooking,
        isDuplicate: false,
      };
    }
  }

  test('Gửi nhiều request cùng Idempotency-Key chỉ tạo đúng 1 booking và không trừ trùng tồn kho', async () => {
    const store = new MockIdempotentBookingStore();
    const IDEMPOTENCY_KEY = 'client-uuid-txn-999';

    const payload = { name: 'Nguyễn Văn Khách', rooms: 2 };

    // Request 1: Lần nhấn đầu tiên
    const res1 = await store.processBookingRequest(payload, IDEMPOTENCY_KEY);
    assert.equal(res1.isDuplicate, false);
    assert.equal(store.inventoryCount, 3, 'Tồn kho ban đầu 5 trừ 2 còn 3');

    // Request 2: Double-click ngay lập tức (cùng key)
    const res2 = await store.processBookingRequest(payload, IDEMPOTENCY_KEY);
    assert.equal(res2.isDuplicate, true);
    assert.equal(res2.booking.bookingCode, res1.booking.bookingCode, 'Phải trả về cùng mã đặt phòng');

    // Request 3: Retry do timeout mạng (cùng key)
    const res3 = await store.processBookingRequest(payload, IDEMPOTENCY_KEY);
    assert.equal(res3.isDuplicate, true);
    assert.equal(res3.booking.id, res1.booking.id);

    // KIỂM CHỨNG BẢO TOÀN TỒN KHO & ĐƠN HÀNG:
    assert.equal(store.createdBookings.length, 1, 'Chính xác chỉ có 1 đơn đặt phòng duy nhất được tạo');
    assert.equal(store.inventoryCount, 3, 'Tồn kho tuyệt đối không bị trừ trùng (vẫn là 3, không phải -1)');
  });
});

describe('MÁY TRẠNG THÁI & HỦY PHÒNG: State Machine & Inventory Recovery (BOOK-05, BOOK-06)', () => {
  const VALID_TRANSITIONS = {
    CONFIRMED: ['CHECKED_IN', 'CANCELLED', 'NO_SHOW'],
    CHECKED_IN: ['CHECKED_OUT'],
    CHECKED_OUT: [],
    CANCELLED: [],
    NO_SHOW: [],
  };

  function transitionStatus(currentStatus, nextStatus) {
    const allowed = VALID_TRANSITIONS[currentStatus] || [];
    if (!allowed.includes(nextStatus)) {
      throw new Error(`CONFLICT: Không thể chuyển từ trạng thái ${currentStatus} sang ${nextStatus}`);
    }
    return nextStatus;
  }

  test('Chuyển trạng thái hợp lệ: CONFIRMED -> CHECKED_IN -> CHECKED_OUT', () => {
    let status = 'CONFIRMED';
    status = transitionStatus(status, 'CHECKED_IN');
    assert.equal(status, 'CHECKED_IN');

    status = transitionStatus(status, 'CHECKED_OUT');
    assert.equal(status, 'CHECKED_OUT');
  });

  test('Chuyển trạng thái hợp lệ: CONFIRMED -> CANCELLED', () => {
    const status = transitionStatus('CONFIRMED', 'CANCELLED');
    assert.equal(status, 'CANCELLED');
  });

  test('Chặn hành động bất hợp lệ: Không thể hủy đơn đã CHECKED_OUT hoặc đã CANCELLED', () => {
    assert.throws(() => transitionStatus('CHECKED_OUT', 'CANCELLED'), /CONFLICT/);
    assert.throws(() => transitionStatus('CANCELLED', 'CHECKED_IN'), /CONFLICT/);
  });

  test('Race Condition: Hủy phòng song song với Đặt phòng mới bảo đảm tính toàn vẹn tồn kho (BOOK-06)', async () => {
    let inventory = 0; // Đang hết phòng

    // Giả lập 2 transaction chạy đồng thời:
    // Tx 1: Khách A hủy 1 phòng (trả tồn kho +1)
    // Tx 2: Khách B cố gắng đặt 1 phòng
    const cancelPromise = new Promise((resolve) => {
      setTimeout(() => {
        inventory += 1; // Hoàn trả tồn kho
        resolve('CANCELLED_SUCCESS');
      }, 10);
    });

    const bookPromise = new Promise((resolve) => {
      setTimeout(() => {
        if (inventory >= 1) {
          inventory -= 1;
          resolve('BOOK_SUCCESS');
        } else {
          resolve('SOLD_OUT');
        }
      }, 25);
    });

    const [cancelRes, bookRes] = await Promise.all([cancelPromise, bookPromise]);
    assert.equal(cancelRes, 'CANCELLED_SUCCESS');
    assert.equal(bookRes, 'BOOK_SUCCESS');
    assert.equal(inventory, 0, 'Tồn kho không bị âm hoặc rò rỉ sau khi giải phóng và mua lại');
  });
});
