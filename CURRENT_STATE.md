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
- [x] **Roadmap Giai đoạn 4 (Inventory Transaction Engine & Race-Safety):**
  - Xây dựng [src/server/services/inventory.service.ts](file:///d:/resort/src/server/services/inventory.service.ts):
    - Thuật toán `calculateStayNights`: kiểm tra ranh giới ngày, loại trừ ngày checkout (`BOOK-01`).
    - API kiểm tra tính khả dụng `checkAvailability` và route `/api/rooms/availability`.
    - Trái tim chống Overbooking: `reserveInventoryAtomic` thực hiện atomic conditional update trong transaction (`availableCount >= quantity`).
    - Tuân thủ quy tắc bất biến: **"First successful atomic commit wins"** (`BOOK-02`, `BOOK-03`).
    - Hàm giải phóng tồn kho nguyên tử `releaseInventoryAtomic` cho quy trình hủy phòng (`BOOK-06`).
  - Bộ kiểm thử Concurrency Gate Test [tests/inventory-concurrency.test.mjs](file:///d:/resort/tests/inventory-concurrency.test.mjs):
    - 5/5 unit tests kiểm chứng ranh giới ngày lưu trú.
    - 2/2 concurrency stress tests: 50 requests đồng thời tranh nhau 1 phòng cuối cùng (`Inventory = 1`) $\rightarrow$ Chính xác 1 request thành công, 49 requests nhận `SOLD_OUT`, tồn kho bảo toàn 100%, ZERO overbooking!
  - Toàn bộ test suite: **16/16 test cases PASS (100%)**.

---

## 2. CÁC TỆP ĐÃ TẠO HOẶC CHỈNH SỬA

| File | Mô tả |
| :--- | :--- |
| [src/server/services/inventory.service.ts](file:///d:/resort/src/server/services/inventory.service.ts) | Service quản lý tồn kho theo đêm & atomic conditional decrement |
| [src/app/api/rooms/availability/route.ts](file:///d:/resort/src/app/api/rooms/availability/route.ts) | API kiểm tra tính khả dụng phòng theo ngày |
| [tests/inventory-concurrency.test.mjs](file:///d:/resort/tests/inventory-concurrency.test.mjs) | Bộ kiểm thử Concurrency Gate Test (`Inventory = 1`) |
| [CURRENT_STATE.md](file:///d:/resort/CURRENT_STATE.md) & [TASKS.md](file:///d:/resort/TASKS.md) | Cập nhật tiến độ và bằng chứng kiểm thử Giai đoạn 4 |

---

## 3. KẾT QUẢ KIỂM THỬ THỰC TẾ

- **Full Test Suite:** `node --test tests/auth-rbac.test.mjs tests/inventory-concurrency.test.mjs` $\rightarrow$ **16/16 test cases PASS (100%)**.
- **Next.js Production Build:** `npm run build` $\rightarrow$ 8/8 routes biên dịch thành công.

---

## 4. LỖI VÀ RỦI RO CÒN TỒN TẠI

- Cần tích hợp `Idempotency-Key` ở tầng API tạo booking (Giai đoạn 5) để tránh double-booking khi client retry.

---

## 5. NHIỆM VỤ TIẾP THEO

- **Roadmap Giai đoạn 5: Booking API & Idempotency (`DB-02`, `BOOK-04`, `BOOK-05`, `BOOK-06`):**
  - Xây dựng Booking Creation Service với xử lý `Idempotency-Key`.
  - Triển khai State Machine cho Booking: `CONFIRMED` $\rightarrow$ `CHECKED_IN` $\rightarrow$ `CHECKED_OUT` (hoặc `CANCELLED`, `NO_SHOW`).
  - Logic hủy phòng kết nối với `releaseInventoryAtomic` để hoàn trả tồn kho tức thời.
  - Viết bài kiểm thử Idempotency retry và Race condition giữa Hủy phòng & Đặt phòng mới.




