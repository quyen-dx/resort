'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatVND } from '@/client/utils/currency';
import { formatDateVN } from '@/client/utils/date';
import { Badge } from '@/client/components/ui/badge';

interface DeskBooking {
  id: string;
  bookingCode: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  checkInDate: string;
  checkOutDate: string;
  totalNights: number;
  numberOfRooms: number;
  amountDue: number;
  amountPaid: number;
  balance: number;
  status: 'CONFIRMED' | 'CHECKED_IN' | 'CHECKED_OUT' | 'CANCELLED';
  roomType: {
    id: string;
    code: string;
    name: string;
    physicalRooms: Array<{ id: string; roomNumber: string; status: string }>;
  };
  assignedRoom?: { id: string; roomNumber: string } | null;
  payments: Array<{
    id: string;
    receiptNumber: string;
    amount: number;
    method: string;
    createdAt: string;
    actor?: { fullName: string };
  }>;
}

export default function ReceptionDashboard() {
  const [bookings, setBookings] = useState<DeskBooking[]>([]);
  const [activeTab, setActiveTab] = useState<'checkin' | 'inhouse' | 'receipts'>('checkin');
  const [selectedRoomAssignments, setSelectedRoomAssignments] = useState<Record<string, string>>({});
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Payment Modal State
  const [paymentModalBooking, setPaymentModalBooking] = useState<DeskBooking | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'COUNTER_CASH' | 'COUNTER_TRANSFER' | 'COUNTER_CARD'>('COUNTER_CASH');
  const [paymentNotes, setPaymentNotes] = useState('');

  // Check-out Modal State
  const [checkoutModalBooking, setCheckoutModalBooking] = useState<DeskBooking | null>(null);
  const [actualCheckOutDate, setActualCheckOutDate] = useState(new Date().toISOString().split('T')[0]);

  const loadData = () => {
    fetch('/api/reception/desk')
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          setBookings(json.data);
        }
      });
  };

  useEffect(() => {
    loadData();
  }, []);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // 1. Handle Check-in & Physical Room Assignment (BOOK-07)
  const handleCheckIn = async (booking: DeskBooking) => {
    const assignedRoomId = selectedRoomAssignments[booking.bookingCode];
    if (!assignedRoomId) {
      showToast('Vui lòng chọn số phòng vật lý cần gán cho khách!', 'error');
      return;
    }

    try {
      const res = await fetch('/api/reception/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingCode: booking.bookingCode,
          assignedRoomId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast(`Check-in thành công! Đã gán phòng cho khách ${booking.customerName}.`);
      loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi check-in';
      showToast(msg, 'error');
    }
  };

  // 2. Handle Counter Payment (BIZ-01)
  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentModalBooking) return;

    try {
      const res = await fetch('/api/reception/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: paymentModalBooking.id,
          amount: paymentAmount,
          method: paymentMethod,
          notes: paymentNotes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast(`Đã thu ${formatVND(paymentAmount)} thành công! Phiếu thu: ${data.data.payment.receiptNumber}`);
      setPaymentModalBooking(null);
      loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi thu tiền';
      showToast(msg, 'error');
    }
  };

  // 3. Handle Check-out (BIZ-02)
  const handleCheckOutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkoutModalBooking) return;

    try {
      const res = await fetch('/api/reception/check-out', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: checkoutModalBooking.id,
          actualCheckOutDate,
          adjustedAmountDue: checkoutModalBooking.amountDue,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast(`Check-out thành công cho booking ${checkoutModalBooking.bookingCode}. Phòng đã chuyển sang trạng thái Dọn dẹp!`);
      setCheckoutModalBooking(null);
      loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi check-out';
      showToast(msg, 'error');
    }
  };

  const checkInList = bookings.filter((b) => b.status === 'CONFIRMED');
  const inHouseList = bookings.filter((b) => b.status === 'CHECKED_IN');
  const allReceipts = bookings.flatMap((b) =>
    b.payments.map((p) => ({ ...p, bookingCode: b.bookingCode, customerName: b.customerName }))
  );

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f4f6f5', display: 'flex', flexDirection: 'column' }}>
      {/* Top Header */}
      <header
        style={{
          backgroundColor: 'var(--color-primary)',
          color: 'white',
          padding: '1rem 2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: 'var(--shadow-md)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link href="/" style={{ color: 'var(--color-accent)', fontWeight: 800, fontSize: '1.25rem', fontFamily: 'var(--font-serif)' }}>
            AN NAM RESORT
          </Link>
          <span style={{ color: 'rgba(255,255,255,0.4)' }}>|</span>
          <span style={{ fontSize: '1rem', fontWeight: 600 }}>Quầy Lễ Tân &amp; Điều Hành Vận Hành (Front Desk)</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', fontSize: '0.88rem' }}>
          <div>
            <span style={{ color: 'rgba(255,255,255,0.7)' }}>Nhân viên trực: </span>
            <strong style={{ color: 'var(--color-accent)' }}>Trần Thị Lễ Tân</strong>
          </div>
          <Link
            href="/rooms"
            style={{
              backgroundColor: 'rgba(255,255,255,0.15)',
              padding: '0.4rem 0.85rem',
              borderRadius: 'var(--radius-sm)',
              color: 'white',
            }}
          >
            Trang Đặt Phòng Khách →
          </Link>
        </div>
      </header>

      {/* Toast Notification */}
      {notification && (
        <div
          style={{
            position: 'fixed',
            top: '4.5rem',
            right: '2rem',
            zIndex: 100,
            backgroundColor: notification.type === 'success' ? '#13653f' : '#dc2626',
            color: 'white',
            padding: '0.85rem 1.5rem',
            borderRadius: 'var(--radius-sm)',
            boxShadow: 'var(--shadow-lg)',
            fontSize: '0.92rem',
            fontWeight: 600,
          }}
        >
          {notification.message}
        </div>
      )}

      {/* Main Container */}
      <div style={{ maxWidth: '1350px', margin: '2rem auto', width: '100%', padding: '0 1.5rem', flex: 1 }}>
        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '2px solid var(--border-medium)', marginBottom: '1.5rem' }}>
          <button
            onClick={() => setActiveTab('checkin')}
            style={{
              padding: '0.85rem 1.75rem',
              fontWeight: 700,
              fontSize: '0.95rem',
              borderBottom: activeTab === 'checkin' ? '3px solid var(--color-primary)' : '3px solid transparent',
              color: activeTab === 'checkin' ? 'var(--color-primary)' : 'var(--color-text-muted)',
              marginBottom: '-2px',
            }}
          >
            📋 Khách Đến Check-in ({checkInList.length})
          </button>
          <button
            onClick={() => setActiveTab('inhouse')}
            style={{
              padding: '0.85rem 1.75rem',
              fontWeight: 700,
              fontSize: '0.95rem',
              borderBottom: activeTab === 'inhouse' ? '3px solid var(--color-primary)' : '3px solid transparent',
              color: activeTab === 'inhouse' ? 'var(--color-primary)' : 'var(--color-text-muted)',
              marginBottom: '-2px',
            }}
          >
            🏨 Đang Lưu Trú &amp; Công Nợ ({inHouseList.length})
          </button>
          <button
            onClick={() => setActiveTab('receipts')}
            style={{
              padding: '0.85rem 1.75rem',
              fontWeight: 700,
              fontSize: '0.95rem',
              borderBottom: activeTab === 'receipts' ? '3px solid var(--color-primary)' : '3px solid transparent',
              color: activeTab === 'receipts' ? 'var(--color-primary)' : 'var(--color-text-muted)',
              marginBottom: '-2px',
            }}
          >
            🧾 Phiếu Thu Tiền Tại Quầy ({allReceipts.length})
          </button>
        </div>

        {/* TAB 1: Check-in Desk */}
        {activeTab === 'checkin' && (
          <div style={{ backgroundColor: 'white', borderRadius: 'var(--radius-lg)', padding: '1.5rem', boxShadow: 'var(--shadow-sm)' }}>
            <h2 style={{ fontSize: '1.25rem', color: 'var(--color-primary)', marginBottom: '1.25rem', fontWeight: 700 }}>
              Danh Sách Đơn Đặt Phòng Chờ Làm Thủ Tục Check-in
            </h2>

            {checkInList.length === 0 ? (
              <p style={{ color: 'var(--color-text-muted)', padding: '2rem 0', textAlign: 'center' }}>
                Hiện không có đơn nào đang chờ check-in hôm nay.
              </p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border-subtle)', color: 'var(--color-text-muted)' }}>
                      <th style={{ padding: '0.75rem' }}>Mã Đặt Phòng</th>
                      <th style={{ padding: '0.75rem' }}>Khách Hàng</th>
                      <th style={{ padding: '0.75rem' }}>Loại Phòng</th>
                      <th style={{ padding: '0.75rem' }}>Lưu Trú</th>
                      <th style={{ padding: '0.75rem' }}>Tổng Tiền (VND)</th>
                      <th style={{ padding: '0.75rem' }}>Gán Số Phòng Vật Lý</th>
                      <th style={{ padding: '0.75rem' }}>Hành Động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {checkInList.map((booking) => {
                      const availRooms = booking.roomType.physicalRooms?.filter((r) => r.status === 'AVAILABLE') || [];
                      return (
                        <tr key={booking.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                          <td style={{ padding: '0.75rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                            {booking.bookingCode}
                          </td>
                          <td style={{ padding: '0.75rem' }}>
                            <div style={{ fontWeight: 600 }}>{booking.customerName}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{booking.customerPhone}</div>
                          </td>
                          <td style={{ padding: '0.75rem' }}>
                            <Badge variant="gold">{booking.roomType.name}</Badge>
                          </td>
                          <td style={{ padding: '0.75rem' }}>
                            <div>{formatDateVN(booking.checkInDate)} → {formatDateVN(booking.checkOutDate)}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>({booking.totalNights} đêm)</div>
                          </td>
                          <td style={{ padding: '0.75rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                            {formatVND(booking.amountDue)}
                          </td>
                          <td style={{ padding: '0.75rem' }}>
                            <select
                              value={selectedRoomAssignments[booking.bookingCode] || ''}
                              onChange={(e) =>
                                setSelectedRoomAssignments({
                                  ...selectedRoomAssignments,
                                  [booking.bookingCode]: e.target.value,
                                })
                              }
                              style={{
                                padding: '0.45rem 0.65rem',
                                borderRadius: 'var(--radius-sm)',
                                border: '1px solid var(--border-medium)',
                                backgroundColor: 'white',
                                fontSize: '0.85rem',
                              }}
                            >
                              <option value="">-- Chọn số phòng --</option>
                              {availRooms.map((r) => (
                                <option key={r.id} value={r.id}>
                                  Phòng {r.roomNumber} (Trống)
                                </option>
                              ))}
                            </select>
                          </td>
                          <td style={{ padding: '0.75rem' }}>
                            <button
                              onClick={() => handleCheckIn(booking)}
                              style={{
                                backgroundColor: 'var(--color-primary)',
                                color: 'white',
                                padding: '0.5rem 1rem',
                                borderRadius: 'var(--radius-sm)',
                                fontWeight: 600,
                                fontSize: '0.85rem',
                              }}
                            >
                              Xác Nhận Check-in
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: In-House Guests & Counter Payments */}
        {activeTab === 'inhouse' && (
          <div style={{ backgroundColor: 'white', borderRadius: 'var(--radius-lg)', padding: '1.5rem', boxShadow: 'var(--shadow-sm)' }}>
            <h2 style={{ fontSize: '1.25rem', color: 'var(--color-primary)', marginBottom: '1.25rem', fontWeight: 700 }}>
              Khách Đang Lưu Trú &amp; Quản Lý Thanh Toán Quầy (BIZ-01)
            </h2>

            {inHouseList.length === 0 ? (
              <p style={{ color: 'var(--color-text-muted)', padding: '2rem 0', textAlign: 'center' }}>
                Hiện không có khách nào đang lưu trú.
              </p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border-subtle)', color: 'var(--color-text-muted)' }}>
                      <th style={{ padding: '0.75rem' }}>Số Phòng</th>
                      <th style={{ padding: '0.75rem' }}>Mã Booking</th>
                      <th style={{ padding: '0.75rem' }}>Khách Hàng</th>
                      <th style={{ padding: '0.75rem' }}>Phải Thu</th>
                      <th style={{ padding: '0.75rem' }}>Đã Thanh Toán</th>
                      <th style={{ padding: '0.75rem' }}>Còn Nợ (Balance)</th>
                      <th style={{ padding: '0.75rem' }}>Thao Tác Quầy</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inHouseList.map((booking) => (
                      <tr key={booking.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '0.75rem' }}>
                          <span
                            style={{
                              backgroundColor: 'rgba(15, 42, 36, 0.1)',
                              color: 'var(--color-primary)',
                              fontWeight: 800,
                              padding: '0.35rem 0.75rem',
                              borderRadius: 'var(--radius-sm)',
                              fontSize: '0.95rem',
                            }}
                          >
                            Phòng {booking.assignedRoom?.roomNumber || 'Chưa gán'}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem', fontWeight: 600 }}>{booking.bookingCode}</td>
                        <td style={{ padding: '0.75rem' }}>
                          <div style={{ fontWeight: 600 }}>{booking.customerName}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{booking.customerPhone}</div>
                        </td>
                        <td style={{ padding: '0.75rem', fontWeight: 600 }}>{formatVND(booking.amountDue)}</td>
                        <td style={{ padding: '0.75rem', color: 'var(--color-success)', fontWeight: 600 }}>
                          {formatVND(booking.amountPaid)}
                        </td>
                        <td style={{ padding: '0.75rem' }}>
                          {booking.balance > 0 ? (
                            <strong style={{ color: 'var(--color-danger)' }}>{formatVND(booking.balance)}</strong>
                          ) : (
                            <Badge variant="success">Đã thanh toán đủ</Badge>
                          )}
                        </td>
                        <td style={{ padding: '0.75rem' }}>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            {booking.balance > 0 && (
                              <button
                                onClick={() => {
                                  setPaymentModalBooking(booking);
                                  setPaymentAmount(booking.balance);
                                }}
                                style={{
                                  backgroundColor: 'var(--color-accent)',
                                  color: 'var(--color-primary-dark)',
                                  padding: '0.45rem 0.85rem',
                                  borderRadius: 'var(--radius-sm)',
                                  fontWeight: 700,
                                  fontSize: '0.82rem',
                                }}
                              >
                                Thu Tiền Quầy
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setCheckoutModalBooking(booking);
                              }}
                              style={{
                                backgroundColor: 'var(--color-primary)',
                                color: 'white',
                                padding: '0.45rem 0.85rem',
                                borderRadius: 'var(--radius-sm)',
                                fontWeight: 600,
                                fontSize: '0.82rem',
                              }}
                            >
                              Check-out
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: Receipts Audit */}
        {activeTab === 'receipts' && (
          <div style={{ backgroundColor: 'white', borderRadius: 'var(--radius-lg)', padding: '1.5rem', boxShadow: 'var(--shadow-sm)' }}>
            <h2 style={{ fontSize: '1.25rem', color: 'var(--color-primary)', marginBottom: '1.25rem', fontWeight: 700 }}>
              Nhật Ký Phiếu Thu &amp; Đối Soát Doanh Thu Quầy (Audit Trail - BIZ-01)
            </h2>

            {allReceipts.length === 0 ? (
              <p style={{ color: 'var(--color-text-muted)', padding: '2rem 0', textAlign: 'center' }}>
                Chưa có phiếu thu nào được ghi nhận.
              </p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border-subtle)', color: 'var(--color-text-muted)' }}>
                      <th style={{ padding: '0.75rem' }}>Số Phiếu Thu</th>
                      <th style={{ padding: '0.75rem' }}>Mã Booking</th>
                      <th style={{ padding: '0.75rem' }}>Khách Hàng</th>
                      <th style={{ padding: '0.75rem' }}>Số Tiền Thu</th>
                      <th style={{ padding: '0.75rem' }}>Hình Thức</th>
                      <th style={{ padding: '0.75rem' }}>Nhân Viên Thu</th>
                      <th style={{ padding: '0.75rem' }}>Thời Gian</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allReceipts.map((rec) => (
                      <tr key={rec.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '0.75rem', fontWeight: 800, color: 'var(--color-accent-dark)' }}>
                          {rec.receiptNumber}
                        </td>
                        <td style={{ padding: '0.75rem', fontWeight: 600 }}>{rec.bookingCode}</td>
                        <td style={{ padding: '0.75rem' }}>{rec.customerName}</td>
                        <td style={{ padding: '0.75rem', fontWeight: 800, color: 'var(--color-success)' }}>
                          {formatVND(rec.amount)}
                        </td>
                        <td style={{ padding: '0.75rem' }}>
                          <Badge variant="gray">{rec.method}</Badge>
                        </td>
                        <td style={{ padding: '0.75rem' }}>{rec.actor?.fullName || 'Trần Thị Lễ Tân'}</td>
                        <td style={{ padding: '0.75rem', color: 'var(--color-text-muted)' }}>
                          {new Date(rec.createdAt).toLocaleTimeString('vi-VN')} {formatDateVN(rec.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Counter Payment Modal */}
      {paymentModalBooking && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(5px)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
        >
          <div style={{ backgroundColor: 'white', borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: '480px', padding: '1.75rem' }}>
            <h3 style={{ fontSize: '1.25rem', color: 'var(--color-primary)', fontWeight: 700, marginBottom: '0.5rem' }}>
              Thu Tiền Tại Quầy Lễ Tân
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '1.25rem' }}>
              Booking: <strong>{paymentModalBooking.bookingCode}</strong> • Khách: <strong>{paymentModalBooking.customerName}</strong>
            </p>

            <form onSubmit={handlePaymentSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '0.3rem' }}>
                  Số tiền thu (VND) *
                </label>
                <input
                  type="number"
                  required
                  min={1000}
                  max={paymentModalBooking.balance}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(parseInt(e.target.value, 10))}
                  style={{
                    width: '100%',
                    padding: '0.65rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-medium)',
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    color: 'var(--color-primary)',
                  }}
                />
                <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                  Còn nợ: {formatVND(paymentModalBooking.balance)}
                </span>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '0.3rem' }}>
                  Phương thức thanh toán *
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as 'COUNTER_CASH' | 'COUNTER_TRANSFER' | 'COUNTER_CARD')}
                  style={{
                    width: '100%',
                    padding: '0.6rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-medium)',
                    backgroundColor: 'white',
                  }}
                >
                  <option value="COUNTER_CASH">💵 Tiền mặt tại quầy</option>
                  <option value="COUNTER_TRANSFER">📲 Chuyển khoản ngân hàng (QR Code)</option>
                  <option value="COUNTER_CARD">💳 Quẹt thẻ máy POS</option>
                </select>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '0.3rem' }}>
                  Ghi chú phiếu thu
                </label>
                <input
                  type="text"
                  placeholder="Khách đặt cọc trước hoặc thanh toán toàn phần"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.6rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-medium)',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setPaymentModalBooking(null)}
                  style={{ padding: '0.65rem 1.25rem', borderRadius: 'var(--radius-sm)', color: 'var(--color-text-muted)' }}
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  style={{
                    backgroundColor: 'var(--color-accent)',
                    color: 'var(--color-primary-dark)',
                    padding: '0.65rem 1.5rem',
                    borderRadius: 'var(--radius-sm)',
                    fontWeight: 800,
                  }}
                >
                  Xác Nhận &amp; Xuất Phiếu Thu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Check-out Modal */}
      {checkoutModalBooking && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(5px)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
        >
          <div style={{ backgroundColor: 'white', borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: '480px', padding: '1.75rem' }}>
            <h3 style={{ fontSize: '1.25rem', color: 'var(--color-primary)', fontWeight: 700, marginBottom: '0.5rem' }}>
              Xác Nhận Check-out &amp; Trả Phòng
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '1.25rem' }}>
              Phòng <strong>{checkoutModalBooking.assignedRoom?.roomNumber}</strong> • Khách: <strong>{checkoutModalBooking.customerName}</strong>
            </p>

            {checkoutModalBooking.balance > 0 ? (
              <div style={{ backgroundColor: '#fff5f5', border: '1px solid #fed7d7', padding: '1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.25rem', color: '#c53030', fontSize: '0.88rem' }}>
                ⚠️ <strong>Cảnh báo công nợ:</strong> Khách hàng vẫn còn nợ <strong>{formatVND(checkoutModalBooking.balance)}</strong>. Vui lòng thu tiền tại quầy trước khi hoàn tất check-out!
              </div>
            ) : (
              <div style={{ backgroundColor: '#f0fff4', border: '1px solid #c6f6d5', padding: '1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.25rem', color: '#276749', fontSize: '0.88rem' }}>
                ✓ Khách hàng đã thanh toán đủ 100% công nợ. Sẵn sàng trả phòng.
              </div>
            )}

            <form onSubmit={handleCheckOutSubmit}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '0.3rem' }}>
                  Ngày trả phòng thực tế (Actual Check-out)
                </label>
                <input
                  type="date"
                  required
                  value={actualCheckOutDate}
                  onChange={(e) => setActualCheckOutDate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.6rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-medium)',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setCheckoutModalBooking(null)}
                  style={{ padding: '0.65rem 1.25rem', borderRadius: 'var(--radius-sm)', color: 'var(--color-text-muted)' }}
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  style={{
                    backgroundColor: 'var(--color-primary)',
                    color: 'white',
                    padding: '0.65rem 1.5rem',
                    borderRadius: 'var(--radius-sm)',
                    fontWeight: 700,
                  }}
                >
                  Hoàn Tất Check-out &amp; Dọn Phòng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
