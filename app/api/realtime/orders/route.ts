import { NextRequest } from 'next/server';
import prisma from '@/lib/db/prisma';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth/jwt';
import { generateRequestId, logStructured } from '@/lib/utils/requestId';

export async function GET(req: NextRequest) {
  const requestId = generateRequestId();
  const cookieStore = cookies();
  const token = cookieStore.get('auth-token')?.value;
  if (!token) return new Response('Unauthorized', { status: 401 });
  
  const payload = verifyToken(token);
  if (!payload) return new Response('Unauthorized', { status: 401 });

  const { searchParams } = new URL(req.url);
  const orderId = searchParams.get('orderId');
  const shopId = searchParams.get('shopId');
  const lastEventId = req.headers.get('last-event-id'); // for reconnection

  logStructured({
    requestId,
    timestamp: new Date().toISOString(),
    level: 'info',
    message: 'SSE connection opened',
    route: '/api/realtime/orders',
    userId: payload.userId,
    shopId: shopId || undefined,
    orderId: orderId || undefined,
    metadata: { lastEventId }
  });

  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    async start(controller) {
      let eventId = 0;
      if (lastEventId) {
        const parsed = parseInt(lastEventId);
        if (!isNaN(parsed)) eventId = parsed;
      }

      const sendEvent = (data: any, type?: string) => {
        eventId++;
        // Include id for Last-Event-ID reconnection
        let message = `id: ${eventId}\n`;
        if (type) message += `event: ${type}\n`;
        message += `data: ${JSON.stringify({ ...data, requestId, eventId, timestamp: new Date().toISOString() })}\n\n`;
        try {
          controller.enqueue(encoder.encode(message));
        } catch (e) {
          // Controller closed
        }
      };

      // Heartbeat to keep connection alive and detect dead connections
      const heartbeatInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: heartbeat ${Date.now()}\n\n`));
        } catch {}
      }, 15000);

      // Initial data
      try {
        if (orderId) {
          const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: { statusHistory: { orderBy: { createdAt: 'desc' }, take: 1 }, items: true }
          });
          if (order) {
            // Tenant isolation check
            const isCustomer = order.customerId === payload.userId;
            const isAdmin = ['admin','super_admin'].includes(payload.role);
            let authorized = isCustomer || isAdmin;
            if (!authorized) {
              const shop = await prisma.shop.findUnique({ where: { id: order.shopId } });
              if (shop && shop.ownerId === payload.userId) authorized = true;
              else {
                const member = await prisma.shopMember.findFirst({ where: { shopId: order.shopId, userId: payload.userId } });
                if (member) authorized = true;
              }
            }
            if (authorized) {
              sendEvent({ type: 'order', order }, 'order');
            }
          }
        }
      } catch (e) {
        logStructured({ requestId, timestamp: new Date().toISOString(), level: 'error', message: 'SSE initial data failed', route: '/api/realtime/orders', error: (e as any).message });
      }

      // Poll every 3 seconds for updates (in production use WebSockets/Redis PubSub with persistence)
      const interval = setInterval(async () => {
        try {
          if (orderId) {
            const order = await prisma.order.findUnique({
              where: { id: orderId },
              include: { statusHistory: { orderBy: { createdAt: 'desc' }, take: 5 } }
            });
            if (order) sendEvent({ type: 'order_update', order }, 'order_update');
          }

          if (shopId) {
            // Tenant isolation: verify shop access
            const shop = await prisma.shop.findUnique({ where: { id: shopId } });
            if (shop) {
              const isOwner = shop.ownerId === payload.userId;
              const isAdmin = ['admin','super_admin'].includes(payload.role);
              let isMember = false;
              if (!isOwner && !isAdmin) {
                const m = await prisma.shopMember.findFirst({ where: { shopId, userId: payload.userId } });
                isMember = !!m;
              }
              if (isOwner || isMember || isAdmin) {
                const orders = await prisma.order.findMany({
                  where: { shopId, status: { in: ['PENDING','ACCEPTED','PREPARING'] } },
                  orderBy: { createdAt: 'desc' },
                  take: 10
                });
                sendEvent({ type: 'shop_orders', orders }, 'shop_orders');
              }
            }
          }

          // Also send notifications - delivery states: sent, delivered, failed, retry
          const notifications = await prisma.notification.findMany({
            where: { userId: payload.userId, isRead: false },
            orderBy: { createdAt: 'desc' },
            take: 5
          });
          if (notifications.length > 0) {
            sendEvent({ type: 'notifications', notifications }, 'notifications');
          }
        } catch (e) {
          logStructured({ requestId, timestamp: new Date().toISOString(), level: 'error', message: 'SSE poll error', route: '/api/realtime/orders', error: (e as any).message });
        }
      }, 3000);

      // Cleanup on close
      const cleanup = () => {
        clearInterval(interval);
        clearInterval(heartbeatInterval);
        try { controller.close(); } catch {}
        logStructured({
          requestId,
          timestamp: new Date().toISOString(),
          level: 'info',
          message: 'SSE connection closed',
          route: '/api/realtime/orders',
          userId: payload.userId
        });
      };

      req.signal.addEventListener('abort', cleanup);
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable buffering for nginx
      'X-Request-Id': requestId
    }
  });
}
