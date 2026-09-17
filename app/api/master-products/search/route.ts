import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

// GET /api/master-products/search?q=Redmi Note 15
// Returns master products with shop availability - for ALL categories (medical to hardware)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q') || searchParams.get('search') || '';
    const category = searchParams.get('category');
    const lat = searchParams.get('lat') ? parseFloat(searchParams.get('lat')!) : null;
    const lng = searchParams.get('lng') ? parseFloat(searchParams.get('lng')!) : null;

    if (!q.trim()) {
      return NextResponse.json({ products: [], shops: [] });
    }

    // Search master catalog
    const masterWhere: any = { isActive: true };
    masterWhere.OR = [
      { name: { contains: q } },
      { brand: { contains: q } },
      { searchableText: { contains: q.toLowerCase() } },
      { description: { contains: q } }
    ];

    if (category) {
      const cat = await prisma.masterCategory.findFirst({ where: { slug: category } });
      if (cat) masterWhere.categoryId = cat.id;
    }

    const masterProducts = await prisma.masterProduct.findMany({
      where: masterWhere,
      include: {
        category: true,
        images: { take: 1 },
        variants: { where: { isActive: true } },
        shopProducts: {
          where: { isActive: true, stock: { gt: 0 } },
          include: {
            shop: { select: { id: true, name: true, slug: true, latitude: true, longitude: true, address: true, rating: true, isPickupEnabled: true, isDeliveryEnabled: true } },
            storageZone: true
          },
          take: 10
        }
      },
      take: 20
    });

    // Also search shop products directly (for products not in master catalog yet)
    const shopProducts = await prisma.product.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { contains: q } },
          { brand: { contains: q } },
          { searchableText: { contains: q.toLowerCase() } }
        ]
      },
      include: {
        shop: { select: { id: true, name: true, slug: true, latitude: true, longitude: true, address: true, rating: true } },
        images: { take: 1 },
        category: true
      },
      take: 20
    });

    // Calculate distance if location provided
    let productsWithDistance = masterProducts;
    if (lat && lng) {
      const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
      };

      productsWithDistance = masterProducts.map(mp => ({
        ...mp,
        shopProducts: mp.shopProducts.map(sp => {
          if (sp.shop.latitude && sp.shop.longitude) {
            return {
              ...sp,
              distance: calculateDistance(lat, lng, sp.shop.latitude, sp.shop.longitude)
            };
          }
          return sp;
        }).sort((a: any, b: any) => (a.distance || 999) - (b.distance || 999))
      }));
    }

    return NextResponse.json({
      masterProducts: productsWithDistance,
      shopProducts,
      query: q,
      total: masterProducts.length + shopProducts.length
    });
  } catch (e: any) {
    console.error('Master search error', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
