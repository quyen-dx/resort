'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import styles from './unauthorized.module.css';

function UnauthorizedContent() {
  const searchParams = useSearchParams();
  const currentRole = searchParams.get('currentRole') || 'Chưa xác định';
  const requiredRoles = searchParams.get('requiredRoles') || 'Nhân viên có thẩm quyền';
  const path = searchParams.get('path') || 'trang này';

  return (
    <div className={styles.card}>
      <div className={styles.iconWrapper}>🔒</div>
      <h1 className={styles.title}>Truy Cập Bị Từ Chối (403)</h1>
      <p className={styles.description}>
        Tài khoản của bạn không có đủ thẩm quyền để truy cập trang <strong>{path}</strong>.
        Hệ thống An Nam Resort thực thi chính sách bảo mật đa tầng <em>(Default Deny RBAC)</em> để bảo vệ dữ liệu nội bộ.
      </p>

      <div className={styles.roleNotice}>
        <div><strong>Vai trò hiện tại của bạn:</strong> <span style={{ color: '#feb2b2' }}>{currentRole}</span></div>
        <div><strong>Quyền yêu cầu:</strong> <span style={{ color: '#c5a880' }}>{requiredRoles}</span></div>
      </div>

      <div className={styles.actions}>
        <Link href="/login" className={styles.loginBtn}>
          Đổi Tài Khoản Khác
        </Link>
        <Link href="/" className={styles.homeBtn}>
          Về Trang Chủ
        </Link>
      </div>
    </div>
  );
}

export default function UnauthorizedPage() {
  return (
    <div className={styles.container}>
      <Suspense fallback={<div>Đang tải...</div>}>
        <UnauthorizedContent />
      </Suspense>
    </div>
  );
}
