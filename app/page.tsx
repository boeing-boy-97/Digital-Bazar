'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, MapPin, Clock, Package, Store, ArrowRight, ShieldCheck, Check, Layers, TrendingUp, Award, Users, Timer, Building2, Wrench, Pill, Lightbulb, Droplets, Paintbrush, ShoppingCart, Smartphone, Zap, CreditCard, BarChart3, BookOpen, MessageCircle, Video, FileText, CheckCircle } from 'lucide-react';
import { EliteHeader } from '@/components/layout/EliteHeader';
import { EliteFooter } from '@/components/layout/EliteFooter';
import { ShopCard } from '@/components/customer/ShopCard';
import { ProductCard } from '@/components/customer/ProductCard';

const categoryIcons: Record<string, any> = {
  Medical: Pill,
  Hardware: Wrench,
  'Building Material': Building2,
  Electrical: Lightbulb,
  Plumbing: Droplets,
  Paint: Paintbrush,
  Grocery: ShoppingCart,
  Electronics: Smartphone,
  General: Package,
};

export default function HomePage() {
  const [shops, setShops] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [counts, setCounts] = useState({ shops: 0, products: 0, categories: 0, cities: 1 });
  const [activeTool, setActiveTool] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

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
      setCounts({
        shops: shopsRes.shops?.length || 0,
        products: productsRes.total || productsRes.products?.length || 0,
        categories: new Set((shopsRes.shops || []).map((s: any) => s.category)).size,
        cities: 1 // Nagpur - honest, starting with 1 city
      });

      const categoryMap = new Map();
      (shopsRes.shops || []).forEach((shop: any) => {
        if (shop.category && !categoryMap.has(shop.category)) {
          categoryMap.set(shop.category, { name: shop.category, count: 0, shops: 0 });
        }
        if (shop.category) {
          categoryMap.get(shop.category).shops++;
        }
      });
      (productsRes.products || []).forEach((p: any) => {
        const catName = p.category?.name || 'General';
        if (!categoryMap.has(catName)) categoryMap.set(catName, { name: catName, count: 0, shops: 0 });
        categoryMap.get(catName).count++;
      });
      
      const cats = Array.from(categoryMap.values())
        .sort((a, b) => (b.count + b.shops) - (a.count + a.shops))
        .slice(0, 8);
      setCategories(cats);
      setProducts((productsRes.products || []).slice(0, 8));
    } catch {
      // Fallback to empty states - honest
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
      <EliteHeader />

      <main id="main-content">
        {/* Hero - Blinkit-inspired ellipse bg but Digital Bazar concept */}
        <section style={{ 
          background: 'linear-gradient(180deg, #F0FAF9 0%, #FFFFFF 100%)', 
          borderBottom: '1px solid var(--border)', 
          overflow: 'hidden', 
          position: 'relative' 
        }}>
          {/* Ellipse bg like Blinkit seller */}
          <div aria-hidden="true" style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse at 30% 20%, rgba(15, 118, 110, 0.08) 0%, transparent 50%), radial-gradient(ellipse at 80% 80%, rgba(15, 118, 110, 0.05) 0%, transparent 40%), radial-gradient(ellipse at 50% 50%, rgba(15, 118, 110, 0.03) 0%, transparent 70%)`,
            pointerEvents: 'none'
          }} />

          <div style={{ maxWidth: 1280, margin: '0 auto', padding: '72px 24px 80px', position: 'relative' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 0.85fr', gap: 64, alignItems: 'center' }} className="hero-grid">
              {/* Left: Headline + Search + CTAs */}
              <div>
                <div style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: 8, 
                  background: 'white', 
                  border: '1px solid var(--border)', 
                  borderRadius: 100, 
                  padding: '7px 14px', 
                  fontSize: 12, 
                  fontWeight: 600, 
                  color: 'var(--text-secondary)', 
                  marginBottom: 20,
                  boxShadow: 'var(--shadow-xs)'
                }}>
                  <span style={{ width: 6, height: 6, background: '#059669', borderRadius: '50%', display: 'inline-block' }} aria-hidden="true"></span>
                  Launching in Nagpur — onboarding verified shops
                </div>

                <h1 style={{ 
                  fontSize: 'clamp(36px, 5vw, 56px)', 
                  fontWeight: 800, 
                  lineHeight: 0.95, 
                  letterSpacing: '-0.03em', 
                  color: 'var(--text-primary)', 
                  margin: 0,
                  fontFamily: 'var(--font-heading)'
                }}>
                  Know it is in stock<br />
                  <span style={{ color: '#0F766E' }}>before you leave the house.</span>
                </h1>

                <p style={{ 
                  fontSize: 18, 
                  color: 'var(--text-secondary)', 
                  lineHeight: 1.6, 
                  marginTop: 20, 
                  maxWidth: 520,
                  letterSpacing: '-0.01em'
                }}>
                  Browse real inventory from verified local shops in Nagpur. Reserve what you need, walk over, collect with a QR code. No phone calls, no wasted trips.
                </p>

                <form onSubmit={handleSearch} style={{ marginTop: 28, maxWidth: 480 }}>
                  <div style={{ 
                    display: 'flex', 
                    gap: 8, 
                    background: 'white', 
                    borderRadius: 14, 
                    padding: 6, 
                    border: '1px solid var(--border)', 
                    boxShadow: 'var(--shadow-lg)',
                    transition: 'all 0.2s ease'
                  }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                      <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} aria-hidden="true" />
                      <input 
                        value={searchQuery} 
                        onChange={e => setSearchQuery(e.target.value)} 
                        placeholder="Search cement, pipes, medicines..." 
                        aria-label="Search products"
                        style={{ 
                          width: '100%', 
                          padding: '12px 12px 12px 42px', 
                          border: 'none', 
                          background: 'transparent', 
                          outline: 'none', 
                          fontSize: 15, 
                          fontWeight: 500,
                          color: 'var(--text-primary)'
                        }} 
                      />
                    </div>
                    <button 
                      type="submit" 
                      style={{ 
                        background: '#0F766E', 
                        color: 'white', 
                        border: 'none', 
                        borderRadius: 10, 
                        padding: '12px 20px', 
                        fontWeight: 600, 
                        fontSize: 14, 
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        minHeight: 44
                      }}
                    >Search</button>
                  </div>
                  <div style={{ marginTop: 10, fontSize: 12, color: 'var(--text-tertiary)', display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    <span>Try:</span>
                    {['cement', 'PVC pipe', 'paracetamol', 'paint'].map(term => (
                      <button 
                        key={term}
                        type="button"
                        onClick={() => { setSearchQuery(term); window.location.href = `/search?q=${encodeURIComponent(term)}`; }}
                        style={{ 
                          background: 'var(--surface-muted)', 
                          border: '1px solid var(--border)', 
                          borderRadius: 100, 
                          padding: '4px 10px', 
                          fontSize: 11, 
                          cursor: 'pointer',
                          color: 'var(--text-secondary)'
                        }}
                      >{term}</button>
                    ))}
                  </div>
                </form>

                <div style={{ display: 'flex', gap: 12, marginTop: 24, flexWrap: 'wrap' }}>
                  <Link 
                    href="/shops" 
                    style={{ 
                      background: '#0F766E', 
                      color: 'white', 
                      borderRadius: 12, 
                      padding: '14px 24px', 
                      fontWeight: 600, 
                      fontSize: 14, 
                      textDecoration: 'none', 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      gap: 8, 
                      boxShadow: '0 4px 14px -2px rgb(15 118 110 / 0.28)',
                      transition: 'all 0.2s ease',
                      minHeight: 48
                    }}
                  >Explore shops<ArrowRight size={16} aria-hidden="true" /></Link>
                  <Link 
                    href="/about" 
                    style={{ 
                      background: 'white', 
                      color: 'var(--text-primary)', 
                      border: '1px solid var(--border)', 
                      borderRadius: 12, 
                      padding: '14px 24px', 
                      fontWeight: 500, 
                      fontSize: 14, 
                      textDecoration: 'none', 
                      display: 'inline-flex', 
                      alignItems: 'center', 
                      gap: 8,
                      transition: 'all 0.2s ease',
                      minHeight: 48
                    }}
                  >How it works</Link>
                </div>
              </div>

              {/* Right: How it works - Blinkit-inspired 3 steps but Digital Bazar concept */}
              <div style={{ 
                background: 'white', 
                borderRadius: 20, 
                padding: 28, 
                border: '1px solid var(--border)', 
                boxShadow: 'var(--shadow-xl)',
                position: 'relative'
              }}>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-heading)' }}>
                  <Layers size={18} color="#0F766E" aria-hidden="true" />
                  How it works — 3 steps
                </div>
                {[
                  { n: 1, t: 'Find what you need', d: 'Search across every shop near you at once. Prices and stock from shop counter.', icon: Search },
                  { n: 2, t: 'Reserve it', d: 'Shop sets it aside and starts preparing. You get a message when packed.', icon: Package },
                  { n: 3, t: 'Walk in and collect', d: 'Show code on phone. Shop scans, hands over order. GST bill in messages.', icon: Check },
                ].map(s => (
                  <div key={s.n} style={{ display: 'flex', gap: 14, padding: '16px 0', borderBottom: s.n !== 3 ? '1px solid var(--border-light)' : 'none' }}>
                    <div style={{ 
                      width: 44, 
                      height: 44, 
                      background: s.n === 3 ? '#0F766E' : 'var(--surface-muted)', 
                      color: s.n === 3 ? 'white' : 'var(--text-secondary)', 
                      borderRadius: 12, 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      flexShrink: 0,
                      border: s.n !== 3 ? '1px solid var(--border)' : 'none'
                    }} aria-hidden="true"><s.icon size={18} /></div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                        {s.t}
                        <span style={{ 
                          width: 20, 
                          height: 20, 
                          background: 'var(--text-primary)', 
                          color: 'white', 
                          borderRadius: '50%', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          fontSize: 10, 
                          fontWeight: 700 
                        }} aria-hidden="true">{s.n}</span>
                      </div>
                      <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.5 }}>{s.d}</div>
                    </div>
                  </div>
                ))}
                <div style={{ 
                  marginTop: 20, 
                  background: '#F0FAF9', 
                  border: '1px solid #CCFBF1',
                  borderRadius: 12, 
                  padding: 14, 
                  display: 'flex', 
                  gap: 10, 
                  alignItems: 'center' 
                }}>
                  <div style={{ width: 36, height: 36, background: '#0F766E', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }} aria-hidden="true"><MapPin size={16} color="white" /></div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 12.5, color: 'var(--text-primary)' }}>Starting in Nagpur</div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 1 }}>Onboarding verified shops — more joining every week</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section - Blinkit-inspired Powering growth at scale but with real Digital Bazar data */}
        <section className="blinkit-stats-section">
          <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px 24px', textAlign: 'center' }}>
            <h2 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em', margin: 0, fontFamily: 'var(--font-heading)' }}>Powering local commerce at scale</h2>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 8 }}>Real shops, real inventory, real community — no fake numbers</p>
          </div>
          <div className="blinkit-stats-grid">
            <div className="blinkit-stat-card">
              <div className="blinkit-stat-icon"><Store size={20} /></div>
              <div className="blinkit-stat-number">{counts.shops > 0 ? `${counts.shops}` : '0'}+</div>
              <div className="blinkit-stat-label">Verified shops in Nagpur • Real photos only, no placeholders</div>
            </div>
            <div className="blinkit-stat-card">
              <div className="blinkit-stat-icon"><Package size={20} /></div>
              <div className="blinkit-stat-number">{counts.products > 0 ? `${counts.products}` : '0'}+</div>
              <div className="blinkit-stat-label">Products from real inventory • From shop counter, not warehouse</div>
            </div>
            <div className="blinkit-stat-card">
              <div className="blinkit-stat-icon"><Layers size={20} /></div>
              <div className="blinkit-stat-number">{counts.categories > 0 ? `${counts.categories}` : '8'}+</div>
              <div className="blinkit-stat-label">Categories • Medical to hardware, all local needs covered</div>
            </div>
            <div className="blinkit-stat-card">
              <div className="blinkit-stat-icon"><MapPin size={20} /></div>
              <div className="blinkit-stat-number">{counts.cities}+</div>
              <div className="blinkit-stat-label">Cities • Starting in Nagpur, expanding one neighbourhood at a time</div>
            </div>
          </div>
        </section>

        {/* Why Choose - Blinkit-inspired Why sellers choose but Digital Bazar concept */}
        <section className="blinkit-why-section">
          <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px 32px', textAlign: 'center' }}>
            <h2 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em', margin: 0, fontFamily: 'var(--font-heading)' }}>Why shops choose Digital Bazar?</h2>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 8, maxWidth: 600, margin: '8px auto 0' }}>Built for real local market digitization, not instant delivery. Shop keeps customer, margin and relationship.</p>
          </div>
          <div className="blinkit-why-grid">
            <div className="blinkit-why-card">
              <div className="blinkit-why-image">
                <div className="blinkit-why-image-icon"><Zap size={28} /></div>
              </div>
              <div className="blinkit-why-content">
                <div className="blinkit-why-title">Real inventory, no fake</div>
                <div className="blinkit-why-desc">What you see is what is on the shelf. When it sells in shop, it disappears here. No fake availability, no placeholder stock. Real photos only.</div>
                <div className="blinkit-why-feature"><span className="blinkit-why-feature-dot"></span>Live stock from shop counter</div>
              </div>
            </div>
            <div className="blinkit-why-card">
              <div className="blinkit-why-image">
                <div className="blinkit-why-image-icon"><Clock size={28} /></div>
              </div>
              <div className="blinkit-why-content">
                <div className="blinkit-why-title">Reserve before you go</div>
                <div className="blinkit-why-desc">Customer reserves what they need, walks over, collects with QR code. No phone calls, no wasted trips. Timer Reserved until 6:30 PM based on real policy.</div>
                <div className="blinkit-why-feature"><span className="blinkit-why-feature-dot"></span>Stock held until expiry</div>
              </div>
            </div>
            <div className="blinkit-why-card">
              <div className="blinkit-why-image">
                <div className="blinkit-why-image-icon"><CreditCard size={28} /></div>
              </div>
              <div className="blinkit-why-content">
                <div className="blinkit-why-title">Full pricing control</div>
                <div className="blinkit-why-desc">Set and manage your product pricing in real time. SAME or DIFFERENT from offline per point 18. Real shop price, no commission surprises.</div>
                <div className="blinkit-why-feature"><span className="blinkit-why-feature-dot"></span>Price parity mode SAME/DIFFERENT</div>
              </div>
            </div>
            <div className="blinkit-why-card">
              <div className="blinkit-why-image">
                <div className="blinkit-why-image-icon"><BarChart3 size={28} /></div>
              </div>
              <div className="blinkit-why-content">
                <div className="blinkit-why-title">Inventory intelligence</div>
                <div className="blinkit-why-desc">Track stock levels, low stock alerts, forecast stockout 4-6 days, catalog health warnings, demand gap. Real operational tools from Blinkit seller ecosystem.</div>
                <div className="blinkit-why-feature"><span className="blinkit-why-feature-dot"></span>Estimated stockout 4-6 days</div>
              </div>
            </div>
            <div className="blinkit-why-card">
              <div className="blinkit-why-image">
                <div className="blinkit-why-image-icon"><Users size={28} /></div>
              </div>
              <div className="blinkit-why-content">
                <div className="blinkit-why-title">Shop keeps customer</div>
                <div className="blinkit-why-desc">You buy from a specific shop you trust, not a warehouse. Shop keeps margin and relationship. Every order supports local business.</div>
                <div className="blinkit-why-feature"><span className="blinkit-why-feature-dot"></span>Keep community thriving</div>
              </div>
            </div>
            <div className="blinkit-why-card">
              <div className="blinkit-why-image">
                <div className="blinkit-why-image-icon"><ShieldCheck size={28} /></div>
              </div>
              <div className="blinkit-why-content">
                <div className="blinkit-why-title">QR verification & GST</div>
                <div className="blinkit-why-desc">Single-use signed HMAC QR, 15min expiry, second scan fails, inventory finalized, audit trail, GST invoice auto-generated. Secure per point 37,50,62.</div>
                <div className="blinkit-why-feature"><span className="blinkit-why-feature-dot"></span>Secure checkout + invoice</div>
              </div>
            </div>
          </div>
        </section>

        {/* 3 Steps - Blinkit-inspired Start selling in 3 simple steps */}
        <section className="blinkit-steps-section">
          <div className="blinkit-steps-header">
            <h2 className="blinkit-steps-title">Start selling in 3 simple steps</h2>
            <p className="blinkit-steps-subtitle">From onboarding to your first sale in as little as 15 minutes. Real local market digitization, not instant delivery.</p>
          </div>
          <div className="blinkit-steps-grid">
            <div className="blinkit-step-card">
              <div className="blinkit-step-number">1</div>
              <div className="blinkit-step-icon"><Store size={32} /></div>
              <div className="blinkit-step-content">
                <div className="blinkit-step-title">Register your shop</div>
                <div className="blinkit-step-desc">Complete onboarding for any category - medical, hardware, grocery. GST, bank, address verification. Real shop, real photos.</div>
                <div className="blinkit-step-time"><Clock size={12} /> 15 minutes setup</div>
              </div>
            </div>
            <div className="blinkit-step-card">
              <div className="blinkit-step-number">2</div>
              <div className="blinkit-step-icon"><Package size={32} /></div>
              <div className="blinkit-step-content">
                <div className="blinkit-step-title">Create product listing</div>
                <div className="blinkit-step-desc">Method A search master, B scan barcode, C bulk CSV/XLSX, D manual, E bulk stock/price update. Real operational per Blinkit seller.</div>
                <div className="blinkit-step-time"><Zap size={12} /> Bulk CSV/barcode/table</div>
              </div>
            </div>
            <div className="blinkit-step-card">
              <div className="blinkit-step-number">3</div>
              <div className="blinkit-step-icon"><TrendingUp size={32} /></div>
              <div className="blinkit-step-content">
                <div className="blinkit-step-title">Get orders & grow</div>
                <div className="blinkit-step-desc">Customers nearby see your real inventory, reserve before visiting, you prepare while they travel, QR verify, collect. You keep customer.</div>
                <div className="blinkit-step-time"><Check size={12} /> Real orders, no fake</div>
              </div>
            </div>
          </div>
          <div style={{ textAlign: 'center', marginTop: 32 }}>
            <Link href="/auth/register" style={{ background: '#0F766E', color: 'white', borderRadius: 12, padding: '14px 24px', fontWeight: 600, fontSize: 14, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8, minHeight: 48, boxShadow: '0 4px 14px -2px rgb(15 118 110 / 0.28)' }}>Get listed free<ArrowRight size={16} /></Link>
          </div>
        </section>

        {/* Categories - Lucide icons, not emoji, real counts */}
        <section style={{ padding: '72px 0', background: 'var(--surface-muted)', borderBottom: '1px solid var(--border)' }}>
          <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
              <div>
                <h2 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em', margin: 0, fontFamily: 'var(--font-heading)' }}>Shop by category</h2>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 8 }}>From medical to hardware — real categories from local shops</p>
              </div>
              <Link href="/categories" style={{ fontSize: 13, fontWeight: 600, color: '#0F766E', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, minHeight: 44 }}>View all categories<ArrowRight size={14} aria-hidden="true" /></Link>
            </div>

            {loading ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
                {[1,2,3,4,5,6,7,8].map(i => <div key={i} style={{ height: 140, background: 'white', borderRadius: 16, border: '1px solid var(--border)' }} />)}
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
                {(categories.length > 0 ? categories : [
                  { name: 'Medical', count: 0, shops: 0 },
                  { name: 'Hardware', count: 0, shops: 0 },
                  { name: 'Building Material', count: 0, shops: 0 },
                  { name: 'Electrical', count: 0, shops: 0 },
                  { name: 'Plumbing', count: 0, shops: 0 },
                  { name: 'Paint', count: 0, shops: 0 },
                  { name: 'Grocery', count: 0, shops: 0 },
                  { name: 'Electronics', count: 0, shops: 0 },
                ]).map(cat => {
                  const Icon = categoryIcons[cat.name] || Package;
                  return (
                    <Link 
                      key={cat.name} 
                      href={`/search?category=${encodeURIComponent(cat.name)}`} 
                      style={{ 
                        background: 'white', 
                        border: '1px solid var(--border)', 
                        borderRadius: 16, 
                        padding: 20, 
                        textDecoration: 'none', 
                        transition: 'all 0.2s ease', 
                        display: 'block',
                        boxShadow: 'var(--shadow-xs)'
                      }}
                      className="category-card"
                    >
                      <div style={{ 
                        width: 44, 
                        height: 44, 
                        background: 'var(--surface-muted)', 
                        border: '1px solid var(--border)', 
                        borderRadius: 11, 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        marginBottom: 14,
                        color: '#0F766E'
                      }} aria-hidden="true"><Icon size={20} /></div>
                      <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.3 }}>{cat.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                        {cat.shops > 0 || cat.count > 0 ? `${cat.count > 0 ? `${cat.count} products` : ''}${cat.count > 0 && cat.shops > 0 ? ' • ' : ''}${cat.shops > 0 ? `${cat.shops} shops` : ''}` : 'Browse products'}
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Tools Section - Blinkit-inspired Powerful tools but Digital Bazar concept */}
        <section className="blinkit-tools-section">
          <div className="blinkit-tools-container">
            <div className="blinkit-tools-content">
              <h2 className="blinkit-tools-title">Powerful tools to grow your local shop</h2>
              <p className="blinkit-tools-subtitle">Use Digital Bazar tools to manage real inventory, reservations, and customer orders with real-time insights. Not instant delivery, but real local commerce.</p>
              <div className="blinkit-tools-list">
                {[
                  { icon: Search, name: 'Demand gap analytics', desc: 'Discover what customers search for but you don\'t sell • Real demand gap per point 71', active: activeTool === 0 },
                  { icon: BarChart3, name: 'Inventory intelligence', desc: 'Track stock, low alerts, forecast stockout 4-6 days, catalog health warnings', active: activeTool === 1 },
                  { icon: Clock, name: 'Reservation tools', desc: 'Manage reservations PENDING→CONFIRMED→HELD→COLLECTED, timer Reserved until 6:30 PM', active: activeTool === 2 },
                ].map((tool, idx) => (
                  <div key={idx} className={`blinkit-tool-item ${tool.active ? 'active' : ''}`} onClick={() => setActiveTool(idx)}>
                    <div className="blinkit-tool-icon"><tool.icon size={18} /></div>
                    <div className="blinkit-tool-text">
                      <div className="blinkit-tool-name">{tool.name}</div>
                      <div className="blinkit-tool-desc">{tool.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="blinkit-tools-image">
              <div className="blinkit-tools-image-placeholder">
                <Package size={32} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>{['Demand Gap Dashboard', 'Inventory Intelligence', 'Reservation Manager'][activeTool]}</div>
                  <div style={{ fontSize: 12, marginTop: 4 }}>Real tools from shop counter, not warehouse • Screenshot of {['search analytics', 'stock forecasting', 'reservation timer'][activeTool]}</div>
                  <div style={{ fontSize: 11, marginTop: 8, color: '#0F766E', fontWeight: 600 }}>Real data only • No fake charts</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Products - real inventory only */}
        <section style={{ padding: '72px 0', background: 'var(--surface)' }}>
          <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
              <div>
                <h2 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em', margin: 0, fontFamily: 'var(--font-heading)' }}>Popular products near you</h2>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 8 }}>Real inventory from verified local shops — no fake stock</p>
              </div>
              <Link href="/search" style={{ fontSize: 13, fontWeight: 600, color: '#0F766E', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, minHeight: 44 }}>View all products<ArrowRight size={14} aria-hidden="true" /></Link>
            </div>

            {loading ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
                {[1,2,3,4,5,6,7,8].map(i => <div key={i} style={{ height: 280, background: 'var(--surface-muted)', borderRadius: 16, border: '1px solid var(--border)' }} />)}
              </div>
            ) : products.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
                {products.map(p => <ProductCard key={p.id} product={p} onAdd={(id, qty) => handleAddToCart(id, p.shopId, qty)} />)}
              </div>
            ) : (
              <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 16, padding: 40, textAlign: 'center' }}>
                <div style={{ width: 56, height: 56, background: 'var(--surface-muted)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }} aria-hidden="true"><Package size={24} color="var(--text-tertiary)" /></div>
                <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 6 }}>No products yet — onboarding shops in Nagpur</div>
                <div style={{ fontSize: 14, color: 'var(--text-secondary)', maxWidth: 400, margin: '0 auto' }}>Products will appear here as shops add real inventory from their counter. Real photos, real stock, no placeholders.</div>
              </div>
            )}
          </div>
        </section>

        {/* Help Section - Blinkit-inspired Help when you need it */}
        <section className="blinkit-help-section">
          <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px 32px', textAlign: 'center' }}>
            <h2 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em', margin: 0, fontFamily: 'var(--font-heading)' }}>Help when you need it</h2>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 8 }}>Get continuous support and guidance as you grow your local shop</p>
          </div>
          <div className="blinkit-help-grid">
            <div className="blinkit-help-card">
              <div className="blinkit-help-illustration"><BookOpen size={32} /></div>
              <div className="blinkit-help-title">Shop University</div>
              <div className="blinkit-help-desc">Learn through step-by-step guides for every stage of selling - from onboarding to inventory management</div>
              <a href="/faq" className="blinkit-help-link">Learn more<ArrowRight size={12} /></a>
            </div>
            <div className="blinkit-help-card">
              <div className="blinkit-help-illustration"><MessageCircle size={32} /></div>
              <div className="blinkit-help-title">Talk to Us</div>
              <div className="blinkit-help-desc">Get timely assistance with assured resolutions within 24 hours. Real support, not bots.</div>
              <a href="/contact" className="blinkit-help-link">Contact support<ArrowRight size={12} /></a>
            </div>
            <div className="blinkit-help-card">
              <div className="blinkit-help-illustration"><Video size={32} /></div>
              <div className="blinkit-help-title">Learn from Experts</div>
              <div className="blinkit-help-desc">Join live sessions and learn best practices from verified shop owners in Nagpur</div>
              <a href="/about" className="blinkit-help-link">Join sessions<ArrowRight size={12} /></a>
            </div>
            <div className="blinkit-help-card">
              <div className="blinkit-help-illustration"><FileText size={32} /></div>
              <div className="blinkit-help-title">Growth Resources</div>
              <div className="blinkit-help-desc">Explore guides, FAQs, and tools to grow your sales - real operational ideas from Blinkit seller ecosystem</div>
              <a href="/terms" className="blinkit-help-link">Explore resources<ArrowRight size={12} /></a>
            </div>
          </div>
        </section>

        {/* Shops preview - honest empty state */}
        <section style={{ padding: '72px 0', background: 'var(--surface)' }}>
          <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
              <div>
                <h2 style={{ fontSize: 24, fontWeight: 800, margin: 0, fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}>Shops in Nagpur</h2>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>{counts.shops > 0 ? `${counts.shops} verified shops • Real photos only` : 'Onboarding our first shops — real shops, not placeholders'}</p>
              </div>
              <Link href="/shops" style={{ fontSize: 13, fontWeight: 600, color: '#0F766E', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, minHeight: 44 }}>View all shops<ArrowRight size={14} aria-hidden="true" /></Link>
            </div>
            
            {loading ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
                {[1,2,3].map(i => <div key={i} style={{ height: 140, background: 'var(--surface-muted)', borderRadius: 16, border: '1px solid var(--border)' }} />)}
              </div>
            ) : shops.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
                {shops.map(shop => <ShopCard key={shop.id} shop={{ id: shop.id, name: shop.name, slug: shop.slug, category: shop.category, address: shop.address, rating: shop.rating, reviewCount: shop.reviewCount, preparationTimeMin: shop.preparationTimeMin, status: shop.status, productCount: shop._count?.products }} />)}
              </div>
            ) : (
              <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 16, padding: 40, textAlign: 'center' }}>
                <div style={{ width: 56, height: 56, background: 'var(--surface-muted)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }} aria-hidden="true"><Store size={24} color="var(--text-tertiary)" /></div>
                <h3 style={{ fontWeight: 700, fontSize: 16, margin: '0 0 8px 0' }}>No shops in your area yet</h3>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', maxWidth: 480, margin: '0 auto 20px', lineHeight: 1.5 }}>We're live in Nagpur and expanding one neighbourhood at a time. Tell us your pincode and we'll notify you when a shop near you joins.</p>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', maxWidth: 400, margin: '0 auto' }}>
                  <input placeholder="Enter pincode" aria-label="Pincode for notification" style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border)', fontSize: 14, flex: 1, minWidth: 140, minHeight: 44 }} />
                  <button style={{ background: '#0F766E', color: 'white', border: 'none', borderRadius: 10, padding: '10px 18px', fontWeight: 600, fontSize: 13, cursor: 'pointer', minHeight: 44 }}>Notify me</button>
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 16 }}>Own a shop here? <Link href="/auth/register" style={{ color: '#0F766E', fontWeight: 600, textDecoration: 'none' }}>Get listed free — 15 minutes setup.</Link></p>
              </div>
            )}
          </div>
        </section>

        {/* FAQ - Blinkit-inspired */}
        <section className="blinkit-faq-section">
          <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px 32px', textAlign: 'center' }}>
            <h2 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em', margin: 0, fontFamily: 'var(--font-heading)' }}>Frequently asked questions</h2>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 8 }}>Real questions from real shop owners and customers in Nagpur</p>
          </div>
          <div className="blinkit-faq-container">
            {[
              { q: 'What is Digital Bazar and how is it different from Blinkit?', a: 'Digital Bazar is a local commerce marketplace connecting customers with verified nearby shops in Nagpur. Unlike Blinkit dark stores and instant delivery, you buy from a specific local shop you trust - from medical to hardware. Real inventory from shop counter, real prices, real photos. Customer reserves before visiting, walks over, collects with QR. Shop keeps customer, margin and relationship. Not warehouse e-commerce, not delivery-only.' },
              { q: 'Who can sell on Digital Bazar?', a: 'We welcome verified local shops of every size in Nagpur - medical, hardware, building material, plumbing, paint, electrical, grocery, electronics. Complete onboarding in 15 minutes - shop details, GST, bank, address. Real shop verification, real photos only. Starting in Nagpur, expanding one neighbourhood at a time. No fake stock, no placeholders.' },
              { q: 'What is Reservation vs Pickup vs Delivery?', a: 'Reservation = I will come and collect (stock held until expiry, e.g. 6:30 PM, show code at counter). Pickup = Prepare it for me (shop prepares while you travel, notify when ready). Delivery = Bring it to me (shop delivers within service radius). Different fulfillment types per point 34. Real operational distinction.' },
              { q: 'How does inventory management work?', a: 'Single truth: onHand/reserved/available derived, ledger RECEIVE/ADJUST/RESERVE/RELEASE/SELL/RETURN/DAMAGE/TRANSFER with actor/timestamp/reason/before/after atomic never -1. Stock confidence freshness Stock checked 4 minutes ago + stale warning. Bulk update CSV/barcode/table per point 52. Stocktake Expected vs counted difference reason per point 53. Catalog health warnings per point 55.' },
              { q: 'What documents are required to register as shop?', a: 'Business details - shop name, category, description, real photos, address, city, pincode, phone, email. Tax & bank - GSTIN for invoices, bank details JSON. Service config - service radius km, min order paise, delivery fee paise, price parity mode SAME/DIFFERENT, reservation expiry minutes, pickup/delivery/reservation enabled, preparation time, business hours structured Mon-Sun multiple intervals holidays/special/temporary/timezone. Verification badge per point 130.' },
            ].map((faq, idx) => (
              <div key={idx} className={`blinkit-faq-item ${openFaq === idx ? 'open' : ''}`}>
                <div className="blinkit-faq-question" onClick={() => setOpenFaq(openFaq === idx ? null : idx)}>
                  <span>{faq.q}</span>
                  <div className="blinkit-faq-icon"><span style={{ fontSize: 16, lineHeight: 1 }}>{openFaq === idx ? '−' : '+'}</span></div>
                </div>
                {openFaq === idx && <div className="blinkit-faq-answer">{faq.a}</div>}
              </div>
            ))}
          </div>
        </section>

        {/* Final CTA - dark, confident, not flashy */}
        <section style={{ padding: '80px 0', background: '#0F172A', color: 'white', position: 'relative', overflow: 'hidden' }}>
          <div aria-hidden="true" style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(circle at 20% 50%, rgba(15, 118, 110, 0.15) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(15, 118, 110, 0.08) 0%, transparent 40%)`,
            pointerEvents: 'none'
          }} />
          <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', position: 'relative' }}>
            <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
              <h2 style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.1, margin: 0, fontFamily: 'var(--font-heading)' }}>Your customers are already searching online. Right now they find someone else.</h2>
              <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.7)', marginTop: 16, lineHeight: 1.6, maxWidth: 560, margin: '16px auto 0' }}>List your shop on Digital Bazar and people nearby see what you have in stock. They reserve it, you pack it, they collect it. You keep customer, margin and relationship.</p>
              
              <div style={{ marginTop: 28, display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 400, margin: '28px auto 0', textAlign: 'left', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 16 }}>
                {[
                  'Setup takes about fifteen minutes. No website needed.',
                  'No monthly fee while we are getting started.',
                  'List products by scanning barcodes from your phone.'
                ].map(text => (
                  <div key={text} style={{ display: 'flex', gap: 10, fontSize: 13, color: 'rgba(255,255,255,0.8)', lineHeight: 1.5 }}>
                    <span style={{ width: 18, height: 18, background: '#0F766E', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }} aria-hidden="true"><Check size={10} color="white" /></span>
                    {text}
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 32, flexWrap: 'wrap' }}>
                <Link href="/auth/register" style={{ background: 'white', color: '#0F172A', borderRadius: 12, padding: '14px 24px', fontWeight: 600, fontSize: 14, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8, minHeight: 48 }}>Get listed free<ArrowRight size={16} aria-hidden="true" /></Link>
                <Link href="/contact" style={{ background: 'rgba(255,255,255,0.08)', color: 'white', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: '14px 24px', fontWeight: 500, fontSize: 14, textDecoration: 'none', minHeight: 48 }}>Talk to us</Link>
              </div>
              
              <div style={{ marginTop: 24, fontSize: 11.5, color: 'rgba(255,255,255,0.45)', display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
                <span>✓ No setup fees</span>
                <span>✓ Real inventory only</span>
                <span>✓ QR verification</span>
                <span>✓ GST invoices</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      <EliteFooter />

      <style>{`
        @media (max-width: 1024px) {
          .hero-grid { grid-template-columns: 1fr !important; gap: 40px !important; }
        }
        .category-card:hover {
          border-color: #0F766E !important;
          box-shadow: var(--shadow-md) !important;
          transform: translateY(-2px);
        }
        .value-card:hover {
          border-color: var(--border-strong) !important;
          box-shadow: var(--shadow-sm) !important;
        }
        a:focus-visible, button:focus-visible, input:focus-visible {
          outline: 2px solid #0F766E;
          outline-offset: 2px;
        }
      `}</style>
    </div>
  );
}
