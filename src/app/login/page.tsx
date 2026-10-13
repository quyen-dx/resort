'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import styles from './login.module.css';

const DEMO_ACCOUNTS = [
  { role: 'Khách hàng', roleCode: 'CUSTOMER', email: 'guest@resort.com', pass: 'Customer@123456', desc: 'Xem & đặt phòng' },
  { role: 'Lễ tân', roleCode: 'RECEPTIONIST', email: 'reception@resort.com', pass: 'Reception@123456', desc: 'Check-in, thu tiền' },
  { role: 'Điều phối xe', roleCode: 'DISPATCHER', email: 'dispatch@resort.com', pass: 'Dispatch@123456', desc: 'Phân tài xế' },
  { role: 'Tài xế', roleCode: 'DRIVER', email: 'driver@resort.com', pass: 'Driver@123456', desc: 'Cổng tài xế' },
  { role: 'Quản trị viên', roleCode: 'ADMIN', email: 'admin@resort.com', pass: 'Admin@123456', desc: 'Toàn quyền' },
];

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get('redirect');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Đăng nhập không thành công');
      }

      // Determine navigation target
      if (redirectTarget) {
        router.push(redirectTarget);
      } else {
        switch (data.user.role) {
          case 'ADMIN':
            router.push('/admin/system-health');
            break;
          case 'RECEPTIONIST':
            router.push('/reception');
            break;
          case 'DISPATCHER':
            router.push('/transport/dispatch');
            break;
          case 'DRIVER':
            router.push('/transport/driver');
            break;
          default:
            router.push('/rooms');
            break;
        }
      }
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Lỗi kết nối máy chủ');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  return (
    <div className={styles.card}>
      <div className={styles.brand}>
        <div className={styles.logoBadge}>A</div>
        <h1 className={styles.brandTitle}>AN NAM RESORT</h1>
        <p className={styles.brandSubtitle}>Cổng Đăng Nhập &amp; Phân Quyền Vận Hành</p>
      </div>

      {error && <div className={styles.errorBox}>{error}</div>}

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label className={styles.label}>Email tài khoản</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="vd: reception@resort.com"
            className={styles.input}
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.label}>Mật khẩu</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className={styles.input}
          />
        </div>

        <button type="submit" disabled={loading} className={styles.submitBtn}>
          {loading ? 'Đang xác thực...' : 'Đăng Nhập'}
        </button>
      </form>

      <div className={styles.divider}>
        <span>Chọn tài khoản mẫu để thử nghiệm</span>
      </div>

      <div className={styles.quickAccounts}>
        {DEMO_ACCOUNTS.map((acc) => (
          <button
            key={acc.email}
            type="button"
            className={styles.quickBtn}
            onClick={() => handleQuickLogin(acc.email, acc.pass)}
          >
            <span className={styles.quickBtnRole}>{acc.role}</span>
            <span className={styles.quickBtnEmail}>{acc.email}</span>
          </button>
        ))}
      </div>

      <div className={styles.backHome}>
        <Link href="/" className={styles.backLink}>
          ← Quay về Trang chủ Resort
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className={styles.container}>
      <Suspense fallback={<div>Đang tải...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
