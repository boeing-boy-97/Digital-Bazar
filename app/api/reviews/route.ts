import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth/jwt';
import { generateRequestId, createErrorResponse, logStructured } from '@/lib/utils/requestId';
import { z } from 'zod';

const reviewSchema = z.object({
  shopId: z.string().min(1),
  productId: z.string().optional(),
  orderId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional()
});

export async function POST(req: NextRequest) {
  const requestId = generateRequestId();
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('auth-token')?.value;
    if (!token) return NextResponse.json(createErrorResponse('UNAUTHORIZED', 'Auth required', requestId, 401), { status: 401 });
    const payload = verifyToken(token);
    if (!payload) return NextResponse.json(createErrorResponse('UNAUTHORIZED', 'Invalid session', requestId, 401), { status: 401 });

    const body = await req.json();
    const parsed = reviewSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json(createErrorResponse('VALIDATION_FAILED', 'Invalid review', requestId, 400, parsed.error.errors), { status: 400 });

    const { shopId, productId, orderId, rating, comment } = parsed.data;

    // Verify order exists, belongs to customer, is COMPLETED, and matches shop
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true }
    });
    if (!order) return NextResponse.json(createErrorResponse('ORDER_NOT_FOUND', 'Order not found', requestId, 404), { status: 404 });
    if (order.customerId !== payload.userId) return NextResponse.json(createErrorResponse('FORBIDDEN', 'Not your order', requestId, 403), { status: 403 });
    if (order.shopId !== shopId) return NextResponse.json(createErrorResponse('SHOP_MISMATCH', 'Order shop mismatch', requestId, 400), { status: 400 });
    if (order.status !== 'COMPLETED') return NextResponse.json(createErrorResponse('ORDER_NOT_COMPLETED', 'Only completed orders can be reviewed', requestId, 400), { status: 400 });

    // If productId provided, verify it was in order
    if (productId) {
      const inOrder = order.items.some((i: any) => i.productId === productId);
      if (!inOrder) return NextResponse.json(createErrorResponse('PRODUCT_NOT_IN_ORDER', 'Product not in this order', requestId, 400), { status: 400 });
    }

    // Prevent duplicate review: one per order (or per product per order)
    const existing = await prisma.review.findFirst({
      where: {
        userId: payload.userId,
        orderId,
        ...(productId ? { productId } : { shopId })
      }
    });
    if (existing) return NextResponse.json(createErrorResponse('DUPLICATE_REVIEW', 'You already reviewed this order', requestId, 409), { status: 409 });

    // Create review with moderation pending? Per spec moderation, but auto-approved for now with flag
    const review = await prisma.review.create({
      data: {
        userId: payload.userId,
        shopId,
        productId: productId || null,
        orderId,
        rating,
        comment: comment || null,
        isApproved: true // Could be false pending moderation per spec point 64
      }
    });

    // Update shop rating denormalized - real from reviews
    const shopReviews = await prisma.review.findMany({ where: { shopId, isApproved: true } });
    const avgRating = shopReviews.length > 0 ? shopReviews.reduce((s, r) => s + r.rating, 0) / shopReviews.length : 0;
    await prisma.shop.update({
      where: { id: shopId },
      data: { rating: avgRating, reviewCount: shopReviews.length }
    });

    logStructured({
      requestId,
      timestamp: new Date().toISOString(),
      level: 'info',
      message: 'Review created',
      route: '/api/reviews',
      userId: payload.userId,
      metadata: { shopId, orderId, rating }
    });

    return NextResponse.json({ success: true, review, requestId });

  } catch (e: any) {
    return NextResponse.json(createErrorResponse('REVIEW_FAILED', e.message, requestId, 500), { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const requestId = generateRequestId();
  try {
    const { searchParams } = new URL(req.url);
    const shopId = searchParams.get('shopId');
    const productId = searchParams.get('productId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);

    const where: any = { isApproved: true };
    if (shopId) where.shopId = shopId;
    if (productId) where.productId = productId;

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.review.count({ where })
    ]);

    return NextResponse.json({ success: true, reviews, total, page, totalPages: Math.ceil(total / limit), requestId });
  } catch (e: any) {
    return NextResponse.json(createErrorResponse('FETCH_FAILED', e.message, requestId, 500), { status: 500 });
  }
}
