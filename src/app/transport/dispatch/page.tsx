'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatVND } from '@/client/utils/currency';
import { formatDateVN } from '@/client/utils/date';
import { Badge } from '@/client/components/ui/badge';
import styles from './dispatch.module.css';

interface DriverItem {
  id: string;
  fullName: string;
  phoneNumber: string;
  email: string;
}

interface TransportRideItem {
  id: string;
  rideCode: string;
  passengerName: string;
  passengerPhone: string;
  flightNumber: string | null;
  pickupLocation: string;
  dropoffLocation: string;
  distanceKm: number;
  totalPrice: number;
  status: 'REQUESTED' | 'ASSIGNED' | 'IN_TRANSIT' | 'COMPLETED' | 'CANCELLED';
  pickupTime: string;
  lastLatitude: number | null;
  lastLongitude: number | null;
  booking: {
    bookingCode: string;
    customerName: string;
    customerPhone: string;
    roomType: { name: string };
  };
  driver: {
    id: string;
    fullName: string;
    phoneNumber: string;
  } | null;
}

interface SummaryStats {
  total: number;
  requested: number;
  assigned: number;
  inTransit: number;
  completed: number;
  cancelled: number;
  totalDrivers: number;
}

export default function DispatcherDashboardPage() {
  const [rides, setRides] = useState<TransportRideItem[]>([]);
  const [drivers, setDrivers] = useState<DriverItem[]>([]);
  const [summary, setSummary] = useState<SummaryStats | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<string>('ALL');
  const [driverAssignments, setDriverAssignments] = useState<Record<string, string>>({});
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const loadData = () => {
    fetch('/api/transport/rides')
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          setRides(json.data.rides);
          setDrivers(json.data.drivers);
          setSummary(json.data.summary);
        }
      });
  };

  useEffect(() => {
    loadData();
  }, []);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleAssignDriver = async (rideId: string) => {
    const driverId = driverAssignments[rideId];
    if (!driverId) {
      showToast('Vui lòng chọn tài xế từ danh sách!', 'error');
      return;
    }

    try {
      const res = await fetch('/api/transport/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rideId, driverId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast('Đã phân công tài xế thành công!');
      loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi phân tài xế';
      showToast(msg, 'error');
    }
  };

  const handleSimulatePing = async (rideId: string) => {
    try {
      const res = await fetch('/api/transport/simulate-ping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rideId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast(`Cập nhật tọa độ GPS: [${data.data.latitude}, ${data.data.longitude}]`);
      loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi ping tọa độ';
      showToast(msg, 'error');
    }
  };

  const filteredRides = rides.filter((r) => {
    if (selectedFilter === 'ALL') return true;
    return r.status === selectedFilter;
  });

  const getStatusBadge = (status: TransportRideItem['status']) => {
    switch (status) {
      case 'REQUESTED':
        return <Badge variant="warning">Chờ Phân Xe</Badge>;
      case 'ASSIGNED':
        return <Badge variant="gold">Đã Gán Tài Xế</Badge>;
      case 'IN_TRANSIT':
        return <Badge variant="emerald">Đang Đón / Di Chuyển</Badge>;
      case 'COMPLETED':
        return <Badge variant="success">Hoàn Thành</Badge>;
      case 'CANCELLED':
        return <Badge variant="gray">Đã Hủy</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className={styles.pageWrapper}>
      {/* Top Header */}
      <header className={styles.header}>
        <div className={styles.brandGroup}>
          <Link href="/" className={styles.brandLink}>
            AN NAM RESORT
          </Link>
          <span className={styles.divider}>|</span>
          <span className={styles.headerTitle}>Hệ Thống Điều Phối Xe Đưa Đón (Fleet Dispatcher)</span>
        </div>

        <div className={styles.navGroup}>
          <Link href="/transport/driver" className={styles.navButton}>
            Giao Diện Tài Xế (Driver View) →
          </Link>
          <Link href="/reception" className={styles.navButton}>
            Bàn Lễ Tân →
          </Link>
        </div>
      </header>

      {/* Toast */}
      {notification && (
        <div className={`${styles.toast} ${notification.type === 'success' ? styles.toastSuccess : styles.toastError}`}>
          {notification.message}
        </div>
      )}

      <div className={styles.container}>
        {/* Sandbox Notice Banner */}
        <div className={styles.sandboxNotice}>
          <div>
            🚗 <strong>Mock Sandbox Adapter (INT-01, Decision Rule 5):</strong> Hệ thống đang vận hành qua bộ điều hợp giả lập chuẩn. Đơn giá mẫu niêm yết: <strong>4.000 ₫/km</strong> (Sẵn sàng tích hợp API nhà xe khi có thông tin đối tác chính thức).
          </div>
          <div>
            <Badge variant="gold">Sandbox Active</Badge>
          </div>
        </div>

        {/* Stats Summary Cards */}
        {summary && (
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statLabel}>Tổng Chuyến Xe</div>
              <div className={styles.statValue}>{summary.total}</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statLabel}>Chờ Điều Xe</div>
              <div className={styles.statValue} style={{ color: '#b45309' }}>{summary.requested}</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statLabel}>Đã Gán Tài Xế</div>
              <div className={styles.statValue} style={{ color: '#8f6f46' }}>{summary.assigned}</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statLabel}>Đang Trên Đường</div>
              <div className={styles.statValue} style={{ color: '#0f2a24' }}>{summary.inTransit}</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statLabel}>Hoàn Thành</div>
              <div className={styles.statValue} style={{ color: '#13653f' }}>{summary.completed}</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statLabel}>Đội Ngũ Tài Xế</div>
              <div className={styles.statValue}>{summary.totalDrivers}</div>
            </div>
          </div>
        )}

        {/* Main Rides Table Card */}
        <div className={styles.tableCard}>
          <div className={styles.tableCardHeader}>
            <h2 className={styles.tableCardTitle}>
              Danh Sách Chuyến Xe Đón Tiễn Sân Bay
            </h2>

            {/* Filter Buttons */}
            <div className={styles.filterGroup}>
              {['ALL', 'REQUESTED', 'ASSIGNED', 'IN_TRANSIT', 'COMPLETED'].map((filterKey) => (
                <button
                  key={filterKey}
                  onClick={() => setSelectedFilter(filterKey)}
                  className={`${styles.filterBtn} ${selectedFilter === filterKey ? styles.filterBtnActive : ''}`}
                >
                  {filterKey === 'ALL' && 'Tất cả'}
                  {filterKey === 'REQUESTED' && 'Chờ phân xe'}
                  {filterKey === 'ASSIGNED' && 'Đã gán'}
                  {filterKey === 'IN_TRANSIT' && 'Đang chạy'}
                  {filterKey === 'COMPLETED' && 'Hoàn thành'}
                </button>
              ))}
            </div>
          </div>

          {filteredRides.length === 0 ? (
            <div className={styles.emptyNotice}>
              Không có chuyến xe nào phù hợp với bộ lọc hiện tại.
            </div>
          ) : (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th className={styles.th}>Mã Chuyến</th>
                    <th className={styles.th}>Hành Khách &amp; Chuyến Bay</th>
                    <th className={styles.th}>Lộ Trình &amp; Cự Ly</th>
                    <th className={styles.th}>Thời Gian Đón</th>
                    <th className={styles.th}>Trạng Thái</th>
                    <th className={styles.th}>Tài Xế Phụ Trách</th>
                    <th className={styles.th}>Thao Tác Điều Phối</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRides.map((ride) => (
                    <tr key={ride.id} className={styles.tr}>
                      <td className={styles.td}>
                        <div className={styles.rideCode}>{ride.rideCode}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                          Booking: {ride.booking.bookingCode}
                        </div>
                      </td>
                      <td className={styles.td}>
                        <div style={{ fontWeight: 600 }}>{ride.passengerName}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{ride.passengerPhone}</div>
                        {ride.flightNumber && (
                          <div style={{ marginTop: '0.25rem' }}>
                            <span className={styles.flightBadge}>✈ {ride.flightNumber}</span>
                          </div>
                        )}
                      </td>
                      <td className={styles.td}>
                        <div>{ride.pickupLocation} → {ride.dropoffLocation}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                          {Number(ride.distanceKm)} km • {formatVND(ride.totalPrice)}
                        </div>
                      </td>
                      <td className={styles.td}>
                        <div>{formatDateVN(ride.pickupTime)}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                          {new Date(ride.pickupTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td className={styles.td}>
                        {getStatusBadge(ride.status)}
                      </td>
                      <td className={styles.td}>
                        {ride.driver ? (
                          <div>
                            <div style={{ fontWeight: 600 }}>{ride.driver.fullName}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{ride.driver.phoneNumber}</div>
                            {ride.lastLatitude && ride.lastLongitude && (
                              <div className={styles.gpsCoords}>
                                📍 {Number(ride.lastLatitude).toFixed(4)}, {Number(ride.lastLongitude).toFixed(4)}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                            <select
                              value={driverAssignments[ride.id] || ''}
                              onChange={(e) =>
                                setDriverAssignments({ ...driverAssignments, [ride.id]: e.target.value })
                              }
                              className={styles.driverSelect}
                            >
                              <option value="">-- Chọn tài xế --</option>
                              {drivers.map((d) => (
                                <option key={d.id} value={d.id}>
                                  {d.fullName} ({d.phoneNumber})
                                </option>
                              ))}
                            </select>
                            <button
                              onClick={() => handleAssignDriver(ride.id)}
                              className={styles.assignBtn}
                            >
                              Gán
                            </button>
                          </div>
                        )}
                      </td>
                      <td className={styles.td}>
                        {ride.status === 'IN_TRANSIT' && (
                          <button
                            onClick={() => handleSimulatePing(ride.id)}
                            className={styles.pingBtn}
                          >
                            🛰️ Ping GPS Xe
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
