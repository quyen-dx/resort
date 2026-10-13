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
- [x] **Roadmap Giai đoạn 3 (Xác thực & Phân quyền RBAC):**
  - Cài đặt `bcryptjs` (mã hóa mật khẩu an toàn) và `jose` (ký token JWT tương thích cả Edge/Node runtime).
  - Xây dựng [src/server/lib/auth.ts](file:///d:/resort/src/server/lib/auth.ts): Hash mật khẩu Bcrypt (cost 12), ký JWT session, cấu hình cookie `HttpOnly`, `Secure` (production), `SameSite=Lax`, TTL 7 ngày (`SEC-02`).
  - Xây dựng [src/server/middleware/rbac.ts](file:///d:/resort/src/server/middleware/rbac.ts): Kiểm tra quyền Server-side (Default-Deny) cho 5 vai trò (`SEC-03`); kiểm tra quyền sở hữu tài nguyên chống IDOR (`SEC-04`).
  - Xây dựng [src/server/services/auth.service.ts](file:///d:/resort/src/server/services/auth.service.ts): Nghiệp vụ login, register customer, verify session.
  - Xây dựng các Route Handlers: `/api/auth/login`, `/api/auth/logout`, `/api/auth/me`.
  - Bộ kiểm thử bảo mật [tests/auth-rbac.test.mjs](file:///d:/resort/tests/auth-rbac.test.mjs): 9/9 test cases pass (Bcrypt hashing, JWT tampering check, RBAC default-deny, Anti-IDOR customer isolation).
  - Next.js build: 7/7 routes biên dịch thành công.

---

## 2. CÁC TỆP ĐÃ TẠO HOẶC CHỈNH SỬA

| File | Mô tả |
| :--- | :--- |
| [src/server/lib/auth.ts](file:///d:/resort/src/server/lib/auth.ts) | Bcrypt hash, jose JWT session tokens và cấu hình HttpOnly cookie |
| [src/server/middleware/rbac.ts](file:///d:/resort/src/server/middleware/rbac.ts) | RBAC server-side guard và hàm `assertOwnership` chống IDOR |
| [src/server/services/auth.service.ts](file:///d:/resort/src/server/services/auth.service.ts) | Service xử lý đăng nhập, cấp token, đăng ký tài khoản khách |
| [src/app/api/auth/login/route.ts](file:///d:/resort/src/app/api/auth/login/route.ts) | API đăng nhập và cấp cookie phiên an toàn |
| [src/app/api/auth/logout/route.ts](file:///d:/resort/src/app/api/auth/logout/route.ts) | API đăng xuất và thu hồi session cookie |
| [src/app/api/auth/me/route.ts](file:///d:/resort/src/app/api/auth/me/route.ts) | API kiểm tra thông tin phiên làm việc hiện tại |
| [tests/auth-rbac.test.mjs](file:///d:/resort/tests/auth-rbac.test.mjs) | Bộ kiểm thử an ninh Auth, RBAC và Anti-IDOR |
| [CURRENT_STATE.md](file:///d:/resort/CURRENT_STATE.md) & [TASKS.md](file:///d:/resort/TASKS.md) | Cập nhật tiến độ và bằng chứng kiểm thử Giai đoạn 3 |

---

## 3. KẾT QUẢ KIỂM THỬ THỰC TẾ

- **Unit & Security Tests:** `node --test tests/auth-rbac.test.mjs` $\rightarrow$ **9/9 test cases PASS (100%)**.
- **Next.js Production Build:** `npm run build` $\rightarrow$ 7/7 routes biên dịch thành công không có lỗi type/lint.

---

## 4. LỖI VÀ RỦI RO CÒN TỒN TẠI

- Cần tích hợp cơ chế Rate-limit (`SEC-06`) trước khi đưa lên môi trường production công khai.

---

## 5. NHIỆM VỤ TIẾP THEO

- **Roadmap Giai đoạn 4: Inventory Transaction Engine (`BOOK-01`, `BOOK-02`, `BOOK-03`):**
  - Xây dựng Service tính toán tồn kho theo từng đêm (`nightly inventory`), xử lý ranh giới check-in / check-out.
  - Thuật toán trừ tồn kho nguyên tử (`Atomic Conditional Lock`) với nguyên tắc *"First successful atomic commit wins"*.
  - Viết bài kiểm thử đồng thời (Concurrency Test: `Inventory = 1`) kiểm chứng chống overbooking tuyệt đối.



