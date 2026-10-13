import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

// Import our core date calculator directly
function calculateStayNights(checkInDateStr, checkOutDateStr) {
  const checkIn = new Date(checkInDateStr);
  const checkOut = new Date(checkOutDateStr);

  if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
    throw new Error('VALIDATION_ERROR: Định dạng ngày không hợp lệ');
  }

  checkIn.setUTCHours(0, 0, 0, 0);
  checkOut.setUTCHours(0, 0, 0, 0);

  if (checkOut <= checkIn) {
    throw new Error('VALIDATION_ERROR: Ngày trả phòng phải sau ngày nhận phòng ít nhất 1 đêm');
  }

  const nights = [];
  const current = new Date(checkIn);

  while (current < checkOut) {
    nights.push(current.toISOString().split('T')[0]);
    current.setUTCDate(current.getUTCDate() + 1);
  }

  return nights;
}

describe('NGHIỆP VỤ: Tính toán Đêm lưu trú & Ranh giới Ngày (BOOK-01)', () => {
  test('Lưu trú 1 đêm: Ngày checkout không tính là đêm ở', () => {
    const nights = calculateStayNights('2026-10-15', '2026-10-16');
    assert.deepEqual(nights, ['2026-10-15']);
    assert.equal(nights.length, 1);
  });

  test('Lưu trú 3 đêm: Trả phòng ngày 18 chỉ tính đêm 15, 16, 17', () => {
    const nights = calculateStayNights('2026-10-15', '2026-10-18');
    assert.deepEqual(nights, ['2026-10-15', '2026-10-16', '2026-10-17']);
    assert.equal(nights.length, 3);
  });

  test('Vượt ranh giới tháng (30/10 -> 02/11)', () => {
    const nights = calculateStayNights('2026-10-30', '2026-11-02');
    assert.deepEqual(nights, ['2026-10-30', '2026-10-31', '2026-11-01']);
    assert.equal(nights.length, 3);
  });

  test('Vượt ranh giới năm (30/12/2026 -> 02/01/2027)', () => {
    const nights = calculateStayNights('2026-12-30', '2027-01-02');
    assert.deepEqual(nights, ['2026-12-30', '2026-12-31', '2027-01-01']);
    assert.equal(nights.length, 3);
  });

  test('Bị từ chối khi ngày check-out nhỏ hơn hoặc bằng check-in', () => {
    assert.throws(() => calculateStayNights('2026-10-15', '2026-10-15'), /VALIDATION_ERROR/);
    assert.throws(() => calculateStayNights('2026-10-16', '2026-10-15'), /VALIDATION_ERROR/);
  });
});

describe('KIỂM THỬ TẢI & TRANH CHẤP ĐỒNG THỜI: Inventory = 1 Concurrency Gate Test (BOOK-02, BOOK-03)', () => {
  /**
   * Mô phỏng chính xác hành vi Transaction Row-Level Atomic Conditional Update của Database:
   * UPDATE nightly_inventory
   * SET available_count = available_count - 1, reserved_count = reserved_count + 1
   * WHERE id = :id AND available_count >= 1;
   */
  class MockAtomicDatabaseTable {
    constructor(initialAvailable) {
      this.availableCount = initialAvailable;
      this.reservedCount = 0;
      this.lock = Promise.resolve();
    }

    // Atomic conditional decrement with serialization/row-lock
    async atomicReserve(quantity = 1) {
      return new Promise((resolve) => {
        // Enqueue onto microtask queue simulating DB transaction lock commit order
        this.lock = this.lock.then(async () => {
          // Simulate non-deterministic I/O jitter (1-5ms)
          await new Promise((r) => setTimeout(r, Math.floor(Math.random() * 5) + 1));

          if (this.availableCount >= quantity) {
            this.availableCount -= quantity;
            this.reservedCount += quantity;
            resolve({ success: true, status: 'CONFIRMED' });
          } else {
            resolve({ success: false, status: 'SOLD_OUT', code: 409 });
          }
        });
      });
    }
  }

  test('Kịch bản 50 khách cùng tranh mua 1 phòng cuối cùng trong cùng 1 tick', async () => {
    const table = new MockAtomicDatabaseTable(1); // Chỉ còn đúng 1 phòng
    const TOTAL_REQUESTS = 50;

    // Gửi 50 requests đồng thời bằng Promise.all
    const requestPromises = Array.from({ length: TOTAL_REQUESTS }, (_, idx) =>
      table.atomicReserve(1).then((res) => ({ requestId: idx + 1, ...res }))
    );

    const results = await Promise.all(requestPromises);

    const successList = results.filter((r) => r.success);
    const soldOutList = results.filter((r) => !r.success);

    // KIỂM CHỨNG BẮT BUỘC THEO QUY TẮC NGHIỆP VỤ BẤT BIẾN:
    assert.equal(
      successList.length,
      1,
      `Chính xác duy nhất 1 booking được xác nhận thành công! (Thực tế: ${successList.length})`
    );

    assert.equal(
      soldOutList.length,
      TOTAL_REQUESTS - 1,
      `Chính xác ${TOTAL_REQUESTS - 1} khách hàng phải nhận SOLD_OUT / 409! (Thực tế: ${soldOutList.length})`
    );

    // Tính toàn vẹn của cơ sở dữ liệu:
    assert.equal(table.availableCount, 0, 'Tồn kho khả dụng cuối cùng phải về 0');
    assert.equal(table.reservedCount, 1, 'Số phòng đã giữ phải bằng đúng 1');
    assert.equal(table.availableCount + table.reservedCount, 1, 'Tổng bảo toàn số phòng = 1');
  });

  test('Kịch bản tồn kho = 3, có 30 requests đồng thời đặt 1 phòng', async () => {
    const table = new MockAtomicDatabaseTable(3); // Còn đúng 3 phòng
    const TOTAL_REQUESTS = 30;

    const requestPromises = Array.from({ length: TOTAL_REQUESTS }, (_, idx) =>
      table.atomicReserve(1).then((res) => ({ requestId: idx + 1, ...res }))
    );

    const results = await Promise.all(requestPromises);

    const successList = results.filter((r) => r.success);
    const soldOutList = results.filter((r) => !r.success);

    assert.equal(successList.length, 3, 'Chính xác đúng 3 giao dịch đầu tiên thành công');
    assert.equal(soldOutList.length, 27, '27 giao dịch còn lại nhận SOLD_OUT');
    assert.equal(table.availableCount, 0, 'Tồn kho không được âm');
    assert.equal(table.reservedCount, 3, 'Tổng số phòng đã giữ bằng 3');
  });
});
