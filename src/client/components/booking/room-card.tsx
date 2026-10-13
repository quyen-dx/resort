'use client';
import React from 'react';
import { RoomTypeDTO } from '@/shared/types/room';

import { formatVND } from '@/client/utils/currency';
import { Badge } from '../ui/badge';
import styles from './room-card.module.css';

interface RoomCardProps {
  room: RoomTypeDTO;
  totalNights: number;
  numberOfRooms: number;
  onBook: (room: RoomTypeDTO) => void;
}

export function RoomCard({ room, totalNights, numberOfRooms, onBook }: RoomCardProps) {
  const roomTotal = room.basePricePerNight * totalNights * numberOfRooms;

  return (
    <div className={styles.card}>
      {/* Room Image */}
      <div className={styles.imageWrapper}>
        <img
          src={room.images[0]}
          alt={room.name}
          className={styles.image}
        />
        <div className={styles.imageBadge}>
          <Badge variant="emerald">Tối đa {room.maxGuests} khách</Badge>
        </div>
      </div>

      {/* Room Content */}
      <div className={styles.content}>
        <div>
          <div className={styles.header}>
            <div>
              <h3 className={styles.title}>
                {room.name}
              </h3>
              {room.nameEn && (
                <div className={styles.subtitle}>
                  {room.nameEn}
                </div>
              )}
            </div>
            <Badge variant="gold">Cao Cấp</Badge>
          </div>

          <p className={styles.description}>
            {room.description}
          </p>

          {/* Amenities Tags */}
          <div className={styles.amenities}>
            {room.amenities.map((amenity, idx) => (
              <span key={idx} className={styles.amenityTag}>
                ✓ {amenity}
              </span>
            ))}
          </div>
        </div>

        {/* Pricing & CTA */}
        <div className={styles.footer}>
          <div>
            <div className={styles.pricePerNight}>
              {formatVND(room.basePricePerNight)}
              <span className={styles.priceUnit}> / đêm</span>
            </div>
            <div className={styles.priceTotal}>
              Tổng {totalNights} đêm: <strong>{formatVND(roomTotal)}</strong> (Đã gồm thuế &amp; phí)
            </div>
          </div>

          <button
            onClick={() => onBook(room)}
            className={styles.bookButton}
          >
            Chọn Đặt Phòng
          </button>
        </div>
      </div>
    </div>
  );
}
