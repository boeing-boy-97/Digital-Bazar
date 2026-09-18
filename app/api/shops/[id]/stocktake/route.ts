import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth/jwt';
import { generateRequestId, createErrorResponse, logStructured } from '@/lib/utils/requestId';
import { z } from 'zod';

const stocktakeSchema = z.object({
  productId: z.string().min(1),
  countedQty: z.number().int().min(0),
  reason: z.string().max(500).optional()
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const requestId = generateRequestId();
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('auth-token')?.value;
    if (!token) return NextResponse.json(createErrorResponse('UNAUTHORIZED', 'Auth required', requestId, 401), { status: 401 });
    const payload = verifyToken(token);
    if (!payload) return NextResponse.json(createErrorResponse('UNAUTHORIZED', 'Invalid session', requestId, 401), { status: 401 });

    // Verify shop access
    const shop = await prisma.shop.findUnique({ where: { id: params.id } });
    if (!shop) return NextResponse.json(createErrorResponse('SHOP_NOT_FOUND', 'Shop not found', requestId, 404), { status: 404 });

    const isOwner = shop.ownerId === payload.userId;
    const isAdmin = ['admin', 'super_admin'].includes(payload.role);
    let isMember = false;
    if (!isOwner && !isAdmin) {
      const m = await prisma.shopMember.findFirst({ where: { shopId: params.id, userId: payload.userId } });
      isMember = !!m;
      if (!m || !['manager', 'inventory_manager'].includes(m.permission)) {
        return NextResponse.json(createErrorResponse('FORBIDDEN', 'Need inventory_manager or manager permission', requestId, 403), { status: 403 });
      }
    }

    const body = await req.json();
    const parsed = stocktakeSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json(createErrorResponse('VALIDATION_FAILED', 'Invalid stocktake', requestId, 400, parsed.error.errors), { status: 400 });

    const { productId, countedQty, reason } = parsed.data;

    const product = await prisma.product.findFirst({ where: { id: productId, shopId: params.id } });
    if (!product) return NextResponse.json(createErrorResponse('PRODUCT_NOT_FOUND', 'Product not in shop', requestId, 404), { status: 404 });

    const expectedQty = product.stock;
    const difference = countedQty - expectedQty;

    const result = await prisma.$transaction(async (tx) => {
      const stocktake = await tx.stocktake.create({
        data: {
          shopId: params.id,
          productId,
          expectedQty,
          countedQty,
          difference,
          reason: reason || null,
          actorId: payload.userId
        }
      });

      if (difference !== 0) {
        // Adjust stock with reason - real physical count
        await tx.product.update({
          where: { id: productId },
          data: { stock: countedQty }
        });

        await tx.inventoryTransaction.create({
          data: {
            shopId: params.id,
            productId,
            type: 'ADJUST',
            quantity: Math.abs(difference),
            previousQty: expectedQty,
            newQty: countedQty,
            reason: reason ? `Stocktake: ${reason} (diff ${difference})` : `Stocktake adjustment diff ${difference}`,
            actorId: payload.userId
          }
        });

        await tx.shop.update({
          where: { id: params.id },
          data: { lastInventoryUpdate: new Date() }
        });
      }

      await tx.auditLog.create({
        data: {
          actorId: payload.userId,
          action: 'STOCKTAKE',
          entity: 'Product',
          entityId: productId,
          metadata: JSON.stringify({ expectedQty, countedQty, difference, reason, requestId })
        }
      });

      return stocktake;
    });

    logStructured({
      requestId,
      timestamp: new Date().toISOString(),
      level: 'info',
      message: 'Stocktake recorded',
      route: `/api/shops/${params.id}/stocktake`,
      metadata: { productId, expectedQty, countedQty, difference }
    });

    return NextResponse.json({ success: true, stocktake: result, requestId, message: difference === 0 ? 'Stock verified correct' : `Adjusted stock by ${difference} - reason required` });

  } catch (e: any) {
    return NextResponse.json(createErrorResponse('STOCKTAKE_FAILED', e.message, requestId, 500), { status: 500 });
  }
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
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
    if (!isOwner && !isAdmin) {
      const m = await prisma.shopMember.findFirst({ where: { shopId: params.id, userId: payload.userId } });
      if (!m) return NextResponse.json(createErrorResponse('FORBIDDEN', 'Not member', requestId, 403), { status: 403 });
    }

    const stocktakes = await prisma.stocktake.findMany({
      where: { shopId: params.id },
      include: { product: { select: { name: true, sku: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    return NextResponse.json({ success: true, stocktakes, requestId });

  } catch (e: any) {
    return NextResponse.json(createErrorResponse('FETCH_FAILED', e.message, requestId, 500), { status: 500 });
  }
}
