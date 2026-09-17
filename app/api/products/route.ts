import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth/jwt';
import { productCreateSchema } from '@/lib/validation/schemas';
import { slugify } from '@/lib/utils/helpers';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const shopId = searchParams.get('shopId');
  const shopSlug = searchParams.get('shopSlug');
  const category = searchParams.get('category');
  const search = searchParams.get('search');
  const q = searchParams.get('q');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const inStock = searchParams.get('inStock');

  const where: any = { isActive: true };
  
  if (shopId) where.shopId = shopId;
  if (shopSlug) {
    const shop = await prisma.shop.findUnique({ where: { slug: shopSlug } });
    if (shop) where.shopId = shop.id;
  }
  if (category) where.category = { name: { contains: category } };
  if (search || q) {
    const term = search || q || '';
    where.OR = [
      { name: { contains: term } },
      { brand: { contains: term } },
      { description: { contains: term } },
      { sku: { contains: term } },
      { searchableText: { contains: term } }
    ];
  }
  if (inStock === 'true') where.stock = { gt: 0 };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { images: true, category: true, storageZone: true, shop: { select: { name: true, slug: true } } },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.product.count({ where })
  ]);

  return NextResponse.json({ products, total, page, totalPages: Math.ceil(total / limit) });
}

export async function POST(req: NextRequest) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('auth-token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if (!['shop_owner','shop_employee','admin','super_admin'].includes(payload.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const parsed = productCreateSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'Validation failed', details: parsed.error.errors }, { status: 400 });

    const data = parsed.data;
    
    // Verify shop ownership
    const shop = await prisma.shop.findFirst({
      where: { id: body.shopId, ownerId: payload.userId }
    });

    // Admin can create for any shop, owner only own
    if (!shop && !['admin','super_admin'].includes(payload.role)) {
      return NextResponse.json({ error: 'Shop not found or not owned' }, { status: 403 });
    }

    const shopId = body.shopId || shop?.id;
    if (!shopId) return NextResponse.json({ error: 'shopId required' }, { status: 400 });

    // Convert INR to paise for storage - authoritative per point 50
    const pricePaise = Math.round(data.price * 100);
    const comparePaise = data.compareAtPrice ? Math.round(data.compareAtPrice * 100) : null;

    const product = await prisma.product.create({
      data: {
        shopId,
        name: data.name,
        slug: `${slugify(data.name)}-${Date.now().toString().slice(-4)}`,
        sku: data.sku,
        barcode: data.barcode,
        description: data.description,
        brand: data.brand,
        categoryId: data.categoryId,
        storageZoneId: data.storageZoneId,
        unit: data.unit,
        size: data.size,
        weight: data.weight,
        pricePaise,
        compareAtPricePaise: comparePaise,
        discount: data.discount,
        taxRate: data.taxRate,
        hsnCode: data.hsnCode,
        stock: data.stock,
        minOrderQty: data.minOrderQty,
        maxOrderQty: data.maxOrderQty,
        lowStockThreshold: data.lowStockThreshold,
        isActive: data.isActive,
        searchableText: `${data.name} ${data.brand||''} ${data.size||''} ${data.unit} ${data.description||''}`.toLowerCase()
      }
    });

    await prisma.inventoryTransaction.create({
      data: {
        shopId,
        productId: product.id,
        type: 'IN',
        quantity: data.stock,
        previousQty: 0,
        newQty: data.stock,
        reason: 'Initial stock',
        actorId: payload.userId
      }
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch (e: any) {
    console.error('Product create error', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
