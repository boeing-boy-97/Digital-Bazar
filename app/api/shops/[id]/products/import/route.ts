import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth/jwt';
import { generateRequestId, createErrorResponse, logStructured } from '@/lib/utils/requestId';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
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
  if (!isOwner && !isAdmin) {
    const member = await prisma.shopMember.findFirst({ where: { shopId: params.id, userId: payload.userId } });
    if (!member || !member.permission.includes('product_manage')) {
      return NextResponse.json(createErrorResponse('FORBIDDEN','No permission to import products',requestId,403),{status:403});
    }
  }

  const body = await req.json();
  const { products, csv } = body;

  let parsedProducts: any[] = [];

  if (csv && typeof csv === 'string') {
    const lines = csv.trim().split('\n');
    const headers = lines[0].split(',').map((h:string)=>h.trim().toLowerCase());
    const requiredHeaders = ['name','price'];
    for (const rh of requiredHeaders) {
      if (!headers.includes(rh)) {
        return NextResponse.json(createErrorResponse('INVALID_CSV',`CSV missing required header: ${rh}. Required: name,price. Optional: sku,stock,unit,category,discount,taxRate,description`,requestId,400),{status:400});
      }
    }

    for (let i=1;i<lines.length;i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const values = line.split(',').map((v:string)=>v.trim());
      const obj: any = {};
      headers.forEach((h:string, idx:number)=>{ obj[h] = values[idx] || ''; });
      
      if (!obj.name) continue;
      const price = parseFloat(obj.price);
      if (isNaN(price) || price <= 0) {
        return NextResponse.json(createErrorResponse('INVALID_CSV',`Line ${i+1}: invalid price ${obj.price}`,requestId,400),{status:400});
      }
      
      parsedProducts.push({
        name: obj.name,
        sku: obj.sku || `SKU-${Date.now()}-${i}`,
        price,
        stock: parseInt(obj.stock) || 0,
        unit: obj.unit || 'pcs',
        discount: parseFloat(obj.discount) || 0,
        taxRate: parseFloat(obj.taxrate) || parseFloat(obj.tax_rate) || 18,
        description: obj.description || '',
        categoryName: obj.category || 'General'
      });
    }
  } else if (Array.isArray(products)) {
    parsedProducts = products;
  } else {
    return NextResponse.json(createErrorResponse('INVALID_BODY','Provide products array or csv string',requestId,400),{status:400});
  }

  if (parsedProducts.length === 0) {
    return NextResponse.json(createErrorResponse('EMPTY_IMPORT','No valid products to import',requestId,400),{status:400});
  }

  if (parsedProducts.length > 500) {
    return NextResponse.json(createErrorResponse('TOO_MANY','Max 500 products per import',requestId,400),{status:400});
  }

  const categoryMap = new Map<string, string>();
  const uniqueCategories = [...new Set(parsedProducts.map(p=>p.categoryName).filter(Boolean))];
  for (const catName of uniqueCategories) {
    let cat = await prisma.category.findFirst({ where: { name: catName as string } });
    if (!cat) {
      cat = await prisma.category.create({ data: { name: catName as string, slug: (catName as string).toLowerCase().replace(/\s+/g,'-') } });
    }
    categoryMap.set(catName as string, cat.id);
  }

  const defaultCategoryId = categoryMap.get(parsedProducts[0].categoryName) || (await prisma.category.findFirst())?.id;

  let imported = 0;
  let errors: any[] = [];

  for (let i=0;i<parsedProducts.length;i++) {
    const p = parsedProducts[i];
    try {
      if (!p.name || !p.price) {
        errors.push({ index: i, error: 'Missing name or price' });
        continue;
      }

      if (p.sku) {
        const dup = await prisma.product.findFirst({ where: { shopId: params.id, sku: p.sku } });
        if (dup) {
          errors.push({ index: i, sku: p.sku, error: 'SKU already exists in shop' });
          continue;
        }
      }

      await prisma.product.create({
        data: {
          shopId: params.id,
          name: p.name,
          slug: `${p.name.toLowerCase().replace(/\s+/g,'-')}-${Date.now()}-${i}`,
          sku: p.sku || `SKU-${Date.now()}-${i}`,
          description: p.description || '',
          pricePaise: Math.round(parseFloat(p.price)*100),
          compareAtPricePaise: p.mrp ? Math.round(parseFloat(p.mrp)*100) : p.compareAtPrice ? Math.round(parseFloat(p.compareAtPrice)*100) : null,
          stock: parseInt(p.stock) || 0,
          unit: p.unit || 'pcs',
          discount: parseFloat(p.discount) || 0,
          taxRate: parseFloat(p.taxRate) || 18,
          categoryId: (p.categoryName && categoryMap.get(p.categoryName)) || defaultCategoryId || '',
          isActive: true,
          minOrderQty: 1
        }
      });
      imported++;
    } catch (e:any) {
      errors.push({ index: i, error: e.message });
    }
  }

  await prisma.auditLog.create({
    data: {
      actorId: payload.userId,
      action: 'PRODUCTS_IMPORTED',
      entity: 'Shop',
      entityId: params.id,
      metadata: JSON.stringify({ imported, total: parsedProducts.length, errors: errors.length, requestId })
    }
  });

  logStructured({
    requestId,
    timestamp: new Date().toISOString(),
    level: 'info',
    message: `CSV import completed: ${imported} imported`,
    route: `/api/shops/${params.id}/products/import`,
    shopId: params.id,
    userId: payload.userId,
    metadata: { imported, errors: errors.length }
  });

  return NextResponse.json({
    success: true,
    imported,
    total: parsedProducts.length,
    errors,
    requestId,
    message: `${imported} products imported successfully${errors.length ? `, ${errors.length} errors` : ''}`
  });
}
