// Repo: Shop - structured business hours, status, inventory intelligence
import prisma from '@/lib/db/prisma';
import { isShopOpen, getNextOpenTime } from '@/lib/domain/business-hours';
import { SHOP } from '@/lib/constants';

export async function findShopById(id: string) {
  const shop = await prisma.shop.findUnique({
    where: { id },
    include: { owner: { select: { name: true, phone: true } }, _count: { select: { products: true } }, businessHours: true, holidays: true }
  });
  if (!shop) return null;
  // Convert BusinessHour array to domain format
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
  const holidays = (shop as any).holidays || [];
  const nowOpen = hasStructured ? isShopOpen(domainBH, holidays, (shop as any).timezone || 'Asia/Kolkata') : false;
  const nextOpen = hasStructured ? getNextOpenTime(domainBH, holidays, (shop as any).timezone || 'Asia/Kolkata') : null;
  return {
    ...shop,
    isOpenNow: nowOpen,
    nextOpenTime: nextOpen
  };
}

export async function findShops(params: { city?: string; status?: string; page?: number; limit?: number; search?: string }) {
  const where: any = {};
  if (params.city) where.city = params.city;
  if (params.status) where.status = params.status;
  else where.status = SHOP.STATUS.APPROVED;
  if (params.search) {
    where.OR = [
      { name: { contains: params.search } },
      { city: { contains: params.search } },
      { address: { contains: params.search } }
    ];
  }
  const page = params.page || 1;
  const limit = params.limit || 20;
  const [shops, total] = await Promise.all([
    prisma.shop.findMany({
      where,
      include: { _count: { select: { products: true } }, businessHours: true, holidays: true },
      orderBy: { rating: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    }),
    prisma.shop.count({ where })
  ]);

  const enriched = shops.map(shop => {
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
    const holidays = (shop as any).holidays || [];
    const isOpen = hasStructured ? isShopOpen(domainBH, holidays, (shop as any).timezone || 'Asia/Kolkata') : false;
    return { ...shop, isOpenNow: isOpen };
  });

  return { shops: enriched, total, page, totalPages: Math.ceil(total / limit) };
}

export async function updateShopStatus(shopId: string, status: string, actorId: string, reason?: string) {
  const shop = await prisma.shop.findUnique({ where: { id: shopId } });
  if (!shop) throw new Error('Shop not found');
  const updated = await prisma.shop.update({
    where: { id: shopId },
    data: { status }
  });
  await prisma.auditLog.create({
    data: {
      actorId,
      action: 'SHOP_STATUS_CHANGE',
      entity: 'Shop',
      entityId: shopId,
      metadata: JSON.stringify({ before: { status: shop.status }, after: { status }, reason: reason || `Status changed to ${status}` })
    }
  });
  return updated;
}
