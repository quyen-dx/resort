'use client';

import React, { useState, useEffect } from 'react';
import { RoomTypeDTO } from '@/server/services/room.service';
import { formatVND } from '@/client/utils/currency';
import { formatDateVN } from '@/client/utils/date';
import { Badge } from '../ui/badge';

interface BookingModalProps {
  room: RoomTypeDTO;
  checkInDate: string;
  checkOutDate: string;
  totalNights: number;
  numberOfRooms: number;
  onClose: () => void;
  onSuccess?: (bookingCode: string) => void;
}

export function BookingModal({
  room,
  checkInDate,
  checkOutDate,
  totalNights,
  numberOfRooms,
  onClose,
  onSuccess,
}: BookingModalProps) {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [notes, setNotes] = useState('');
  
  // Airport Transfer State (INT-01)
  const [includeTransport, setIncludeTransport] = useState(false);
  const [flightNumber, setFlightNumber] = useState('');
  const distanceKm = 35; // Standard distance from airport (Mock)
  const transportRate = 4000; // 4,000 VND/km
  const transportCost = includeTransport ? distanceKm * transportRate : 0;

  // Pricing calculations
  const roomTotal = room.basePricePerNight * totalNights * numberOfRooms;
  const grandTotal = roomTotal + transportCost;

  // Idempotency Key generated once when modal opens (BOOK-04, DB-02)
  const [idempotencyKey, setIdempotencyKey] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedBookingCode, setConfirmedBookingCode] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    // Generate UUIDv4 for idempotency
    const key = 'idem-' + Math.random().toString(36).substring(2, 15) + '-' + Date.now();
    setIdempotencyKey(key);
  }, []);

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const payload = {
        roomTypeId: room.id,
        checkInDate,
        checkOutDate,
        numberOfRooms,
        numberOfGuests: room.maxGuests,
        customerName,
        customerPhone,
        customerEmail,
        notes,
        airportTransport: includeTransport
          ? {
              flightNumber: flightNumber.trim() || undefined,
              pickupLocation: 'Sân bay Quốc tế',
              dropoffLocation: 'An Nam Resort & Spa',
              distanceKm,
              pickupTime: `${checkInDate}T14:00:00Z`,
            }
          : undefined,
      };

      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Đặt phòng thất bại. Vui lòng thử lại.');
      }

      setConfirmedBookingCode(data.data.bookingCode);
      if (onSuccess) {
        onSuccess(data.data.bookingCode);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi hệ thống';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(7, 21, 18, 0.75)',
        backdropFilter: 'blur(8px)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: 'var(--radius-lg)',
          width: '100%',
          maxWidth: '680px',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
          border: '1px solid var(--border-accent)',
          position: 'relative',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.5rem',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: 'var(--color-bg-subtle)',
          }}
        >
          <div>
            <h2 style={{ fontSize: '1.35rem', color: 'var(--color-primary)', fontFamily: 'var(--font-serif)', fontWeight: 700 }}>
              {confirmedBookingCode ? 'Xác Nhận Đặt Phòng Thành Công' : 'Hoàn Tất Đặt Phòng'}
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
              {room.name} • {numberOfRooms} phòng • {totalNights} đêm
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              fontSize: '1.5rem',
              color: 'var(--color-text-muted)',
              lineHeight: 1,
              padding: '0.25rem',
            }}
          >
            ×
          </button>
        </div>

        {/* Success View */}
        {confirmedBookingCode ? (
          <div style={{ padding: '2.5rem 2rem', textAlign: 'center' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: 'rgba(27, 135, 85, 0.12)',
                color: 'var(--color-success)',
                fontSize: '2rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.5rem',
              }}
            >
              ✓
            </div>

            <h3 style={{ fontSize: '1.5rem', color: 'var(--color-primary)', marginBottom: '0.5rem' }}>
              Cảm ơn quý khách, {customerName}!
            </h3>

            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
              Đơn đặt phòng của quý khách đã được hệ thống xác nhận thành công và lưu giữ chỗ an toàn.
            </p>

            <div
              style={{
                backgroundColor: 'var(--color-bg-subtle)',
                padding: '1.25rem',
                borderRadius: 'var(--radius-md)',
                display: 'inline-block',
                border: '1px dashed var(--color-accent-dark)',
                marginBottom: '2rem',
              }}
            >
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', letterSpacing: '0.1em' }}>
                MÃ ĐẶT PHÒNG RESORT
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-primary)', letterSpacing: '0.05em' }}>
                {confirmedBookingCode}
              </div>
            </div>

            <div
              style={{
                textAlign: 'left',
                backgroundColor: '#fffdfa',
                border: '1px solid #fae8c8',
                padding: '1rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.88rem',
                color: '#8f6f46',
                marginBottom: '2rem',
              }}
            >
              ℹ️ <strong>Chính sách thanh toán tại quầy (BIZ-01):</strong> Quý khách không cần trả tiền trực tuyến. Toàn bộ số tiền <strong>{formatVND(grandTotal)}</strong> sẽ được thanh toán trực tiếp tại quầy lễ tân resort khi quý khách làm thủ tục Check-in.
            </div>

            <button
              onClick={onClose}
              style={{
                backgroundColor: 'var(--color-primary)',
                color: 'white',
                padding: '0.75rem 2.5rem',
                borderRadius: 'var(--radius-sm)',
                fontWeight: 600,
                fontSize: '1rem',
              }}
            >
              Đóng Cửa Sổ
            </button>
          </div>
        ) : (
          /* Booking Form */
          <form onSubmit={handleBookingSubmit} style={{ padding: '1.5rem' }}>
            {errorMessage && (
              <div
                style={{
                  backgroundColor: 'rgba(220, 38, 38, 0.1)',
                  color: 'var(--color-danger)',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.88rem',
                  marginBottom: '1.25rem',
                  border: '1px solid rgba(220, 38, 38, 0.25)',
                }}
              >
                ⚠️ {errorMessage}
              </div>
            )}

            {/* Stay Summary Bar */}
            <div
              style={{
                backgroundColor: 'var(--color-bg-subtle)',
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.88rem',
                marginBottom: '1.5rem',
              }}
            >
              <div>
                <span style={{ color: 'var(--color-text-muted)' }}>Thời gian: </span>
                <strong>{formatDateVN(checkInDate)}</strong> → <strong>{formatDateVN(checkOutDate)}</strong>
              </div>
              <div>
                <Badge variant="emerald">{totalNights} đêm</Badge>
              </div>
            </div>

            {/* Guest Information */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1rem', color: 'var(--color-primary)', marginBottom: '0.75rem', fontWeight: 700 }}>
                1. Thông Tin Người Đại Diện
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '0.3rem' }}>
                    Họ và Tên *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Nguyễn Văn A"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.8rem',
                      border: '1px solid var(--border-medium)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.9rem',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '0.3rem' }}>
                    Số Điện Thoại *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="0912 345 678"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.8rem',
                      border: '1px solid var(--border-medium)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.9rem',
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '0.3rem' }}>
                  Địa Chỉ Email Nhận Xác Nhận *
                </label>
                <input
                  type="email"
                  required
                  placeholder="email@example.com"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.8rem',
                    border: '1px solid var(--border-medium)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.9rem',
                  }}
                />
              </div>
            </div>

            {/* Airport Transfer Option (INT-01) */}
            <div style={{ marginBottom: '1.5rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <h3 style={{ fontSize: '1rem', color: 'var(--color-primary)', fontWeight: 700 }}>
                    2. Dịch Vụ Xe Đưa Đón Sân Bay
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                    Xe điện sang trọng đưa đón tận sảnh (Giá mẫu Sandbox: 4.000 ₫/km ~ {formatVND(140000)})
                  </p>
                </div>
                <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="checkbox"
                    checked={includeTransport}
                    onChange={(e) => setIncludeTransport(e.target.checked)}
                    style={{ width: '18px', height: '18px' }}
                  />
                  <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>Thêm xe đón</span>
                </label>
              </div>

              {includeTransport && (
                <div style={{ marginTop: '0.75rem', backgroundColor: 'var(--color-bg-subtle)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '0.3rem' }}>
                    Số hiệu chuyến bay hạ cánh (nếu có)
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: VN123 / VJ456"
                    value={flightNumber}
                    onChange={(e) => setFlightNumber(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      border: '1px solid var(--border-medium)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.88rem',
                    }}
                  />
                </div>
              )}
            </div>

            {/* Special Requests */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '0.3rem' }}>
                Yêu cầu đặc biệt (tùy chọn)
              </label>
              <textarea
                rows={2}
                placeholder="Ví dụ: Giường đôi, nhận phòng muộn, trang trí kỷ niệm ngày cưới..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.6rem 0.8rem',
                  border: '1px solid var(--border-medium)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.88rem',
                }}
              />
            </div>

            {/* Bill Summary & Payment at Counter Notice */}
            <div
              style={{
                backgroundColor: 'var(--color-bg-subtle)',
                padding: '1.25rem',
                borderRadius: 'var(--radius-md)',
                marginBottom: '1.5rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', marginBottom: '0.4rem' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>Tiền phòng ({totalNights} đêm x {numberOfRooms} phòng):</span>
                <span>{formatVND(roomTotal)}</span>
              </div>

              {includeTransport && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', marginBottom: '0.4rem' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Xe đưa đón sân bay (35km):</span>
                  <span>{formatVND(transportCost)}</span>
                </div>
              )}

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '1.15rem',
                  fontWeight: 800,
                  color: 'var(--color-primary)',
                  borderTop: '1px solid var(--border-medium)',
                  paddingTop: '0.6rem',
                  marginTop: '0.4rem',
                }}
              >
                <span>Tổng Chi Phí Phải Trả:</span>
                <span>{formatVND(grandTotal)}</span>
              </div>

              <p style={{ fontSize: '0.78rem', color: 'var(--color-accent-dark)', marginTop: '0.6rem', fontStyle: 'italic' }}>
                * Thanh toán 100% tại quầy lễ tân resort khi quý khách làm thủ tục Check-in (tiền mặt hoặc thẻ).
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                width: '100%',
                backgroundColor: 'var(--color-accent)',
                color: 'var(--color-primary-dark)',
                padding: '0.85rem',
                borderRadius: 'var(--radius-sm)',
                fontWeight: 800,
                fontSize: '1.05rem',
                boxShadow: '0 4px 15px var(--color-accent-glow)',
                opacity: isSubmitting ? 0.7 : 1,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
              }}
            >
              {isSubmitting ? 'Đang Xử Lý Giao Dịch...' : 'Xác Nhận Giữ Chỗ (Thanh Toán Tại Resort)'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
