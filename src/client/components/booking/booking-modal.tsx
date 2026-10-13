'use client';
import React, { useState, useEffect } from 'react';
import { RoomTypeDTO } from '@/shared/types/room';

import { formatVND } from '@/client/utils/currency';
import { formatDateVN } from '@/client/utils/date';
import { Badge } from '../ui/badge';
import styles from './booking-modal.module.css';

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
    <div className={styles.overlay}>
      <div className={styles.modal}>
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h2 className={styles.headerTitle}>
              {confirmedBookingCode ? 'Xác Nhận Đặt Phòng Thành Công' : 'Hoàn Tất Đặt Phòng'}
            </h2>
            <p className={styles.headerSubtitle}>
              {room.name} • {numberOfRooms} phòng • {totalNights} đêm
            </p>
          </div>
          <button onClick={onClose} className={styles.closeButton}>
            ×
          </button>
        </div>

        {/* Success View */}
        {confirmedBookingCode ? (
          <div className={styles.successContainer}>
            <div className={styles.successIcon}>
              ✓
            </div>

            <h3 className={styles.successTitle}>
              Cảm ơn quý khách, {customerName}!
            </h3>

            <p className={styles.successMessage}>
              Đơn đặt phòng của quý khách đã được hệ thống xác nhận thành công và lưu giữ chỗ an toàn.
            </p>

            <div className={styles.codeBox}>
              <div className={styles.codeBoxLabel}>
                MÃ ĐẶT PHÒNG RESORT
              </div>
              <div className={styles.codeBoxValue}>
                {confirmedBookingCode}
              </div>
            </div>

            <div className={styles.policyNotice}>
              ℹ️ <strong>Chính sách thanh toán tại quầy (BIZ-01):</strong> Quý khách không cần trả tiền trực tuyến. Toàn bộ số tiền <strong>{formatVND(grandTotal)}</strong> sẽ được thanh toán trực tiếp tại quầy lễ tân resort khi quý khách làm thủ tục Check-in.
            </div>

            <button onClick={onClose} className={styles.closeDialogBtn}>
              Đóng Cửa Sổ
            </button>
          </div>
        ) : (
          /* Booking Form */
          <form onSubmit={handleBookingSubmit} className={styles.form}>
            {errorMessage && (
              <div className={styles.errorBanner}>
                ⚠️ {errorMessage}
              </div>
            )}

            {/* Stay Summary Bar */}
            <div className={styles.staySummaryBar}>
              <div>
                <span style={{ color: 'var(--color-text-muted)' }}>Thời gian: </span>
                <strong>{formatDateVN(checkInDate)}</strong> → <strong>{formatDateVN(checkOutDate)}</strong>
              </div>
              <div>
                <Badge variant="emerald">{totalNights} đêm</Badge>
              </div>
            </div>

            {/* Guest Information */}
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>
                1. Thông Tin Người Đại Diện
              </h3>

              <div className={styles.formGridTwoCol}>
                <div>
                  <label className={styles.fieldLabel}>
                    Họ và Tên *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Nguyễn Văn A"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className={styles.inputField}
                  />
                </div>

                <div>
                  <label className={styles.fieldLabel}>
                    Số Điện Thoại *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="0912 345 678"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className={styles.inputField}
                  />
                </div>
              </div>

              <div>
                <label className={styles.fieldLabel}>
                  Địa Chỉ Email Nhận Xác Nhận *
                </label>
                <input
                  type="email"
                  required
                  placeholder="email@example.com"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className={styles.inputField}
                />
              </div>
            </div>

            {/* Airport Transfer Option (INT-01) */}
            <div className={styles.sectionDivider}>
              <div className={styles.transportRow}>
                <div>
                  <h3 className={styles.sectionTitle}>
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
                <div className={styles.transportBox}>
                  <label className={styles.fieldLabel}>
                    Số hiệu chuyến bay hạ cánh (nếu có)
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: VN123 / VJ456"
                    value={flightNumber}
                    onChange={(e) => setFlightNumber(e.target.value)}
                    className={styles.inputField}
                  />
                </div>
              )}
            </div>

            {/* Special Requests */}
            <div className={styles.section}>
              <label className={styles.fieldLabel}>
                Yêu cầu đặc biệt (tùy chọn)
              </label>
              <textarea
                rows={2}
                placeholder="Ví dụ: Giường đôi, nhận phòng muộn, trang trí kỷ niệm ngày cưới..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className={styles.inputField}
              />
            </div>

            {/* Bill Summary & Payment at Counter Notice */}
            <div className={styles.billSummaryBox}>
              <div className={styles.billRow}>
                <span style={{ color: 'var(--color-text-muted)' }}>Tiền phòng ({totalNights} đêm x {numberOfRooms} phòng):</span>
                <span>{formatVND(roomTotal)}</span>
              </div>

              {includeTransport && (
                <div className={styles.billRow}>
                  <span style={{ color: 'var(--color-text-muted)' }}>Xe đưa đón sân bay (35km):</span>
                  <span>{formatVND(transportCost)}</span>
                </div>
              )}

              <div className={styles.billTotalRow}>
                <span>Tổng Chi Phí Phải Trả:</span>
                <span>{formatVND(grandTotal)}</span>
              </div>

              <p className={styles.billNote}>
                * Thanh toán 100% tại quầy lễ tân resort khi quý khách làm thủ tục Check-in (tiền mặt hoặc thẻ).
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className={styles.submitBtn}
            >
              {isSubmitting ? 'Đang Xử Lý Giao Dịch...' : 'Xác Nhận Giữ Chỗ (Thanh Toán Tại Resort)'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
