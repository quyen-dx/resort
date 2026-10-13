import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/lib/db';
import { authService } from '@/server/services/auth.service';
import { COOKIE_CONFIG, hashPassword } from '@/server/lib/auth';
import { requireRole } from '@/server/middleware/rbac';
import { AppError } from '@/server/core/errors/app-error';
import { UserRole } from '@prisma/client';

const ALLOWED_STAFF_ROLES: UserRole[] = [
  UserRole.ADMIN,
  UserRole.RECEPTIONIST,
  UserRole.DISPATCHER,
  UserRole.DRIVER,
];

/**
 * GET /api/admin/staff/[id]
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = req.cookies.get(COOKIE_CONFIG.name)?.value;
    const session = token ? await authService.verifyToken(token) : null;
    requireRole(session, 'ADMIN');

    const { id } = await params;
    const staff = await db.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        fullName: true,
        phoneNumber: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!staff || staff.role === UserRole.CUSTOMER) {
      return NextResponse.json(
        { success: false, error: 'Không tìm thấy tài khoản nhân viên.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: staff });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ success: false, error: 'Lỗi tra cứu thông tin nhân viên' }, { status: 500 });
  }
}

/**
 * PUT /api/admin/staff/[id]
 * Updates staff account (name, phone, role, active status, optional new password)
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = req.cookies.get(COOKIE_CONFIG.name)?.value;
    const session = token ? await authService.verifyToken(token) : null;
    requireRole(session, 'ADMIN');

    const { id } = await params;
    const body = await req.json();
    const { fullName, phoneNumber, role, isActive, password } = body;

    const existingStaff = await db.user.findUnique({
      where: { id },
    });

    if (!existingStaff || existingStaff.role === UserRole.CUSTOMER) {
      return NextResponse.json(
        { success: false, error: 'Không tìm thấy tài khoản nhân viên.' },
        { status: 404 }
      );
    }

    // Role validation
    if (role && !ALLOWED_STAFF_ROLES.includes(role as UserRole)) {
      return NextResponse.json(
        { success: false, error: 'Vai trò nhân viên không hợp lệ. Chỉ cho phép ADMIN, RECEPTIONIST, DISPATCHER hoặc DRIVER.' },
        { status: 400 }
      );
    }

    // Protection rule: If admin edits themselves, prevent locking out oneself or dropping admin role
    if (session && session.id === id) {
      if (role && role !== UserRole.ADMIN) {
        return NextResponse.json(
          { success: false, error: 'Bạn không thể tự hạ vai trò Quản trị viên của chính tài khoản đang đăng nhập.' },
          { status: 400 }
        );
      }
      if (typeof isActive === 'boolean' && !isActive) {
        return NextResponse.json(
          { success: false, error: 'Bạn không thể tự vô hiệu hóa (khóa) tài khoản Quản trị viên của chính mình.' },
          { status: 400 }
        );
      }
    }

    const updateData: {
      fullName?: string;
      phoneNumber?: string | null;
      role?: UserRole;
      isActive?: boolean;
      passwordHash?: string;
    } = {};

    if (fullName && typeof fullName === 'string' && fullName.trim().length > 0) {
      updateData.fullName = fullName.trim();
    }

    if (phoneNumber !== undefined) {
      if (phoneNumber && typeof phoneNumber === 'string' && phoneNumber.trim().length > 0) {
        const sanitized = phoneNumber.trim().replace(/[\s.-]/g, '');
        const PHONE_REGEX = /^(0|\+84)(3|5|7|8|9)[0-9]{8}$/;
        if (!PHONE_REGEX.test(sanitized)) {
          return NextResponse.json(
            {
              success: false,
              error: 'Số điện thoại không hợp lệ. Vui lòng nhập số điện thoại Việt Nam 10 chữ số (ví dụ: 0912345678).',
            },
            { status: 400 }
          );
        }

        // Check duplicate phone against other users
        const duplicatePhone = await db.user.findFirst({
          where: {
            phoneNumber: sanitized,
            id: { not: id },
          },
        });

        if (duplicatePhone) {
          return NextResponse.json(
            {
              success: false,
              error: `Số điện thoại "${sanitized}" đã được sử dụng bởi nhân viên khác (${duplicatePhone.fullName}).`,
            },
            { status: 409 }
          );
        }
        updateData.phoneNumber = sanitized;
      } else {
        updateData.phoneNumber = null;
      }
    }

    if (role) {
      updateData.role = role as UserRole;
    }

    if (typeof isActive === 'boolean') {
      updateData.isActive = isActive;
    }

    // If password is supplied and not empty, update hash
    if (password && typeof password === 'string' && password.trim().length > 0) {
      if (password.length < 6) {
        return NextResponse.json(
          { success: false, error: 'Mật khẩu mới phải có ít nhất 6 ký tự.' },
          { status: 400 }
        );
      }
      updateData.passwordHash = await hashPassword(password);
    }

    const updated = await db.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        fullName: true,
        phoneNumber: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Cập nhật tài khoản nhân viên thành công.',
      data: updated,
    });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode });
    }
    const message = error instanceof Error ? error.message : 'Lỗi cập nhật nhân viên';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/staff/[id]
 * Deletes or archives a staff account
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = req.cookies.get(COOKIE_CONFIG.name)?.value;
    const session = token ? await authService.verifyToken(token) : null;
    requireRole(session, 'ADMIN');

    const { id } = await params;

    // Protection rule: Cannot delete self
    if (session && session.id === id) {
      return NextResponse.json(
        { success: false, error: 'Bạn không thể tự xóa tài khoản Quản trị viên đang đăng nhập của chính mình.' },
        { status: 400 }
      );
    }

    const staff = await db.user.findUnique({
      where: { id },
      include: {
        paymentsCollected: { select: { id: true }, take: 1 },
      },
    });

    if (!staff || staff.role === UserRole.CUSTOMER) {
      return NextResponse.json(
        { success: false, error: 'Không tìm thấy tài khoản nhân viên.' },
        { status: 404 }
      );
    }

    // Financial audit check: if receptionist recorded payments, restrict delete to protect audit logs
    if (staff.paymentsCollected && staff.paymentsCollected.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Không thể xóa vĩnh viễn nhân sự này vì đã gắn liền với các biên lai thu tiền quầy hợp lệ (ràng buộc kiểm toán BIZ-01). Vui lòng chuyển trạng thái sang Tạm dừng/Khóa hoạt động.',
        },
        { status: 409 }
      );
    }

    // Delete staff
    await db.user.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: `Đã xóa tài khoản nhân viên ${staff.fullName} thành công.`,
    });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode });
    }
    const message = error instanceof Error ? error.message : 'Lỗi xóa tài khoản nhân viên';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
