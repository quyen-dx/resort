'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './navbar.module.css';

export function Navbar() {
  const pathname = usePathname();

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        {/* Brand Logo */}
        <Link href="/" className={styles.brandLink}>
          <div className={styles.brandLogo}>
            A
          </div>
          <div>
            <div className={styles.brandTitle}>
              AN NAM RESORT
            </div>
            <div className={styles.brandSubtitle}>
              LUXURY RETREAT &amp; SPA
            </div>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className={styles.navLinks}>
          <Link
            href="/rooms"
            className={`${styles.navLink} ${pathname === '/rooms' ? styles.navLinkActive : ''}`}
          >
            Biệt Thự &amp; Phòng
          </Link>
          <Link
            href="/transport/dispatch"
            className={`${styles.navLink} ${pathname.startsWith('/transport') ? styles.navLinkActive : ''}`}
          >
            Điều Phối Xe
          </Link>
          <Link
            href="/reception"
            className={styles.portalButton}
          >
            Quầy Lễ Tân
          </Link>
        </nav>
      </div>
    </header>
  );
}
