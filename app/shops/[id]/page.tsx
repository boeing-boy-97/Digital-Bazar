'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Header } from '@/components/common/Header';
import { BottomNav } from '@/components/common/BottomNav';
import { ProductCard } from '@/components/customer/ProductCard';
import { Star, MapPin, Clock, Phone, Package, Search, Navigation, Store, Timer, ShieldCheck, Truck } from 'lucide-react';
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

  useEffect(() => {
    fetchShop();
  }, [id]);

  const fetchShop = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/shops/${id}`);
      if (!res.ok) throw new Error('Shop not found');
      const data = await res.json();
      if (data.shop) {
        setShop(data.shop);
        setProducts(data.products || []);
        setCategories(data.categories || []);
      } else {
        throw new Error('Shop not found');
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const getOpenStatus = () => {
    if (!shop) return { isOpen: false, text: 'Unknown', color: 'var(--text-tertiary)' };
    
    const now = new Date();
    const hour = now.getHours();
    
    if (shop.status === 'PAUSED' || shop.status === 'TEMPORARILY_CLOSED') {
      return { isOpen: false, text: 'Temporarily unavailable', color: 'var(--warning)' };
    }
    if (shop.status !== 'APPROVED') {
      return { isOpen: false, text: 'Unavailable', color: 'var(--text-tertiary)' };
    }
    
    if (shop.openingHours && shop.closingHours) {
      const open = parseInt(shop.openingHours.split(':')[0]);
      const close = parseInt(shop.closingHours.split(':')[0]);
      if (hour < open) return { isOpen: false, text: `Opens at ${shop.openingHours}`, color: 'var(--text-tertiary)' };
      if (hour >= close) return { isOpen: false, text: 'Closed', color: 'var(--text-tertiary)' };
      if (close - hour <= 1) return { isOpen: true, text: `Closing soon • Closes at ${shop.closingHours}`, color: 'var(--warning)' };
      return { isOpen: true, text: `Open • Closes at ${shop.closingHours}`, color: 'var(--success)' };
    }
    
    if (hour >= 9 && hour < 20) return { isOpen: true, text: 'Open', color: 'var(--success)' };
    return { isOpen: false, text: 'Closed', color: 'var(--text-tertiary)' };
  };

  const filteredProducts = products
    .filter(p => {
      if (selectedCat && p.category?.name !== selectedCat) return false;
      if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.brand?.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'price_low') return a.price - b.price;
      if (sortBy === 'price_high') return b.price - a.price;
      if (sortBy === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return b.stock - a.stock; // popular = in stock first
    });

  const handleAddToCart = async (productId: string, qty: number = 1) => {
    try {
      const res = await fetch('/api/cart/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shopId: shop.id, productId, quantity: qty })
      });
      const data = await res.json();
      if (res.ok) {
        const count = parseInt(localStorage.getItem('db_cart_count') || '0') + qty;
        localStorage.setItem('db_cart_count', count.toString());
        window.dispatchEvent(new Event('cart-updated'));
      } else {
        alert(data.error || data.error?.message || 'Unable to add to cart');
      }
    } catch {
      alert('Unable to add to cart. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="page">
        <Header />
        <main className="main-content">
          <div className="container" style={{ paddingTop: 24 }}>
            <div className="skeleton" style={{ height: 200, borderRadius: 16 }} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16, marginTop: 24 }}>
              {[1,2,3,4].map(i => (
                <div key={i} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                  <div className="skeleton" style={{ height: 180 }} />
                  <div style={{ padding: 12 }}>
                    <div className="skeleton" style={{ height: 14, width: '80%' }} />
                    <div className="skeleton" style={{ height: 12, width: '40%', marginTop: 8 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !shop) {
    return (
      <div className="page">
        <Header />
        <main className="main-content">
          <div className="container" style={{ paddingTop: 48, paddingBottom: 80, textAlign: 'center' }}>
            <div style={{ width: 56, height: 56, background: 'var(--surface-muted)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Store size={24} color="var(--text-tertiary)" />
            </div>
            <div style={{ fontWeight: 600, fontSize: '18px', marginBottom: 8 }}>Shop not found</div>
            <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: 20 }}>{error || 'This shop does not exist or is not available'}</div>
            <Link href="/shops" className="btn btn-primary">Browse shops</Link>
          </div>
        </main>
        <BottomNav />
      </div>
    );
  }

  const openStatus = getOpenStatus();
  const hasRatings = shop.reviewCount > 0 && shop.rating > 0;

  return (
    <div className="page">
      <Header />
      <main className="main-content">
        {/* Shop Header - Professional for ALL product types */}
        <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
          {shop.coverUrl && (
            <div style={{ height: 200, background: `url(${shop.coverUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
          )}
          <div className="container" style={{ paddingTop: 24, paddingBottom: 24 }}>
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              <div style={{ width: 80, height: 80, background: shop.logoUrl ? `url(${shop.logoUrl})` : 'var(--brand-light)', backgroundSize: 'cover', backgroundPosition: 'center', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 700, color: 'var(--brand)', border: '1px solid var(--border)', flexShrink: 0 }}>
                {!shop.logoUrl && shop.name.slice(0,2).toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 300 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <h1 style={{ fontSize: '26px', fontWeight: 700, letterSpacing: '-0.02em' }}>{shop.name}</h1>
                  <span style={{ fontSize: '12px', fontWeight: 500, color: openStatus.color, background: `${openStatus.color}15`, padding: '4px 10px', borderRadius: 20, border: `1px solid ${openStatus.color}30`, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: openStatus.color, display: 'inline-block' }}></span>
                    {openStatus.text}
                  </span>
                </div>
                
                <div style={{ display: 'flex', gap: 12, marginTop: 10, flexWrap: 'wrap', fontSize: '13px', color: 'var(--text-secondary)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Store size={14} />
                    {shop.category}
                  </span>
                  {hasRatings ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Star size={14} fill="#F59E0B" color="#F59E0B" />
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{shop.rating.toFixed(1)}</span>
                      <span>({shop.reviewCount} reviews)</span>
                    </span>
                  ) : (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-tertiary)' }}>
                      <Star size={14} />
                      No reviews yet
                    </span>
                  )}
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Timer size={14} />
                    {shop.preparationTimeMin} min prep
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <MapPin size={14} />
                    {shop.city} • {shop.address.slice(0, 40)}
                  </span>
                </div>
                
                <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
                  {shop.isPickupEnabled && <span style={{ fontSize: '12px', background: 'var(--success-light)', color: 'var(--success)', padding: '5px 10px', borderRadius: 20, display: 'flex', alignItems: 'center', gap: 4 }}><Package size={12} />Pickup available</span>}
                  {shop.isDeliveryEnabled && <span style={{ fontSize: '12px', background: 'var(--brand-light)', color: 'var(--brand)', padding: '5px 10px', borderRadius: 20, display: 'flex', alignItems: 'center', gap: 4 }}><Truck size={12} />Delivery available</span>}
                  <span style={{ fontSize: '12px', background: 'var(--surface-muted)', color: 'var(--text-secondary)', padding: '5px 10px', borderRadius: 20 }}>{shop._count?.products || products.length} products • All categories from medical to hardware</span>
                  {shop.gstin && <span style={{ fontSize: '12px', background: 'var(--surface-muted)', padding: '5px 10px', borderRadius: 20, display: 'flex', alignItems: 'center', gap: 4 }}><ShieldCheck size={12} />GST verified</span>}
                </div>

                {shop.description && (
                  <div style={{ marginTop: 14, fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.5, maxWidth: 600 }}>{shop.description}</div>
                )}
              </div>
              
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <Link href={`/cart?shop=${shop.id}`} className="btn btn-secondary" style={{ borderRadius: 8 }}>
                  <Package size={16} />
                  View cart
                </Link>
                {shop.phone && (
                  <a href={`tel:${shop.phone}`} className="btn btn-primary" style={{ borderRadius: 8 }}>
                    <Phone size={16} />
                    Contact
                  </a>
                )}
              </div>
            </div>

            {/* Shop details - for ALL product types */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginTop: 20, paddingTop: 20, borderTop: '1px solid var(--border-light)' }}>
              <div style={{ display: 'flex', gap: 10 }}>
                <div style={{ width: 36, height: 36, background: 'var(--surface-muted)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <MapPin size={16} color="var(--text-secondary)" />
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>Address</div>
                  <div style={{ fontSize: '13px', marginTop: 2, lineHeight: 1.4 }}>{shop.address}, {shop.city} {shop.pincode}</div>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: 10 }}>
                <div style={{ width: 36, height: 36, background: 'var(--surface-muted)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Clock size={16} color="var(--text-secondary)" />
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>Hours</div>
                  <div style={{ fontSize: '13px', marginTop: 2 }}>{shop.openingHours || '09:00'} - {shop.closingHours || '20:00'} • {shop.holidays ? 'Holidays: ' + shop.holidays : 'Open all days'}</div>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: 10 }}>
                <div style={{ width: 36, height: 36, background: 'var(--surface-muted)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Timer size={16} color="var(--text-secondary)" />
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>Preparation</div>
                  <div style={{ fontSize: '13px', marginTop: 2 }}>Average {shop.preparationTimeMin} minutes • Order ahead and collect when ready</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="container" style={{ paddingTop: 24, paddingBottom: 88 }}>
          {/* Search and filters - works for ALL categories */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 16, marginBottom: 20 }}>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
                <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                <input className="form-input" placeholder={`Search in ${shop.name} - all products from medical to hardware`} value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 36, borderRadius: 8 }} />
              </div>
              <select className="form-select" style={{ minWidth: 160, borderRadius: 8 }} value={selectedCat} onChange={e => setSelectedCat(e.target.value)}>
                <option value="">All categories</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.name}>{cat.name} ({cat._count?.products || 0})</option>
                ))}
              </select>
              <select className="form-select" style={{ minWidth: 140, borderRadius: 8 }} value={sortBy} onChange={e => setSortBy(e.target.value)}>
                <option value="popular">Most popular</option>
                <option value="price_low">Price: Low to high</option>
                <option value="price_high">Price: High to low</option>
                <option value="newest">Newest</option>
              </select>
            </div>
            {(search || selectedCat) && (
              <div style={{ marginTop: 12, fontSize: '12px', color: 'var(--text-secondary)' }}>
                Showing {filteredProducts.length} of {products.length} products
                {search && ` for "${search}"`}
                {selectedCat && ` in ${selectedCat}`}
              </div>
            )}
          </div>

          {filteredProducts.length === 0 ? (
            <div className="card" style={{ padding: 40, textAlign: 'center' }}>
              <div style={{ width: 56, height: 56, background: 'var(--surface-muted)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <Package size={24} color="var(--text-tertiary)" />
              </div>
              <div style={{ fontWeight: 600, fontSize: '16px', marginBottom: 8 }}>{search || selectedCat ? 'No products found' : 'No products yet'}</div>
              <div style={{ fontSize: '14px', color: 'var(--text-secondary)', maxWidth: 400, margin: '0 auto', lineHeight: 1.5 }}>
                {search || selectedCat ? 'Try different search or category filter' : `${shop.name} hasn't added products yet. Check back later for products across all categories from medical to hardware.`}
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
              {filteredProducts.map(product => (
                <ProductCard key={product.id} product={product} onAdd={(id, qty) => handleAddToCart(id, qty)} />
              ))}
            </div>
          )}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
