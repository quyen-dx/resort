import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'gold' | 'emerald' | 'gray' | 'success' | 'warning';
}

export function Badge({ children, variant = 'gray' }: BadgeProps) {
  const styles: Record<string, React.CSSProperties> = {
    gold: {
      backgroundColor: 'rgba(197, 168, 128, 0.15)',
      color: '#8f6f46',
      border: '1px solid rgba(197, 168, 128, 0.35)',
    },
    emerald: {
      backgroundColor: 'rgba(15, 42, 36, 0.08)',
      color: '#0f2a24',
      border: '1px solid rgba(15, 42, 36, 0.2)',
    },
    gray: {
      backgroundColor: 'var(--color-bg-subtle)',
      color: 'var(--color-text-muted)',
      border: '1px solid var(--border-subtle)',
    },
    success: {
      backgroundColor: 'rgba(27, 135, 85, 0.12)',
      color: '#13653f',
      border: '1px solid rgba(27, 135, 85, 0.25)',
    },
    warning: {
      backgroundColor: 'rgba(217, 119, 6, 0.12)',
      color: '#b45309',
      border: '1px solid rgba(217, 119, 6, 0.25)',
    },
  };

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '0.25rem 0.65rem',
        borderRadius: 'var(--radius-full)',
        fontSize: '0.78rem',
        fontWeight: 600,
        letterSpacing: '0.02em',
        lineHeight: 1.2,
        ...styles[variant],
      }}
    >
      {children}
    </span>
  );
}
