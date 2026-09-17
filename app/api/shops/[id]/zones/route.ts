import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth/jwt';
import { generateRequestId, createErrorResponse, logStructured } from '@/lib/utils/requestId';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
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
  let isMember = false;
  if (!isOwner && !isAdmin) {
    const m = await prisma.shopMember.findFirst({ where: { shopId: params.id, userId: payload.userId } });
    isMember = !!m;
  }
  if (!isOwner && !isMember && !isAdmin) {
    return NextResponse.json(createErrorResponse('FORBIDDEN','Cross-shop access denied',requestId,403),{status:403});
  }

  const zones = await prisma.storageZone.findMany({
    where: { shopId: params.id },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    include: { _count: { select: { products: true } } }
  });

  return NextResponse.json({ zones, requestId });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
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
      return NextResponse.json(createErrorResponse('FORBIDDEN','No permission to manage zones',requestId,403),{status:403});
    }
  }

  const body = await req.json();
  const { name, description, sortOrder, code } = body;

  if (!name || name.trim().length < 1) {
    return NextResponse.json(createErrorResponse('VALIDATION_FAILED','Zone name required',requestId,400),{status:400});
  }

  const existing = await prisma.storageZone.findFirst({ where: { shopId: params.id, name: name.trim() } });
  if (existing) {
    return NextResponse.json(createErrorResponse('DUPLICATE','Zone name already exists in this shop',requestId,400),{status:400});
  }

  const zoneCode = code || name.trim().toUpperCase().replace(/\s+/g, '_').slice(0,10) + '_' + Date.now().toString().slice(-4);
  
  // Check duplicate code
  const existingCode = await prisma.storageZone.findFirst({ where: { shopId: params.id, code: zoneCode } });
  if (existingCode) {
    return NextResponse.json(createErrorResponse('DUPLICATE','Zone code already exists',requestId,400),{status:400});
  }

  const zone = await prisma.storageZone.create({
    data: {
      shopId: params.id,
      name: name.trim(),
      description: description || null,
      sortOrder: sortOrder || 0,
      code: zoneCode
    }
  });

  await prisma.auditLog.create({
    data: {
      actorId: payload.userId,
      action: 'ZONE_CREATED',
      entity: 'StorageZone',
      entityId: zone.id,
      metadata: JSON.stringify({ shopId: params.id, name: zone.name, requestId })
    }
  });

  logStructured({
    requestId,
    timestamp: new Date().toISOString(),
    level: 'info',
    message: 'Storage zone created',
    route: `/api/shops/${params.id}/zones`,
    userId: payload.userId,
    shopId: params.id
  });

  return NextResponse.json({ success: true, zone, requestId }, { status: 201 });
}
