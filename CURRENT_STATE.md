# TRẠNG THÁI HIỆN TẠI CỦA DỰ ÁN (CURRENT_STATE.MD)

**Cập nhật lần cuối:** 2026-10-13  
**Giai đoạn hiện tại:** Giai đoạn 9 — Quan sát, Chỉ số & Khôi phục Thảm họa (Hoàn thành 100%, sẵn sàng cho Giai đoạn 10)

---

## 1. CÔNG VIỆC ĐÃ HOÀN THÀNH

- [x] **Giai đoạn 0 (Tiếp nhận dự án):**
  - Kiểm tra môi trường cục bộ: Node.js `v20.19.4`, npm `10.8.2`, git `2.51.0`.
  - Phân tích trực tiếp toàn bộ 3 sheet trong file Excel [Resort_Ecosystem_Optimization_Backlog.xlsx](file:///d:/resort/Resort_Ecosystem_Optimization_Backlog.xlsx).
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
- [x] **Roadmap Giai đoạn 9 (Quan sát, Chỉ số & Khôi phục Thảm họa):**
  - Nâng cấp Structured JSON Logging ([src/server/lib/logger.ts](file:///d:/resort/src/server/lib/logger.ts)):
    - Sinh mã `x-request-id` truy vết từng giao dịch end-to-end (`OBS-01`).
    - Lưu trữ buffer xoay vòng log phục vụ hiển thị trực tiếp.
  - Nâng cấp Endpoint Sức khỏe Hệ thống ([src/app/api/health/route.ts](file:///d:/resort/src/app/api/health/route.ts)):
    - Thăm dò kết nối Database (`SELECT 1`), đo độ trễ truy vấn (`dbLatencyMs`).
    - Đo lường bộ nhớ RAM (RSS, Heap Used, Heap Total) và thời gian hoạt động Uptime (`OBS-02`).
    - Đánh giá trạng thái tự động: `HEALTHY`, `DEGRADED` (khi latency $> 500$ms), `UNHEALTHY`.
  - Xây dựng Dashboard Quản trị Sức khỏe Hệ thống ([src/app/admin/system-health/page.tsx](file:///d:/resort/src/app/admin/system-health/page.tsx)) kèm CSS Module [system-health.module.css](file:///d:/resort/src/app/admin/system-health/system-health.module.css).
  - Tự động hóa Sao lưu & Phục hồi Cơ sở Dữ liệu (`REL-01`):
    - [scripts/backup-db.ps1](file:///d:/resort/scripts/backup-db.ps1) & [scripts/backup-db.sh](file:///d:/resort/scripts/backup-db.sh): Dump dữ liệu nén kèm tính mã băm SHA-256 Checksum.
    - [scripts/restore-db.ps1](file:///d:/resort/scripts/restore-db.ps1) & [scripts/restore-db.sh](file:///d:/resort/scripts/restore-db.sh): Phục hồi database có cờ bảo vệ an toàn.
  - Tài liệu Diễn tập Khôi phục Thảm họa ([docs/disaster_recovery_runbook.md](file:///d:/resort/docs/disaster_recovery_runbook.md) - `REL-02`) cam kết $RTO \le 30$ phút, $RPO \le 1$ giờ và 3 bước audit toàn vẹn dữ liệu.
  - Bộ kiểm thử Observability & Health [tests/observability-health.test.mjs](file:///d:/resort/tests/observability-health.test.mjs): 6/6 tests PASS.
  - Toàn bộ hệ thống: **37/37 test cases PASS (100%)**, Next.js build hoàn thành **23/23 routes**.

---

## 2. CÁC TỆP ĐÃ TẠO HOẶC CHỈNH SỬA

| File | Mô tả |
| :--- | :--- |
| [src/server/lib/logger.ts](file:///d:/resort/src/server/lib/logger.ts) | Nâng cấp Structured JSON Logger, HTTP request tracing, in-memory log buffer |
| [src/app/api/health/route.ts](file:///d:/resort/src/app/api/health/route.ts) | Endpoint kiểm tra sức khỏe hệ thống, probe database latency, RAM usage |
| [src/app/admin/system-health/page.tsx](file:///d:/resort/src/app/admin/system-health/page.tsx) | Dashboard Quản trị Sức khỏe & Quan sát hệ thống (System Health & Observability) |
| [src/app/admin/system-health/system-health.module.css](file:///d:/resort/src/app/admin/system-health/system-health.module.css) | Tệp CSS Module chuyên biệt cho Dashboard Quản trị Sức khỏe |
| [scripts/backup-db.ps1](file:///d:/resort/scripts/backup-db.ps1) & [.sh](file:///d:/resort/scripts/backup-db.sh) | Script sao lưu cơ sở dữ liệu tự động kèm mã SHA-256 Checksum |
| [scripts/restore-db.ps1](file:///d:/resort/scripts/restore-db.ps1) & [.sh](file:///d:/resort/scripts/restore-db.sh) | Script phục hồi cơ sở dữ liệu khẩn cấp |
| [docs/disaster_recovery_runbook.md](file:///d:/resort/docs/disaster_recovery_runbook.md) | Sổ tay hướng dẫn diễn tập phục hồi thảm họa dữ liệu ($RTO \le 30$ phút, $RPO \le 1$ giờ) |
| [tests/observability-health.test.mjs](file:///d:/resort/tests/observability-health.test.mjs) | Bộ kiểm thử Logging có cấu trúc, Health probe và xác thực Checksum |
| [CURRENT_STATE.md](file:///d:/resort/CURRENT_STATE.md) & [TASKS.md](file:///d:/resort/TASKS.md) | Cập nhật tiến độ và bằng chứng kiểm thử Giai đoạn 9 |

---

## 3. KẾT QUẢ KIỂM THỬ THỰC TẾ

- **Full System Test Suites:** 6 bộ test (`auth-rbac`, `inventory-concurrency`, `booking-idempotency`, `reception-desk`, `transport-mock`, `observability-health`) $\rightarrow$ **37/37 test cases PASS (100%)**.
- **Next.js Production Build:** `npm run build` $\rightarrow$ **23/23 routes biên dịch thành công**.

---

## 4. LỖI VÀ RỦI RO CÒN TỒN TẠI

- Cần bổ sung Security Hardening, Rate Limiting chống brute-force và k6 load test scenarios (Giai đoạn 10).

---

## 5. NHIỆM VỤ TIẾP THEO

- **Roadmap Giai đoạn 10: Tăng cường Bảo mật, Rate Limiting & Kiểm thử Tải (`SEC-05`, `SEC-06`, `TEST-01`, `TEST-02`, `TEST-03`):**
  - Security Headers (CSP, X-Frame-Options, HSTS).
  - Rate limiting cho các endpoint nhạy cảm (`/api/auth/login`, `/api/bookings`).
  - Kịch bản k6 kiểm thử tải mô phỏng traffic tìm kiếm và tranh chấp đặt phòng đồng thời với số liệu $p95, p99$ thực tế.
