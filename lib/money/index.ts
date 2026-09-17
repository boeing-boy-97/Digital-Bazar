// Money handling - INR in paise to avoid floating point errors
// Requirement 50: Never use floating-point for financial calculations

export const INR_MINOR_UNIT = 100; // 1 INR = 100 paise

// Convert INR to paise (integer)
export function toPaise(inr: number): number {
  return Math.round(inr * INR_MINOR_UNIT);
}

// Convert paise to INR (float with 2 decimals)
export function fromPaise(paise: number): number {
  return Math.round(paise) / INR_MINOR_UNIT;
}

// Safe addition in paise
export function addPaise(...amounts: number[]): number {
  const totalPaise = amounts.reduce((sum, amt) => sum + toPaise(amt), 0);
  return fromPaise(totalPaise);
}

// Safe multiplication: price * quantity
export function multiplyMoney(price: number, quantity: number): number {
  const pricePaise = toPaise(price);
  const totalPaise = pricePaise * quantity;
  return fromPaise(totalPaise);
}

// Safe percentage: amount * percent / 100
export function percentageOf(amount: number, percent: number): number {
  const amountPaise = toPaise(amount);
  const resultPaise = Math.round((amountPaise * percent) / 100);
  return fromPaise(resultPaise);
}

// Calculate order totals safely in paise
export function calculateOrderTotals(items: { price: number; quantity: number; discount?: number; taxRate?: number }[]) {
  let subtotalPaise = 0;
  let discountPaise = 0;
  let taxPaise = 0;

  for (const item of items) {
    const pricePaise = toPaise(item.price);
    const itemSubtotalPaise = pricePaise * item.quantity;
    const itemDiscountPaise = Math.round((itemSubtotalPaise * (item.discount || 0)) / 100);
    const afterDiscountPaise = itemSubtotalPaise - itemDiscountPaise;
    const itemTaxPaise = Math.round((afterDiscountPaise * (item.taxRate || 0)) / 100);

    subtotalPaise += itemSubtotalPaise;
    discountPaise += itemDiscountPaise;
    taxPaise += itemTaxPaise;
  }

  const totalPaise = subtotalPaise - discountPaise + taxPaise;

  return {
    subtotal: fromPaise(subtotalPaise),
    discount: fromPaise(discountPaise),
    tax: fromPaise(taxPaise),
    total: fromPaise(totalPaise),
    // Also return paise for precise storage
    subtotalPaise,
    discountPaise,
    taxPaise,
    totalPaise
  };
}

// Format currency for display - INR float
export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

// Format paise (integer) directly to INR display - authoritative
export function formatPaise(paise: number): string {
  if (typeof paise !== 'number' || isNaN(paise)) return formatINR(0);
  return formatINR(fromPaise(paise));
}

// Format any money: if >= 100 and integer, assume paise, else INR - safe fallback
export function formatMoney(amountPaiseOrINR: number, isPaise: boolean = true): string {
  if (isPaise) return formatPaise(amountPaiseOrINR);
  return formatINR(amountPaiseOrINR);
}

// Validate money amount
export function isValidMoneyAmount(amount: any): boolean {
  if (typeof amount !== 'number') return false;
  if (isNaN(amount)) return false;
  if (amount < 0) return false;
  if (!isFinite(amount)) return false;
  // Max 10 lakhs per item for safety
  if (amount > 1000000) return false;
  return true;
}

// Round to 2 decimals safely
export function roundINR(amount: number): number {
  return Math.round(toPaise(amount)) / INR_MINOR_UNIT;
}
