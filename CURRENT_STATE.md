# TRẠNG THÁI HIỆN TẠI CỦA DỰ ÁN (CURRENT_STATE.MD)

**Cập nhật lần cuối:** 2026-10-13  
**Giai đoạn hiện tại:** Giai đoạn 7 — Nghiệp vụ Lễ tân & Vận hành Quầy (Hoàn thành 100%, sẵn sàng cho Giai đoạn 8)

---

## 1. CÔNG VIỆC ĐÃ HOÀN THÀNH

- [x] **Giai đoạn 0 (Tiếp nhận dự án):**
  - Kiểm tra môi trường cục bộ: Node.js `v20.19.4`, npm `10.8.2`, git `2.51.0`.
  - Phân tích trực tiếp toàn bộ 3 sheet trong file Excel [Resort_Ecosystem_Optimization_Backlog.xlsx](file:///d:/resort/Resort_Ecosystem_Optimization_Backlog.xlsx).
  - Thống nhất các quy tắc nghiệp vụ cốt lõi.
- [x] **Giai đoạn 1 (Thiết lập bộ nhớ dự án):**
  - Khởi tạo [AGENTS.md](file:///d:/resort/AGENTS.md), [PROJECT.md](file:///d:/resort/PROJECT.md), [CURRENT_STATE.md](file:///d:/resort/CURRENT_STATE.md), [TASKS.md](file:///d:/resort/TASKS.md).
- [x] **Roadmap Giai đoạn 7 (Nghiệp vụ Lễ tân & Vận hành Quầy):**
  - Xây dựng [src/server/services/reception.service.ts](file:///d:/resort/src/server/services/reception.service.ts):
    - Thủ tục Check-in: Gán số phòng vật lý kèm kiểm tra ràng buộc chống gán trùng phòng cùng kỳ (`BOOK-07`).
    - Thu tiền tại quầy resort: Ghi nhận thanh toán tiền mặt/thẻ/chuyển khoản, sinh số phiếu thu `RCT-YYYYMM-XXX`, tự động cập nhật công nợ (`due`, `paid`, `balance`) (`BIZ-01`).
    - Xử lý Check-out sớm: Ghi nhận ngày trả phòng thực tế (`actual_checkout_date`), chuyển phòng sang `CLEANING`, giải phóng tồn kho cho các đêm thừa và ghi Audit trail (`BIZ-02`).
  - Xây dựng các Route Handlers:
    - `GET /api/reception/desk`: Danh sách booking chờ check-in, đang lưu trú và danh sách phòng trống.
    - `POST /api/reception/check-in`: Gán phòng và hoàn tất check-in.
    - `POST /api/reception/payment`: Thu tiền tại quầy và xuất biên lai.
    - `POST /api/reception/check-out`: Xử lý check-out và giải phóng phòng vật lý.
  - Xây dựng Dashboard Lễ tân hoàn chỉnh [src/app/reception/page.tsx](file:///d:/resort/src/app/reception/page.tsx) với 3 tab tác nghiệp chuyên nghiệp (Khách đến Check-in, Khách đang lưu trú & Công nợ, Lịch sử phiếu thu đối soát).
  - Bộ kiểm thử nghiệp vụ Lễ tân [tests/reception-desk.test.mjs](file:///d:/resort/tests/reception-desk.test.mjs): 5/5 tests PASS.
  - Toàn bộ hệ thống: **26/26 test cases PASS (100%)**, Next.js build hoàn thành 16/16 routes.

---

## 2. CÁC TỆP ĐÃ TẠO HOẶC CHỈNH SỬA

| File | Mô tả |
| :--- | :--- |
| [src/server/services/reception.service.ts](file:///d:/resort/src/server/services/reception.service.ts) | Service quản lý nghiệp vụ lễ tân, thu tiền quầy, check-in/out |
| [src/app/api/reception/desk/route.ts](file:///d:/resort/src/app/api/reception/desk/route.ts) | API danh sách tác nghiệp quầy lễ tân |
| [src/app/api/reception/check-in/route.ts](file:///d:/resort/src/app/api/reception/check-in/route.ts) | API gán phòng vật lý và check-in |
| [src/app/api/reception/payment/route.ts](file:///d:/resort/src/app/api/reception/payment/route.ts) | API thu tiền tại quầy resort và xuất biên lai |
| [src/app/api/reception/check-out/route.ts](file:///d:/resort/src/app/api/reception/check-out/route.ts) | API check-out và audit check-out sớm |
| [src/app/reception/page.tsx](file:///d:/resort/src/app/reception/page.tsx) | Dashboard tác nghiệp lễ tân (Front Desk Operations) |
| [tests/reception-desk.test.mjs](file:///d:/resort/tests/reception-desk.test.mjs) | Bộ kiểm thử gán phòng, thu tiền quầy và audit trail |
| [CURRENT_STATE.md](file:///d:/resort/CURRENT_STATE.md) & [TASKS.md](file:///d:/resort/TASKS.md) | Cập nhật tiến độ và bằng chứng kiểm thử Giai đoạn 7 |

---

## 3. KẾT QUẢ KIỂM THỬ THỰC TẾ

- **Full System Test Suites:** 4 bộ test (`auth-rbac`, `inventory-concurrency`, `booking-idempotency`, `reception-desk`) $\rightarrow$ **26/26 test cases PASS (100%)**.
- **Next.js Production Build:** `npm run build` $\rightarrow$ **16/16 routes biên dịch thành công**.

---

## 4. LỖI VÀ RỦI RO CÒN TỒN TẠI

- Cần xây dựng Mock Adapter cho Dịch vụ xe đưa đón sân bay và màn hình điều phối chuyến đi cho Dispatcher/Driver (Giai đoạn 8).

---

## 5. NHIỆM VỤ TIẾP THEO

- **Roadmap Giai đoạn 8: Transport Service & Dispatcher Workflow (`MAP-01`, `INT-01`):**
  - Xây dựng Transport Mock Adapter Sandbox với đơn giá giả lập mẫu `4.000 VND/km`.
  - Màn hình Điều phối viên (Dispatcher Dashboard): Phân công tài xế cho các chuyến xe đón tiễn.
  - Màn hình Tài xế (Driver Mobile Web View): Tiếp nhận cuốc xe, cập nhật trạng thái chuyến (`REQUESTED` $\rightarrow$ `ASSIGNED` $\rightarrow$ `IN_TRANSIT` $\rightarrow$ `COMPLETED`).
  - Viết bài kiểm thử tích hợp Transport Adapter Sandbox.







