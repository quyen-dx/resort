# CHỈ DẪN VẬN HÀNH DÀNH CHO AI AGENT (AGENTS.MD)

Dự án: **Resort Management & Operations Ecosystem**  
Mục tiêu: Đảm bảo tính nhất quán kiến trúc, chất lượng mã nguồn, an toàn dữ liệu, kiểm thử nghiêm ngặt và tối ưu hóa sử dụng token/quota.

---

## 1. NGUYÊN TẮC TIẾT KIỆM TOKEN VÀ QUẢN LÝ NGỮ CẢNH (QUY TẮC BẮT BUỘC)

1. **Khởi động phiên làm việc:**
   - Luôn đọc `CURRENT_STATE.md` đầu tiên để nắm bắt trạng thái tức thời.
   - Chỉ đọc các phần liên quan trong `PROJECT.md` và nhiệm vụ mục tiêu trong `TASKS.md`.
   - **Tuyệt đối không** quét lại toàn bộ repository hay đọc lại file Excel `Resort_Ecosystem_Optimization_Backlog.xlsx`.
2. **Thao tác mã nguồn:**
   - Tìm kiếm chính xác tên file, hàm, component, endpoint trước khi mở file lớn.
   - Chỉ sửa đổi các khối mã liên quan trực tiếp đến nhiệm vụ hiện tại.
   - Không in toàn bộ source code, log dài hoặc payload lớn vào cửa sổ chat; chỉ hiển thị tóm tắt, diff hoặc đoạn code thay đổi.
3. **Kỷ luật cập nhật:**
   - Cập nhật tài liệu hiện có (`CURRENT_STATE.md`, `TASKS.md`), không tạo các file tóm tắt trùng lặp.
   - Cuối mỗi nhiệm vụ: Ghi rõ kết quả, file đã sửa, bằng chứng kiểm thử và bước tiếp theo.

---

## 2. QUY CHUẨN KIẾN TRÚC & CÔNG NGHỆ

- **Frontend & Server-Side:** Next.js (App Router), TypeScript, Vanilla CSS (hoặc design system module tinh gọn, không dùng Tailwind trừ khi có yêu cầu).
- **Backend API:** Next.js Route Handlers / Server Actions tuân thủ mô hình phân lớp (Presentation -> Service/Domain -> Repository/DB).
- **Cơ sở dữ liệu:** PostgreSQL, Prisma ORM (hoặc query builder có type an toàn).
- **Quản lý dữ liệu tiền tệ & thời gian:**
  - Tiền tệ: Lưu trữ dưới dạng `integer` đơn vị nhỏ nhất (VND) hoặc `Decimal`, **tuyệt đối không dùng float**.
  - Thời gian: Thống nhất timezone UTC trên database; hiển thị giờ địa phương (Asia/Ho_Chi_Minh - UTC+7) trên giao diện.
- **Xác thực & Phân quyền:**
  - 5 vai trò rõ rệt: `Customer`, `Receptionist`, `Driver`, `Dispatcher`, `Admin`.
  - Mặc định từ chối (`Default Deny`). Kiểm tra quyền tại Server/API, không chỉ ẩn nút trên UI.
  - Chống IDOR: Mọi truy vấn chi tiết đặt phòng, thông tin khách phải xác thực quyền sở hữu (`tenant/user ownership`).

---

## 3. QUY TẮC NGHIỆP VỤ BẤT BIẾN (DECISION RULES)

1. **Tồn kho & Overbooking:**
   - Đặt phòng theo **Loại phòng (Room Type)**, **Số lượng** và **Khoảng ngày**.
   - Kiểm tra tồn kho theo từng đêm (`nightly inventory`). Ngày check-out không tính là đêm lưu trú.
   - Kiểm tra và giữ tồn kho trong **Database Transaction với Atomic Conditional Update / Row-Level Lock**.
   - **First successful atomic commit wins**: Transaction nào commit trước giữ được phòng; các transaction còn lại trả về `SOLD_OUT` / `CONFLICT`.
2. **Idempotency & Retry:**
   - Mọi API tạo đặt phòng phải hỗ trợ `Idempotency-Key` để tránh double-booking khi mạng lag hoặc user double-click.
3. **Gán phòng vật lý:**
   - Khách không chọn số phòng vật lý khi đặt. Lễ tân gán số phòng cụ thể tại thời điểm Check-in với DB constraint chống gán trùng phòng cùng kỳ.
4. **Thanh toán MVP:**
   - 100% thanh toán tại quầy resort. Lưu trữ và audit: Số tiền phải trả (`amount_due`), đã trả (`amount_paid`), còn nợ (`balance`).
5. **Dịch vụ vận chuyển xe:**
   - Sử dụng Mock Adapter Sandbox; giá cước hiển thị là giả lập mẫu (`4.000 VND/km`). Không tuyên bố hợp tác chính thức nếu chưa có API hợp lệ.
6. **Đo đạc hiệu năng:**
   - Không tuyên bố hệ thống đáp ứng 1 triệu người dùng nếu chưa có kịch bản kiểm thử tải (k6/Artillery) với số liệu $p95, p99$ thực tế.

---

## 4. QUY TRÌNH NGHIỆM THU TỪNG NHIỆM VỤ (ACCEPTANCE PROTOCOL)

Mỗi nhiệm vụ trong `TASKS.md` khi triển khai phải đảm bảo 7 bước:
1. Xác định Mục tiêu & Requirement ID tương ứng trong backlog.
2. Liệt kê các file dự kiến thay đổi.
3. Viết mã nguồn tinh gọn, tuân thủ Clean Code và Type Safety.
4. Viết và chạy kiểm thử (Unit / Integration / Race condition).
5. Ghi lại kết quả kiểm thử thực tế (Test Evidence).
6. Rà soát rủi ro còn tồn tại.
7. Cập nhật `CURRENT_STATE.md` và `TASKS.md`. Chỉ đánh dấu hoàn thành khi có bằng chứng chạy thử thành công.
