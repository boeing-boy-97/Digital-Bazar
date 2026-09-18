// Repo: Product - typed, no Float, single truth inventory
import prisma from '@/lib/db/prisma';
import { calculateAvailable } from '@/lib/domain/inventory';
import { PAGINATION } from '@/lib/constants';

export interface ProductListParams {
  shopId?: string;
  categoryId?: string;
  search?: string;
  inStock?: boolean;
  page?: number;
  limit?: number;
  sortBy?: 'price_low' | 'price_high' | 'rating' | 'newest' | 'relevance';
  masterProductId?: string;
}

export async function findProducts(params: ProductListParams) {
  const {
    shopId,
    categoryId,
    search,
    inStock,
    page = 1,
    limit = PAGINATION.DEFAULT_LIMIT,
    sortBy = 'newest',
    masterProductId
  } = params;

  const where: any = { isActive: true };
  if (shopId) where.shopId = shopId;
  if (categoryId) where.categoryId = categoryId;
  if (masterProductId) where.masterProductId = masterProductId;
  if (inStock) where.stock = { gt: 0 };
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { brand: { contains: search } },
      { sku: { contains: search } },
      { searchableText: { contains: search.toLowerCase() } }
    ];
  }

  let orderBy: any = { createdAt: 'desc' };
  if (sortBy === 'price_low') orderBy = { pricePaise: 'asc' };
  if (sortBy === 'price_high') orderBy = { pricePaise: 'desc' };
  if (sortBy === 'rating') orderBy = { shop: { rating: 'desc' } };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        images: true,
        category: true,
        storageZone: true,
        shop: { select: { name: true, slug: true, city: true, rating: true, reviewCount: true, isPickupEnabled: true, isDeliveryEnabled: true, preparationTimeMin: true, businessHours: true } },
        masterProduct: true
      },
      skip: (page - 1) * limit,
      take: Math.min(limit, PAGINATION.MAX_LIMIT),
      orderBy
    }),
    prisma.product.count({ where })
  ]);

  // Enrich with derived available
  const enriched = products.map(p => ({
    ...p,
    available: calculateAvailable(p.stock, p.reservedStock || 0)
  }));

  return { products: enriched, total, page, totalPages: Math.ceil(total / limit) };
}

export async function findProductById(id: string) {
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      images: true,
      category: true,
      storageZone: true,
      shop: { select: { id: true, name: true, slug: true, address: true, city: true, pincode: true, rating: true, reviewCount: true, isPickupEnabled: true, isDeliveryEnabled: true, preparationTimeMin: true, businessHours: true, holidays: true, timezone: true, latitude: true, longitude: true } },
      masterProduct: true
    }
  });
  if (!product) return null;
  return {
    ...product,
    available: calculateAvailable(product.stock, product.reservedStock || 0)
  };
}

export async function findShopComparison(productId: string, masterProductId?: string | null, excludeShopId?: string) {
  if (!masterProductId) return [];
  const where: any = {
    masterProductId,
    isActive: true,
    id: { not: productId },
    shop: { status: 'APPROVED' }
  };
  if (excludeShopId) where.shopId = { not: excludeShopId };
  const products = await prisma.product.findMany({
    where,
    include: {
      shop: { select: { name: true, city: true, rating: true, reviewCount: true, isPickupEnabled: true, isDeliveryEnabled: true, preparationTimeMin: true, businessHours: true, latitude: true, longitude: true } }
    },
    orderBy: { pricePaise: 'asc' },
    take: 10
  });
  return products.map(p => ({
    ...p,
    available: calculateAvailable(p.stock, p.reservedStock || 0)
  }));
}
