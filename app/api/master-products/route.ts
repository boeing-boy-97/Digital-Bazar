import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { slugify } from '@/lib/utils/helpers';

export const dynamic = 'force-dynamic';

// GET /api/master-products - search master catalog for ALL products (medical to hardware)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || searchParams.get('q');
    const categoryId = searchParams.get('categoryId');
    const category = searchParams.get('category');
    const brand = searchParams.get('brand');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: any = { isActive: true };

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { brand: { contains: search } },
        { description: { contains: search } },
        { searchableText: { contains: search } }
      ];
    }

    if (categoryId) where.categoryId = categoryId;
    if (category) {
      const cat = await prisma.masterCategory.findFirst({ where: { slug: category } });
      if (cat) where.categoryId = cat.id;
    }
    if (brand) where.brand = { contains: brand };

    const [products, total] = await Promise.all([
      prisma.masterProduct.findMany({
        where,
        include: {
          category: true,
          images: { orderBy: { sortOrder: 'asc' } },
          variants: { where: { isActive: true } },
          _count: { select: { shopProducts: true } }
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { name: 'asc' }
      }),
      prisma.masterProduct.count({ where })
    ]);

    return NextResponse.json({ 
      products, 
      total, 
      page, 
      totalPages: Math.ceil(total / limit) 
    });
  } catch (e: any) {
    console.error('Master products fetch error', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST /api/master-products - create master product (admin only) - supports ALL categories
export async function POST(req: NextRequest) {
  try {
    const { cookies } = await import('next/headers');
    const { verifyToken } = await import('@/lib/auth/jwt');
    
    const cookieStore = cookies();
    const token = cookieStore.get('auth-token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const payload = verifyToken(token);
    if (!payload || !['admin', 'super_admin'].includes(payload.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { name, brand, categoryId, description, specifications, attributes, images, variants } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name required' }, { status: 400 });
    }

    const slug = body.slug || `${slugify(name)}-${Date.now().toString().slice(-4)}`;
    const searchableText = `${name} ${brand || ''} ${description || ''} ${JSON.stringify(attributes || {})}`.toLowerCase();

    const masterProduct = await prisma.masterProduct.create({
      data: {
        name,
        slug,
        brand,
        categoryId: categoryId || null,
        description,
        specifications: specifications ? JSON.stringify(specifications) : null,
        attributes: attributes ? JSON.stringify(attributes) : null,
        searchableText,
        images: images ? {
          create: images.map((img: any, idx: number) => ({
            url: img.url,
            alt: img.alt || name,
            sortOrder: idx
          }))
        } : undefined,
        variants: variants ? {
          create: variants.map((v: any) => ({
            name: v.name,
            sku: v.sku || `${slug}-${slugify(v.name)}-${Date.now().toString().slice(-4)}`,
            attributes: v.attributes ? JSON.stringify(v.attributes) : null
          }))
        } : undefined
      },
      include: {
        category: true,
        images: true,
        variants: true
      }
    });

    return NextResponse.json({ product: masterProduct }, { status: 201 });
  } catch (e: any) {
    console.error('Master product create error', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
