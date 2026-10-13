import { db } from '../lib/db';
import { hashPassword, verifyPassword, createSessionToken, verifySessionToken } from '../lib/auth';
import { UserSession } from '../core/types/user';
import { AppError } from '../core/errors/app-error';
import { logger } from '../lib/logger';

export class AuthService {
  /**
   * Authenticate user with email and password
   */
  public async login(email: string, plainPassword: string): Promise<{ session: UserSession; token: string }> {
    const user = await db.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user || !user.isActive) {
      logger.warn('Failed login attempt: User not found or inactive', { email });
      throw new AppError('UNAUTHORIZED', 'Email hoặc mật khẩu không chính xác.', 401);
    }

    const isMatch = await verifyPassword(plainPassword, user.passwordHash);
    if (!isMatch) {
      logger.warn('Failed login attempt: Password mismatch', { email });
      throw new AppError('UNAUTHORIZED', 'Email hoặc mật khẩu không chính xác.', 401);
    }

    const session: UserSession = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      phoneNumber: user.phoneNumber ?? undefined,
    };

    const token = await createSessionToken(session);
    logger.info('User successfully authenticated', { userId: user.id, role: user.role });

    return { session, token };
  }

  /**
   * Register a new customer account
   */
  public async registerCustomer(data: {
    email: string;
    password: string;
    fullName: string;
    phoneNumber?: string;
  }): Promise<{ session: UserSession; token: string }> {
    const existing = await db.user.findUnique({
      where: { email: data.email.toLowerCase().trim() },
    });

    if (existing) {
      throw new AppError('CONFLICT', 'Email này đã được sử dụng trên hệ thống.', 409);
    }

    const passwordHash = await hashPassword(data.password);
    const user = await db.user.create({
      data: {
        email: data.email.toLowerCase().trim(),
        passwordHash,
        fullName: data.fullName,
        phoneNumber: data.phoneNumber,
        role: 'CUSTOMER',
      },
    });

    const session: UserSession = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      phoneNumber: user.phoneNumber ?? undefined,
    };

    const token = await createSessionToken(session);
    return { session, token };
  }

  /**
   * Verify token from request cookie
   */
  public async verifyToken(token: string): Promise<UserSession | null> {
    return verifySessionToken(token);
  }
}

export const authService = new AuthService();
