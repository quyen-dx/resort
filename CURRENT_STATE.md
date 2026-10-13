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
- [x] **Roadmap Giai đoạn 1 (Nền tảng dự án & Mô hình tải):**
  - Khởi tạo dự án Next.js 16 + TypeScript, ESLint.
  - Phân tách kiến trúc Clean Architecture: Backend (`src/server/`) tách biệt hoàn toàn Frontend (`src/client/`).
  - Thiết lập `.gitignore` bảo vệ secret, cung cấp `.env.example` chuẩn (`SEC-01`, `OPS-01`).
  - Tạo cấu trúc domain types, errors (`AppError`), structured logger (`OBS-01`).
  - Tạo CSS tokens Design System cho resort và tiền ích format tiền VND (`integer`), format ngày VN.
  - Xây dựng tài liệu định nghĩa mô hình tải và SLO Benchmark [workload_specification.md](file:///d:/resort/docs/workload_specification.md) (`SCALE-01`, `AI-03`).
  - Build test kiểm chứng: `npm run build` thành công 100%.

---

## 2. CÁC TỆP ĐÃ TẠO HOẶC CHỈNH SỬA

| File | Mô tả |
| :--- | :--- |
| [package.json](file:///d:/resort/package.json) | Cấu hình dependencies (Next.js, React, TypeScript), scripts và security overrides |
| [tsconfig.json](file:///d:/resort/tsconfig.json) | Cấu hình TypeScript compiler, path alias `@/*` |
| [next.config.ts](file:///d:/resort/next.config.ts) | Cấu hình Next.js (strict mode, ẩn header poweredBy) |
| [.gitignore](file:///d:/resort/.gitignore) & [.env.example](file:///d:/resort/.env.example) | Quản lý biến môi trường an toàn theo chuẩn `SEC-01` |
| [src/server/](file:///d:/resort/src/server) | Lõi Backend: `core/types`, `core/errors`, `lib/logger` |
| [src/client/](file:///d:/resort/src/client) | Lõi Frontend: `styles/tokens.css`, `styles/globals.css`, `utils/currency.ts`, `utils/date.ts` |
| [src/app/page.tsx](file:///d:/resort/src/app/page.tsx) & [layout.tsx](file:///d:/resort/src/app/layout.tsx) | Trang chủ với nhận diện resort sang trọng |
| [src/app/api/health/route.ts](file:///d:/resort/src/app/api/health/route.ts) | Endpoint giám sát sức khỏe dịch vụ (`OPS-01`, `OBS-01`) |
| [docs/workload_specification.md](file:///d:/resort/docs/workload_specification.md) | Tài liệu định nghĩa thông số tải & SLO baseline (`SCALE-01`, `AI-03`) |

---

## 3. KẾT QUẢ KIỂM THỬ THỰC TẾ

- **Lệnh build:** `npm run build`
- **Kết quả:** Biên dịch thành công trong 8.8s; TypeScript kiểm tra nghiêm ngặt không có lỗi; sinh ra trang tĩnh `/` và route động `/api/health`.

---

## 4. LỖI VÀ RỦI RO CÒN TỒN TẠI

- Hiện tại chưa kết nối database PostgreSQL sống để chạy migration thực tế. Cần chuẩn bị cấu hình Prisma schema cho Giai đoạn 2.

---

## 5. NHIỆM VỤ TIẾP THEO

- **Roadmap Giai đoạn 2: Database Schema & Migration (`DB-01`, `PERF-03`):**
  - Khởi tạo Prisma ORM (`npx prisma init`).
  - Thiết kế Schema chi tiết: `RoomType`, `Room`, `NightlyInventory`, `Booking`, `PaymentTransaction`, `TransportRide`, `User`, `AuditLog`.
  - Thiết lập ràng buộc toàn vẹn: Không dùng float cho tiền tệ, composite index cho tra cứu tồn kho theo ngày.

