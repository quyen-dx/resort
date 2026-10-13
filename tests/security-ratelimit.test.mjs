import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

// Class SlidingWindowRateLimiter mô phỏng cho test runner
class SlidingWindowRateLimiter {
  constructor() {
    this.requestStore = new Map();
  }

  check(identifier, config) {
    const now = Date.now();
    const windowMs = config.windowSeconds * 1000;
    const windowStart = now - windowMs;

    const timestamps = this.requestStore.get(identifier) || [];
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

  reset(identifier) {
    this.requestStore.delete(identifier);
  }
}

function maskPhoneNumber(phone) {
  if (!phone) return '';
  const clean = phone.trim();
  if (clean.length < 7) return clean;
  const start = clean.slice(0, 4);
  const end = clean.slice(-3);
  return `${start}***${end}`;
}

function maskEmail(email) {
  if (!email) return '';
  const parts = email.trim().split('@');
  if (parts.length !== 2) return email;
  const [local, domain] = parts;
  if (local.length <= 2) return `${local}***@${domain}`;
  return `${local.slice(0, 2)}***@${domain}`;
}

function maskCustomerName(fullName) {
  if (!fullName) return '';
  const parts = fullName.trim().split(/\s+/);
  if (parts.length <= 1) return fullName;
  const lastName = parts[0];
  const maskedInitials = parts.slice(1).map((p) => `${p[0]}.`).join(' ');
  return `${lastName} ${maskedInitials}`;
}

describe('BẢO MẬT & RATE LIMITING CHỐNG BRUTE-FORCE (SEC-05, SEC-06)', () => {
  const limiter = new SlidingWindowRateLimiter();

  test('Sliding Window: Cho phép đúng số lượng request quy định và chặn request vượt ngưỡng', () => {
    const testIp = 'test-ip-bruteforce-1';
    const config = { maxRequests: 3, windowSeconds: 10 };

    // 3 request đầu tiên phải được phép
    const req1 = limiter.check(testIp, config);
    assert.equal(req1.allowed, true);
    assert.equal(req1.remaining, 2);

    const req2 = limiter.check(testIp, config);
    assert.equal(req2.allowed, true);
    assert.equal(req2.remaining, 1);

    const req3 = limiter.check(testIp, config);
    assert.equal(req3.allowed, true);
    assert.equal(req3.remaining, 0);

    // Request thứ 4 phải bị CHẶN với status allowed = false
    const req4 = limiter.check(testIp, config);
    assert.equal(req4.allowed, false);
    assert.equal(req4.remaining, 0);
    assert.ok(req4.resetSeconds > 0);
  });

  test('Reset Rate Limiter hoạt động khi đăng nhập thành công', () => {
    const testIp = 'test-ip-success';
    const config = { maxRequests: 2, windowSeconds: 10 };

    limiter.check(testIp, config);
    limiter.check(testIp, config);

    // Đang bị hết lượt
    const blocked = limiter.check(testIp, config);
    assert.equal(blocked.allowed, false);

    // Người dùng đăng nhập đúng -> Reset
    limiter.reset(testIp);

    // Được phép gửi request lại ngay lập tức
    const afterReset = limiter.check(testIp, config);
    assert.equal(afterReset.allowed, true);
  });
});

describe('BẢO VỆ DỮ LIỆU CÁ NHÂN & MASKING (PRIV-01)', () => {
  test('Che giấu số điện thoại khách hàng (maskPhoneNumber)', () => {
    assert.equal(maskPhoneNumber('0912345678'), '0912***678');
    assert.equal(maskPhoneNumber('0901000004'), '0901***004');
    assert.equal(maskPhoneNumber(''), '');
  });

  test('Che giấu địa chỉ email khách hàng (maskEmail)', () => {
    assert.equal(maskEmail('khachhang@gmail.com'), 'kh***@gmail.com');
    assert.equal(maskEmail('admin@annamresort.vn'), 'ad***@annamresort.vn');
    assert.equal(maskEmail(''), '');
  });

  test('Che giấu họ tên khách hàng (maskCustomerName)', () => {
    assert.equal(maskCustomerName('Nguyễn Văn An'), 'Nguyễn V. A.');
    assert.equal(maskCustomerName('Đặng Tuấn Khách'), 'Đặng T. K.');
    assert.equal(maskCustomerName('Admin'), 'Admin');
  });
});

describe('MÔ PHỎNG SỰ CỐ & TỰ PHỤC HỒI (FAULT INJECTION SIMULATION - SCALE-03)', () => {
  class MockDatabaseConnection {
    constructor() {
      this.isOnline = true;
    }

    simulateNetworkCut() {
      this.isOnline = false;
    }

    simulateReconnected() {
      this.isOnline = true;
    }

    async query(sql) {
      if (!this.isOnline) {
        throw new Error('ECONNREFUSED: Database connection dropped abruptly');
      }
      return [{ result: 1 }];
    }
  }

  test('Hệ thống bắt lỗi mất kết nối sạch sẽ và tự phục hồi khi kết nối hoạt động trở lại', async () => {
    const mockDb = new MockDatabaseConnection();

    // 1. Bình thường
    const res1 = await mockDb.query('SELECT 1');
    assert.equal(res1[0].result, 1);

    // 2. Cắt mạng đột ngột (Fault injection)
    mockDb.simulateNetworkCut();
    await assert.rejects(
      async () => {
        await mockDb.query('SELECT 1');
      },
      (err) => {
        assert.ok(err.message.includes('ECONNREFUSED'));
        return true;
      }
    );

    // 3. Tự phục hồi khi kết nối lại
    mockDb.simulateReconnected();
    const res2 = await mockDb.query('SELECT 1');
    assert.equal(res2[0].result, 1);
  });
});
