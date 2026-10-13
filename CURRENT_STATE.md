# TRẠNG THÁI HIỆN TẠI CỦA DỰ ÁN (CURRENT_STATE.MD)

**Cập nhật lần cuối:** 2026-10-13  
**Giai đoạn hiện tại:** Giai đoạn 1 — Hoàn thiện Thiết lập Bộ nhớ Dự án (Project Memory Setup)

---

## 1. CÔNG VIỆC ĐÃ HOÀN THÀNH

- [x] **Giai đoạn 0 (Tiếp nhận dự án):**
  - Kiểm tra môi trường cục bộ: Node.js `v20.19.4`, npm `10.8.2`, git `2.51.0`.
  - Phân tích trực tiếp toàn bộ 3 sheet trong file Excel [Resort_Ecosystem_Optimization_Backlog.xlsx](file:///d:/resort/Resort_Ecosystem_Optimization_Backlog.xlsx).
  - Thống nhất các quy tắc nghiệp vụ cốt lõi.
- [x] **Giai đoạn 1 (Thiết lập bộ nhớ dự án):**
  - Khởi tạo [AGENTS.md](file:///d:/resort/AGENTS.md), [PROJECT.md](file:///d:/resort/PROJECT.md), [CURRENT_STATE.md](file:///d:/resort/CURRENT_STATE.md), [TASKS.md](file:///d:/resort/TASKS.md).
- [x] **Roadmap Giai đoạn 5 (Booking API & Idempotency Engine):**
  - Xây dựng [src/server/services/booking.service.ts](file:///d:/resort/src/server/services/booking.service.ts):
    - Hỗ trợ `Idempotency-Key` (chống double-click/mạng lag, bảo toàn tồn kho khi retry) (`DB-02`, `BOOK-04`).
    - Thực thi Atomic Transaction: Đặt tồn kho + Tạo Booking + Khởi tạo cuốc xe đưa đón (nếu có) + Ghi AuditLog.
    - Cơ chế sinh mã đặt phòng chuẩn resort `AN-YYYYMM-XXXX`.
    - Triển khai State Machine đầy đủ: `CONFIRMED` $\rightarrow$ `CHECKED_IN` $\rightarrow$ `CHECKED_OUT` (hoặc `CANCELLED`, `NO_SHOW`).
    - Logic hủy phòng kết nối với `releaseInventoryAtomic` để hoàn trả tồn kho tức thời (`BOOK-06`).
    - Gán phòng vật lý khi Check-in với DB constraint chống gán trùng phòng cùng kỳ (`BOOK-07`).
  - Xây dựng các Route Handlers:
    - `POST /api/bookings`: Tạo đơn đặt phòng có hỗ trợ `Idempotency-Key` header.
    - `GET /api/bookings/[code]`: Xem chi tiết đơn đặt phòng với Anti-IDOR check.
    - `POST /api/bookings/[code]/cancel`: Hủy đặt phòng và hoàn trả tồn kho nguyên tử.
  - Bộ kiểm thử Idempotency & State Machine [tests/booking-idempotency.test.mjs](file:///d:/resort/tests/booking-idempotency.test.mjs): 5/5 tests PASS.
  - Toàn bộ hệ thống: **21/21 test cases PASS (100%)**, Next.js build hoàn thành 9/9 routes.

---

## 2. CÁC TỆP ĐÃ TẠO HOẶC CHỈNH SỬA

| File | Mô tả |
| :--- | :--- |
| [src/server/services/booking.service.ts](file:///d:/resort/src/server/services/booking.service.ts) | Service quản lý đặt phòng, Idempotency, State Machine và hủy phòng |
| [src/app/api/bookings/route.ts](file:///d:/resort/src/app/api/bookings/route.ts) | API tạo đặt phòng với Idempotency header |
| [src/app/api/bookings/[code]/route.ts](file:///d:/resort/src/app/api/bookings/[code]/route.ts) | API xem chi tiết đặt phòng (Anti-IDOR) |
| [src/app/api/bookings/[code]/cancel/route.ts](file:///d:/resort/src/app/api/bookings/[code]/cancel/route.ts) | API hủy phòng và hoàn trả tồn kho |
| [tests/booking-idempotency.test.mjs](file:///d:/resort/tests/booking-idempotency.test.mjs) | Bộ kiểm thử Idempotency retry, State Machine và Parallel Cancellation |
| [CURRENT_STATE.md](file:///d:/resort/CURRENT_STATE.md) & [TASKS.md](file:///d:/resort/TASKS.md) | Cập nhật tiến độ và bằng chứng kiểm thử Giai đoạn 5 |

---

## 3. KẾT QUẢ KIỂM THỬ THỰC TẾ

- **Full Test Suite:** 3 bộ test (`auth-rbac`, `inventory-concurrency`, `booking-idempotency`) $\rightarrow$ **21/21 test cases PASS (100%)**.
- **Next.js Production Build:** `npm run build` $\rightarrow$ 9/9 routes biên dịch thành công.

---

## 4. LỖI VÀ RỦI RO CÒN TỒN TẠI

- Cần xây dựng giao diện người dùng trực quan cao cấp (Customer UI) để khách hàng trải nghiệm toàn bộ luồng tìm kiếm và đặt phòng mượt mà.

---

## 5. NHIỆM VỤ TIẾP THEO

- **Roadmap Giai đoạn 6: Customer UI Flow (`PERF-01`, `PERF-02`):**
  - Xây dựng Design System Components cao cấp: Thanh tìm kiếm chọn ngày (`DateRangePicker`), Card phòng nghỉ dưỡng với hình ảnh sang trọng, Modal chi tiết phòng, Tóm tắt giá và Form xác nhận đặt phòng.
  - Xây dựng trang danh sách phòng `/rooms` và trang chi tiết `/rooms/[id]`.
  - Tích hợp gọi API `/api/rooms/availability` và `/api/bookings` với Idempotency Key tự sinh từ client.
  - Tối ưu hiệu năng Core Web Vitals, skeleton loading và trạng thái lỗi.





