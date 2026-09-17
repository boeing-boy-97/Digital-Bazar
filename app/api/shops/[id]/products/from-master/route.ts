import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth/jwt';
import { slugify } from '@/lib/utils/helpers';

// POST /api/shops/[id]/products/from-master - Add product from master catalog to shop
// This is the REAL flow: shop owner searches master catalog, selects product, sets price/stock
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('auth-token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const shopId = params.id;

    // Verify ownership or admin
    const shop = await prisma.shop.findFirst({
      where: { id: shopId, ownerId: payload.userId }
    });

    if (!shop && !['admin', 'super_admin'].includes(payload.role)) {
      // Check if employee with product_manage permission
      const membership = await prisma.shopMember.findFirst({
        where: { shopId, userId: payload.userId, isActive: true }
      });
      if (!membership || !['manager', 'inventory_manager', 'product_manage'].includes(membership.permission)) {
        return NextResponse.json({ error: 'Shop not found or not authorized' }, { status: 403 });
      }
    }

    const body = await req.json();
    const { masterProductId, masterVariantId, price, compareAtPrice, stock, sku, barcode, storageZoneId, unit, taxRate, hsnCode, minOrderQty, maxOrderQty, lowStockThreshold, isActive, customName, customDescription, customImages } = body;

    if (!masterProductId) {
      return NextResponse.json({ error: 'masterProductId required' }, { status: 400 });
    }

    if (!price || price <= 0) {
      return NextResponse.json({ error: 'Valid price required' }, { status: 400 });
    }

    // Fetch master product
    const masterProduct = await prisma.masterProduct.findUnique({
      where: { id: masterProductId },
      include: { variants: true, images: true, category: true }
    });

    if (!masterProduct) {
      return NextResponse.json({ error: 'Master product not found' }, { status: 404 });
    }

    // Check if already exists in shop
    const existing = await prisma.product.findFirst({
      where: { shopId, masterProductId }
    });

    if (existing) {
      return NextResponse.json({ error: 'Product already exists in your shop. Update existing listing instead.' }, { status: 409 });
    }

    // Generate SKU if not provided - unique per shop per point 64
    const finalSku = sku || `${masterProduct.slug.toUpperCase()}-${shopId.slice(-4)}-${Date.now().toString().slice(-4)}`;
    
    // Check SKU uniqueness per shop
    const skuExists = await prisma.product.findFirst({ where: { shopId, sku: finalSku } });
    if (skuExists) {
      return NextResponse.json({ error: 'SKU already exists in your shop, please use different SKU' }, { status: 409 });
    }

    const productName = customName || masterProduct.name;
    const productSlug = `${slugify(productName)}-${Date.now().toString().slice(-4)}`;

    // Convert INR to paise - authoritative per point 50
    const pricePaise = Math.round(parseFloat(price) * 100);
    const comparePaise = compareAtPrice ? Math.round(parseFloat(compareAtPrice) * 100) : null;

    // Create shop product from master - master→shop listing per point 11
    const product = await prisma.product.create({
      data: {
        shopId,
        masterProductId,
        name: productName,
        slug: productSlug,
        sku: finalSku,
        barcode: barcode || null,
        description: customDescription || masterProduct.description,
        brand: masterProduct.brand,
        unit: unit || 'piece',
        pricePaise,
        compareAtPricePaise: comparePaise,
        taxRate: taxRate ? parseFloat(taxRate) : 0,
        hsnCode: hsnCode || null,
        stock: stock ? parseInt(stock) : 0,
        minOrderQty: minOrderQty ? parseInt(minOrderQty) : 1,
        maxOrderQty: maxOrderQty ? parseInt(maxOrderQty) : null,
        lowStockThreshold: lowStockThreshold ? parseInt(lowStockThreshold) : 10,
        storageZoneId: storageZoneId || null,
        isActive: isActive !== false,
        searchableText: `${productName} ${masterProduct.brand || ''} ${masterProduct.description || ''}`.toLowerCase()
      },
      include: {
        masterProduct: { include: { category: true } },
        storageZone: true
      }
    });

    // Create images from master if not custom
    if (masterProduct.images.length > 0 && !customImages) {
      await prisma.productImage.createMany({
        data: masterProduct.images.map((img, idx) => ({
          productId: product.id,
          url: img.url,
          alt: img.alt || productName,
          sortOrder: idx
        }))
      });
    } else if (customImages && customImages.length > 0) {
      await prisma.productImage.createMany({
        data: customImages.map((img: any, idx: number) => ({
          productId: product.id,
          url: img.url,
          alt: img.alt || productName,
          sortOrder: idx
        }))
      });
    }

    // Create variant if masterVariantId provided - pricePaise authoritative
    if (masterVariantId) {
      const masterVariant = masterProduct.variants.find(v => v.id === masterVariantId);
      if (masterVariant) {
        await prisma.productVariant.create({
          data: {
            productId: product.id,
            masterVariantId: masterVariant.id,
            name: masterVariant.name,
            sku: `${finalSku}-${slugify(masterVariant.name)}`,
            pricePaise,
            stock: stock ? parseInt(stock) : 0,
            attributes: masterVariant.attributes
          }
        });
      }
    }

    // Inventory transaction
    await prisma.inventoryTransaction.create({
      data: {
        shopId,
        productId: product.id,
        type: 'IN',
        quantity: stock ? parseInt(stock) : 0,
        previousQty: 0,
        newQty: stock ? parseInt(stock) : 0,
        reason: 'Added from master catalog',
        actorId: payload.userId
      }
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        actorId: payload.userId,
        action: 'PRODUCT_ADDED_FROM_MASTER',
        entity: 'Product',
        entityId: product.id,
        metadata: JSON.stringify({ masterProductId, shopId, price, stock })
      }
    });

    const fullProduct = await prisma.product.findUnique({
      where: { id: product.id },
      include: {
        images: true,
        variants: true,
        masterProduct: { include: { category: true, images: true } },
        storageZone: true
      }
    });

    return NextResponse.json({ product: fullProduct }, { status: 201 });
  } catch (e: any) {
    console.error('Add from master error', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
