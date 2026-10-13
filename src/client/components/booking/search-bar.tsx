'use client';

import React, { useState } from 'react';
import { calculateNights } from '@/client/utils/date';

interface SearchBarProps {
  initialCheckIn?: string;
  initialCheckOut?: string;
  initialGuests?: number;
  initialRooms?: number;
  onSearch?: (criteria: { checkIn: string; checkOut: string; guests: number; rooms: number }) => void;
}

export function SearchBar({
  initialCheckIn,
  initialCheckOut,
  initialGuests = 2,
  initialRooms = 1,
  onSearch,
}: SearchBarProps) {
  // Defaults: Check-in tomorrow, Check-out 3 nights later
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defCheckIn = initialCheckIn || tomorrow.toISOString().split('T')[0];

  const threeDaysLater = new Date(tomorrow);
  threeDaysLater.setDate(threeDaysLater.getDate() + 3);
  const defCheckOut = initialCheckOut || threeDaysLater.toISOString().split('T')[0];

  const [checkIn, setCheckIn] = useState(defCheckIn);
  const [checkOut, setCheckOut] = useState(defCheckOut);
  const [guests, setGuests] = useState(initialGuests);
  const [rooms, setRooms] = useState(initialRooms);

  const nights = calculateNights(checkIn, checkOut);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch({ checkIn, checkOut, guests, rooms });
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        backgroundColor: 'white',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-lg)',
        padding: '1.25rem',
        border: '1px solid var(--border-subtle)',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr)) auto',
        gap: '1rem',
        alignItems: 'flex-end',
      }}
    >
      {/* Check-in Date */}
      <div>
        <label
          style={{
            display: 'block',
            fontSize: '0.75rem',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--color-text-muted)',
            fontWeight: 700,
            marginBottom: '0.4rem',
          }}
        >
          Ngày Nhận Phòng
        </label>
        <input
          type="date"
          value={checkIn}
          min={new Date().toISOString().split('T')[0]}
          onChange={(e) => setCheckIn(e.target.value)}
          required
          style={{
            width: '100%',
            padding: '0.65rem 0.85rem',
            border: '1px solid var(--border-medium)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.92rem',
            color: 'var(--color-text-main)',
            outline: 'none',
          }}
        />
      </div>

      {/* Check-out Date */}
      <div>
        <label
          style={{
            display: 'block',
            fontSize: '0.75rem',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--color-text-muted)',
            fontWeight: 700,
            marginBottom: '0.4rem',
          }}
        >
          Ngày Trả Phòng ({nights} đêm)
        </label>
        <input
          type="date"
          value={checkOut}
          min={checkIn}
          onChange={(e) => setCheckOut(e.target.value)}
          required
          style={{
            width: '100%',
            padding: '0.65rem 0.85rem',
            border: '1px solid var(--border-medium)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.92rem',
            color: 'var(--color-text-main)',
            outline: 'none',
          }}
        />
      </div>

      {/* Guests */}
      <div>
        <label
          style={{
            display: 'block',
            fontSize: '0.75rem',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--color-text-muted)',
            fontWeight: 700,
            marginBottom: '0.4rem',
          }}
        >
          Số Lượng Khách
        </label>
        <select
          value={guests}
          onChange={(e) => setGuests(parseInt(e.target.value, 10))}
          style={{
            width: '100%',
            padding: '0.65rem 0.85rem',
            border: '1px solid var(--border-medium)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.92rem',
            color: 'var(--color-text-main)',
            backgroundColor: 'white',
            outline: 'none',
          }}
        >
          <option value={1}>1 Người lớn</option>
          <option value={2}>2 Người lớn</option>
          <option value={3}>3 Khách (Gia đình)</option>
          <option value={4}>4 Khách (Nhóm/Villa)</option>
        </select>
      </div>

      {/* Rooms */}
      <div>
        <label
          style={{
            display: 'block',
            fontSize: '0.75rem',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--color-text-muted)',
            fontWeight: 700,
            marginBottom: '0.4rem',
          }}
        >
          Số Lượng Phòng
        </label>
        <select
          value={rooms}
          onChange={(e) => setRooms(parseInt(e.target.value, 10))}
          style={{
            width: '100%',
            padding: '0.65rem 0.85rem',
            border: '1px solid var(--border-medium)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.92rem',
            color: 'var(--color-text-main)',
            backgroundColor: 'white',
            outline: 'none',
          }}
        >
          <option value={1}>1 Phòng</option>
          <option value={2}>2 Phòng</option>
          <option value={3}>3 Phòng</option>
        </select>
      </div>

      {/* Search Button */}
      <div>
        <button
          type="submit"
          style={{
            backgroundColor: 'var(--color-accent)',
            color: 'var(--color-primary-dark)',
            padding: '0.72rem 1.75rem',
            borderRadius: 'var(--radius-sm)',
            fontWeight: 700,
            fontSize: '0.95rem',
            boxShadow: '0 2px 10px var(--color-accent-glow)',
            whiteSpace: 'nowrap',
            transition: 'transform var(--transition-fast)',
          }}
        >
          Tìm Phòng Trống
        </button>
      </div>
    </form>
  );
}
