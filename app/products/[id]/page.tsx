import { EliteHeader } from '@/components/layout/EliteHeader';
import { EliteFooter } from '@/components/layout/EliteFooter';
import { Suspense } from 'react';
import ProductDetailClient from './ProductDetailClient';

export async function generateMetadata({ params }: { params: { id: string } }) {
  return {
    title: `Product ${params.id.slice(0, 8)} - Real inventory from local shop | Digital Bazar`,
    description: 'Product from verified local shop in Nagpur. Real inventory from shop counter, real photo only. Order ahead and collect with QR verification.',
    alternates: { canonical: `/products/${params.id}` },
  };
}

export default function ProductPage({ params }: { params: { id: string } }) {
  return (
    <div style={{ background: 'var(--background)', minHeight: '100vh' }}>
      <EliteHeader />
      <main id="main-content" style={{ paddingBottom: 80 }}>
        <Suspense fallback={<div style={{ padding: 40, textAlign: 'center', fontSize: 14, color: 'var(--text-secondary)' }}>Loading product...</div>}>
          <ProductDetailClient id={params.id} />
        </Suspense>
      </main>
      <EliteFooter />
      <style>{`@media (max-width: 768px) { .product-grid { grid-template-columns: 1fr !important; gap: 24px !important; } }`}</style>
    </div>
  );
}
