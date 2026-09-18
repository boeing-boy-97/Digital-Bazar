// Domain: Orders - Centralized state machine, strict transitions, audit
import { ORDER } from '@/lib/constants';

export type OrderStatus = 
  | 'PENDING'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'PREPARING'
  | 'PARTIALLY_READY'
  | 'READY_FOR_PICKUP'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'REFUND_PENDING'
  | 'REFUNDED';

export const validTransitions: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ['ACCEPTED', 'REJECTED', 'CANCELLED'],
  ACCEPTED: ['PREPARING', 'CANCELLED'],
  PREPARING: ['PARTIALLY_READY', 'READY_FOR_PICKUP', 'CANCELLED'],
  PARTIALLY_READY: ['READY_FOR_PICKUP', 'CANCELLED'],
  READY_FOR_PICKUP: ['COMPLETED', 'OUT_FOR_DELIVERY'],
  OUT_FOR_DELIVERY: ['DELIVERED', 'CANCELLED'],
  DELIVERED: ['COMPLETED'],
  COMPLETED: ['REFUND_PENDING'],
  CANCELLED: [],
  REJECTED: [],
  REFUND_PENDING: ['REFUNDED'],
  REFUNDED: []
};

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return validTransitions[from]?.includes(to) || false;
}

export function validateTransition(from: OrderStatus, to: OrderStatus): void {
  if (!canTransition(from, to)) {
    throw new Error(`Invalid transition ${from} → ${to}. Valid: ${validTransitions[from]?.join(', ') || 'none'}`);
  }
}

export function isTerminalStatus(status: OrderStatus): boolean {
  return ['COMPLETED', 'CANCELLED', 'REJECTED', 'REFUNDED'].includes(status);
}

export function isCancellable(status: OrderStatus): boolean {
  return ['PENDING', 'ACCEPTED', 'PREPARING', 'PARTIALLY_READY'].includes(status);
}

export function isActiveStatus(status: OrderStatus): boolean {
  return ['PENDING', 'ACCEPTED', 'PREPARING', 'PARTIALLY_READY', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY'].includes(status);
}

export function generateOrderNumber(sequence: number): string {
  const year = new Date().getFullYear();
  return `${ORDER.NUMBER_PREFIX}-${year}-${String(sequence).padStart(ORDER.NUMBER_PAD, '0')}`;
}

export function calculatePickupTime(
  shopPrepTimeMin: number,
  queueLength: number = 0,
  avgPrepTimePerOrderMin: number = 10
): Date {
  // Real pickup time based on shop prep time + queue
  const queueDelay = queueLength * avgPrepTimePerOrderMin;
  const totalMinutes = shopPrepTimeMin + queueDelay;
  return new Date(Date.now() + totalMinutes * 60 * 1000);
}

export function isPickupTimeValid(
  pickupTime: Date,
  businessHours: any[],
  holidays: any[]
): { valid: boolean; reason?: string } {
  // Check if pickup time falls within business hours
  const day = pickupTime.getDay();
  const hours = pickupTime.getHours();
  const minutes = pickupTime.getMinutes();
  const currentMinutes = hours * 60 + minutes;

  const todayHours = businessHours.filter((bh: any) => bh.dayOfWeek === day && !bh.isClosed);
  if (todayHours.length === 0) {
    return { valid: false, reason: 'Shop closed on selected day' };
  }

  for (const bh of todayHours) {
    if (!bh.openTime || !bh.closeTime) continue;
    const [openH, openM] = bh.openTime.split(':').map(Number);
    const [closeH, closeM] = bh.closeTime.split(':').map(Number);
    const openMinutes = openH * 60 + openM;
    const closeMinutes = closeH * 60 + closeM;

    if (currentMinutes >= openMinutes && currentMinutes < closeMinutes) {
      return { valid: true };
    }
  }

  return { valid: false, reason: 'Pickup time outside business hours' };
}

export interface OrderException {
  type: 'ITEM_UNAVAILABLE' | 'WRONG_COUNT' | 'DAMAGED' | 'SUBSTITUTION' | 'PARTIAL' | 'CANCELLATION' | 'PAYMENT_FAILURE' | 'PICKUP_TIMEOUT';
  productId?: string;
  message: string;
  timestamp: Date;
  actorId?: string;
  orderId: string;
}

export function createOrderException(
  type: OrderException['type'],
  orderId: string,
  message: string,
  productId?: string,
  actorId?: string
): OrderException {
  return {
    type,
    orderId,
    productId,
    message,
    timestamp: new Date(),
    actorId
  };
}
