# WORKLOAD SPECIFICATION & SLO BENCHMARK (SCALE-01, AI-03)

**Dự án:** Resort Management & Operations Ecosystem  
**Mục tiêu:** Định nghĩa mô hình tải thực tế, chỉ số mục tiêu SLO/SLA và kịch bản benchmark chuẩn bị cho công cụ kiểm thử tải (k6). Tuyệt đối không tuyên bố số liệu chịu tải nếu chưa chạy bài test đại diện.

---

## 1. NGUYÊN TẮC PHÂN TÁCH LUỒNG TẢI (TRAFFIC SPLIT)

Hệ thống phân tách rõ 2 luồng truy cập với đặc tính tài nguyên hoàn toàn khác nhau:
1. **Browse & Search Traffic (Read-heavy):** Chiếm ~90% tổng lưu lượng. Các truy vấn xem danh sách phòng, xem chi tiết, tra cứu tiện ích. Được tối ưu bằng HTTP caching, connection pool và index tối ưu.
2. **Booking Transaction & Concurrency Traffic (Write-heavy & Lock-sensitive):** Chiếm ~10% tổng lưu lượng. Các transaction trừ tồn kho, giữ phòng tức thời và tạo thanh toán. Đây là điểm thắt cổ chai chính cần kiểm soát race conditions và DB row locks.

---

## 2. CHỈ SỐ MỤC TIÊU VẬN HÀNH (SERVICE LEVEL OBJECTIVES - SLO)

| Loại thao tác | Lưu lượng dự kiến (RPS) | $p95$ Latency | $p99$ Latency | Tỷ lệ lỗi tối đa (Error Rate) |
| :--- | :--- | :--- | :--- | :--- |
| **Trang chủ & Static Assets** | 200 - 500 RPS | $< 100\text{ ms}$ | $< 250\text{ ms}$ | $< 0.01\%$ |
| **Tra cứu phòng theo ngày** | 50 - 150 RPS | $< 150\text{ ms}$ | $< 350\text{ ms}$ | $< 0.05\%$ |
| **Booking Transaction (Atomic Commit)** | 10 - 30 RPS | $< 200\text{ ms}$ | $< 500\text{ ms}$ | $0\%$ mất dữ liệu / $0\%$ overbooking |
| **Lễ tân Check-in / Phân phòng** | 5 - 15 RPS | $< 180\text{ ms}$ | $< 400\text{ ms}$ | $< 0.01\%$ |

---

## 3. MÔ HÌNH KIỂM THỬ TRANH CHẤP PHÒNG (CONTENTION TEST SCENARIOS)

1. **Kịch bản "Tranh phòng cuối cùng" (`Inventory = 1`):**
   - Số lượng người dùng đồng thời: 50 Virtual Users (VU).
   - Mục tiêu: Tất cả cùng submit booking cho cùng 1 loại phòng vào cùng 1 đêm lưu trú trong cùng 1 giây.
   - Kết quả bắt buộc: Đúng 1 request thành công (`CONFIRMED`); 49 requests nhận phản hồi `SOLD_OUT` / `409 Conflict`.
2. **Kịch bản Tải tăng đột biến (Spike Test):**
   - Lưu lượng tăng gấp 5 lần trong 30 giây (mô phỏng mở đợt khuyến mãi mùa du lịch).
   - Hệ thống áp dụng Graceful Degradation & Connection Queue, không sập database pool.
