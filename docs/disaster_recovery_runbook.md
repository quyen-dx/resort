# KỊCH BẢN PHỤC HỒI THẢM HỌA DỮ LIỆU (DISASTER RECOVERY RUNBOOK - REL-02)

**Dự án:** An Nam Resort Management & Operations Ecosystem  
**Mục tiêu bảo đảm tính sẵn sàng & toàn vẹn:**
* **RTO (Recovery Time Objective):** $\le 30$ phút từ khi phát hiện sự cố đến khi hệ thống tiếp nhận khách trở lại.
* **RPO (Recovery Point Objective):** $\le 1$ giờ (dữ liệu sao lưu định kỳ theo giờ).

---

## 1. PHÂN CẤP SỰ CỐ VÀ QUY TRÌNH KÍCH HOẠT

| Cấp độ | Tình huống | Hành động phản ứng |
| :--- | :--- | :--- |
| **P1 - Critical** | Database PostgreSQL bị hỏng file lưu trữ (corruption), không khởi động được | Kích hoạt quy trình khôi phục dữ liệu từ bản dump gần nhất |
| **P2 - High** | Mất kết nối mạng / Server sập nguồn đột ngột | Kiểm tra tiến trình tái kết nối, xác minh tính toàn vẹn tồn kho |
| **P3 - Medium** | Connection pool bị quá tải, latency $> 1000$ms | Khởi động lại container backend, dọn dẹp kết nối treo (`idle connections`) |

---

## 2. QUY TRÌNH SAO LƯU ĐỊNH KỲ (BACKUP STRATEGY - REL-01)

1. **Lịch sao lưu tự động:**
   * Dump toàn bộ cơ sở dữ liệu mỗi 6 giờ (`0 */6 * * *`).
   * Sử dụng lệnh `pg_dump` nén gzip, đặt tên có timestamp định dạng chuẩn: `resort_backup_YYYYMMDD_HHMMSS.sql.gz`.
   * Tính toán và lưu trữ mã băm kiểm tra tính toàn vẹn `SHA256 Checksum`.
2. **Kịch bản thực thi:**
   * Môi trường Windows: `powershell -ExecutionPolicy Bypass -File scripts/backup-db.ps1`
   * Môi trường Linux / Docker: `./scripts/backup-db.sh`
3. **Lưu trữ ngoài trang (Off-site storage):**
   * Đẩy file dump lên S3/GCS Cold Storage có kích hoạt chính sách khóa không cho xóa trong 30 ngày (WORM / Object Lock).

---

## 3. CÁC BƯỚC KHÔI PHỤC CƠ SỞ DỮ LIỆU (RESTORE DRILL - REL-02)

### Bước 1: Cô lập hệ thống tạm thời
Ngăn chặn các request mới từ khách hàng bằng cách chuyển hướng sang trang bảo trì hoặc dừng tạm thời container backend:
```bash
docker stop resort_app
```

### Bước 2: Xác thực tính toàn vẹn của tệp sao lưu (Checksum Verification)
Trước khi khôi phục, kiểm tra mã băm SHA256 xem file có bị hỏng trong quá trình truyền tải hay không:
```bash
# Windows
Get-FileHash -Path backups/resort_backup_20261013_120000.sql -Algorithm SHA256

# Linux
sha256sum backups/resort_backup_20261013_120000.sql.gz
```

### Bước 3: Thực thi khôi phục cơ sở dữ liệu
```bash
# Windows
powershell -ExecutionPolicy Bypass -File scripts/restore-db.ps1 -BackupFile backups/resort_backup_20261013_120000.sql -Force

# Linux / Docker
./scripts/restore-db.sh backups/resort_backup_20261013_120000.sql.gz --force
```

### Bước 4: Kiểm tra và đối soát tính toàn vẹn nghiệp vụ sau khôi phục (Data Integrity Audit)
Chạy script kiểm tra 3 bất biến nghiệp vụ:
1. **Kiểm tra công nợ (BIZ-01):**
   $$\text{balance} = \text{amountDue} - \text{amountPaid}$$
   Không có bản ghi nào `balance < 0` hoặc sai lệch so với tổng phiếu thu `PaymentTransaction`.
2. **Kiểm tra tồn kho đêm lưu trú (BOOK-01, BOOK-02):**
   $$\text{availableCount} + \text{reservedCount} = \text{totalCapacity}$$
   Không có dòng tồn kho nào có `availableCount < 0`.
3. **Kiểm tra phòng vật lý (BOOK-07):**
   Không có 2 booking nào cùng được gán 1 phòng vật lý trong cùng khoảng ngày lưu trú.

### Bước 5: Mở lại cổng phục vụ và giám sát qua Dashboard
Khởi động lại backend app và mở [Dashboard Sức khỏe Hệ thống](file:///d:/resort/src/app/admin/system-health/page.tsx) tại `/admin/system-health` để theo dõi độ trễ cơ sở dữ liệu, bộ nhớ RAM và xác nhận trạng thái **`HEALTHY`**.
