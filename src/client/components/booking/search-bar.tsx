'use client';

import React, { useState } from 'react';
import { calculateNights } from '@/client/utils/date';
import styles from './search-bar.module.css';

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
    <form onSubmit={handleSubmit} className={styles.searchBar}>
      {/* Check-in Date */}
      <div className={styles.fieldGroup}>
        <label className={styles.label}>
          Ngày Nhận Phòng
        </label>
        <input
          type="date"
          value={checkIn}
          min={new Date().toISOString().split('T')[0]}
          onChange={(e) => setCheckIn(e.target.value)}
          required
          className={styles.input}
        />
      </div>

      {/* Check-out Date */}
      <div className={styles.fieldGroup}>
        <label className={styles.label}>
          Ngày Trả Phòng ({nights} đêm)
        </label>
        <input
          type="date"
          value={checkOut}
          min={checkIn}
          onChange={(e) => setCheckOut(e.target.value)}
          required
          className={styles.input}
        />
      </div>

      {/* Guests */}
      <div className={styles.fieldGroup}>
        <label className={styles.label}>
          Số Lượng Khách
        </label>
        <select
          value={guests}
          onChange={(e) => setGuests(parseInt(e.target.value, 10))}
          className={styles.select}
        >
          <option value={1}>1 Người lớn</option>
          <option value={2}>2 Người lớn</option>
          <option value={3}>3 Khách (Gia đình)</option>
          <option value={4}>4 Khách (Nhóm/Villa)</option>
        </select>
      </div>

      {/* Rooms */}
      <div className={styles.fieldGroup}>
        <label className={styles.label}>
          Số Lượng Phòng
        </label>
        <select
          value={rooms}
          onChange={(e) => setRooms(parseInt(e.target.value, 10))}
          className={styles.select}
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
          className={styles.submitButton}
        >
          Tìm Phòng Trống
        </button>
      </div>
    </form>
  );
}
