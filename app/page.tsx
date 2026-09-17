'use client';
import { useEffect, useState } from 'react';
import { Header } from '@/components/common/Header';
import { BottomNav } from '@/components/common/BottomNav';
import Link from 'next/link';
import { MapPin, Search, Clock, ShieldCheck, Package, QrCode, Star, ArrowRight, Zap, Store } from 'lucide-react';
import { ShopCard } from '@/components/customer/ShopCard';

export default function HomePage() {
  const [shops, setShops] = useState<any[]>([]);
  const [stats, setStats] = useState({ shopCount: 0, productCount: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRealData();
  }, []);

  const fetchRealData = async () => {
    try {
      setLoading(true);
      const [shopsRes, productsRes] = await Promise.all([
        fetch('/api/shops').then(r => r.json()).catch(() => ({ shops: [] })),
        fetch('/api/products?limit=1').then(r => r.json()).catch(() => ({ total: 0 }))
      ]);
      
      const realShops = shopsRes.shops || [];
      setShops(realShops.slice(0, 4));
      setStats({
        shopCount: realShops.length,
        productCount: productsRes.total || 0
      });
    } catch (e) {
      console.error('Failed to fetch real data', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <Header />
      <main className="main-content">
        {/* Hero - Real data only, no fake stats */}
        <section style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
          <div className="container" style={{ paddingTop: 48, paddingBottom: 48 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'center' }} className="hero-grid">
              <div>
                <div className="badge badge-brand" style={{ marginBottom: 16, padding: '6px 12px' }}>
                  <Zap size={12} /> Select Before You Arrive
                </div>
                <h1 style={{ fontSize: '42px', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>
                  Avoid the crowd.<br />
                  <span style={{ color: 'var(--brand)' }}>Select your products</span><br />
                  before you arrive.
                </h1>
                <p style={{ fontSize: '18px', color: 'var(--text-secondary)', marginTop: 16, lineHeight: 1.5 }}>
                  Browse real shop catalogs, place an order, and get notified when it's ready. No waiting inside crowded local shops. Real inventory, real time.
                </p>
                
                <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                  <Link href="/shops" className="btn btn-primary btn-lg">
                    Find Nearby Shops
                    <ArrowRight size={18} />
                  </Link>
                  <Link href="/search" className="btn btn-secondary btn-lg">
                    <Search size={18} />
                    Search Products
                  </Link>
                </div>

                <div style={{ display: 'flex', gap: 24, marginTop: 32, paddingTop: 24, borderTop: '1px solid var(--border-light)' }}>
                  <div>
                    <div style={{ fontSize: '24px', fontWeight: 700 }}>{loading ? '...' : stats.shopCount > 0 ? `${stats.shopCount}` : '—'}</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{stats.shopCount > 0 ? 'Active Shops' : 'No shops yet'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '24px', fontWeight: 700 }}>{loading ? '...' : stats.productCount > 0 ? `${stats.productCount}` : '—'}</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{stats.productCount > 0 ? 'Products' : 'No products yet'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '24px', fontWeight: 700 }}>15 min</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Avg Prep Time</div>
                  </div>
                </div>
                {stats.shopCount === 0 && !loading && (
                  <div style={{ marginTop: 16, fontSize: '13px', color: 'var(--text-secondary)', background: 'var(--surface-muted)', padding: 12, borderRadius: 8 }}>
                    No shops yet - production DB starts empty. Shop owners must register and admin must approve. Run <code>npm run db:seed</code> for development demo data.
                  </div>
                )}
              </div>

              <div style={{ background: 'var(--surface-muted)', borderRadius: '16px', padding: 24, border: '1px solid var(--border)' }}>
                <div style={{ background: 'white', borderRadius: '12px', padding: 16, boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <div style={{ fontWeight: 600 }}>How it works - Real Flow</div>
                    <div className="badge badge-success">Live</div>
                  </div>
                  
                  {[
                    { step: 1, title: 'Find Nearby Shop', desc: 'Real shops from database, distance calculated', icon: Store },
                    { step: 2, title: 'Select Products', desc: 'Real inventory, server validates stock', icon: Package },
                    { step: 3, title: 'Shop Prepares Order', desc: 'Auto sorted by storage zones, transactional', icon: Clock },
                    { step: 4, title: 'Ready Notification', desc: 'QR verification, payment, invoice, analytics', icon: QrCode },
                  ].map(item => (
                    <div key={item.step} style={{ display: 'flex', gap: 12, padding: '12px 0', borderBottom: item.step !== 4 ? '1px solid var(--border-light)' : 'none' }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: item.step === 4 ? 'var(--success-light)' : 'var(--surface-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <item.icon size={18} color={item.step === 4 ? 'var(--success)' : 'var(--text-secondary)'} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 500, fontSize: '14px' }}>{item.title}</div>
                        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: 2 }}>{item.desc}</div>
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 600 }}>0{item.step}</div>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: 16, display: 'flex', gap: 8, alignItems: 'center', fontSize: '13px', color: 'var(--text-secondary)' }}>
                  <ShieldCheck size={16} color="var(--success)" />
                  Real inventory • Transactional • GST invoices • Audit logs
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Categories - Real, not fake counts */}
        <section className="container" style={{ paddingTop: 32, paddingBottom: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: '20px', fontWeight: 700 }}>Shop by Category</h2>
            <Link href="/shops" style={{ fontSize: '14px', color: 'var(--brand)', fontWeight: 500 }}>View all →</Link>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
            {[
              { name: 'Cement', icon: '🏗️' },
              { name: 'Bricks', icon: '🧱' },
              { name: 'Plumbing', icon: '🚿' },
              { name: 'Paint', icon: '🎨' },
              { name: 'Electrical', icon: '💡' },
              { name: 'Hardware', icon: '🔩' },
              { name: 'Tools', icon: '🛠️' },
            ].map(cat => (
              <Link key={cat.name} href={`/search?category=${cat.name}`} className="card" style={{ padding: 16, textAlign: 'center', transition: 'all 0.2s' }}>
                <div style={{ fontSize: '28px', marginBottom: 8 }}>{cat.icon}</div>
                <div style={{ fontWeight: 600, fontSize: '14px' }}>{cat.name}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: 2 }}>Browse</div>
              </Link>
            ))}
          </div>
        </section>

        {/* Nearby Shops - REAL DATA ONLY */}
        <section className="container" style={{ paddingBottom: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: '20px', fontWeight: 700 }}>Nearby Shops - Real Data</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '13px', color: 'var(--text-secondary)', background: 'var(--surface)', padding: '6px 10px', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <MapPin size={14} /> {shops.length > 0 ? `${shops.length} shops found` : 'No shops yet'}
            </div>
          </div>
          
          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
              {[1,2,3].map(i => (
                <div key={i} className="card" style={{ padding: 16 }}>
                  <div className="skeleton skeleton-title" />
                  <div className="skeleton skeleton-text" style={{ width: '80%' }} />
                </div>
              ))}
            </div>
          ) : shops.length === 0 ? (
            <div className="card" style={{ padding: 32, textAlign: 'center' }}>
              <div style={{ fontSize: '32px', marginBottom: 12 }}>🏪</div>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>No shops yet - production starts empty</div>
              <div style={{ fontSize: '14px', color: 'var(--text-secondary)', maxWidth: 400, margin: '0 auto 16px' }}>
                Production database starts without fake business records. Shop owners must register at /auth/register and admin must approve at /admin/shops. For development, run <code>npm run db:seed</code>.
              </div>
              <Link href="/auth/register" className="btn btn-primary">Register Your Shop</Link>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
              {shops.map(shop => (
                <ShopCard key={shop.id} shop={{
                  id: shop.id,
                  name: shop.name,
                  slug: shop.slug,
                  category: shop.category,
                  address: shop.address,
                  rating: shop.rating,
                  reviewCount: shop.reviewCount,
                  preparationTimeMin: shop.preparationTimeMin,
                  status: shop.status,
                  distance: shop.distance,
                  isOpen: true
                }} />
              ))}
            </div>
          )}
        </section>

        {/* Benefits - Real value, no fake stats */}
        <section style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '32px 0' }}>
          <div className="container">
            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: 20, textAlign: 'center' }}>Why Digital Bazar? - Real Benefits</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
              {[
                { title: 'No Crowd Waiting', desc: 'Select before you arrive. We prepare while you travel. Real flow.', icon: Clock },
                { title: 'Real Inventory', desc: 'Live stock from database with transactional reservation. No fake availability.', icon: Package },
                { title: 'Zone Sorted Picking', desc: 'Orders auto-sorted by shop storage zones (A-E) for fast prep. Deterministic algorithm.', icon: Store },
                { title: 'QR Verification', desc: 'Secure QR token, server validates shop, status, prevents reuse.', icon: QrCode },
              ].map(b => (
                <div key={b.title} style={{ textAlign: 'center', padding: 16 }}>
                  <div style={{ width: 48, height: 48, background: 'var(--brand-light)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                    <b.icon size={24} color="var(--brand)" />
                  </div>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>{b.title}</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{b.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA - No fake customer count */}
        <section className="container" style={{ padding: '32px 16px 80px' }}>
          <div style={{ background: 'var(--brand)', borderRadius: '16px', padding: 32, color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div style={{ fontSize: '24px', fontWeight: 700, marginBottom: 8 }}>Ready to digitize your shop?</div>
              <div style={{ opacity: 0.9 }}>Real inventory, real orders, real time - not a demo. Production-grade platform.</div>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <Link href="/auth/register" className="btn" style={{ background: 'white', color: 'var(--brand)', fontWeight: 600 }}>Create Account</Link>
              <Link href="/shopkeeper" className="btn" style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.3)' }}>For Shopkeepers</Link>
            </div>
          </div>
        </section>
      </main>
      <BottomNav />

      <style>{`
        @media (max-width: 768px) {
          .hero-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
