/**
 * KỊCH BẢN KIỂM THỬ TẢI k6 (TEST-02, SCALE-02)
 * Đo lường hiệu năng tìm kiếm phòng & tải giao diện khách hàng
 * Chạy lệnh: k6 run k6/load-test.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 20 },  // Khởi động tải: 20 Virtual Users
    { duration: '1m', target: 50 },   // Tải ổn định: 50 Virtual Users
    { duration: '30s', target: 100 },  // Đỉnh điểm (Spike): 100 Virtual Users
    { duration: '30s', target: 0 },    // Hạ tải về 0
  ],
  thresholds: {
    // SLO Tiêu chuẩn: 95% request phải phản hồi dưới 300ms, 99% dưới 600ms
    http_req_duration: ['p(95)<300', 'p(99)<600'],
    // Tỷ lệ lỗi cho phép dưới 1%
    http_req_failed: ['rate<0.01'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function () {
  // 1. Khách truy cập trang chủ
  const resHome = http.get(`${BASE_URL}/`);
  check(resHome, {
    'Trang chủ trả về 200': (r) => r.status === 200,
  });

  sleep(1);

  // 2. Khách tìm kiếm phòng trống theo ngày
  const checkIn = '2026-11-15';
  const checkOut = '2026-11-18';
  const resAvailability = http.get(
    `${BASE_URL}/api/rooms/availability?checkInDate=${checkIn}&checkOutDate=${checkOut}`
  );
  check(resAvailability, {
    'Tìm kiếm phòng trả về 200': (r) => r.status === 200,
    'Thời gian tìm kiếm < 200ms': (r) => r.timings.duration < 200,
  });

  sleep(1);

  // 3. Hệ thống giám sát Health check probe
  const resHealth = http.get(`${BASE_URL}/api/health`);
  check(resHealth, {
    'Health check probe healthy': (r) => r.status === 200,
    'Header x-request-id tồn tại': (r) => r.headers['X-Request-Id'] !== undefined,
  });

  sleep(1);
}
