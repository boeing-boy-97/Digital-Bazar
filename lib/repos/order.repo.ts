// Repo: Order - centralized, typed, paise authoritative
import prisma from '@/lib/db/prisma';
import { canTransition, generateOrderNumber } from '@/lib/domain/orders';
import { calculateAvailable } from '@/lib/domain/inventory';

export async function findOrdersByShop(shopId: string, filters?: { status?: string; page?: number; limit?: number }) {
  const where: any = { shopId };
  if (filters?.status) where.status = filters.status;
  const page = filters?.page || 1;
  const limit = filters?.limit || 20;
  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: { items: true, customer: { select: { name: true, phone: true, email: true } }, shop: true },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    }),
    prisma.order.count({ where })
  ]);
  return { orders, total, page, totalPages: Math.ceil(total / limit) };
}

export async function findOrdersByCustomer(customerId: string) {
  return prisma.order.findMany({
    where: { customerId },
    include: { items: true, shop: { select: { name: true, address: true } } },
    orderBy: { createdAt: 'desc' }
  });
}

export async function findOrderById(id: string) {
  return prisma.order.findUnique({
    where: { id },
    include: {
      items: true,
      customer: { select: { name: true, phone: true, email: true } },
      shop: true,
      statusHistory: { orderBy: { createdAt: 'asc' } }
    }
  });
}

export async function createOrder(data: {
  shopId: string;
  customerId: string;
  items: { productId: string; quantity: number }[];
  pickupType: string;
  paymentMethod: string;
  notes?: string;
  addressId?: string;
}) {
  // Server-authoritative pricing + stock validation
  const productIds = data.items.map(i => i.productId);
  const products = await prisma.product.findMany({ where: { id: { in: productIds }, shopId: data.shopId } });
  if (products.length !== productIds.length) throw new Error('Some products not found or not in shop');

  // Validate stock and build order items with snapshots
  const orderItemsData: any[] = [];
  let subtotalPaise = 0;

  for (const reqItem of data.items) {
    const product = products.find(p => p.id === reqItem.productId)!;
    const available = calculateAvailable(product.stock, product.reservedStock || 0);
    if (available < reqItem.quantity) {
      throw new Error(`Insufficient stock for ${product.name}: only ${available} available - real inventory`);
    }
    const unitPaise = product.pricePaise;
    const linePaise = unitPaise * reqItem.quantity;
    subtotalPaise += linePaise;
    orderItemsData.push({
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      unit: product.unit,
      quantity: reqItem.quantity,
      unitPricePaise: unitPaise,
      subtotalPaise: linePaise,
      storageZone: product.storageZoneId || null
    });
  }

  const totals = {
    subtotalPaise,
    discountPaise: 0,
    taxPaise: 0,
    totalPaise: subtotalPaise
  };

  // Generate human-friendly order number DB-2026-000124
  const year = new Date().getFullYear();
  const countThisYear = await prisma.order.count({ where: { createdAt: { gte: new Date(`${year}-01-01`) } } });
  const orderNumber = generateOrderNumber(countThisYear + 1);

  // Transaction: create order + reserve stock + ledger
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.create({
      data: {
        orderNumber,
        shopId: data.shopId,
        customerId: data.customerId,
        status: 'PENDING',
        pickupType: data.pickupType,
        paymentMethod: data.paymentMethod,
        paymentStatus: 'PENDING',
        subtotalPaise: totals.subtotalPaise,
        discountPaise: totals.discountPaise,
        taxPaise: totals.taxPaise,
        totalPaise: totals.totalPaise,
        notes: data.notes,
        qrToken: `QR-${orderNumber}-${Math.random().toString(36).slice(2,8).toUpperCase()}`,
        items: { create: orderItemsData }
      }
    });

    // Reserve stock atomically
    for (const item of data.items) {
      const product = products.find(p => p.id === item.productId)!;
      const previousQty = product.stock;
      const newReserved = (product.reservedStock || 0) + item.quantity;
      await tx.product.update({
        where: { id: item.productId },
        data: { reservedStock: newReserved }
      });
      await tx.inventoryTransaction.create({
        data: {
          shopId: data.shopId,
          productId: item.productId,
          type: 'RESERVE',
          quantity: item.quantity,
          previousQty,
          newQty: product.stock,
          reason: `Reserve for order ${orderNumber}`,
          actorId: data.customerId,
          orderId: order.id
        }
      });
    }

    await tx.orderStatusHistory.create({
      data: {
        orderId: order.id,
        fromStatus: null,
        toStatus: 'PENDING',
        actorId: data.customerId,
        
        reason: 'Order created'
      }
    });

    return order;
  });
}

export async function transitionOrderStatus(orderId: string, toStatus: string, actorId: string, actorRole: string, reason?: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new Error('Order not found');
  if (!canTransition(order.status as any, toStatus as any)) {
    throw new Error(`Invalid transition ${order.status} -> ${toStatus}`);
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.order.update({
      where: { id: orderId },
      data: { status: toStatus }
    });
    await tx.orderStatusHistory.create({
      data: {
        orderId,
        fromStatus: order.status,
        toStatus,
        actorId,
        
        reason
      }
    });
    // If COMPLETED, finalize inventory: reduce stock, release reserved
    if (toStatus === 'COMPLETED') {
      const items = await tx.orderItem.findMany({ where: { orderId } });
      for (const item of items) {
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        if (!product) continue;
        const previousQty = product.stock;
        const newStock = Math.max(0, product.stock - item.quantity);
        const newReserved = Math.max(0, (product.reservedStock || 0) - item.quantity);
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: newStock, reservedStock: newReserved }
        });
        await tx.inventoryTransaction.create({
          data: {
            shopId: order.shopId,
            productId: item.productId,
            type: 'ORDER_COMPLETED',
            quantity: item.quantity,
            previousQty,
            newQty: newStock,
            reason: `Order ${order.orderNumber} completed`,
            actorId,
            orderId
          }
        });
      }
    }
    // If REJECTED/CANCELLED, release reserved
    if (['REJECTED', 'CANCELLED'].includes(toStatus)) {
      const items = await tx.orderItem.findMany({ where: { orderId } });
      for (const item of items) {
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        if (!product) continue;
        await tx.product.update({
          where: { id: item.productId },
          data: { reservedStock: Math.max(0, (product.reservedStock || 0) - item.quantity) }
        });
        await tx.inventoryTransaction.create({
          data: {
            shopId: order.shopId,
            productId: item.productId,
            type: 'RELEASE',
            quantity: item.quantity,
            previousQty: product.stock,
            newQty: product.stock,
            reason: `Order ${order.orderNumber} ${toStatus} - release reserved`,
            actorId,
            orderId
          }
        });
      }
    }
    return updated;
  });
}
