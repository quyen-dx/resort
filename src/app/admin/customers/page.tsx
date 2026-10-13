'use client';

import React, { useEffect, useState } from 'react';
import styles from './customers.module.css';

interface CustomerItem {
  id: string;
  email: string;
  fullName: string;
  phoneNumber: string | null;
  isActive: boolean;
  createdAt: string;
  _count: {
    bookings: number;
  };
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/customers')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setCustomers(data.data);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('vi-VN');
    } catch {
      return dateStr;
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.titleArea}>
        <h1>Quản Lý Hồ Sơ Khách Hàng</h1>
        <p>Danh sách tài khoản khách hàng lưu trú, lịch sử đăng ký và tần suất đặt phòng</p>
      </div>

      <div className={styles.cardSection}>
        {loading ? (
          <div className={styles.loadingBox}>Đang tải danh sách khách hàng...</div>
        ) : customers.length === 0 ? (
          <div style={{ color: '#718096', textAlign: 'center', padding: '40px' }}>
            Chưa có tài khoản khách hàng nào được đăng ký.
          </div>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Họ và Tên</th>
                  <th>Email</th>
                  <th>Số Điện Thoại</th>
                  <th>Lượt Đặt Phòng</th>
                  <th>Ngày Gia Nhập</th>
                  <th>Trạng Thái</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 600, color: '#fff' }}>{c.fullName}</td>
                    <td>{c.email}</td>
                    <td>{c.phoneNumber || '---'}</td>
                    <td>
                      <span style={{ color: '#c5a880', fontWeight: 700 }}>
                        {c._count.bookings}
                      </span>{' '}
                      lượt
                    </td>
                    <td>{formatDate(c.createdAt)}</td>
                    <td>
                      {c.isActive ? (
                        <span style={{ color: '#68d391', fontWeight: 600 }}>Hoạt động</span>
                      ) : (
                        <span style={{ color: '#fc8181', fontWeight: 600 }}>Tạm khóa</span>
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
  );
}
