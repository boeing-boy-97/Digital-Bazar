// Domain: Money - Integer paise, no Float, immutable snapshots
import { MONEY } from '@/lib/constants';

export type Paise = number & { readonly __brand: 'Paise' };
export type INR = number & { readonly __brand: 'INR' };

export function toPaise(inr: number): Paise {
  if (typeof inr !== 'number' || isNaN(inr) || !isFinite(inr)) throw new Error('Invalid INR amount');
  if (inr < 0) throw new Error('Negative amount not allowed');
  if (inr > MONEY.MAX_AMOUNT_INR) throw new Error(`Amount exceeds max ${MONEY.MAX_AMOUNT_INR}`);
  return Math.round(inr * MONEY.MINOR_UNIT) as Paise;
}

export function fromPaise(paise: number): INR {
  if (typeof paise !== 'number' || isNaN(paise) || !isFinite(paise)) throw new Error('Invalid paise amount');
  return (Math.round(paise) / MONEY.MINOR_UNIT) as INR;
}

export function formatPaise(paise: number): string {
  if (typeof paise !== 'number' || isNaN(paise)) return formatINR(0);
  return formatINR(fromPaise(paise));
}

export function formatINR(inr: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(inr);
}

export function addPaise(...paiseAmounts: number[]): Paise {
  return paiseAmounts.reduce((sum, p) => sum + Math.round(p), 0) as Paise;
}

export function multiplyPaise(pricePaise: number, quantity: number): Paise {
  if (quantity < 0) throw new Error('Negative quantity');
  return (Math.round(pricePaise) * quantity) as Paise;
}

export function calculateDiscountPaise(subtotalPaise: number, discountPercent: number): Paise {
  if (discountPercent < 0 || discountPercent > 100) throw new Error('Invalid discount percent');
  return Math.round(subtotalPaise * discountPercent / 100) as Paise;
}

export function calculateTaxPaise(amountPaise: number, taxRate: number): Paise {
  if (taxRate < 0 || taxRate > 100) throw new Error('Invalid tax rate');
  return Math.round(amountPaise * taxRate / 100) as Paise;
}

export interface OrderTotalsPaise {
  subtotalPaise: Paise;
  discountPaise: Paise;
  taxPaise: Paise;
  totalPaise: Paise;
}

export function calculateOrderTotalsPaise(items: { pricePaise: number; quantity: number; discount?: number; taxRate?: number }[]): OrderTotalsPaise {
  let subtotalPaise = 0;
  let discountPaise = 0;
  let taxPaise = 0;

  for (const item of items) {
    if (item.quantity <= 0) throw new Error('Quantity must be positive');
    const itemSubtotalPaise = item.pricePaise * item.quantity;
    const itemDiscountPaise = Math.round(itemSubtotalPaise * (item.discount || 0) / 100);
    const afterDiscountPaise = itemSubtotalPaise - itemDiscountPaise;
    const itemTaxPaise = Math.round(afterDiscountPaise * (item.taxRate || 0) / 100);

    subtotalPaise += itemSubtotalPaise;
    discountPaise += itemDiscountPaise;
    taxPaise += itemTaxPaise;
  }

  const totalPaise = subtotalPaise - discountPaise + taxPaise;
  if (totalPaise < 0) throw new Error('Total cannot be negative');

  return {
    subtotalPaise: subtotalPaise as Paise,
    discountPaise: discountPaise as Paise,
    taxPaise: taxPaise as Paise,
    totalPaise: totalPaise as Paise
  };
}

export function isValidMoneyPaise(paise: number): boolean {
  return typeof paise === 'number' && !isNaN(paise) && isFinite(paise) && paise >= 0 && paise <= MONEY.MAX_AMOUNT_PA;
}
