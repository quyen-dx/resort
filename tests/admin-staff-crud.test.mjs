import test from 'node:test';
import assert from 'node:assert/strict';

class AppError extends Error {
  constructor(code, message, statusCode = 400) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
  }
}

const ALLOWED_STAFF_ROLES = ['ADMIN', 'RECEPTIONIST', 'DISPATCHER', 'DRIVER'];

function validateStaffCreateInput(body) {
  const { fullName, email, role, password } = body;
  if (!fullName || typeof fullName !== 'string' || fullName.trim().length === 0) {
    throw new AppError('VALIDATION_ERROR', 'Họ và tên nhân viên không được để trống.', 400);
  }
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    throw new AppError('VALIDATION_ERROR', 'Email không hợp lệ.', 400);
  }
  if (!role || !ALLOWED_STAFF_ROLES.includes(role)) {
    throw new AppError(
      'VALIDATION_ERROR',
      'Vai trò nhân viên không hợp lệ. Chỉ cho phép ADMIN, RECEPTIONIST, DISPATCHER hoặc DRIVER.',
      400
    );
  }
  if (!password || typeof password !== 'string' || password.length < 6) {
    throw new AppError('VALIDATION_ERROR', 'Mật khẩu phải có ít nhất 6 ký tự.', 400);
  }
  return true;
}

function validateStaffUpdateInput(targetId, currentSession, updateData) {
  const { role, isActive, password } = updateData;
  if (role && !ALLOWED_STAFF_ROLES.includes(role)) {
    throw new AppError('VALIDATION_ERROR', 'Vai trò không hợp lệ.', 400);
  }
  if (currentSession && currentSession.id === targetId) {
    if (role && role !== 'ADMIN') {
      throw new AppError('PROTECTION_ERROR', 'Bạn không thể tự hạ vai trò Quản trị viên của chính mình.', 400);
    }
    if (typeof isActive === 'boolean' && !isActive) {
      throw new AppError('PROTECTION_ERROR', 'Bạn không thể tự vô hiệu hóa tài khoản của chính mình.', 400);
    }
  }
  if (password && (typeof password !== 'string' || password.length < 6)) {
    throw new AppError('VALIDATION_ERROR', 'Mật khẩu mới phải có ít nhất 6 ký tự.', 400);
  }
  return true;
}

function validateStaffDelete(targetId, currentSession, hasPaymentsCollected) {
  if (currentSession && currentSession.id === targetId) {
    throw new AppError('PROTECTION_ERROR', 'Bạn không thể tự xóa tài khoản của chính mình.', 400);
  }
  if (hasPaymentsCollected) {
    throw new AppError(
      'AUDIT_RESTRICTION',
      'Không thể xóa vĩnh viễn nhân sự này vì đã gắn liền với các biên lai thu tiền quầy hợp lệ.',
      409
    );
  }
  return true;
}

test('KIỂM THỬ NGHIỆP VỤ CRUD NHÂN VIÊN TẠI /admin/staff', async (t) => {
  const adminSession = {
    id: 'admin-001',
    role: 'ADMIN',
    email: 'admin@resort.com',
  };

  await t.test('1. Tạo nhân viên với thông tin hợp lệ: THÀNH CÔNG', () => {
    assert.doesNotThrow(() => {
      validateStaffCreateInput({
        fullName: 'Nguyễn Văn Lễ Tân',
        email: 'letan1@annamresort.vn',
        role: 'RECEPTIONIST',
        password: 'password123',
      });
    });
  });

  await t.test('2. Chặn đứng việc gán vai trò CUSTOMER qua phân hệ nhân viên', () => {
    assert.throws(
      () =>
        validateStaffCreateInput({
          fullName: 'Khách Hàng Giả Mạo',
          email: 'fake@annamresort.vn',
          role: 'CUSTOMER',
          password: 'password123',
        }),
      (err) => {
        assert.ok(err instanceof AppError);
        assert.strictEqual(err.statusCode, 400);
        return true;
      }
    );
  });

  await t.test('3. Bắt buộc mật khẩu khởi tạo phải >= 6 ký tự', () => {
    assert.throws(
      () =>
        validateStaffCreateInput({
          fullName: 'Tài xế Mới',
          email: 'driver1@annamresort.vn',
          role: 'DRIVER',
          password: '123', // < 6 ký tự
        }),
      (err) => {
        assert.ok(err instanceof AppError);
        assert.strictEqual(err.statusCode, 400);
        return true;
      }
    );
  });

  await t.test('4. Ngăn chặn Quản trị viên tự hạ quyền Admin của chính mình', () => {
    assert.throws(
      () =>
        validateStaffUpdateInput('admin-001', adminSession, {
          role: 'RECEPTIONIST',
        }),
      (err) => {
        assert.ok(err instanceof AppError);
        assert.strictEqual(err.statusCode, 400);
        return true;
      }
    );
  });

  await t.test('5. Ngăn chặn Quản trị viên tự khóa tài khoản của chính mình', () => {
    assert.throws(
      () =>
        validateStaffUpdateInput('admin-001', adminSession, {
          isActive: false,
        }),
      (err) => {
        assert.ok(err instanceof AppError);
        assert.strictEqual(err.statusCode, 400);
        return true;
      }
    );
  });

  await t.test('6. Ngăn chặn Quản trị viên tự xóa tài khoản của chính mình', () => {
    assert.throws(
      () => validateStaffDelete('admin-001', adminSession, false),
      (err) => {
        assert.ok(err instanceof AppError);
        assert.strictEqual(err.statusCode, 400);
        return true;
      }
    );
  });

  await t.test('7. Ràng buộc kiểm toán tài chính (BIZ-01): Chặn xóa nhân viên đã lập biên lai thu ngân', () => {
    assert.throws(
      () => validateStaffDelete('reception-002', adminSession, true),
      (err) => {
        assert.ok(err instanceof AppError);
        assert.strictEqual(err.statusCode, 409);
        return true;
      }
    );
  });

  await t.test('8. Xóa tài khoản nhân viên hợp lệ khi không vướng kiểm toán', () => {
    assert.doesNotThrow(() => {
      validateStaffDelete('driver-003', adminSession, false);
    });
  });
});
