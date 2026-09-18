import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth/jwt';
import { generateRequestId, createErrorResponse, logStructured } from '@/lib/utils/requestId';
import { z } from 'zod';

const promotionSchema = z.object({
  code: z.string().min(3).max(20).regex(/^[A-Z0-9]+$/),
  description: z.string().max(200).optional(),
  discountType: z.enum(['PERCENTAGE', 'FLAT']),
  discountValue: z.number().min(1).max(10000),
  discountPaise: z.number().int().optional(),
  minOrderPaise: z.number().int().optional(),
  maxDiscountPaise: z.number().int().optional(),
  validFrom: z.string().optional(),
  validTill: z.string().optional(),
  usageLimit: z.number().int().optional(),
  perUserLimit: z.number().int().optional(),
  eligibleProducts: z.string().optional() // JSON
});

export async function POST(req: NextRequest) {
  const requestId = generateRequestId();
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('auth-token')?.value;
    if (!token) return NextResponse.json(createErrorResponse('UNAUTHORIZED', 'Auth required', requestId, 401), { status: 401 });
    const payload = verifyToken(token);
    if (!payload) return NextResponse.json(createErrorResponse('UNAUTHORIZED', 'Invalid session', requestId, 401), { status: 401 });

    if (!['shop_owner', 'shop_employee', 'admin', 'super_admin'].includes(payload.role)) {
      return NextResponse.json(createErrorResponse('FORBIDDEN', 'Forbidden', requestId, 403), { status: 403 });
    }

    const body = await req.json();
    const parsed = promotionSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json(createErrorResponse('VALIDATION_FAILED', 'Invalid promotion', requestId, 400, parsed.error.errors), { status: 400 });

    const data = parsed.data;

    // Get shopId from owner or body
    let shopId: string | null = null;
    if (payload.role === 'shop_owner') {
      const shop = await prisma.shop.findFirst({ where: { ownerId: payload.userId } });
      shopId = shop?.id || null;
    } else if (payload.role === 'shop_employee') {
      const member = await prisma.shopMember.findFirst({ where: { userId: payload.userId } });
      shopId = member?.shopId || null;
    } else if (body.shopId) {
      shopId = body.shopId;
    }

    // Validate discount
    if (data.discountType === 'PERCENTAGE' && (data.discountValue < 1 || data.discountValue > 100)) {
      return NextResponse.json(createErrorResponse('INVALID_DISCOUNT', 'Percentage must be 1-100', requestId, 400), { status: 400 });
    }

    // Calculate paise for FLAT
    const discountPaise = data.discountType === 'FLAT' ? Math.round(data.discountValue * 100) : (data.discountPaise || null);
    const minOrderPaise = data.minOrderPaise || (body.minOrder ? Math.round(body.minOrder * 100) : null);
    const maxDiscountPaise = data.maxDiscountPaise || (body.maxDiscount ? Math.round(body.maxDiscount * 100) : null);

    const existing = await prisma.promotion.findUnique({ where: { code: data.code } });
    if (existing) return NextResponse.json(createErrorResponse('CODE_EXISTS', 'Promotion code already exists', requestId, 409), { status: 409 });

    const promo = await prisma.promotion.create({
      data: {
        shopId,
        code: data.code,
        description: data.description || null,
        discountType: data.discountType,
        discountValue: data.discountValue,
        discountPaise,
        minOrderPaise,
        maxDiscountPaise,
        validFrom: data.validFrom ? new Date(data.validFrom) : null,
        validTill: data.validTill ? new Date(data.validTill) : null,
        usageLimit: data.usageLimit || null,
        perUserLimit: data.perUserLimit || null,
        eligibleProducts: data.eligibleProducts || null,
        isActive: true
      }
    });

    return NextResponse.json({ success: true, promotion: promo, requestId }, { status: 201 });

  } catch (e: any) {
    return NextResponse.json(createErrorResponse('CREATE_FAILED', e.message, requestId, 500), { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const requestId = generateRequestId();
  try {
    const { searchParams } = new URL(req.url);
    const shopId = searchParams.get('shopId');
    const activeOnly = searchParams.get('active') === 'true';

    const where: any = {};
    if (shopId) where.shopId = shopId;
    if (activeOnly) where.isActive = true;

    const promotions = await prisma.promotion.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    return NextResponse.json({ success: true, promotions, requestId });
  } catch (e: any) {
    return NextResponse.json(createErrorResponse('FETCH_FAILED', e.message, requestId, 500), { status: 500 });
  }
}

// validatePromotion moved to lib/promotions/validator.ts for reuse
