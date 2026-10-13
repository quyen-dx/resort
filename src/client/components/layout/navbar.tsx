'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import styles from './navbar.module.css';

interface UserSessionInfo {
  id: string;
  email: string;
  fullName: string;
  role: 'CUSTOMER' | 'RECEPTIONIST' | 'DRIVER' | 'DISPATCHER' | 'ADMIN';
}

const ROLE_LABELS: Record<string, string> = {
  CUSTOMER: 'Khách hàng',
  RECEPTIONIST: 'Lễ tân',
  DISPATCHER: 'Điều phối xe',
  DRIVER: 'Tài xế',
  ADMIN: 'Quản trị viên',
};

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<UserSessionInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      })
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      router.push('/');
      router.refresh();
    } catch {
      // Ignore
    }
  };

  const isStaff = user && user.role !== 'CUSTOMER';
  const isReception = user && (user.role === 'RECEPTIONIST' || user.role === 'ADMIN');
  const isDispatcher = user && (user.role === 'DISPATCHER' || user.role === 'ADMIN');
  const isDriver = user && (user.role === 'DRIVER' || user.role === 'ADMIN');
  const isAdmin = user && user.role === 'ADMIN';

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        {/* Brand Logo */}
        <Link href="/" className={styles.brandLink}>
          <div className={styles.brandLogo}>A</div>
          <div>
            <div className={styles.brandTitle}>AN NAM RESORT</div>
            <div className={styles.brandSubtitle}>LUXURY RETREAT &amp; SPA</div>
          </div>
        </Link>

        {/* Navigation Links - Strictly filtered by Role (RBAC) */}
        <nav className={styles.navLinks}>
          <Link
            href="/rooms"
            className={`${styles.navLink} ${pathname === '/rooms' ? styles.navLinkActive : ''}`}
          >
            Biệt Thự &amp; Phòng
          </Link>

          {/* Lễ tân: Chỉ hiển thị cho RECEPTIONIST hoặc ADMIN */}
          {isReception && (
            <Link
              href="/reception"
              className={`${styles.navLink} ${pathname.startsWith('/reception') ? styles.navLinkActive : ''}`}
            >
              Quầy Lễ Tân
            </Link>
          )}

          {/* Điều phối xe: Chỉ hiển thị cho DISPATCHER hoặc ADMIN */}
          {isDispatcher && (
            <Link
              href="/transport/dispatch"
              className={`${styles.navLink} ${pathname.startsWith('/transport/dispatch') ? styles.navLinkActive : ''}`}
            >
              Điều Phối Xe
            </Link>
          )}

          {/* Cổng tài xế: Chỉ hiển thị cho DRIVER hoặc ADMIN */}
          {isDriver && (
            <Link
              href="/transport/driver"
              className={`${styles.navLink} ${pathname.startsWith('/transport/driver') ? styles.navLinkActive : ''}`}
            >
              Nhiệm Vụ Xe Của Tôi
            </Link>
          )}

          {/* Quản trị hệ thống: Chỉ hiển thị cho ADMIN */}
          {isAdmin && (
            <Link
              href="/admin/system-health"
              className={`${styles.navLink} ${pathname.startsWith('/admin') ? styles.navLinkActive : ''}`}
            >
              Giám Sát Hệ Thống
            </Link>
          )}

          {/* Session Information */}
          <div className={styles.userSection}>
            {loading ? null : user ? (
              <>
                <div className={styles.userInfo}>
                  <span className={styles.userName}>{user.fullName}</span>
                  <span className={styles.roleTag}>{ROLE_LABELS[user.role] || user.role}</span>
                </div>
                <button onClick={handleLogout} className={styles.logoutBtn} title="Đăng xuất">
                  Đăng xuất
                </button>
              </>
            ) : (
              <Link href="/login" className={styles.loginBtn}>
                Đăng Nhập
              </Link>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
