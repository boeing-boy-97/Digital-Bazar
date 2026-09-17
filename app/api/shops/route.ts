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
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');
  const status = searchParams.get('status');

  const where: any = {};
  
  // Public only shows APPROVED, admin can see all
  if (status) {
    where.status = status;
  } else {
    where.status = 'APPROVED';
  }
  
  if (city) where.city = { contains: city };
  if (category) where.category = { contains: category };
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { category: { contains: search } },
      { description: { contains: search } },
      { city: { contains: search } }
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
        const R = 6371;
        const φ1 = latNum * Math.PI/180;
        const φ2 = shop.latitude! * Math.PI/180;
        const Δφ = (shop.latitude! - latNum) * Math.PI/180;
        const Δλ = (shop.longitude! - lngNum) * Math.PI/180;
        const a = Math.sin(Δφ/2)**2 + Math.cos(φ1)*Math.cos(φ2)*Math.sin(Δλ/2)**2;
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        distance = R * c;
      }
      return { ...shop, distance, isOpen: true };
    }).sort((a,b) => (a.distance||999)-(b.distance||999));
  }

  return NextResponse.json({ shops: shopsWithDistance });
}

function calculateCompletion(shop: any): number {
  let completed = 0;
  const total = 10;
  
  if (shop.name) completed++;
  if (shop.category) completed++;
  if (shop.description) completed++;
  if (shop.address) completed++;
  if (shop.city) completed++;
  if (shop.phone) completed++;
  if (shop.logoUrl) completed++;
  if (shop.openingHours && shop.closingHours) completed++;
  if (shop.latitude && shop.longitude) completed++;
  if (shop.gstin || shop.businessInfo) completed++;
  
  return Math.round((completed / total) * 100);
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

    // Enhanced fields for ALL product types (medical to hardware)
    const shopData: any = {
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
      status: 'PENDING_REVIEW',
      openingHours: body.openingHours || '09:00',
      closingHours: body.closingHours || '20:00',
      holidays: body.holidays ? JSON.stringify(body.holidays) : null,
      gstin: body.gstin || null,
      businessInfo: body.businessInfo ? JSON.stringify(body.businessInfo) : null,
      bankDetails: body.bankDetails ? JSON.stringify(body.bankDetails) : null,
      logoUrl: body.logoUrl || null,
      coverUrl: body.coverUrl || null,
      preparationTimeMin: body.preparationTimeMin || 15
    };

    shopData.completionPercent = calculateCompletion(shopData);

    const shop = await prisma.shop.create({
      data: shopData
    });

    // Create default zones for ALL product types (not just building material)
    const defaultZones = [
      { name: 'Zone A - General', code: 'ZONE_A', description: 'General items, fast moving', sortOrder: 0 },
      { name: 'Zone B - Building Material', code: 'ZONE_B', description: 'Cement, bricks, sand', sortOrder: 1 },
      { name: 'Zone C - Plumbing', code: 'ZONE_C', description: 'Pipes, fittings, sanitary', sortOrder: 2 },
      { name: 'Zone D - Electrical', code: 'ZONE_D', description: 'Wires, switches, lights', sortOrder: 3 },
      { name: 'Zone E - Paint & Hardware', code: 'ZONE_E', description: 'Paint, tools, hardware', sortOrder: 4 },
      { name: 'Zone F - Medical & Others', code: 'ZONE_F', description: 'Medical, daily needs, others', sortOrder: 5 },
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
        entityId: shop.id,
        metadata: JSON.stringify({ name: shop.name, completion: shopData.completionPercent })
      }
    });

    return NextResponse.json({ 
      shop, 
      message: 'Shop created successfully. Pending admin approval.',
      completion: shopData.completionPercent
    }, { status: 201 });
  } catch (e: any) {
    console.error('Shop create error', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
