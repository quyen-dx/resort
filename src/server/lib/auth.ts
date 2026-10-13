import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { UserRole, UserSession } from '../core/types/user';

const SECRET_KEY = new TextEncoder().encode(
  process.env.SESSION_SECRET || 'mock_super_secret_session_key_min_32_characters_long_12345'
);

const COOKIE_NAME = 'annam_resort_session';

export const COOKIE_CONFIG = {
  name: COOKIE_NAME,
  options: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
  },
};

/**
 * Hash password with bcrypt cost factor 12 (SEC-02)
 */
export async function hashPassword(plainText: string): Promise<string> {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(plainText, salt);
}

/**
 * Verify password against bcrypt hash
 */
export async function verifyPassword(plainText: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plainText, hash);
}

/**
 * Create cryptographically signed session JWT (SEC-02)
 */
export async function createSessionToken(user: UserSession): Promise<string> {
  return new SignJWT({
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(SECRET_KEY);
}

/**
 * Verify and decode session token
 */
export async function verifySessionToken(token: string): Promise<UserSession | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    return {
      id: payload.id as string,
      email: payload.email as string,
      fullName: payload.fullName as string,
      role: payload.role as UserRole,
    };
  } catch {
    return null;
  }
}
