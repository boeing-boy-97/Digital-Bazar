import '@/styles/variables.css';
import '@/styles/globals.css';
import '@/styles/layout.css';
import '@/styles/components.css';
import '@/styles/forms.css';
import '@/styles/tables.css';
import '@/styles/responsive.css';
import '@/styles/elite-polish.css';
import { validateEnv } from '@/lib/env/validation';
import { CookieConsent } from '@/components/layout/CookieConsent';

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
  title: {
    default: 'Digital Bazar - Shop Local. Skip the Wait. Real inventory from Nagpur shops',
    template: '%s | Digital Bazar',
  },
  description: 'Browse real inventory from verified local shops in Nagpur. Order ahead, get notified when ready, and collect with QR verification. Medical to hardware, all categories. Real shops, real photos, no fake stock.',
  keywords: 'local shopping, nearby shops, Digital Bazar, order ahead, pickup, medical, hardware, building material, grocery, Nagpur, real inventory',
  authors: [{ name: 'Digital Bazar' }],
  icons: {
    icon: '/logo.svg',
    apple: '/icon-192.png',
  },
  openGraph: {
    title: 'Digital Bazar - Shop Local. Skip the Wait.',
    description: 'Browse real products from verified local shops in Nagpur. Order ahead, get notified when ready, and collect with QR verification. Real inventory only.',
    type: 'website',
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Digital Bazar - Local commerce marketplace in Nagpur' }],
  },
  manifest: '/manifest.json',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://digital-bazar-three.vercel.app'),
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
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@600;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/logo.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="theme-color" content="#0F766E" />
      </head>
      <body>
        <div id="main-content">{children}</div>
        <CookieConsent />
      </body>
    </html>
  );
}
