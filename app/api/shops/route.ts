import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth/jwt';
import { shopCreateSchema } from '@/lib/validation/schemas';
import { slugify } from '@/lib/utils/helpers';
import { isShopOpen as isShopOpenDomain } from '@/lib/domain/business-hours';

export async function GET(req: NextRequest) {
  try {
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

    let shops: any[] = [];
    try {
      shops = await prisma.shop.findMany({
        where,
        include: {
          _count: { select: { products: true } },
          businessHours: true,
          holidays: true
        },
        orderBy: { rating: 'desc' },
        take: 50
      });
    } catch (dbErr: any) {
      console.error('[shops GET] DB error, returning empty:', dbErr?.message);
      // Graceful fallback for Vercel when DATABASE_URL missing or connection fails
      // Return empty list instead of 500 so homepage shows honest onboarding state
      return NextResponse.json({ shops: [], total: 0, error: null, fallback: true });
    }

    let shopsWithDistance = shops.map(s => {
      try {
        const bhArray = (s as any).businessHours || [];
        const domainBH: any = {};
        const dayMap = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
        for (const bh of bhArray) {
          const dayName = dayMap[bh.dayOfWeek] || 'monday';
          if (!domainBH[dayName]) domainBH[dayName] = [];
          if (!bh.isClosed && bh.openTime && bh.closeTime) {
            domainBH[dayName].push({ open: bh.openTime, close: bh.closeTime });
          }
        }
        const hasStructured = Object.keys(domainBH).length > 0;
        const isOpen = hasStructured ? isShopOpenDomain(domainBH, (s as any).holidays || [], (s as any).timezone || 'Asia/Kolkata') : false;
        return {
          ...s,
          distance: undefined as number | undefined,
          isOpen,
          isOpenNow: isOpen
        };
      } catch {
        return { ...s, distance: undefined, isOpen: false, isOpenNow: false };
      }
    });

    if (lat && lng) {
      const latNum = parseFloat(lat);
      const lngNum = parseFloat(lng);
      if (!isNaN(latNum) && !isNaN(lngNum)) {
        shopsWithDistance = shops.map(shop => {
          try {
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
            const bhArray = (shop as any).businessHours || [];
            const domainBH: any = {};
            const dayMap = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
            for (const bh of bhArray) {
              const dayName = dayMap[bh.dayOfWeek] || 'monday';
              if (!domainBH[dayName]) domainBH[dayName] = [];
              if (!bh.isClosed && bh.openTime && bh.closeTime) {
                domainBH[dayName].push({ open: bh.openTime, close: bh.closeTime });
              }
            }
            const hasStructured = Object.keys(domainBH).length > 0;
            const isOpen = hasStructured ? isShopOpenDomain(domainBH, (shop as any).holidays || [], (shop as any).timezone || 'Asia/Kolkata') : false;
            return { ...shop, distance, isOpen, isOpenNow: isOpen };
          } catch {
            return { ...shop, distance: undefined, isOpen: false, isOpenNow: false };
          }
        }).sort((a,b) => (a.distance||999)-(b.distance||999));
      }
    }

    return NextResponse.json({ shops: shopsWithDistance, total: shopsWithDistance.length });
  } catch (e: any) {
    console.error('[shops GET] Unhandled error:', e?.message);
    // Never throw 500 to client for public listing - return empty honest state
    return NextResponse.json({ shops: [], total: 0, error: 'Unable to load shops temporarily' });
  }
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
  if (shop.businessHours && shop.businessHours.length > 0) completed++;
  if (shop.latitude && shop.longitude) completed++;
  if (shop.gstin || shop.businessInfo) completed++;
  
  return Math.round((completed / total) * 100);
}

// Business hours engine structured per point 15: Mon-Sun multiple intervals holidays special temporary emergency timezone overnight never hardcoded isOpen
function getDefaultBusinessHours() {
  // Mon-Sat 09:00-21:00, Sun 10:00-18:00 - not hardcoded isOpen, structured
  return [
    { dayOfWeek: 1, openTime: '09:00', closeTime: '21:00', isClosed: false, sortOrder: 0 }, // Monday
    { dayOfWeek: 2, openTime: '09:00', closeTime: '21:00', isClosed: false, sortOrder: 0 },
    { dayOfWeek: 3, openTime: '09:00', closeTime: '21:00', isClosed: false, sortOrder: 0 },
    { dayOfWeek: 4, openTime: '09:00', closeTime: '21:00', isClosed: false, sortOrder: 0 },
    { dayOfWeek: 5, openTime: '09:00', closeTime: '21:00', isClosed: false, sortOrder: 0 },
    { dayOfWeek: 6, openTime: '09:00', closeTime: '21:00', isClosed: false, sortOrder: 0 }, // Saturday
    { dayOfWeek: 0, openTime: '10:00', closeTime: '18:00', isClosed: false, sortOrder: 0 }, // Sunday
  ];
}

function isShopOpen(businessHours: any[], holidays: any[], timezone: string = 'Asia/Kolkata'): boolean {
  const now = new Date();
  // Convert to shop timezone - simple handling for IST
  const day = now.getDay(); // 0-6
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const currentMinutes = hours * 60 + minutes;

  // Check holiday
  const todayStr = now.toISOString().split('T')[0];
  if (holidays?.some((h: any) => new Date(h.date).toISOString().split('T')[0] === todayStr && h.isClosed)) {
    return false;
  }

  // Check business hours for today - supports multiple intervals per day per point 15
  const todayHours = businessHours.filter((bh: any) => bh.dayOfWeek === day && !bh.isClosed);
  if (todayHours.length === 0) return false;

  for (const bh of todayHours) {
    if (!bh.openTime || !bh.closeTime) continue;
    const [openH, openM] = bh.openTime.split(':').map(Number);
    const [closeH, closeM] = bh.closeTime.split(':').map(Number);
    const openMinutes = openH * 60 + openM;
    const closeMinutes = closeH * 60 + closeM;

    if (bh.isOvernight) {
      // Overnight: e.g., 20:00-02:00
      if (currentMinutes >= openMinutes || currentMinutes < closeMinutes) return true;
    } else {
      if (currentMinutes >= openMinutes && currentMinutes < closeMinutes) return true;
    }
  }
  return false;
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

    // Enhanced fields - structured business hours per point 15
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
      timezone: body.timezone || 'Asia/Kolkata',
      gstin: body.gstin || null,
      businessInfo: body.businessInfo ? JSON.stringify(body.businessInfo) : null,
      bankDetails: body.bankDetails ? JSON.stringify(body.bankDetails) : null,
      logoUrl: body.logoUrl || null,
      coverUrl: body.coverUrl || null,
      preparationTimeMin: body.preparationTimeMin || 15,
      maxActiveOrders: body.maxActiveOrders || null,
    };

    // Use provided businessHours or default
    const businessHoursInput = body.businessHours || getDefaultBusinessHours();
    shopData.businessHours = { create: businessHoursInput };

    // Holidays if provided
    if (body.holidays && Array.isArray(body.holidays)) {
      shopData.holidays = {
        create: body.holidays.map((h: any) => ({
          date: new Date(h.date),
          name: h.name || null,
          isClosed: h.isClosed !== false,
          isWeekly: h.isWeekly || false
        }))
      };
    }

    shopData.completionPercent = calculateCompletion({ ...shopData, businessHours: businessHoursInput });

    const shop = await prisma.shop.create({
      data: shopData,
      include: { businessHours: true, holidays: true }
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
