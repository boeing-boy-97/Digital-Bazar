import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { razorpayService } from '@/lib/payments/razorpay';
import { notificationService } from '@/lib/notifications/service';

export async function POST(req: NextRequest) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = await req.json();

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !orderId) {
      return NextResponse.json({ error: 'Missing payment details' }, { status: 400 });
    }

    const isValid = razorpayService.verifyPaymentSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);
    
    if (!isValid) {
      await prisma.payment.updateMany({
        where: { providerOrderId: razorpay_order_id },
        data: { status: 'FAILED' }
      });
      
      return NextResponse.json({ error: 'Payment signature verification failed' }, { status: 400 });
    }

    const payment = await prisma.payment.findFirst({
      where: { providerOrderId: razorpay_order_id },
      include: { order: true }
    });

    if (!payment) return NextResponse.json({ error: 'Payment record not found' }, { status: 404 });

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
        data: JSON.stringify({ razorpay_payment_id, razorpay_signature })
      }
    });

    await prisma.order.update({
      where: { id: payment.orderId },
      data: { paymentStatus: 'CAPTURED' }
    });

    await notificationService.notifyCustomer(payment.orderId, 'payment_received');

    return NextResponse.json({ message: 'Payment verified', payment: updatedPayment });
  } catch (e: any) {
    console.error('Payment verify error', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
