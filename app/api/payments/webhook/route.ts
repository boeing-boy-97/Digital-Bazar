import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { razorpayService } from '@/lib/payments/razorpay';
import { generateRequestId, createErrorResponse, logStructured } from '@/lib/utils/requestId';

export async function POST(req: NextRequest) {
  const requestId = generateRequestId();
  
  try {
    const payload = await req.text();
    const signature = req.headers.get('x-razorpay-signature') || '';

    // Verify signature - fail if invalid
    const isValid = razorpayService.verifyWebhookSignature(payload, signature);
    if (!isValid) {
      logStructured({
        requestId,
        timestamp: new Date().toISOString(),
        level: 'warn',
        message: 'Invalid webhook signature',
        route: '/api/payments/webhook',
        metadata: { signature: signature.slice(0,20)+'...' }
      });
      return NextResponse.json(createErrorResponse('INVALID_SIGNATURE', 'Invalid webhook signature', requestId, 400), { status: 400 });
    }

    const event = JSON.parse(payload);
    
    logStructured({
      requestId,
      timestamp: new Date().toISOString(),
      level: 'info',
      message: `Webhook event ${event.event}`,
      route: '/api/payments/webhook',
      metadata: { event: event.event, requestId }
    });

    // Idempotency: check if already processed by event ID
    const eventId = event.payload?.payment?.entity?.id || event.payload?.order?.entity?.id || event.id;
    
    if (eventId) {
      const existingEvent = await prisma.paymentEvent.findFirst({
        where: { data: { contains: eventId } }
      });
      
      // Check if we already processed this exact payment event
      if (existingEvent && existingEvent.type === `WEBHOOK_${event.event.toUpperCase()}`) {
        // Check if eventId already in data
        try {
          const existingData = existingEvent.data ? JSON.parse(existingEvent.data) : {};
          if (existingData.id === event.id || (existingEvent.data && existingEvent.data.includes(eventId))) {
            logStructured({
              requestId,
              timestamp: new Date().toISOString(),
              level: 'info',
              message: `Webhook already processed - idempotent ${eventId}`,
              route: '/api/payments/webhook',
              metadata: { eventId, event: event.event }
            });
            return NextResponse.json({ status: 'ok', message: 'Already processed (idempotent)', requestId });
          }
        } catch {}
      }
    }

    if (event.event === 'payment.captured') {
      const paymentId = event.payload.payment.entity.id;
      const orderId = event.payload.payment.entity.order_id;

      const payment = await prisma.payment.findFirst({
        where: { providerOrderId: orderId }
      });

      if (payment) {
        if (payment.status !== 'CAPTURED') {
          await prisma.$transaction(async (tx) => {
            await tx.payment.update({
              where: { id: payment.id },
              data: { status: 'CAPTURED', providerPaymentId: paymentId }
            });

            await tx.order.update({
              where: { id: payment.orderId },
              data: { paymentStatus: 'CAPTURED' }
            });

            await tx.paymentEvent.create({
              data: {
                paymentId: payment.id,
                type: 'WEBHOOK_CAPTURED',
                data: JSON.stringify({ ...event, requestId, processedAt: new Date().toISOString() })
              }
            });

            await tx.auditLog.create({
              data: {
                actorId: 'system',
                action: 'PAYMENT_CAPTURED_WEBHOOK',
                entity: 'Payment',
                entityId: payment.id,
                metadata: JSON.stringify({ providerPaymentId: paymentId, orderId, requestId, eventId })
              }
            });
          });

          logStructured({
            requestId,
            timestamp: new Date().toISOString(),
            level: 'info',
            message: `Payment captured ${paymentId} for order ${payment.orderId}`,
            route: '/api/payments/webhook',
            orderId: payment.orderId,
            metadata: { paymentId, eventId }
          });
        } else {
          logStructured({
            requestId,
            timestamp: new Date().toISOString(),
            level: 'info',
            message: `Payment already captured - idempotent ${paymentId}`,
            route: '/api/payments/webhook',
            orderId: payment.orderId
          });
        }
      } else {
        logStructured({
          requestId,
          timestamp: new Date().toISOString(),
          level: 'warn',
          message: `Payment not found for provider order ${orderId}`,
          route: '/api/payments/webhook',
          metadata: { orderId, paymentId }
        });
      }
    }

    if (event.event === 'payment.failed') {
      const orderId = event.payload.payment.entity.order_id;
      const paymentId = event.payload.payment.entity.id;
      const payment = await prisma.payment.findFirst({ where: { providerOrderId: orderId } });
      
      if (payment && payment.status !== 'FAILED') {
        await prisma.$transaction(async (tx) => {
          await tx.payment.update({ where: { id: payment.id }, data: { status: 'FAILED' } });
          await tx.order.update({ where: { id: payment.orderId }, data: { paymentStatus: 'FAILED' } });
          await tx.paymentEvent.create({
            data: {
              paymentId: payment.id,
              type: 'WEBHOOK_FAILED',
              data: JSON.stringify({ ...event, requestId, processedAt: new Date().toISOString() })
            }
          });
          await tx.auditLog.create({
            data: {
              actorId: 'system',
              action: 'PAYMENT_FAILED_WEBHOOK',
              entity: 'Payment',
              entityId: payment.id,
              metadata: JSON.stringify({ paymentId, orderId, requestId, reason: event.payload.payment.entity.error_description })
            }
          });
        });
      }
    }

    return NextResponse.json({ status: 'ok', requestId });
  } catch (e: any) {
    logStructured({
      requestId,
      timestamp: new Date().toISOString(),
      level: 'error',
      message: 'Webhook processing failed',
      route: '/api/payments/webhook',
      error: e.message
    });
    
    return NextResponse.json(createErrorResponse('WEBHOOK_FAILED', e.message, requestId, 500), { status: 500 });
  }
}
