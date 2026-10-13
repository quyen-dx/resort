'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatVND } from '@/client/utils/currency';
import { formatDateVN } from '@/client/utils/date';
import { Badge } from '@/client/components/ui/badge';
import styles from './reception.module.css';

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
    <div className={styles.pageWrapper}>
      {/* Top Header */}
      <header className={styles.header}>
        <div className={styles.headerBrandGroup}>
          <Link href="/" className={styles.headerBrandLink}>
            AN NAM RESORT
          </Link>
          <span className={styles.headerDivider}>|</span>
          <span className={styles.headerTitle}>Quầy Lễ Tân &amp; Điều Hành Vận Hành (Front Desk)</span>
        </div>

        <div className={styles.headerUserGroup}>
          <div>
            <span className={styles.userLabel}>Nhân viên trực: </span>
            <strong className={styles.userName}>Trần Thị Lễ Tân</strong>
          </div>
          <Link href="/rooms" className={styles.customerPortalLink}>
            Trang Đặt Phòng Khách →
          </Link>
        </div>
      </header>

      {/* Toast Notification */}
      {notification && (
        <div className={`${styles.toast} ${notification.type === 'success' ? styles.toastSuccess : styles.toastError}`}>
          {notification.message}
        </div>
      )}

      {/* Main Container */}
      <div className={styles.mainContainer}>
        {/* Navigation Tabs */}
        <div className={styles.tabList}>
          <button
            onClick={() => setActiveTab('checkin')}
            className={`${styles.tabButton} ${activeTab === 'checkin' ? styles.tabButtonActive : ''}`}
          >
            📋 Khách Đến Check-in ({checkInList.length})
          </button>
          <button
            onClick={() => setActiveTab('inhouse')}
            className={`${styles.tabButton} ${activeTab === 'inhouse' ? styles.tabButtonActive : ''}`}
          >
            🏨 Đang Lưu Trú &amp; Công Nợ ({inHouseList.length})
          </button>
          <button
            onClick={() => setActiveTab('receipts')}
            className={`${styles.tabButton} ${activeTab === 'receipts' ? styles.tabButtonActive : ''}`}
          >
            🧾 Phiếu Thu Tiền Tại Quầy ({allReceipts.length})
          </button>
        </div>

        {/* TAB 1: Check-in Desk */}
        {activeTab === 'checkin' && (
          <div className={styles.cardContainer}>
            <h2 className={styles.cardTitle}>
              Danh Sách Đơn Đặt Phòng Chờ Làm Thủ Tục Check-in
            </h2>

            {checkInList.length === 0 ? (
              <p className={styles.emptyText}>
                Hiện không có đơn nào đang chờ check-in hôm nay.
              </p>
            ) : (
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr className={styles.tableHeaderRow}>
                      <th className={styles.th}>Mã Đặt Phòng</th>
                      <th className={styles.th}>Khách Hàng</th>
                      <th className={styles.th}>Loại Phòng</th>
                      <th className={styles.th}>Lưu Trú</th>
                      <th className={styles.th}>Tổng Tiền (VND)</th>
                      <th className={styles.th}>Gán Số Phòng Vật Lý</th>
                      <th className={styles.th}>Hành Động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {checkInList.map((booking) => {
                      const availRooms = booking.roomType.physicalRooms?.filter((r) => r.status === 'AVAILABLE') || [];
                      return (
                        <tr key={booking.id} className={styles.tableRow}>
                          <td className={`${styles.td} ${styles.bookingCode}`}>
                            {booking.bookingCode}
                          </td>
                          <td className={styles.td}>
                            <div className={styles.customerName}>{booking.customerName}</div>
                            <div className={styles.customerSub}>{booking.customerPhone}</div>
                          </td>
                          <td className={styles.td}>
                            <Badge variant="gold">{booking.roomType.name}</Badge>
                          </td>
                          <td className={styles.td}>
                            <div>{formatDateVN(booking.checkInDate)} → {formatDateVN(booking.checkOutDate)}</div>
                            <div className={styles.customerSub}>({booking.totalNights} đêm)</div>
                          </td>
                          <td className={`${styles.td} ${styles.amountPrimary}`}>
                            {formatVND(booking.amountDue)}
                          </td>
                          <td className={styles.td}>
                            <select
                              value={selectedRoomAssignments[booking.bookingCode] || ''}
                              onChange={(e) =>
                                setSelectedRoomAssignments({
                                  ...selectedRoomAssignments,
                                  [booking.bookingCode]: e.target.value,
                                })
                              }
                              className={styles.roomSelect}
                            >
                              <option value="">-- Chọn số phòng --</option>
                              {availRooms.map((r) => (
                                <option key={r.id} value={r.id}>
                                  Phòng {r.roomNumber} (Trống)
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className={styles.td}>
                            <button
                              onClick={() => handleCheckIn(booking)}
                              className={styles.actionButtonCheckIn}
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
          <div className={styles.cardContainer}>
            <h2 className={styles.cardTitle}>
              Khách Đang Lưu Trú &amp; Quản Lý Thanh Toán Quầy (BIZ-01)
            </h2>

            {inHouseList.length === 0 ? (
              <p className={styles.emptyText}>
                Hiện không có khách nào đang lưu trú.
              </p>
            ) : (
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr className={styles.tableHeaderRow}>
                      <th className={styles.th}>Số Phòng</th>
                      <th className={styles.th}>Mã Booking</th>
                      <th className={styles.th}>Khách Hàng</th>
                      <th className={styles.th}>Phải Thu</th>
                      <th className={styles.th}>Đã Thanh Toán</th>
                      <th className={styles.th}>Còn Nợ (Balance)</th>
                      <th className={styles.th}>Thao Tác Quầy</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inHouseList.map((booking) => (
                      <tr key={booking.id} className={styles.tableRow}>
                        <td className={styles.td}>
                          <span className={styles.roomTag}>
                            Phòng {booking.assignedRoom?.roomNumber || 'Chưa gán'}
                          </span>
                        </td>
                        <td className={styles.td}><strong>{booking.bookingCode}</strong></td>
                        <td className={styles.td}>
                          <div className={styles.customerName}>{booking.customerName}</div>
                          <div className={styles.customerSub}>{booking.customerPhone}</div>
                        </td>
                        <td className={`${styles.td} ${styles.amountPrimary}`}>{formatVND(booking.amountDue)}</td>
                        <td className={`${styles.td} ${styles.amountSuccess}`}>
                          {formatVND(booking.amountPaid)}
                        </td>
                        <td className={styles.td}>
                          {booking.balance > 0 ? (
                            <strong className={styles.amountDebt}>{formatVND(booking.balance)}</strong>
                          ) : (
                            <Badge variant="success">Đã thanh toán đủ</Badge>
                          )}
                        </td>
                        <td className={styles.td}>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            {booking.balance > 0 && (
                              <button
                                onClick={() => {
                                  setPaymentModalBooking(booking);
                                  setPaymentAmount(booking.balance);
                                }}
                                className={styles.actionButtonPay}
                              >
                                Thu Tiền Quầy
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setCheckoutModalBooking(booking);
                              }}
                              className={styles.actionButtonCheckOut}
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
          <div className={styles.cardContainer}>
            <h2 className={styles.cardTitle}>
              Nhật Ký Phiếu Thu &amp; Đối Soát Doanh Thu Quầy (Audit Trail - BIZ-01)
            </h2>

            {allReceipts.length === 0 ? (
              <p className={styles.emptyText}>
                Chưa có phiếu thu nào được ghi nhận.
              </p>
            ) : (
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr className={styles.tableHeaderRow}>
                      <th className={styles.th}>Số Phiếu Thu</th>
                      <th className={styles.th}>Mã Booking</th>
                      <th className={styles.th}>Khách Hàng</th>
                      <th className={styles.th}>Số Tiền Thu</th>
                      <th className={styles.th}>Hình Thức</th>
                      <th className={styles.th}>Nhân Viên Thu</th>
                      <th className={styles.th}>Thời Gian</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allReceipts.map((rec) => (
                      <tr key={rec.id} className={styles.tableRow}>
                        <td className={styles.td} style={{ fontWeight: 800, color: 'var(--color-accent-dark)' }}>
                          {rec.receiptNumber}
                        </td>
                        <td className={styles.td}><strong>{rec.bookingCode}</strong></td>
                        <td className={styles.td}>{rec.customerName}</td>
                        <td className={`${styles.td} ${styles.amountSuccess}`} style={{ fontWeight: 800 }}>
                          {formatVND(rec.amount)}
                        </td>
                        <td className={styles.td}>
                          <Badge variant="gray">{rec.method}</Badge>
                        </td>
                        <td className={styles.td}>{rec.actor?.fullName || 'Trần Thị Lễ Tân'}</td>
                        <td className={styles.td} style={{ color: 'var(--color-text-muted)' }}>
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
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3 className={styles.modalTitle}>
              Thu Tiền Tại Quầy Lễ Tân
            </h3>
            <p className={styles.modalSubtitle}>
              Booking: <strong>{paymentModalBooking.bookingCode}</strong> • Khách: <strong>{paymentModalBooking.customerName}</strong>
            </p>

            <form onSubmit={handlePaymentSubmit}>
              <div className={styles.formGroup}>
                <label className={styles.fieldLabel}>
                  Số tiền thu (VND) *
                </label>
                <input
                  type="number"
                  required
                  min={1000}
                  max={paymentModalBooking.balance}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(parseInt(e.target.value, 10))}
                  className={styles.inputNumber}
                />
                <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                  Còn nợ: {formatVND(paymentModalBooking.balance)}
                </span>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.fieldLabel}>
                  Phương thức thanh toán *
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as 'COUNTER_CASH' | 'COUNTER_TRANSFER' | 'COUNTER_CARD')}
                  className={styles.inputSelect}
                >
                  <option value="COUNTER_CASH">💵 Tiền mặt tại quầy</option>
                  <option value="COUNTER_TRANSFER">📲 Chuyển khoản ngân hàng (QR Code)</option>
                  <option value="COUNTER_CARD">💳 Quẹt thẻ máy POS</option>
                </select>
              </div>

              <div className={styles.formGroupLast}>
                <label className={styles.fieldLabel}>
                  Ghi chú phiếu thu
                </label>
                <input
                  type="text"
                  placeholder="Khách đặt cọc trước hoặc thanh toán toàn phần"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className={styles.inputText}
                />
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  onClick={() => setPaymentModalBooking(null)}
                  className={styles.modalCancelBtn}
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className={styles.modalSubmitBtn}
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
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3 className={styles.modalTitle}>
              Xác Nhận Check-out &amp; Trả Phòng
            </h3>
            <p className={styles.modalSubtitle}>
              Phòng <strong>{checkoutModalBooking.assignedRoom?.roomNumber}</strong> • Khách: <strong>{checkoutModalBooking.customerName}</strong>
            </p>

            {checkoutModalBooking.balance > 0 ? (
              <div className={styles.debtWarning}>
                ⚠️ <strong>Cảnh báo công nợ:</strong> Khách hàng vẫn còn nợ <strong>{formatVND(checkoutModalBooking.balance)}</strong>. Vui lòng thu tiền tại quầy trước khi hoàn tất check-out!
              </div>
            ) : (
              <div className={styles.paidSuccessNotice}>
                ✓ Khách hàng đã thanh toán đủ 100% công nợ. Sẵn sàng trả phòng.
              </div>
            )}

            <form onSubmit={handleCheckOutSubmit}>
              <div className={styles.formGroupLast}>
                <label className={styles.fieldLabel}>
                  Ngày trả phòng thực tế (Actual Check-out)
                </label>
                <input
                  type="date"
                  required
                  value={actualCheckOutDate}
                  onChange={(e) => setActualCheckOutDate(e.target.value)}
                  className={styles.inputText}
                />
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  onClick={() => setCheckoutModalBooking(null)}
                  className={styles.modalCancelBtn}
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  className={styles.modalPrimaryBtn}
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
