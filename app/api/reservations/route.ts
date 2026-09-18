import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { cookies } from 'next/headers';
import { verifyToken, generateSecureQRToken } from '@/lib/auth/jwt';
import { generateRequestId, createErrorResponse, logStructured } from '@/lib/utils/requestId';
import { rateLimitMiddleware } from '@/lib/rate-limit/simple';
import { z } from 'zod';
import { successResponse, errorResponse } from '@/lib/api/response';

const reservationCreateSchema = z.object({
  shopId: z.string().min(1),
  items: z.array(z.object({
    productId: z.string().min(1),
    quantity: z.number().int().min(1)
  })).min(1),
  notes: z.string().max(500).optional(),
  idempotencyKey: z.string().optional()
});

export async function GET(req: NextRequest) {
  const requestId = generateRequestId();
  const cookieStore = cookies();
  const token = cookieStore.get('auth-token')?.value;
  if (!token) return NextResponse.json(createErrorResponse('UNAUTHORIZED', 'Auth required', requestId, 401), { status: 401 });
  const payload = verifyToken(token);
  if (!payload) return NextResponse.json(createErrorResponse('UNAUTHORIZED', 'Invalid session', requestId, 401), { status: 401 });

  const { searchParams } = new URL(req.url);
  const shopId = searchParams.get('shopId');
  const status = searchParams.get('status');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);

  let where: any = {};
  if (payload.role === 'customer') {
    where.customerId = payload.userId;
  } else if (payload.role === 'shop_owner' || payload.role === 'shop_employee') {
    const shops = await prisma.shop.findMany({
      where: { OR: [{ ownerId: payload.userId }, { members: { some: { userId: payload.userId } } }] },
      select: { id: true }
    });
    const shopIds = shops.map(s => s.id);
    if (shopId) {
      if (!shopIds.includes(shopId)) return NextResponse.json(createErrorResponse('FORBIDDEN', 'Shop access denied', requestId, 403), { status: 403 });
      where.shopId = shopId;
    } else {
      where.shopId = { in: shopIds };
    }
  } else if (['admin', 'super_admin'].includes(payload.role)) {
    if (shopId) where.shopId = shopId;
  }

  if (status) where.status = status;

  const [reservations, total] = await Promise.all([
    prisma.reservation.findMany({
      where,
      include: {
        items: true,
        shop: { select: { name: true, address: true, city: true } },
        customer: { select: { name: true, phone: true } }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    }),
    prisma.reservation.count({ where })
  ]);

  return NextResponse.json({ success: true, reservations, total, page, totalPages: Math.ceil(total / limit), requestId });
}

export async function POST(req: NextRequest) {
  const requestId = generateRequestId();
  try {
    const rateLimit = rateLimitMiddleware(req, 'checkout');
    if (!rateLimit.allowed) {
      return NextResponse.json(createErrorResponse('RATE_LIMITED', 'Too many reservation attempts', requestId, 429), { status: 429, headers: rateLimit.headers });
    }

    const cookieStore = cookies();
    const token = cookieStore.get('auth-token')?.value;
    if (!token) return NextResponse.json(createErrorResponse('UNAUTHORIZED', 'Auth required', requestId, 401), { status: 401 });
    const payload = verifyToken(token);
    if (!payload) return NextResponse.json(createErrorResponse('UNAUTHORIZED', 'Invalid session', requestId, 401), { status: 401 });

    const body = await req.json();
    const idempotencyKey = body.idempotencyKey || req.headers.get('x-idempotency-key');

    if (idempotencyKey) {
      const existing = await prisma.reservation.findUnique({ where: { idempotencyKey } });
      if (existing) {
        return NextResponse.json({ success: true, reservation: existing, message: 'Reservation already created (idempotent)', requestId, idempotent: true }, { headers: rateLimit.headers });
      }
    }

    const parsed = reservationCreateSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json(createErrorResponse('VALIDATION_FAILED', 'Invalid reservation', requestId, 400, parsed.error.errors), { status: 400 });

    const { shopId, items, notes } = parsed.data;

    // Check shop exists, approved, reservation enabled, not paused per point 58,59
    const shop = await prisma.shop.findUnique({ where: { id: shopId } });
    if (!shop) return NextResponse.json(createErrorResponse('SHOP_NOT_FOUND', 'Shop not found', requestId, 404), { status: 404 });
    if (shop.status !== 'APPROVED') return NextResponse.json(createErrorResponse('SHOP_NOT_APPROVED', `Shop not approved: ${shop.status}`, requestId, 400), { status: 400 });
    if ((shop as any).isReservationsPaused) return NextResponse.json(createErrorResponse('RESERVATIONS_PAUSED', 'Reservations paused', requestId, 400, { reason: (shop as any).pauseReason }), { status: 400 });
    if (!(shop as any).isReservationEnabled) return NextResponse.json(createErrorResponse('RESERVATIONS_DISABLED', 'Shop does not support reservations', requestId, 400), { status: 400 });

    // Validate products, stock, price per point 20,21 real inventory
    const productIds = items.map(i => i.productId);
    const products = await prisma.product.findMany({ where: { id: { in: productIds }, shopId, isActive: true, productStatus: 'ACTIVE' } });
    if (products.length !== productIds.length) return NextResponse.json(createErrorResponse('PRODUCT_NOT_FOUND', 'Some products not found or not in shop', requestId, 404), { status: 404 });

    let totalPaise = 0;
    const reservationItemsData: any[] = [];
    const errors: string[] = [];

    for (const reqItem of items) {
      const product = products.find(p => p.id === reqItem.productId)!;
      const available = product.stock - product.reservedStock;
      if (available < reqItem.quantity) {
        errors.push(`${product.name}: only ${available} available, requested ${reqItem.quantity}`);
        continue;
      }
      const unitPaise = product.pricePaise;
      const subtotal = unitPaise * reqItem.quantity;
      totalPaise += subtotal;
      reservationItemsData.push({
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        quantity: reqItem.quantity,
        unit: product.unit,
        unitPricePaise: unitPaise,
        subtotalPaise: subtotal
      });
    }

    if (errors.length > 0) return NextResponse.json(createErrorResponse('INSUFFICIENT_STOCK', 'Stock validation failed', requestId, 400, { errors }), { status: 400 });

    // Reservation expiry based on shop policy per point 44
    const expiryMin = (shop as any).reservationExpiryMin || 120; // 2 hours default
    const expiresAt = new Date(Date.now() + expiryMin * 60 * 1000);
    const reservationNumber = `RES-${new Date().getFullYear()}-${String(await prisma.reservation.count() + 1).padStart(6, '0')}`;
    const reservationCode = `R${Math.random().toString(36).slice(2, 8).toUpperCase()}-${reservationNumber.slice(-4)}`;
    const { token: qrToken, expiry: qrExpiry } = generateSecureQRToken(reservationNumber, shopId);

    // Transaction: reserve inventory + create reservation
    const reservation = await prisma.$transaction(async (tx) => {
      // Reserve inventory
      for (const item of items) {
        const product = products.find(p => p.id === item.productId)!;
        await tx.product.update({
          where: { id: item.productId },
          data: { reservedStock: { increment: item.quantity } }
        });
        await tx.inventoryTransaction.create({
          data: {
            shopId,
            productId: item.productId,
            type: 'RESERVE',
            quantity: item.quantity,
            previousQty: product.stock,
            newQty: product.stock,
            reason: `Reserve for reservation ${reservationNumber}`,
            actorId: payload.userId
          }
        });
      }

      const res = await tx.reservation.create({
        data: {
          reservationNumber,
          customerId: payload.userId,
          shopId,
          status: 'PENDING',
          reservedAt: new Date(),
          expiresAt,
          reservationCode,
          qrToken,
          qrExpiry,
          notes: notes || null,
          idempotencyKey: idempotencyKey || null,
          items: { create: reservationItemsData },
          statusHistory: {
            create: {
              fromStatus: null,
              toStatus: 'PENDING',
              actorId: payload.userId,
              reason: 'Reservation created'
            }
          }
        },
        include: { items: true, shop: true }
      });

      // Update shop lastInventoryUpdate for stock confidence per point 23
      await tx.shop.update({
        where: { id: shopId },
        data: { lastInventoryUpdate: new Date() }
      });

      return res;
    });

    await prisma.auditLog.create({
      data: {
        actorId: payload.userId,
        action: 'RESERVATION_CREATED',
        entity: 'Reservation',
        entityId: reservation.id,
        metadata: JSON.stringify({ reservationNumber, shopId, totalPaise, expiresAt, requestId })
      }
    });

    logStructured({
      requestId,
      timestamp: new Date().toISOString(),
      level: 'info',
      message: 'Reservation created',
      route: '/api/reservations',
      userId: payload.userId,
      shopId,
      metadata: { reservationNumber, expiresAt }
    });

    return NextResponse.json({
      success: true,
      reservation,
      message: `Reserved until ${expiresAt.toLocaleTimeString()} - show code ${reservationCode} at ${shop.name} counter`,
      requestId,
      reservedUntil: expiresAt
    }, { status: 201, headers: rateLimit.headers });

  } catch (e: any) {
    logStructured({
      requestId,
      timestamp: new Date().toISOString(),
      level: 'error',
      message: 'Reservation creation failed',
      route: '/api/reservations',
      error: e.message
    });
    return NextResponse.json(createErrorResponse('RESERVATION_FAILED', e.message, requestId, 500), { status: 500 });
  }
}
