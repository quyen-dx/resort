'use client';

import React, { useEffect, useState } from 'react';
import styles from './rooms.module.css';

interface PhysicalRoom {
  id: string;
  roomNumber: string;
  floor: number;
  status: 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE' | 'CLEANING';
  notes: string | null;
  roomType: {
    name: string;
    code: string;
    basePricePerNight: number;
  };
}

export default function AdminRoomsPage() {
  const [rooms, setRooms] = useState<PhysicalRoom[]>([]);
  const [filter, setFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/rooms')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setRooms(data.data);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filteredRooms = rooms.filter((r) => {
    if (filter === 'ALL') return true;
    return r.status === filter;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return <span className={`${styles.statusBadge} ${styles.statusAvailable}`}>Trống</span>;
      case 'OCCUPIED':
        return <span className={`${styles.statusBadge} ${styles.statusOccupied}`}>Đang ở</span>;
      case 'MAINTENANCE':
        return <span className={`${styles.statusBadge} ${styles.statusMaintenance}`}>Bảo trì</span>;
      case 'CLEANING':
        return <span className={`${styles.statusBadge} ${styles.statusCleaning}`}>Dọn phòng</span>;
      default:
        return <span className={styles.statusBadge}>{status}</span>;
    }
  };

  const formatVND = (amt: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amt);
  };

  return (
    <div className={styles.container}>
      <div className={styles.headerRow}>
        <div className={styles.titleArea}>
          <h1>Quản Lý Danh Sách Phòng Vật Lý</h1>
          <p>Trạng thái buồng phòng, tầng và loại phòng gán thực tế trong khuôn viên resort</p>
        </div>
      </div>

      <div className={styles.filterBar}>
        <button
          className={`${styles.filterBtn} ${filter === 'ALL' ? styles.filterBtnActive : ''}`}
          onClick={() => setFilter('ALL')}
        >
          Tất cả ({rooms.length})
        </button>
        <button
          className={`${styles.filterBtn} ${filter === 'AVAILABLE' ? styles.filterBtnActive : ''}`}
          onClick={() => setFilter('AVAILABLE')}
        >
          Trống ({rooms.filter((r) => r.status === 'AVAILABLE').length})
        </button>
        <button
          className={`${styles.filterBtn} ${filter === 'OCCUPIED' ? styles.filterBtnActive : ''}`}
          onClick={() => setFilter('OCCUPIED')}
        >
          Đang ở ({rooms.filter((r) => r.status === 'OCCUPIED').length})
        </button>
        <button
          className={`${styles.filterBtn} ${filter === 'MAINTENANCE' ? styles.filterBtnActive : ''}`}
          onClick={() => setFilter('MAINTENANCE')}
        >
          Bảo trì ({rooms.filter((r) => r.status === 'MAINTENANCE').length})
        </button>
        <button
          className={`${styles.filterBtn} ${filter === 'CLEANING' ? styles.filterBtnActive : ''}`}
          onClick={() => setFilter('CLEANING')}
        >
          Dọn dẹp ({rooms.filter((r) => r.status === 'CLEANING').length})
        </button>
      </div>

      {loading ? (
        <div className={styles.loadingBox}>Đang tải danh sách phòng vật lý...</div>
      ) : (
        <div className={styles.cardGrid}>
          {filteredRooms.map((room) => (
            <div key={room.id} className={styles.roomCard}>
              <div className={styles.roomCardTop}>
                <span className={styles.roomNumber}>Phòng #{room.roomNumber}</span>
                {getStatusBadge(room.status)}
              </div>
              <div className={styles.roomTypeInfo}>{room.roomType.name}</div>
              <div className={styles.roomMeta}>
                <span>Tầng {room.floor}</span>
                <span style={{ color: '#c5a880', fontWeight: 600 }}>
                  {formatVND(room.roomType.basePricePerNight)}/đêm
                </span>
              </div>
              {room.notes && (
                <div style={{ fontSize: 11, color: '#718096', fontStyle: 'italic' }}>
                  Ghi chú: {room.notes}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
