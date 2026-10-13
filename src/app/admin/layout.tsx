'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import styles from './admin-layout.module.css';

interface AdminUserSession {
  id: string;
  email: string;
  fullName: string;
  role: string;
}

const SIDEBAR_ITEMS = [
  { href: '/admin', label: 'Tổng quan', icon: '📊', exact: true },
  { href: '/admin/rooms', label: 'Quản lý phòng', icon: '🚪' },
  { href: '/admin/room-types', label: 'Quản lý loại phòng', icon: '🏨' },
  { href: '/admin/bookings', label: 'Quản lý đặt phòng', icon: '📅' },
  { href: '/admin/customers', label: 'Quản lý khách hàng', icon: '👥' },
  { href: '/admin/staff', label: 'Quản lý nhân viên', icon: '👔' },
  { href: '/admin/transfers', label: 'Điều phối xe', icon: '🚗' },
  { href: '/admin/system-health', label: 'Giám sát hệ thống', icon: '🩺' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [adminUser, setAdminUser] = useState<AdminUserSession | null>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) {
          setAdminUser(data.user);
        }
      })
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch {
      // Ignore
    }
  };

  const getPageTitle = () => {
    const activeItem = SIDEBAR_ITEMS.find((item) =>
      item.exact ? pathname === item.href : pathname.startsWith(item.href)
    );
    return activeItem?.label || 'Quản Trị Resort';
  };

  return (
    <div className={styles.layoutWrapper}>
      {/* Fixed Admin Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.brandArea}>
          <div className={styles.brandLogo}>A</div>
          <div className={styles.brandInfo}>
            <span className={styles.brandTitle}>AN NAM RESORT</span>
            <span className={styles.brandSubtitle}>Khu Vực Quản Trị</span>
          </div>
        </div>

        <nav className={styles.navMenu}>
          <div className={styles.navSectionLabel}>Nghiệp Vụ &amp; Vận Hành</div>
          {SIDEBAR_ITEMS.map((item) => {
            const isActive = item.exact
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(item.href + '/');

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
              >
                <span className={styles.navIcon}>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className={styles.sidebarFooter}>
          <Link href="/" className={styles.viewWebsiteLink} target="_blank">
            <span>Xem Website Resort ↗</span>
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className={styles.mainWrapper}>
        {/* Top Header */}
        <header className={styles.topHeader}>
          <div className={styles.pageHeaderTitle}>
            <span>{getPageTitle()}</span>
          </div>

          <div className={styles.headerActions}>
            <div className={styles.adminProfile}>
              <div className={styles.adminAvatar}>
                {adminUser?.fullName ? adminUser.fullName.charAt(0).toUpperCase() : 'A'}
              </div>
              <div className={styles.adminDetails}>
                <span className={styles.adminName}>{adminUser?.fullName || 'Quản trị viên'}</span>
                <span className={styles.adminRoleBadge}>QUẢN TRỊ VIÊN</span>
              </div>
            </div>

            <button onClick={handleLogout} className={styles.logoutBtn} title="Đăng xuất khỏi hệ thống">
              Đăng xuất
            </button>
          </div>
        </header>

        {/* Child Pages Content */}
        <main className={styles.contentArea}>{children}</main>
      </div>
    </div>
  );
}
