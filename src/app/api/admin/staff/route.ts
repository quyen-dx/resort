import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/lib/db';
import { authService } from '@/server/services/auth.service';
import { COOKIE_CONFIG } from '@/server/lib/auth';
import { requireRole } from '@/server/middleware/rbac';
import { AppError } from '@/server/core/errors/app-error';

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get(COOKIE_CONFIG.name)?.value;
    const session = token ? await authService.verifyToken(token) : null;
    requireRole(session, 'ADMIN');

    const staffMembers = await db.user.findMany({
      where: {
        role: { not: 'CUSTOMER' },
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        phoneNumber: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { role: 'asc' },
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
