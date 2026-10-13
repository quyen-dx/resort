'use client';

import React, { useEffect, useState } from 'react';
import styles from './bookings.module.css';

interface BookingItem {
  id: string;
  bookingCode: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  checkInDate: string;
  checkOutDate: string;
  numberOfRooms: number;
  numberOfGuests: number;
  totalNights: number;
  amountDue: number;
  amountPaid: number;
  balance: number;
  status: string;
  roomType: {
    name: string;
    code: string;
  };
  assignedRoom?: {
    roomNumber: string;
  } | null;
  payments: Array<{
    id: string;
    amount: number;
    method: string;
    createdAt: string;
  }>;
}

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/bookings')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setBookings(data.data);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const formatVND = (amt: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amt);
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
        return <span className={styles.statusConfirmed}>Đã xác nhận</span>;
      case 'CHECKED_IN':
        return <span className={styles.statusCheckedIn}>Đang lưu trú</span>;
      case 'CHECKED_OUT':
        return <span className={styles.statusCheckedOut}>Đã trả phòng</span>;
      case 'CANCELLED':
        return <span className={styles.statusCancelled}>Đã hủy</span>;
      default:
        return <span>{status}</span>;
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.titleArea}>
        <h1>Quản Lý Đặt Phòng Toàn Hệ Thống</h1>
        <p>Theo dõi toàn bộ hồ sơ đặt phòng, đối soát thanh toán tại quầy và tình trạng gán phòng</p>
      </div>

      <div className={styles.cardSection}>
        {loading ? (
          <div className={styles.loadingBox}>Đang tải danh sách đặt phòng...</div>
        ) : bookings.length === 0 ? (
          <div style={{ color: '#718096', textAlign: 'center', padding: '40px' }}>
            Chưa có lượt đặt phòng nào được ghi nhận.
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
                  <th>Quy Mô</th>
                  <th>Phải Thu</th>
                  <th>Đã Thu</th>
                  <th>Còn Lại</th>
                  <th>Trạng Thái</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b.id}>
                    <td className={styles.bookingCode}>{b.bookingCode}</td>
                    <td>
                      <div className={styles.guestInfo}>
                        <span className={styles.guestName}>{b.customerName}</span>
                        <span className={styles.guestPhone}>{b.customerPhone}</span>
                        <span className={styles.guestEmail}>{b.customerEmail}</span>
                      </div>
                    </td>
                    <td>{b.roomType.name}</td>
                    <td>
                      {b.assignedRoom ? (
                        <strong style={{ color: '#c5a880' }}>#{b.assignedRoom.roomNumber}</strong>
                      ) : (
                        <span style={{ color: '#718096', fontStyle: 'italic' }}>Chưa gán</span>
                      )}
                    </td>
                    <td style={{ fontSize: 12 }}>
                      {formatDate(b.checkInDate)} → {formatDate(b.checkOutDate)}
                      <div style={{ color: '#718096' }}>({b.totalNights} đêm)</div>
                    </td>
                    <td style={{ fontSize: 12 }}>
                      {b.numberOfRooms} phòng • {b.numberOfGuests} khách
                    </td>
                    <td style={{ fontWeight: 600 }}>{formatVND(b.amountDue)}</td>
                    <td style={{ color: '#68d391', fontWeight: 600 }}>{formatVND(b.amountPaid)}</td>
                    <td style={{ color: b.balance > 0 ? '#fc8181' : '#a0aec0', fontWeight: 600 }}>
                      {formatVND(b.balance)}
                    </td>
                    <td>{getStatusBadge(b.status)}</td>
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
