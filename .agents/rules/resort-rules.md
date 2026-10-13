# WORKSPACE INSTRUCTIONS — RESORT ECOSYSTEM

Áp dụng tự động các quy tắc từ [AGENTS.md](file:///d:/resort/AGENTS.md):

1. **Khởi động phiên:** Đọc [CURRENT_STATE.md](file:///d:/resort/CURRENT_STATE.md) trước, sau đó chỉ đọc phần cần thiết trong [PROJECT.md](file:///d:/resort/PROJECT.md) và [TASKS.md](file:///d:/resort/TASKS.md). Không đọc lại toàn bộ Excel hay quét toàn bộ repo.
2. **Tiết kiệm token:** Chỉ mở và sửa các file có liên quan trực tiếp. Không in toàn bộ source code lớn hay log dài vào cửa sổ chat.
3. **Quy tắc nghiệp vụ:**
   - First successful atomic commit wins (ngăn chặn overbooking bằng atomic DB update).
   - Đặt phòng theo loại phòng, tính tồn kho theo từng đêm (`nightly inventory`).
   - Thanh toán 100% tại quầy resort trong MVP.
   - Xe đưa đón dùng Mock Adapter Sandbox (giá mẫu 4.000 VND/km).
   - Gán phòng vật lý tại quầy check-in.
4. **Nghiệm thu:** Mỗi task chỉ đánh dấu hoàn thành khi có bằng chứng chạy test thành công (`Test Evidence`).
