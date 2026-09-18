import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const product = await prisma.product.findUnique({
    where: { id: params.id },
    include: {
      images: true,
      category: true,
      storageZone: true,
      shop: { include: { businessHours: true, holidays: true } },
      variants: true,
      masterProduct: true
    }
  });

  if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

  // Related products same shop category
  const related = await prisma.product.findMany({
    where: {
      shopId: product.shopId,
      categoryId: product.categoryId,
      id: { not: product.id },
      isActive: true
    },
    include: { images: true, shop: { select: { name: true } } },
    take: 4
  });

  // Shop comparison - other shops selling same master product per point 10, 49
  let shopComparison: any[] = [];
  if ((product as any).masterProductId) {
    shopComparison = await prisma.product.findMany({
      where: {
        masterProductId: (product as any).masterProductId,
        id: { not: product.id },
        isActive: true,
        shop: { status: 'APPROVED' }
      },
      include: {
        shop: { 
          select: { 
            id: true, name: true, slug: true, address: true, city: true, rating: true, reviewCount: true,
            isPickupEnabled: true, isDeliveryEnabled: true, preparationTimeMin: true,
            latitude: true, longitude: true,
            businessHours: true, holidays: true, timezone: true
          } 
        },
        images: { take: 1 }
      },
      take: 10,
      orderBy: { pricePaise: 'asc' }
    });
  }

  return NextResponse.json({ product, related, shopComparison });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  // Update product - shop owner only
  const body = await req.json();
  const product = await prisma.product.update({
    where: { id: params.id },
    data: body
  });
  return NextResponse.json({ product });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  await prisma.product.update({
    where: { id: params.id },
    data: { isActive: false }
  });
  return NextResponse.json({ message: 'Deactivated' });
}
