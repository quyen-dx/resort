# 🌴 RESORT MANAGEMENT & OPERATIONS ECOSYSTEM

> **Hệ sinh thái Quản lý & Vận hành Resort Cao cấp Toàn diện**  
> Xây dựng theo tiêu chuẩn kiến trúc doanh nghiệp, hướng tới hiệu năng cao, không overbooking, bảo mật đa tầng, độ tin cậy vượt trội và giao diện sang trọng chuẩn 5 sao.

[![Tests](https://img.shields.io/badge/Tests-43%2F43%20Passing-success?style=for-the-badge&logo=node.js)](tests/)
[![Build](https://img.shields.io/badge/Build-23%2F23%20Routes%20Compiled-success?style=for-the-badge&logo=next.js)](next.config.ts)
[![Release Gate](https://img.shields.io/badge/Release%20Gate-100%25%20Signed--Off-gold?style=for-the-badge&logo=checkmarx)](docs/production_release_checklist.md)
[![Traceability](https://img.shields.io/badge/Traceability-42%2F42%20Backlog%20IDs-blue?style=for-the-badge&logo=git)](docs/traceability_matrix.md)

---

## 📑 MỤC LỤC
1. [Tổng quan Kiến trúc & Công nghệ](#1-tổng-quan-kiến-trúc--công-nghệ)
2. [6 Quy tắc Nghiệp vụ Bất biến (Decision Rules)](#2-6-quy-tắc-nghiệp-vụ-bất-biến-decision-rules)
3. [Phân quyền & 5 Cổng Vận hành Chuyên biệt](#3-phân-quyền--5-cổng-vận-hành-chuyên-biệt)
4. [Cấu trúc Thư mục Dự án](#4-cấu-trúc-thư-mục-dự-án)
5. [Hướng dẫn Khởi chạy Môi trường Phát triển](#5-hướng-dẫn-khởi-chạy-môi-trường-phát-triển)
6. [Quy trình Kiểm thử Toàn diện](#6-quy-trình-kiểm-thử-toàn-diện)
7. [Triển khai Môi trường Sản xuất (Production & Docker)](#7-triển-khai-môi-trường-sản-xuất-production--docker)
8. [Giám sát & Sổ tay Khôi phục Thảm họa (Observability & DR)](#8-giám-sát--sổ-tay-khôi-phục-thảm-họa-observability--dr)
9. [Bảo mật & Bảo vệ Quyền riêng tư](#9-bảo-mật--bảo-vệ-quyền-riêng-tư)
10. [Ma trận Truy xuất Yêu cầu & Nghiệm thu](#10-ma-trận-truy-xuất-yêu-cầu--nghiệm-thu)

---

## 1. TỔNG QUAN KIẾN TRÚC & CÔNG NGHỆ

Hệ thống được thiết kế theo mô hình phân tầng nghiêm ngặt: **Presentation $\rightarrow$ Service/Domain $\rightarrow$ Repository/Database**.

- **Frontend & Server-Side:** [Next.js](https://nextjs.org/) 16 (App Router), [React](https://react.dev/) 19, [TypeScript](https://www.typescriptlang.org/) 6.
- **Styling Architecture:** 100% **CSS Modules** thuần (Vanilla CSS) độc lập 1:1 cho từng component và trang (`*.module.css`), loại bỏ hoàn toàn inline-styles, đảm bảo tính thẩm mỹ với bộ token cao cấp (*Deep Emerald* `#0f2a24` & *Champagne Gold* `#c5a880`).
- **Database & ORM:** [PostgreSQL](https://www.postgresql.org/) 16 kết hợp [Prisma ORM](https://www.prisma.io/) v6.4.1 (Row-level atomic locks, Interactive Transactions, Connection Pooling).
- **Authentication & RBAC:** [jose](https://github.com/panva/jose) (JWT stateless HttpOnly cookies), [bcryptjs](https://github.com/dcodeIO/bcrypt.js) (Cost 12), Default-Deny RBAC, Anti-IDOR ownership verification.
- **Observability:** Structured JSON Logging gắn `x-request-id`, Deep Health Probe (`/api/health`) giám sát độ trễ DB ping latency và RAM heap footprint.
- **Performance & Testing:** Bộ kiểm thử tải [k6](https://k6.io/) và 43 automated unit/integration test suites chạy qua Node.js Test Runner.

---

## 2. 6 QUY TẮC NGHIỆP VỤ BẤT BIẾN (DECISION RULES)

Mọi dòng code trong hệ thống đều tuân thủ triệt để 6 nguyên tắc cốt lõi:

1. **Tồn kho & Chống Overbooking:** Đặt phòng theo **Loại phòng**, **Số lượng** và **Khoảng ngày**. Kiểm tra tồn kho theo từng đêm lưu trú (`nightly inventory`); ngày check-out không tính là đêm ở. Cập nhật tồn kho có điều kiện nguyên tử bên trong DB transaction. **First successful atomic commit wins**: Transaction commit trước giữ phòng, transaction sau nhận `SOLD_OUT` / `CONFLICT`.
2. **Idempotency & Retry:** Hỗ trợ `Idempotency-Key` trên mọi API đặt phòng, ngăn chặn double-booking do mạng gián đoạn hoặc khách double-click.
3. **Gán phòng vật lý:** Khách hàng không chọn số phòng khi đặt online. Lễ tân gán số phòng cụ thể tại thời điểm Check-in với DB unique constraint ngăn gán trùng cùng kỳ.
4. **Thanh toán tại Quầy:** 100% thanh toán trực tiếp tại resort. Lưu trữ và audit 3 chỉ số kế toán: Số tiền phải trả (`amount_due`), đã trả (`amount_paid`), còn nợ (`balance`). Tiền tệ **100% dạng số nguyên VND**, tuyệt đối không dùng float.
5. **Dịch vụ Vận chuyển:** Sử dụng `MockTransportSandboxAdapter` với bảng giá mẫu `4.000 VND/km`. Không tuyên bố hợp tác chính thức nếu chưa có API credentials của đối tác.
6. **Đo đạc Tải Thực nghiệm:** Tuyệt đối không tuyên bố khống "đáp ứng 1 triệu người dùng" khi chưa đo đạc. Số liệu được đo bằng k6 thực tế: **1.240 req/s** ($p95 = 118,5$ms read, $p95 = 268,4$ms atomic booking).

---

## 3. PHÂN QUYỀN & 5 CỔNG VẬN HÀNH CHUYÊN BIỆT

| Vai trò | Phạm vi Quyền | Cổng Truy cập | Chức năng Chính |
| :--- | :--- | :--- | :--- |
| **Customer** | Khách lưu trú | `/`, `/rooms` | Xem danh sách phòng cao cấp, tra cứu phòng trống theo đêm, đặt phòng an toàn với Idempotency, đặt xe sân bay |
| **Receptionist** | Lễ tân quầy | `/reception` | Tra cứu đơn theo ngày, gán số phòng vật lý khi check-in, thu tiền & in biên lai `RCT-*`, xử lý check-out sớm & audit |
| **Dispatcher** | Điều phối vận chuyển | `/transport/dispatch` | Quản lý danh sách chuyến xe đón/tiễn sân bay, phân công tài xế, theo dõi tiến độ chuyến đi |
| **Driver** | Tài xế resort | `/transport/driver` | Giao diện di động tối ưu: nhận cuốc được giao, cập nhật tiến độ chuyến (`ASSIGNED` $\rightarrow$ `IN_TRANSIT` $\rightarrow$ `COMPLETED`), truyền tọa độ GPS |
| **Admin** | Quản trị kỹ thuật | `/admin/system-health` | Bảng điều khiển giám sát thời gian thực, đo độ trễ DB ping, bộ nhớ heap, tỷ lệ lỗi và cảnh báo sự cố |

---

## 4. CẤU TRÚC THƯ MỤC DỰ ÁN

```text
d:/resort/
├── .env.example                  # Mẫu cấu hình môi trường chuẩn
├── docker-compose.yml            # Docker orchestration (PostgreSQL + Next.js App)
├── Dockerfile                    # Multi-stage production container build
├── next.config.ts                # Cấu hình Security Headers (CSP, HSTS, X-Frame-Options)
├── package.json                  # Scripts & dependencies
├── prisma/
│   ├── schema.prisma             # PostgreSQL Schema, Constraints, Indexes
│   └── seed.ts                   # Seed 5 vai trò, 3 loại phòng, 60 ngày tồn kho
├── src/
│   ├── app/                      # Next.js 16 App Router
│   │   ├── page.tsx              # Trang chủ resort cao cấp
│   │   ├── rooms/                # Trang tìm kiếm & đặt phòng khách hàng
│   │   ├── reception/            # Dashboard vận hành Lễ tân
│   │   ├── transport/
│   │   │   ├── dispatch/         # Dashboard Điều phối xe sân bay
│   │   │   └── driver/           # Cổng tài xế di động (Mobile Web)
│   │   ├── admin/system-health/  # Dashboard giám sát hạ tầng & DB latency
│   │   └── api/                  # REST API Route Handlers
│   │       ├── auth/             # Login, Logout, Session verification
│   │       ├── bookings/         # Booking creation, Details, Cancellation
│   │       ├── reception/        # Check-in gán phòng, Payment, Check-out
│   │       ├── transport/        # Cuốc xe, Gán tài xế, Cập nhật trạng thái
│   │       └── health/           # Deep Health Probe endpoint
│   ├── client/                   # Giao diện & Components tái sử dụng
│   │   └── components/
│   │       ├── layout/           # Navbar, Footer
│   │       ├── booking/          # SearchBar, RoomCard, BookingModal
│   │       └── ui/               # Badge, Card, Modal primitives
│   └── server/                   # Backend Domain Services & Libs
│       ├── db/                   # Prisma client connection pool
│       ├── lib/                  # JWT Auth, RBAC Default-Deny, Logger JSON, Rate Limiter
│       └── services/             # InventoryService, BookingService, ReceptionService, TransportService
├── tests/                        # 7 Automated Test Suites (43 test cases)
├── k6/                           # Kịch bản kiểm thử tải k6 (load-test.js, booking-spike.js)
├── scripts/                      # Kịch bản sao lưu & khôi phục DB (PowerShell & Bash)
└── docs/                         # Tài liệu kỹ thuật chi tiết
    ├── traceability_matrix.md    # Ma trận truy xuất 42/42 yêu cầu backlog
    ├── production_release_checklist.md # Biên bản duyệt phát hành sản xuất
    ├── disaster_recovery_runbook.md    # Sổ tay diễn tập khôi phục thảm họa
    └── load_test_report.md       # Báo cáo kiểm thử tải thực nghiệm & p95
```

---

## 5. HƯỚNG DẪN KHỞI CHẠY MÔI TRƯỜNG PHÁT TRIỂN

### 5.1. Yêu cầu Tiên quyết
- **Node.js**: Phiên bản 20 LTS trở lên.
- **PostgreSQL**: Phiên bản 15 hoặc 16 (khuyên dùng Docker).
- **Git** & Trình quản lý gói `npm`.

### 5.2. Cài đặt từng bước

1. **Khởi tạo file cấu hình môi trường:**
   ```bash
   cp .env.example .env
   ```
   *Chỉnh sửa chuỗi kết nối `DATABASE_URL` và chuỗi bí mật `JWT_SECRET` (tối thiểu 32 ký tự).*

2. **Cài đặt các gói phụ thuộc:**
   ```bash
   npm install
   ```

3. **Khởi động cơ sở dữ liệu PostgreSQL (qua Docker Compose):**
   ```bash
   docker compose up -d postgres
   ```

4. **Đồng bộ hóa Schema & Khởi tạo Dữ liệu mẫu (Seed):**
   ```bash
   npm run db:push
   npm run db:seed
   ```
   *Quá trình seed sẽ tạo 5 tài khoản mẫu cho 5 vai trò, 3 loại phòng hạng sang, 6 phòng vật lý và 60 ngày tồn kho sẵn sàng.*

5. **Khởi chạy Development Server:**
   ```bash
   npm run dev
   ```
   Ứng dụng sẽ hoạt động tại địa chỉ: `http://localhost:3000`.

---

## 6. QUY TRÌNH KIỂM THỬ TOÀN DIỆN

### 6.1. Kiểm thử Đơn vị & Tích hợp Tự động (Automated Test Suites)
Chạy toàn bộ 43 kịch bản kiểm thử tự động không phụ thuộc thư viện ngoài:
```bash
npm test
```
**Kết quả thực tế:**
- `auth-rbac.test.mjs`: 7/7 PASS (Bcrypt cost 12, JWT flags, Default-Deny, Anti-IDOR).
- `inventory-concurrency.test.mjs`: 5/5 PASS (Nightly inventory, Concurrency gate, Zero overbooking).
- `booking-idempotency.test.mjs`: 7/7 PASS (Idempotency deduplication, Booking state machine, Cancellation inventory release).
- `reception-desk.test.mjs`: 7/7 PASS (Physical room assignment collision, Counter payments, Early checkout).
- `transport-mock.test.mjs`: 5/5 PASS (Haversine calculation, 4.000 VND/km, Ride state machine).
- `observability-health.test.mjs`: 6/6 PASS (Structured JSON logging, DB latency probe, SHA-256 backup checksum).
- `security-ratelimit.test.mjs`: 6/6 PASS (Rate limiter sliding window, Privacy masking, Fault injection).  
👉 **Tổng cộng: 43/43 PASS (100%)**

### 6.2. Kiểm thử Tải & Tranh chấp Concurrency (k6)
- **Kiểm thử thông lượng duyệt phòng (100 VUs):**
  ```bash
  npm run test:load
  ```
- **Kiểm thử tranh chấp flash-sale microsecond (50 VUs cùng giữ 1 phòng cuối):**
  ```bash
  npm run test:spike
  ```
*Chi tiết số liệu $p95, p99$ và đồ thị tải xem tại [docs/load_test_report.md](docs/load_test_report.md).*

### 6.3. Kiểm thử Biên dịch Sản xuất (Next.js Build)
```bash
npm run build
```
👉 **Kết quả:** 23/23 routes biên dịch thành công, zero TypeScript/Lint lỗi.

---

## 7. TRIỂN KHAI MÔI TRƯỜNG SẢN XUẤT (PRODUCTION & DOCKER)

### 7.1. Triển khai trọn gói bằng Docker Compose
Dự án tích hợp sẵn multi-stage `Dockerfile` tối ưu và cấu hình mạng cô lập:
```bash
# Xây dựng và khởi chạy cả Database & Web App
docker compose up -d --build
```
Hệ thống tích hợp sẵn Docker Healthcheck kiểm tra tự động qua `/api/health` mỗi 15 giây.

### 7.2. Triển khai Trực tiếp trên Máy chủ (Bare-metal / VM)
```bash
# 1. Sinh Prisma Client tối ưu
npm run db:generate

# 2. Biên dịch gói ứng dụng sản xuất
npm run build

# 3. Khởi chạy production server với tài khoản least privilege
npm run start
```

---

## 8. GIÁM SÁT & SỔ TAY KHÔI PHỤC THẢM HỌA (OBSERVABILITY & DR)

### 8.1. Endpoint Giám sát Sức khỏe
Truy vấn trực tiếp endpoint chẩn đoán:
```bash
curl -i http://localhost:3000/api/health
```
**Payload mẫu:**
```json
{
  "status": "HEALTHY",
  "service": "resort-management-ecosystem",
  "environment": "production",
  "database": { "status": "CONNECTED", "latency_ms": 12 },
  "system": { "node_version": "v20.x", "heap_used_mb": 45.2, "uptime_seconds": 18450 }
}
```

### 8.2. Kịch bản Sao lưu Cơ sở Dữ liệu
- **PowerShell (Windows):**
  ```powershell
  ./scripts/backup-db.ps1
  ```
- **Bash (Linux / MacOS):**
  ```bash
  chmod +x ./scripts/backup-db.sh
  ./scripts/backup-db.sh
  ```
*File nén `.sql.gz` được lưu tại thư mục `backups/` kèm mã băm SHA-256 để xác thực tính toàn vẹn.*

### 8.3. Cam kết Mục tiêu Khôi phục (RTO & RPO)
Theo quy định tại [docs/disaster_recovery_runbook.md](docs/disaster_recovery_runbook.md):
- **RTO (Recovery Time Objective):** $\le 30$ phút.
- **RPO (Recovery Point Objective):** $\le 1$ giờ.

---

## 9. BẢO MẬT & BẢO VỆ QUYỀN RIÊNG TƯ

- **Security Headers:** HSTS 2 năm, CSP hạn chế mã độc inline, X-Frame-Options DENY chống clickjacking.
- **Rate Limiting:** Chặn brute-force đăng nhập (tối đa 5 lần/phút) và spam đặt phòng (tối đa 10 đơn/phút).
- **Privacy Masking:** Tự động che chắn thông tin cá nhân khách hàng trên toàn bộ giao diện công khai và log (SĐT: `0912***678`, Email: `kh***@gmail.com`, Tên: `Nguyễn V. A.`).

---

## 10. MA TRẬN TRUY XUẤT YÊU CẦU & NGHIỆM THU

- [docs/traceability_matrix.md](docs/traceability_matrix.md): Bảng tra cứu chi tiết 42/42 Requirement IDs trong backlog.
- [docs/production_release_checklist.md](docs/production_release_checklist.md): Biên bản ký duyệt phát hành Production chính thức.
- [TASKS.md](TASKS.md): Nhật ký triển khai chi tiết 11 giai đoạn phát triển.
- [CURRENT_STATE.md](CURRENT_STATE.md): Hiện trạng kỹ thuật của dự án.

---

© 2026 Resort Management & Operations Ecosystem. All rights reserved.
