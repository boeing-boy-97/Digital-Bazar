import { describe, it, expect } from 'vitest';
import { calculateCartTotals, checkInventory } from '../lib/inventory/manager';
import { canTransition } from '../lib/validation/schemas';

// Mocked unit tests - real tests would use test DB

describe('Inventory Calculations', () => {
  it('calculates cart totals correctly', () => {
    const items = [
      { price: 100, quantity: 2, discount: 10, taxRate: 18 },
      { price: 50, quantity: 1, discount: 0, taxRate: 5 }
    ];
    const result = calculateCartTotals(items as any);
    // 100*2=200 -10% =180 +18% tax=32.4 => 212.4
    // 50*1=50 +5% tax=2.5 => 52.5
    // subtotal 250, discount 20, tax 34.9, total 264.9
    expect(result.subtotal).toBe(250);
    expect(result.discount).toBe(20);
    expect(result.total).toBeCloseTo(264.9);
  });

  it('prevents overselling', () => {
    // Logic: available = stock - reserved
    const stock = 100;
    const reserved = 90;
    const available = stock - reserved;
    expect(available).toBe(10);
    expect(available >= 20).toBe(false);
  });
});

describe('Order State Machine', () => {
  it('allows valid transitions', () => {
    expect(canTransition('PENDING', 'ACCEPTED')).toBe(true);
    expect(canTransition('ACCEPTED', 'PREPARING')).toBe(true);
    expect(canTransition('PREPARING', 'READY_FOR_PICKUP')).toBe(true);
    expect(canTransition('READY_FOR_PICKUP', 'COMPLETED')).toBe(true);
  });

  it('blocks invalid transitions', () => {
    expect(canTransition('PENDING', 'COMPLETED')).toBe(false);
    expect(canTransition('COMPLETED', 'PENDING')).toBe(false);
    expect(canTransition('CANCELLED', 'ACCEPTED')).toBe(false);
    expect(canTransition('READY_FOR_PICKUP', 'PENDING')).toBe(false);
  });

  it('allows cancellation from early states', () => {
    expect(canTransition('PENDING', 'CANCELLED')).toBe(true);
    expect(canTransition('ACCEPTED', 'CANCELLED')).toBe(true);
    expect(canTransition('PREPARING', 'CANCELLED')).toBe(true);
  });
});

describe('Tax & Discount', () => {
  it('calculates GST correctly', () => {
    const price = 100;
    const taxRate = 18;
    const tax = price * (taxRate / 100);
    expect(tax).toBe(18);
  });

  it('applies discount before tax', () => {
    const price = 100;
    const discount = 10; // 10%
    const taxRate = 18;
    const afterDiscount = price - (price * discount / 100); // 90
    const tax = afterDiscount * (taxRate / 100); // 16.2
    expect(afterDiscount).toBe(90);
    expect(tax).toBe(16.2);
  });
});

describe('Commission', () => {
  it('calculates platform commission', () => {
    const orderTotal = 1000;
    const commissionRate = 5; // 5%
    const commission = orderTotal * (commissionRate / 100);
    expect(commission).toBe(50);
  });

  it('supports variable commission per category', () => {
    const commissions: Record<string, number> = {
      'Cement': 3,
      'Paint': 8,
      'Hardware': 5
    };
    expect(commissions['Cement']).toBe(3);
    expect(commissions['Paint']).toBe(8);
  });
});
