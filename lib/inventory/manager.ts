import prisma from '@/lib/db/prisma';

export interface InventoryCheckResult {
  available: boolean;
  currentStock: number;
  requested: number;
  productId: string;
}

export async function checkInventory(productId: string, requestedQty: number): Promise<InventoryCheckResult> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { stock: true, reservedStock: true, isActive: true, minOrderQty: true, maxOrderQty: true }
  });

  if (!product || !product.isActive) {
    return { available: false, currentStock: 0, requested: requestedQty, productId };
  }

  // Check min/max order qty
  if (requestedQty < product.minOrderQty) {
    return { available: false, currentStock: product.stock - product.reservedStock, requested: requestedQty, productId };
  }
  if (product.maxOrderQty && requestedQty > product.maxOrderQty) {
    return { available: false, currentStock: product.stock - product.reservedStock, requested: requestedQty, productId };
  }

  const available = product.stock - product.reservedStock;
  return {
    available: available >= requestedQty && available >= 0,
    currentStock: available,
    requested: requestedQty,
    productId
  };
}

export async function reserveInventory(productId: string, quantity: number, orderId?: string, actorId?: string) {
  return await prisma.$transaction(async (tx) => {
    const product = await tx.product.findUnique({
      where: { id: productId }
    });

    if (!product) throw new Error('Product not found');
    if (!product.isActive) throw new Error(`Product ${product.name} is not active`);
    
    const available = product.stock - product.reservedStock;
    if (available < quantity) {
      throw new Error(`Insufficient stock for ${product.name}. Available: ${available}, Requested: ${quantity}`);
    }

    if (quantity < product.minOrderQty) {
      throw new Error(`Minimum order qty for ${product.name} is ${product.minOrderQty}`);
    }
    if (product.maxOrderQty && quantity > product.maxOrderQty) {
      throw new Error(`Maximum order qty for ${product.name} is ${product.maxOrderQty}`);
    }

    const updated = await tx.product.update({
      where: { id: productId },
      data: { reservedStock: { increment: quantity } }
    });

    await tx.inventoryTransaction.create({
      data: {
        shopId: product.shopId,
        productId,
        type: 'RESERVE',
        quantity,
        previousQty: product.stock,
        newQty: updated.stock,
        reason: `Reserved for order ${orderId || 'cart'} - ${product.name}`,
        actorId,
        orderId
      }
    });

    return updated;
  });
}

export async function releaseInventory(productId: string, quantity: number, orderId?: string, actorId?: string) {
  return await prisma.$transaction(async (tx) => {
    const product = await tx.product.findUnique({ where: { id: productId } });
    if (!product) throw new Error('Product not found');

    // Prevent negative reservedStock - Math.min ensures we don't go below 0
    const releaseQty = Math.min(quantity, product.reservedStock);

    const updated = await tx.product.update({
      where: { id: productId },
      data: { reservedStock: { decrement: releaseQty } }
    });

    await tx.inventoryTransaction.create({
      data: {
        shopId: product.shopId,
        productId,
        type: 'RELEASE',
        quantity: releaseQty,
        previousQty: product.stock,
        newQty: updated.stock,
        reason: `Released from order ${orderId || 'unknown'} - ${product.name}`,
        actorId,
        orderId
      }
    });

    return updated;
  });
}

export async function confirmInventoryDeduction(productId: string, quantity: number, orderId?: string, actorId?: string) {
  return await prisma.$transaction(async (tx) => {
    const product = await tx.product.findUnique({ where: { id: productId } });
    if (!product) throw new Error('Product not found');

    // Prevent negative stock - check before deduction
    if (product.stock < quantity) {
      throw new Error(`Cannot deduct ${quantity} from ${product.name}, only ${product.stock} in stock`);
    }

    const updated = await tx.product.update({
      where: { id: productId },
      data: {
        stock: { decrement: quantity },
        reservedStock: { decrement: Math.min(quantity, product.reservedStock) }
      }
    });

    // Double-check no negative after deduction (safety)
    if (updated.stock < 0) {
      throw new Error(`Stock would go negative for ${product.name} - transaction rolled back`);
    }

    await tx.inventoryTransaction.create({
      data: {
        shopId: product.shopId,
        productId,
        type: 'OUT',
        quantity,
        previousQty: product.stock,
        newQty: updated.stock,
        reason: `Sold - Order ${orderId} - ${product.name}`,
        actorId,
        orderId
      }
    });

    return updated;
  });
}

export async function restockInventory(productId: string, quantity: number, reason: string, actorId?: string) {
  if (quantity <= 0) throw new Error('Restock quantity must be positive');
  
  return await prisma.$transaction(async (tx) => {
    const product = await tx.product.findUnique({ where: { id: productId } });
    if (!product) throw new Error('Product not found');

    const updated = await tx.product.update({
      where: { id: productId },
      data: { stock: { increment: quantity } }
    });

    await tx.inventoryTransaction.create({
      data: {
        shopId: product.shopId,
        productId,
        type: 'IN',
        quantity,
        previousQty: product.stock,
        newQty: updated.stock,
        reason,
        actorId
      }
    });

    return updated;
  });
}

export function calculateCartTotals(items: { price: number; quantity: number; discount?: number; taxRate?: number }[]) {
  let subtotal = 0;
  let discount = 0;
  let tax = 0;

  for (const item of items) {
    const itemSubtotal = item.price * item.quantity;
    const itemDiscount = (item.discount || 0) / 100 * itemSubtotal;
    const afterDiscount = itemSubtotal - itemDiscount;
    const itemTax = (item.taxRate || 0) / 100 * afterDiscount;

    subtotal += itemSubtotal;
    discount += itemDiscount;
    tax += itemTax;
  }

  const total = subtotal - discount + tax;
  return { subtotal, discount, tax, total };
}

// Zone sorting deterministic - A-E, by sortOrder then name
export function sortOrderItemsByZone(items: any[]): any[] {
  return [...items].sort((a, b) => {
    // First by storageZone sortOrder if available
    const zoneA = a.storageZone?.sortOrder ?? a.storageZone?.name?.charCodeAt(0) ?? 999;
    const zoneB = b.storageZone?.sortOrder ?? b.storageZone?.name?.charCodeAt(0) ?? 999;
    if (zoneA !== zoneB) return zoneA - zoneB;
    // Then by zone name
    const nameA = a.storageZone?.name || a.storageZone || 'ZZZ';
    const nameB = b.storageZone?.name || b.storageZone || 'ZZZ';
    if (nameA !== nameB) return nameA.localeCompare(nameB);
    // Then by product name for deterministic
    return (a.productName || '').localeCompare(b.productName || '');
  });
}
