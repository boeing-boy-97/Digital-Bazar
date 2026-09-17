import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const product = await prisma.product.findUnique({
    where: { id: params.id },
    include: {
      images: true,
      category: true,
      storageZone: true,
      shop: true,
      variants: true
    }
  });

  if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

  // Related products
  const related = await prisma.product.findMany({
    where: {
      shopId: product.shopId,
      categoryId: product.categoryId,
      id: { not: product.id },
      isActive: true
    },
    include: { images: true },
    take: 4
  });

  return NextResponse.json({ product, related });
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
