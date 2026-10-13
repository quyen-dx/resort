'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Badge } from '@/client/components/ui/badge';
import styles from './system-health.module.css';

interface HealthResponse {
  status: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY';
  timestamp: string;
  service: string;
  version: string;
  requestId: string;
  uptimeSeconds: number;
  database: {
    status: 'CONNECTED' | 'DISCONNECTED' | 'ERROR';
    latencyMs: number;
    error: string | null;
  };
  system: {
    nodeVersion: string;
    platform: string;
    memory: {
      rssMb: number;
      heapUsedMb: number;
      heapTotalMb: number;
    };
  };
  checkDurationMs: number;
  recentLogs?: Array<{
    level: string;
    message: string;
    requestId?: string;
    timestamp: string;
    context?: Record<string, unknown>;
  }>;
}

export default function SystemHealthDashboard() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchHealth = () => {
    setLoading(true);
    fetch('/api/health?includeLogs=true')
      .then((res) => res.json())
      .then((data: HealthResponse) => {
        setHealth(data);
      })
      .catch((err) => {
        console.error('Failed to probe health:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 15000); // Tự động làm mới mỗi 15 giây
    return () => clearInterval(interval);
  }, []);

  const formatUptime = (seconds: number) => {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${d > 0 ? d + 'd ' : ''}${h}h ${m}m ${s}s`;
  };

  const getStatusClass = (status?: string) => {
    if (status === 'HEALTHY') return styles.dotHealthy;
    if (status === 'DEGRADED') return styles.dotDegraded;
    return styles.dotUnhealthy;
  };

  const heapRatio = health
    ? Math.round((health.system.memory.heapUsedMb / health.system.memory.heapTotalMb) * 100)
    : 0;

  return (
    <div className={styles.container}>
      {/* Subpage Breadcrumb / Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ color: '#c5a880', margin: '0 0 4px 0', fontSize: '1.25rem' }}>
            Giám Sát Hạ Tầng &amp; Sức Khỏe Kỹ Thuật (Observability)
          </h2>
          <span style={{ color: '#a0aec0', fontSize: '0.85rem' }}>
            Kiểm tra thời gian thực kết nối PostgreSQL, bộ nhớ Node.js và nhật ký request
          </span>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Link href="/admin" style={{ color: '#c5a880', fontSize: '0.85rem', textDecoration: 'none', padding: '6px 12px', border: '1px solid rgba(197, 168, 128, 0.3)', borderRadius: '6px' }}>
            ← Về Bảng Quản Trị
          </Link>
          <Link href="/reception" style={{ color: '#a0aec0', fontSize: '0.85rem', textDecoration: 'none', padding: '6px 12px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px' }}>
            Quầy Lễ Tân →
          </Link>
          <Link href="/transport/dispatch" style={{ color: '#a0aec0', fontSize: '0.85rem', textDecoration: 'none', padding: '6px 12px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px' }}>
            Điều Phối Xe →
          </Link>
        </div>
      </div>
        {/* Status Banner */}
        <div className={styles.statusBanner}>
          <div className={styles.statusIndicator}>
            <span className={`${styles.statusDot} ${getStatusClass(health?.status)}`} />
            <div>
              <div className={styles.statusTitle}>
                {health?.status === 'HEALTHY' && 'Hệ Thống Hoạt Động Ổn Định (100% Sẵn Sàng)'}
                {health?.status === 'DEGRADED' && 'Hệ Thống Cảnh Báo (Độ Trễ Cao)'}
                {health?.status === 'UNHEALTHY' && 'Hệ Thống Mất Kết Nối Cơ Sở Dữ Liệu'}
                {!health && 'Đang kiểm tra trạng thái...'}
              </div>
              <div className={styles.statusSubtitle}>
                Dịch vụ: <strong>{health?.service}</strong> • Phiên bản: <strong>{health?.version}</strong> • Request ID: <code>{health?.requestId}</code>
              </div>
            </div>
          </div>

          <button onClick={fetchHealth} disabled={loading} className={styles.refreshBtn}>
            {loading ? 'Đang thăm dò...' : '🔄 Thăm Dò Ngay'}
          </button>
        </div>

        {/* Metrics Grid */}
        <div className={styles.metricsGrid}>
          {/* Card 1: Database Health */}
          <div className={styles.metricCard}>
            <div className={styles.metricCardTitle}>
              <span>Cơ Sở Dữ Liệu PostgreSQL</span>
              <Badge variant={health?.database.status === 'CONNECTED' ? 'success' : 'warning'}>
                {health?.database.status || 'PROBING'}
              </Badge>
            </div>
            <div className={styles.metricMainValue}>
              {health?.database.latencyMs} <span style={{ fontSize: '1rem', fontWeight: 500 }}>ms</span>
            </div>
            <div className={styles.metricSubText}>
              Độ trễ truy vấn kết nối (Probe Ping: <code>SELECT 1</code>)
            </div>
          </div>

          {/* Card 2: Memory Footprint */}
          <div className={styles.metricCard}>
            <div className={styles.metricCardTitle}>
              <span>Bộ Nhớ Node.js (RAM Heap)</span>
              <Badge variant="emerald">{heapRatio}%</Badge>
            </div>
            <div className={styles.metricMainValue}>
              {health?.system.memory.heapUsedMb} <span style={{ fontSize: '1rem', fontWeight: 500 }}>MB</span>
            </div>
            <div className={styles.progressBarContainer}>
              <div
                className={styles.progressBarFill}
                style={{ width: `${Math.min(100, heapRatio)}%` }}
              />
            </div>
            <div className={styles.metricSubText}>
              Đã dùng: {health?.system.memory.heapUsedMb} MB / {health?.system.memory.heapTotalMb} MB (RSS: {health?.system.memory.rssMb} MB)
            </div>
          </div>

          {/* Card 3: Server Uptime */}
          <div className={styles.metricCard}>
            <div className={styles.metricCardTitle}>
              <span>Thời Gian Hoạt Động (Uptime)</span>
              <Badge variant="gold">24/7 Sẵn Sàng</Badge>
            </div>
            <div className={styles.metricMainValue} style={{ fontSize: '1.6rem' }}>
              {health ? formatUptime(health.uptimeSeconds) : '--'}
            </div>
            <div className={styles.metricSubText}>
              Nền tảng: {health?.system.platform} • Node.js {health?.system.nodeVersion}
            </div>
          </div>
        </div>

        {/* Structured JSON Log Stream */}
        <div className={styles.logCard}>
          <div className={styles.logCardHeader}>
            <h2 className={styles.logCardTitle}>
              Nhật Ký Truy Vết Request &amp; Giao Dịch (Structured JSON Logging)
            </h2>
            <Badge variant="gray">Tự động làm mới 15s</Badge>
          </div>

          <div className={styles.logTerminal}>
            {health?.recentLogs && health.recentLogs.length > 0 ? (
              health.recentLogs.map((log, idx) => {
                const levelClass =
                  log.level === 'error'
                    ? styles.logLevelError
                    : log.level === 'warn'
                    ? styles.logLevelWarn
                    : styles.logLevelInfo;
                return (
                  <div key={idx} className={styles.logLine}>
                    <span className={styles.logTime}>[{log.timestamp.split('T')[1].replace('Z', '')}]</span>
                    <span className={levelClass}>[{log.level.toUpperCase()}]</span>{' '}
                    {log.requestId && <span className={styles.logReqId}>({log.requestId})</span>}
                    <span>{log.message}</span>
                    {log.context && (
                      <span style={{ color: '#6ee7b7', marginLeft: '0.5rem' }}>
                        {JSON.stringify(log.context)}
                      </span>
                    )}
                  </div>
                );
              })
            ) : (
              <div>Không có bản ghi log nào trong bộ đệm.</div>
            )}
          </div>
        </div>
      </div>
  );
}
