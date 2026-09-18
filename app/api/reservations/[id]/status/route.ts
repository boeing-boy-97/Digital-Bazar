import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth/jwt';
import { generateRequestId, createErrorResponse, logStructured } from '@/lib/utils/requestId';
import { z } from 'zod';

const statusSchema = z.object({
  status: z.enum(['CONFIRMED', 'HELD', 'COLLECTED', 'DECLINED', 'EXPIRED']),
  reason: z.string().max(500).optional()
});

const validTransitions: Record<string, string[]> = {
  PENDING: ['CONFIRMED', 'DECLINED', 'EXPIRED'],
  CONFIRMED: ['HELD', 'DECLINED', 'EXPIRED'],
  HELD: ['COLLECTED', 'EXPIRED', 'DECLINED'],
  COLLECTED: [],
  DECLINED: [],
  EXPIRED: []
};

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const requestId = generateRequestId();
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('auth-token')?.value;
    if (!token) return NextResponse.json(createErrorResponse('UNAUTHORIZED', 'Auth required', requestId, 401), { status: 401 });
    const payload = verifyToken(token);
    if (!payload) return NextResponse.json(createErrorResponse('UNAUTHORIZED', 'Invalid session', requestId, 401), { status: 401 });

    const body = await req.json();
    const parsed = statusSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json(createErrorResponse('VALIDATION_FAILED', 'Invalid status', requestId, 400, parsed.error.errors), { status: 400 });

    const { status: newStatus, reason } = parsed.data;

    const reservation = await prisma.reservation.findUnique({
      where: { id: params.id },
      include: { shop: true, items: true }
    });
    if (!reservation) return NextResponse.json(createErrorResponse('NOT_FOUND', 'Reservation not found', requestId, 404), { status: 404 });

    // Validate transition
    const allowed = validTransitions[reservation.status] || [];
    if (!allowed.includes(newStatus)) {
      return NextResponse.json(createErrorResponse('INVALID_TRANSITION', `Cannot transition ${reservation.status} → ${newStatus}`, requestId, 400), { status: 400 });
    }

    // Auth: shop staff can CONFIRMED/HELD/DECLINED/EXPIRED, customer can COLLECTED? Actually shop verifies collection
    const isShopOwner = reservation.shop.ownerId === payload.userId;
    const isAdmin = ['admin', 'super_admin'].includes(payload.role);
    let isMember = false;
    if (!isShopOwner && !isAdmin) {
      const m = await prisma.shopMember.findFirst({ where: { shopId: reservation.shopId, userId: payload.userId } });
      isMember = !!m;
    }

    const isCustomer = reservation.customerId === payload.userId;

    if (['CONFIRMED', 'HELD', 'DECLINED', 'EXPIRED'].includes(newStatus)) {
      if (!isShopOwner && !isMember && !isAdmin) {
        return NextResponse.json(createErrorResponse('FORBIDDEN', 'Only shop can perform this', requestId, 403), { status: 403 });
      }
    }

    // Transaction: update status + inventory consequences
    const updated = await prisma.$transaction(async (tx) => {
      const updateData: any = { status: newStatus };
      if (newStatus === 'CONFIRMED') updateData.confirmedAt = new Date();
      if (newStatus === 'COLLECTED') {
        updateData.collectedAt = new Date();
        updateData.qrUsed = true;
      }

      const res = await tx.reservation.update({
        where: { id: params.id },
        data: updateData
      });

      await tx.reservationStatusHistory.create({
        data: {
          reservationId: params.id,
          fromStatus: reservation.status,
          toStatus: newStatus,
          actorId: payload.userId,
          reason: reason || null
        }
      });

      // Inventory consequences
      if (['DECLINED', 'EXPIRED'].includes(newStatus)) {
        // Release reserved
        for (const item of reservation.items) {
          const product = await tx.product.findUnique({ where: { id: item.productId } });
          if (product) {
            await tx.product.update({
              where: { id: item.productId },
              data: { reservedStock: { decrement: Math.min(item.quantity, product.reservedStock) } }
            });
            await tx.inventoryTransaction.create({
              data: {
                shopId: reservation.shopId,
                productId: item.productId,
                type: 'RELEASE',
                quantity: item.quantity,
                previousQty: product.stock,
                newQty: product.stock,
                reason: `Reservation ${reservation.reservationNumber} ${newStatus} - release`,
                actorId: payload.userId
              }
            });
          }
        }
      } else if (newStatus === 'COLLECTED') {
        // Finalize inventory: reduce stock, release reserved
        for (const item of reservation.items) {
          const product = await tx.product.findUnique({ where: { id: item.productId } });
          if (product) {
            const newStock = Math.max(0, product.stock - item.quantity);
            await tx.product.update({
              where: { id: item.productId },
              data: {
                stock: newStock,
                reservedStock: { decrement: Math.min(item.quantity, product.reservedStock) }
              }
            });
            await tx.inventoryTransaction.create({
              data: {
                shopId: reservation.shopId,
                productId: item.productId,
                type: 'ORDER_COMPLETED',
                quantity: item.quantity,
                previousQty: product.stock,
                newQty: newStock,
                reason: `Reservation ${reservation.reservationNumber} collected`,
                actorId: payload.userId
              }
            });
          }
        }
      }

      await tx.auditLog.create({
        data: {
          actorId: payload.userId,
          action: `RESERVATION_${newStatus}`,
          entity: 'Reservation',
          entityId: params.id,
          metadata: JSON.stringify({ from: reservation.status, to: newStatus, reason, requestId })
        }
      });

      return res;
    });

    return NextResponse.json({ success: true, reservation: updated, requestId });

  } catch (e: any) {
    return NextResponse.json(createErrorResponse('STATUS_UPDATE_FAILED', e.message, requestId, 500), { status: 500 });
  }
}
