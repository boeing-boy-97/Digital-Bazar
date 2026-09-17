import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth/jwt';
import { generateRequestId, createErrorResponse, logStructured } from '@/lib/utils/requestId';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const requestId = generateRequestId();
  
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json(createErrorResponse('UNAUTHORIZED', 'Authentication required', requestId, 401), { status: 401 });
    }
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json(createErrorResponse('UNAUTHORIZED', 'Invalid session', requestId, 401), { status: 401 });
    }

    const { qrToken, orderNumber } = await req.json();

    if (!qrToken || !orderNumber) {
      return NextResponse.json(createErrorResponse('MISSING_QR_DATA', 'QR token and order number required', requestId, 400), { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: { shop: true, customer: true, items: true, statusHistory: { orderBy: { createdAt: 'desc' }, take: 5 } }
    });

    if (!order) {
      return NextResponse.json(createErrorResponse('ORDER_NOT_FOUND', 'Order not found', requestId, 404), { status: 404 });
    }

    // Authorization: shop staff only - tenant isolation
    const isShopOwner = order.shop.ownerId === payload.userId;
    const isAdmin = ['admin','super_admin'].includes(payload.role);
    let isMember = false;
    if (!isShopOwner && !isAdmin) {
      const m = await prisma.shopMember.findFirst({ where: { shopId: order.shopId, userId: payload.userId } });
      isMember = !!m;
    }
    if (!isShopOwner && !isMember && !isAdmin) {
      logStructured({
        requestId,
        timestamp: new Date().toISOString(),
        level: 'warn',
        message: 'QR verification forbidden - cross-shop access attempt',
        route: `/api/orders/${params.id}/verify`,
        userId: payload.userId,
        shopId: order.shopId,
        orderId: order.id,
        metadata: { attemptedShop: order.shopId, userRole: payload.role }
      });
      return NextResponse.json(createErrorResponse('FORBIDDEN', 'Forbidden - cross-shop access denied', requestId, 403), { status: 403 });
    }

    // Check if already completed - prevent duplicate completion / QR reuse
    if (order.status === 'COMPLETED') {
      logStructured({
        requestId,
        timestamp: new Date().toISOString(),
        level: 'info',
        message: 'QR already redeemed - order completed',
        route: `/api/orders/${params.id}/verify`,
        orderId: order.id,
        metadata: { qrToken: qrToken.slice(0,8)+'...' }
      });
      return NextResponse.json(createErrorResponse('ALREADY_COMPLETED', 'This order has already been completed - QR already redeemed', requestId, 400), { status: 400 });
    }

    if (order.status === 'CANCELLED' || order.status === 'REJECTED') {
      return NextResponse.json(createErrorResponse('ORDER_CANCELLED', `Order is ${order.status}, cannot pickup`, requestId, 400), { status: 400 });
    }

    // Validate QR token exists and valid - single-use, expiry per point 37
    if (order.qrToken !== qrToken) {
      logStructured({
        requestId,
        timestamp: new Date().toISOString(),
        level: 'warn',
        message: 'Invalid QR token',
        route: `/api/orders/${params.id}/verify`,
        orderId: order.id,
        metadata: { providedToken: qrToken.slice(0,8)+'...', expected: order.qrToken.slice(0,8)+'...' }
      });
      return NextResponse.json(createErrorResponse('INVALID_QR_TOKEN', 'Invalid QR token', requestId, 400), { status: 400 });
    }

    // Check expiry - 15 min per spec
    if ((order as any).qrExpiry && new Date() > new Date((order as any).qrExpiry)) {
      return NextResponse.json(createErrorResponse('QR_EXPIRED', 'QR token expired - please regenerate', requestId, 400, { expiredAt: (order as any).qrExpiry }), { status: 400 });
    }

    // Check single-use - second scan fail per point 37
    if ((order as any).qrUsed) {
      return NextResponse.json(createErrorResponse('QR_ALREADY_USED', 'QR token already used - order already verified', requestId, 400), { status: 400 });
    }

    // Validate order number matches - prevents wrong order scan
    if (order.orderNumber !== orderNumber) {
      return NextResponse.json(createErrorResponse('ORDER_NUMBER_MISMATCH', 'Order number mismatch', requestId, 400), { status: 400 });
    }

    // Validate current status is READY_FOR_PICKUP or OUT_FOR_DELIVERY - not arbitrary per point 31
    if (order.status !== 'READY_FOR_PICKUP' && order.status !== 'OUT_FOR_DELIVERY') {
      return NextResponse.json(
        createErrorResponse('NOT_READY', `Order not ready for pickup. Current status: ${order.status}`, requestId, 400, { currentStatus: order.status }),
        { status: 400 }
      );
    }

    // Audit log for verification
    await prisma.auditLog.create({
      data: {
        actorId: payload.userId,
        action: 'QR_VERIFIED',
        entity: 'Order',
        entityId: order.id,
        metadata: JSON.stringify({ orderNumber, shopId: order.shopId, requestId, verifiedAt: new Date().toISOString() })
      }
    });

    logStructured({
      requestId,
      timestamp: new Date().toISOString(),
      level: 'info',
      message: 'QR verified successfully',
      route: `/api/orders/${params.id}/verify`,
      orderId: order.id,
      shopId: order.shopId,
      userId: payload.userId
    });

    return NextResponse.json({
      success: true,
      valid: true,
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        customer: { name: order.customer.name, phone: order.customer.phone, email: order.customer.email },
        totalPaise: (order as any).totalPaise,
        subtotalPaise: (order as any).subtotalPaise,
        discountPaise: (order as any).discountPaise,
        taxPaise: (order as any).taxPaise,
        items: order.items.map((i: any) => ({ productName: i.productName, quantity: i.quantity, unit: i.unit, subtotalPaise: i.subtotalPaise, unitPricePaise: i.unitPricePaise, sku: i.sku })),
        status: order.status,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        shop: { name: order.shop.name, address: order.shop.address }
      },
      message: 'QR verified successfully - ready for handover',
      requestId,
      nextAction: 'Mark order as COMPLETED after handover and payment verification - QR will be marked used, inventory finalized, audit logged, invoice generated per point 37'
    });

  } catch (e: any) {
    logStructured({
      requestId,
      timestamp: new Date().toISOString(),
      level: 'error',
      message: 'QR verification failed',
      route: `/api/orders/${params.id}/verify`,
      error: e.message
    });

    return NextResponse.json(
      createErrorResponse('QR_VERIFICATION_FAILED', e.message, requestId, 500),
      { status: 500 }
    );
  }
}
