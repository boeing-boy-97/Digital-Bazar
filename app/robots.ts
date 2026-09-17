import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://digital-bazar-three.vercel.app';
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/shops', '/shops/*', '/search', '/categories', '/c/*', '/about', '/contact', '/faq', '/privacy', '/terms', '/refunds', '/shipping', '/grievance'],
        disallow: ['/shopkeeper/*', '/admin/*', '/api/*', '/cart', '/orders/*', '/profile', '/favorites', '/notifications', '/customer/*', '/auth/*'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
