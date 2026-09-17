import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { aiService } from '@/lib/ai/service';

export async function POST(req: NextRequest) {
  try {
    const { query, shopId } = await req.json();
    if (!query) return NextResponse.json({ error: 'Query required' }, { status: 400 });

    const filters = await aiService.parseSearchQuery(query);

    const where: any = { isActive: true };
    if (shopId) where.shopId = shopId;

    // Build OR from keywords
    const keywords = filters.keywords || [query];
    where.OR = keywords.map((k: string) => ({
      OR: [
        { name: { contains: k } },
        { description: { contains: k } },
        { brand: { contains: k } },
        { searchableText: { contains: k.toLowerCase() } }
      ]
    })).flat();

    if (filters.category) {
      where.category = { name: { contains: filters.category } };
    }

    const products = await prisma.product.findMany({
      where,
      include: { images: true, category: true, shop: { select: { name: true, slug: true } } },
      take: 20
    });

    // If no exact match, try semantic fallback
    let message = `Found ${products.length} products`;
    if (products.length === 0) {
      message = `I couldn't find an exact match for "${query}" in ${shopId ? 'this shop' : 'catalog'}. Try broader terms.`;
    }

    return NextResponse.json({ products, filters, message });
  } catch (e: any) {
    console.error('AI search error', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
