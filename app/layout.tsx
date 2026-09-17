import '@/styles/variables.css';
import '@/styles/globals.css';
import '@/styles/layout.css';
import '@/styles/components.css';
import '@/styles/forms.css';
import '@/styles/tables.css';
import { validateEnv } from '@/lib/env/validation';

try {
  validateEnv();
} catch (e: any) {
  if (process.env.NODE_ENV === 'production') {
    console.error('Env validation failed:', e.message);
  } else {
    console.warn('Env validation warning:', e.message);
  }
}

export const metadata = {
  title: 'Digital Bazar - Select Before You Arrive',
  description: 'Shop from nearby stores without the wait. Browse products, order ahead, and collect when ready. Supporting local hardware, building materials, paint, plumbing & more.',
  keywords: 'local shopping, nearby shops, hardware, building material, plumbing, paint, Digital Bazar, order ahead, pickup',
  authors: [{ name: 'Digital Bazar' }],
  icons: {
    icon: '/logo.svg',
    apple: '/icon-192.png',
  },
  openGraph: {
    title: 'Digital Bazar - Shop Local. Skip the Wait.',
    description: 'Browse products from nearby shops, order ahead, and collect when ready. Supporting local businesses in your area.',
    type: 'website',
    images: ['/icon-512.png'],
  },
  manifest: '/manifest.json',
};

export const viewport = {
  themeColor: '#0F766E',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/logo.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="theme-color" content="#0F766E" />
        <meta name="description" content="Digital Bazar - Shop from nearby stores without the wait. Browse, order ahead, and collect when ready." />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
