import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

export const TRANSPORT_SANDBOX_RATE_PER_KM = 4000; // 4,000 VND/km mock sandbox rate (AGENTS.md Decision Rule 5)

export class MockTransportSandboxAdapter {
  constructor() {
    this.providerName = 'Mock Sandbox Electric Shuttle (VinFast/Xanh SM Prototype)';
    this.unitPricePerKm = TRANSPORT_SANDBOX_RATE_PER_KM;
  }

  getProviderName() {
    return this.providerName;
  }

  isSandbox() {
    return true;
  }

  calculateEstimate(distanceKm) {
    const validDistance = Math.max(1, distanceKm);
    const totalPrice = Math.round(validDistance * this.unitPricePerKm);
    const estimatedDurationMinutes = Math.round((validDistance / 45) * 60);

    return {
      distanceKm: validDistance,
      unitPricePerKm: this.unitPricePerKm,
      totalPrice,
      estimatedDurationMinutes,
      currency: 'VND',
      provider: this.providerName,
      isSandbox: true,
    };
  }

  simulateGpsCoordinate(currentLat, currentLng) {
    if (!currentLat || !currentLng) {
      return { latitude: 11.9982, longitude: 109.2194 };
    }

    const nextLat = Math.min(12.0850, currentLat + 0.0087);
    const nextLng = Math.max(109.1950, currentLng - 0.0024);

    return {
      latitude: parseFloat(nextLat.toFixed(6)),
      longitude: parseFloat(nextLng.toFixed(6)),
    };
  }
}

describe('VẬN CHUYỂN & SANDBOX ADAPTER: Bảng Giá & Mock Provider (INT-01)', () => {
  const adapter = new MockTransportSandboxAdapter();

  test('Bảng giá cước Sandbox chuẩn xác: 4.000 VND/km (Decision Rule 5)', () => {
    assert.equal(TRANSPORT_SANDBOX_RATE_PER_KM, 4000);
    assert.equal(adapter.isSandbox(), true);

    const estimate35km = adapter.calculateEstimate(35);
    assert.equal(estimate35km.distanceKm, 35);
    assert.equal(estimate35km.unitPricePerKm, 4000);
    assert.equal(estimate35km.totalPrice, 140000); // 35 * 4,000 = 140,000 VND
    assert.equal(estimate35km.currency, 'VND');
    assert.ok(estimate35km.estimatedDurationMinutes > 0);
  });

  test('Khoảng cách nhỏ nhất được bảo đảm >= 1km', () => {
    const estimate0km = adapter.calculateEstimate(0);
    assert.equal(estimate0km.distanceKm, 1);
    assert.equal(estimate0km.totalPrice, 4000);
  });
});

describe('ĐIỀU PHỐI XE & MÁY TRẠNG THÁI VẬN CHUYỂN (MAP-01)', () => {
  const adapter = new MockTransportSandboxAdapter();

  const validTransitions = {
    REQUESTED: ['ASSIGNED', 'CANCELLED'],
    ASSIGNED: ['IN_TRANSIT', 'CANCELLED'],
    IN_TRANSIT: ['COMPLETED', 'CANCELLED'],
    COMPLETED: [],
    CANCELLED: [],
  };

  function canTransition(current, next) {
    return validTransitions[current]?.includes(next) ?? false;
  }

  test('Vòng đời hợp lệ: REQUESTED -> ASSIGNED -> IN_TRANSIT -> COMPLETED', () => {
    assert.ok(canTransition('REQUESTED', 'ASSIGNED'));
    assert.ok(canTransition('ASSIGNED', 'IN_TRANSIT'));
    assert.ok(canTransition('IN_TRANSIT', 'COMPLETED'));
  });

  test('Chặn các chuyển đổi trạng thái bất hợp lệ', () => {
    // Không thể nhảy cóc từ REQUESTED thẳng sang COMPLETED
    assert.equal(canTransition('REQUESTED', 'COMPLETED'), false);

    // Không thể quay lại trạng thái cũ từ COMPLETED
    assert.equal(canTransition('COMPLETED', 'IN_TRANSIT'), false);
    assert.equal(canTransition('COMPLETED', 'ASSIGNED'), false);

    // Không thể chuyển đổi từ chuyến đã CANCELLED
    assert.equal(canTransition('CANCELLED', 'IN_TRANSIT'), false);
  });

  test('Giả lập tọa độ GPS tiệm cận về Resort trong Sandbox (Simulation Ping)', () => {
    const coord1 = adapter.simulateGpsCoordinate();
    assert.equal(coord1.latitude, 11.9982);
    assert.equal(coord1.longitude, 109.2194);

    const coord2 = adapter.simulateGpsCoordinate(coord1.latitude, coord1.longitude);
    // Tọa độ vĩ độ tăng dần về phía Bắc (Resort)
    assert.ok(coord2.latitude > coord1.latitude);
  });
});
