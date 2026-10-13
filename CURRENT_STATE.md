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
- [x] **Roadmap Giai đoạn 6 (Giao diện Khách hàng & Design System):**
  - Xây dựng Design System chuẩn resort thượng lưu (Deep Emerald, Champagne Gold, Soft Sand White):
    - [src/client/components/layout/navbar.tsx](file:///d:/resort/src/client/components/layout/navbar.tsx): Header thương hiệu cao cấp với logo độc bản và điều hướng nhanh.
    - [src/client/components/ui/badge.tsx](file:///d:/resort/src/client/components/ui/badge.tsx): Tag phân loại hạng phòng, tiện ích và trạng thái.
    - [src/client/components/booking/search-bar.tsx](file:///d:/resort/src/client/components/booking/search-bar.tsx): Thanh tìm kiếm ngày nhận/trả phòng, tự động tính số đêm và bộ lọc số lượng khách/phòng.
    - [src/client/components/booking/room-card.tsx](file:///d:/resort/src/client/components/booking/room-card.tsx): Trưng bày phòng nghỉ dưỡng với hình ảnh sống động, tiện ích đặc quyền và giá tiền VND định dạng chuẩn.
    - [src/client/components/booking/booking-modal.tsx](file:///d:/resort/src/client/components/booking/booking-modal.tsx): Hộp thoại đặt phòng hoàn chỉnh tích hợp tự sinh `Idempotency-Key`, tùy chọn xe đón sân bay (`4.000 ₫/km`), thông báo thanh toán tại quầy (`BIZ-01`), và màn hình xác nhận mã đặt phòng `AN-YYYYMM-XXXX`.
  - Cập nhật [src/app/page.tsx](file:///d:/resort/src/app/page.tsx): Trang chủ với SearchBar nhúng trực tiếp, 3 trụ cột trải nghiệm thượng lưu (Villa hồ bơi, Spa & Wellness, Ẩm thực biển), và cam kết không overbooking.
  - Xây dựng [src/app/rooms/page.tsx](file:///d:/resort/src/app/rooms/page.tsx): Trang danh mục phòng đầy đủ với bộ lọc ngày và popup đặt phòng tức thời.
  - Tích hợp [src/server/services/room.service.ts](file:///d:/resort/src/server/services/room.service.ts) và API `/api/rooms`.
  - Next.js build: 11/11 routes thành công trong 1.2s, Core Web Vitals tối ưu với CSS thuần và Zero third-party UI bloat.

---

## 2. CÁC TỆP ĐÃ TẠO HOẶC CHỈNH SỬA

| File | Mô tả |
| :--- | :--- |
| [src/client/components/layout/navbar.tsx](file:///d:/resort/src/client/components/layout/navbar.tsx) | Navigation bar mang nhận diện sang trọng An Nam Resort |
| [src/client/components/booking/search-bar.tsx](file:///d:/resort/src/client/components/booking/search-bar.tsx) | Thanh tìm kiếm ngày lưu trú và số lượng khách/phòng |
| [src/client/components/booking/room-card.tsx](file:///d:/resort/src/client/components/booking/room-card.tsx) | Card hiển thị chi tiết phòng, giá tiền và nút đặt phòng |
| [src/client/components/booking/booking-modal.tsx](file:///d:/resort/src/client/components/booking/booking-modal.tsx) | Modal đặt phòng với Idempotency, xe đón sân bay, thông báo thanh toán quầy |
| [src/app/rooms/page.tsx](file:///d:/resort/src/app/rooms/page.tsx) | Trang danh mục biệt thự & phòng nghỉ dưỡng |
| [src/app/page.tsx](file:///d:/resort/src/app/page.tsx) | Trang chủ hoàn thiện trải nghiệm khách hàng |
| [src/server/services/room.service.ts](file:///d:/resort/src/server/services/room.service.ts) & [src/app/api/rooms/route.ts](file:///d:/resort/src/app/api/rooms/route.ts) | Service và API danh mục phòng nghỉ dưỡng |
| [CURRENT_STATE.md](file:///d:/resort/CURRENT_STATE.md) & [TASKS.md](file:///d:/resort/TASKS.md) | Cập nhật tiến độ và bằng chứng kiểm thử Giai đoạn 6 |

---

## 3. KẾT QUẢ KIỂM THỬ THỰC TẾ

- **Full System Test Suites:** 21/21 test cases PASS (100%).
- **Next.js Production Build:** `npm run build` $\rightarrow$ **11/11 routes biên dịch thành công** (trang tĩnh `/` và `/rooms` prerender thành công).

---

## 4. LỖI VÀ RỦI RO CÒN TỒN TẠI

- Cần xây dựng màn hình nghiệp vụ Lễ tân (Reception Dashboard) để nhân viên thực hiện check-in, gán phòng vật lý và thu tiền tại quầy (Giai đoạn 7).

---

## 5. NHIỆM VỤ TIẾP THEO

- **Roadmap Giai đoạn 7: Reception Dashboard & Vận hành Quầy (`BOOK-07`, `BIZ-01`, `BIZ-02`):**
  - Màn hình Lễ tân quản lý danh sách check-in/check-out trong ngày.
  - Quy trình gán số phòng vật lý khi Check-in (chống gán trùng phòng).
  - Thu tiền tại quầy resort: Tạo phiếu thu (`PaymentTransaction`), quản lý công nợ (`due`, `paid`, `balance`).
  - Xử lý Check-out sớm (`actual_checkout_at`) và Audit trail.






