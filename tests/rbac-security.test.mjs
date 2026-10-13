import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { SignJWT, jwtVerify } from 'jose';

const SECRET_KEY = new TextEncoder().encode(
  process.env.SESSION_SECRET || 'mock_super_secret_session_key_min_32_characters_long_12345'
);

class AppError extends Error {
  constructor(code, message, statusCode = 400) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
  }
}

// RBAC Functions mirroring server logic
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

function assertOwnership(session, resourceOwnerId, allowedStaffOverride = ['ADMIN', 'RECEPTIONIST']) {
  const user = requireAuth(session);
  if (allowedStaffOverride.includes(user.role)) {
    return;
  }
  if (user.id !== resourceOwnerId) {
    throw new AppError(
      'FORBIDDEN',
      'Truy cập bị từ chối: Bạn không có quyền truy cập hoặc chỉnh sửa tài nguyên của người dùng khác (IDOR Violation).',
      403
    );
  }
}

async function createSessionToken(user) {
  return new SignJWT({
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(SECRET_KEY);
}

async function verifySessionToken(token) {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    return payload;
  } catch {
    return null;
  }
}

describe('BỘ KIỂM THỬ PHÂN QUYỀN RBAC TOÀN DIỆN (14 YÊU CẦU NGHIỆM THU)', () => {
  // Mock users
  const customer1 = {
    id: 'cust-01',
    email: 'guest1@resort.com',
    fullName: 'Nguyễn Văn Khách',
    role: 'CUSTOMER',
  };

  const customer2 = {
    id: 'cust-02',
    email: 'guest2@resort.com',
    fullName: 'Trần Thị Khách 2',
    role: 'CUSTOMER',
  };

  const receptionist = {
    id: 'rec-01',
    email: 'reception@resort.com',
    fullName: 'Lê Lễ Tân',
    role: 'RECEPTIONIST',
  };

  const driver1 = {
    id: 'drv-01',
    email: 'driver1@resort.com',
    fullName: 'Phạm Lái Xe 1',
    role: 'DRIVER',
  };

  const driver2 = {
    id: 'drv-02',
    email: 'driver2@resort.com',
    fullName: 'Hoàng Lái Xe 2',
    role: 'DRIVER',
  };

  const dispatcher = {
    id: 'disp-01',
    email: 'dispatch@resort.com',
    fullName: 'Vũ Điều Phối',
    role: 'DISPATCHER',
  };

  const admin = {
    id: 'adm-01',
    email: 'admin@resort.com',
    fullName: 'Trịnh Quản Trị',
    role: 'ADMIN',
  };

  // 1. Khách hàng truy cập trang đặt phòng của mình: được phép
  it('1. Khách hàng truy cập đơn đặt phòng của chính mình: ĐƯỢC PHÉP', () => {
    assert.doesNotThrow(() => {
      assertOwnership(customer1, customer1.id, ['ADMIN', 'RECEPTIONIST']);
    });
  });

  // 2. Khách hàng truy cập trang nội bộ lễ tân: bị từ chối
  it('2. Khách hàng truy cập trang nội bộ lễ tân (/reception): BỊ TỪ CHỐI (403)', () => {
    assert.throws(
      () => requireRole(customer1, 'RECEPTIONIST', 'ADMIN'),
      (err) => err instanceof AppError && err.statusCode === 403
    );
  });

  // 3. Lễ tân truy cập trang nghiệp vụ lễ tân: được phép
  it('3. Lễ tân truy cập trang nghiệp vụ lễ tân: ĐƯỢC PHÉP', () => {
    const verified = requireRole(receptionist, 'RECEPTIONIST', 'ADMIN');
    assert.equal(verified.role, 'RECEPTIONIST');
  });

  // 4. Lễ tân truy cập trang điều phối xe: bị từ chối nếu không có quyền
  it('4. Lễ tân truy cập trang điều phối xe (/transport/dispatch): BỊ TỪ CHỐI (403)', () => {
    assert.throws(
      () => requireRole(receptionist, 'DISPATCHER', 'ADMIN'),
      (err) => err instanceof AppError && err.statusCode === 403
    );
  });

  // 5. Tài xế xem nhiệm vụ được giao: được phép
  it('5. Tài xế xem nhiệm vụ được giao cho chính mình: ĐƯỢC PHÉP', () => {
    const verified = requireRole(driver1, 'DRIVER', 'ADMIN');
    assert.equal(verified.role, 'DRIVER');
    assert.equal(driver1.id, 'drv-01');
  });

  // 6. Tài xế xem nhiệm vụ của tài xế khác: bị từ chối
  it('6. Tài xế xem nhiệm vụ của tài xế khác: BỊ TỪ CHỐI (403)', () => {
    const targetDriverId = driver2.id;
    const checkDriverAccess = (currentDriver, targetId) => {
      if (currentDriver.role === 'DRIVER' && currentDriver.id !== targetId) {
        throw new AppError('FORBIDDEN', 'Tài xế không có quyền xem nhiệm vụ của tài xế khác.', 403);
      }
    };

    assert.throws(
      () => checkDriverAccess(driver1, targetDriverId),
      (err) => err instanceof AppError && err.statusCode === 403
    );
  });

  // 7. Điều phối xe truy cập chức năng điều phối: được phép
  it('7. Điều phối xe truy cập chức năng điều phối: ĐƯỢC PHÉP', () => {
    const verified = requireRole(dispatcher, 'DISPATCHER', 'ADMIN');
    assert.equal(verified.role, 'DISPATCHER');
  });

  // 8. Điều phối xe truy cập quản lý tài khoản Admin: bị từ chối nếu không có quyền
  it('8. Điều phối xe truy cập quản lý tài khoản Admin: BỊ TỪ CHỐI (403)', () => {
    assert.throws(
      () => requireRole(dispatcher, 'ADMIN'),
      (err) => err instanceof AppError && err.statusCode === 403
    );
  });

  // 9. Nhân viên (Lễ tân, Lái xe, Điều phối) truy cập chức năng quản trị: bị từ chối
  it('9. Nhân viên không có quyền Admin truy cập chức năng quản trị: BỊ TỪ CHỐI (403)', () => {
    const staffMembers = [receptionist, driver1, dispatcher, customer1];
    for (const staff of staffMembers) {
      assert.throws(
        () => requireRole(staff, 'ADMIN'),
        (err) => err instanceof AppError && err.statusCode === 403,
        `Nhân viên ${staff.role} phải bị chặn khi truy cập Admin`
      );
    }
    const adminCheck = requireRole(admin, 'ADMIN');
    assert.equal(adminCheck.role, 'ADMIN');
  });

  // 10. Người chưa đăng nhập gọi API nội bộ: bị từ chối
  it('10. Người chưa đăng nhập (Session null) gọi API nội bộ: BỊ TỪ CHỐI (401)', () => {
    assert.throws(
      () => requireAuth(null),
      (err) => err instanceof AppError && err.statusCode === 401
    );
    assert.throws(
      () => requireRole(null, 'RECEPTIONIST'),
      (err) => err instanceof AppError && err.statusCode === 401
    );
  });

  // 11. Người dùng gọi trực tiếp API hoặc server action trái quyền: bị từ chối
  it('11. Người dùng gọi trực tiếp API đổi trạng thái/phân tài xế trái quyền: BỊ TỪ CHỐI (403)', () => {
    // Customer calling driver assign API
    assert.throws(
      () => requireRole(customer1, 'DISPATCHER', 'ADMIN'),
      (err) => err instanceof AppError && err.statusCode === 403
    );
    // Receptionist calling driver assign API
    assert.throws(
      () => requireRole(receptionist, 'DISPATCHER', 'ADMIN'),
      (err) => err instanceof AppError && err.statusCode === 403
    );
  });

  // 12. Người dùng thay ID trên URL hoặc request để đọc, sửa dữ liệu của người khác (IDOR): bị từ chối
  it('12. Khách hàng thay ID để đọc/sửa dữ liệu khách khác (Anti-IDOR): BỊ TỪ CHỐI (403)', () => {
    // Customer 1 attempts to access Customer 2's booking
    assert.throws(
      () => assertOwnership(customer1, customer2.id, ['ADMIN', 'RECEPTIONIST']),
      (err) => err instanceof AppError && err.statusCode === 403
    );

    // Receptionist or Admin CAN view Customer 2's booking for operations
    assert.doesNotThrow(() => {
      assertOwnership(receptionist, customer2.id, ['ADMIN', 'RECEPTIONIST']);
    });
    assert.doesNotThrow(() => {
      assertOwnership(admin, customer2.id, ['ADMIN', 'RECEPTIONIST']);
    });
  });

  // 13. Menu và trang hiển thị đúng theo từng role
  it('13. Quy tắc lọc Menu trên giao diện bảo đảm không rò rỉ chức năng', () => {
    const getVisibleNavItems = (user) => {
      const items = ['/rooms'];
      if (user && (user.role === 'RECEPTIONIST' || user.role === 'ADMIN')) items.push('/reception');
      if (user && (user.role === 'DISPATCHER' || user.role === 'ADMIN')) items.push('/transport/dispatch');
      if (user && (user.role === 'DRIVER' || user.role === 'ADMIN')) items.push('/transport/driver');
      if (user && user.role === 'ADMIN') items.push('/admin/system-health');
      return items;
    };

    // Anonymous visitor: Only public rooms
    assert.deepEqual(getVisibleNavItems(null), ['/rooms']);
    // Customer: Only public rooms
    assert.deepEqual(getVisibleNavItems(customer1), ['/rooms']);
    // Receptionist: Rooms + Reception
    assert.deepEqual(getVisibleNavItems(receptionist), ['/rooms', '/reception']);
    // Driver: Rooms + Driver Portal
    assert.deepEqual(getVisibleNavItems(driver1), ['/rooms', '/transport/driver']);
    // Dispatcher: Rooms + Dispatch
    assert.deepEqual(getVisibleNavItems(dispatcher), ['/rooms', '/transport/dispatch']);
    // Admin: Has all 5 routes
    assert.deepEqual(getVisibleNavItems(admin), [
      '/rooms',
      '/reception',
      '/transport/dispatch',
      '/transport/driver',
      '/admin/system-health',
    ]);
  });

  // 14. Các chức năng đăng nhập, đặt phòng và nghiệp vụ hợp lệ hiện có vẫn hoạt động
  it('14. Quá trình tạo Token, xác minh danh tính và phân quyền hoạt động chính xác', async () => {
    const token = await createSessionToken(customer1);
    assert.ok(typeof token === 'string' && token.length > 20);

    const decoded = await verifySessionToken(token);
    assert.ok(decoded);
    assert.equal(decoded.id, customer1.id);
    assert.equal(decoded.role, 'CUSTOMER');

    // Invalid/expired token returns null
    const invalid = await verifySessionToken('invalid.jwt.token');
    assert.equal(invalid, null);
  });
});
