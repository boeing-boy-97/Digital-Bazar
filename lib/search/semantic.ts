// Semantic search with pgvector or fallback keyword search
// For SQLite dev, we use keyword + searchableText, for Postgres we would use pgvector

import prisma from '@/lib/db/prisma';

export interface SearchFilters {
  category?: string;
  brand?: string;
  size?: string;
  features?: string[];
  keywords?: string[];
  use_case?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
}

export async function semanticSearch(query: string, filters: SearchFilters, shopId?: string) {
  // In production with pgvector:
  // 1. Generate embedding for query via OpenAI embeddings API
  // 2. Query products with vector similarity: ORDER BY embedding <-> query_embedding LIMIT 20
  // For now, fallback to keyword search using searchableText

  const where: any = { isActive: true };
  if (shopId) where.shopId = shopId;
  if (filters.inStock) where.stock = { gt: 0 };
  if (filters.minPrice || filters.maxPrice) {
    where.price = {};
    if (filters.minPrice) where.price.gte = filters.minPrice;
    if (filters.maxPrice) where.price.lte = filters.maxPrice;
  }

  // Build OR from keywords + features + use_case
  const terms = [
    ...(filters.keywords || []),
    ...(filters.features || []),
    ...(filters.use_case ? [filters.use_case] : []),
    query
  ].filter(Boolean);

  if (terms.length > 0) {
    where.OR = terms.map(term => ({
      OR: [
        { name: { contains: term } },
        { description: { contains: term } },
        { brand: { contains: term } },
        { searchableText: { contains: term.toLowerCase() } }
      ]
    })).flat();
  }

  if (filters.category) {
    // Try category relation first, fallback to category name contains
    const products = await prisma.product.findMany({
      where: {
        ...where,
        category: { name: { contains: filters.category } }
      },
      include: { images: true, category: true, shop: { select: { name: true, slug: true } } },
      take: 20
    });
    
    if (products.length > 0) return products;
    
    // Fallback without category filter if no results
    return prisma.product.findMany({
      where,
      include: { images: true, category: true, shop: { select: { name: true, slug: true } } },
      take: 20
    });
  }

  return prisma.product.findMany({
    where,
    include: { images: true, category: true, shop: { select: { name: true, slug: true } } },
    take: 20
  });
}

export async function generateEmbedding(text: string): Promise<number[]> {
  // In production: call OpenAI embeddings API
  // const response = await openai.embeddings.create({ model: "text-embedding-3-small", input: text });
  // return response.data[0].embedding;
  
  // Mock embedding for dev: hash text to vector
  const mockVector = Array(1536).fill(0).map((_, i) => {
    let hash = 0;
    for (let j = 0; j < text.length; j++) {
      hash = ((hash << 5) - hash) + text.charCodeAt(j) + i;
      hash |= 0;
    }
    return (hash % 1000) / 1000;
  });
  
  return mockVector;
}
