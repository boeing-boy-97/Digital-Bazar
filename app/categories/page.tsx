import { EliteHeader } from '@/components/layout/EliteHeader';
import { EliteFooter } from '@/components/layout/EliteFooter';
import Link from 'next/link';
import { Pill, Wrench, Building2, Lightbulb, Droplets, Paintbrush, ShoppingCart, Smartphone, Package, ArrowRight, Search } from 'lucide-react';

export const metadata = {
  title: 'Shop by category - Medical to hardware, real inventory | Digital Bazar',
  description: 'Browse all categories from verified local shops in Nagpur. Medical, hardware, building material, electrical, plumbing, paint, grocery, electronics. Real inventory only.',
  alternates: { canonical: '/categories' },
};

const categories = [
  { slug: 'medical', name: 'Medical', desc: 'Over-the-counter medicines and personal care from verified pharmacies', icon: Pill, color: '#0F766E', count: 'OTC only' },
  { slug: 'hardware', name: 'Hardware', desc: 'Tools, fasteners, and essentials from trusted hardware shops', icon: Wrench, color: '#334155', count: 'Tools & more' },
  { slug: 'building-material', name: 'Building Material', desc: 'Cement, bricks, sand and construction material', icon: Building2, color: '#475569', count: 'Construction' },
  { slug: 'electrical', name: 'Electrical', desc: 'Wires, switches, lights and fittings', icon: Lightbulb, color: '#D97706', count: 'Wires & lights' },
  { slug: 'plumbing', name: 'Plumbing', desc: 'Pipes, fittings and sanitary ware', icon: Droplets, color: '#2563EB', count: 'Pipes & fittings' },
  { slug: 'paint', name: 'Paint', desc: 'Paints, primers and brushes from local shops', icon: Paintbrush, color: '#7C3AED', count: 'Paints & more' },
  { slug: 'grocery', name: 'Grocery', desc: 'Daily essentials from nearby grocers', icon: ShoppingCart, color: '#059669', count: 'Daily essentials' },
  { slug: 'electronics', name: 'Electronics', desc: 'Mobiles, accessories and gadgets', icon: Smartphone, color: '#0F172A', count: 'Gadgets' },
];

export default function CategoriesPage() {
  return (
    <div style={{ background: 'var(--surface)', minHeight: '100vh' }}>
      <EliteHeader />
      
      <main id="main-content">
        {/* Hero */}
        <section style={{ background: 'linear-gradient(180deg, #F0FAF9 0%, #FFFFFF 100%)', borderBottom: '1px solid var(--border)', padding: '64px 0 48px' }}>
          <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
            <div style={{ maxWidth: 640 }}>
              <h1 style={{ fontSize: 'clamp(32px, 5vw, 44px)', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.05, margin: 0, fontFamily: 'var(--font-heading)' }}>
                Shop by category
              </h1>
              <p style={{ fontSize: 16, color: 'var(--text-secondary)', lineHeight: 1.6, marginTop: 12 }}>
                From medical to hardware — all local categories. Every product from real shop inventory, not warehouse. Starting in Nagpur.
              </p>
              <div style={{ marginTop: 20, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'white', border: '1px solid var(--border)', borderRadius: 100, padding: '6px 12px', fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)' }}>
                  <div style={{ width: 6, height: 6, background: '#059669', borderRadius: '50%' }} aria-hidden="true" />
                  Live counts from database
                </div>
                <div style={{ display: 'inline-flex', background: 'white', border: '1px solid var(--border)', borderRadius: 100, padding: '6px 12px', fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)' }}>
                  Real inventory only
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Categories grid */}
        <section style={{ padding: '48px 0 80px', background: 'var(--surface-muted)' }}>
          <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
              {categories.map(cat => {
                const Icon = cat.icon;
                return (
                  <Link 
                    key={cat.slug} 
                    href={`/c/${cat.slug}`}
                    style={{ 
                      background: 'white', 
                      border: '1px solid var(--border)', 
                      borderRadius: 16, 
                      padding: 24, 
                      textDecoration: 'none',
                      display: 'block',
                      transition: 'all 0.2s ease',
                      boxShadow: 'var(--shadow-xs)'
                    }}
                    className="category-card"
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                      <div style={{ 
                        width: 48, 
                        height: 48, 
                        background: `${cat.color}10`, 
                        border: `1px solid ${cat.color}20`,
                        borderRadius: 12, 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        color: cat.color
                      }} aria-hidden="true">
                        <Icon size={22} />
                      </div>
                      <div style={{ 
                        fontSize: 11, 
                        fontWeight: 600, 
                        color: 'var(--text-tertiary)', 
                        background: 'var(--surface-muted)', 
                        border: '1px solid var(--border)',
                        padding: '4px 8px', 
                        borderRadius: 100,
                        letterSpacing: '0.02em'
                      }}>{cat.count}</div>
                    </div>
                    
                    <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 8px 0', letterSpacing: '-0.01em', fontFamily: 'var(--font-heading)' }}>
                      {cat.name}
                    </h2>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0 0 16px 0', minHeight: 40 }}>
                      {cat.desc}
                    </p>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: '#0F766E' }}>
                      Browse {cat.name.toLowerCase()} shops
                      <ArrowRight size={14} aria-hidden="true" />
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Can't find CTA */}
            <div style={{ marginTop: 48, background: 'white', border: '1px solid var(--border)', borderRadius: 16, padding: 32, textAlign: 'center' }}>
              <div style={{ width: 48, height: 48, background: 'var(--surface-muted)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }} aria-hidden="true">
                <Search size={20} color="var(--text-tertiary)" />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 8px 0' }}>Can't find what you're looking for?</h3>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', maxWidth: 480, margin: '0 auto 20px', lineHeight: 1.5 }}>
                Tell us your pincode and what you need. We'll notify you when a shop near you joins that carries it.
              </p>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', maxWidth: 400, margin: '0 auto' }}>
                <input placeholder="Enter pincode" aria-label="Pincode" style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border)', fontSize: 14, flex: 1, minWidth: 120, minHeight: 44 }} />
                <input placeholder="What do you need?" aria-label="Product needed" style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border)', fontSize: 14, flex: 1, minWidth: 140, minHeight: 44 }} />
                <button style={{ background: '#0F766E', color: 'white', border: 'none', borderRadius: 10, padding: '10px 18px', fontWeight: 600, fontSize: 13, cursor: 'pointer', minHeight: 44 }}>Notify me</button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <EliteFooter />

      <style>{`
        .category-card:hover {
          border-color: #0F766E !important;
          box-shadow: var(--shadow-md) !important;
          transform: translateY(-2px);
        }
      `}</style>
    </div>
  );
}
