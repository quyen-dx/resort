'use client';

import React from 'react';
import { RoomTypeDTO } from '@/server/services/room.service';
import { formatVND } from '@/client/utils/currency';
import { Badge } from '../ui/badge';

interface RoomCardProps {
  room: RoomTypeDTO;
  totalNights: number;
  numberOfRooms: number;
  onBook: (room: RoomTypeDTO) => void;
}

export function RoomCard({ room, totalNights, numberOfRooms, onBook }: RoomCardProps) {
  const roomTotal = room.basePricePerNight * totalNights * numberOfRooms;

  return (
    <div
      style={{
        backgroundColor: 'white',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-md)',
        border: '1px solid var(--border-subtle)',
        display: 'grid',
        gridTemplateColumns: 'minmax(300px, 380px) 1fr',
        transition: 'transform var(--transition-normal), box-shadow var(--transition-normal)',
      }}
    >
      {/* Room Image */}
      <div style={{ position: 'relative', overflow: 'hidden', minHeight: '260px' }}>
        <img
          src={room.images[0]}
          alt={room.name}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
            transition: 'transform var(--transition-smooth)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '1rem',
            left: '1rem',
          }}
        >
          <Badge variant="emerald">Tối đa {room.maxGuests} khách</Badge>
        </div>
      </div>

      {/* Room Content */}
      <div
        style={{
          padding: '1.75rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
            <div>
              <h3
                style={{
                  fontSize: '1.45rem',
                  fontFamily: 'var(--font-serif)',
                  color: 'var(--color-primary)',
                  fontWeight: 700,
                  marginBottom: '0.2rem',
                }}
              >
                {room.name}
              </h3>
              {room.nameEn && (
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-light)', fontStyle: 'italic' }}>
                  {room.nameEn}
                </div>
              )}
            </div>
            <Badge variant="gold">Cao Cấp</Badge>
          </div>

          <p
            style={{
              fontSize: '0.9rem',
              color: 'var(--color-text-muted)',
              lineHeight: 1.6,
              marginBottom: '1.25rem',
            }}
          >
            {room.description}
          </p>

          {/* Amenities Tags */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.5rem' }}>
            {room.amenities.map((amenity, idx) => (
              <span
                key={idx}
                style={{
                  fontSize: '0.78rem',
                  color: 'var(--color-text-main)',
                  backgroundColor: 'var(--color-bg-subtle)',
                  padding: '0.3rem 0.65rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                ✓ {amenity}
              </span>
            ))}
          </div>
        </div>

        {/* Pricing & CTA */}
        <div
          style={{
            borderTop: '1px solid var(--border-subtle)',
            paddingTop: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-primary)' }}>
              {formatVND(room.basePricePerNight)}
              <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--color-text-muted)' }}> / đêm</span>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
              Tổng {totalNights} đêm: <strong>{formatVND(roomTotal)}</strong> (Đã gồm thuế &amp; phí)
            </div>
          </div>

          <button
            onClick={() => onBook(room)}
            style={{
              backgroundColor: 'var(--color-primary)',
              color: 'var(--color-text-inverse)',
              padding: '0.75rem 1.75rem',
              borderRadius: 'var(--radius-sm)',
              fontWeight: 700,
              fontSize: '0.95rem',
              boxShadow: 'var(--shadow-sm)',
              cursor: 'pointer',
              transition: 'background var(--transition-fast)',
            }}
          >
            Chọn Đặt Phòng
          </button>
        </div>
      </div>
    </div>
  );
}
