'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import styles from './admin.module.css';

interface DashboardStats {
  totalBookings: number;
  confirmedBookings: number;
  checkedInBookings: number;
  totalRevenue: number;
  totalAmountDue: number;
  totalBalance: number;
  totalRooms: number;
  occupiedRooms: number;
  availableRooms: number;
  occupancyRate: number;
  totalCustomers: number;
  totalStaff: number;
  activeRides: number;
}

interface RecentBooking {
  id: string;
  bookingCode: string;
  customerName: string;
  customerPhone: string;
  checkInDate: string;
  checkOutDate: string;
  totalAmount: number;
  status: string;
  roomType: {
    name: string;
    code: string;
  };
  assignedRoom?: {
    roomNumber: string;
  } | null;
}

interface PendingRide {
  id: string;
  rideCode: string;
  passengerName: string;
  pickupLocation: string;
  dropoffLocation: string;
  pickupTime: string;
  status: string;
  driver?: {
    fullName: string;
  } | null;
}

interface DashboardData {
  stats: DashboardStats;
  recentBookings: RecentBooking[];
  pendingRides: PendingRide[];
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/admin/dashboard');
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Không thể tải dữ liệu thống kê quản trị');
      }
      setData(json.data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi kết nối máy chủ';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const formatVND = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('vi-VN');
    } catch {
      return dateStr;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return <span style={{ color: '#68d391', fontWeight: 600 }}>Đã xác nhận</span>;
      case 'CHECKED_IN':
        return <span style={{ color: '#63b3ed', fontWeight: 600 }}>Đang lưu trú</span>;
      case 'COMPLETED':
        return <span style={{ color: '#a0aec0', fontWeight: 600 }}>Hoàn tất</span>;
      case 'CANCELLED':
        return <span style={{ color: '#fc8181', fontWeight: 600 }}>Đã hủy</span>;
      default:
        return <span>{status}</span>;
    }
  };

  const getRideStatusBadge = (status: string) => {
    switch (status) {
      case 'REQUESTED':
        return <span style={{ color: '#ecc94b', fontSize: 11, fontWeight: 700 }}>CHỜ XE</span>;
      case 'ASSIGNED':
        return <span style={{ color: '#63b3ed', fontSize: 11, fontWeight: 700 }}>ĐÃ ĐIỀU TÀI</span>;
      case 'IN_TRANSIT':
        return <span style={{ color: '#68d391', fontSize: 11, fontWeight: 700 }}>ĐANG CHẠY</span>;
      default:
        return <span style={{ fontSize: 11 }}>{status}</span>;
    }
  };

  return (
    <div className={styles.container}>
      {/* Page Title & Controls */}
      <div className={styles.pageHeader}>
        <div className={styles.titleArea}>
          <h1>Quản Trị Resort An Nam</h1>
          <p>Bảng điều khiển tổng quan vận hành, tồn kho buồng phòng &amp; dịch vụ vận chuyển</p>
        </div>
        <button
          onClick={fetchDashboardData}
          disabled={loading}
          className={styles.refreshBtn}
        >
          {loading ? 'Đang cập nhật...' : '🔄 Làm mới dữ liệu'}
        </button>
      </div>

      {/* Quick Action Shortcuts */}
      <div className={styles.shortcutsRow}>
        <Link href="/admin/bookings" className={styles.shortcutBtn}>
          <span>📅</span> Quản Lý Đặt Phòng
        </Link>
        <Link href="/admin/rooms" className={styles.shortcutBtn}>
          <span>🚪</span> Quản Lý Phòng
        </Link>
        <Link href="/admin/room-types" className={styles.shortcutBtn}>
          <span>🏨</span> Loại Phòng
        </Link>
        <Link href="/admin/customers" className={styles.shortcutBtn}>
          <span>👥</span> Khách Hàng
        </Link>
        <Link href="/admin/staff" className={styles.shortcutBtn}>
          <span>👔</span> Nhân Viên
        </Link>
        <Link href="/admin/transfers" className={styles.shortcutBtn}>
          <span>🚗</span> Điều Phối Xe
        </Link>
        <Link href="/admin/system-health" className={styles.shortcutBtn}>
          <span>🩺</span> Giám Sát Kỹ Thuật
        </Link>
      </div>

      {/* Error state */}
      {error && <div className={styles.errorBox}>{error}</div>}

      {/* Loading state */}
      {loading && !data && (
        <div className={styles.loadingBox}>
          Đang truy vấn dữ liệu thời gian thực từ cơ sở dữ liệu...
        </div>
      )}

      {/* Metrics & Operations */}
      {data && (
        <>
          {/* Key Metric Cards */}
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statHeader}>
                <span className={styles.statLabel}>Doanh Thu Thực Thu</span>
                <span className={styles.statIcon}>💰</span>
              </div>
              <div className={styles.statValue}>
                {formatVND(data.stats.totalRevenue)}
              </div>
              <div className={styles.statSubtext}>
                Tổng giá trị đặt phòng: {formatVND(data.stats.totalAmountDue)}
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statHeader}>
                <span className={styles.statLabel}>Tổng Đặt Phòng</span>
                <span className={styles.statIcon}>📑</span>
              </div>
              <div className={styles.statValue}>{data.stats.totalBookings}</div>
              <div className={styles.statSubtext}>
                {data.stats.confirmedBookings} đã xác nhận • {data.stats.checkedInBookings} đang lưu trú
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statHeader}>
                <span className={styles.statLabel}>Công Suất Buồng Phòng</span>
                <span className={styles.statIcon}>🏨</span>
              </div>
              <div className={styles.statValue}>{data.stats.occupancyRate}%</div>
              <div className={styles.statSubtext}>
                {data.stats.occupiedRooms} phòng đang ở / {data.stats.totalRooms} tổng phòng
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statHeader}>
                <span className={styles.statLabel}>Phòng Trống Khả Dụng</span>
                <span className={styles.statIcon}>🚪</span>
              </div>
              <div className={styles.statValue}>{data.stats.availableRooms}</div>
              <div className={styles.statSubtext}>
                Sẵn sàng tiếp đón khách mới
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statHeader}>
                <span className={styles.statLabel}>Khách Hàng Đăng Ký</span>
                <span className={styles.statIcon}>👥</span>
              </div>
              <div className={styles.statValue}>{data.stats.totalCustomers}</div>
              <div className={styles.statSubtext}>Hồ sơ khách trong hệ sinh thái</div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statHeader}>
                <span className={styles.statLabel}>Chuyến Xe Đang Xử Lý</span>
                <span className={styles.statIcon}>🚗</span>
              </div>
              <div className={styles.statValue}>{data.stats.activeRides}</div>
              <div className={styles.statSubtext}>Đang chờ phân bổ hoặc vận chuyển</div>
            </div>
          </div>

          {/* Detailed Content Grid */}
          <div className={styles.dashboardGrid}>
            {/* Recent Bookings Table */}
            <div className={styles.cardSection}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Đặt Phòng Gần Đây</h2>
                <Link href="/admin/bookings" className={styles.viewAllLink}>
                  Xem tất cả ↗
                </Link>
              </div>

              {data.recentBookings.length === 0 ? (
                <div style={{ color: '#718096', padding: '24px 0', textAlign: 'center' }}>
                  Chưa có giao dịch đặt phòng nào trong hệ thống.
                </div>
              ) : (
                <div className={styles.tableWrapper}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Mã Đặt</th>
                        <th>Khách Hàng</th>
                        <th>Loại Phòng</th>
                        <th>Phòng Gán</th>
                        <th>Kỳ Lưu Trú</th>
                        <th>Tổng Tiền</th>
                        <th>Trạng Thái</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.recentBookings.map((b) => (
                        <tr key={b.id}>
                          <td className={styles.bookingCode}>{b.bookingCode}</td>
                          <td>
                            <div className={styles.guestInfo}>
                              <span className={styles.guestName}>{b.customerName}</span>
                              <span className={styles.guestPhone}>{b.customerPhone}</span>
                            </div>
                          </td>
                          <td>{b.roomType?.name || '---'}</td>
                          <td>
                            {b.assignedRoom?.roomNumber ? (
                              <strong style={{ color: '#c5a880' }}>
                                #{b.assignedRoom.roomNumber}
                              </strong>
                            ) : (
                              <span style={{ color: '#718096', fontStyle: 'italic' }}>
                                Chưa gán
                              </span>
                            )}
                          </td>
                          <td style={{ fontSize: 12 }}>
                            {formatDate(b.checkInDate)} → {formatDate(b.checkOutDate)}
                          </td>
                          <td style={{ fontWeight: 600 }}>{formatVND(b.totalAmount)}</td>
                          <td>{getStatusBadge(b.status)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Pending Transfers / Operational Alert */}
            <div className={styles.cardSection}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Chuyến Xe Đang Chờ</h2>
                <Link href="/admin/transfers" className={styles.viewAllLink}>
                  Điều phối xe ↗
                </Link>
              </div>

              {data.pendingRides.length === 0 ? (
                <div style={{ color: '#718096', padding: '24px 0', textAlign: 'center' }}>
                  Không có chuyến xe nào đang chờ xử lý.
                </div>
              ) : (
                <div className={styles.pendingList}>
                  {data.pendingRides.map((ride) => (
                    <div key={ride.id} className={styles.pendingItem}>
                      <div className={styles.pendingItemHeader}>
                        <span className={styles.rideCode}>{ride.rideCode}</span>
                        {getRideStatusBadge(ride.status)}
                      </div>
                      <div className={styles.passengerName}>
                        {ride.passengerName}
                      </div>
                      <div className={styles.routeText}>
                        📍 {ride.pickupLocation} ➔ {ride.dropoffLocation}
                      </div>
                      <div style={{ fontSize: 11, color: '#718096' }}>
                        Tài xế: {ride.driver?.fullName || 'Chưa phân công'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
