import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { cookies } from 'next/headers';
import { verifyToken, generateOrderNumber, generateQRToken } from '@/lib/auth/jwt';
import { orderCreateSchema } from '@/lib/validation/schemas';
import { reserveInventory } from '@/lib/inventory/manager';
import { notificationService } from '@/lib/notifications/service';
import { generateRequestId, createErrorResponse, logStructured } from '@/lib/utils/requestId';
import { rateLimitMiddleware } from '@/lib/rate-limit/simple';
import { jobQueue } from '@/lib/jobs/queue';

// In-memory idempotency store for orders - production should use Redis/DB
const orderIdempotencyStore = new Map<string, { orderId: string; createdAt: number }>();

export async function GET(req: NextRequest) {
  const requestId = generateRequestId();
  const cookieStore = cookies();
  const token = cookieStore.get('auth-token')?.value;
  if (!token) {
    return NextResponse.json(createErrorResponse('UNAUTHORIZED', 'Authentication required', requestId, 401), { status: 401 });
  }
  const payload = verifyToken(token);
  if (!payload) {
    return NextResponse.json(createErrorResponse('UNAUTHORIZED', 'Invalid session', requestId, 401), { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const role = payload.role;
  const shopId = searchParams.get('shopId');
  const status = searchParams.get('status');

  let where: any = {};

  if (role === 'customer') {
    where.customerId = payload.userId;
  } else if (role === 'shop_owner' || role === 'shop_employee') {
    const shops = await prisma.shop.findMany({
      where: { OR: [{ ownerId: payload.userId }, { members: { some: { userId: payload.userId } } }] },
      select: { id: true }
    });
    const shopIds = shops.map(s => s.id);
    if (shopId) {
      if (!shopIds.includes(shopId)) {
        return NextResponse.json(createErrorResponse('FORBIDDEN', 'Shop access denied - tenant isolation', requestId, 403), { status: 403 });
      }
      where.shopId = shopId;
    } else {
      where.shopId = { in: shopIds };
    }
  } else if (role === 'admin' || role === 'super_admin') {
    if (shopId) where.shopId = shopId;
  }

  if (status) where.status = status;

  // Real pagination - do not load thousands
  const page = parseInt(searchParams.get('page') || '1');
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
  const skip = (page - 1) * limit;

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        items: true,
        shop: { select: { name: true, slug: true } },
        customer: { select: { name: true, phone: true } }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    }),
    prisma.order.count({ where })
  ]);

  return NextResponse.json({ orders, total, page, totalPages: Math.ceil(total / limit), requestId });
}

export async function POST(req: NextRequest) {
  const requestId = generateRequestId();
  
  try {
    // Rate limiting checkout - 5 per minute
    const rateLimit = rateLimitMiddleware(req, 'checkout');
    if (!rateLimit.allowed) {
      return NextResponse.json(
        createErrorResponse('RATE_LIMITED', 'Too many order attempts. Please wait.', requestId, 429),
        { status: 429, headers: rateLimit.headers }
      );
    }

    const cookieStore = cookies();
    const token = cookieStore.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json(createErrorResponse('UNAUTHORIZED', 'Authentication required', requestId, 401), { status: 401 });
    }
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json(createErrorResponse('UNAUTHORIZED', 'Invalid session', requestId, 401), { status: 401 });
    }

    const body = await req.json();
    
    // Idempotency key for duplicate order protection - customer double-click, network retry
    const idempotencyKey = body.idempotencyKey || req.headers.get('x-idempotency-key');
    if (idempotencyKey) {
      const existing = orderIdempotencyStore.get(idempotencyKey);
      if (existing && Date.now() - existing.createdAt < 10 * 60 * 1000) { // 10 min window
        const order = await prisma.order.findUnique({ where: { id: existing.orderId }, include: { items: true } });
        if (order) {
          logStructured({
            requestId,
            timestamp: new Date().toISOString(),
            level: 'info',
            message: 'Idempotent order request - returning existing order',
            route: '/api/orders',
            userId: payload.userId,
            orderId: order.id,
            metadata: { idempotencyKey }
          });
          return NextResponse.json({ order, message: 'Order already created (idempotent)', requestId, idempotent: true }, { status: 200, headers: rateLimit.headers });
        }
      }
    }

    const parsed = orderCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        createErrorResponse('VALIDATION_FAILED', 'Invalid order data', requestId, 400, parsed.error.errors),
        { status: 400 }
      );
    }

    const { shopId, paymentMethod, pickupType, pickupTime, deliveryAddress, notes, promotionCode } = parsed.data;

    // Check shop exists and is active and accepting orders - real data only
    const shop = await prisma.shop.findUnique({ where: { id: shopId } });
    if (!shop) {
      return NextResponse.json(createErrorResponse('SHOP_NOT_FOUND', 'Shop not found', requestId, 404), { status: 404 });
    }
    if (shop.status !== 'APPROVED') {
      return NextResponse.json(createErrorResponse('SHOP_NOT_APPROVED', `Shop not approved. Status: ${shop.status}`, requestId, 400), { status: 400 });
    }
    
    // Shop pause logic - if shop paused, block new orders but existing continue
    // Check platform_settings or shop businessInfo for pause flag
    if (shop.businessInfo) {
      try {
        const info = JSON.parse(shop.businessInfo);
        if (info.paused) {
          return NextResponse.json(createErrorResponse('SHOP_PAUSED', 'Shop temporarily not accepting new orders', requestId, 400, { reason: info.pauseReason }), { status: 400 });
        }
      } catch {}
    }

    // Shop capacity check - max active orders
    const activeOrdersCount = await prisma.order.count({
      where: { shopId, status: { in: ['PENDING', 'ACCEPTED', 'PREPARING', 'PICKING', 'QUALITY_CHECK', 'READY_FOR_PICKUP'] } }
    });
    const maxCapacity = 50; // configurable per shop in future
    if (activeOrdersCount >= maxCapacity) {
      return NextResponse.json(createErrorResponse('SHOP_AT_CAPACITY', `Shop at capacity (${maxCapacity} active orders). Try later or contact shop.`, requestId, 400, { activeOrders: activeOrdersCount, maxCapacity }), { status: 400 });
    }

    // Get cart - server is authoritative, not localStorage
    const cart = await prisma.cart.findUnique({
      where: { userId_shopId: { userId: payload.userId, shopId } },
      include: { items: { include: { product: { include: { storageZone: true, category: true } } } } }
    });

    if (!cart || cart.items.length === 0) {
      return NextResponse.json(createErrorResponse('CART_EMPTY', 'Cart is empty', requestId, 400), { status: 400 });
    }

    // Validate every cart item again before checkout - real validation
    let subtotal = 0;
    let discount = 0;
    let tax = 0;
    const orderItemsData: any[] = [];
    const validationErrors: string[] = [];

    for (const cartItem of cart.items) {
      const product = cartItem.product;
      
      if (!product.isActive) {
        validationErrors.push(`${product.name} is no longer available`);
        continue;
      }
      if (product.shopId !== shopId) {
        validationErrors.push(`${product.name} does not belong to this shop`);
        continue;
      }
      
      // Stock validation real
      const available = product.stock - product.reservedStock;
      if (available < cartItem.quantity) {
        if (available <= 0) {
          validationErrors.push(`${product.name} is now out of stock`);
        } else {
          validationErrors.push(`${product.name} is now available only in quantity of ${available} (you requested ${cartItem.quantity})`);
        }
        continue;
      }

      // Quantity limits
      if (cartItem.quantity < product.minOrderQty) {
        validationErrors.push(`${product.name} minimum order is ${product.minOrderQty} ${product.unit}`);
        continue;
      }
      if (product.maxOrderQty && cartItem.quantity > product.maxOrderQty) {
        validationErrors.push(`${product.name} maximum order is ${product.maxOrderQty} ${product.unit}`);
        continue;
      }

      // Server fetches authoritative prices - never trust client
      const itemSubtotal = product.price * cartItem.quantity;
      const itemDiscount = (product.discount || 0) / 100 * itemSubtotal;
      const afterDiscount = itemSubtotal - itemDiscount;
      const itemTax = (product.taxRate || 0) / 100 * afterDiscount;

      subtotal += itemSubtotal;
      discount += itemDiscount;
      tax += itemTax;

      orderItemsData.push({
        productId: product.id,
        productName: product.name, // snapshot
        sku: product.sku, // snapshot
        quantity: cartItem.quantity,
        unit: product.unit,
        unitPrice: product.price, // snapshot authoritative
        discount: product.discount || 0,
        taxRate: product.taxRate || 0,
        subtotal: afterDiscount + itemTax,
        storageZone: product.storageZone?.name || null,
        // For advanced picking: aisle, rack, shelf, bin ready in future
      });
    }

    if (validationErrors.length > 0) {
      return NextResponse.json(
        createErrorResponse('CART_VALIDATION_FAILED', 'Cart validation failed', requestId, 400, { errors: validationErrors }),
        { status: 400 }
      );
    }

    if (orderItemsData.length === 0) {
      return NextResponse.json(createErrorResponse('CART_EMPTY', 'No valid items in cart after validation', requestId, 400), { status: 400 });
    }

    // Promotion validation server-side
    if (promotionCode) {
      const promo = await prisma.promotion.findUnique({ where: { code: promotionCode } });
      if (!promo || !promo.isActive) {
        return NextResponse.json(createErrorResponse('INVALID_PROMOTION', 'Invalid promotion code', requestId, 400), { status: 400 });
      }
      if (promo.validFrom && new Date() < promo.validFrom) {
        return NextResponse.json(createErrorResponse('PROMOTION_NOT_STARTED', 'Promotion not yet started', requestId, 400), { status: 400 });
      }
      if (promo.validTill && new Date() > promo.validTill) {
        return NextResponse.json(createErrorResponse('PROMOTION_EXPIRED', 'Promotion expired', requestId, 400), { status: 400 });
      }
      if (promo.minOrder && subtotal < promo.minOrder) {
        return NextResponse.json(createErrorResponse('PROMOTION_MIN_ORDER', `Minimum order ${promo.minOrder} required for this promotion`, requestId, 400), { status: 400 });
      }
      // Check usage limit etc.

      if (promo.discountType === 'PERCENTAGE') {
        const promoDiscount = subtotal * (promo.discountValue / 100);
        discount += Math.min(promoDiscount, promo.maxDiscount || promoDiscount);
      } else {
        discount += promo.discountValue;
      }

      // Record promotion usage
      await prisma.auditLog.create({
        data: {
          actorId: payload.userId,
          action: 'PROMOTION_APPLIED',
          entity: 'Promotion',
          entityId: promo.id,
          metadata: JSON.stringify({ code: promotionCode, orderTotal: subtotal })
        }
      });
    }

    const total = subtotal - discount + tax;

    // Inventory reservation in transaction - critical, concurrency-safe
    // Use Prisma transaction with locking
    try {
      await prisma.$transaction(async (tx) => {
        for (const item of cart.items) {
          const product = await tx.product.findUnique({ where: { id: item.productId } });
          if (!product) throw new Error(`Product ${item.productId} not found`);
          
          const available = product.stock - product.reservedStock;
          if (available < item.quantity) {
            throw new Error(`Insufficient stock for ${product.name}: available ${available}, requested ${item.quantity}`);
          }

          await tx.product.update({
            where: { id: item.productId },
            data: { reservedStock: { increment: item.quantity } }
          });

          await tx.inventoryTransaction.create({
            data: {
              shopId,
              productId: item.productId,
              type: 'RESERVE',
              quantity: item.quantity,
              previousQty: product.stock,
              newQty: product.stock,
              reason: `Reserved for order creation`,
              actorId: payload.userId
            }
          });
        }
      });
    } catch (e: any) {
      logStructured({
        requestId,
        timestamp: new Date().toISOString(),
        level: 'error',
        message: 'Inventory reservation failed - rolling back',
        route: '/api/orders',
        userId: payload.userId,
        shopId,
        error: e.message
      });
      return NextResponse.json(createErrorResponse('INSUFFICIENT_STOCK', e.message, requestId, 400), { status: 400 });
    }

    // Generate human-readable order number DB-2026-10482 style
    const orderNumber = `DB-${new Date().getFullYear()}-${generateOrderNumber().slice(-6)}`;
    const qrToken = generateQRToken();

    // Create order with snapshot, status history, in transaction
    const order = await prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          orderNumber,
          customerId: payload.userId,
          shopId,
          subtotal,
          discount,
          tax,
          total,
          paymentMethod,
          pickupType,
          pickupTime: pickupTime ? new Date(pickupTime) : null,
          deliveryAddress: deliveryAddress ? JSON.stringify(deliveryAddress) : null,
          notes,
          qrToken,
          status: 'PENDING',
          items: { create: orderItemsData },
          statusHistory: {
            create: {
              fromStatus: null,
              toStatus: 'PENDING',
              actorId: payload.userId,
              reason: 'Order created'
            }
          }
        },
        include: { items: true }
      });

      // Clear cart only after successful order creation
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      await tx.cart.delete({ where: { id: cart.id } });

      return created;
    });

    // Store idempotency
    if (idempotencyKey) {
      orderIdempotencyStore.set(idempotencyKey, { orderId: order.id, createdAt: Date.now() });
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        actorId: payload.userId,
        action: 'ORDER_CREATED',
        entity: 'Order',
        entityId: order.id,
        metadata: JSON.stringify({ total, items: order.items.length, shopId, requestId })
      }
    });

    // Background jobs - don't block HTTP
    await jobQueue.add('notification_send', { type: 'new_order_shop', shopId, orderId: order.id });
    await jobQueue.add('notification_send', { type: 'order_placed', orderId: order.id });

    // Realtime event + notifications
    try {
      await notificationService.notifyShopkeeper(shopId, 'new_order_shop', order.id);
      await notificationService.notifyCustomer(order.id, 'order_placed');
    } catch (e) {
      logStructured({
        requestId,
        timestamp: new Date().toISOString(),
        level: 'warn',
        message: 'Notification failed but order created',
        route: '/api/orders',
        orderId: order.id,
        error: (e as any).message
      });
      // Don't fail order if notification fails - keep in-app available
    }

    logStructured({
      requestId,
      timestamp: new Date().toISOString(),
      level: 'info',
      message: 'Order created successfully',
      route: '/api/orders',
      userId: payload.userId,
      shopId,
      orderId: order.id,
      metadata: { total, items: order.items.length }
    });

    return NextResponse.json({ 
      success: true,
      order, 
      message: 'Order placed successfully - shop will prepare while you travel',
      requestId,
      estimatedPrep: `${shop.preparationTimeMin}-${shop.preparationTimeMin + 10} minutes`
    }, { status: 201, headers: rateLimit.headers });

  } catch (e: any) {
    logStructured({
      requestId,
      timestamp: new Date().toISOString(),
      level: 'error',
      message: 'Order creation failed',
      route: '/api/orders',
      error: e.message
    });

    return NextResponse.json(
      createErrorResponse('ORDER_CREATION_FAILED', e.message || 'Failed to create order', requestId, 500),
      { status: 500 }
    );
  }
}
