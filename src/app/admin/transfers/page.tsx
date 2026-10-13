'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import styles from './transfers.module.css';

interface TransferItem {
  id: string;
  rideCode: string;
  passengerName: string;
  passengerPhone: string;
  pickupLocation: string;
  dropoffLocation: string;
  pickupTime: string;
  estimatedPrice: number;
  actualPrice: number | null;
  status: string;
  driver?: {
    fullName: string;
    phoneNumber: string | null;
  } | null;
}

export default function AdminTransfersPage() {
  const [rides, setRides] = useState<TransferItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/transfers')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setRides(data.data);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const formatVND = (amt: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amt);
  };

  const formatDateTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return `${d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} ${d.toLocaleDateString('vi-VN')}`;
    } catch {
      return dateStr;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'REQUESTED':
        return <span className={styles.statusRequested}>CHỜ XE</span>;
      case 'ASSIGNED':
        return <span className={styles.statusAssigned}>ĐÃ GÁN TÀI</span>;
      case 'IN_TRANSIT':
        return <span className={styles.statusInTransit}>ĐANG CHẠY</span>;
      case 'COMPLETED':
        return <span className={styles.statusCompleted}>HOÀN THÀNH</span>;
      case 'CANCELLED':
        return <span className={styles.statusCancelled}>ĐÃ HỦY</span>;
      default:
        return <span>{status}</span>;
    }
  };

  return (
    <div className={styles.container}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div className={styles.titleArea}>
          <h1>Quản Lý &amp; Điều Phối Chuyến Xe Vận Chuyển</h1>
          <p>Giám sát toàn bộ lộ trình đưa đón khách, tài xế phụ trách và trạng thái hành trình</p>
        </div>
        <Link
          href="/transport/dispatch"
          style={{
            background: 'rgba(197, 168, 128, 0.15)',
            border: '1px solid rgba(197, 168, 128, 0.4)',
            color: '#c5a880',
            padding: '8px 16px',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          Mở Bàn Điều Phối Trực Tiếp ↗
        </Link>
      </div>

      <div className={styles.cardSection}>
        {loading ? (
          <div className={styles.loadingBox}>Đang tải lịch trình vận chuyển...</div>
        ) : rides.length === 0 ? (
          <div style={{ color: '#718096', textAlign: 'center', padding: '40px' }}>
            Chưa có chuyến xe nào được tạo trong hệ thống.
          </div>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Mã Chuyến</th>
                  <th>Hành Khách</th>
                  <th>Điểm Đón</th>
                  <th>Điểm Đến</th>
                  <th>Thời Gian Đón</th>
                  <th>Cước Phí</th>
                  <th>Tài Xế Phụ Trách</th>
                  <th>Trạng Thái</th>
                </tr>
              </thead>
              <tbody>
                {rides.map((r) => (
                  <tr key={r.id}>
                    <td className={styles.rideCode}>{r.rideCode}</td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#fff' }}>{r.passengerName}</div>
                      <div style={{ fontSize: 11, color: '#718096' }}>{r.passengerPhone}</div>
                    </td>
                    <td>{r.pickupLocation}</td>
                    <td>{r.dropoffLocation}</td>
                    <td style={{ fontSize: 12 }}>{formatDateTime(r.pickupTime)}</td>
                    <td style={{ fontWeight: 600, color: '#c5a880' }}>
                      {formatVND(r.actualPrice || r.estimatedPrice)}
                    </td>
                    <td>
                      {r.driver ? (
                        <div>
                          <div style={{ fontWeight: 600, color: '#fff' }}>{r.driver.fullName}</div>
                          <div style={{ fontSize: 11, color: '#718096' }}>{r.driver.phoneNumber || ''}</div>
                        </div>
                      ) : (
                        <span style={{ color: '#ecc94b', fontStyle: 'italic' }}>Chưa phân bổ</span>
                      )}
                    </td>
                    <td>{getStatusBadge(r.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
