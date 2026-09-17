import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth/jwt';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const cookieStore = cookies();
  const token = cookieStore.get('auth-token')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const payload = verifyToken(token);
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: {
      items: {
        include: {
          product: {
            include: { storageZone: true, category: true }
          }
        }
      },
      shop: true,
      customer: { select: { name: true, phone: true, email: true } },
      statusHistory: { orderBy: { createdAt: 'asc' } },
      invoice: true,
      payments: true
    }
  });

  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

  // Authorization check
  const isCustomer = order.customerId === payload.userId;
  const isShopOwner = order.shop.ownerId === payload.userId;
  const isAdmin = ['admin','super_admin'].includes(payload.role);
  
  let isShopMember = false;
  if (!isShopOwner && !isAdmin) {
    const member = await prisma.shopMember.findFirst({
      where: { shopId: order.shopId, userId: payload.userId }
    });
    isShopMember = !!member;
  }

  if (!isCustomer && !isShopOwner && !isShopMember && !isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // For shopkeeper, sort items by zone - CORE FEATURE
  const sortedByZone: Record<string, any[]> = {};
  for (const item of order.items) {
    const zone = item.storageZone || item.product?.storageZone?.name || 'Unassigned Zone';
    if (!sortedByZone[zone]) sortedByZone[zone] = [];
    sortedByZone[zone].push(item);
  }

  // Sort zones by sortOrder if available
  const zones = await prisma.storageZone.findMany({
    where: { shopId: order.shopId },
    orderBy: { sortOrder: 'asc' }
  });

  const zoneOrder = zones.reduce((acc, z, idx) => ({ ...acc, [z.name]: idx }), {} as Record<string, number>);
  
  const sortedZoneKeys = Object.keys(sortedByZone).sort((a,b) => {
    const aOrder = zoneOrder[a] ?? 999;
    const bOrder = zoneOrder[b] ?? 999;
    if (aOrder !== bOrder) return aOrder - bOrder;
    return a.localeCompare(b);
  });

  const sortedItemsByZone: Record<string, any[]> = {};
  for (const key of sortedZoneKeys) {
    sortedItemsByZone[key] = sortedByZone[key].sort((x,y) => x.productName.localeCompare(y.productName));
  }

  return NextResponse.json({ order, sortedByZone: sortedItemsByZone });
}
