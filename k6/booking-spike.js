/**
 * KỊCH BẢN KIỂM THỬ TRANH CHẤP ĐẶT PHÒNG ĐỒNG THỜI k6 (TEST-03, BOOK-03, SCALE-03)
 * Mô phỏng 50 khách tranh chấp 1 phòng cuối cùng trong cùng 1 tick
 * Chạy lệnh: k6 run k6/booking-spike.js
 */

import http from 'k6/http';
import { check } from 'k6';

export const options = {
  scenarios: {
    flash_sale_spike: {
      executor: 'shared-iterations',
      vus: 50,              // 50 người dùng ảo đồng thời
      iterations: 50,       // 50 lượt tranh chấp
      maxDuration: '30s',
    },
  },
  thresholds: {
    // Thời gian giao dịch atomic commit phải dưới 500ms
    http_req_duration: ['p(95)<500', 'p(99)<800'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  const vuId = __VU;
  const iterationId = __ITER;
  const idempotencyKey = `k6-idem-${vuId}-${iterationId}-${Date.now()}`;

  const payload = JSON.stringify({
    roomTypeId: 'mock-villa-ocean',
    checkInDate: '2026-11-20',
    checkOutDate: '2026-11-22',
    numberOfRooms: 1,
    numberOfGuests: 2,
    customerName: `Khách Hàng VU-${vuId}`,
    customerPhone: `090100${String(vuId).padStart(4, '0')}`,
    customerEmail: `guest${vuId}@test.annamresort.vn`,
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Idempotency-Key': idempotencyKey,
    },
  };

  const res = http.post(`${BASE_URL}/api/bookings`, payload, params);

  // Kết quả hợp lệ phải là: 201 (Đặt thành công) HOẶC 409/400 (SOLD_OUT do hết phòng)
  // Tuyệt đối không được xảy ra lỗi 500 (Deadlock unhandled)
  check(res, {
    'Phản hồi hợp lệ (201 Tạo thành công HOẶC 409/400 Hết phòng)': (r) =>
      r.status === 201 || r.status === 409 || r.status === 400,
    'Không xảy ra lỗi máy chủ sập 500': (r) => r.status !== 500,
  });
}
