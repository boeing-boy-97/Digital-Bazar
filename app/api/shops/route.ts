import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth/jwt';
import { shopCreateSchema } from '@/lib/validation/schemas';
import { slugify } from '@/lib/utils/helpers';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const city = searchParams.get('city');
  const category = searchParams.get('category');
  const search = searchParams.get('search');
  const openNow = searchParams.get('openNow');
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');

  const where: any = { status: 'APPROVED' };
  
  if (city) where.city = { contains: city };
  if (category) where.category = { contains: category };
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { category: { contains: search } },
      { description: { contains: search } }
    ];
  }

  const shops = await prisma.shop.findMany({
    where,
    include: {
      _count: { select: { products: true } }
    },
    orderBy: { rating: 'desc' },
    take: 50
  });

  // Calculate distance if lat/lng provided
  let shopsWithDistance = shops.map(s => ({
    ...s,
    distance: undefined as number | undefined,
    isOpen: true
  }));

  if (lat && lng) {
    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    shopsWithDistance = shops.map(shop => {
      let distance;
      if (shop.latitude && shop.longitude) {
        const R = 6371e3;
        const φ1 = latNum * Math.PI/180;
        const φ2 = shop.latitude! * Math.PI/180;
        const Δφ = (shop.latitude! - latNum) * Math.PI/180;
        const Δλ = (shop.longitude! - lngNum) * Math.PI/180;
        const a = Math.sin(Δφ/2)**2 + Math.cos(φ1)*Math.cos(φ2)*Math.sin(Δλ/2)**2;
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        distance = R * c;
      }
      return { ...shop, distance, isOpen: true };
    }).sort((a,b) => (a.distance||0)-(b.distance||0));
  }

  return NextResponse.json({ shops: shopsWithDistance });
}

export async function POST(req: NextRequest) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('auth-token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if (!['shop_owner','admin','super_admin'].includes(payload.role)) {
      return NextResponse.json({ error: 'Forbidden - need shop_owner role' }, { status: 403 });
    }

    const body = await req.json();
    const parsed = shopCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.errors }, { status: 400 });
    }

    const data = parsed.data;
    const slug = `${slugify(data.name)}-${Date.now().toString().slice(-4)}`;

    const shop = await prisma.shop.create({
      data: {
        ownerId: payload.userId,
        name: data.name,
        slug,
        category: data.category,
        description: data.description,
        address: data.address,
        city: data.city,
        pincode: data.pincode,
        latitude: data.latitude,
        longitude: data.longitude,
        phone: data.phone,
        email: data.email,
        isPickupEnabled: data.isPickupEnabled,
        isDeliveryEnabled: data.isDeliveryEnabled,
        status: 'PENDING_REVIEW'
      }
    });

    // Create default zones
    const defaultZones = [
      { name: 'Zone A - Building Material', code: 'ZONE_A', sortOrder: 1 },
      { name: 'Zone B - Plumbing', code: 'ZONE_B', sortOrder: 2 },
      { name: 'Zone C - Paint', code: 'ZONE_C', sortOrder: 3 },
      { name: 'Zone D - Hardware', code: 'ZONE_D', sortOrder: 4 },
      { name: 'Zone E - Electrical', code: 'ZONE_E', sortOrder: 5 },
    ];

    for (const z of defaultZones) {
      await prisma.storageZone.create({
        data: { shopId: shop.id, ...z }
      });
    }

    await prisma.auditLog.create({
      data: {
        actorId: payload.userId,
        action: 'SHOP_CREATED',
        entity: 'Shop',
        entityId: shop.id
      }
    });

    return NextResponse.json({ shop, message: 'Shop created, pending admin approval' }, { status: 201 });
  } catch (e: any) {
    console.error('Shop create error', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
