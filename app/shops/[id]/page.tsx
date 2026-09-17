'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { EliteHeader } from '@/components/layout/EliteHeader';
import { EliteFooter } from '@/components/layout/EliteFooter';
import { ProductCard } from '@/components/customer/ProductCard';
import { Star, MapPin, Clock, Phone, Package, Search, Store, Timer, ShieldCheck, Truck, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function ShopPage() {
  const params = useParams();
  const id = params.id as string;
  const [shop, setShop] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCat, setSelectedCat] = useState('');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('popular');

  useEffect(() => { fetchShop(); }, [id]);

  const fetchShop = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/shops/${id}`);
      if (!res.ok) throw new Error('Shop not found');
      const data = await res.json();
      if (data.shop) {
        setShop(data.shop);
        setProducts(data.products || []);
        setCategories(data.categories || []);
      } else throw new Error('Shop not found');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const getOpenStatus = () => {
    if (!shop) return { isOpen: false, text: 'Unknown', color: 'var(--text-tertiary)' };
    const hour = new Date().getHours();
    if (shop.status !== 'APPROVED') return { isOpen: false, text: 'Unavailable', color: 'var(--text-tertiary)' };
    if (hour >= 9 && hour < 20) return { isOpen: true, text: `Open • Closes at ${shop.closingHours || '20:00'}`, color: 'var(--success)' };
    return { isOpen: false, text: 'Closed', color: 'var(--text-tertiary)' };
  };

  const filtered = products.filter(p => {
    if (selectedCat && p.category?.name !== selectedCat) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.brand?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }).sort((a, b) => {
    if (sortBy === 'price_low') return a.price - b.price;
    if (sortBy === 'price_high') return b.price - a.price;
    return b.stock - a.stock;
  });

  const handleAddToCart = async (productId: string, qty: number = 1) => {
    try {
      const res = await fetch('/api/cart/add', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ shopId: shop.id, productId, quantity: qty }) });
      if (res.ok) {
        const count = parseInt(localStorage.getItem('db_cart_count') || '0') + qty;
        localStorage.setItem('db_cart_count', count.toString());
        window.dispatchEvent(new Event('cart-updated'));
      }
    } catch {}
  };

  if (loading) {
    return (
      <div style={{ background: 'var(--background)', minHeight: '100vh' }}>
        <EliteHeader />
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '40px 24px' }}>
          <div style={{ height: 200, background: 'white', borderRadius: 16, border: '1px solid var(--border)' }} />
        </div>
      </div>
    );
  }

  if (error || !shop) {
    return (
      <div style={{ background: 'var(--background)', minHeight: '100vh' }}>
        <EliteHeader />
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '80px 24px', textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, background: 'white', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', border: '1px solid var(--border)' }}><Store size={24} color="var(--text-tertiary)" /></div>
          <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 8 }}>Shop not found</div>
          <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 20 }}>{error || 'This shop does not exist'}</div>
          <Link href="/shops" style={{ background: 'var(--brand)', color: 'white', borderRadius: 10, padding: '10px 20px', fontWeight: 600, textDecoration: 'none' }}>Browse shops</Link>
        </div>
        <EliteFooter />
      </div>
    );
  }

  const openStatus = getOpenStatus();

  return (
    <div style={{ background: 'var(--background)', minHeight: '100vh' }}>
      <EliteHeader />

      <main>
        <div style={{ background: 'white', borderBottom: '1px solid var(--border)' }}>
          {shop.coverUrl && <div style={{ height: 200, background: `url(${shop.coverUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />}
          <div style={{ maxWidth: 1280, margin: '0 auto', padding: '24px' }}>
            <Link href="/shops" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-secondary)', textDecoration: 'none', marginBottom: 20 }}><ArrowLeft size={14} />Back to shops</Link>

            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              <div style={{ width: 80, height: 80, background: shop.logoUrl ? `url(${shop.logoUrl})` : 'var(--brand-light)', backgroundSize: 'cover', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 700, color: 'var(--brand)', border: '1px solid var(--border)', flexShrink: 0 }}>{!shop.logoUrl && shop.name.slice(0,2).toUpperCase()}</div>
              <div style={{ flex: 1, minWidth: 300 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em', margin: 0, fontFamily: 'var(--font-heading)' }}>{shop.name}</h1>
                  <span style={{ fontSize: 11, fontWeight: 600, color: openStatus.color, background: `${openStatus.color}15`, padding: '4px 10px', borderRadius: 100, border: `1px solid ${openStatus.color}30` }}>{openStatus.text}</span>
                </div>
                <div style={{ display: 'flex', gap: 12, marginTop: 10, flexWrap: 'wrap', fontSize: 13, color: 'var(--text-secondary)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Store size={14} />{shop.category}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Star size={14} fill="#F59E0B" color="#F59E0B" />{shop.rating?.toFixed(1) || 'New'} ({shop.reviewCount || 0})</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Timer size={14} />{shop.preparationTimeMin} min prep</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={14} />{shop.city}</span>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                  {shop.isPickupEnabled && <span style={{ fontSize: 11, background: 'var(--success-light)', color: 'var(--success)', padding: '5px 10px', borderRadius: 100, display: 'flex', alignItems: 'center', gap: 4 }}><Package size={12} />Pickup</span>}
                  {shop.isDeliveryEnabled && <span style={{ fontSize: 11, background: 'var(--brand-light)', color: 'var(--brand)', padding: '5px 10px', borderRadius: 100 }}><Truck size={12} />Delivery</span>}
                  <span style={{ fontSize: 11, background: 'var(--surface-muted)', padding: '5px 10px', borderRadius: 100, border: '1px solid var(--border)' }}>{shop._count?.products || products.length} products</span>
                </div>
                {shop.description && <div style={{ marginTop: 12, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, maxWidth: 600 }}>{shop.description}</div>}
              </div>
            </div>
          </div>
        </div>

        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '24px' }}>
          <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 16, padding: 16, marginBottom: 20, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
              <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder={`Search in ${shop.name}`} style={{ width: '100%', padding: '10px 12px 10px 36px', borderRadius: 10, border: '1px solid var(--border)', fontSize: 13, outline: 'none' }} />
            </div>
            <select value={selectedCat} onChange={e => setSelectedCat(e.target.value)} style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border)', fontSize: 13, background: 'white', minWidth: 160 }}>
              <option value="">All categories</option>
              {categories.map((cat: any) => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
            </select>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border)', fontSize: 13, background: 'white' }}>
              <option value="popular">Most popular</option>
              <option value="price_low">Price: Low to high</option>
              <option value="price_high">Price: High to low</option>
            </select>
          </div>

          {filtered.length === 0 ? (
            <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 16, padding: 40, textAlign: 'center' }}>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>No products found</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Try different search or category</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
              {filtered.map(p => <ProductCard key={p.id} product={p} onAdd={(id, qty) => handleAddToCart(id, qty)} />)}
            </div>
          )}
        </div>
      </main>

      <EliteFooter />
    </div>
  );
}
