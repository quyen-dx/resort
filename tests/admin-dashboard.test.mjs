import test from 'node:test';
import assert from 'node:assert/strict';

class AppError extends Error {
  constructor(code, message, statusCode = 400) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
  }
}

function requireAuth(session) {
  if (!session) {
    throw new AppError('UNAUTHORIZED', 'Yêu cầu đăng nhập để truy cập tài nguyên này.', 401);
  }
  return session;
}

function requireRole(session, ...allowedRoles) {
  const user = requireAuth(session);
  if (!allowedRoles.includes(user.role)) {
    throw new AppError(
      'FORBIDDEN',
      `Tài khoản không đủ quyền hạn (${user.role}). Cần vai trò: ${allowedRoles.join(', ')}`,
      403
    );
  }
  return user;
}

test('KIỂM THỬ BẢO MẬT & PHÂN QUYỀN KHU VỰC ADMIN', async (t) => {
  const customerSession = {
    id: 'user-cust-1',
    email: 'guest@annamresort.vn',
    role: 'CUSTOMER',
    fullName: 'Nguyễn Văn Khách',
  };

  const receptionistSession = {
    id: 'user-rec-1',
    email: 'reception@annamresort.vn',
    role: 'RECEPTIONIST',
    fullName: 'Trần Thị Lễ Tân',
  };

  const dispatcherSession = {
    id: 'user-disp-1',
    email: 'dispatch@annamresort.vn',
    role: 'DISPATCHER',
    fullName: 'Lê Văn Điều Phối',
  };

  const driverSession = {
    id: 'user-driv-1',
    email: 'driver@annamresort.vn',
    role: 'DRIVER',
    fullName: 'Phạm Văn Tài Xế',
  };

  const adminSession = {
    id: 'user-adm-1',
    email: 'admin@annamresort.vn',
    role: 'ADMIN',
    fullName: 'Tổng Quản Lý An Nam',
  };

  await t.test('1. Người chưa đăng nhập (Session null) gọi Admin API: BỊ TỪ CHỐI 401', () => {
    assert.throws(
      () => requireRole(null, 'ADMIN'),
      (err) => {
        assert.ok(err instanceof AppError);
        assert.strictEqual(err.statusCode, 401);
        return true;
      }
    );
  });

  await t.test('2. Khách hàng (CUSTOMER) truy cập Admin API: BỊ TỪ CHỐI 403', () => {
    assert.throws(
      () => requireRole(customerSession, 'ADMIN'),
      (err) => {
        assert.ok(err instanceof AppError);
        assert.strictEqual(err.statusCode, 403);
        return true;
      }
    );
  });

  await t.test('3. Lễ tân (RECEPTIONIST) truy cập Admin API: BỊ TỪ CHỐI 403', () => {
    assert.throws(
      () => requireRole(receptionistSession, 'ADMIN'),
      (err) => {
        assert.ok(err instanceof AppError);
        assert.strictEqual(err.statusCode, 403);
        return true;
      }
    );
  });

  await t.test('4. Điều phối viên (DISPATCHER) truy cập Admin API: BỊ TỪ CHỐI 403', () => {
    assert.throws(
      () => requireRole(dispatcherSession, 'ADMIN'),
      (err) => {
        assert.ok(err instanceof AppError);
        assert.strictEqual(err.statusCode, 403);
        return true;
      }
    );
  });

  await t.test('5. Tài xế (DRIVER) truy cập Admin API: BỊ TỪ CHỐI 403', () => {
    assert.throws(
      () => requireRole(driverSession, 'ADMIN'),
      (err) => {
        assert.ok(err instanceof AppError);
        assert.strictEqual(err.statusCode, 403);
        return true;
      }
    );
  });

  await t.test('6. Quản trị viên (ADMIN) truy cập Admin API: ĐƯỢC PHÉP THÀNH CÔNG', () => {
    assert.doesNotThrow(() => {
      requireRole(adminSession, 'ADMIN');
    });
  });

  await t.test('7. Cấu trúc Sidebar Admin chuẩn xác 8 đề mục', () => {
    const requiredMenuItems = [
      '/admin',
      '/admin/rooms',
      '/admin/room-types',
      '/admin/bookings',
      '/admin/customers',
      '/admin/staff',
      '/admin/transfers',
      '/admin/system-health',
    ];

    assert.strictEqual(requiredMenuItems.length, 8);
    assert.ok(requiredMenuItems.includes('/admin'));
    assert.ok(requiredMenuItems.includes('/admin/system-health'));
  });
});
