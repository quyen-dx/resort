'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '@/client/components/layout/navbar';
import { SearchBar } from '@/client/components/booking/search-bar';
import { RoomCard } from '@/client/components/booking/room-card';
import { BookingModal } from '@/client/components/booking/booking-modal';
import { RoomTypeDTO, FALLBACK_ROOM_TYPES } from '@/server/services/room.service';
import { calculateNights } from '@/client/utils/date';
import styles from './rooms.module.css';

export default function RoomsPage() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defCheckIn = tomorrow.toISOString().split('T')[0];

  const threeDaysLater = new Date(tomorrow);
  threeDaysLater.setDate(threeDaysLater.getDate() + 3);
  const defCheckOut = threeDaysLater.toISOString().split('T')[0];

  const [checkIn, setCheckIn] = useState(defCheckIn);
  const [checkOut, setCheckOut] = useState(defCheckOut);
  const [guests, setGuests] = useState(2);
  const [rooms, setRooms] = useState(1);
  const [roomTypes, setRoomTypes] = useState<RoomTypeDTO[]>(FALLBACK_ROOM_TYPES);
  const [selectedRoom, setSelectedRoom] = useState<RoomTypeDTO | null>(null);

  const totalNights = calculateNights(checkIn, checkOut);

  // Fetch live room types
  useEffect(() => {
    fetch('/api/rooms')
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data?.length > 0) {
          setRoomTypes(json.data);
        }
      })
      .catch(() => {
        // Fallback to static catalogue
      });
  }, []);

  const handleSearch = (criteria: { checkIn: string; checkOut: string; guests: number; rooms: number }) => {
    setCheckIn(criteria.checkIn);
    setCheckOut(criteria.checkOut);
    setGuests(criteria.guests);
    setRooms(criteria.rooms);
  };

  return (
    <div className={styles.pageWrapper}>
      <Navbar />

      {/* Banner */}
      <section className={styles.banner}>
        <div className={styles.bannerContent}>
          <span className={styles.bannerTag}>
            KHÔNG GIAN LƯU TRÚ RIÊNG TƯ
          </span>
          <h1 className={styles.bannerTitle}>
            Biệt Thự &amp; Phòng Nghỉ Dưỡng
          </h1>
          <p className={styles.bannerDescription}>
            Mỗi căn phòng là một kiệt tác kiến trúc giao thoa giữa thiên nhiên biển đảo nguyên sơ và tiện nghi thượng lưu.
          </p>
        </div>
      </section>

      {/* Search Bar Container */}
      <div className={styles.searchBarWrapper}>
        <SearchBar
          initialCheckIn={checkIn}
          initialCheckOut={checkOut}
          initialGuests={guests}
          initialRooms={rooms}
          onSearch={handleSearch}
        />
      </div>

      {/* Room Catalogue Grid */}
      <main className={styles.mainContainer}>
        <div className={styles.headerRow}>
          <div>
            <h2 className={styles.catalogueTitle}>
              Danh Sách Loại Phòng ({roomTypes.length})
            </h2>
            <p className={styles.catalogueSubtitle}>
              Đang hiển thị giá cho <strong>{totalNights} đêm</strong> ({rooms} phòng)
            </p>
          </div>

          <div className={styles.paymentBadge}>
            ✓ Thanh toán tại quầy resort
          </div>
        </div>

        <div className={styles.roomList}>
          {roomTypes.map((room) => (
            <RoomCard
              key={room.id}
              room={room}
              totalNights={totalNights}
              numberOfRooms={rooms}
              onBook={(r) => setSelectedRoom(r)}
            />
          ))}
        </div>
      </main>

      {/* Booking Modal */}
      {selectedRoom && (
        <BookingModal
          room={selectedRoom}
          checkInDate={checkIn}
          checkOutDate={checkOut}
          totalNights={totalNights}
          numberOfRooms={rooms}
          onClose={() => setSelectedRoom(null)}
        />
      )}

      {/* Footer */}
      <footer className={styles.footer}>
        <p>© 2026 An Nam Resort Management &amp; Operations. Hệ thống quản lý nghỉ dưỡng đẳng cấp quốc tế.</p>
      </footer>
    </div>
  );
}
