import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  
  // Real sitemap - only public routes, no private shopkeeper/admin/api/cart/orders
  // Production uses NEXT_PUBLIC_APP_URL env, fail-fast if not set in prod via validation
  return [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${baseUrl}/shops`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/search`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.7 },
    { url: `${baseUrl}/auth/login`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/auth/register`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    // Shop pages are dynamic - in production would fetch real shops from DB and add to sitemap
    // For now, static public routes only, real implementation would query prisma.shop.findMany({ where: { status: 'APPROVED' } })
  ];
}
