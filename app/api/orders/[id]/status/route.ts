import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { cookies } from 'next/headers';
import { verifyToken, generateInvoiceNumber } from '@/lib/auth/jwt';
import { orderStatusUpdateSchema, canTransition } from '@/lib/validation/schemas';
import { confirmInventoryDeduction, releaseInventory } from '@/lib/inventory/manager';
import { notificationService } from '@/lib/notifications/service';
import { generateRequestId, createErrorResponse, logStructured } from '@/lib/utils/requestId';
import { rateLimitMiddleware } from '@/lib/rate-limit/simple';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const requestId = generateRequestId();
  
  try {
    // Rate limiting status updates
    const rateLimit = rateLimitMiddleware(req, 'checkout');
    if (!rateLimit.allowed) {
      return NextResponse.json(createErrorResponse('RATE_LIMITED', 'Too many status updates', requestId, 429), { status: 429, headers: rateLimit.headers });
    }

    const cookieStore = cookies();
    const token = cookieStore.get('auth-token')?.value;
    if (!token) return NextResponse.json(createErrorResponse('UNAUTHORIZED','Authentication required',requestId,401), { status: 401 });
    const payload = verifyToken(token);
    if (!payload) return NextResponse.json(createErrorResponse('UNAUTHORIZED','Invalid session',requestId,401), { status: 401 });

    const body = await req.json();
    const parsed = orderStatusUpdateSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json(createErrorResponse('VALIDATION_FAILED','Invalid status data',requestId,400,parsed.error.errors), { status: 400 });

    const { status: newStatus, reason } = parsed.data;

    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: { items: true, shop: true, statusHistory: { orderBy: { createdAt: 'desc' }, take: 1 } }
    });

    if (!order) return NextResponse.json(createErrorResponse('ORDER_NOT_FOUND','Order not found',requestId,404), { status: 404 });

    // Authorization: only shop owner/member/admin can change status except CANCELLED which customer can also do if PENDING
    const isShopOwner = order.shop.ownerId === payload.userId;
    const isAdmin = ['admin','super_admin'].includes(payload.role);
    let isShopMember = false;
    
    if (!isShopOwner && !isAdmin) {
      const member = await prisma.shopMember.findFirst({
        where: { shopId: order.shopId, userId: payload.userId }
      });
      isShopMember = !!member;
    }

    const isCustomer = order.customerId === payload.userId;

    if (newStatus === 'CANCELLED' && isCustomer && order.status === 'PENDING') {
      // Customer can cancel pending order - allowed
      logStructured({
        requestId,
        timestamp: new Date().toISOString(),
        level: 'info',
        message: 'Customer cancelling pending order',
        route: `/api/orders/${params.id}/status`,
        userId: payload.userId,
        orderId: order.id
      });
    } else if (!isShopOwner && !isShopMember && !isAdmin) {
      logStructured({
        requestId,
        timestamp: new Date().toISOString(),
        level: 'warn',
        message: 'Forbidden status update - cross-shop attempt',
        route: `/api/orders/${params.id}/status`,
        userId: payload.userId,
        shopId: order.shopId,
        orderId: order.id,
        metadata: { attemptedNewStatus: newStatus, userRole: payload.role }
      });
      return NextResponse.json(createErrorResponse('FORBIDDEN','Forbidden - only shop staff can update status, tenant isolation',requestId,403), { status: 403 });
    }

    // Prevent duplicate completion - QR already redeemed check
    if (order.status === 'COMPLETED') {
      return NextResponse.json(createErrorResponse('ALREADY_COMPLETED','Order already completed - cannot change status',requestId,400), { status: 400 });
    }

    // Validate state transition - real state machine PENDING->COMPLETED with valid transitions
    if (!canTransition(order.status, newStatus)) {
      return NextResponse.json(createErrorResponse('INVALID_TRANSITION',`Invalid transition from ${order.status} to ${newStatus}. Valid: ${getValidTransitions(order.status).join(', ')}`,requestId,400,{ from: order.status, to: newStatus, valid: getValidTransitions(order.status) }), { status: 400 });
    }

    // For COMPLETED, ensure QR was verified or shop owner confirming handover
    // In real flow, QR verification happens before COMPLETED, but we allow shop to complete after verification
    if (newStatus === 'COMPLETED') {
      // Check if order was READY_FOR_PICKUP or OUT_FOR_DELIVERY - not arbitrary jump
      if (!['READY_FOR_PICKUP','OUT_FOR_DELIVERY'].includes(order.status)) {
        return NextResponse.json(createErrorResponse('NOT_READY','Order must be READY_FOR_PICKUP or OUT_FOR_DELIVERY before COMPLETED',requestId,400,{ current: order.status }), { status: 400 });
      }
      
      // Check if QR token exists (should have been verified)
      if (!order.qrToken) {
        return NextResponse.json(createErrorResponse('MISSING_QR','Order missing QR token',requestId,400), { status: 400 });
      }
    }

    // Handle inventory based on status - transaction safety
    try {
      if (newStatus === 'REJECTED' || newStatus === 'CANCELLED') {
        // Release reserved inventory in transaction
        await prisma.$transaction(async (tx) => {
          for (const item of order.items) {
            const product = await tx.product.findUnique({ where: { id: item.productId } });
            if (product) {
              await tx.product.update({
                where: { id: item.productId },
                data: { reservedStock: { decrement: item.quantity } }
              });
              await tx.inventoryTransaction.create({
                data: {
                  shopId: order.shopId,
                  productId: item.productId,
                  type: 'RELEASE',
                  quantity: item.quantity,
                  previousQty: product.stock,
                  newQty: product.stock,
                  reason: `Released due to order ${newStatus} ${order.orderNumber}`,
                  actorId: payload.userId
                }
              });
            }
          }
        });
      }

      if (newStatus === 'COMPLETED') {
        // Confirm deduction - move from reserved to actual deduction
        await prisma.$transaction(async (tx) => {
          for (const item of order.items) {
            const product = await tx.product.findUnique({ where: { id: item.productId } });
            if (product) {
              await tx.product.update({
                where: { id: item.productId },
                data: { 
                  stock: { decrement: item.quantity },
                  reservedStock: { decrement: item.quantity }
                }
              });
              await tx.inventoryTransaction.create({
                data: {
                  shopId: order.shopId,
                  productId: item.productId,
                  type: 'DEDUCTION',
                  quantity: item.quantity,
                  previousQty: product.stock,
                  newQty: product.stock - item.quantity,
                  reason: `Deducted for completed order ${order.orderNumber}`,
                  actorId: payload.userId
                }
              });
            }
          }
        });

        // Generate invoice - immutable, server-controlled numbering
        const existingInvoice = await prisma.invoice.findUnique({ where: { orderId: order.id } });
        if (!existingInvoice) {
          const invoiceNumber = `INV-${new Date().getFullYear()}-${generateInvoiceNumber().slice(-6)}`;
          await prisma.invoice.create({
            data: {
              orderId: order.id,
              invoiceNumber,
              data: JSON.stringify({
                orderNumber: order.orderNumber,
                invoiceNumber,
                shop: { name: order.shop.name, address: order.shop.address, gstin: order.shop.gstin, city: order.shop.city, pincode: order.shop.pincode },
                customerId: order.customerId,
                items: order.items.map(i=>({ productName: i.productName, sku: i.sku, quantity: i.quantity, unit: i.unit, unitPrice: i.unitPrice, subtotal: i.subtotal, storageZone: i.storageZone })),
                subtotal: order.subtotal,
                discount: order.discount,
                tax: order.tax,
                total: order.total,
                paymentMethod: order.paymentMethod,
                paymentStatus: order.paymentStatus,
                date: new Date().toISOString(),
                immutable: true,
                note: 'Historical snapshot - correction via credit note, not editing'
              })
            }
          });
        }
      }
    } catch (e:any) {
      logStructured({
        requestId,
        timestamp: new Date().toISOString(),
        level: 'error',
        message: `Inventory handling failed for status ${newStatus}`,
        route: `/api/orders/${params.id}/status`,
        orderId: order.id,
        error: e.message
      });
      return NextResponse.json(createErrorResponse('INVENTORY_FAILED',`Inventory handling failed: ${e.message}`,requestId,500), { status: 500 });
    }

    const updated = await prisma.order.update({
      where: { id: order.id },
      data: { status: newStatus as any }
    });

    await prisma.orderStatusHistory.create({
      data: {
        orderId: order.id,
        fromStatus: order.status as any,
        toStatus: newStatus as any,
        actorId: payload.userId,
        reason: reason || `Status changed to ${newStatus}`
      }
    });

    await prisma.auditLog.create({
      data: {
        actorId: payload.userId,
        action: 'ORDER_STATUS_CHANGED',
        entity: 'Order',
        entityId: order.id,
        metadata: JSON.stringify({ from: order.status, to: newStatus, reason, requestId, actorRole: payload.role })
      }
    });

    // Notifications with delivery states - in-app always available even if push fails
    if (['ACCEPTED','REJECTED','PREPARING','READY_FOR_PICKUP','COMPLETED'].includes(newStatus)) {
      const map: Record<string, any> = {
        ACCEPTED: 'order_accepted',
        REJECTED: 'order_rejected',
        PREPARING: 'order_preparing',
        READY_FOR_PICKUP: 'order_ready',
        COMPLETED: 'order_completed'
      };
      try {
        await notificationService.notifyCustomer(order.id, map[newStatus], reason);
      } catch (e) {
        logStructured({
          requestId,
          timestamp: new Date().toISOString(),
          level: 'warn',
          message: 'Customer notification failed but status updated',
          route: `/api/orders/${params.id}/status`,
          orderId: order.id,
          error: (e as any).message
        });
      }
    }

    logStructured({
      requestId,
      timestamp: new Date().toISOString(),
      level: 'info',
      message: `Order status changed ${order.status} -> ${newStatus}`,
      route: `/api/orders/${params.id}/status`,
      userId: payload.userId,
      orderId: order.id,
      shopId: order.shopId,
      metadata: { from: order.status, to: newStatus, reason }
    });

    return NextResponse.json({ success: true, order: updated, message: `Order ${newStatus.toLowerCase()}`, requestId }, { headers: rateLimit.headers });
  } catch (e: any) {
    logStructured({
      requestId,
      timestamp: new Date().toISOString(),
      level: 'error',
      message: 'Status update failed',
      route: `/api/orders/${params.id}/status`,
      error: e.message
    });
    return NextResponse.json(createErrorResponse('STATUS_UPDATE_FAILED',e.message,requestId,500), { status: 500 });
  }
}

function getValidTransitions(from: string): string[] {
  const transitions: Record<string, string[]> = {
    PENDING: ['ACCEPTED','REJECTED','CANCELLED'],
    ACCEPTED: ['PREPARING','REJECTED','CANCELLED'],
    PREPARING: ['PICKING','QUALITY_CHECK','READY_FOR_PICKUP','CANCELLED'],
    PICKING: ['QUALITY_CHECK','READY_FOR_PICKUP'],
    QUALITY_CHECK: ['READY_FOR_PICKUP','PREPARING'],
    READY_FOR_PICKUP: ['OUT_FOR_DELIVERY','COMPLETED','CANCELLED'],
    OUT_FOR_DELIVERY: ['COMPLETED','CANCELLED'],
    COMPLETED: [],
    CANCELLED: [],
    REJECTED: []
  };
  return transitions[from] || [];
}
