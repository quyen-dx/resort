'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import styles from './staff.module.css';

interface StaffItem {
  id: string;
  email: string;
  fullName: string;
  phoneNumber: string | null;
  role: 'ADMIN' | 'RECEPTIONIST' | 'DISPATCHER' | 'DRIVER';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CreateFormData {
  fullName: string;
  email: string;
  phoneNumber: string;
  role: 'ADMIN' | 'RECEPTIONIST' | 'DISPATCHER' | 'DRIVER';
  password: string;
  isActive: boolean;
}

interface EditFormData {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  role: 'ADMIN' | 'RECEPTIONIST' | 'DISPATCHER' | 'DRIVER';
  password: string;
  isActive: boolean;
}

export default function AdminStaffPage() {
  const [staffList, setStaffList] = useState<StaffItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Form states
  const [createForm, setCreateForm] = useState<CreateFormData>({
    fullName: '',
    email: '',
    phoneNumber: '',
    role: 'RECEPTIONIST',
    password: '',
    isActive: true,
  });

  const [editForm, setEditForm] = useState<EditFormData>({
    id: '',
    fullName: '',
    email: '',
    phoneNumber: '',
    role: 'RECEPTIONIST',
    password: '',
    isActive: true,
  });

  const [deletingStaff, setDeletingStaff] = useState<StaffItem | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchStaff = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/staff');
      const data = await res.json();
      if (data.success) {
        setStaffList(data.data);
      } else {
        setFeedbackMsg({ type: 'error', text: data.error || 'Lỗi tải danh sách nhân viên' });
      }
    } catch {
      setFeedbackMsg({ type: 'error', text: 'Lỗi kết nối máy chủ khi nạp nhân sự' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  // Filtered List
  const filteredStaff = useMemo(() => {
    return staffList.filter((s) => {
      // Search match
      const query = searchTerm.toLowerCase();
      const matchSearch =
        s.fullName.toLowerCase().includes(query) ||
        s.email.toLowerCase().includes(query) ||
        (s.phoneNumber && s.phoneNumber.includes(query));

      if (!matchSearch) return false;

      // Role filter
      if (roleFilter !== 'ALL' && s.role !== roleFilter) return false;

      // Status filter
      if (statusFilter === 'ACTIVE' && !s.isActive) return false;
      if (statusFilter === 'INACTIVE' && s.isActive) return false;

      return true;
    });
  }, [staffList, searchTerm, roleFilter, statusFilter]);

  // Role Counts
  const counts = useMemo(() => {
    return {
      total: staffList.length,
      admin: staffList.filter((s) => s.role === 'ADMIN').length,
      reception: staffList.filter((s) => s.role === 'RECEPTIONIST').length,
      dispatch: staffList.filter((s) => s.role === 'DISPATCHER').length,
      driver: staffList.filter((s) => s.role === 'DRIVER').length,
    };
  }, [staffList]);

  // Handle Create
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      setFeedbackMsg(null);
      const res = await fetch('/api/admin/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Tạo nhân viên thất bại');
      }

      setFeedbackMsg({ type: 'success', text: `Đã tạo tài khoản cho ${createForm.fullName} thành công.` });
      setIsCreateOpen(false);
      setCreateForm({
        fullName: '',
        email: '',
        phoneNumber: '',
        role: 'RECEPTIONIST',
        password: '',
        isActive: true,
      });
      await fetchStaff();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi hệ thống';
      setFeedbackMsg({ type: 'error', text: msg });
    } finally {
      setActionLoading(false);
    }
  };

  // Open Edit Modal
  const openEditModal = (staff: StaffItem) => {
    setEditForm({
      id: staff.id,
      fullName: staff.fullName,
      email: staff.email,
      phoneNumber: staff.phoneNumber || '',
      role: staff.role,
      password: '',
      isActive: staff.isActive,
    });
    setFeedbackMsg(null);
    setIsEditOpen(true);
  };

  // Handle Edit Submit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      setFeedbackMsg(null);
      const res = await fetch(`/api/admin/staff/${editForm.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: editForm.fullName,
          phoneNumber: editForm.phoneNumber,
          role: editForm.role,
          isActive: editForm.isActive,
          password: editForm.password ? editForm.password : undefined,
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Cập nhật nhân viên thất bại');
      }

      setFeedbackMsg({ type: 'success', text: `Cập nhật thông tin nhân viên ${editForm.fullName} thành công.` });
      setIsEditOpen(false);
      await fetchStaff();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi hệ thống';
      setFeedbackMsg({ type: 'error', text: msg });
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Quick Toggle Status
  const handleToggleActive = async (staff: StaffItem) => {
    try {
      setFeedbackMsg(null);
      const nextStatus = !staff.isActive;
      const res = await fetch(`/api/admin/staff/${staff.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: nextStatus }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Đổi trạng thái tài khoản thất bại');
      }

      setFeedbackMsg({
        type: 'success',
        text: `Đã ${nextStatus ? 'kích hoạt lại' : 'khóa tạm thời'} tài khoản của ${staff.fullName}.`,
      });
      await fetchStaff();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi hệ thống';
      setFeedbackMsg({ type: 'error', text: msg });
    }
  };

  // Open Delete Modal
  const openDeleteModal = (staff: StaffItem) => {
    setDeletingStaff(staff);
    setFeedbackMsg(null);
    setIsDeleteOpen(true);
  };

  // Handle Delete Submit
  const handleDeleteSubmit = async () => {
    if (!deletingStaff) return;
    try {
      setActionLoading(true);
      setFeedbackMsg(null);
      const res = await fetch(`/api/admin/staff/${deletingStaff.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Xóa nhân viên thất bại');
      }

      setFeedbackMsg({ type: 'success', text: `Đã xóa nhân viên ${deletingStaff.fullName} khỏi hệ thống.` });
      setIsDeleteOpen(false);
      setDeletingStaff(null);
      await fetchStaff();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Lỗi hệ thống';
      setFeedbackMsg({ type: 'error', text: msg });
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('vi-VN');
    } catch {
      return dateStr;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return <span className={`${styles.roleBadge} ${styles.roleAdmin}`}>👑 QUẢN TRỊ VIÊN</span>;
      case 'RECEPTIONIST':
        return <span className={`${styles.roleBadge} ${styles.roleReceptionist}`}>🏨 LỄ TÂN</span>;
      case 'DISPATCHER':
        return <span className={`${styles.roleBadge} ${styles.roleDispatcher}`}>🧭 ĐIỀU PHỐI XE</span>;
      case 'DRIVER':
        return <span className={`${styles.roleBadge} ${styles.roleDriver}`}>🚗 TÀI XẾ</span>;
      default:
        return <span className={styles.roleBadge}>{role}</span>;
    }
  };

  return (
    <div className={styles.container}>
      {/* Top Header */}
      <div className={styles.headerRow}>
        <div className={styles.titleArea}>
          <h1>Quản Lý Đội Ngũ Nhân Viên &amp; Phân Quyền (CRUD)</h1>
          <p>
            Phân hệ quản trị nhân sự nội bộ: thêm mới, cập nhật vai trò (RBAC), kích hoạt/khóa tài khoản và xóa nhân viên
          </p>
        </div>
        <button className={styles.createBtn} onClick={() => setIsCreateOpen(true)}>
          <span>+</span> Thêm Mới Nhân Viên
        </button>
      </div>

      {/* Notifications */}
      {feedbackMsg && (
        <div className={feedbackMsg.type === 'success' ? styles.alertSuccess : styles.alertError}>
          {feedbackMsg.text}
        </div>
      )}

      {/* Stat Chips */}
      <div className={styles.statsRow}>
        <div className={styles.statChip}>
          <span className={styles.statChipLabel}>Tổng Nhân Sự</span>
          <span className={styles.statChipValue}>{counts.total}</span>
        </div>
        <div className={styles.statChip}>
          <span className={styles.statChipLabel}>👑 Quản Trị Viên</span>
          <span className={styles.statChipValue}>{counts.admin}</span>
        </div>
        <div className={styles.statChip}>
          <span className={styles.statChipLabel}>🏨 Lễ Tân</span>
          <span className={styles.statChipValue}>{counts.reception}</span>
        </div>
        <div className={styles.statChip}>
          <span className={styles.statChipLabel}>🧭 Điều Phối Xe</span>
          <span className={styles.statChipValue}>{counts.dispatch}</span>
        </div>
        <div className={styles.statChip}>
          <span className={styles.statChipLabel}>🚗 Tài Xế</span>
          <span className={styles.statChipValue}>{counts.driver}</span>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className={styles.filterCard}>
        <div className={styles.filterTopRow}>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="🔍 Tìm kiếm theo tên, email hoặc số điện thoại..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <div className={styles.filterPills}>
            <button
              className={`${styles.filterPill} ${roleFilter === 'ALL' ? styles.filterPillActive : ''}`}
              onClick={() => setRoleFilter('ALL')}
            >
              Tất cả vai trò ({counts.total})
            </button>
            <button
              className={`${styles.filterPill} ${roleFilter === 'ADMIN' ? styles.filterPillActive : ''}`}
              onClick={() => setRoleFilter('ADMIN')}
            >
              Quản trị viên ({counts.admin})
            </button>
            <button
              className={`${styles.filterPill} ${roleFilter === 'RECEPTIONIST' ? styles.filterPillActive : ''}`}
              onClick={() => setRoleFilter('RECEPTIONIST')}
            >
              Lễ tân ({counts.reception})
            </button>
            <button
              className={`${styles.filterPill} ${roleFilter === 'DISPATCHER' ? styles.filterPillActive : ''}`}
              onClick={() => setRoleFilter('DISPATCHER')}
            >
              Điều phối xe ({counts.dispatch})
            </button>
            <button
              className={`${styles.filterPill} ${roleFilter === 'DRIVER' ? styles.filterPillActive : ''}`}
              onClick={() => setRoleFilter('DRIVER')}
            >
              Tài xế ({counts.driver})
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: '#a0aec0' }}>Trạng thái:</span>
          <button
            className={`${styles.filterPill} ${statusFilter === 'ALL' ? styles.filterPillActive : ''}`}
            onClick={() => setStatusFilter('ALL')}
          >
            Tất cả
          </button>
          <button
            className={`${styles.filterPill} ${statusFilter === 'ACTIVE' ? styles.filterPillActive : ''}`}
            onClick={() => setStatusFilter('ACTIVE')}
          >
            🟢 Đang hoạt động
          </button>
          <button
            className={`${styles.filterPill} ${statusFilter === 'INACTIVE' ? styles.filterPillActive : ''}`}
            onClick={() => setStatusFilter('INACTIVE')}
          >
            🔴 Tạm khóa
          </button>
        </div>
      </div>

      {/* Staff Table Section */}
      <div className={styles.cardSection}>
        {loading ? (
          <div className={styles.loadingBox}>Đang tải danh sách nhân sự...</div>
        ) : filteredStaff.length === 0 ? (
          <div style={{ color: '#718096', textAlign: 'center', padding: '40px' }}>
            Không tìm thấy nhân viên nào khớp với điều kiện lọc.
          </div>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Nhân Viên</th>
                  <th>Số Điện Thoại</th>
                  <th>Vai Trò Nghiệp Vụ</th>
                  <th>Trạng Thái</th>
                  <th>Ngày Bổ Nhiệm</th>
                  <th style={{ textAlign: 'right' }}>Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredStaff.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <div className={styles.userCell}>
                        <div className={styles.avatar}>
                          {s.fullName ? s.fullName.charAt(0).toUpperCase() : 'N'}
                        </div>
                        <div className={styles.nameInfo}>
                          <span className={styles.nameText}>{s.fullName}</span>
                          <span className={styles.emailText}>{s.email}</span>
                        </div>
                      </div>
                    </td>
                    <td>{s.phoneNumber || <span style={{ color: '#718096' }}>Chưa cập nhật</span>}</td>
                    <td>{getRoleBadge(s.role)}</td>
                    <td>
                      {s.isActive ? (
                        <span className={styles.statusActive}>
                          <span>●</span> Đang làm việc
                        </span>
                      ) : (
                        <span className={styles.statusInactive}>
                          <span>●</span> Tạm dừng
                        </span>
                      )}
                    </td>
                    <td>{formatDate(s.createdAt)}</td>
                    <td>
                      <div className={styles.actionBtns} style={{ justifyContent: 'flex-end' }}>
                        <button
                          className={styles.editBtn}
                          onClick={() => openEditModal(s)}
                          title="Chỉnh sửa thông tin"
                        >
                          ✏️ Sửa
                        </button>
                        <button
                          className={styles.toggleBtn}
                          onClick={() => handleToggleActive(s)}
                          title={s.isActive ? 'Khóa tài khoản này' : 'Mở khóa tài khoản'}
                        >
                          {s.isActive ? '🔒 Khóa' : '🔓 Mở'}
                        </button>
                        <button
                          className={styles.deleteBtn}
                          onClick={() => openDeleteModal(s)}
                          title="Xóa tài khoản nhân viên"
                        >
                          🗑️ Xóa
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

      {/* CREATE MODAL */}
      {isCreateOpen && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>+ Thêm Mới Nhân Viên Resort</h2>
              <button className={styles.closeBtn} onClick={() => setIsCreateOpen(false)}>
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateSubmit}>
              <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Họ và Tên Nhân Viên *</label>
                  <input
                    type="text"
                    required
                    className={styles.formInput}
                    placeholder="Ví dụ: Nguyễn Văn Hùng"
                    value={createForm.fullName}
                    onChange={(e) => setCreateForm({ ...createForm, fullName: e.target.value })}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Email Nội Bộ Resort *</label>
                  <input
                    type="email"
                    required
                    className={styles.formInput}
                    placeholder="Ví dụ: hung.nguyen@annamresort.vn"
                    value={createForm.email}
                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Số Điện Thoại Liên Hệ</label>
                  <input
                    type="tel"
                    className={styles.formInput}
                    placeholder="Ví dụ: 0912345678"
                    value={createForm.phoneNumber}
                    onChange={(e) => setCreateForm({ ...createForm, phoneNumber: e.target.value })}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Vai Trò Nghiệp Vụ (RBAC) *</label>
                  <select
                    className={styles.formSelect}
                    value={createForm.role}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        role: e.target.value as CreateFormData['role'],
                      })
                    }
                  >
                    <option value="RECEPTIONIST">🏨 Lễ Tân (RECEPTIONIST)</option>
                    <option value="DISPATCHER">🧭 Điều Phối Xe (DISPATCHER)</option>
                    <option value="DRIVER">🚗 Tài Xế Vận Chuyển (DRIVER)</option>
                    <option value="ADMIN">👑 Quản Trị Viên (ADMIN)</option>
                  </select>
                  <span className={styles.helperText}>
                    * Phân hệ nhân viên chỉ cấp quyền nhân sự nội bộ; không cấp vai trò Khách hàng.
                  </span>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Mật Khẩu Khởi Tạo *</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    className={styles.formInput}
                    placeholder="Tối thiểu 6 ký tự (ví dụ: 123456)"
                    value={createForm.password}
                    onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Trạng Thái Hoạt Động</label>
                  <select
                    className={styles.formSelect}
                    value={createForm.isActive ? 'true' : 'false'}
                    onChange={(e) => setCreateForm({ ...createForm, isActive: e.target.value === 'true' })}
                  >
                    <option value="true">🟢 Đang hoạt động</option>
                    <option value="false">🔴 Tạm khóa</option>
                  </select>
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => setIsCreateOpen(false)}
                  disabled={actionLoading}
                >
                  Hủy Bỏ
                </button>
                <button type="submit" className={styles.submitBtn} disabled={actionLoading}>
                  {actionLoading ? 'Đang tạo...' : 'Tạo Tài Khoản'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {isEditOpen && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>✏️ Chỉnh Sửa Nhân Viên: {editForm.fullName}</h2>
              <button className={styles.closeBtn} onClick={() => setIsEditOpen(false)}>
                ✕
              </button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Họ và Tên Nhân Viên</label>
                  <input
                    type="text"
                    required
                    className={styles.formInput}
                    value={editForm.fullName}
                    onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Email (Định danh hệ thống)</label>
                  <input
                    type="email"
                    disabled
                    className={styles.formInput}
                    value={editForm.email}
                    style={{ opacity: 0.6, cursor: 'not-allowed' }}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Số Điện Thoại</label>
                  <input
                    type="tel"
                    className={styles.formInput}
                    value={editForm.phoneNumber}
                    onChange={(e) => setEditForm({ ...editForm, phoneNumber: e.target.value })}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Vai Trò Nghiệp Vụ (RBAC)</label>
                  <select
                    className={styles.formSelect}
                    value={editForm.role}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        role: e.target.value as EditFormData['role'],
                      })
                    }
                  >
                    <option value="RECEPTIONIST">🏨 Lễ Tân (RECEPTIONIST)</option>
                    <option value="DISPATCHER">🧭 Điều Phối Xe (DISPATCHER)</option>
                    <option value="DRIVER">🚗 Tài Xế Vận Chuyển (DRIVER)</option>
                    <option value="ADMIN">👑 Quản Trị Viên (ADMIN)</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Trạng Thái Hoạt Động</label>
                  <select
                    className={styles.formSelect}
                    value={editForm.isActive ? 'true' : 'false'}
                    onChange={(e) => setEditForm({ ...editForm, isActive: e.target.value === 'true' })}
                  >
                    <option value="true">🟢 Đang hoạt động</option>
                    <option value="false">🔴 Tạm khóa</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Đặt Mật Khẩu Mới (Tùy chọn)</label>
                  <input
                    type="password"
                    minLength={6}
                    className={styles.formInput}
                    placeholder="Để trống nếu giữ nguyên mật khẩu cũ"
                    value={editForm.password}
                    onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                  />
                  <span className={styles.helperText}>
                    * Chỉ nhập nếu cần đặt lại mật khẩu cho nhân viên này (ít nhất 6 ký tự).
                  </span>
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => setIsEditOpen(false)}
                  disabled={actionLoading}
                >
                  Hủy Bỏ
                </button>
                <button type="submit" className={styles.submitBtn} disabled={actionLoading}>
                  {actionLoading ? 'Đang lưu...' : 'Lưu Thay Đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM MODAL */}
      {isDeleteOpen && deletingStaff && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>⚠️ Xác Nhận Xóa Nhân Viên</h2>
              <button className={styles.closeBtn} onClick={() => setIsDeleteOpen(false)}>
                ✕
              </button>
            </div>
            <div className={styles.modalBody}>
              <p style={{ color: '#e2e8f0', fontSize: 14, lineHeight: 1.6, margin: 0 }}>
                Bạn có chắc chắn muốn xóa nhân viên{' '}
                <strong style={{ color: '#c5a880' }}>{deletingStaff.fullName}</strong> ({deletingStaff.email})?
              </p>
              <div
                style={{
                  background: 'rgba(229, 62, 62, 0.1)',
                  border: '1px solid rgba(229, 62, 62, 0.3)',
                  padding: '12px 14px',
                  borderRadius: '8px',
                  fontSize: 12,
                  color: '#feb2b2',
                }}
              >
                ⚠️ <strong>Lưu ý:</strong> Thao tác này sẽ xóa vĩnh viễn tài khoản khỏi hệ thống. Nếu nhân viên này đã
                phát sinh các biên lai tài chính tại quầy lễ tân, hệ thống sẽ ngăn chặn việc xóa để đảm bảo toàn vẹn
                kiểm toán tài chính.
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={() => setIsDeleteOpen(false)}
                disabled={actionLoading}
              >
                Hủy Bỏ
              </button>
              <button
                type="button"
                className={styles.dangerBtn}
                onClick={handleDeleteSubmit}
                disabled={actionLoading}
              >
                {actionLoading ? 'Đang xóa...' : 'Xác Nhận Xóa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
