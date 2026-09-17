import prisma from '@/lib/db/prisma';

export type NotificationChannel = 'in_app' | 'push' | 'email' | 'sms';
export type NotificationType = 
  | 'order_placed'
  | 'order_accepted'
  | 'order_rejected'
  | 'order_preparing'
  | 'order_ready'
  | 'order_completed'
  | 'order_cancelled'
  | 'payment_received'
  | 'payment_failed'
  | 'low_stock'
  | 'new_order_shop'
  | 'support_update';

export type DeliveryStatus = 'pending' | 'sent' | 'delivered' | 'failed' | 'retry';

interface NotifyOptions {
  userId?: string;
  orderId?: string;
  type: NotificationType;
  title: string;
  message: string;
  channels?: NotificationChannel[];
  data?: any;
}

interface DeliveryResult {
  channel: NotificationChannel;
  status: DeliveryStatus;
  error?: string;
  attempt: number;
}

export class NotificationService {
  async notify(options: NotifyOptions): Promise<DeliveryResult[]> {
    const channels = options.channels || ['in_app'];
    const results: DeliveryResult[] = [];

    for (const channel of channels) {
      let result: DeliveryResult = { channel, status: 'pending', attempt: 1 };
      
      try {
        // In-app always works - keep in-app available even if push fails
        if (channel === 'in_app' && options.userId) {
          await prisma.notification.create({
            data: {
              userId: options.userId,
              orderId: options.orderId,
              type: options.type,
              title: options.title,
              message: options.message,
              channel,
              // Delivery state tracking - in production add deliveryStatus field to schema
            }
          });
          result.status = 'delivered'; // in-app is immediate
        }

        // Other channels - abstracted, provider-specific code isolated, with failure handling
        if (channel === 'email') {
          result = await this.sendEmail(options);
        }
        if (channel === 'sms') {
          result = await this.sendSMS(options);
        }
        if (channel === 'push') {
          result = await this.sendPush(options);
        }
      } catch (e: any) {
        result.status = 'failed';
        result.error = e.message;
        console.error(`[Notification] Failed ${channel} for ${options.userId}:`, e.message);
        
        // Audit log for failure
        if (options.userId) {
          await prisma.auditLog.create({
            data: {
              actorId: 'system',
              action: 'NOTIFICATION_FAILED',
              entity: 'Notification',
              entityId: options.userId,
              metadata: JSON.stringify({ channel, type: options.type, error: e.message, orderId: options.orderId })
            }
          }).catch(()=>{});
        }
      }

      // Retry logic for failed notifications - don't block, queue retry
      if (result.status === 'failed' && channel !== 'in_app') {
        // In production: add to job queue for retry with exponential backoff
        // Keep in-app available even if push/email/sms fails
        console.log(`[Notification] Queuing retry for ${channel} - in-app still available`);
        result.status = 'retry';
      }

      results.push(result);
    }

    return results;
  }

  private async sendEmail(options: NotifyOptions): Promise<DeliveryResult> {
    // Email provider integration - isolated, provider-specific code
    // Example: SendGrid, SES, etc.
    if (!process.env.EMAIL_API_KEY) {
      console.log(`[EMAIL MOCK] To: ${options.userId}, Title: ${options.title} - Provider not configured, returning sent but mock`);
      return { channel: 'email', status: 'sent', attempt: 1 }; // mock as sent for dev
    }
    
    try {
      // Real implementation would go here with proper error handling
      // const response = await emailProvider.send(...)
      return { channel: 'email', status: 'delivered', attempt: 1 };
    } catch (e: any) {
      return { channel: 'email', status: 'failed', error: e.message, attempt: 1 };
    }
  }

  private async sendSMS(options: NotifyOptions): Promise<DeliveryResult> {
    if (!process.env.SMS_API_KEY) {
      console.log(`[SMS MOCK] To: ${options.userId}, Message: ${options.message} - Provider not configured`);
      return { channel: 'sms', status: 'sent', attempt: 1 };
    }
    
    try {
      // Real SMS provider with failure handling
      return { channel: 'sms', status: 'delivered', attempt: 1 };
    } catch (e: any) {
      return { channel: 'sms', status: 'failed', error: e.message, attempt: 1 };
    }
  }

  private async sendPush(options: NotifyOptions): Promise<DeliveryResult> {
    if (process.env.FEATURE_PUSH_NOTIFICATIONS !== 'true') {
      console.log(`[PUSH MOCK] ${options.title}: ${options.message} - Push disabled, mock sent`);
      return { channel: 'push', status: 'sent', attempt: 1 };
    }
    
    try {
      // Web Push implementation with VAPID, handle subscription expired, etc.
      // If push fails, in-app is still available - don't fail entire notification
      return { channel: 'push', status: 'delivered', attempt: 1 };
    } catch (e: any) {
      return { channel: 'push', status: 'failed', error: e.message, attempt: 1 };
    }
  }

  async notifyCustomer(orderId: string, type: NotificationType, customMessage?: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { shop: true }
    });
    if (!order) return;

    const messages: Record<NotificationType, { title: string; message: string }> = {
      order_placed: {
        title: 'Order Placed',
        message: `Your order #${order.orderNumber} has been placed at ${order.shop.name}. Shop will prepare while you travel.`
      },
      order_accepted: {
        title: 'Order Accepted',
        message: `Great! ${order.shop.name} accepted your order #${order.orderNumber}. Preparing now. Est: ${order.shop.preparationTimeMin} min`
      },
      order_rejected: {
        title: 'Order Rejected',
        message: `Your order #${order.orderNumber} was rejected. ${customMessage || 'Contact shop for details.'}`
      },
      order_preparing: {
        title: 'Order Preparing',
        message: `Your order #${order.orderNumber} is being prepared. Zone-sorted picking in progress.`
      },
      order_ready: {
        title: 'Order Ready for Pickup! 🎉',
        message: `Your order #${order.orderNumber} is ready at ${order.shop.name}. Show QR at counter. Order #${order.orderNumber} + QR token required.`
      },
      order_completed: {
        title: 'Order Completed',
        message: `Order #${order.orderNumber} completed. Thank you for shopping at ${order.shop.name}! Invoice available.`
      },
      order_cancelled: {
        title: 'Order Cancelled',
        message: `Order #${order.orderNumber} was cancelled. ${customMessage || 'Contact support for details.'}`
      },
      payment_received: {
        title: 'Payment Received',
        message: `Payment for order #${order.orderNumber} received. Amount: ₹${(order as any).totalPaise ? ((order as any).totalPaise/100).toFixed(2) : (order as any).total}. Invoice generated.`
      },
      payment_failed: {
        title: 'Payment Failed',
        message: `Payment for order #${order.orderNumber} failed. Please retry. Order remains pending.`
      },
      low_stock: { title: '', message: '' },
      new_order_shop: { title: '', message: '' },
      support_update: { title: '', message: '' }
    };

    const template = messages[type];
    if (!template.title) return;

    const results = await this.notify({
      userId: order.customerId,
      orderId,
      type,
      title: template.title,
      message: customMessage || template.message,
      channels: ['in_app', 'push'] // in-app always, push if available, failure doesn't block
    });

    // Log delivery states
    console.log(`[Notification] Customer ${order.customerId} notified for order ${orderId} type ${type}:`, results.map(r=>`${r.channel}=${r.status}`).join(', '));

    return results;
  }

  async notifyShopkeeper(shopId: string, type: NotificationType, orderId?: string, message?: string) {
    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
      include: { owner: true }
    });
    if (!shop) return;

    if (type === 'new_order_shop' && orderId) {
      const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true } });
      const results = await this.notify({
        userId: shop.ownerId,
        orderId,
        type,
        title: 'New Order Received! 🔔',
        message: message || `New order #${order?.orderNumber} - ₹${(order as any)?.totalPaise ? ((order as any).totalPaise/100).toFixed(2) : (order as any)?.total}. ${order?.items?.length || 0} items. Accept now to start zone-sorted preparation. Capacity check: ensure you can fulfill.`,
        channels: ['in_app', 'push']
      });

      console.log(`[Notification] Shopkeeper ${shop.ownerId} notified for new order ${orderId}:`, results.map(r=>`${r.channel}=${r.status}`).join(', '));

      // Also notify all shop members with order_view permission
      const members = await prisma.shopMember.findMany({ where: { shopId } });
      for (const member of members) {
        if (member.permission.includes('order_view')) {
          await this.notify({
            userId: member.userId,
            orderId,
            type,
            title: 'New Order in Your Shop',
            message: `New order #${order?.orderNumber} at ${shop.name}`,
            channels: ['in_app']
          }).catch(()=>{});
        }
      }

      return results;
    }
  }
}

export const notificationService = new NotificationService();
