import { EliteHeader } from '@/components/layout/EliteHeader';
import { EliteFooter } from '@/components/layout/EliteFooter';
import { Suspense } from 'react';
import SearchClient from './SearchClient';

export const metadata = {
  title: 'Search products - Real inventory from local shops | Digital Bazar',
  description: 'Search real inventory from verified local shops in Nagpur. Cement, pipes, medicines, hardware, building material — see what is in stock before you leave house. Real photos only.',
  alternates: { canonical: '/search' },
};

export default function SearchPage({ searchParams }: { searchParams: { q?: string; category?: string; inStock?: string; sortBy?: string; pincode?: string } }) {
  return (
    <div style={{ background: 'var(--background)', minHeight: '100vh' }}>
      <EliteHeader />
      <main id="main-content">
        <Suspense fallback={<div style={{ padding: 40, textAlign: 'center', fontSize: 14, color: 'var(--text-secondary)' }}>Loading search...</div>}>
          <SearchClient initialParams={searchParams} />
        </Suspense>
      </main>
      <EliteFooter />
    </div>
  );
}
