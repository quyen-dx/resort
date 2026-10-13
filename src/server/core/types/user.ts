export type UserRole =
  | 'CUSTOMER'
  | 'RECEPTIONIST'
  | 'DRIVER'
  | 'DISPATCHER'
  | 'ADMIN';

export interface UserSession {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  phoneNumber?: string;
}

export interface UserProfile extends UserSession {
  createdAt: string;
  updatedAt: string;
}
