import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth/jwt';
import { cartAddSchema } from '@/lib/validation/schemas';
import { checkInventory } from '@/lib/inventory/manager';

export async function POST(req: NextRequest) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('auth-token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const parsed = cartAddSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'Validation failed', details: parsed.error.errors }, { status: 400 });

    const { shopId, productId, variantId, quantity, notes } = parsed.data;

    // Check inventory
    const invCheck = await checkInventory(productId, quantity);
    if (!invCheck.available) {
      return NextResponse.json({ error: `Only ${invCheck.currentStock} available`, currentStock: invCheck.currentStock }, { status: 400 });
    }

    // Get or create cart for this shop
    let cart = await prisma.cart.findUnique({
      where: { userId_shopId: { userId: payload.userId, shopId } }
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId: payload.userId, shopId }
      });
    }

    // Upsert cart item
    const existingItem = await prisma.cartItem.findUnique({
      where: { cartId_productId_variantId: { cartId: cart.id, productId, variantId: variantId || '' } }
    }).catch(async () => {
      // Fallback for SQLite not supporting composite with empty
      return await prisma.cartItem.findFirst({ where: { cartId: cart.id, productId } });
    });

    // Try find first
    const first = await prisma.cartItem.findFirst({ where: { cartId: cart.id, productId } });

    if (first) {
      const updated = await prisma.cartItem.update({
        where: { id: first.id },
        data: { quantity: first.quantity + quantity, notes }
      });
      return NextResponse.json({ item: updated, cartId: cart.id });
    } else {
      const item = await prisma.cartItem.create({
        data: { cartId: cart.id, productId, variantId, quantity, notes }
      });
      return NextResponse.json({ item, cartId: cart.id });
    }
  } catch (e: any) {
    console.error('Cart add error', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  // Update quantity
  const cookieStore = cookies();
  const token = cookieStore.get('auth-token')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const payload = verifyToken(token);
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { itemId, quantity } = await req.json();
  
  if (quantity <= 0) {
    await prisma.cartItem.delete({ where: { id: itemId } });
    return NextResponse.json({ message: 'Removed' });
  }

  const item = await prisma.cartItem.findUnique({ where: { id: itemId }, include: { product: true } });
  if (!item) return NextResponse.json({ error: 'Item not found' }, { status: 404 });

  const invCheck = await prisma.cartItem.findUnique({ where: { id: itemId } });
  // Check inventory for new quantity
  const check = await import('@/lib/inventory/manager').then(m => m.checkInventory(item.productId, quantity));
  if (!check.available) {
    return NextResponse.json({ error: `Only ${check.currentStock} available` }, { status: 400 });
  }

  const updated = await prisma.cartItem.update({ where: { id: itemId }, data: { quantity } });
  return NextResponse.json({ item: updated });
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const itemId = searchParams.get('itemId');
  const cartId = searchParams.get('cartId');

  if (itemId) {
    await prisma.cartItem.delete({ where: { id: itemId } });
    return NextResponse.json({ message: 'Removed' });
  }
  if (cartId) {
    await prisma.cartItem.deleteMany({ where: { cartId } });
    await prisma.cart.delete({ where: { id: cartId } });
    return NextResponse.json({ message: 'Cart cleared' });
  }

  return NextResponse.json({ error: 'itemId or cartId required' }, { status: 400 });
}
