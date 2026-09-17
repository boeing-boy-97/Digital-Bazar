import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth/jwt';

export async function GET(req: NextRequest) {
  const cookieStore = cookies();
  const token = cookieStore.get('auth-token')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const payload = verifyToken(token);
  if (!payload || !['admin','super_admin'].includes(payload.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');

  const where: any = {};
  if (status) where.status = status;

  const shops = await prisma.shop.findMany({
    where,
    include: {
      owner: { select: { name: true, phone: true, email: true } },
      _count: { select: { products: true, orders: true } }
    },
    orderBy: { createdAt: 'desc' }
  });

  return NextResponse.json({ shops });
}

export async function POST(req: NextRequest) {
  const cookieStore = cookies();
  const token = cookieStore.get('auth-token')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const payload = verifyToken(token);
  if (!payload || !['admin','super_admin'].includes(payload.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { shopId, action, reason } = await req.json();
  
  if (!shopId || !action) return NextResponse.json({ error: 'shopId and action required' }, { status: 400 });

  const validActions: Record<string, any> = {
    approve: 'APPROVED',
    reject: 'REJECTED',
    suspend: 'SUSPENDED',
    activate: 'APPROVED'
  };

  const newStatus = validActions[action];
  if (!newStatus) return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  const shop = await prisma.shop.update({
    where: { id: shopId },
    data: { status: newStatus }
  });

  await prisma.auditLog.create({
    data: {
      actorId: payload.userId,
      action: `SHOP_${action.toUpperCase()}`,
      entity: 'Shop',
      entityId: shopId,
      metadata: JSON.stringify({ reason, previousStatus: shop.status })
    }
  });

  return NextResponse.json({ shop, message: `Shop ${action}d` });
}
