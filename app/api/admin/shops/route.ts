import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth/jwt';

export async function GET(req: NextRequest) {
  try {
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

    let shops: any[] = [];
    try {
      shops = await prisma.shop.findMany({
        where,
        include: {
          owner: { select: { name: true, phone: true, email: true } },
          _count: { select: { products: true, orders: true } }
        },
        orderBy: { createdAt: 'desc' }
      });
    } catch (dbErr: any) {
      console.error('[admin shops GET] DB error:', dbErr?.message);
      return NextResponse.json({ shops: [], error: 'Unable to load shops temporarily' });
    }

    return NextResponse.json({ shops });
  } catch (e: any) {
    console.error('[admin shops GET] Unhandled:', e?.message);
    return NextResponse.json({ shops: [], error: 'Unable to load shops temporarily' });
  }
}

export async function POST(req: NextRequest) {
  try {
  const cookieStore = cookies();
  const token = cookieStore.get('auth-token')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const payload = verifyToken(token);
  if (!payload || !['admin','super_admin'].includes(payload.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { shopId, action, reason } = await req.json();
  
  if (!shopId || !action) return NextResponse.json({ error: 'shopId and action required' }, { status: 400 });

  const validActions: Record<string, string> = {
    approve: 'APPROVED',
    reject: 'REJECTED',
    request_changes: 'REQUESTED_CHANGES',
    suspend: 'SUSPENDED',
    activate: 'APPROVED',
    pause: 'PAUSED'
  };

  const newStatus = validActions[action];
  if (!newStatus) return NextResponse.json({ error: 'Invalid action. Valid: approve, reject, request_changes, suspend, activate, pause' }, { status: 400 });

  // For reject and request_changes, reason is required
  if ((action === 'reject' || action === 'request_changes') && !reason) {
    return NextResponse.json({ error: 'Reason required for rejection or request changes' }, { status: 400 });
  }

  const existingShop = await prisma.shop.findUnique({ where: { id: shopId } });
  if (!existingShop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 });

  const shop = await prisma.shop.update({
    where: { id: shopId },
    data: { 
      status: newStatus,
      rejectionReason: (action === 'reject' || action === 'request_changes') ? reason : null
    }
  });

  // Create notification for shop owner
  const notificationMessages: Record<string, { title: string; message: string; type: string }> = {
    APPROVED: {
      title: 'Shop approved!',
      message: `Congratulations! Your shop "${shop.name}" has been approved and is now live. Customers can discover and order from your shop.`,
      type: 'shop_approved'
    },
    REJECTED: {
      title: 'Shop application rejected',
      message: `Your shop "${shop.name}" application was rejected. Reason: ${reason}. Please address the issues and resubmit.`,
      type: 'shop_rejected'
    },
    REQUESTED_CHANGES: {
      title: 'Changes requested for your shop',
      message: `Admin requested changes for "${shop.name}": ${reason}. Please update your shop details and resubmit.`,
      type: 'shop_changes_requested'
    },
    SUSPENDED: {
      title: 'Shop suspended',
      message: `Your shop "${shop.name}" has been suspended. Reason: ${reason || 'Policy violation'}. Contact support.`,
      type: 'shop_suspended'
    }
  };

  const notifConfig = notificationMessages[newStatus];
  if (notifConfig) {
    await prisma.notification.create({
      data: {
        userId: shop.ownerId,
        type: notifConfig.type,
        title: notifConfig.title,
        message: notifConfig.message,
        channel: 'in_app'
      }
    });
  }

  await prisma.auditLog.create({
    data: {
      actorId: payload.userId,
      action: `SHOP_${action.toUpperCase()}`,
      entity: 'Shop',
      entityId: shopId,
      metadata: JSON.stringify({ reason, previousStatus: existingShop.status, newStatus })
    }
  });

  return NextResponse.json({ shop, message: `Shop ${action}d successfully` });

  } catch (e: any) {
    console.error('[admin shops POST] Error:', e?.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
