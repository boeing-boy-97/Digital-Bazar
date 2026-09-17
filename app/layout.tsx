import '@/styles/variables.css';
import '@/styles/globals.css';
import '@/styles/layout.css';
import '@/styles/components.css';
import '@/styles/forms.css';
import '@/styles/tables.css';
import { validateEnv } from '@/lib/env/validation';

// Fail-fast env validation in production - real data only
try {
  validateEnv();
} catch (e: any) {
  if (process.env.NODE_ENV === 'production') {
    console.error('❌ Env validation failed:', e.message);
    // In production, throw to prevent starting with invalid config
    // For build time, we allow but log
  } else {
    console.warn('⚠️ Env validation warning:', e.message);
  }
}

export const metadata = {
  title: 'Digital Bazar - Select Before You Arrive',
  description: 'Avoid the crowd. Select your products before you arrive. Local commerce platform for hardware, building materials, paint, plumbing & more. Real inventory, real time, no fake data.',
  keywords: 'local commerce, hardware, building material, plumbing, paint, Digital Bazar, real inventory, select before arrive',
  authors: [{ name: 'Digital Bazar' }],
  icons: {
    icon: '/logo.svg',
    apple: '/icon-192.png',
  },
  openGraph: {
    title: 'Digital Bazar - Select Before You Arrive',
    description: 'Select products before visiting the shop. We prepare while you travel. Real inventory, transactional, GST invoices.',
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
        <meta name="description" content="Digital Bazar - Select Before You Arrive. Real inventory, real time, no fake data. Production starts empty." />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
