import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth/jwt';
import { generateRequestId, createErrorResponse } from '@/lib/utils/requestId';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const requestId = generateRequestId();
  const cookieStore = cookies();
  const token = cookieStore.get('auth-token')?.value;
  if (!token) return NextResponse.json(createErrorResponse('UNAUTHORIZED','Auth required',requestId,401),{status:401});
  const payload = verifyToken(token);
  if (!payload) return NextResponse.json(createErrorResponse('UNAUTHORIZED','Invalid',requestId,401),{status:401});

  const shop = await prisma.shop.findUnique({ where: { id: params.id } });
  if (!shop) return NextResponse.json(createErrorResponse('SHOP_NOT_FOUND','Shop not found',requestId,404),{status:404});

  const isOwner = shop.ownerId === payload.userId;
  const isAdmin = ['admin','super_admin'].includes(payload.role);
  let isMember = false;
  if (!isOwner && !isAdmin) {
    const m = await prisma.shopMember.findFirst({ where: { shopId: params.id, userId: payload.userId } });
    isMember = !!m;
  }
  if (!isOwner && !isMember && !isAdmin) {
    return NextResponse.json(createErrorResponse('FORBIDDEN','Cross-shop access denied',requestId,403),{status:403});
  }

  const products = await prisma.product.findMany({
    where: { shopId: params.id },
    include: { category: { select: { name: true } }, storageZone: { select: { name: true } } },
    orderBy: { name: 'asc' }
  });

  const { searchParams } = new URL(req.url);
  const format = searchParams.get('format') || 'csv';

  if (format === 'json') {
    return NextResponse.json({
      success: true,
      shopId: params.id,
      shopName: shop.name,
      total: products.length,
      products: products.map(p=>({
        name: p.name,
        sku: p.sku,
        pricePaise: (p as any).pricePaise,
        price: (p as any).pricePaise/100,
        compareAtPricePaise: (p as any).compareAtPricePaise,
        compareAtPrice: (p as any).compareAtPricePaise ? (p as any).compareAtPricePaise/100 : null,
        stock: p.stock,
        unit: p.unit,
        category: p.category?.name,
        discount: p.discount,
        taxRate: p.taxRate,
        description: p.description?.slice(0,100),
        isActive: p.isActive,
        storageZone: p.storageZone?.name,
        lowStockThreshold: p.lowStockThreshold
      })),
      requestId,
      exportedAt: new Date().toISOString()
    });
  }

  const headers = ['name','sku','price','compareAtPrice','stock','unit','category','discount','taxRate','storageZone','lowStockThreshold','isActive','description'];
  const csvRows = [headers.join(',')];
  
  for (const p of products) {
    const row = [
      `"${p.name.replace(/"/g,'""')}"`,
      p.sku,
      (p as any).pricePaise/100,
      ((p as any).compareAtPricePaise ? (p as any).compareAtPricePaise/100 : ""),
      p.stock,
      p.unit,
      p.category?.name || '',
      p.discount,
      p.taxRate,
      p.storageZone?.name || '',
      p.lowStockThreshold,
      p.isActive,
      `"${(p.description || '').replace(/"/g,'""').slice(0,200)}"`
    ];
    csvRows.push(row.join(','));
  }

  const csv = csvRows.join('\n');

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${shop.slug}-products-${new Date().toISOString().slice(0,10)}.csv"`,
      'X-Request-Id': requestId
    }
  });
}
