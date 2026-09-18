// Promotion validation - server-side, never trust frontend discount per point 43, 67
import prisma from '@/lib/db/prisma';

export async function validatePromotion(code: string, shopId: string, userId: string, orderTotalPaise: number, productIds?: string[]) {
  const promo = await prisma.promotion.findUnique({ where: { code } });
  if (!promo) return { valid: false, reason: 'Invalid coupon code' };
  if (!promo.isActive) return { valid: false, reason: 'Coupon inactive' };

  if (promo.shopId && promo.shopId !== shopId) return { valid: false, reason: 'Coupon not valid for this shop' };

  const now = new Date();
  if (promo.validFrom && now < promo.validFrom) return { valid: false, reason: 'Coupon not yet valid' };
  if (promo.validTill && now > promo.validTill) return { valid: false, reason: 'Coupon expired' };

  if (promo.minOrderPaise && orderTotalPaise < promo.minOrderPaise) {
    return { valid: false, reason: `Minimum order ₹${promo.minOrderPaise / 100} required` };
  }

  if (promo.usageLimit && promo.usageCount >= promo.usageLimit) {
    return { valid: false, reason: 'Coupon usage limit reached' };
  }

  if (promo.perUserLimit) {
    const userUsage = await prisma.auditLog.count({
      where: {
        actorId: userId,
        action: 'COUPON_USED',
        entity: 'Promotion',
        entityId: promo.id
      }
    });
    if (userUsage >= promo.perUserLimit) {
      return { valid: false, reason: 'You have reached usage limit for this coupon' };
    }
  }

  if (promo.eligibleProducts) {
    try {
      const eligible = JSON.parse(promo.eligibleProducts);
      if (Array.isArray(eligible) && eligible.length > 0 && productIds) {
        const hasEligible = productIds.some(id => eligible.includes(id));
        if (!hasEligible) return { valid: false, reason: 'Coupon not applicable to these products' };
      }
    } catch {}
  }

  let discountPaise = 0;
  if (promo.discountType === 'PERCENTAGE') {
    discountPaise = Math.round(orderTotalPaise * promo.discountValue / 100);
    if (promo.maxDiscountPaise && discountPaise > promo.maxDiscountPaise) {
      discountPaise = promo.maxDiscountPaise;
    }
  } else {
    discountPaise = promo.discountPaise || Math.round(promo.discountValue * 100);
  }

  discountPaise = Math.min(discountPaise, orderTotalPaise);

  return { valid: true, discountPaise, promotion: promo };
}
