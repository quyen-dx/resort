# TRẠNG THÁI HIỆN TẠI CỦA DỰ ÁN (CURRENT_STATE.MD)

**Cập nhật lần cuối:** 2026-10-13  
**Giai đoạn hiện tại:** Giai đoạn 8 — Dịch vụ Vận chuyển & Điều phối Chuyến đi (Hoàn thành 100%, sẵn sàng cho Giai đoạn 9)

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
  - Tokens Deep Emerald & Champagne Gold, SearchBar, RoomCard, BookingModal.
- [x] **Giai đoạn 7 (Nghiệp vụ Lễ tân & Vận hành Quầy):**
  - Gán phòng vật lý khi Check-in (`BOOK-07`), thu tiền quầy & công nợ (`BIZ-01`), check-out sớm & audit trail (`BIZ-02`), Dashboard Lễ tân với CSS Module riêng.
- [x] **Roadmap Giai đoạn 8 (Dịch vụ Vận chuyển & Điều phối Chuyến đi):**
  - Xây dựng Transport Adapter Interface (`ITransportAdapter`) và Mock Provider Adapter Sandbox (`MockTransportSandboxAdapter`) với đơn giá mẫu chuẩn mực `4.000 VND/km` (tuân thủ Decision Rule 5).
  - Xây dựng `TransportService` ([src/server/services/transport.service.ts](file:///d:/resort/src/server/services/transport.service.ts)):
    - Tổng hợp thống kê chuyến xe (chờ phân xe, đã gán, đang đón, hoàn thành).
    - Phân công tài xế (`assignDriver`) và xác thực role `DRIVER`.
    - Máy trạng thái vòng đời chuyến (`REQUESTED` $\rightarrow$ `ASSIGNED` $\rightarrow$ `IN_TRANSIT` $\rightarrow$ `COMPLETED`).
    - Giả lập lộ trình GPS xe điện di chuyển từ sân bay về resort (`simulateVehiclePing`).
  - Xây dựng các Route Handlers:
    - `GET /api/transport/rides`: Danh sách chuyến xe, tổng quan số liệu và danh sách tài xế.
    - `POST /api/transport/assign`: Điều phối viên phân tài xế cho chuyến xe.
    - `POST /api/transport/status`: Cập nhật trạng thái chuyến xe (đang đón, hoàn thành).
    - `POST /api/transport/simulate-ping`: Cập nhật tọa độ GPS giả lập của xe.
  - Xây dựng Màn hình Điều phối viên ([src/app/transport/dispatch/page.tsx](file:///d:/resort/src/app/transport/dispatch/page.tsx)) kèm CSS Module [dispatch.module.css](file:///d:/resort/src/app/transport/dispatch/dispatch.module.css).
  - Xây dựng Màn hình Tài xế Mobile Web ([src/app/transport/driver/page.tsx](file:///d:/resort/src/app/transport/driver/page.tsx)) kèm CSS Module [driver.module.css](file:///d:/resort/src/app/transport/driver/driver.module.css).
  - Bộ kiểm thử Mock Adapter Sandbox [tests/transport-mock.test.mjs](file:///d:/resort/tests/transport-mock.test.mjs): 5/5 tests PASS.
  - Toàn bộ hệ thống: **31/31 test cases PASS (100%)**, Next.js build hoàn thành **22/22 routes**.

---

## 2. CÁC TỆP ĐÃ TẠO HOẶC CHỈNH SỬA

| File | Mô tả |
| :--- | :--- |
| [src/server/services/transport.service.ts](file:///d:/resort/src/server/services/transport.service.ts) | Service quản lý vận chuyển, Mock Adapter Sandbox (4.000 ₫/km), State Machine |
| [src/app/api/transport/rides/route.ts](file:///d:/resort/src/app/api/transport/rides/route.ts) | API danh sách chuyến xe, tài xế và thống kê điều phối |
| [src/app/api/transport/assign/route.ts](file:///d:/resort/src/app/api/transport/assign/route.ts) | API phân tài xế cho chuyến xe đưa đón |
| [src/app/api/transport/status/route.ts](file:///d:/resort/src/app/api/transport/status/route.ts) | API cập nhật trạng thái vòng đời chuyến xe |
| [src/app/api/transport/simulate-ping/route.ts](file:///d:/resort/src/app/api/transport/simulate-ping/route.ts) | API giả lập cập nhật tọa độ GPS xe trên bản đồ |
| [src/app/transport/dispatch/page.tsx](file:///d:/resort/src/app/transport/dispatch/page.tsx) | Dashboard Điều phối viên (Dispatcher Fleet Management) |
| [src/app/transport/dispatch/dispatch.module.css](file:///d:/resort/src/app/transport/dispatch/dispatch.module.css) | Tệp CSS Module chuyên biệt cho Dashboard Điều phối |
| [src/app/transport/driver/page.tsx](file:///d:/resort/src/app/transport/driver/page.tsx) | Màn hình Tài xế Mobile Web (Driver Mission Portal) |
| [src/app/transport/driver/driver.module.css](file:///d:/resort/src/app/transport/driver/driver.module.css) | Tệp CSS Module chuyên biệt cho Màn hình Tài xế |
| [tests/transport-mock.test.mjs](file:///d:/resort/tests/transport-mock.test.mjs) | Bộ kiểm thử Mock Provider Adapter Sandbox và State Machine |
| [CURRENT_STATE.md](file:///d:/resort/CURRENT_STATE.md) & [TASKS.md](file:///d:/resort/TASKS.md) | Cập nhật tiến độ và bằng chứng kiểm thử Giai đoạn 8 |

---

## 3. KẾT QUẢ KIỂM THỬ THỰC TẾ

- **Full System Test Suites:** 5 bộ test (`auth-rbac`, `inventory-concurrency`, `booking-idempotency`, `reception-desk`, `transport-mock`) $\rightarrow$ **31/31 test cases PASS (100%)**.
- **Next.js Production Build:** `npm run build` $\rightarrow$ **22/22 routes biên dịch thành công**.

---

## 4. LỖI VÀ RỦI RO CÒN TỒN TẠI

- Cần bổ sung Structured JSON Logging với truy vết `request_id`, cảnh báo quá tải Connection Pool và Disaster Recovery Runbook (Giai đoạn 9).

---

## 5. NHIỆM VỤ TIẾP THEO

- **Roadmap Giai đoạn 9: Quan sát, Chỉ số & Khôi phục Thảm họa (`OBS-01`, `OBS-02`, `REL-01`, `REL-02`):**
  - Tích hợp Correlation/Request Tracing ID xuyên suốt vòng đời API.
  - Endpoint `/api/health` giám sát độ khả dụng cơ sở dữ liệu và dung lượng connection pool.
  - Kịch bản sao lưu tự động & tài liệu diễn tập phục hồi dữ liệu thảm họa (Disaster Recovery Runbook).
