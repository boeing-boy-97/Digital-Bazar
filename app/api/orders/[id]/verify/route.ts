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

    // Validate QR token exists and valid
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

    // Validate order number matches - prevents wrong order scan
    if (order.orderNumber !== orderNumber) {
      return NextResponse.json(createErrorResponse('ORDER_NUMBER_MISMATCH', 'Order number mismatch', requestId, 400), { status: 400 });
    }

    // Validate order belongs to this shop - tenant isolation
    // Already checked via order.shop, but double-check QR contains shopId if provided as JSON
    try {
      const parsedQR = JSON.parse(qrToken);
      if (parsedQR.shopId && parsedQR.shopId !== order.shopId) {
        return NextResponse.json(createErrorResponse('WRONG_SHOP', 'QR belongs to different shop', requestId, 400), { status: 400 });
      }
    } catch {
      // qrToken is plain token, not JSON - okay
    }

    // Validate current status is READY_FOR_PICKUP or OUT_FOR_DELIVERY - not arbitrary
    if (order.status !== 'READY_FOR_PICKUP' && order.status !== 'OUT_FOR_DELIVERY') {
      return NextResponse.json(
        createErrorResponse('NOT_READY', `Order not ready for pickup. Current status: ${order.status}`, requestId, 400, { currentStatus: order.status }),
        { status: 400 }
      );
    }

    // Check token not already used - we use status COMPLETED as redeemed marker
    // In more advanced: add qrRedeemedAt field, but COMPLETED check suffices for MVP
    // Also check status history for duplicate COMPLETED

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
        total: order.total,
        subtotal: order.subtotal,
        discount: order.discount,
        tax: order.tax,
        items: order.items.map(i => ({ productName: i.productName, quantity: i.quantity, unit: i.unit, subtotal: i.subtotal, sku: i.sku })),
        status: order.status,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        shop: { name: order.shop.name, address: order.shop.address }
      },
      message: 'QR verified successfully - ready for handover',
      requestId,
      nextAction: 'Mark order as COMPLETED after handover and payment verification'
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
