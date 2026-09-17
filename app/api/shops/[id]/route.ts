import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const id = params.id;
  
  const shop = await prisma.shop.findFirst({
    where: {
      OR: [{ id }, { slug: id }]
    },
    include: {
      storageZones: true,
      _count: { select: { products: true } }
    }
  });

  if (!shop) return NextResponse.json({ error: 'Shop not found' }, { status: 404 });

  // Get categories with product counts
  const categories = await prisma.category.findMany({
    where: { shopId: shop.id },
    include: { _count: { select: { products: true } } }
  });

  const products = await prisma.product.findMany({
    where: { shopId: shop.id, isActive: true },
    include: { images: true, category: true, storageZone: true },
    take: 100,
    orderBy: { createdAt: 'desc' }
  });

  return NextResponse.json({ shop, categories, products });
}
