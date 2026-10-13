import { UserRole, UserSession } from '../core/types/user';
import { AppError } from '../core/errors/app-error';

/**
 * Ensures user is authenticated (Default Deny - SEC-03)
 */
export function requireAuth(session: UserSession | null): UserSession {
  if (!session) {
    throw new AppError('UNAUTHORIZED', 'Yêu cầu đăng nhập để truy cập tài nguyên này.', 401);
  }
  return session;
}

/**
 * Server-side RBAC: Verifies if user has one of the required roles (SEC-03)
 */
export function requireRole(session: UserSession | null, ...allowedRoles: UserRole[]): UserSession {
  const user = requireAuth(session);
  if (!allowedRoles.includes(user.role)) {
    throw new AppError(
      'FORBIDDEN',
      `Tài khoản không đủ quyền hạn (${user.role}). Cần vai trò: ${allowedRoles.join(', ')}`,
      403
    );
  }
  return user;
}

/**
 * Anti-IDOR Protection: Verifies resource ownership (SEC-04)
 * Ensures a Customer cannot view or modify another Customer's booking or profile.
 * Roles in allowedStaffOverride (e.g. ADMIN, RECEPTIONIST) can access if permitted by business rules.
 */
export function assertOwnership(
  session: UserSession | null,
  resourceOwnerId: string,
  allowedStaffOverride: UserRole[] = ['ADMIN', 'RECEPTIONIST']
): void {
  const user = requireAuth(session);

  // If user is staff with override privileges, allow access
  if (allowedStaffOverride.includes(user.role)) {
    return;
  }

  // Strictly check ownership for regular users (Customers, Drivers accessing customer data, etc.)
  if (user.id !== resourceOwnerId) {
    throw new AppError(
      'FORBIDDEN',
      'Truy cập bị từ chối: Bạn không có quyền truy cập hoặc chỉnh sửa tài nguyên của người dùng khác (IDOR Violation).',
      403
    );
  }
}
