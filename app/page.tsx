'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, MapPin, Clock, Package, Store, ArrowRight, Star, ShieldCheck, Truck, Check, Sparkles, Users, Award, TrendingUp, Layers } from 'lucide-react';
import { EliteHeader } from '@/components/layout/EliteHeader';
import { EliteFooter } from '@/components/layout/EliteFooter';
import { ShopCard } from '@/components/customer/ShopCard';
import { ProductCard } from '@/components/customer/ProductCard';

export default function HomePage() {
  const [shops, setShops] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [shopsRes, productsRes] = await Promise.all([
        fetch('/api/shops').then(r => r.json()).catch(() => ({ shops: [] })),
        fetch('/api/products?limit=8').then(r => r.json()).catch(() => ({ products: [] }))
      ]);
      const realShops = (shopsRes.shops || []).slice(0, 3);
      setShops(realShops);

      const categoryMap = new Map();
      realShops.forEach((shop: any) => {
        if (shop.category && !categoryMap.has(shop.category)) {
          categoryMap.set(shop.category, { name: shop.category, count: 1 });
        }
      });
      (productsRes.products || []).forEach((p: any) => {
        const catName = p.category?.name || 'General';
        if (!categoryMap.has(catName)) categoryMap.set(catName, { name: catName, count: 0 });
        categoryMap.get(catName).count++;
      });
      const cats = Array.from(categoryMap.values()).sort((a, b) => b.count - a.count).slice(0, 6);
      setCategories(cats);
      setProducts((productsRes.products || []).slice(0, 8));
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  const handleAddToCart = async (productId: string, shopId: string, qty: number = 1) => {
    try {
      const res = await fetch('/api/cart/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shopId, productId, quantity: qty })
      });
      if (res.ok) {
        const count = parseInt(localStorage.getItem('db_cart_count') || '0') + qty;
        localStorage.setItem('db_cart_count', count.toString());
        window.dispatchEvent(new Event('cart-updated'));
      }
    } catch {}
  };

  return (
    <div style={{ background: 'var(--surface)', minHeight: '100vh' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@600;700;800&family=Inter:wght@400;500;600&display=swap');
        * { font-family: 'Inter', system-ui, sans-serif; }
        h1, h2, h3 { font-family: 'Plus Jakarta Sans', 'Inter', system-ui, sans-serif; }
        .container { max-width: 1280px; margin: 0 auto; padding: 0 24px; }
        @media (max-width: 768px) { .container { padding: 0 20px; } }
        @media (max-width: 480px) { .container { padding: 0 16px; } }
      `}</style>

      <EliteHeader />

      <main>
        {/* Hero */}
        <section style={{ background: 'linear-gradient(180deg, #F0FAF9 0%, #FFFFFF 100%)', borderBottom: '1px solid var(--border)', overflow: 'hidden', position: 'relative' }}>
          <div className="container" style={{ paddingTop: 72, paddingBottom: 72, position: 'relative' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 64, alignItems: 'center' }} className="hero-grid">
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'white', border: '1px solid var(--border)', borderRadius: 100, padding: '6px 14px', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 20 }}>
                  <span style={{ width: 6, height: 6, background: 'var(--success)', borderRadius: '50%' }}></span>
                  Trusted by 500+ local shops across India
                </div>

                <h1 style={{ fontSize: 'clamp(36px, 5vw, 56px)', fontWeight: 800, lineHeight: 0.95, letterSpacing: '-0.03em', color: 'var(--text-primary)', margin: 0 }}>
                  Shop from nearby<br />
                  <span style={{ color: 'var(--brand)' }}>stores without the wait.</span>
                </h1>

                <p style={{ fontSize: 18, color: 'var(--text-secondary)', lineHeight: 1.6, marginTop: 20, maxWidth: 520 }}>
                  Browse real products from verified local shops. Order ahead, get notified when ready, and collect with QR verification. No more crowded aisles.
                </p>

                <form onSubmit={handleSearch} style={{ marginTop: 28, maxWidth: 480 }}>
                  <div style={{ display: 'flex', gap: 8, background: 'white', borderRadius: 14, padding: 6, border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                      <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                      <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search cement, medicines, pipes..." style={{ width: '100%', padding: '12px 12px 12px 42px', border: 'none', background: 'transparent', outline: 'none', fontSize: 15, fontWeight: 500 }} />
                    </div>
                    <button type="submit" style={{ background: 'var(--brand)', color: 'white', border: 'none', borderRadius: 10, padding: '12px 20px', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>Search</button>
                  </div>
                </form>

                <div style={{ display: 'flex', gap: 12, marginTop: 24, flexWrap: 'wrap' }}>
                  <Link href="/shops" style={{ background: 'var(--brand)', color: 'white', borderRadius: 12, padding: '14px 24px', fontWeight: 600, fontSize: 14, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 12px -2px rgb(15 118 110 / 0.25)' }}>Explore Shops<ArrowRight size={16} /></Link>
                  <Link href="/about" style={{ background: 'white', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 24px', fontWeight: 500, fontSize: 14, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8 }}>How it works</Link>
                </div>

                <div style={{ display: 'flex', gap: 24, marginTop: 32, paddingTop: 24, borderTop: '1px solid var(--border-light)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 40, height: 40, background: 'white', border: '1px solid var(--border)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Clock size={18} color="var(--brand)" /></div>
                    <div><div style={{ fontSize: 13, fontWeight: 600 }}>Order ahead</div><div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Save 25 min avg</div></div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 40, height: 40, background: 'white', border: '1px solid var(--border)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ShieldCheck size={18} color="var(--success)" /></div>
                    <div><div style={{ fontSize: 13, fontWeight: 600 }}>Real inventory</div><div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>No fake stock</div></div>
                  </div>
                </div>
              </div>

              <div style={{ background: 'white', borderRadius: 20, padding: 24, border: '1px solid var(--border)', boxShadow: 'var(--shadow-xl)' }}>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}><Layers size={18} color="var(--brand)" />How it works</div>
                {[
                  { n: 1, t: 'Find a shop near you', d: 'Browse verified shops by category and distance', icon: Store },
                  { n: 2, t: 'Add products to cart', d: 'See live price and stock from the shop', icon: Package },
                  { n: 3, t: 'Order ahead & collect', d: 'Shop prepares, you get notified, QR pickup', icon: Check },
                ].map(s => (
                  <div key={s.n} style={{ display: 'flex', gap: 14, padding: '14px 0', borderBottom: s.n !== 3 ? '1px solid var(--border-light)' : 'none' }}>
                    <div style={{ width: 40, height: 40, background: s.n === 3 ? 'var(--brand)' : 'var(--surface-muted)', color: s.n === 3 ? 'white' : 'var(--text-secondary)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><s.icon size={18} /></div>
                    <div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: 14 }}>{s.t}</div><div style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginTop: 2 }}>{s.d}</div></div>
                    <div style={{ width: 24, height: 24, background: 'var(--text-primary)', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>{s.n}</div>
                  </div>
                ))}
                <div style={{ marginTop: 16, background: 'var(--brand-light)', borderRadius: 12, padding: 12, display: 'flex', gap: 10, alignItems: 'center' }}>
                  <div style={{ width: 32, height: 32, background: 'var(--brand)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><TrendingUp size={16} color="white" /></div>
                  <div><div style={{ fontWeight: 600, fontSize: 12.5 }}>Trusted by customers in 12+ cities</div><div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Nagpur • Pune • Mumbai • Delhi and more</div></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Categories */}
        <section style={{ padding: '64px 0', background: 'var(--surface-muted)', borderBottom: '1px solid var(--border)' }}>
          <div className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
              <div>
                <h2 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>Shop by category</h2>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 6 }}>From medical to hardware — all local categories</p>
              </div>
              <Link href="/categories" style={{ fontSize: 13, fontWeight: 600, color: 'var(--brand)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>View all categories<ArrowRight size={14} /></Link>
            </div>

            {loading ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
                {[1,2,3,4,5,6].map(i => <div key={i} style={{ height: 120, background: 'white', borderRadius: 16, border: '1px solid var(--border)' }} />)}
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
                {(categories.length > 0 ? categories : [
                  { name: 'Medical', count: 120 },
                  { name: 'Hardware', count: 85 },
                  { name: 'Building Material', count: 64 },
                  { name: 'Electrical', count: 52 },
                  { name: 'Plumbing', count: 48 },
                  { name: 'Paint', count: 36 },
                ]).map(cat => {
                  const icons: any = { 'Building Material': '🏗️', Cement: '🏗️', Medical: '💊', Hardware: '🔩', Plumbing: '🚿', Paint: '🎨', Electrical: '💡', Grocery: '🛒', Electronics: '📱', General: '📦' };
                  return (
                    <Link key={cat.name} href={`/search?category=${encodeURIComponent(cat.name)}`} style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 16, padding: 20, textDecoration: 'none', transition: 'all 0.2s', display: 'block' }}>
                      <div style={{ fontSize: 28, marginBottom: 12 }}>{icons[cat.name] || '📦'}</div>
                      <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>{cat.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>{cat.count} products</div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Featured Products */}
        <section style={{ padding: '64px 0', background: 'var(--surface)' }}>
          <div className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
              <div>
                <h2 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>Popular products near you</h2>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 6 }}>Real inventory from verified local shops</p>
              </div>
              <Link href="/search" style={{ fontSize: 13, fontWeight: 600, color: 'var(--brand)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>View all products<ArrowRight size={14} /></Link>
            </div>

            {loading ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
                {[1,2,3,4].map(i => <div key={i} style={{ height: 280, background: 'var(--surface-muted)', borderRadius: 16 }} />)}
              </div>
            ) : products.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
                {products.map(p => <ProductCard key={p.id} product={p} onAdd={(id, qty) => handleAddToCart(id, p.shopId, qty)} />)}
              </div>
            ) : (
              <div style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)', borderRadius: 16, padding: 32, textAlign: 'center' }}>
                <div style={{ fontWeight: 600, marginBottom: 8 }}>No products yet</div>
                <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Products will appear when shops add inventory</div>
              </div>
            )}
          </div>
        </section>

        {/* Value Prop */}
        <section style={{ padding: '64px 0', background: 'var(--surface-muted)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
          <div className="container">
            <div style={{ textAlign: 'center', maxWidth: 640, margin: '0 auto 48px' }}>
              <h2 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>Why Digital Bazar?</h2>
              <p style={{ fontSize: 15, color: 'var(--text-secondary)', marginTop: 12, lineHeight: 1.6 }}>Built for local commerce, not just online shopping. We keep your neighborhood shops at the center.</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20 }}>
              {[
                { icon: ShieldCheck, title: 'Secure & Verified', desc: 'All shops are verified. Real inventory, real prices, GST compliant invoices.' },
                { icon: Clock, title: 'Save Time', desc: 'Order ahead while you travel. Average 25 minutes saved per order. No queues.' },
                { icon: Package, title: 'Quality Guarantee', desc: 'Buy from a specific shop you trust. See actual stock before you visit.' },
                { icon: Users, title: 'Support Local', desc: 'Every order supports a local business. Keep your community thriving.' },
              ].map(item => (
                <div key={item.title} style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 16, padding: 24 }}>
                  <div style={{ width: 48, height: 48, background: 'var(--brand-light)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, color: 'var(--brand)' }}><item.icon size={22} /></div>
                  <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 8 }}>{item.title}</div>
                  <div style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{item.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Shops preview */}
        <section style={{ padding: '64px 0', background: 'var(--surface)' }}>
          <div className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>Nearby shops</h2>
              <Link href="/shops" style={{ fontSize: 13, fontWeight: 600, color: 'var(--brand)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>View all<ArrowRight size={14} /></Link>
            </div>
            {loading ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
                {[1,2,3].map(i => <div key={i} style={{ height: 120, background: 'var(--surface-muted)', borderRadius: 16 }} />)}
              </div>
            ) : shops.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
                {shops.map(shop => <ShopCard key={shop.id} shop={{ id: shop.id, name: shop.name, slug: shop.slug, category: shop.category, address: shop.address, rating: shop.rating, reviewCount: shop.reviewCount, preparationTimeMin: shop.preparationTimeMin, status: shop.status, productCount: shop._count?.products }} />)}
              </div>
            ) : (
              <div style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)', borderRadius: 16, padding: 24, textAlign: 'center', fontSize: 14, color: 'var(--text-secondary)' }}>No shops nearby yet. Check back as more shops join.</div>
            )}
          </div>
        </section>

        {/* Final CTA */}
        <section style={{ padding: '80px 0', background: 'var(--text-primary)', color: 'white' }}>
          <div className="container">
            <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
              <h2 style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.1, margin: 0 }}>Ready to skip the wait?</h2>
              <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.7)', marginTop: 16, lineHeight: 1.6, maxWidth: 520, margin: '16px auto 0' }}>Find products from nearby shops, order before you arrive, and collect when ready. Join 500+ shops already on Digital Bazar.</p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 28, flexWrap: 'wrap' }}>
                <Link href="/shops" style={{ background: 'white', color: 'var(--text-primary)', borderRadius: 12, padding: '14px 24px', fontWeight: 600, fontSize: 14, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8 }}>Find Nearby Shops<ArrowRight size={16} /></Link>
                <Link href="/about" style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 12, padding: '14px 24px', fontWeight: 500, fontSize: 14, textDecoration: 'none' }}>Learn more about us</Link>
              </div>
              <div style={{ marginTop: 24, fontSize: 12, color: 'rgba(255,255,255,0.5)', display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
                <span>✓ No setup fees</span><span>✓ First 50 orders free</span><span>✓ Cancel anytime</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      <EliteFooter />

      <style>{`
        @media (max-width: 1024px) {
          .hero-grid { grid-template-columns: 1fr !important; gap: 32px !important; }
        }
      `}</style>
    </div>
  );
}
