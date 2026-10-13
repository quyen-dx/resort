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

    // Strict Server-Side RBAC: Only ADMIN can access Admin Dashboard API
    requireRole(session, 'ADMIN');

    // Run parallel queries against PostgreSQL database
    const [
      totalBookingsCount,
      confirmedCount,
      checkedInCount,
      totalRoomsCount,
      occupiedRoomsCount,
      availableRoomsCount,
      customersCount,
      staffCount,
      activeRidesCount,
      revenueAggregation,
      recentBookings,
      pendingRides,
    ] = await Promise.all([
      db.booking.count(),
      db.booking.count({ where: { status: 'CONFIRMED' } }),
      db.booking.count({ where: { status: 'CHECKED_IN' } }),
      db.room.count(),
      db.room.count({ where: { status: 'OCCUPIED' } }),
      db.room.count({ where: { status: 'AVAILABLE' } }),
      db.user.count({ where: { role: 'CUSTOMER' } }),
      db.user.count({ where: { role: { not: 'CUSTOMER' } } }),
      db.transportRide.count({
        where: { status: { in: ['REQUESTED', 'ASSIGNED', 'IN_TRANSIT'] } },
      }),
      db.booking.aggregate({
        _sum: {
          amountPaid: true,
          amountDue: true,
          balance: true,
        },
      }),
      db.booking.findMany({
        take: 8,
        orderBy: { createdAt: 'desc' },
        include: {
          roomType: { select: { name: true, code: true } },
          assignedRoom: { select: { roomNumber: true } },
        },
      }),
      db.transportRide.findMany({
        take: 5,
        where: { status: { in: ['REQUESTED', 'ASSIGNED', 'IN_TRANSIT'] } },
        orderBy: { pickupTime: 'asc' },
        include: {
          driver: { select: { fullName: true } },
        },
      }),
    ]);

    const occupancyRate =
      totalRoomsCount > 0 ? Math.round((occupiedRoomsCount / totalRoomsCount) * 100) : 0;

    return NextResponse.json({
      success: true,
      data: {
        stats: {
          totalBookings: totalBookingsCount,
          confirmedBookings: confirmedCount,
          checkedInBookings: checkedInCount,
          totalRevenue: revenueAggregation._sum.amountPaid || 0,
          totalAmountDue: revenueAggregation._sum.amountDue || 0,
          totalBalance: revenueAggregation._sum.balance || 0,
          totalRooms: totalRoomsCount,
          occupiedRooms: occupiedRoomsCount,
          availableRooms: availableRoomsCount,
          occupancyRate,
          totalCustomers: customersCount,
          totalStaff: staffCount,
          activeRides: activeRidesCount,
        },
        recentBookings,
        pendingRides,
      },
    });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, error: error.message, code: error.code },
        { status: error.statusCode }
      );
    }
    const message = error instanceof Error ? error.message : 'Lỗi nạp dữ liệu quản trị';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
