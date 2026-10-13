import React from 'react';
import styles from './badge.module.css';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'gold' | 'emerald' | 'gray' | 'success' | 'warning';
}

const variantClassMap: Record<string, string> = {
  gold: styles.variantGold,
  emerald: styles.variantEmerald,
  gray: styles.variantGray,
  success: styles.variantSuccess,
  warning: styles.variantWarning,
};

export function Badge({ children, variant = 'gray' }: BadgeProps) {
  const variantClass = variantClassMap[variant] || styles.variantGray;

  return (
    <span className={`${styles.badge} ${variantClass}`}>
      {children}
    </span>
  );
}
