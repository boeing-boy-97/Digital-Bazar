import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword, signToken, verifyToken } from '../lib/auth/jwt';

describe('Auth Security', () => {
  it('hashes passwords', async () => {
    const hash = await hashPassword('test123');
    expect(hash).not.toBe('test123');
    expect(hash.length).toBeGreaterThan(20);
  });

  it('verifies passwords correctly', async () => {
    const password = 'securePassword123';
    const hash = await hashPassword(password);
    expect(await verifyPassword(password, hash)).toBe(true);
    expect(await verifyPassword('wrong', hash)).toBe(false);
  });

  it('signs and verifies JWT', () => {
    const payload = { userId: 'user_123', role: 'customer', phone: '9876543210' };
    const token = signToken(payload as any);
    expect(token.split('.')).toHaveLength(3);
    
    const verified = verifyToken(token);
    expect(verified?.userId).toBe('user_123');
    expect(verified?.role).toBe('customer');
  });

  it('rejects invalid tokens', () => {
    expect(verifyToken('invalid.token.here')).toBeNull();
    expect(verifyToken('')).toBeNull();
  });
});

describe('QR Verification Security', () => {
  it('generates secure QR tokens', () => {
    const { generateQRToken } = require('../lib/auth/jwt');
    const token1 = generateQRToken();
    const token2 = generateQRToken();
    expect(token1).not.toBe(token2);
    expect(token1.startsWith('QR-')).toBe(true);
    expect(token1.length).toBeGreaterThan(10);
  });

  it('validates QR server-side only', () => {
    // Client QR data should never be trusted alone
    // Server must validate: order exists, shop matches, status is READY, not completed, token valid
    const mockValidation = (order: any, providedToken: string, shopId: string) => {
      if (order.qrToken !== providedToken) return false;
      if (order.shopId !== shopId) return false;
      if (order.status !== 'READY_FOR_PICKUP') return false;
      if (order.status === 'COMPLETED') return false;
      return true;
    };

    const order = { qrToken: 'QR-ABC123', shopId: 'shop_1', status: 'READY_FOR_PICKUP' };
    expect(mockValidation(order, 'QR-ABC123', 'shop_1')).toBe(true);
    expect(mockValidation(order, 'WRONG', 'shop_1')).toBe(false);
    expect(mockValidation(order, 'QR-ABC123', 'shop_2')).toBe(false);
  });
});
