'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import styles from './login.module.css';

function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTarget = searchParams.get('redirect');

  // Mode: 'login' | 'register'
  const [mode, setMode] = useState<'login' | 'register'>('login');

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleNavigateAfterAuth = (role: string) => {
    if (redirectTarget) {
      router.push(redirectTarget);
    } else {
      switch (role) {
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
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Email hoặc mật khẩu không chính xác.');
      }

      handleNavigateAfterAuth(data.user.role);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Lỗi kết nối máy chủ');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          email,
          password,
          phoneNumber: phoneNumber || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Đăng ký không thành công.');
      }

      setSuccessMsg('Đăng ký thành công! Đang chuyển hướng...');
      setTimeout(() => {
        handleNavigateAfterAuth('CUSTOMER');
      }, 1000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Lỗi kết nối máy chủ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.card}>
      <div className={styles.brand}>
        <div className={styles.logoBadge}>A</div>
        <h1 className={styles.brandTitle}>AN NAM RESORT</h1>
        <p className={styles.brandSubtitle}>
          {mode === 'login' ? 'Cổng Đăng Nhập Hệ Thống' : 'Đăng Ký Tài Khoản Khách Hàng'}
        </p>
      </div>

      {/* Tab Switcher */}
      <div className={styles.tabSwitch}>
        <button
          type="button"
          onClick={() => {
            setMode('login');
            setError(null);
            setSuccessMsg(null);
          }}
          className={`${styles.tabBtn} ${mode === 'login' ? styles.tabBtnActive : ''}`}
        >
          Đăng Nhập
        </button>
        <button
          type="button"
          onClick={() => {
            setMode('register');
            setError(null);
            setSuccessMsg(null);
          }}
          className={`${styles.tabBtn} ${mode === 'register' ? styles.tabBtnActive : ''}`}
        >
          Đăng Ký
        </button>
      </div>

      {error && <div className={styles.errorBox}>{error}</div>}
      {successMsg && <div className={styles.successBox}>{successMsg}</div>}

      {mode === 'login' ? (
        <form onSubmit={handleLogin} className={styles.form}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Email tài khoản</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nhap-email@resort.com"
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

          <div className={styles.switchMode}>
            Chưa có tài khoản?
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setError(null);
              }}
              className={styles.switchLink}
            >
              Đăng ký ngay
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleRegister} className={styles.form}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Họ và tên</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Nguyễn Văn A"
              className={styles.input}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="khachhang@gmail.com"
              className={styles.input}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Số điện thoại</label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="0912 345 678"
              className={styles.input}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Mật khẩu (tối thiểu 6 ký tự)</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className={styles.input}
            />
          </div>

          <button type="submit" disabled={loading} className={styles.submitBtn}>
            {loading ? 'Đang tạo tài khoản...' : 'Tạo Tài Khoản Mới'}
          </button>

          <div className={styles.switchMode}>
            Đã có tài khoản?
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError(null);
              }}
              className={styles.switchLink}
            >
              Đăng nhập
            </button>
          </div>
        </form>
      )}

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
        <AuthForm />
      </Suspense>
    </div>
  );
}
