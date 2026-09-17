'use client';
import { useEffect, useState } from 'react';
import { EliteHeader } from '@/components/layout/EliteHeader';
import { EliteFooter } from '@/components/layout/EliteFooter';
import { ShopCard } from '@/components/customer/ShopCard';
import { Search, Filter, MapPin, Clock, Star, Navigation, X, Store } from 'lucide-react';
import Link from 'next/link';

export default function ShopsPage() {
  const [shops, setShops] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [openNow, setOpenNow] = useState(false);
  const [sortBy, setSortBy] = useState('recommended');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    fetchShops();
    const saved = localStorage.getItem('db_user_location');
    if (saved) {
      try { setUserLocation(JSON.parse(saved)); } catch {}
    }
  }, []);

  useEffect(() => { applyFilters(); }, [shops, search, category, openNow, sortBy]);

  const getOpenStatus = (shop: any) => {
    const now = new Date();
    const hour = now.getHours();
    if (shop.status === 'PAUSED' || shop.status === 'TEMPORARILY_CLOSED') return { isOpen: false, status: 'Temporarily unavailable' };
    if (shop.status !== 'APPROVED') return { isOpen: false, status: 'Unavailable' };
    if (hour >= 9 && hour < 20) return { isOpen: true, status: 'Open' };
    return { isOpen: false, status: 'Closed' };
  };

  const calcDist = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  };

  const fetchShops = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/shops');
      if (!res.ok) throw new Error('Unable to load shops');
      const data = await res.json();
      let list = (data.shops || []).map((s: any) => {
        const open = getOpenStatus(s);
        let distance = undefined;
        if (userLocation && s.latitude && s.longitude) {
          distance = calcDist(userLocation.lat, userLocation.lng, s.latitude, s.longitude);
        }
        return { ...s, isOpen: open.isOpen, openStatus: open.status, distance };
      });
      setShops(list);
      setCategories([...new Set(list.map((s: any) => s.category).filter(Boolean))] as string[]);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let f = [...shops];
    if (search) {
      const q = search.toLowerCase();
      f = f.filter(s => s.name.toLowerCase().includes(q) || s.category.toLowerCase().includes(q) || s.address.toLowerCase().includes(q));
    }
    if (category) f = f.filter(s => s.category === category);
    if (openNow) f = f.filter(s => s.isOpen);
    if (sortBy === 'distance' && userLocation) f.sort((a,b) => (a.distance||999)-(b.distance||999));
    else if (sortBy === 'rating') f.sort((a,b) => b.rating - a.rating);
    else if (sortBy === 'products') f.sort((a,b) => (b._count?.products||0)-(a._count?.products||0));
    else f.sort((a,b) => { if (a.isOpen && !b.isOpen) return -1; if (!a.isOpen && b.isOpen) return 1; return b.rating - a.rating; });
    setFiltered(f);
  };

  const handleUseLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(pos => {
      const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      setUserLocation(loc);
      localStorage.setItem('db_user_location', JSON.stringify(loc));
      fetchShops();
    });
  };

  return (
    <div style={{ background: 'var(--background)', minHeight: '100vh' }}>
      <EliteHeader />

      <main>
        {/* Header */}
        <section style={{ background: 'white', borderBottom: '1px solid var(--border)', padding: '32px 0 24px' }}>
          <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
              <div>
                <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.02em', margin: 0, fontFamily: 'var(--font-heading)' }}>Nearby shops</h1>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 8 }}>{filtered.length} verified shops • Real inventory • {userLocation ? 'Sorted by distance' : 'Browse by category'}</p>
              </div>
              {!userLocation && (
                <button onClick={handleUseLocation} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--brand)', color: 'white', border: 'none', borderRadius: 10, padding: '10px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  <Navigation size={14} />Use my location
                </button>
              )}
            </div>

            {/* Filters */}
            <div style={{ marginTop: 24, background: 'var(--surface-muted)', border: '1px solid var(--border)', borderRadius: 16, padding: 16 }}>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
                  <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search shops by name, category or area" style={{ width: '100%', padding: '10px 12px 10px 36px', borderRadius: 10, border: '1px solid var(--border)', fontSize: 14, background: 'white', outline: 'none' }} />
                </div>
                <select value={category} onChange={e => setCategory(e.target.value)} style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border)', fontSize: 13, background: 'white', minWidth: 160 }}>
                  <option value="">All categories</option>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border)', fontSize: 13, background: 'white', minWidth: 150 }}>
                  <option value="recommended">Recommended</option>
                  <option value="distance">Distance</option>
                  <option value="rating">Rating</option>
                  <option value="products">Most products</option>
                </select>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer', background: openNow ? 'var(--brand-light)' : 'white', border: `1px solid ${openNow ? 'var(--brand)' : 'var(--border)'}`, padding: '10px 14px', borderRadius: 10 }}>
                  <input type="checkbox" checked={openNow} onChange={e => setOpenNow(e.target.checked)} />Open now
                </label>
                {(search || category || openNow) && (
                  <button onClick={() => { setSearch(''); setCategory(''); setOpenNow(false); }} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'white', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px', fontSize: 13, cursor: 'pointer' }}><X size={14} />Clear</button>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Grid */}
        <section style={{ padding: '32px 0 80px' }}>
          <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
            {loading ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
                {[1,2,3,4,5,6].map(i => <div key={i} style={{ height: 140, background: 'white', borderRadius: 16, border: '1px solid var(--border)' }} />)}
              </div>
            ) : error ? (
              <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 16, padding: 40, textAlign: 'center' }}>
                <div style={{ fontWeight: 600, marginBottom: 8 }}>Unable to load shops</div>
                <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 16 }}>{error}</div>
                <button onClick={fetchShops} style={{ background: 'var(--brand)', color: 'white', border: 'none', borderRadius: 10, padding: '10px 20px', fontWeight: 600, cursor: 'pointer' }}>Try again</button>
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 16, padding: 48, textAlign: 'center' }}>
                <div style={{ width: 56, height: 56, background: 'var(--surface-muted)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}><Store size={24} color="var(--text-tertiary)" /></div>
                <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}>{shops.length === 0 ? 'No shops nearby' : 'No shops found'}</div>
                <div style={{ fontSize: 14, color: 'var(--text-secondary)', maxWidth: 400, margin: '0 auto 20px' }}>{shops.length === 0 ? 'We couldn\'t find shops in your area yet. Try changing location.' : 'Try adjusting your filters or search.'}</div>
                <button onClick={() => { setSearch(''); setCategory(''); setOpenNow(false); }} style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 20px', fontWeight: 500, cursor: 'pointer' }}>Clear filters</button>
              </div>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
                  {filtered.map(shop => (
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
                      isOpen: shop.isOpen,
                      openStatus: shop.openStatus,
                      productCount: shop._count?.products
                    }} />
                  ))}
                </div>
                <div style={{ textAlign: 'center', marginTop: 24, fontSize: 13, color: 'var(--text-secondary)' }}>Showing {filtered.length} of {shops.length} shops</div>
              </>
            )}
          </div>
        </section>
      </main>

      <EliteFooter />
    </div>
  );
}
