import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth/jwt';
import { generateRequestId, createErrorResponse, logStructured } from '@/lib/utils/requestId';
import { z } from 'zod';

const visibilitySchema = z.object({
  productStatus: z.enum(['ACTIVE', 'DRAFT', 'ARCHIVED']).optional(),
  isActive: z.boolean().optional(),
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

    const product = await prisma.product.findUnique({ where: { id: params.id }, include: { shop: true } });
    if (!product) return NextResponse.json(createErrorResponse('NOT_FOUND', 'Product not found', requestId, 404), { status: 404 });

    const isOwner = product.shop.ownerId === payload.userId;
    const isAdmin = ['admin', 'super_admin'].includes(payload.role);
    let isMember = false;
    if (!isOwner && !isAdmin) {
      const m = await prisma.shopMember.findFirst({ where: { shopId: product.shopId, userId: payload.userId } });
      if (!m || !['manager', 'inventory_manager'].includes(m.permission)) {
        return NextResponse.json(createErrorResponse('FORBIDDEN', 'Need manager/inventory_manager permission', requestId, 403), { status: 403 });
      }
      isMember = true;
    }

    const body = await req.json();
    const parsed = visibilitySchema.safeParse(body);
    if (!parsed.success) return NextResponse.json(createErrorResponse('VALIDATION_FAILED', 'Invalid visibility', requestId, 400, parsed.error.errors), { status: 400 });

    const { productStatus, isActive, reason } = parsed.data;

    const updateData: any = {};
    if (productStatus) updateData.productStatus = productStatus;
    if (typeof isActive === 'boolean') {
      updateData.isActive = isActive;
      // Sync productStatus with isActive for compat per point 56 digital shelf Visible/Hidden/Out of stock/Temporarily unavailable
      if (!productStatus) {
        updateData.productStatus = isActive ? 'ACTIVE' : 'DRAFT';
      }
    }

    const updated = await prisma.product.update({
      where: { id: params.id },
      data: updateData
    });

    await prisma.auditLog.create({
      data: {
        actorId: payload.userId,
        action: 'PRODUCT_VISIBILITY_TOGGLE',
        entity: 'Product',
        entityId: params.id,
        metadata: JSON.stringify({ from: { productStatus: product.productStatus, isActive: product.isActive }, to: updateData, reason, requestId })
      }
    });

    logStructured({
      requestId,
      timestamp: new Date().toISOString(),
      level: 'info',
      message: 'Product visibility toggled - digital shelf per point 56',
      route: `/api/products/${params.id}/visibility`,
      metadata: { productId: params.id, ...updateData, reason }
    });

    return NextResponse.json({ success: true, product: updated, requestId, message: 'Digital shelf updated - controls what customer can see per point 56,57' });

  } catch (e: any) {
    return NextResponse.json(createErrorResponse('VISIBILITY_FAILED', e.message, requestId, 500), { status: 500 });
  }
}
