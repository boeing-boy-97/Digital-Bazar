import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth/jwt';
import { razorpayService } from '@/lib/payments/razorpay';
import { nanoid } from 'nanoid';

export async function POST(req: NextRequest) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('auth-token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { orderId } = await req.json();
    if (!orderId) return NextResponse.json({ error: 'orderId required' }, { status: 400 });

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    if (order.customerId !== payload.userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    if (order.paymentStatus === 'CAPTURED') {
      return NextResponse.json({ error: 'Already paid' }, { status: 400 });
    }

    const idempotencyKey = `pay_${orderId}_${Date.now()}`;

    const razorpayOrder = await razorpayService.createOrder(order.total, order.orderNumber);

    const payment = await prisma.payment.create({
      data: {
        orderId: order.id,
        amount: order.total,
        method: order.paymentMethod as any,
        status: 'CREATED',
        provider: 'razorpay',
        providerOrderId: razorpayOrder.id,
        idempotencyKey
      }
    });

    await prisma.paymentEvent.create({
      data: {
        paymentId: payment.id,
        type: 'ORDER_CREATED',
        data: JSON.stringify(razorpayOrder)
      }
    });

    return NextResponse.json({
      payment,
      razorpayOrder,
      keyId: razorpayService.getPublicKey(),
      amount: order.total * 100,
      currency: 'INR'
    });
  } catch (e: any) {
    console.error('Payment create error', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
