import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/shops', '/products/*', '/search'],
      disallow: ['/shopkeeper/*', '/admin/*', '/api/*', '/cart', '/orders/*', '/profile', '/favorites'],
    },
    sitemap: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/sitemap.xml`,
  };
}
