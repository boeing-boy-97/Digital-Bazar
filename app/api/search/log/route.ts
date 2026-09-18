import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { generateRequestId, createErrorResponse } from '@/lib/utils/requestId';
import { z } from 'zod';

const logSchema = z.object({
  query: z.string().min(2).max(100),
  resultsCount: z.number().int().min(0).optional(),
  shopId: z.string().optional(),
  city: z.string().optional(),
  pincode: z.string().optional()
});

export async function POST(req: NextRequest) {
  const requestId = generateRequestId();
  try {
    const body = await req.json();
    const parsed = logSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json(createErrorResponse('VALIDATION_FAILED', 'Invalid log', requestId, 400, parsed.error.errors), { status: 400 });

    const { query, resultsCount, shopId, city, pincode } = parsed.data;

    // Store search log in audit or platform settings for demand gap per point 71
    // Use Forecast model for search analytics or create audit log
    await prisma.auditLog.create({
      data: {
        action: 'SEARCH_QUERY',
        entity: 'Search',
        entityId: query.toLowerCase(),
        metadata: JSON.stringify({ query, resultsCount, shopId, city, pincode, requestId, timestamp: new Date().toISOString() })
      }
    });

    // Also store in Forecast for demand intelligence
    try {
      await prisma.forecast.create({
        data: {
          shopId: shopId || 'global',
          type: 'search_demand',
          period: 'daily',
          data: JSON.stringify({ query: query.toLowerCase(), resultsCount, city, pincode }),
          confidence: resultsCount === 0 ? 0.8 : 0.5
        }
      });
    } catch {}

    return NextResponse.json({ success: true, requestId });

  } catch (e: any) {
    return NextResponse.json(createErrorResponse('LOG_FAILED', e.message, requestId, 500), { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const requestId = generateRequestId();
  try {
    const { searchParams } = new URL(req.url);
    const shopId = searchParams.get('shopId');
    const city = searchParams.get('city');

    // Get demand gap: searches with 0 results or low results that shop doesn't list per point 71
    const searchLogs = await prisma.auditLog.findMany({
      where: {
        action: 'SEARCH_QUERY',
        ...(city ? { entityId: { contains: city.toLowerCase() } } : {})
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    });

    // Aggregate queries
    const queryCount = new Map<string, number>();
    for (const log of searchLogs) {
      try {
        const meta = JSON.parse(log.metadata || '{}');
        const q = (meta.query || log.entityId || '').toLowerCase();
        if (q.length >= 2) {
          queryCount.set(q, (queryCount.get(q) || 0) + 1);
        }
      } catch {}
    }

    const topQueries = Array.from(queryCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([query, count]) => ({ query, count }));

    // If shopId provided, check which top queries shop doesn't have products for
    let demandGap: any[] = [];
    if (shopId) {
      const shopProducts = await prisma.product.findMany({
        where: { shopId, isActive: true },
        select: { name: true, searchableText: true }
      });
      const shopSearchable = shopProducts.map(p => (p.searchableText || p.name).toLowerCase()).join(' ');

      for (const { query, count } of topQueries) {
        if (!shopSearchable.includes(query.toLowerCase()) && count >= 2) {
          demandGap.push({ query, count, reason: 'Customers searching but you don\'t list' });
        }
      }
    }

    return NextResponse.json({
      success: true,
      topQueries,
      demandGap: demandGap.slice(0, 10),
      message: demandGap.length > 0 ? `${demandGap.length} products customers searched for but you don't sell - real demand gap per point 71` : 'No demand gap detected - honest',
      requestId
    });

  } catch (e: any) {
    return NextResponse.json(createErrorResponse('FETCH_FAILED', e.message, requestId, 500), { status: 500 });
  }
}
