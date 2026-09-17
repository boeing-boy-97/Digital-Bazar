import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth/jwt';
import { generateRequestId, createErrorResponse, logStructured } from '@/lib/utils/requestId';

export async function PUT(req: NextRequest, { params }: { params: { id: string, zoneId: string } }) {
  const requestId = generateRequestId();
  const cookieStore = cookies();
  const token = cookieStore.get('auth-token')?.value;
  if (!token) return NextResponse.json(createErrorResponse('UNAUTHORIZED','Auth required',requestId,401),{status:401});
  const payload = verifyToken(token);
  if (!payload) return NextResponse.json(createErrorResponse('UNAUTHORIZED','Invalid',requestId,401),{status:401});

  const shop = await prisma.shop.findUnique({ where: { id: params.id } });
  if (!shop) return NextResponse.json(createErrorResponse('SHOP_NOT_FOUND','Shop not found',requestId,404),{status:404});

  const isOwner = shop.ownerId === payload.userId;
  const isAdmin = ['admin','super_admin'].includes(payload.role);
  if (!isOwner && !isAdmin) {
    const member = await prisma.shopMember.findFirst({ where: { shopId: params.id, userId: payload.userId } });
    if (!member || !member.permission.includes('product_manage')) {
      return NextResponse.json(createErrorResponse('FORBIDDEN','No permission',requestId,403),{status:403});
    }
  }

  const zone = await prisma.storageZone.findFirst({ where: { id: params.zoneId, shopId: params.id } });
  if (!zone) return NextResponse.json(createErrorResponse('ZONE_NOT_FOUND','Zone not found',requestId,404),{status:404});

  const body = await req.json();
  const { name, description, sortOrder, code } = body;

  if (name && name.trim() !== zone.name) {
    const dup = await prisma.storageZone.findFirst({ where: { shopId: params.id, name: name.trim(), id: { not: params.zoneId } } });
    if (dup) return NextResponse.json(createErrorResponse('DUPLICATE','Zone name exists',requestId,400),{status:400});
  }

  if (code && code !== zone.code) {
    const dupCode = await prisma.storageZone.findFirst({ where: { shopId: params.id, code, id: { not: params.zoneId } } });
    if (dupCode) return NextResponse.json(createErrorResponse('DUPLICATE','Zone code exists',requestId,400),{status:400});
  }

  const updated = await prisma.storageZone.update({
    where: { id: params.zoneId },
    data: {
      name: name?.trim() || zone.name,
      description: description !== undefined ? description : zone.description,
      sortOrder: sortOrder !== undefined ? sortOrder : zone.sortOrder,
      code: code || zone.code
    }
  });

  await prisma.auditLog.create({
    data: { actorId: payload.userId, action: 'ZONE_UPDATED', entity: 'StorageZone', entityId: zone.id, metadata: JSON.stringify({ requestId }) }
  });

  return NextResponse.json({ success: true, zone: updated, requestId });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string, zoneId: string } }) {
  const requestId = generateRequestId();
  const cookieStore = cookies();
  const token = cookieStore.get('auth-token')?.value;
  if (!token) return NextResponse.json(createErrorResponse('UNAUTHORIZED','Auth required',requestId,401),{status:401});
  const payload = verifyToken(token);
  if (!payload) return NextResponse.json(createErrorResponse('UNAUTHORIZED','Invalid',requestId,401),{status:401});

  const shop = await prisma.shop.findUnique({ where: { id: params.id } });
  if (!shop) return NextResponse.json(createErrorResponse('SHOP_NOT_FOUND','Shop not found',requestId,404),{status:404});

  const isOwner = shop.ownerId === payload.userId;
  const isAdmin = ['admin','super_admin'].includes(payload.role);
  if (!isOwner && !isAdmin) {
    return NextResponse.json(createErrorResponse('FORBIDDEN','Only owner can delete zones',requestId,403),{status:403});
  }

  const zone = await prisma.storageZone.findFirst({ where: { id: params.zoneId, shopId: params.id }, include: { _count: { select: { products: true } } } });
  if (!zone) return NextResponse.json(createErrorResponse('ZONE_NOT_FOUND','Zone not found',requestId,404),{status:404});

  if (zone._count.products > 0) {
    return NextResponse.json(createErrorResponse('ZONE_HAS_PRODUCTS',`Cannot delete zone with ${zone._count.products} products. Move products first.`,requestId,400),{status:400});
  }

  await prisma.storageZone.delete({ where: { id: params.zoneId } });

  await prisma.auditLog.create({
    data: { actorId: payload.userId, action: 'ZONE_DELETED', entity: 'StorageZone', entityId: params.zoneId, metadata: JSON.stringify({ shopId: params.id, name: zone.name, requestId }) }
  });

  return NextResponse.json({ success: true, message: 'Zone deleted', requestId });
}
