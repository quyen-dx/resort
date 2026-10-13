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
 * GET /api/admin/staff
 * Lists all staff accounts (excluding role CUSTOMER)
 */
export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get(COOKIE_CONFIG.name)?.value;
    const session = token ? await authService.verifyToken(token) : null;
    requireRole(session, 'ADMIN');

    const staffMembers = await db.user.findMany({
      where: {
        role: { not: UserRole.CUSTOMER },
      },
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
      orderBy: [{ role: 'asc' }, { createdAt: 'desc' }],
    });

    return NextResponse.json({
      success: true,
      data: staffMembers,
    });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ success: false, error: 'Lỗi tải danh sách nhân viên' }, { status: 500 });
  }
}

/**
 * POST /api/admin/staff
 * Creates a new staff account (ADMIN, RECEPTIONIST, DISPATCHER, DRIVER)
 */
export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get(COOKIE_CONFIG.name)?.value;
    const session = token ? await authService.verifyToken(token) : null;
    requireRole(session, 'ADMIN');

    const body = await req.json();
    const { fullName, email, phoneNumber, role, password, isActive = true } = body;

    // 1. Validation
    if (!fullName || typeof fullName !== 'string' || fullName.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Họ và tên nhân viên không được để trống.' },
        { status: 400 }
      );
    }

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { success: false, error: 'Email không hợp lệ.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // Role validation: Must be a staff role, definitely not CUSTOMER
    if (!role || !ALLOWED_STAFF_ROLES.includes(role as UserRole)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Vai trò nhân viên không hợp lệ. Chỉ cho phép ADMIN, RECEPTIONIST, DISPATCHER hoặc DRIVER.',
        },
        { status: 400 }
      );
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Mật khẩu phải có ít nhất 6 ký tự.' },
        { status: 400 }
      );
    }

    // 2. Check email uniqueness
    const existingUser = await db.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'Email này đã được sử dụng bởi một tài khoản khác trong hệ thống.' },
        { status: 409 }
      );
    }

    // 3. Hash password
    const passwordHash = await hashPassword(password);

    // 4. Create user
    const newStaff = await db.user.create({
      data: {
        fullName: fullName.trim(),
        email: cleanEmail,
        phoneNumber: phoneNumber ? phoneNumber.trim() : null,
        role: role as UserRole,
        passwordHash,
        isActive: Boolean(isActive),
      },
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

    return NextResponse.json(
      {
        success: true,
        message: 'Tạo tài khoản nhân viên thành công.',
        data: newStaff,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode });
    }
    const message = error instanceof Error ? error.message : 'Lỗi tạo tài khoản nhân viên';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
