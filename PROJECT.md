# TỔNG QUAN DỰ ÁN (PROJECT.MD)

**Dự án:** Hệ thống Website Quản lý & Vận hành Resort (Resort Management & Operations Ecosystem)  
**Tài liệu gốc:** `Resort_Ecosystem_Optimization_Backlog.xlsx`  
**Trạng thái phê duyệt:** Đã chốt phân tích Giai đoạn 0.

---

## 1. MỤC TIÊU VÀ PHẠM VI HỆ THỐNG

Xây dựng hệ thống quản lý và vận hành toàn diện cho resort chuẩn cao cấp, hỗ trợ 2 mảng nghiệp vụ chính:
1. **Trải nghiệm Khách hàng (Customer Experience):** Khám phá phòng, tra cứu tiện ích, đặt phòng theo loại phòng/khoảng ngày, đặt xe đón tiễn sân bay, quản lý lịch sử đặt phòng.
2. **Vận hành Nội bộ (Resort Operations):**
   - **Lễ tân (Reception):** Quản lý lượt check-in/check-out, phân gán số phòng vật lý, thu tiền & quản lý hóa đơn công nợ tại quầy.
   - **Vận chuyển (Transport - Driver & Dispatcher):** Điều phối xe đưa đón, theo dõi lịch trình đưa đón sân bay (sandbox mock).
   - **Quản trị (Admin):** Quản lý danh mục loại phòng, cấu hình giá, quản lý người dùng & phân quyền, xem nhật ký kiểm toán (audit log).

---

## 2. STACK CÔNG NGHỆ CHUẨN HÓA

- **Framework Web & API:** Next.js (App Router), TypeScript (Strict Mode).
- **Styling:** CSS Modules / Vanilla CSS hiện đại (Design System đồng bộ, cao cấp, hỗ trợ Dark/Light và Responsive toàn diện).
- **Cơ sở dữ liệu:** PostgreSQL.
- **ORM / Query Engine:** Prisma Client / Type-safe SQL migrations.
- **Xác thực & Bảo mật:**
  - Password Hash: Argon2id hoặc Bcrypt (cost factor >= 12).
  - Session Management: Cookie `HttpOnly`, `Secure` (HTTPS), `SameSite=Lax/Strict`.
  - Server-side RBAC middleware và service-level authorization.
- **Kiểm thử:** Vitest / Playwright (E2E) & k6 (Kiểm thử tải và race condition).
- **Đa ngôn ngữ:** Tiếng Việt (mặc định) và Tiếng Anh (i18n).

---

## 3. MA TRẬN VAI TRÒ NGƯỜI DÙNG (USER ROLES)

| Vai trò | Phạm vi & Trách nhiệm |
| :--- | :--- |
| **Customer** | Tìm kiếm phòng, tạo booking (hỗ trợ Guest & Tài khoản), xem lịch sử đặt phòng của chính mình, yêu cầu xe đón tiễn. |
| **Receptionist** | Xem danh sách check-in/out trong ngày, gán số phòng vật lý khi khách đến, ghi nhận thanh toán tại quầy, xử lý check-out sớm. |
| **Driver** | Xem danh sách chuyến xe được phân công, cập nhật trạng thái chuyến (Đón, Đang chạy, Hoàn thành), gửi tọa độ/vị trí mẫu. |
| **Dispatcher** | Điều phối danh sách xe, phân tài xế cho booking xe của khách, giám sát chuyến đi. |
| **Admin** | Quản trị toàn quyền: Cấu hình giá, tồn kho loại phòng, tài khoản nhân viên, xem báo cáo doanh thu & audit log. |

---

## 4. QUY TẮC NGHIỆP VỤ ĐÃ PHÊ DUYỆT

1. **Đặt phòng & Tồn kho:**
   - Đặt theo Loại phòng (`RoomType`), số lượng phòng và khoảng ngày.
   - Tính tồn kho theo từng đêm lưu trú (`nightly_inventory`). Ngày trả phòng không tính là đêm ở.
   - Tránh Overbooking bằng Atomic Conditional Decrement trong Database Transaction:
     ```sql
     UPDATE room_type_inventory
     SET available_count = available_count - :quantity
     WHERE room_type_id = :type_id AND date = :night_date AND available_count >= :quantity;
     ```
   - Nếu bất kỳ đêm nào trong khoảng thời gian không đủ tồn kho $\rightarrow$ Rollback toàn bộ và trả lỗi `SOLD_OUT`.
2. **Gán phòng vật lý:**
   - Thực hiện tại thời điểm Check-in. Có ràng buộc kiểm tra phòng vật lý chưa được gán cho booking khác có trùng khoảng ngày lưu trú.
3. **Thanh toán tại Resort:**
   - Không tích hợp thanh toán online giai đoạn MVP.
   - Hệ thống theo dõi 3 trường số: `amount_due`, `amount_paid`, `balance`.
   - Mọi thao tác thu tiền tại quầy đều ghi nhận `payment_transactions` và audit actor.
4. **Hủy phòng & No-Show & Check-out sớm:**
   - Hủy phòng: Khách có thể tự hủy miễn phí trước 48 giờ so với giờ check-in quy định.
   - No-Show: Nếu quá 23:59 ngày check-in mà khách chưa đến, chuyển trạng thái `NO_SHOW`, tự động giải phóng tồn kho từ đêm thứ 2 trở đi.
   - Check-out sớm: Ghi nhận `actual_checkout_at`, lễ tân tính toán lại số đêm thực tế đã ở và cập nhật số tiền phải trả.
5. **Dịch vụ Xe đưa đón:**
   - Tích hợp qua Interface Adapter với Mock Provider Sandbox.
   - Mức giá giả lập mẫu: `4.000 VND/km`.

---

## 5. TÍCH HỢP BÊN NGOÀI & TRẠNG THÁI XÁC MINH

- **VinFast / Xanh SM API:** Trạng thái: **Sandbox Mock**. Chưa có hợp đồng & thông tin ủy quyền chính thức.
- **Bản đồ & Tọa độ xe:** Trạng thái: **Client Geolocation / Mock Route Adapter**. Không phụ thuộc trực tiếp vào API Google Maps trả phí.
- **Thanh toán trực tuyến:** Trạng thái: **Không kích hoạt trong MVP**.
