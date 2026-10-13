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
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const PHONE_REGEX = /^(0|\+84)(3|5|7|8|9)[0-9]{8}$/;

function validateStaffCreateInput(body, existingUsers = []) {
  const { fullName, email, phoneNumber, role, password } = body;
  if (!fullName || typeof fullName !== 'string' || fullName.trim().length === 0) {
    throw new AppError('VALIDATION_ERROR', 'Họ và tên nhân viên không được để trống.', 400);
  }

  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    throw new AppError('VALIDATION_ERROR', 'Định dạng email/gmail không hợp lệ.', 400);
  }

  const cleanEmail = email.trim().toLowerCase();
  if (existingUsers.some((u) => u.email.toLowerCase() === cleanEmail)) {
    throw new AppError('CONFLICT', `Email/Gmail "${cleanEmail}" đã được sử dụng.`, 409);
  }

  let cleanPhone = null;
  if (phoneNumber && typeof phoneNumber === 'string' && phoneNumber.trim().length > 0) {
    const sanitized = phoneNumber.trim().replace(/[\s.-]/g, '');
    if (!PHONE_REGEX.test(sanitized)) {
      throw new AppError('VALIDATION_ERROR', 'Số điện thoại không hợp lệ.', 400);
    }
    if (existingUsers.some((u) => u.phoneNumber === sanitized)) {
      throw new AppError('CONFLICT', `Số điện thoại "${sanitized}" đã được đăng ký.`, 409);
    }
    cleanPhone = sanitized;
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

  return { cleanEmail, cleanPhone };
}

function validateStaffUpdateInput(targetId, currentSession, updateData, existingUsers = []) {
  const { role, isActive, password, phoneNumber } = updateData;

  if (phoneNumber !== undefined && phoneNumber !== null && phoneNumber.trim().length > 0) {
    const sanitized = phoneNumber.trim().replace(/[\s.-]/g, '');
    if (!PHONE_REGEX.test(sanitized)) {
      throw new AppError('VALIDATION_ERROR', 'Số điện thoại không hợp lệ.', 400);
    }
    if (existingUsers.some((u) => u.id !== targetId && u.phoneNumber === sanitized)) {
      throw new AppError('CONFLICT', `Số điện thoại "${sanitized}" đã được sử dụng bởi người khác.`, 409);
    }
  }

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

test('KIỂM THỬ NGHIỆP VỤ CRUD NHÂN VIÊN & VALIDATION DỮ LIỆU TẠI /admin/staff', async (t) => {
  const adminSession = {
    id: 'admin-001',
    role: 'ADMIN',
    email: 'admin@resort.com',
  };

  const mockedUsers = [
    { id: 'admin-001', email: 'admin@resort.com', phoneNumber: '0901234567' },
    { id: 'rec-001', email: 'letan@resort.com', phoneNumber: '0912345678' },
  ];

  await t.test('1. Tạo nhân viên với thông tin hợp lệ: THÀNH CÔNG', () => {
    assert.doesNotThrow(() => {
      validateStaffCreateInput(
        {
          fullName: 'Nguyễn Văn Lễ Tân',
          email: 'letan1@annamresort.vn',
          phoneNumber: '0987654321',
          role: 'RECEPTIONIST',
          password: 'password123',
        },
        mockedUsers
      );
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
          password: '123',
        }),
      (err) => {
        assert.ok(err instanceof AppError);
        assert.strictEqual(err.statusCode, 400);
        return true;
      }
    );
  });

  await t.test('4. Chặn định dạng Email/Gmail không hợp lệ', () => {
    assert.throws(
      () =>
        validateStaffCreateInput({
          fullName: 'Nhân viên A',
          email: 'invalid-email-address',
          role: 'DRIVER',
          password: 'password123',
        }),
      (err) => {
        assert.ok(err instanceof AppError);
        assert.strictEqual(err.statusCode, 400);
        return true;
      }
    );
  });

  await t.test('5. Chặn Email/Gmail bị trùng lặp với tài khoản khác (409 Conflict)', () => {
    assert.throws(
      () =>
        validateStaffCreateInput(
          {
            fullName: 'Lễ Tân Trùng',
            email: 'admin@resort.com', // Đã tồn tại
            role: 'RECEPTIONIST',
            password: 'password123',
          },
          mockedUsers
        ),
      (err) => {
        assert.ok(err instanceof AppError);
        assert.strictEqual(err.statusCode, 409);
        return true;
      }
    );
  });

  await t.test('6. Chặn định dạng số điện thoại sai chuẩn (không đủ 10 số hoặc đầu số sai)', () => {
    assert.throws(
      () =>
        validateStaffCreateInput({
          fullName: 'Tài Xế B',
          email: 'taixeB@resort.com',
          phoneNumber: '01234', // Sai format
          role: 'DRIVER',
          password: 'password123',
        }),
      (err) => {
        assert.ok(err instanceof AppError);
        assert.strictEqual(err.statusCode, 400);
        return true;
      }
    );
  });

  await t.test('7. Chặn Số điện thoại bị trùng lặp với tài khoản khác khi tạo mới (409 Conflict)', () => {
    assert.throws(
      () =>
        validateStaffCreateInput(
          {
            fullName: 'Nhân Viên Mới',
            email: 'newbie@resort.com',
            phoneNumber: '0912345678', // Trùng số của rec-001
            role: 'DISPATCHER',
            password: 'password123',
          },
          mockedUsers
        ),
      (err) => {
        assert.ok(err instanceof AppError);
        assert.strictEqual(err.statusCode, 409);
        return true;
      }
    );
  });

  await t.test('8. Chặn cập nhật Số điện thoại trùng lặp với nhân viên khác khi sửa (409 Conflict)', () => {
    assert.throws(
      () =>
        validateStaffUpdateInput(
          'admin-001',
          adminSession,
          {
            phoneNumber: '0912345678', // Trùng số của rec-001
          },
          mockedUsers
        ),
      (err) => {
        assert.ok(err instanceof AppError);
        assert.strictEqual(err.statusCode, 409);
        return true;
      }
    );
  });

  await t.test('9. Ngăn chặn Quản trị viên tự hạ quyền Admin của chính mình', () => {
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

  await t.test('10. Ngăn chặn Quản trị viên tự khóa tài khoản của chính mình', () => {
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

  await t.test('11. Ngăn chặn Quản trị viên tự xóa tài khoản của chính mình', () => {
    assert.throws(
      () => validateStaffDelete('admin-001', adminSession, false),
      (err) => {
        assert.ok(err instanceof AppError);
        assert.strictEqual(err.statusCode, 400);
        return true;
      }
    );
  });

  await t.test('12. Ràng buộc kiểm toán tài chính (BIZ-01): Chặn xóa nhân viên đã lập biên lai thu ngân', () => {
    assert.throws(
      () => validateStaffDelete('reception-002', adminSession, true),
      (err) => {
        assert.ok(err instanceof AppError);
        assert.strictEqual(err.statusCode, 409);
        return true;
      }
    );
  });
});
