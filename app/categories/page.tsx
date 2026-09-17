import { EliteHeader } from '@/components/layout/EliteHeader';
import { EliteFooter } from '@/components/layout/EliteFooter';
import Link from 'next/link';
import { ArrowRight, Package, Store } from 'lucide-react';

const categories = [
  { name: 'Medical', icon: '💊', desc: 'Medicines, personal care, health products', count: '120+ products', color: '#059669' },
  { name: 'Hardware', icon: '🔩', desc: 'Tools, fasteners, hardware essentials', count: '85+ products', color: '#D97706' },
  { name: 'Building Material', icon: '🏗️', desc: 'Cement, bricks, sand, construction material', count: '64+ products', color: '#475569' },
  { name: 'Electrical', icon: '💡', desc: 'Wires, switches, lights, electrical fittings', count: '52+ products', color: '#F59E0B' },
  { name: 'Plumbing', icon: '🚿', desc: 'Pipes, fittings, sanitary ware, plumbing tools', count: '48+ products', color: '#0EA5E9' },
  { name: 'Paint', icon: '🎨', desc: 'Paints, primers, brushes, painting tools', count: '36+ products', color: '#7C3AED' },
  { name: 'Grocery', icon: '🛒', desc: 'Daily essentials, food, beverages', count: '90+ products', color: '#059669' },
  { name: 'Electronics', icon: '📱', desc: 'Mobiles, accessories, gadgets', count: '70+ products', color: '#2563EB' },
];

export default function CategoriesPage() {
  return (
    <div style={{ background: 'var(--surface)', minHeight: '100vh' }}>
      <EliteHeader />

      <main>
        <section style={{ background: 'linear-gradient(180deg, #F0FAF9 0%, #FFFFFF 100%)', borderBottom: '1px solid var(--border)', padding: '64px 0 48px' }}>
          <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
            <div style={{ maxWidth: 640 }}>
              <h1 style={{ fontSize: 'clamp(32px, 5vw, 44px)', fontWeight: 800, letterSpacing: '-0.03em', margin: 0, fontFamily: 'var(--font-heading)' }}>Shop by category</h1>
              <p style={{ fontSize: 16, color: 'var(--text-secondary)', marginTop: 12, lineHeight: 1.6 }}>From medical stores to hardware shops — browse all local commerce categories. Real shops, real inventory.</p>
            </div>
          </div>
        </section>

        <section style={{ padding: '48px 0 80px', background: 'var(--surface-muted)' }}>
          <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
              {categories.map(cat => (
                <Link key={cat.name} href={`/search?category=${encodeURIComponent(cat.name)}`} style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 16, padding: 24, textDecoration: 'none', transition: 'all 0.2s', display: 'block' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                    <div style={{ width: 56, height: 56, background: `${cat.color}12`, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, border: `1px solid ${cat.color}20` }}>{cat.icon}</div>
                    <span style={{ fontSize: 11, fontWeight: 600, background: 'var(--surface-muted)', color: 'var(--text-secondary)', padding: '4px 10px', borderRadius: 100 }}>{cat.count}</span>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)', marginBottom: 6 }}>{cat.name}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 16 }}>{cat.desc}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: 'var(--brand)' }}>Browse products<ArrowRight size={14} /></div>
                </Link>
              ))}
            </div>

            <div style={{ marginTop: 48, background: 'white', border: '1px solid var(--border)', borderRadius: 16, padding: 32, textAlign: 'center' }}>
              <div style={{ width: 48, height: 48, background: 'var(--brand-light)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: 'var(--brand)' }}><Store size={22} /></div>
              <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 8px' }}>Can't find your category?</h3>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', maxWidth: 480, margin: '0 auto 20px', lineHeight: 1.6 }}>We support all local commerce categories. If your shop sells it, we can list it — from Paracetamol to PVC pipes.</p>
              <Link href="/contact" style={{ background: 'var(--brand)', color: 'white', borderRadius: 10, padding: '10px 20px', fontWeight: 600, fontSize: 13, textDecoration: 'none', display: 'inline-block' }}>Contact us</Link>
            </div>
          </div>
        </section>
      </main>

      <EliteFooter />
    </div>
  );
}
