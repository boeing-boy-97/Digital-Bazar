import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    let product: any = null;
    try {
      product = await prisma.product.findUnique({
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
    } catch (dbErr: any) {
      console.error('[products id GET] DB error:', dbErr?.message);
      return NextResponse.json({ error: 'Unable to load product temporarily' }, { status: 500 });
    }

    if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });

    let related: any[] = [];
    try {
      related = await prisma.product.findMany({
        where: {
          shopId: product.shopId,
          categoryId: product.categoryId,
          id: { not: product.id },
          isActive: true
        },
        include: { images: true, shop: { select: { name: true } } },
        take: 4
      });
    } catch {}

    return NextResponse.json({ product, related });
  } catch (e: any) {
    console.error('[products id GET] Unhandled:', e?.message);
    return NextResponse.json({ error: 'Unable to load product' }, { status: 500 });
  }
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
