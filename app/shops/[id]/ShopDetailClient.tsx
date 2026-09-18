'use client';
import { useEffect, useState } from 'react';
import { ProductCard } from '@/components/customer/ProductCard';
import { Star, MapPin, Package, Search, Store, Timer, Truck, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function ShopDetailClient({ id }: { id: string }) {
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
    if (hour >= 9 && hour < 20) return { isOpen: true, text: `Open • Closes at ${shop.closingHours || '20:00'}`, color: '#059669' };
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
    return <div style={{ maxWidth: 1280, margin: '0 auto', padding: '40px 24px' }}><div style={{ height: 200, background: 'white', borderRadius: 16, border: '1px solid var(--border)' }} /></div>;
  }

  if (error || !shop) {
    return (
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '80px 24px', textAlign: 'center' }}>
        <div style={{ width: 56, height: 56, background: 'white', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', border: '1px solid var(--border)' }} aria-hidden="true"><Store size={24} color="var(--text-tertiary)" /></div>
        <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 8 }}>Shop not found</div>
        <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 20, maxWidth: 400, margin: '0 auto 20px' }}>{error || 'This shop does not exist or is not verified. All shops are verified real shops with real photos.'}</div>
        <Link href="/shops" style={{ background: '#0F766E', color: 'white', borderRadius: 10, padding: '10px 20px', fontWeight: 600, textDecoration: 'none', display: 'inline-block', minHeight: 44 }}>Browse shops</Link>
      </div>
    );
  }

  const openStatus = getOpenStatus();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Store',
    name: shop.name,
    description: shop.description,
    address: shop.address,
    telephone: shop.phone,
    aggregateRating: shop.rating ? { '@type': 'AggregateRating', ratingValue: shop.rating, reviewCount: shop.reviewCount } : undefined,
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div style={{ background: 'white', borderBottom: '1px solid var(--border)' }}>
        {shop.coverUrl && <div style={{ height: 200, background: `url(${shop.coverUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />}
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '24px' }}>
          <Link href="/shops" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-secondary)', textDecoration: 'none', marginBottom: 20, fontWeight: 500 }}><ArrowLeft size={14} aria-hidden="true" />Back to shops</Link>

          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            <div style={{ width: 80, height: 80, background: shop.logoUrl ? `url(${shop.logoUrl})` : '#E6F4F3', backgroundSize: 'cover', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 700, color: '#0F766E', border: '1px solid var(--border)', flexShrink: 0 }} aria-hidden="true">{!shop.logoUrl && shop.name.slice(0,2).toUpperCase()}</div>
            <div style={{ flex: 1, minWidth: 300 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em', margin: 0, fontFamily: 'var(--font-heading)', lineHeight: 1.2 }}>{shop.name}</h1>
                <span style={{ fontSize: 11, fontWeight: 600, color: openStatus.color, background: `${openStatus.color}15`, padding: '4px 10px', borderRadius: 100, border: `1px solid ${openStatus.color}30` }}>{openStatus.text}</span>
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 10, flexWrap: 'wrap', fontSize: 13, color: 'var(--text-secondary)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Store size={14} aria-hidden="true" />{shop.category}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Star size={14} fill="#F59E0B" color="#F59E0B" aria-hidden="true" />{shop.rating?.toFixed(1) || 'New'} ({shop.reviewCount || 0})</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Timer size={14} aria-hidden="true" />{shop.preparationTimeMin} min prep</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={14} aria-hidden="true" />{shop.city} {shop.pincode && `• ${shop.pincode}`}</span>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                {shop.isPickupEnabled && <span style={{ fontSize: 11, background: '#ECFDF5', color: '#059669', padding: '5px 10px', borderRadius: 100, display: 'flex', alignItems: 'center', gap: 4, border: '1px solid #A7F3D0' }}><Package size={12} aria-hidden="true" />Pickup • Real inventory</span>}
                {shop.isDeliveryEnabled && <span style={{ fontSize: 11, background: '#E6F4F3', color: '#0F766E', padding: '5px 10px', borderRadius: 100, border: '1px solid #99F6E0', display: 'flex', alignItems: 'center', gap: 4 }}><Truck size={12} aria-hidden="true" />Delivery</span>}
                <span style={{ fontSize: 11, background: 'var(--surface-muted)', padding: '5px 10px', borderRadius: 100, border: '1px solid var(--border)' }}>{shop._count?.products || products.length} products • Real photos only</span>
              </div>
              {shop.description && <div style={{ marginTop: 12, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, maxWidth: 600 }}>{shop.description}</div>}
              <div style={{ marginTop: 12, fontSize: 12, color: 'var(--text-tertiary)', lineHeight: 1.4 }}>{shop.address} • {shop.gstin ? `GSTIN ${shop.gstin.slice(0,4)}...` : 'GST info available'} • Verified shop • Real photo</div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '24px' }}>
        <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 16, padding: 16, marginBottom: 20, display: 'flex', gap: 12, flexWrap: 'wrap', boxShadow: 'var(--shadow-xs)' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} aria-hidden="true" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder={`Search in ${shop.name}`} aria-label={`Search products in ${shop.name}`} style={{ width: '100%', padding: '10px 12px 10px 36px', borderRadius: 10, border: '1px solid var(--border)', fontSize: 13, outline: 'none', background: 'white', minHeight: 40 }} />
          </div>
          <select value={selectedCat} onChange={e => setSelectedCat(e.target.value)} aria-label="Filter by category" style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border)', fontSize: 13, background: 'white', minWidth: 160, minHeight: 40 }}>
            <option value="">All categories</option>
            {categories.map((cat: any) => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
          </select>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)} aria-label="Sort products" style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border)', fontSize: 13, background: 'white', minHeight: 40 }}>
            <option value="popular">Most popular</option>
            <option value="price_low">Price: Low to high</option>
            <option value="price_high">Price: High to low</option>
          </select>
        </div>

        {filtered.length === 0 ? (
          <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 16, padding: 40, textAlign: 'center', boxShadow: 'var(--shadow-xs)' }}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>No products found in this shop</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>Try different search or category. All products are real inventory from shop counter — no placeholder stock, real photos only.</div>
            <button onClick={() => { setSearch(''); setSelectedCat(''); }} style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)', borderRadius: 10, padding: '8px 16px', fontSize: 13, cursor: 'pointer', minHeight: 40 }}>Clear filters</button>
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
              {filtered.map(p => <ProductCard key={p.id} product={p} onAdd={(id, qty) => handleAddToCart(id, qty)} />)}
            </div>
            <div style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: 'var(--text-tertiary)' }}>{filtered.length} products • Real inventory • Real photos only • From shop counter</div>
          </>
        )}
      </div>
    </>
  );
}
