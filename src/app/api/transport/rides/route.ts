import { NextRequest, NextResponse } from 'next/server';
import { TransportService } from '@/server/services/transport.service';
import { authService } from '@/server/services/auth.service';
import { COOKIE_CONFIG } from '@/server/lib/auth';
import { requireAuth, requireRole } from '@/server/middleware/rbac';
import { AppError } from '@/server/core/errors/app-error';
import { RideStatus } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(COOKIE_CONFIG.name)?.value;
    const session = token ? await authService.verifyToken(token) : null;

    // 1. Must be authenticated (Default Deny - SEC-03)
    const user = requireAuth(session);

    // 2. Reject Customer accounts (Customers cannot access internal fleet data)
    if (user.role === 'CUSTOMER') {
      throw new AppError(
        'FORBIDDEN',
        'Khách hàng không có quyền truy cập dữ liệu điều phối và danh sách xe nội bộ.',
        403
      );
    }

    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get('status') as RideStatus | null;
    const driverIdParam = searchParams.get('driverId') || undefined;

    // 3. Driver Role Enforcement:
    // - Drivers can ONLY view rides assigned to themselves.
    // - If attempting to query another driver's ID -> 403 Forbidden
    if (user.role === 'DRIVER') {
      if (driverIdParam && driverIdParam !== user.id) {
        throw new AppError(
          'FORBIDDEN',
          'Tài xế không có quyền xem nhiệm vụ vận chuyển của tài xế khác.',
          403
        );
      }

      // Filter strictly to current driver only
      const myRides = await TransportService.getRides({
        status: statusParam || undefined,
        driverId: user.id,
      });

      return NextResponse.json({
        success: true,
        data: {
          summary: null,
          rides: myRides,
          drivers: [{ id: user.id, fullName: user.fullName }],
        },
      });
    }

    // 4. Dispatcher & Admin: Full operational visibility
    requireRole(user, 'DISPATCHER', 'ADMIN');

    const [summary, rides, drivers] = await Promise.all([
      TransportService.getTransportSummary(),
      TransportService.getRides({
        status: statusParam || undefined,
        driverId: driverIdParam,
      }),
      TransportService.getAvailableDrivers(),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        summary,
        rides,
        drivers,
      },
    });
  } catch (error: unknown) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, error: error.message, code: error.code },
        { status: error.statusCode }
      );
    }
    const message = error instanceof Error ? error.message : 'Lỗi lấy danh sách chuyến xe';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
