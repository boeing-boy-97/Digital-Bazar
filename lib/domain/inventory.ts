// Domain: Inventory - Single authoritative source, no duplicate truth
import { INVENTORY } from '@/lib/constants';

export interface InventoryState {
  onHand: number; // Product.stock
  reserved: number; // Product.reservedStock
  available: number; // Derived: onHand - reserved
  lowStockThreshold: number;
}

export function calculateAvailable(onHand: number, reserved: number): number {
  return Math.max(0, onHand - reserved);
}

export function isInStock(state: InventoryState): boolean {
  return state.available > 0;
}

export function isLowStock(state: InventoryState): boolean {
  return state.available > 0 && state.available <= state.lowStockThreshold;
}

export function isOutOfStock(state: InventoryState): boolean {
  return state.available <= 0;
}

export function canReserve(state: InventoryState, requestedQty: number): { can: boolean; reason?: string } {
  if (requestedQty <= 0) return { can: false, reason: 'Quantity must be positive' };
  if (requestedQty < INVENTORY.MIN_ORDER_QTY_DEFAULT) return { can: false, reason: `Minimum order ${INVENTORY.MIN_ORDER_QTY_DEFAULT}` };
  if (state.available < requestedQty) {
    if (state.available <= 0) return { can: false, reason: 'Out of stock - real inventory' };
    return { can: false, reason: `Only ${state.available} left - real count` };
  }
  return { can: true };
}

export function calculateInventoryValue(products: { pricePaise: number; stock: number }[]): number {
  return products.reduce((sum, p) => sum + (p.pricePaise * p.stock), 0);
}

export type InventoryTransactionType = 
  | 'IN' // RECEIVE
  | 'OUT' // SELL
  | 'RESERVE'
  | 'RELEASE'
  | 'ADJUST'
  | 'RETURN'
  | 'DAMAGE'
  | 'TRANSFER'
  | 'ORDER_COMPLETED';

export interface InventoryLedgerEntry {
  shopId: string;
  productId: string;
  type: InventoryTransactionType;
  quantity: number;
  previousQty: number;
  newQty: number;
  reason: string;
  actorId?: string;
  orderId?: string;
}

export function validateInventoryTransaction(entry: InventoryLedgerEntry): void {
  if (entry.quantity <= 0 && entry.type !== 'ADJUST') throw new Error('Quantity must be positive');
  if (entry.previousQty < 0 || entry.newQty < 0) throw new Error('Quantity cannot be negative - prevents -1 race');
  if (!entry.reason) throw new Error('Reason required for audit');
}

export function forecastStockout(
  currentStock: number,
  dailySalesVelocity: number,
  incomingStock: number = 0
): { days: number | null; message: string; confidence: 'high' | 'medium' | 'low' | 'insufficient' } {
  if (dailySalesVelocity <= 0) {
    return { days: null, message: 'Not enough sales history', confidence: 'insufficient' };
  }
  if (currentStock <= 0) {
    return { days: 0, message: 'Out of stock', confidence: 'high' };
  }

  const effectiveStock = currentStock + incomingStock;
  const days = Math.floor(effectiveStock / dailySalesVelocity);

  if (days <= 2) {
    return { days, message: `Critical: ${days} day${days !== 1 ? 's' : ''} left`, confidence: 'high' };
  } else if (days <= 7) {
    return { days, message: `Low: ${days} days left`, confidence: 'high' };
  } else if (days <= 14) {
    return { days, message: `Estimated stockout: ${days} days`, confidence: 'medium' };
  } else {
    return { days, message: `${days} days of stock`, confidence: 'low' };
  }
}
