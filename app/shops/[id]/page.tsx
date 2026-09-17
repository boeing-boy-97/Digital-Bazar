import { EliteHeader } from '@/components/layout/EliteHeader';
import { EliteFooter } from '@/components/layout/EliteFooter';
import { Suspense } from 'react';
import ShopDetailClient from './ShopDetailClient';

export async function generateMetadata({ params }: { params: { id: string } }) {
  return {
    title: `Shop ${params.id.slice(0, 8)} - Verified local shop in Nagpur | Digital Bazar`,
    description: 'Verified local shop in Nagpur with real inventory, real photos. Order ahead and collect with QR verification. Real shop, real owner.',
    alternates: { canonical: `/shops/${params.id}` },
  };
}

export default function ShopPage({ params }: { params: { id: string } }) {
  return (
    <div style={{ background: 'var(--background)', minHeight: '100vh' }}>
      <EliteHeader />
      <main id="main-content" style={{ paddingBottom: 80 }}>
        <Suspense fallback={<div style={{ padding: 40, textAlign: 'center', fontSize: 14, color: 'var(--text-secondary)' }}>Loading shop...</div>}>
          <ShopDetailClient id={params.id} />
        </Suspense>
      </main>
      <EliteFooter />
    </div>
  );
}
