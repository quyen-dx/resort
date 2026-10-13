'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Navbar() {
  const pathname = usePathname();

  return (
    <header
      style={{
        borderBottom: '1px solid var(--border-subtle)',
        backgroundColor: 'rgba(255, 255, 255, 0.92)',
        backdropFilter: 'blur(12px)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        transition: 'all var(--transition-normal)',
      }}
    >
      <div
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '1rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Brand Logo */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-light))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-accent)',
              fontWeight: 800,
              fontSize: '1.25rem',
              boxShadow: '0 2px 8px rgba(15, 42, 36, 0.2)',
              border: '1px solid rgba(197, 168, 128, 0.3)',
            }}
          >
            A
          </div>
          <div>
            <div
              style={{
                fontSize: '1.25rem',
                fontWeight: 800,
                letterSpacing: '0.04em',
                color: 'var(--color-primary)',
                fontFamily: 'var(--font-serif)',
              }}
            >
              AN NAM RESORT
            </div>
            <div
              style={{
                fontSize: '0.68rem',
                color: 'var(--color-accent-dark)',
                letterSpacing: '0.15em',
                fontWeight: 600,
              }}
            >
              LUXURY RETREAT &amp; SPA
            </div>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
          <Link
            href="/rooms"
            style={{
              color: pathname === '/rooms' ? 'var(--color-primary)' : 'var(--color-text-main)',
              fontWeight: pathname === '/rooms' ? 700 : 500,
              fontSize: '0.95rem',
              transition: 'color var(--transition-fast)',
              position: 'relative',
            }}
          >
            Biệt Thự &amp; Phòng
          </Link>
          <Link
            href="/#transport"
            style={{
              color: 'var(--color-text-main)',
              fontWeight: 500,
              fontSize: '0.95rem',
            }}
          >
            Xe Đưa Đón Sân Bay
          </Link>
          <Link
            href="/portal"
            style={{
              backgroundColor: 'var(--color-primary)',
              color: 'var(--color-text-inverse)',
              padding: '0.55rem 1.25rem',
              borderRadius: 'var(--radius-sm)',
              fontWeight: 600,
              fontSize: '0.88rem',
              letterSpacing: '0.02em',
              transition: 'all var(--transition-fast)',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            Cổng Nhân Viên
          </Link>
        </nav>
      </div>
    </header>
  );
}
