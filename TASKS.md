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
- [ ] **TASK-03.1: Cơ chế Xác thực An toàn & Quản lý Phiên (Session/Cookies)**
  - **Requirement IDs:** `SEC-02`
  - **Mô tả:** Mã hóa mật khẩu Argon2id/Bcrypt, cấp session token trong Cookie `HttpOnly`, `Secure`, `SameSite`. Session rotation khi login/logout.
  - **Tiêu chí nghiệm thu:** Test login, logout, hết hạn phiên, kiểm tra đầy đủ cờ bảo mật của cookie.
  - **Trạng thái:** Chưa bắt đầu.
- [ ] **TASK-03.2: Hệ thống RBAC Server-side & Chống IDOR**
  - **Requirement IDs:** `SEC-03`, `SEC-04`
  - **Mô tả:** Phân quyền 5 vai trò (`Customer`, `Receptionist`, `Driver`, `Dispatcher`, `Admin`) ở Middleware/API Handlers (Default-deny). Ownership validation trên mọi tài nguyên booking.
  - **Tiêu chí nghiệm thu:** Test chặn truy cập trái quyền; Khách A không thể truy vấn hoặc can thiệp booking của Khách B.
  - **Trạng thái:** Chưa bắt đầu.

---

## GIAI ĐOẠN 4: INVENTORY TRANSACTION ENGINE (GATE: INVENTORY=1 CONCURRENCY TEST)
- [ ] **TASK-04.1: Logic Tồn kho theo Đêm & Ranh giới Ngày**
  - **Requirement IDs:** `BOOK-01`
  - **Mô tả:** Thuật toán tính số đêm lưu trú (loại trừ ngày checkout), kiểm tra tính khả dụng của từng đêm trong khoảng ngày.
  - **Tiêu chí nghiệm thu:** Unit test bao phủ các ca: 1 đêm, nhiều đêm, qua tháng/năm, nhiều loại phòng.
  - **Trạng thái:** Chưa bắt đầu.
- [ ] **TASK-04.2: Atomic Conditional Lock & Chống Overbooking**
  - **Requirement IDs:** `BOOK-02`, `BOOK-03`
  - **Mô tả:** Thực hiện trừ tồn kho bằng atomic update trong transaction (`First successful atomic commit wins`). Trả về `CONFLICT` nếu không đủ tồn kho.
  - **Tiêu chí nghiệm thu:** Kiểm thử đồng thời (Concurrency Test) với `Inventory = 1`: 100 requests cùng gửi $\rightarrow$ chính xác 1 booking thành công, 99 requests nhận lỗi hết phòng.
  - **Trạng thái:** Chưa bắt đầu.

---

## GIAI ĐOẠN 5: BOOKING API & XỬ LÝ LỖI (GATE: RETRY & RACE TESTS)
- [ ] **TASK-05.1: Booking Creation API với Idempotency Key**
  - **Requirement IDs:** `DB-02`, `BOOK-04`, `BOOK-08`
  - **Mô tả:** API tạo đặt phòng yêu cầu `Idempotency-Key` header, lưu trạng thái request để xử lý mạng chập chờn/double-click.
  - **Tiêu chí nghiệm thu:** Gửi 2 request cùng idempotency key chỉ sinh đúng 1 booking và trả cùng một kết quả.
  - **Trạng thái:** Chưa bắt đầu.
- [ ] **TASK-05.2: State Machine cho Booking, Hủy phòng & Giải phóng Tồn kho**
  - **Requirement IDs:** `BOOK-05`, `BOOK-06`
  - **Mô tả:** Xây dựng máy trạng thái (`CONFIRMED`, `CHECKED_IN`, `CHECKED_OUT`, `CANCELLED`, `NO_SHOW`). Khi hủy phòng, hoàn trả tồn kho tương ứng trong atomic transaction.
  - **Tiêu chí nghiệm thu:** Hủy phòng đồng thời với đặt mới không làm âm hoặc sai lệch tồn kho.
  - **Trạng thái:** Chưa bắt đầu.

---

## GIAI ĐOẠN 6: GIAO DIỆN KHÁCH HÀNG (GATE: E2E & CORE WEB VITALS)
- [ ] **TASK-06.1: Thiết lập Design System Cao cấp & Trang Chủ**
  - **Requirement IDs:** `PERF-01`, `PERF-02`
  - **Mô tả:** Xây dựng Design System (bảng màu sang trọng, typography chuẩn, spacing, components: Button, Card, DateRangePicker, Modal), hỗ trợ Đa ngôn ngữ (VI/EN).
  - **Tiêu chí nghiệm thu:** Giao diện trực quan cao cấp, responsive mượt mà trên mobile/tablet/desktop.
  - **Trạng thái:** Chưa bắt đầu.
- [ ] **TASK-06.2: Luồng Tìm kiếm & Đặt phòng Khách hàng**
  - **Requirement IDs:** `PERF-02`, `BOOK-08`
  - **Mô tả:** Trang danh sách phòng, lọc tiện ích, xem chi tiết, form nhập thông tin khách (hỗ trợ Guest), tóm tắt hóa đơn và xác nhận.
  - **Tiêu chí nghiệm thu:** E2E test luồng đặt phòng từ tìm kiếm đến màn hình xác nhận thành công.
  - **Trạng thái:** Chưa bắt đầu.

---

## GIAI ĐOẠN 7: NGHIỆP VỤ LỄ TÂN & VẬN HÀNH QUẦY (GATE: E2E & AUDIT EVIDENCE)
- [ ] **TASK-07.1: Gán Phòng Vật lý khi Check-in**
  - **Requirement IDs:** `BOOK-07`
  - **Mô tả:** Giao diện lễ tân hiển thị danh sách check-in trong ngày, chọn và gán số phòng vật lý với DB constraint chống trùng phòng.
  - **Tiêu chí nghiệm thu:** Hai lễ tân cùng thao tác không thể gán một phòng cho hai booking trùng ngày.
  - **Trạng thái:** Chưa bắt đầu.
- [ ] **TASK-07.2: Quản trị Thanh toán tại Quầy & Check-out Sớm**
  - **Requirement IDs:** `BIZ-01`, `BIZ-02`
  - **Mô tả:** Ghi nhận thanh toán tiền mặt/chuyển khoản quầy, tính toán công nợ (`due`, `paid`, `balance`). Xử lý check-out sớm với audit log.
  - **Tiêu chí nghiệm thu:** Báo cáo đối soát doanh thu khớp 100% với lịch sử giao dịch.
  - **Trạng thái:** Chưa bắt đầu.

---

## GIAI ĐOẠN 8: DỊCH VỤ VẬN CHUYỂN & ĐIỀU PHỐI (GATE: MOCK INTEGRATION TESTS)
- [ ] **TASK-08.1: Mock Provider Adapter cho Đưa đón Sân bay**
  - **Requirement IDs:** `INT-01`
  - **Mô tả:** Xây dựng Transport Adapter interface, mock provider với bảng giá mẫu `4.000 VND/km`, tính khoảng cách và dự toán giá xe.
  - **Tiêu chí nghiệm thu:** Mock provider hoạt động ổn định, dễ dàng cắm adapter thật khi có API credentials.
  - **Trạng thái:** Chưa bắt đầu.
- [ ] **TASK-08.2: Quy trình Điều phối & Dashboard Tài xế**
  - **Requirement IDs:** `MAP-01`
  - **Mô tả:** Giao diện Dispatcher phân tài xế cho chuyến xe; Giao diện Driver cập nhật trạng thái chuyến (Đón, Hoàn thành, Hủy).
  - **Tiêu chí nghiệm thu:** Luồng phân xe và nhận cuốc hoạt động mượt mà.
  - **Trạng thái:** Chưa bắt đầu.

---

## GIAI ĐOẠN 9: QUAN SÁT & KHÔI PHỤC (GATE: DASHBOARD + RESTORE DRILL)
- [ ] **TASK-09.1: Structured Logging & Health Check Metrics**
  - **Requirement IDs:** `OBS-01`, `OBS-02`
  - **Mô tả:** Gán `request_id`, ghi log có cấu trúc dạng JSON, endpoint `/api/health`, giám sát connection pool và latency.
  - **Tiêu chí nghiệm thu:** Truy vết được toàn bộ vòng đời của một booking qua `request_id`.
  - **Trạng thái:** Chưa bắt đầu.
- [ ] **TASK-09.2: Chiến lược Sao lưu & Phục hồi Dữ liệu**
  - **Requirement IDs:** `REL-01`, `REL-02`
  - **Mô tả:** Kịch bản backup định kỳ, tài liệu hướng dẫn khôi phục thảm họa (Disaster Recovery Runbook).
  - **Tiêu chí nghiệm thu:** Diễn tập phục hồi database từ file dump thành công.
  - **Trạng thái:** Chưa bắt đầu.

---

## GIAI ĐOẠN 10: TĂNG CƯỜNG BẢO MẬT & KIỂM THỬ TẢI (GATE: SECURITY & LOAD REPORTS)
- [ ] **TASK-10.1: Security Hardening & Rate Limiting**
  - **Requirement IDs:** `SEC-05`, `SEC-06`, `SEC-08`, `PRIV-01`
  - **Mô tả:** Cấu hình Security Headers (CSP, HSTS), Rate limiter cho Auth & Booking endpoints, chạy `npm audit`.
  - **Tiêu chí nghiệm thu:** Chặn thành công brute-force và payload độc hại.
  - **Trạng thái:** Chưa bắt đầu.
- [ ] **TASK-10.2: Kịch bản Kiểm thử Tải & Khả năng Phục hồi Lỗi**
  - **Requirement IDs:** `TEST-02`, `TEST-03`, `SCALE-02`, `SCALE-03`
  - **Mô tả:** Viết kịch bản k6 mô phỏng traffic tìm kiếm và tranh chấp đặt phòng, kịch bản ngắt kết nối database đột ngột.
  - **Tiêu chí nghiệm thu:** Báo cáo tải chi tiết với số liệu $p95, p99$ thực tế; hệ thống tự phục hồi khi có sự cố.
  - **Trạng thái:** Chưa bắt đầu.

---

## GIAI ĐOẠN 11: SẴN SÀNG TRIỂN KHAI & BÀN GIAO (GATE: RELEASE CHECKLIST SIGN-OFF)
- [ ] **TASK-11.1: Hoàn thiện Tài liệu Vận hành & Runbook**
  - **Requirement IDs:** `OPS-01`, `OPS-02`, `AI-01`, `AI-03`
  - **Mô tả:** Tài liệu hướng dẫn triển khai Production, cấu hình Docker/Cloud, công bố năng lực tải chính xác.
  - **Tiêu chí nghiệm thu:** Ký duyệt Release Checklist hoàn chỉnh.
  - **Trạng thái:** Chưa bắt đầu.
