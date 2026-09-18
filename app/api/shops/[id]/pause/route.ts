import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth/jwt';
import { generateRequestId, createErrorResponse, logStructured } from '@/lib/utils/requestId';
import { z } from 'zod';

const pauseSchema = z.object({
  isOnlineOrdersPaused: z.boolean().optional(),
  isReservationsPaused: z.boolean().optional(),
  isPickupPaused: z.boolean().optional(),
  isDeliveryPaused: z.boolean().optional(),
  pauseReason: z.string().max(500).optional()
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const requestId = generateRequestId();
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('auth-token')?.value;
    if (!token) return NextResponse.json(createErrorResponse('UNAUTHORIZED', 'Auth required', requestId, 401), { status: 401 });
    const payload = verifyToken(token);
    if (!payload) return NextResponse.json(createErrorResponse('UNAUTHORIZED', 'Invalid session', requestId, 401), { status: 401 });

    const shop = await prisma.shop.findUnique({ where: { id: params.id } });
    if (!shop) return NextResponse.json(createErrorResponse('SHOP_NOT_FOUND', 'Shop not found', requestId, 404), { status: 404 });

    const isOwner = shop.ownerId === payload.userId;
    const isAdmin = ['admin', 'super_admin'].includes(payload.role);
    let isManager = false;
    if (!isOwner && !isAdmin) {
      const m = await prisma.shopMember.findFirst({ where: { shopId: params.id, userId: payload.userId } });
      if (!m || m.permission !== 'manager') {
        return NextResponse.json(createErrorResponse('FORBIDDEN', 'Only owner/manager can pause', requestId, 403), { status: 403 });
      }
      isManager = true;
    }

    const body = await req.json();
    const parsed = pauseSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json(createErrorResponse('VALIDATION_FAILED', 'Invalid pause data', requestId, 400, parsed.error.errors), { status: 400 });

    const data = parsed.data;

    const updated = await prisma.shop.update({
      where: { id: params.id },
      data: {
        isOnlineOrdersPaused: data.isOnlineOrdersPaused ?? (shop as any).isOnlineOrdersPaused,
        isReservationsPaused: data.isReservationsPaused ?? (shop as any).isReservationsPaused,
        isPickupPaused: data.isPickupPaused ?? (shop as any).isPickupPaused,
        isDeliveryPaused: data.isDeliveryPaused ?? (shop as any).isDeliveryPaused,
        pauseReason: data.pauseReason ?? (shop as any).pauseReason
      }
    });

    await prisma.auditLog.create({
      data: {
        actorId: payload.userId,
        action: 'SHOP_PAUSE_TOGGLE',
        entity: 'Shop',
        entityId: params.id,
        metadata: JSON.stringify({ ...data, requestId, previous: { isOnlineOrdersPaused: (shop as any).isOnlineOrdersPaused, isReservationsPaused: (shop as any).isReservationsPaused } })
      }
    });

    logStructured({
      requestId,
      timestamp: new Date().toISOString(),
      level: 'info',
      message: 'Shop pause toggled',
      route: `/api/shops/${params.id}/pause`,
      metadata: data
    });

    return NextResponse.json({ success: true, shop: updated, requestId, message: 'Shop pause updated - physical shop remains open, digital availability changed per point 58,59' });

  } catch (e: any) {
    return NextResponse.json(createErrorResponse('PAUSE_FAILED', e.message, requestId, 500), { status: 500 });
  }
}
