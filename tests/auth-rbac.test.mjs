import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';

const SECRET_KEY = new TextEncoder().encode(
  'mock_super_secret_session_key_min_32_characters_long_12345'
);

describe('BẢO MẬT: Xác thực & Quản lý Phiên (SEC-02)', () => {
  test('Bcrypt hash và verify mật khẩu chính xác', async () => {
    const rawPassword = 'ResortSecret@2026';
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(rawPassword, salt);

    assert.ok(hash.startsWith('$2'), 'Bcrypt hash phải có tiền tố $2');
    assert.notEqual(hash, rawPassword, 'Mật khẩu phải được mã hóa một chiều');

    const isMatch = await bcrypt.compare(rawPassword, hash);
    assert.equal(isMatch, true, 'Xác thực mật khẩu đúng phải trả về true');

    const isWrongMatch = await bcrypt.compare('WrongPassword', hash);
    assert.equal(isWrongMatch, false, 'Xác thực mật khẩu sai phải trả về false');
  });

  test('Ký và giải mã Session Token an toàn (jose JWT)', async () => {
    const user = {
      id: 'user-uuid-001',
      email: 'khach@annam.vn',
      fullName: 'Đặng Tuấn Khách',
      role: 'CUSTOMER',
    };

    const token = await new SignJWT(user)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(SECRET_KEY);

    assert.ok(typeof token === 'string' && token.length > 50, 'Token phải là chuỗi hợp lệ');

    // Decode and verify
    const { payload } = await jwtVerify(token, SECRET_KEY);
    assert.equal(payload.id, user.id);
    assert.equal(payload.email, user.email);
    assert.equal(payload.role, user.role);

    // Tampered token test
    const tamperedToken = token.slice(0, -5) + 'xxxxx';
    await assert.rejects(
      async () => {
        await jwtVerify(tamperedToken, SECRET_KEY);
      },
      /signature verification failed|JWSInvalidSignature/i,
      'Token bị sửa đổi phải bị từ chối'
    );
  });
});

describe('BẢO MẬT: RBAC Server-Side & Chống IDOR (SEC-03, SEC-04)', () => {
  function requireRole(session, ...allowedRoles) {
    if (!session) {
      throw new Error('401: UNAUTHORIZED');
    }
    if (!allowedRoles.includes(session.role)) {
      throw new Error(`403: FORBIDDEN - Cần vai trò: ${allowedRoles.join(', ')}`);
    }
    return session;
  }

  function assertOwnership(session, resourceOwnerId, allowedStaffOverride = ['ADMIN', 'RECEPTIONIST']) {
    if (!session) {
      throw new Error('401: UNAUTHORIZED');
    }
    if (allowedStaffOverride.includes(session.role)) {
      return; // Staff permitted
    }
    if (session.id !== resourceOwnerId) {
      throw new Error('403: IDOR_VIOLATION - Bạn không có quyền truy cập dữ liệu của khách khác');
    }
  }

  test('RBAC: Chặn người dùng chưa đăng nhập (Default Deny)', () => {
    assert.throws(() => requireRole(null, 'CUSTOMER'), /401: UNAUTHORIZED/);
  });

  test('RBAC: Chặn Customer truy cập màn hình Admin', () => {
    const customerSession = { id: 'user-1', role: 'CUSTOMER' };
    assert.throws(
      () => requireRole(customerSession, 'ADMIN'),
      /403: FORBIDDEN/
    );
  });

  test('RBAC: Chặn Driver truy cập chức năng Lễ tân', () => {
    const driverSession = { id: 'driver-1', role: 'DRIVER' };
    assert.throws(
      () => requireRole(driverSession, 'RECEPTIONIST'),
      /403: FORBIDDEN/
    );
  });

  test('RBAC: Cho phép Receptionist vào đúng quyền Lễ tân', () => {
    const recSession = { id: 'rec-1', role: 'RECEPTIONIST' };
    const result = requireRole(recSession, 'RECEPTIONIST', 'ADMIN');
    assert.equal(result.id, 'rec-1');
  });

  test('Chống IDOR: Khách A không được xem/sửa booking của Khách B (SEC-04)', () => {
    const customerA = { id: 'cust-A', role: 'CUSTOMER' };
    const bookingBelongsToB = 'cust-B';

    assert.throws(
      () => assertOwnership(customerA, bookingBelongsToB),
      /403: IDOR_VIOLATION/,
      'Khách A truy vấn tài nguyên của Khách B phải bị chặn ngay lập tức'
    );
  });

  test('Chống IDOR: Khách A xem booking của chính mình là hợp lệ', () => {
    const customerA = { id: 'cust-A', role: 'CUSTOMER' };
    assert.doesNotThrow(() => assertOwnership(customerA, 'cust-A'));
  });

  test('Chống IDOR: Lễ tân hoặc Admin được quyền truy cập booking để phục vụ check-in', () => {
    const recSession = { id: 'rec-1', role: 'RECEPTIONIST' };
    assert.doesNotThrow(() => assertOwnership(recSession, 'cust-B'));
  });
});
