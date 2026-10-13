/**
 * Rate Limiter in-memory with Sliding Window Algorithm (SEC-06)
 * Chống brute-force đăng nhập và spam đặt phòng lặp
 */

export interface RateLimitConfig {
  maxRequests: number;
  windowSeconds: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetSeconds: number;
}

class SlidingWindowRateLimiter {
  private requestStore: Map<string, number[]> = new Map();

  /**
   * Kiểm tra và ghi nhận lượt truy cập
   */
  public check(identifier: string, config: RateLimitConfig): RateLimitResult {
    const now = Date.now();
    const windowMs = config.windowSeconds * 1000;
    const windowStart = now - windowMs;

    const timestamps = this.requestStore.get(identifier) || [];
    // Loại bỏ các request đã nằm ngoài khung thời gian trượt
    const validTimestamps = timestamps.filter((t) => t > windowStart);

    if (validTimestamps.length >= config.maxRequests) {
      const oldestInWindow = validTimestamps[0];
      const resetSeconds = Math.ceil((oldestInWindow + windowMs - now) / 1000);
      return {
        allowed: false,
        remaining: 0,
        resetSeconds: Math.max(1, resetSeconds),
      };
    }

    validTimestamps.push(now);
    this.requestStore.set(identifier, validTimestamps);

    return {
      allowed: true,
      remaining: config.maxRequests - validTimestamps.length,
      resetSeconds: config.windowSeconds,
    };
  }

  /**
   * Xóa bộ nhớ đệm cho một identifier (sau khi đăng nhập thành công)
   */
  public reset(identifier: string): void {
    this.requestStore.delete(identifier);
  }

  /**
   * Dọn dẹp định kỳ bộ nhớ đệm
   */
  public cleanup(maxAgeSeconds: number = 300): void {
    const now = Date.now();
    const cutoff = now - maxAgeSeconds * 1000;
    for (const [key, timestamps] of this.requestStore.entries()) {
      const fresh = timestamps.filter((t) => t > cutoff);
      if (fresh.length === 0) {
        this.requestStore.delete(key);
      } else {
        this.requestStore.set(key, fresh);
      }
    }
  }
}

export const rateLimiter = new SlidingWindowRateLimiter();

// Các cấu hình giới hạn tốc độ chuẩn mực theo nghiệp vụ:
export const RATE_LIMIT_RULES = {
  // Login: Tối đa 5 lần thử trong 60 giây (Chống Brute-force mật khẩu - SEC-06)
  AUTH_LOGIN: { maxRequests: 5, windowSeconds: 60 },
  // Booking: Tối đa 10 đơn đặt trong 60 giây trên 1 IP (Chống bot spam)
  CREATE_BOOKING: { maxRequests: 10, windowSeconds: 60 },
  // Search: Tối đa 60 truy vấn trong 60 giây
  SEARCH_AVAILABILITY: { maxRequests: 60, windowSeconds: 60 },
};

/**
 * Trích xuất IP khách hàng từ Request Header
 */
export function getClientIp(headers: Headers): string {
  const forwardedFor = headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  const realIp = headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }
  return '127.0.0.1';
}

// -----------------------------------------------------------------------------
// PRIVACY DATA MASKING (PRIV-01)
// -----------------------------------------------------------------------------

/**
 * Che giấu số điện thoại khách hàng: 0912345678 -> 0912***678
 */
export function maskPhoneNumber(phone?: string | null): string {
  if (!phone) return '';
  const clean = phone.trim();
  if (clean.length < 7) return clean;
  const start = clean.slice(0, 4);
  const end = clean.slice(-3);
  return `${start}***${end}`;
}

/**
 * Che giấu email khách hàng: khachhang@gmail.com -> kh***@gmail.com
 */
export function maskEmail(email?: string | null): string {
  if (!email) return '';
  const parts = email.trim().split('@');
  if (parts.length !== 2) return email;
  const [local, domain] = parts;
  if (local.length <= 2) return `${local}***@${domain}`;
  return `${local.slice(0, 2)}***@${domain}`;
}

/**
 * Che giấu họ tên khách hàng: Nguyễn Văn An -> Nguyễn V. A
 */
export function maskCustomerName(fullName?: string | null): string {
  if (!fullName) return '';
  const parts = fullName.trim().split(/\s+/);
  if (parts.length <= 1) return fullName;
  const lastName = parts[0];
  const maskedInitials = parts.slice(1).map((p) => `${p[0]}.`).join(' ');
  return `${lastName} ${maskedInitials}`;
}
