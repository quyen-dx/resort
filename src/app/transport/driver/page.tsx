'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatVND } from '@/client/utils/currency';
import { formatDateVN } from '@/client/utils/date';
import { Badge } from '@/client/components/ui/badge';
import styles from './driver.module.css';

interface DriverItem {
  id: string;
  fullName: string;
  phoneNumber: string;
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
  };
  driver: {
    id: string;
    fullName: string;
  } | null;
}

export default function DriverMobilePortalPage() {
  const [drivers, setDrivers] = useState<DriverItem[]>([]);
  const [selectedDriverId, setSelectedDriverId] = useState<string>('');
  const [rides, setRides] = useState<TransportRideItem[]>([]);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const loadData = () => {
    fetch('/api/transport/rides')
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          setDrivers(json.data.drivers);
          setRides(json.data.rides);
          if (json.data.drivers.length > 0 && !selectedDriverId) {
            setSelectedDriverId(json.data.drivers[0].id);
          }
        }
      });
  };

  useEffect(() => {
    loadData();
  }, []);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3500);
  };

  const handleUpdateStatus = async (rideId: string, nextStatus: 'IN_TRANSIT' | 'COMPLETED') => {
    try {
      const res = await fetch('/api/transport/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rideId, status: nextStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast(
        nextStatus === 'IN_TRANSIT'
          ? 'Đã bắt đầu đón khách! Chuyến xe đang di chuyển.'
          : 'Chúc mừng! Chuyến đi đã hoàn tất xuất sắc.'
      );
      loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi cập nhật';
      showToast(msg, 'error');
    }
  };

  const handlePingGps = async (rideId: string) => {
    try {
      const res = await fetch('/api/transport/simulate-ping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rideId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast(`Đã đồng bộ tọa độ GPS: [${data.data.latitude}, ${data.data.longitude}]`);
      loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi GPS';
      showToast(msg, 'error');
    }
  };

  // Filter rides assigned to this driver
  const myRides = rides.filter((r) => r.driver?.id === selectedDriverId);
  const activeDriver = drivers.find((d) => d.id === selectedDriverId);

  return (
    <div className={styles.mobileWrapper}>
      {/* Header */}
      <header className={styles.mobileHeader}>
        <div className={styles.brand}>
          AN NAM DRIVER
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <span className={styles.driverRoleBadge}>Tài xế chuyên tuyến</span>
          <Link href="/transport/dispatch" style={{ color: 'var(--color-accent)', fontSize: '0.8rem' }}>
            Điều phối →
          </Link>
        </div>
      </header>

      {/* Toast */}
      {notification && (
        <div className={`${styles.toast} ${notification.type === 'success' ? styles.toastSuccess : styles.toastError}`}>
          {notification.message}
        </div>
      )}

      <main className={styles.contentContainer}>
        {/* Driver Account Info (Khóa theo tài khoản đăng nhập) */}
        <div className={styles.driverSelectorBox}>
          <label className={styles.driverLabel}>
            Tài xế đang nhận nhiệm vụ
          </label>
          <div style={{ fontWeight: 700, color: 'var(--color-primary)', fontSize: '1rem', marginTop: '4px' }}>
            {activeDriver?.fullName || 'Tài xế Resort'}
          </div>
        </div>


        {/* Trips List */}
        <div>
          <h3 style={{ fontSize: '1.05rem', color: 'var(--color-primary)', fontWeight: 700, marginBottom: '0.85rem' }}>
            Nhiệm Vụ Vận Chuyển Của Bạn ({myRides.length})
          </h3>

          {myRides.length === 0 ? (
            <div className={styles.emptyRides}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>☕</div>
              <p>Hiện chưa có chuyến xe nào được điều phối cho tài xế {activeDriver?.fullName || ''}.</p>
            </div>
          ) : (
            myRides.map((ride) => (
              <div key={ride.id} className={styles.tripCard}>
                <div className={styles.tripCardHeader}>
                  <div>
                    <div className={styles.rideCode}>{ride.rideCode}</div>
                    <div className={styles.pickupTime}>
                      Giờ đón: {formatDateVN(ride.pickupTime)} •{' '}
                      {new Date(ride.pickupTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <div>
                    {ride.status === 'ASSIGNED' && <Badge variant="gold">Chờ đón</Badge>}
                    {ride.status === 'IN_TRANSIT' && <Badge variant="emerald">Đang đón</Badge>}
                    {ride.status === 'COMPLETED' && <Badge variant="success">Hoàn thành</Badge>}
                  </div>
                </div>

                {/* Passenger Box */}
                <div className={styles.passengerBox}>
                  <div>
                    <div className={styles.passengerName}>{ride.passengerName}</div>
                    <div className={styles.passengerPhone}>{ride.passengerPhone}</div>
                    {ride.flightNumber && (
                      <div style={{ fontSize: '0.78rem', color: '#8f6f46', marginTop: '0.2rem' }}>
                        ✈ Chuyến bay: <strong>{ride.flightNumber}</strong>
                      </div>
                    )}
                  </div>
                  <a href={`tel:${ride.passengerPhone}`} className={styles.callButton}>
                    📞 Gọi Khách
                  </a>
                </div>

                {/* Route Timeline */}
                <div className={styles.routeTimeline}>
                  <div className={styles.timelineItem}>
                    <div className={styles.timelineDot} />
                    <div className={styles.timelineLabel}>Điểm đón</div>
                    <div className={styles.timelineValue}>{ride.pickupLocation}</div>
                  </div>
                  <div className={styles.timelineItem}>
                    <div className={styles.timelineDot} style={{ backgroundColor: 'var(--color-accent)' }} />
                    <div className={styles.timelineLabel}>Điểm trả</div>
                    <div className={styles.timelineValue}>{ride.dropoffLocation}</div>
                  </div>
                </div>

                {/* GPS and Distance Info */}
                <div className={styles.gpsBar}>
                  <span>Lộ trình: {Number(ride.distanceKm)} km ({formatVND(ride.totalPrice)})</span>
                  {ride.lastLatitude && (
                    <span style={{ fontFamily: 'monospace' }}>
                      GPS: {Number(ride.lastLatitude).toFixed(4)}, {Number(ride.lastLongitude).toFixed(4)}
                    </span>
                  )}
                </div>

                {/* Action Buttons Based on Status */}
                {ride.status === 'ASSIGNED' && (
                  <button
                    onClick={() => handleUpdateStatus(ride.id, 'IN_TRANSIT')}
                    className={styles.actionButtonStart}
                  >
                    🚗 Bắt Đầu Đón Khách (Khởi Hành)
                  </button>
                )}

                {ride.status === 'IN_TRANSIT' && (
                  <div>
                    <button
                      onClick={() => handleUpdateStatus(ride.id, 'COMPLETED')}
                      className={styles.actionButtonComplete}
                    >
                      ✓ Trả Khách Thành Công &amp; Hoàn Tất Chuyến
                    </button>
                    <button
                      onClick={() => handlePingGps(ride.id)}
                      className={styles.actionButtonPing}
                    >
                      🛰️ Bấm Gửi Tọa Độ Xe Đến Resort
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
