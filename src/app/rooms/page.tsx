'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '@/client/components/layout/navbar';
import { SearchBar } from '@/client/components/booking/search-bar';
import { RoomCard } from '@/client/components/booking/room-card';
import { BookingModal } from '@/client/components/booking/booking-modal';
import { RoomTypeDTO, FALLBACK_ROOM_TYPES } from '@/server/services/room.service';
import { calculateNights } from '@/client/utils/date';

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
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--color-bg-main)' }}>
      <Navbar />

      {/* Banner */}
      <section
        style={{
          background: 'linear-gradient(rgba(15, 42, 36, 0.85), rgba(7, 21, 18, 0.95)), url("https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1600&q=80") center/cover',
          color: 'white',
          padding: '4.5rem 1.5rem 6.5rem',
          textAlign: 'center',
        }}
      >
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <span
            style={{
              display: 'inline-block',
              color: 'var(--color-accent)',
              fontSize: '0.85rem',
              fontWeight: 700,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              marginBottom: '0.75rem',
            }}
          >
            KHÔNG GIAN LƯU TRÚ RIÊNG TƯ
          </span>
          <h1
            style={{
              fontSize: '2.75rem',
              fontFamily: 'var(--font-serif)',
              fontWeight: 700,
              marginBottom: '1rem',
              letterSpacing: '-0.01em',
            }}
          >
            Biệt Thự &amp; Phòng Nghỉ Dưỡng
          </h1>
          <p style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '1.05rem', lineHeight: 1.6 }}>
            Mỗi căn phòng là một kiệt tác kiến trúc giao thoa giữa thiên nhiên biển đảo nguyên sơ và tiện nghi thượng lưu.
          </p>
        </div>
      </section>

      {/* Search Bar Container */}
      <div style={{ maxWidth: '1100px', margin: '-3.5rem auto 3rem', width: '100%', padding: '0 1.5rem', zIndex: 10 }}>
        <SearchBar
          initialCheckIn={checkIn}
          initialCheckOut={checkOut}
          initialGuests={guests}
          initialRooms={rooms}
          onSearch={handleSearch}
        />
      </div>

      {/* Room Catalogue Grid */}
      <main style={{ maxWidth: '1280px', margin: '0 auto 5rem', width: '100%', padding: '0 1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem' }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', color: 'var(--color-primary)', fontWeight: 700 }}>
              Danh Sách Loại Phòng ({roomTypes.length})
            </h2>
            <p style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)' }}>
              Đang hiển thị giá cho <strong>{totalNights} đêm</strong> ({rooms} phòng)
            </p>
          </div>

          <div
            style={{
              backgroundColor: 'white',
              padding: '0.45rem 1rem',
              borderRadius: 'var(--radius-full)',
              border: '1px solid var(--border-subtle)',
              fontSize: '0.85rem',
              color: 'var(--color-primary)',
              fontWeight: 600,
            }}
          >
            ✓ Thanh toán tại quầy resort
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
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
      <footer
        style={{
          marginTop: 'auto',
          borderTop: '1px solid var(--border-subtle)',
          padding: '2.5rem 1.5rem',
          backgroundColor: 'white',
          textAlign: 'center',
          fontSize: '0.88rem',
          color: 'var(--color-text-muted)',
        }}
      >
        <p>© 2026 An Nam Resort Management &amp; Operations. Hệ thống đặt phòng cao cấp chuẩn 5 sao.</p>
      </footer>
    </div>
  );
}
