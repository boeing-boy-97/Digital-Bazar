import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth/jwt';
import { generateRequestId, createErrorResponse, logStructured } from '@/lib/utils/requestId';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const id = params.id;
  
  const shop = await prisma.shop.findFirst({
    where: {
      OR: [{ id }, { slug: id }]
    },
    include: {
      storageZones: true,
      _count: { select: { products: true } }
    }
  });

  if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 });

  // Get categories with product counts
  const categories = await prisma.category.findMany({
    where: { shopId: shop.id },
    include: { _count: { select: { products: true } } }
  });

  const products = await prisma.product.findMany({
    where: { shopId: shop.id, isActive: true },
    include: { images: true, category: true, storageZone: true },
    take: 100,
    orderBy: { createdAt: 'desc' }
  });

  return NextResponse.json({ shop, categories, products });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
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
      if (!m || m.permission !== 'manager') {
        return NextResponse.json(createErrorResponse('FORBIDDEN', 'Only owner/manager can update', requestId, 403), { status: 403 });
      }
    }

    const body = await req.json();
    const allowedFields = ['name','description','category','address','city','pincode','phone','email','openingHours','closingHours','gstin','isPickupEnabled','isDeliveryEnabled','isReservationEnabled','preparationTimeMin','serviceRadiusKm','minOrderPaise','deliveryFeePaise','priceParityMode','reservationExpiryMin','status'];
    const data: any = {};
    for (const f of allowedFields) {
      if (body[f] !== undefined) data[f] = body[f];
    }

    // Status validation per point 12
    if (data.status && !['DRAFT','PENDING_REVIEW','CHANGES_REQUESTED','APPROVED','REJECTED','SUSPENDED','CLOSED','PAUSED'].includes(data.status)) {
      delete data.status;
    }

    const updated = await prisma.shop.update({
      where: { id: params.id },
      data
    });

    await prisma.auditLog.create({
      data: {
        actorId: payload.userId,
        action: 'SHOP_UPDATED',
        entity: 'Shop',
        entityId: params.id,
        metadata: JSON.stringify({ fields: Object.keys(data), requestId })
      }
    });

    return NextResponse.json({ success: true, shop: updated, requestId });
  } catch (e:any) {
    return NextResponse.json(createErrorResponse('UPDATE_FAILED', e.message, requestId, 500), { status: 500 });
  }
}
