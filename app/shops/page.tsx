import { EliteHeader } from '@/components/layout/EliteHeader';
import { EliteFooter } from '@/components/layout/EliteFooter';
import { Suspense } from 'react';
import ShopsClient from './ShopsClient';

export const metadata = {
  title: 'Verified local shops near you - Medical, hardware, grocery | Digital Bazar',
  description: 'Browse verified local shops in Nagpur. Medical stores, hardware shops, building material, electrical, plumbing, paint, grocery, electronics. Real inventory, real shops, real photos.',
  alternates: { canonical: '/shops' },
};

export default function ShopsPage({ searchParams }: { searchParams: { category?: string; sort?: string; open?: string; q?: string; pincode?: string } }) {
  return (
    <div style={{ background: 'var(--background)', minHeight: '100vh' }}>
      <EliteHeader />
      <main id="main-content">
        <Suspense fallback={<div style={{ padding: 40, textAlign: 'center', fontSize: 14, color: 'var(--text-secondary)' }}>Loading shops...</div>}>
          <ShopsClient initialParams={searchParams} />
        </Suspense>
      </main>
      <EliteFooter />
    </div>
  );
}
