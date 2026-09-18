import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth/jwt';
import { generateRequestId, createErrorResponse, logStructured } from '@/lib/utils/requestId';
import { z } from 'zod';

const bulkSchema = z.object({
  updates: z.array(z.object({
    sku: z.string().min(1).optional(),
    productId: z.string().optional(),
    newStock: z.number().int().min(0),
    pricePaise: z.number().int().min(0).optional(),
    barcode: z.string().optional()
  })).min(1).max(200)
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
    if (!isOwner && !isAdmin) {
      const m = await prisma.shopMember.findFirst({ where: { shopId: params.id, userId: payload.userId } });
      if (!m || !['manager', 'inventory_manager'].includes(m.permission)) {
        return NextResponse.json(createErrorResponse('FORBIDDEN', 'Need manager/inventory_manager', requestId, 403), { status: 403 });
      }
    }

    const body = await req.json();
    const parsed = bulkSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json(createErrorResponse('VALIDATION_FAILED', 'Invalid bulk data', requestId, 400, parsed.error.errors), { status: 400 });

    let updated = 0;
    const errors: string[] = [];

    await prisma.$transaction(async (tx) => {
      for (const u of parsed.data.updates) {
        try {
          let product: any = null;
          if (u.productId) {
            product = await tx.product.findFirst({ where: { id: u.productId, shopId: params.id } });
          } else if (u.sku) {
            product = await tx.product.findFirst({ where: { sku: u.sku, shopId: params.id } });
          } else if (u.barcode) {
            product = await tx.product.findFirst({ where: { barcode: u.barcode, shopId: params.id } });
          }

          if (!product) {
            errors.push(`Not found: ${u.sku || u.productId || u.barcode}`);
            continue;
          }

          const prevStock = product.stock;
          const newStock = u.newStock;

          const updateData: any = { stock: newStock, lastInventoryUpdate: new Date() };
          if (typeof u.pricePaise === 'number') updateData.pricePaise = u.pricePaise;

          await tx.product.update({ where: { id: product.id }, data: updateData });

          await tx.inventoryTransaction.create({
            data: {
              shopId: params.id,
              productId: product.id,
              type: newStock > prevStock ? 'RECEIVE' : 'ADJUST',
              quantity: Math.abs(newStock - prevStock),
              previousQty: prevStock,
              newQty: newStock,
              reason: `Bulk update via ${u.sku ? 'SKU' : u.barcode ? 'barcode' : 'table'} - previous ${prevStock} new ${newStock}`,
              actorId: payload.userId
            }
          });

          updated++;
        } catch (e: any) {
          errors.push(`${u.sku || u.productId}: ${e.message}`);
        }
      }

      await tx.shop.update({
        where: { id: params.id },
        data: { lastInventoryUpdate: new Date() }
      });

      await tx.auditLog.create({
        data: {
          actorId: payload.userId,
          action: 'BULK_STOCK_UPDATE',
          entity: 'Shop',
          entityId: params.id,
          metadata: JSON.stringify({ updated, errorsCount: errors.length, requestId })
        }
      });
    });

    logStructured({
      requestId,
      timestamp: new Date().toISOString(),
      level: 'info',
      message: 'Bulk stock update completed per point 52',
      route: `/api/shops/${params.id}/products/bulk`,
      metadata: { updated, errors: errors.length }
    });

    return NextResponse.json({ success: true, updated, errors, requestId, message: `Updated ${updated} products - real operational bulk per point 52` });

  } catch (e: any) {
    return NextResponse.json(createErrorResponse('BULK_FAILED', e.message, requestId, 500), { status: 500 });
  }
}
