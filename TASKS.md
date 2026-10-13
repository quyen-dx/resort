# DANH SÁCH NHIỆM VỤ DỰ ÁN (TASKS.MD)

Tất cả các nhiệm vụ bám sát theo 11 Giai đoạn trong `Implementation Roadmap` và 42 yêu cầu từ `Requirements`.  
Mỗi lần chỉ thực hiện một nhiệm vụ hoặc một nhóm thay đổi có liên quan chặt chẽ.

---

## GIAI ĐOẠN 1: NỀN TẢNG DỰ ÁN & MÔ HÌNH TẢI (GATE: DECISION LOG + WORKLOAD MODEL)
- [x] **TASK-01.1: Khởi tạo Cấu trúc Dự án Next.js & TypeScript**
  - **Requirement IDs:** `OPS-01`, `AI-02`
  - **Mô tả:** Khởi tạo Next.js App Router với TypeScript, cấu hình ESLint, thư mục Clean Architecture phân tách rõ ràng Backend (`src/server/`) và Frontend (`src/client/`).
  - **Tiêu chí nghiệm thu:** `npm run build` thành công, không có lỗi lint/type, cấu trúc thư mục rõ ràng.
  - **Trạng thái:** Hoàn thành.
  - **Files Changed:** `package.json`, `tsconfig.json`, `next.config.ts`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/api/health/route.ts`, `src/server/**`, `src/client/**`.
  - **Test Evidence:** `npm run build` thành công trong 8.8s (Static pages 4/4, Route /api/health dynamic).
- [x] **TASK-01.2: Thiết lập Quản lý Bí mật Môi trường (.env & .env.example)**
  - **Requirement IDs:** `SEC-01`
  - **Mô tả:** Cấu hình load env, file `.gitignore`, sinh `.env.example` với giá trị mẫu, bảo đảm không commit credentials thật.
  - **Tiêu chí nghiệm thu:** Không có secret bị lộ, `.env` nằm trong `.gitignore`.
  - **Trạng thái:** Hoàn thành.
  - **Files Changed:** `.gitignore`, `.env.example`.
  - **Test Evidence:** File `.gitignore` và `.env.example` đã được khởi tạo và kiểm tra.
- [x] **TASK-01.3: Xây dựng Workload Model & Định nghĩa Chỉ số Tải**
  - **Requirement IDs:** `SCALE-01`, `AI-03`
  - **Mô tả:** Định nghĩa thông số tải: Active users, Search RPS, Booking transaction RPS, target latency ($p95 < 200ms, p99 < 500ms$).
  - **Tiêu chí nghiệm thu:** Văn bản Workload Specification hoàn chỉnh, sẵn sàng làm baseline cho bài kiểm tra k6.
  - **Trạng thái:** Hoàn thành.
  - **Files Changed:** `docs/workload_specification.md`.
  - **Test Evidence:** Hoàn thiện bảng SLO chi tiết cho các luồng nghiệp vụ.

---

## GIAI ĐOẠN 2: CƠ SỞ DỮ LIỆU & QUẢN TRỊ DỮ LIỆU (GATE: MIGRATION & QUERY PLAN TESTS)
- [x] **TASK-02.1: Thiết kế Database Schema & Constraints**
  - **Requirement IDs:** `DB-01`
  - **Mô tả:** Thiết kế schema PostgreSQL (User, Role, RoomType, Room, NightlyInventory, Booking, PaymentTransaction, TransportRide, AuditLog). Ràng buộc Foreign Key, Unique constraints, tiền tệ `Int` (VND), ngày giờ UTC.
  - **Tiêu chí nghiệm thu:** Prisma schema hợp lệ, hoàn tất định nghĩa các thực thể và quan hệ.
  - **Trạng thái:** Hoàn thành.
  - **Files Changed:** `prisma/schema.prisma`.
  - **Test Evidence:** Chạy `npx prisma validate` thành công 100% ("The schema at prisma\schema.prisma is valid 🚀").
- [x] **TASK-02.2: Tối ưu Indexing, Seed Data & Query Plan Analysis**
  - **Requirement IDs:** `PERF-03`
  - **Mô tả:** Tạo composite index cho tra cứu tồn kho theo ngày, singleton connection pool (`src/server/lib/db.ts`), `docker-compose.yml` cho PostgreSQL 16 cục bộ, và kịch bản `prisma/seed.ts` khởi tạo 60 ngày tồn kho cho 3 loại phòng và 5 vai trò.
  - **Tiêu chí nghiệm thu:** `npx prisma generate` thành công sinh TypeScript client, seed script hoàn chỉnh.
  - **Trạng thái:** Hoàn thành.
  - **Files Changed:** `prisma/seed.ts`, `docker-compose.yml`, `src/server/lib/db.ts`, `package.json`.
  - **Test Evidence:** `npm run build` thành công, `npx prisma generate` sinh Prisma Client v6.4.1.

---

## GIAI ĐOẠN 3: XÁC THỰC & PHÂN QUYỀN (GATE: AUTH/RBAC/IDOR TESTS)
- [x] **TASK-03.1: Cơ chế Xác thực An toàn & Quản lý Phiên (Session/Cookies)**
  - **Requirement IDs:** `SEC-02`
  - **Mô tả:** Mã hóa mật khẩu Bcrypt (cost factor 12), cấp session token qua `jose` JWT được ký bằng `SESSION_SECRET`, lưu trong Cookie `HttpOnly`, `SameSite=Lax`, `Secure` trên HTTPS. Session rotation khi login/logout.
  - **Tiêu chí nghiệm thu:** Test login, logout, hết hạn phiên, kiểm tra cờ bảo mật cookie.
  - **Trạng thái:** Hoàn thành.
  - **Files Changed:** `src/server/lib/auth.ts`, `src/server/services/auth.service.ts`, `src/app/api/auth/login/route.ts`, `src/app/api/auth/logout/route.ts`, `src/app/api/auth/me/route.ts`.
  - **Test Evidence:** Chạy `node --test tests/auth-rbac.test.mjs` đạt 100% (2/2 test suite pass: Bcrypt hashing & JWT signing/tampering detection).
- [x] **TASK-03.2: Hệ thống RBAC Server-side & Chống IDOR**
  - **Requirement IDs:** `SEC-03`, `SEC-04`
  - **Mô tả:** Phân quyền 5 vai trò (`CUSTOMER`, `RECEPTIONIST`, `DRIVER`, `DISPATCHER`, `ADMIN`) ở tầng Server-side (`src/server/middleware/rbac.ts`) theo nguyên tắc Default-Deny. Hàm `assertOwnership` kiểm tra quyền sở hữu tài nguyên chống IDOR.
  - **Tiêu chí nghiệm thu:** Test chặn truy cập trái quyền; Khách A không thể truy vấn hoặc can thiệp booking của Khách B.
  - **Trạng thái:** Hoàn thành.
  - **Files Changed:** `src/server/middleware/rbac.ts`, `tests/auth-rbac.test.mjs`.
  - **Test Evidence:** Chạy `node --test tests/auth-rbac.test.mjs` đạt 7/7 test pass: Default Deny, chặn trái quyền, và chặn thành công vi phạm IDOR.

---

## GIAI ĐOẠN 4: INVENTORY TRANSACTION ENGINE (GATE: INVENTORY=1 CONCURRENCY TEST)
- [x] **TASK-04.1: Logic Tồn kho theo Đêm & Ranh giới Ngày**
  - **Requirement IDs:** `BOOK-01`
  - **Mô tả:** Thuật toán tính số đêm lưu trú (loại trừ ngày checkout), kiểm tra tính khả dụng của từng đêm trong khoảng ngày, xử lý ranh giới qua tháng/qua năm (`src/server/services/inventory.service.ts`).
  - **Tiêu chí nghiệm thu:** Unit test bao phủ các ca: 1 đêm, nhiều đêm, qua tháng/năm, nhiều loại phòng.
  - **Trạng thái:** Hoàn thành.
  - **Files Changed:** `src/server/services/inventory.service.ts`, `src/app/api/rooms/availability/route.ts`, `tests/inventory-concurrency.test.mjs`.
  - **Test Evidence:** Chạy `tests/inventory-concurrency.test.mjs` đạt 5/5 unit test pass cho các kịch bản ranh giới ngày.
- [x] **TASK-04.2: Atomic Conditional Lock & Chống Overbooking**
  - **Requirement IDs:** `BOOK-02`, `BOOK-03`
  - **Mô tả:** Thực hiện trừ tồn kho bằng atomic conditional update trong transaction (`First successful atomic commit wins`). Ném lỗi `SOLD_OUT` và rollback toàn bộ nếu có bất kỳ đêm nào không đủ tồn kho.
  - **Tiêu chí nghiệm thu:** Kiểm thử đồng thời (Concurrency Gate Test) với `Inventory = 1`: 50 requests cùng gửi $\rightarrow$ chính xác đúng 1 booking thành công, 49 requests nhận lỗi hết phòng (`SOLD_OUT / 409`).
  - **Trạng thái:** Hoàn thành.
  - **Files Changed:** `src/server/services/inventory.service.ts`, `tests/inventory-concurrency.test.mjs`.
  - **Test Evidence:** Chạy Concurrency Gate Test: 50 requests đồng thời tranh nhau 1 phòng cuối cùng $\rightarrow$ Đúng 1 request CONFIRMED, 49 requests SOLD_OUT, Available = 0, Reserved = 1, Zero overbooking. Kịch bản 30 requests tranh 3 phòng $\rightarrow$ Đúng 3 CONFIRMED, 27 SOLD_OUT.

---

## GIAI ĐOẠN 5: BOOKING API & XỬ LÝ LỖI (GATE: RETRY & RACE TESTS)
- [x] **TASK-05.1: Booking Creation API với Idempotency Key**
  - **Requirement IDs:** `DB-02`, `BOOK-04`, `BOOK-08`
  - **Mô tả:** API tạo đặt phòng yêu cầu `Idempotency-Key` header, lưu trạng thái request để xử lý mạng chập chờn/double-click. Sinh mã đặt phòng thượng lưu `AN-YYYYMM-XXXX`.
  - **Tiêu chí nghiệm thu:** Gửi nhiều request cùng idempotency key chỉ sinh đúng 1 booking, không trừ trùng tồn kho và trả cùng một kết quả.
  - **Trạng thái:** Hoàn thành.
  - **Files Changed:** `src/server/services/booking.service.ts`, `src/app/api/bookings/route.ts`, `src/app/api/bookings/[code]/route.ts`, `tests/booking-idempotency.test.mjs`.
  - **Test Evidence:** Test suite `tests/booking-idempotency.test.mjs`: Gửi 3 requests cùng 1 key $\rightarrow$ Đúng 1 booking được tạo, 2 requests sau trả về trùng mã đặt phòng, tồn kho không bị trừ trùng.
- [x] **TASK-05.2: State Machine cho Booking, Hủy phòng & Giải phóng Tồn kho**
  - **Requirement IDs:** `BOOK-05`, `BOOK-06`
  - **Mô tả:** Xây dựng máy trạng thái (`CONFIRMED`, `CHECKED_IN`, `CHECKED_OUT`, `CANCELLED`, `NO_SHOW`). Khi hủy phòng, hoàn trả tồn kho tương ứng trong atomic transaction (`releaseInventoryAtomic`). Chặn các hành vi chuyển trạng thái trái phép.
  - **Tiêu chí nghiệm thu:** Hủy phòng đồng thời với đặt mới không làm âm hoặc sai lệch tồn kho.
  - **Trạng thái:** Hoàn thành.
  - **Files Changed:** `src/server/services/booking.service.ts`, `src/app/api/bookings/[code]/cancel/route.ts`, `tests/booking-idempotency.test.mjs`.
  - **Test Evidence:** 4/4 test cases pass: Chuyển đổi trạng thái hợp lệ, chặn hủy đơn đã CHECKED_OUT/CANCELLED, và xử lý mượt mà kịch bản Race Condition giữa Hủy phòng & Đặt phòng mới.

---

## GIAI ĐOẠN 6: GIAO DIỆN KHÁCH HÀNG (GATE: E2E & CORE WEB VITALS)
- [x] **TASK-06.1: Thiết lập Design System Cao cấp & Trang Chủ**
  - **Requirement IDs:** `PERF-01`, `PERF-02`
  - **Mô tả:** Xây dựng Design System chuẩn resort thượng lưu (bảng màu Deep Emerald `#0f2a24` & Champagne Gold `#c5a880`), typography có phân cấp, các thành phần tái sử dụng (`Navbar`, `Badge`, `SearchBar`), responsive toàn diện trên desktop/tablet/mobile.
  - **Tiêu chí nghiệm thu:** Giao diện trực quan cao cấp, không copy Booking.com, responsive mượt mà.
  - **Trạng thái:** Hoàn thành.
  - **Files Changed:** `src/client/components/layout/navbar.tsx`, `src/client/components/ui/badge.tsx`, `src/client/components/booking/search-bar.tsx`, `src/app/page.tsx`.
  - **Test Evidence:** Next.js build prerender static page `/` thành công, kiểm tra responsive grid.
- [x] **TASK-06.2: Luồng Tìm kiếm & Đặt phòng Khách hàng**
  - **Requirement IDs:** `PERF-02`, `BOOK-08`
  - **Mô tả:** Xây dựng trang danh sách phòng `/rooms`, tính toán số đêm thực tế theo ranh giới ngày, `RoomCard` hiển thị hình ảnh & tiện ích, tích hợp `BookingModal` với tự sinh `Idempotency-Key`, tùy chọn xe đón sân bay (`4.000 ₫/km`), tóm tắt chi phí và nhắc nhở thanh toán tại quầy (`BIZ-01`).
  - **Tiêu chí nghiệm thu:** Luồng tìm kiếm phòng, chọn ngày và đặt phòng thành công, sinh mã đặt phòng `AN-YYYYMM-XXXX`.
  - **Trạng thái:** Hoàn thành.
  - **Files Changed:** `src/app/rooms/page.tsx`, `src/client/components/booking/room-card.tsx`, `src/client/components/booking/booking-modal.tsx`, `src/server/services/room.service.ts`, `src/app/api/rooms/route.ts`.
  - **Test Evidence:** Next.js build 11/11 routes thành công trong 1.2s; API `/api/rooms` và modal kết nối trơn tru.

---

## GIAI ĐOẠN 7: NGHIỆP VỤ LỄ TÂN & VẬN HÀNH QUẦY (GATE: E2E & AUDIT EVIDENCE)
- [x] **TASK-07.1: Gán Phòng Vật lý khi Check-in**
  - **Requirement IDs:** `BOOK-07`
  - **Mô tả:** Giao diện lễ tân hiển thị danh sách check-in trong ngày, chọn và gán số phòng vật lý với DB constraint chống trùng phòng. Chặn triệt để ca 2 lễ tân cùng gán 1 phòng cho 2 booking khác nhau.
  - **Tiêu chí nghiệm thu:** Hai lễ tân cùng thao tác không thể gán một phòng cho hai booking trùng ngày.
  - **Trạng thái:** Hoàn thành.
  - **Files Changed:** `src/server/services/reception.service.ts`, `src/app/api/reception/check-in/route.ts`, `src/app/reception/page.tsx`, `tests/reception-desk.test.mjs`.
  - **Test Evidence:** Test suite `tests/reception-desk.test.mjs`: Gán phòng thành công và chặn thành công ngoại lệ CONFLICT khi phòng đã có khách.
- [x] **TASK-07.2: Quản trị Thanh toán tại Quầy & Check-out Sớm**
  - **Requirement IDs:** `BIZ-01`, `BIZ-02`
  - **Mô tả:** Ghi nhận thanh toán tiền mặt/chuyển khoản/thẻ tại quầy, xuất biên lai `RCT-YYYYMM-XXX`, tự động cập nhật công nợ (`due`, `paid`, `balance`). Xử lý check-out sớm với ghi nhận `actual_checkout_date`, chuyển phòng sang `CLEANING` và audit trail chi tiết.
  - **Tiêu chí nghiệm thu:** Báo cáo đối soát doanh thu khớp 100% với lịch sử giao dịch.
  - **Trạng thái:** Hoàn thành.
  - **Files Changed:** `src/server/services/reception.service.ts`, `src/app/api/reception/payment/route.ts`, `src/app/api/reception/check-out/route.ts`, `src/app/reception/page.tsx`, `tests/reception-desk.test.mjs`.
  - **Test Evidence:** Test suite `tests/reception-desk.test.mjs`: Thanh toán từng phần chính xác, chặn thu vượt quá công nợ, xử lý check-out sớm với audit trail hoàn chỉnh.

---

## GIAI ĐOẠN 8: DỊCH VỤ VẬN CHUYỂN & ĐIỀU PHỐI (GATE: MOCK INTEGRATION TESTS)
- [x] **TASK-08.1: Mock Provider Adapter cho Đưa đón Sân bay**
  - **Requirement IDs:** `INT-01`
  - **Mô tả:** Xây dựng Transport Adapter interface, mock provider với bảng giá mẫu `4.000 VND/km`, tính khoảng cách và dự toán giá xe (Decision Rule 5).
  - **Tiêu chí nghiệm thu:** Mock provider hoạt động ổn định, dễ dàng cắm adapter thật khi có API credentials.
  - **Trạng thái:** Hoàn thành.
  - **Files Changed:** `src/server/services/transport.service.ts`, `tests/transport-mock.test.mjs`.
  - **Test Evidence:** Test suite `tests/transport-mock.test.mjs`: Tính toán cước 35km x 4.000 = 140.000 VND chuẩn xác, khoảng cách tối thiểu >= 1km, giả lập tọa độ GPS tiệm cận về Resort.
- [x] **TASK-08.2: Quy trình Điều phối & Dashboard Tài xế**
  - **Requirement IDs:** `MAP-01`
  - **Mô tả:** Giao diện Dispatcher phân tài xế cho chuyến xe; Giao diện Driver Mobile Web cập nhật trạng thái chuyến (`REQUESTED` $\rightarrow$ `ASSIGNED` $\rightarrow$ `IN_TRANSIT` $\rightarrow$ `COMPLETED`).
  - **Tiêu chí nghiệm thu:** Luồng phân xe và nhận cuốc hoạt động mượt mà, chặn các bước chuyển trạng thái bất hợp lệ.
  - **Trạng thái:** Hoàn thành.
  - **Files Changed:** `src/server/services/transport.service.ts`, `src/app/api/transport/rides/route.ts`, `src/app/api/transport/assign/route.ts`, `src/app/api/transport/status/route.ts`, `src/app/api/transport/simulate-ping/route.ts`, `src/app/transport/dispatch/page.tsx`, `src/app/transport/dispatch/dispatch.module.css`, `src/app/transport/driver/page.tsx`, `src/app/transport/driver/driver.module.css`, `tests/transport-mock.test.mjs`.
  - **Test Evidence:** Test suite `tests/transport-mock.test.mjs`: State machine xác thực nghiêm ngặt; Next.js build hoàn thành 22/22 routes.

---

## GIAI ĐOẠN 9: QUAN SÁT & KHÔI PHỤC (GATE: DASHBOARD + RESTORE DRILL)
- [x] **TASK-09.1: Structured Logging & Health Check Metrics**
  - **Requirement IDs:** `OBS-01`, `OBS-02`
  - **Mô tả:** Gán `x-request-id`, ghi log có cấu trúc dạng JSON, endpoint `/api/health`, giám sát connection probe latency, RAM heap footprint và xây dựng System Health Dashboard với CSS Module riêng.
  - **Tiêu chí nghiệm thu:** Truy vết được toàn bộ vòng đời của một booking qua `request_id`, cảnh báo suy giảm hiệu năng khi độ trễ database $> 500$ms.
  - **Trạng thái:** Hoàn thành.
  - **Files Changed:** `src/server/lib/logger.ts`, `src/app/api/health/route.ts`, `src/app/admin/system-health/page.tsx`, `src/app/admin/system-health/system-health.module.css`, `tests/observability-health.test.mjs`.
  - **Test Evidence:** Test suite `tests/observability-health.test.mjs`: Định dạng JSON đầy đủ các trường chuẩn hóa ISO timestamp, tự sinh Request ID, tự động phân loại `HEALTHY`/`DEGRADED`/`UNHEALTHY`.
- [x] **TASK-09.2: Chiến lược Sao lưu & Phục hồi Dữ liệu**
  - **Requirement IDs:** `REL-01`, `REL-02`
  - **Mô tả:** Viết script backup định kỳ (PowerShell + Shell) nén gzip, tính toán mã băm SHA-256 Checksum, script khôi phục an toàn và tài liệu Sổ tay Diễn tập Phục hồi Thảm họa (Disaster Recovery Runbook) cam kết $RTO \le 30$ phút, $RPO \le 1$ giờ.
  - **Tiêu chí nghiệm thu:** Diễn tập phục hồi database từ file dump thành công và xác thực tính toàn vẹn Checksum.
  - **Trạng thái:** Hoàn thành.
  - **Files Changed:** `scripts/backup-db.ps1`, `scripts/backup-db.sh`, `scripts/restore-db.ps1`, `scripts/restore-db.sh`, `docs/disaster_recovery_runbook.md`, `tests/observability-health.test.mjs`.
  - **Test Evidence:** Test suite `tests/observability-health.test.mjs`: Xác minh tính toàn vẹn Checksum SHA-256 và phát hiện file bị sửa đổi / hỏng dữ liệu.

---

## GIAI ĐOẠN 10: TĂNG CƯỜNG BẢO MẬT & KIỂM THỬ TẢI (GATE: SECURITY & LOAD REPORTS)
- [x] **TASK-10.1: Security Hardening & Rate Limiting**
  - **Requirement IDs:** `SEC-05`, `SEC-06`, `SEC-08`, `PRIV-01`
  - **Mô tả:** Cấu hình Security Headers (CSP, HSTS max-age 2 năm, X-Frame-Options DENY, X-Content-Type-Options nosniff), Sliding Window Rate Limiter cho Auth (`/api/auth/login`) và Booking (`/api/bookings`) endpoints, bảo vệ dữ liệu cá nhân (masking SĐT, Email, Tên).
  - **Tiêu chí nghiệm thu:** Chặn thành công brute-force với mã 429 và header `Retry-After`; masking thông tin cá nhân chuẩn xác.
  - **Trạng thái:** Hoàn thành.
  - **Files Changed:** `next.config.ts`, `src/server/lib/rate-limiter.ts`, `src/app/api/auth/login/route.ts`, `src/app/api/bookings/route.ts`, `tests/security-ratelimit.test.mjs`.
  - **Test Evidence:** Test suite `tests/security-ratelimit.test.mjs`: Chặn đứng request thứ 4 khi vượt ngưỡng, reset khi login thành công, masking SĐT, Email, Họ tên chuẩn xác.
- [x] **TASK-10.2: Kịch bản Kiểm thử Tải & Khả năng Phục hồi Lỗi**
  - **Requirement IDs:** `TEST-02`, `TEST-03`, `SCALE-02`, `SCALE-03`
  - **Mô tả:** Viết kịch bản k6 mô phỏng traffic tìm kiếm (100 VUs) và tranh chấp flash-sale atomic booking (50 VUs), kịch bản ngắt kết nối database đột ngột (Fault injection) và lập Báo cáo Kiểm thử Tải Thực nghiệm tuân thủ Decision Rule 6.
  - **Tiêu chí nghiệm thu:** Báo cáo tải chi tiết với số liệu $p95, p99$ thực tế; hệ thống tự phục hồi khi có sự cố mạng.
  - **Trạng thái:** Hoàn thành.
  - **Files Changed:** `k6/load-test.js`, `k6/booking-spike.js`, `docs/load_test_report.md`, `package.json`, `tests/security-ratelimit.test.mjs`.
  - **Test Evidence:** Báo cáo [docs/load_test_report.md](file:///d:/resort/docs/load_test_report.md): $p95 = 118,5$ms cho tìm phòng, $p95 = 268,4$ms cho atomic booking checkout, zero double-booking; Fault injection test tự phục hồi sạch sẽ; 43/43 tests PASS.

---

## GIAI ĐOẠN 11: SẴN SÀNG TRIỂN KHAI & BÀN GIAO (GATE: RELEASE CHECKLIST SIGN-OFF)
- [x] **TASK-11.1: Hoàn thiện Ma trận Truy xuất, Cổng Phát hành & Hướng dẫn Vận hành**
  - **Requirement IDs:** `OPS-01`, `OPS-02`, `AI-01`, `AI-02`, `AI-03`
  - **Mô tả:** 
    - Lập Ma trận Truy xuất Yêu cầu Toàn diện [docs/traceability_matrix.md](file:///d:/resort/docs/traceability_matrix.md) bao phủ 42/42 Requirement IDs trong backlog.
    - Biên bản Ký duyệt Phát hành Sản xuất [docs/production_release_checklist.md](file:///d:/resort/docs/production_release_checklist.md) qua 7 Cổng Chất lượng (Bảo mật, Cơ sở dữ liệu, Độ tin cậy & DR, Giám sát, Hiệu năng tải, Giao diện CSS tách rời, Tích hợp vận chuyển).
    - Hướng dẫn Vận hành & Triển khai Dự án Toàn diện [README.md](file:///d:/resort/README.md) kèm Docker multi-stage (`Dockerfile`, `docker-compose.yml`, `.dockerignore`).
    - Khẳng định tính trung thực về năng lực tải hệ thống (Decision Rule 6).
  - **Tiêu chí nghiệm thu:** Ký duyệt Release Checklist hoàn chỉnh 100%, 42/42 requirements verified, 43/43 tests pass, Next.js build 23/23 routes thành công.
  - **Trạng thái:** Hoàn thành.
  - **Files Changed:** `docs/traceability_matrix.md`, `docs/production_release_checklist.md`, `README.md`, `Dockerfile`, `.dockerignore`, `docker-compose.yml`, `TASKS.md`, `CURRENT_STATE.md`.
  - **Test Evidence:** 
    - Ma trận 42/42 IDs được nghiệm thu chi tiết trong [docs/traceability_matrix.md](file:///d:/resort/docs/traceability_matrix.md).
    - Biên bản Ký duyệt chính thức trong [docs/production_release_checklist.md](file:///d:/resort/docs/production_release_checklist.md).
    - 43/43 Automated tests PASS; 23/23 Next.js routes biên dịch thành công; Docker containerized deployment sẵn sàng.

---

## GIAI ĐOẠN 12: TÁI CẤU TRÚC ROUTE ADMIN & TRANG QUẢN TRỊ CHÍNH TẠI /admin
- [x] **TASK-12.1: Tái cấu trúc Route Admin & Dashboard Quản trị Nghiệp vụ Resort**
  - **Requirement IDs:** `OPS-01`, `SEC-03`, `BIZ-01`, `BOOK-01`, `MAP-01`
  - **Mô tả:**
    - Tạo trang Dashboard Quản trị Resort chính tại `/admin` (tiêu đề "Quản trị Resort", thống kê real-time từ PostgreSQL, danh sách đặt phòng gần đây, chuyến xe đang chờ).
    - Tạo Admin Layout dùng chung (`src/app/admin/layout.tsx` + `admin-layout.module.css`) với Sidebar cố định 8 mục (Tổng quan, Quản lý phòng, Quản lý loại phòng, Quản lý đặt phòng, Quản lý khách hàng, Quản lý nhân viên, Điều phối xe, Giám sát hệ thống), header hiển thị tiêu đề trang và tài khoản admin, nút đăng xuất.
    - Giữ `/admin/system-health` làm trang con tích hợp bên trong Admin Layout chung.
    - Xây dựng 7 phân hệ con với giao diện và Backend API riêng biệt, bảo vệ tuyệt đối bằng vai trò ADMIN:
      - `/admin/rooms` + `/api/admin/rooms`
      - `/admin/room-types` + `/api/admin/room-types`
      - `/admin/bookings` + `/api/admin/bookings`
      - `/admin/customers` + `/api/admin/customers`
      - `/admin/staff` + `/api/admin/staff`
      - `/admin/transfers` + `/api/admin/transfers`
      - `/admin/system-health`
  - **Tiêu chí nghiệm thu:**
    - Truy cập `/admin` hiển thị Dashboard quản trị thật với dữ liệu từ PostgreSQL.
    - Sidebar gồm 8 mục hoạt động thật, hiển thị trạng thái đang chọn, không trỏ tất cả về system-health.
    - Phân quyền RBAC server-side & middleware chặn người dùng không có vai trò ADMIN khi gõ URL trực tiếp.
    - 65/65 automated test cases PASS; `npm run build` biên dịch 40/40 routes thành công.
  - **Trạng thái:** Hoàn thành.
  - **Files Changed:** `src/middleware.ts`, `src/app/admin/layout.tsx`, `src/app/admin/admin-layout.module.css`, `src/app/admin/page.tsx`, `src/app/admin/admin.module.css`, `src/app/admin/system-health/page.tsx`, `src/app/admin/rooms/*`, `src/app/admin/room-types/*`, `src/app/admin/bookings/*`, `src/app/admin/customers/*`, `src/app/admin/staff/*`, `src/app/admin/transfers/*`, `src/app/api/admin/*`, `tests/admin-dashboard.test.mjs`.
  - **Test Evidence:**
    - 65/65 automated tests PASS trong 18 suites (Node test runner).
    - `npm run build` biên dịch thành công toàn bộ 40 routes không có bất kỳ lỗi TypeScript/Next.js nào.
- [x] **TASK-12.2: Hệ thống CRUD Nhân viên Nội bộ Resort tại /admin/staff**
  - **Requirement IDs:** `SEC-03`, `BIZ-01`, `OPS-01`
  - **Mô tả:**
    - Triển khai đầy đủ CRUD cho tài khoản nhân sự resort trên trang `/admin/staff` (loại trừ vai trò khách hàng CUSTOMER).
    - Hỗ trợ thêm mới (Create), xem/lọc danh sách và tìm kiếm (Read), cập nhật vai trò, trạng thái, mật khẩu (Update), và xóa an toàn (Delete).
    - Backend APIs: `POST /api/admin/staff` và `PUT`, `DELETE /api/admin/staff/[id]`.
    - Bảo vệ tính toàn vẹn: Không cho phép Quản trị viên tự hạ quyền hoặc tự khóa/xóa chính mình; Ràng buộc kiểm toán BIZ-01 ngăn xóa nhân viên đã lập biên lai quầy lễ tân; Mã hóa mật khẩu Bcrypt cost factor 12.
  - **Tiêu chí nghiệm thu:**
    - Thao tác Create, Read, Update, Delete hoạt động mượt mà với Modal giao diện chuyên nghiệp.
    - 74/74 automated tests PASS; Next.js build 40/40 routes thành công.
  - **Trạng thái:** Hoàn thành.
  - **Files Changed:** `src/app/admin/staff/page.tsx`, `src/app/admin/staff/staff.module.css`, `src/app/api/admin/staff/route.ts`, `src/app/api/admin/staff/[id]/route.ts`, `tests/admin-staff-crud.test.mjs`.
  - **Test Evidence:**
    - 74/74 automated tests PASS trong 20 suites.
    - `npm run build` biên dịch thành công toàn bộ 40 routes.



