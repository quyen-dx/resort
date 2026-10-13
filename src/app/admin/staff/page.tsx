'use client';

import React, { useEffect, useState } from 'react';
import styles from './staff.module.css';

interface StaffItem {
  id: string;
  email: string;
  fullName: string;
  phoneNumber: string | null;
  role: 'ADMIN' | 'RECEPTIONIST' | 'DISPATCHER' | 'DRIVER';
  isActive: boolean;
  createdAt: string;
}

export default function AdminStaffPage() {
  const [staff, setStaff] = useState<StaffItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/staff')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setStaff(data.data);
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

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return <span className={`${styles.roleBadge} ${styles.roleAdmin}`}>QUẢN TRỊ VIÊN</span>;
      case 'RECEPTIONIST':
        return <span className={`${styles.roleBadge} ${styles.roleReceptionist}`}>LỄ TÂN</span>;
      case 'DISPATCHER':
        return <span className={`${styles.roleBadge} ${styles.roleDispatcher}`}>ĐIỀU PHỐI XE</span>;
      case 'DRIVER':
        return <span className={`${styles.roleBadge} ${styles.roleDriver}`}>TÀI XẾ</span>;
      default:
        return <span className={styles.roleBadge}>{role}</span>;
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.titleArea}>
        <h1>Quản Lý Đội Ngũ Nhân Viên &amp; Phân Quyền</h1>
        <p>Danh mục nhân sự resort, tài khoản vận hành, phân quyền vai trò (RBAC) và trạng thái công tác</p>
      </div>

      <div className={styles.cardSection}>
        {loading ? (
          <div className={styles.loadingBox}>Đang tải danh sách nhân sự...</div>
        ) : staff.length === 0 ? (
          <div style={{ color: '#718096', textAlign: 'center', padding: '40px' }}>
            Chưa có tài khoản nhân sự nào.
          </div>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Họ và Tên</th>
                  <th>Email Nội Bộ</th>
                  <th>Số Điện Thoại</th>
                  <th>Vai Trò Nghiệp Vụ</th>
                  <th>Ngày Bổ Nhiệm</th>
                  <th>Trạng Thái</th>
                </tr>
              </thead>
              <tbody>
                {staff.map((s) => (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 600, color: '#fff' }}>{s.fullName}</td>
                    <td>{s.email}</td>
                    <td>{s.phoneNumber || '---'}</td>
                    <td>{getRoleBadge(s.role)}</td>
                    <td>{formatDate(s.createdAt)}</td>
                    <td>
                      {s.isActive ? (
                        <span style={{ color: '#68d391', fontWeight: 600 }}>Đang làm việc</span>
                      ) : (
                        <span style={{ color: '#fc8181', fontWeight: 600 }}>Tạm dừng</span>
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
