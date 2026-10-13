'use client';

import React, { useEffect, useState } from 'react';
import styles from './room-types.module.css';

interface RoomTypeData {
  id: string;
  code: string;
  name: string;
  nameEn: string | null;
  description: string;
  maxGuests: number;
  totalInventory: number;
  basePricePerNight: number;
  amenities: string[];
  isActive: boolean;
  _count: {
    physicalRooms: number;
    bookings: number;
  };
}

export default function AdminRoomTypesPage() {
  const [roomTypes, setRoomTypes] = useState<RoomTypeData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/room-types')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setRoomTypes(data.data);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const formatVND = (amt: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amt);
  };

  return (
    <div className={styles.container}>
      <div className={styles.titleArea}>
        <h1>Quản Lý Danh Mục Hạng Phòng &amp; Bảng Giá</h1>
        <p>Cấu hình loại phòng, công suất tối đa, tiện ích cao cấp và bảng giá cơ sở VND/đêm</p>
      </div>

      {loading ? (
        <div className={styles.loadingBox}>Đang tải danh mục loại phòng...</div>
      ) : (
        <div className={styles.typeGrid}>
          {roomTypes.map((rt) => (
            <div key={rt.id} className={styles.typeCard}>
              <div className={styles.typeCardHeader}>
                <div>
                  <h3 className={styles.typeName}>{rt.name}</h3>
                  <span className={styles.typeCode}>{rt.code}</span>
                </div>
                <div className={styles.typePrice}>{formatVND(rt.basePricePerNight)}</div>
              </div>

              <p className={styles.typeDescription}>{rt.description}</p>

              <div className={styles.typeMetaGrid}>
                <div>
                  <strong>Số khách tối đa:</strong> {rt.maxGuests} người
                </div>
                <div>
                  <strong>Định mức tồn kho:</strong> {rt.totalInventory} phòng
                </div>
                <div>
                  <strong>Phòng thực tế:</strong> {rt._count.physicalRooms} phòng
                </div>
                <div>
                  <strong>Lượt đặt phòng:</strong> {rt._count.bookings} lượt
                </div>
              </div>

              <div>
                <div style={{ fontSize: 12, color: '#a0aec0', marginBottom: 6 }}>
                  Tiện ích đặc quyền:
                </div>
                <div className={styles.amenitiesWrap}>
                  {rt.amenities.map((am, i) => (
                    <span key={i} className={styles.amenityTag}>
                      ✓ {am}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
