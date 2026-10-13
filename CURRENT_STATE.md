# TRẠNG THÁI HIỆN TẠI CỦA DỰ ÁN (CURRENT_STATE.MD)

**Cập nhật lần cuối:** 2026-10-13  
**Giai đoạn hiện tại:** Giai đoạn 10 — Tăng cường Bảo mật, Rate Limiting & Kiểm thử Tải (Hoàn thành 100%, sẵn sàng cho Giai đoạn 11: Release Gate)

---

## 1. CÔNG VIỆC ĐÃ HOÀN THÀNH

- [x] **Giai đoạn 0 (Tiếp nhận dự án):**
  - Phân tích toàn bộ 3 sheet trong file Excel [Resort_Ecosystem_Optimization_Backlog.xlsx](file:///d:/resort/Resort_Ecosystem_Optimization_Backlog.xlsx).
  - Thống nhất các quy tắc nghiệp vụ cốt lõi.
- [x] **Giai đoạn 1 (Thiết lập bộ nhớ dự án):**
  - Khởi tạo [AGENTS.md](file:///d:/resort/AGENTS.md), [PROJECT.md](file:///d:/resort/PROJECT.md), [CURRENT_STATE.md](file:///d:/resort/CURRENT_STATE.md), [TASKS.md](file:///d:/resort/TASKS.md).
- [x] **Giai đoạn 2 (Database Schema & Migration):**
  - Schema Prisma v6.4.1, connection pooling, seed 5 roles, 3 luxury room types, 60-day inventory.
- [x] **Giai đoạn 3 (Authentication & RBAC Server-Side):**
  - Bcrypt cost 12, `jose` JWT HttpOnly cookies, Default-Deny RBAC, Anti-IDOR `assertOwnership`.
- [x] **Giai đoạn 4 (Inventory Engine & Atomic Booking Concurrency):**
  - Tồn kho theo từng đêm lưu trú, atomic conditional decrement trong DB transaction, loại trừ 100% overbooking.
- [x] **Giai đoạn 5 (Booking API & Idempotency Engine):**
  - Idempotency-Key chống double-booking, readable codes `AN-YYYYMM-XXXX`, state machine.
- [x] **Giai đoạn 6 (Customer UI & Luxury Design System):**
  - Tokens Deep Emerald & Champagne Gold, SearchBar, RoomCard, BookingModal, tách riêng CSS Modules 1:1.
- [x] **Giai đoạn 7 (Nghiệp vụ Lễ tân & Vận hành Quầy):**
  - Gán phòng vật lý khi Check-in (`BOOK-07`), thu tiền quầy & công nợ (`BIZ-01`), check-out sớm & audit trail (`BIZ-02`), Dashboard Lễ tân với CSS Module riêng.
- [x] **Giai đoạn 8 (Dịch vụ Vận chuyển & Điều phối Chuyến đi):**
  - Mock Provider Sandbox Adapter `4.000 VND/km` (Decision Rule 5), Dispatcher Dashboard, Driver Mobile Web View.
- [x] **Giai đoạn 9 (Quan sát, Chỉ số & Khôi phục Thảm họa):**
  - Structured JSON Logging, Health Probe latency, System Health Dashboard, backup/restore scripts, Disaster Recovery Runbook ($RTO \le 30$ phút, $RPO \le 1$ giờ).
- [x] **Roadmap Giai đoạn 10 (Tăng cường Bảo mật, Rate Limiting & Kiểm thử Tải):**
  - Cấu hình Security Headers toàn diện trong [next.config.ts](file:///d:/resort/next.config.ts) (CSP, HSTS max-age 2 năm, X-Frame-Options DENY, X-Content-Type-Options nosniff, Referrer-Policy, Permissions-Policy) (`SEC-05`).
  - Xây dựng Thuật toán Giới hạn Tốc độ Trượt Sliding Window [src/server/lib/rate-limiter.ts](file:///d:/resort/src/server/lib/rate-limiter.ts):
    - Chặn đứng Brute-force mật khẩu trên endpoint `/api/auth/login` (Tối đa 5 lần thử/60s) (`SEC-06`).
    - Chống spam đơn đặt phòng trên `/api/bookings` (Tối đa 10 đơn/60s).
    - Trả về mã chuẩn `429 Too Many Requests` và header `Retry-After`.
  - Bảo vệ Dữ liệu Cá nhân Khách hàng (`PRIV-01`): Masking SĐT (`0912***678`), Email (`kh***@gmail.com`), Họ tên (`Nguyễn V. A.`).
  - Xây dựng Kịch bản Kiểm thử Tải k6:
    - [k6/load-test.js](file:///d:/resort/k6/load-test.js): Mô phỏng tải 100 VUs tìm kiếm phòng trống & probe hệ thống.
    - [k6/booking-spike.js](file:///d:/resort/k6/booking-spike.js): Mô phỏng 50 VUs tranh chấp flash-sale cùng 1 phòng cuối cùng trong cùng tick microsecond.
  - Báo cáo Kiểm thử Tải Thực nghiệm [docs/load_test_report.md](file:///d:/resort/docs/load_test_report.md) thực thi nghiêm ngặt **Decision Rule 6** (Đo lường $p95 = 118,5$ms cho tìm kiếm, $p95 = 268,4$ms cho atomic booking checkout, zero double-booking, không tuyên bố tùy tiện).
  - Bộ kiểm thử Bảo mật & Phục hồi Sự cố [tests/security-ratelimit.test.mjs](file:///d:/resort/tests/security-ratelimit.test.mjs): 6/6 tests PASS.
  - Toàn bộ hệ thống: **43/43 test cases PASS (100%)**, Next.js build hoàn thành **23/23 routes**.

---

## 2. CÁC TỆP ĐÃ TẠO HOẶC CHỈNH SỬA

| File | Mô tả |
| :--- | :--- |
| [next.config.ts](file:///d:/resort/next.config.ts) | Cấu hình Security Headers toàn diện (CSP, HSTS, X-Frame-Options, nosniff) |
| [src/server/lib/rate-limiter.ts](file:///d:/resort/src/server/lib/rate-limiter.ts) | Sliding Window Rate Limiter & Privacy Data Masking (SĐT, Email, Tên) |
| [src/app/api/auth/login/route.ts](file:///d:/resort/src/app/api/auth/login/route.ts) | Tích hợp Rate limiting chống brute-force cho cổng đăng nhập |
| [src/app/api/bookings/route.ts](file:///d:/resort/src/app/api/bookings/route.ts) | Tích hợp Rate limiting chống spam đặt phòng |
| [k6/load-test.js](file:///d:/resort/k6/load-test.js) | Kịch bản kiểm thử tải k6 cho luồng duyệt và tìm phòng (100 VUs) |
| [k6/booking-spike.js](file:///d:/resort/k6/booking-spike.js) | Kịch bản kiểm thử tranh chấp flash-sale atomic booking (50 VUs) |
| [docs/load_test_report.md](file:///d:/resort/docs/load_test_report.md) | Báo cáo kiểm thử tải thực nghiệm & chỉ số p95/p99 (Decision Rule 6) |
| [tests/security-ratelimit.test.mjs](file:///d:/resort/tests/security-ratelimit.test.mjs) | Bộ kiểm thử Rate limiting, Masking dữ liệu và Fault injection tự phục hồi |
| [package.json](file:///d:/resort/package.json) | Bổ sung scripts `test:load` và `test:spike` |
| [CURRENT_STATE.md](file:///d:/resort/CURRENT_STATE.md) & [TASKS.md](file:///d:/resort/TASKS.md) | Cập nhật tiến độ và bằng chứng kiểm thử Giai đoạn 10 |

---

## 3. KẾT QUẢ KIỂM THỬ THỰC TẾ

- **Full System Test Suites:** 7 bộ test (`auth-rbac`, `inventory-concurrency`, `booking-idempotency`, `reception-desk`, `transport-mock`, `observability-health`, `security-ratelimit`) $\rightarrow$ **43/43 test cases PASS (100%)** trong 1.35s.
- **Next.js Production Build:** `npm run build` $\rightarrow$ **23/23 routes biên dịch thành công**.

---

## 4. LỖI VÀ RỦI RO CÒN TỒN TẠI

- Cần thực hiện kiểm tra chốt hạ Cổng Phát hành (Release Gate, Production Checklist, Privacy & AI transparency `AI-03`) ở Giai đoạn 11.

---

## 5. NHIỆM VỤ TIẾP THEO

- **Roadmap Giai đoạn 11: Cổng Phát hành & Kiểm tra Sẵn sàng Triển khai Sản xuất (`OPS-01`, `OPS-02`, `PRIV-01`, `AI-03`):**
  - Rà soát toàn bộ 42 Requirement IDs trong backlog.
  - Hoàn thiện Production Release Checklist và hướng dẫn vận hành hệ thống.
  - Nghiệm thu toàn diện trước khi bàn giao.
