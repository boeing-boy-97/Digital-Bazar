import prisma from '@/lib/db/prisma';
import { canTransition } from '@/lib/validation/schemas';
import { releaseInventory, confirmInventoryDeduction } from '@/lib/inventory/manager';
import { notificationService } from '@/lib/notifications/service';

export interface OrderTransitionResult {
  success: boolean;
  order?: any;
  error?: string;
  errorCode?: string;
}

// Centralized order transition service - validates state, actor, permissions, inventory consequences
// Requirement 22: transitionOrder(orderId, targetState, actor)
export async function transitionOrder(
  orderId: string,
  targetState: string,
  actorId: string,
  actorRole: string,
  reason?: string,
  shopId?: string
): Promise<OrderTransitionResult> {
  
  // Fetch order with shop and items
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { 
      shop: true, 
      items: { include: { product: true } },
      customer: { select: { id: true, name: true } }
    }
  });

  if (!order) {
    return { success: false, error: 'Order not found', errorCode: 'ORDER_NOT_FOUND' };
  }

  const currentState = order.status;

  // Validate transition
  if (!canTransition(currentState, targetState)) {
    return { 
      success: false, 
      error: `Invalid transition from ${currentState} to ${targetState}`, 
      errorCode: 'INVALID_ORDER_STATE' 
    };
  }

  // Authorization checks
  if (['ACCEPTED', 'REJECTED', 'PREPARING', 'READY_FOR_PICKUP', 'COMPLETED'].includes(targetState)) {
    // Shop owner or employee with permission
    if (actorRole === 'customer') {
      return { success: false, error: 'Customer cannot perform this action', errorCode: 'UNAUTHORIZED_SHOP_ACCESS' };
    }
    
    if (actorRole === 'shop_owner') {
      if (order.shop.ownerId !== actorId) {
        return { success: false, error: 'Not your shop order', errorCode: 'UNAUTHORIZED_SHOP_ACCESS' };
      }
    } else if (actorRole === 'shop_employee') {
      const membership = await prisma.shopMember.findFirst({
        where: { shopId: order.shopId, userId: actorId, isActive: true }
      });
      
      if (!membership) {
        return { success: false, error: 'Not a member of this shop', errorCode: 'UNAUTHORIZED_SHOP_ACCESS' };
      }

      // Permission checks per target state
      const permissionMap: Record<string, string[]> = {
        ACCEPTED: ['manager', 'orders.accept', 'order_view'],
        REJECTED: ['manager', 'orders.accept'],
        PREPARING: ['manager', 'orders.prepare', 'order_view'],
        READY_FOR_PICKUP: ['manager', 'orders.complete', 'orders.prepare'],
        COMPLETED: ['manager', 'orders.complete', 'cashier']
      };

      const required = permissionMap[targetState] || [];
      if (!required.includes(membership.permission) && membership.permission !== 'manager') {
        // Check if permission is in list
        const hasPermission = required.some(r => membership.permission.includes(r) || r.includes(membership.permission));
        if (!hasPermission && !['manager', 'order_view'].includes(membership.permission)) {
          return { success: false, error: `Insufficient permission: need ${required.join(' or ')}`, errorCode: 'UNAUTHORIZED_SHOP_ACCESS' };
        }
      }
    } else if (!['admin', 'super_admin'].includes(actorRole)) {
      return { success: false, error: 'Unauthorized', errorCode: 'UNAUTHORIZED_SHOP_ACCESS' };
    }
  }

  // Customer can only cancel pending orders
  if (targetState === 'CANCELLED' && actorRole === 'customer') {
    if (order.customerId !== actorId) {
      return { success: false, error: 'Not your order', errorCode: 'UNAUTHORIZED_SHOP_ACCESS' };
    }
    if (!['PENDING', 'ACCEPTED'].includes(currentState)) {
      return { success: false, error: 'Can only cancel pending or accepted orders', errorCode: 'INVALID_ORDER_STATE' };
    }
  }

  // Business rules
  if (targetState === 'COMPLETED' && order.paymentStatus !== 'PAID' && order.paymentMethod !== 'PAY_AT_STORE') {
    // For online payments, must be paid before completion
    if (order.paymentMethod === 'ONLINE' && order.paymentStatus !== 'PAID') {
      return { success: false, error: 'Payment not completed', errorCode: 'PAYMENT_VERIFICATION_FAILED' };
    }
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Update order status
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: { status: targetState }
      });

      // Create status history
      await tx.orderStatusHistory.create({
        data: {
          orderId,
          fromStatus: currentState,
          toStatus: targetState,
          actorId,
          reason: reason || null
        }
      });

      // Inventory consequences
      if (targetState === 'CANCELLED' || targetState === 'REJECTED') {
        // Release reserved inventory
        for (const item of order.items) {
          const product = await tx.product.findUnique({ where: { id: item.productId } });
          if (product) {
            const releaseQty = Math.min(item.quantity, product.reservedStock);
            await tx.product.update({
              where: { id: item.productId },
              data: { reservedStock: { decrement: releaseQty } }
            });

            await tx.inventoryTransaction.create({
              data: {
                shopId: order.shopId,
                productId: item.productId,
                type: targetState === 'CANCELLED' ? 'ORDER_CANCELLED' : 'ORDER_REJECTED',
                quantity: releaseQty,
                previousQty: product.stock,
                newQty: product.stock,
                reason: `${targetState} - Order ${order.orderNumber}`,
                actorId,
                orderId
              }
            });
          }
        }
      } else if (targetState === 'COMPLETED') {
        // Convert reserved to sold
        for (const item of order.items) {
          const product = await tx.product.findUnique({ where: { id: item.productId } });
          if (product) {
            if (product.stock < item.quantity) {
              throw new Error(`Insufficient stock for ${product.name} on completion`);
            }

            const updated = await tx.product.update({
              where: { id: item.productId },
              data: {
                stock: { decrement: item.quantity },
                reservedStock: { decrement: Math.min(item.quantity, product.reservedStock) }
              }
            });

            if (updated.stock < 0) {
              throw new Error(`Stock would go negative for ${product.name}`);
            }

            await tx.inventoryTransaction.create({
              data: {
                shopId: order.shopId,
                productId: item.productId,
                type: 'ORDER_COMPLETED',
                quantity: item.quantity,
                previousQty: product.stock,
                newQty: updated.stock,
                reason: `Sold - Order ${order.orderNumber} completed`,
                actorId,
                orderId
              }
            });
          }
        }

        // Generate invoice if not exists
        const existingInvoice = await tx.invoice.findUnique({ where: { orderId } });
        if (!existingInvoice) {
          const invoiceNumber = `INV-${new Date().getFullYear()}-${order.orderNumber.slice(-6)}`;
          await tx.invoice.create({
            data: {
              orderId,
              invoiceNumber,
              data: JSON.stringify({
                orderNumber: order.orderNumber,
                shop: { name: order.shop.name, gstin: order.shop.gstin, address: order.shop.address },
                customer: { name: order.customer.name },
                items: order.items.map(i => ({ name: i.productName, qty: i.quantity, price: i.unitPrice, subtotal: i.subtotal })),
                subtotal: order.subtotal,
                tax: order.tax,
                discount: order.discount,
                total: order.total,
                date: new Date().toISOString()
              })
            }
          });
        }
      }

      // Audit log
      await tx.auditLog.create({
        data: {
          actorId,
          action: `ORDER_${targetState}`,
          entity: 'Order',
          entityId: orderId,
          metadata: JSON.stringify({ from: currentState, to: targetState, reason, shopId: order.shopId })
        }
      });

      return updatedOrder;
    });

    // Notifications - outside transaction to not block, but with outbox pattern
    try {
      if (targetState === 'ACCEPTED') {
        await notificationService.notifyCustomer(orderId, 'order_accepted');
      } else if (targetState === 'REJECTED') {
        await notificationService.notifyCustomer(orderId, 'order_rejected', reason);
      } else if (targetState === 'PREPARING') {
        await notificationService.notifyCustomer(orderId, 'order_preparing');
      } else if (targetState === 'READY_FOR_PICKUP') {
        await notificationService.notifyCustomer(orderId, 'order_ready');
      } else if (targetState === 'COMPLETED') {
        await notificationService.notifyCustomer(orderId, 'order_completed');
      } else if (targetState === 'CANCELLED') {
        // Notify shopkeeper about cancellation via direct notify
        await notificationService.notify({
          userId: order.shop.ownerId,
          orderId,
          type: 'order_cancelled',
          title: 'Order Cancelled',
          message: `Order #${order.orderNumber} was cancelled by customer. Reason: ${reason || 'No reason'}. Stock released.`,
          channels: ['in_app']
        });
      }
    } catch (e) {
      console.error('Notification failed after order transition', e);
      // Don't fail transition if notification fails - in-app always available
    }

    const fullOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true, shop: { select: { name: true } }, customer: { select: { name: true } } }
    });

    return { success: true, order: fullOrder };
  } catch (e: any) {
    console.error('Order transition failed', e);
    return { success: false, error: e.message, errorCode: 'ORDER_TRANSITION_FAILED' };
  }
}

// Check if shop is open - real business hours engine
export function isShopOpen(shop: any): { isOpen: boolean; status: string; nextOpen?: string } {
  const now = new Date();
  const currentHour = now.getHours();
  const currentDay = now.getDay();
  const currentMinutes = now.getMinutes();
  const currentTimeMinutes = currentHour * 60 + currentMinutes;

  // Check status
  if (shop.status === 'SUSPENDED' || shop.status === 'REJECTED') {
    return { isOpen: false, status: 'SUSPENDED' };
  }
  if (shop.status === 'PAUSED' || shop.status === 'TEMPORARILY_CLOSED') {
    return { isOpen: false, status: 'TEMPORARILY_UNAVAILABLE' };
  }
  if (shop.status !== 'APPROVED') {
    return { isOpen: false, status: 'CLOSED' };
  }

  // Check holidays
  if (shop.holidays) {
    try {
      const holidays = JSON.parse(shop.holidays);
      if (Array.isArray(holidays) && holidays.includes(currentDay)) {
        return { isOpen: false, status: 'CLOSED', nextOpen: 'Tomorrow' };
      }
    } catch {}
  }

  // Check business hours
  if (shop.openingHours && shop.closingHours) {
    try {
      const parseTime = (timeStr: string) => {
        const [h, m] = timeStr.split(':').map(Number);
        return h * 60 + (m || 0);
      };

      const openMinutes = parseTime(shop.openingHours);
      const closeMinutes = parseTime(shop.closingHours);

      // Handle overnight (e.g., 22:00 - 06:00)
      if (closeMinutes < openMinutes) {
        if (currentTimeMinutes >= openMinutes || currentTimeMinutes < closeMinutes) {
          // Check closing soon (1 hour)
          const minutesUntilClose = closeMinutes > currentTimeMinutes 
            ? closeMinutes - currentTimeMinutes 
            : (24*60 - currentTimeMinutes) + closeMinutes;
          if (minutesUntilClose <= 60) {
            return { isOpen: true, status: 'CLOSING_SOON', nextOpen: `Closes at ${shop.closingHours}` };
          }
          return { isOpen: true, status: 'OPEN', nextOpen: `Closes at ${shop.closingHours}` };
        }
        return { isOpen: false, status: 'CLOSED', nextOpen: `Opens at ${shop.openingHours}` };
      }

      if (currentTimeMinutes < openMinutes) {
        const minutesUntilOpen = openMinutes - currentTimeMinutes;
        if (minutesUntilOpen <= 120) {
          return { isOpen: false, status: 'OPENING_SOON', nextOpen: `Opens at ${shop.openingHours}` };
        }
        return { isOpen: false, status: 'CLOSED', nextOpen: `Opens at ${shop.openingHours}` };
      }

      if (currentTimeMinutes >= closeMinutes) {
        return { isOpen: false, status: 'CLOSED', nextOpen: `Opens tomorrow at ${shop.openingHours}` };
      }

      // Check closing soon
      const minutesUntilClose = closeMinutes - currentTimeMinutes;
      if (minutesUntilClose <= 60) {
        return { isOpen: true, status: 'CLOSING_SOON', nextOpen: `Closes at ${shop.closingHours}` };
      }

      return { isOpen: true, status: 'OPEN', nextOpen: `Closes at ${shop.closingHours}` };
    } catch {}
  }

  // Default business hours 9-20
  if (currentHour >= 9 && currentHour < 20) {
    return { isOpen: true, status: 'OPEN', nextOpen: 'Closes at 8:00 PM' };
  }

  return { isOpen: false, status: 'CLOSED', nextOpen: 'Opens at 9:00 AM' };
}
