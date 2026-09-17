import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { razorpayService } from '@/lib/payments/razorpay';
import { notificationService } from '@/lib/notifications/service';
import { generateRequestId, createErrorResponse, logStructured } from '@/lib/utils/requestId';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth/jwt';

export async function POST(req: NextRequest) {
  const requestId = generateRequestId();
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('auth-token')?.value;
    if (token) {
      const payload = verifyToken(token);
      if (!payload) {
        return NextResponse.json(createErrorResponse('UNAUTHORIZED', 'Invalid session', requestId, 401), { status: 401 });
      }
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = await req.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !orderId) {
      return NextResponse.json(createErrorResponse('MISSING_PAYMENT_DATA', 'Missing payment details', requestId, 400), { status: 400 });
    }

    // Verify signature first - never trust frontend per point 38
    const isValid = razorpayService.verifyPaymentSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);
    
    if (!isValid) {
      await prisma.payment.updateMany({
        where: { providerOrderId: razorpay_order_id },
        data: { status: 'FAILED' }
      });
      
      logStructured({ requestId, level: 'warn', message: 'Payment signature verification failed', route: '/api/payments/verify', metadata: { razorpay_order_id, razorpay_payment_id } });
      return NextResponse.json(createErrorResponse('SIGNATURE_FAILED', 'Payment signature verification failed - possible spoofing', requestId, 400), { status: 400 });
    }

    const payment = await prisma.payment.findFirst({
      where: { providerOrderId: razorpay_order_id },
      include: { order: true }
    });

    if (!payment) return NextResponse.json(createErrorResponse('PAYMENT_NOT_FOUND', 'Payment record not found', requestId, 404), { status: 404 });

    // Verify amount mapping - amount must match order totalPaise per point 38
    const order = payment.order as any;
    if (order && payment.amountPaise !== order.totalPaise) {
      logStructured({ requestId, level: 'error', message: 'Payment amount mismatch - possible spoofing', route: '/api/payments/verify', orderId: order.id, metadata: { paymentAmount: payment.amountPaise, orderAmount: order.totalPaise } });
      return NextResponse.json(createErrorResponse('AMOUNT_MISMATCH', `Payment amount ${payment.amountPaise} does not match order amount ${order.totalPaise}`, requestId, 400), { status: 400 });
    }

    // Check duplicate - idempotency per point 39
    if (payment.status === 'CAPTURED') {
      return NextResponse.json({ message: 'Payment already captured (idempotent)', payment, requestId, idempotent: true });
    }

    // Verify currency INR - Razorpay order should be INR
    // Already handled by Razorpay service

    const updatedPayment = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        providerPaymentId: razorpay_payment_id,
        signature: razorpay_signature,
        status: 'CAPTURED'
      }
    });

    await prisma.paymentEvent.create({
      data: {
        paymentId: payment.id,
        type: 'PAYMENT_CAPTURED',
        data: JSON.stringify({ razorpay_payment_id, razorpay_signature, amountPaise: payment.amountPaise, verifiedAt: new Date().toISOString(), requestId })
      }
    });

    await prisma.order.update({
      where: { id: payment.orderId },
      data: { paymentStatus: 'CAPTURED' }
    });

    await prisma.auditLog.create({
      data: {
        action: 'PAYMENT_CAPTURED',
        entity: 'Payment',
        entityId: payment.id,
        metadata: JSON.stringify({ orderId: payment.orderId, amountPaise: payment.amountPaise, providerPaymentId: razorpay_payment_id, requestId })
      }
    });

    logStructured({ requestId, level: 'info', message: 'Payment verified and captured', route: '/api/payments/verify', orderId: payment.orderId, metadata: { paymentId: payment.id, amountPaise: payment.amountPaise } });

    await notificationService.notifyCustomer(payment.orderId, 'payment_received');

    return NextResponse.json({ message: 'Payment verified', payment: updatedPayment, requestId });
  } catch (e: any) {
    logStructured({ requestId, level: 'error', message: 'Payment verify error', route: '/api/payments/verify', error: e.message });
    return NextResponse.json(createErrorResponse('PAYMENT_VERIFY_FAILED', e.message, requestId, 500), { status: 500 });
  }
}
