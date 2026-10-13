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
- [x] **Roadmap Giai đoạn 2 (Cơ sở dữ liệu & Quản trị dữ liệu):**
  - Cài đặt Prisma ORM v6.4.1 ổn định và `@prisma/client`.
  - Thiết kế hoàn chỉnh schema PostgreSQL [prisma/schema.prisma](file:///d:/resort/prisma/schema.prisma) (`DB-01`, `PERF-03`):
    - 5 Enums: `UserRole`, `RoomStatus`, `BookingStatus`, `PaymentMethod`, `RideStatus`.
    - 7 Models: `User`, `RoomType`, `Room`, `NightlyInventory`, `Booking`, `PaymentTransaction`, `TransportRide`, `AuditLog`.
    - Tiền tệ dùng `Int` (VND), ngày giờ UTC, composite unique `[roomTypeId, date]`.
  - Thiết lập [docker-compose.yml](file:///d:/resort/docker-compose.yml) cho PostgreSQL 16 Alpine cục bộ.
  - Viết singleton client [src/server/lib/db.ts](file:///d:/resort/src/server/lib/db.ts) kiểm soát connection pool và cảnh báo slow query (>100ms).
  - Viết seed script [prisma/seed.ts](file:///d:/resort/prisma/seed.ts) khởi tạo 5 tài khoản mẫu, 3 loại phòng cao cấp, danh sách phòng vật lý, và 60 ngày tồn kho.
  - Test evidence: `npx prisma validate` thành công 100%, `npx prisma generate` sinh type an toàn, `npm run build` hoàn thành không lỗi.

---

## 2. CÁC TỆP ĐÃ TẠO HOẶC CHỈNH SỬA

| File | Mô tả |
| :--- | :--- |
| [prisma/schema.prisma](file:///d:/resort/prisma/schema.prisma) | Schema CSDL PostgreSQL chuẩn hóa đầy đủ quan hệ và chỉ mục |
| [prisma/seed.ts](file:///d:/resort/prisma/seed.ts) | Kịch bản seed dữ liệu mẫu cho 5 vai trò, 3 loại phòng và 60 ngày tồn kho |
| [docker-compose.yml](file:///d:/resort/docker-compose.yml) | Cấu hình chạy PostgreSQL 16 trên Docker cục bộ |
| [src/server/lib/db.ts](file:///d:/resort/src/server/lib/db.ts) | Singleton Prisma client chống rò rỉ connection pool |
| [package.json](file:///d:/resort/package.json) | Bổ sung các script `db:generate`, `db:validate`, `db:push`, `db:seed` |
| [CURRENT_STATE.md](file:///d:/resort/CURRENT_STATE.md) & [TASKS.md](file:///d:/resort/TASKS.md) | Cập nhật tiến độ và bằng chứng kiểm thử Giai đoạn 2 |

---

## 3. KẾT QUẢ KIỂM THỬ THỰC TẾ

- **Prisma Schema Validation:** `npx prisma validate` $\rightarrow$ Valid 🚀.
- **Client Generation:** `npx prisma generate` $\rightarrow$ Sinh Prisma Client v6.4.1 thành công.
- **Next.js Production Build:** `npm run build` $\rightarrow$ Thành công trong 325ms, không có lỗi TypeScript hay linter.

---

## 4. LỖI VÀ RỦI RO CÒN TỒN TẠI

- Cần khởi động container PostgreSQL (`docker compose up -d`) khi muốn chạy migrate trực tiếp trên máy cục bộ hoặc kết nối database cloud.

---

## 5. NHIỆM VỤ TIẾP THEO

- **Roadmap Giai đoạn 3: Xác thực & Phân quyền (`SEC-02`, `SEC-03`, `SEC-04`):**
  - Xây dựng Auth Service: Hash mật khẩu (Bcrypt/Argon2id), cấp phát và xác thực session token an toàn qua Cookie `HttpOnly`.
  - Xây dựng Middleware Server-side RBAC (chặn theo vai trò `Customer`, `Receptionist`, `Driver`, `Dispatcher`, `Admin`).
  - Xây dựng cơ chế kiểm tra quyền sở hữu tài nguyên để chống IDOR (`SEC-04`).


