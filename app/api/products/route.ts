import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth/jwt';
import { productCreateSchema } from '@/lib/validation/schemas';
import { slugify } from '@/lib/utils/helpers';
import { generateRequestId } from '@/lib/utils/requestId';
import { legacyProductsResponse, errorResponse } from '@/lib/api/response';

export async function GET(req: NextRequest) {
  const requestId = generateRequestId();
  const { searchParams } = new URL(req.url);
  const shopId = searchParams.get('shopId');
  const shopSlug = searchParams.get('shopSlug');
  const category = searchParams.get('category');
  const search = searchParams.get('search');
  const q = searchParams.get('q');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
  const inStock = searchParams.get('inStock');

  const where: any = { isActive: true, productStatus: 'ACTIVE' };
  
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
      { searchableText: { contains: term.toLowerCase() } }
    ];
  }
  if (inStock === 'true') where.stock = { gt: 0 };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { images: true, category: true, storageZone: true, shop: { select: { name: true, slug: true, city: true, rating: true } } },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.product.count({ where })
  ]);

  return NextResponse.json(legacyProductsResponse(products, total, page, Math.ceil(total / limit), requestId));
}

export async function POST(req: NextRequest) {
  const requestId = generateRequestId();
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('auth-token')?.value;
    if (!token) return NextResponse.json(errorResponse('UNAUTHORIZED', 'Unauthorized', 401, null, requestId), { status: 401 });
    const payload = verifyToken(token);
    if (!payload) return NextResponse.json(errorResponse('UNAUTHORIZED', 'Unauthorized', 401, null, requestId), { status: 401 });

    if (!['shop_owner','shop_employee','admin','super_admin'].includes(payload.role)) {
      return NextResponse.json(errorResponse('FORBIDDEN', 'Forbidden', 403, null, requestId), { status: 403 });
    }

    const body = await req.json();
    const parsed = productCreateSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json(errorResponse('VALIDATION_FAILED', 'Validation failed', 400, parsed.error.errors, requestId), { status: 400 });

    const data = parsed.data;
    
    // Verify shop ownership - server-side role resolution per point 9, never trust browser
    const shop = await prisma.shop.findFirst({
      where: { id: body.shopId, ownerId: payload.userId }
    });

    // Admin can create for any shop, owner only own
    if (!shop && !['admin','super_admin'].includes(payload.role)) {
      return NextResponse.json(errorResponse('FORBIDDEN', 'Shop not found or not owned', 403, null, requestId), { status: 403 });
    }

    const shopId = body.shopId || shop?.id;
    if (!shopId) return NextResponse.json(errorResponse('VALIDATION_FAILED', 'shopId required', 400, null, requestId), { status: 400 });

    // Convert INR to paise for storage - authoritative per point 39, 50
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
        productStatus: data.isActive ? 'ACTIVE' : 'DRAFT',
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

    await prisma.auditLog.create({
      data: {
        actorId: payload.userId,
        action: 'PRODUCT_CREATED',
        entity: 'Product',
        entityId: product.id,
        metadata: JSON.stringify({ shopId, sku: data.sku, pricePaise, stock: data.stock, requestId })
      }
    });

    return NextResponse.json({ success: true, product, requestId }, { status: 201 });
  } catch (e: any) {
    console.error('Product create error', e);
    return NextResponse.json(errorResponse('CREATE_FAILED', e.message, 500, null, requestId), { status: 500 });
  }
}
