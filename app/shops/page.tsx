'use client';
import { useEffect, useState } from 'react';
import { Header } from '@/components/common/Header';
import { BottomNav } from '@/components/common/BottomNav';
import { ShopCard } from '@/components/customer/ShopCard';
import { Search, Filter, MapPin, Clock, Star, Navigation, X } from 'lucide-react';

export default function ShopsPage() {
  const [shops, setShops] = useState<any[]>([]);
  const [filteredShops, setFilteredShops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [openNow, setOpenNow] = useState(false);
  const [sortBy, setSortBy] = useState('distance');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    fetchShops();
    loadUserLocation();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [shops, search, category, openNow, sortBy]);

  const loadUserLocation = () => {
    try {
      const saved = localStorage.getItem('db_user_location');
      if (saved) {
        setUserLocation(JSON.parse(saved));
      }
    } catch {}
  };

  const getShopOpenStatus = (shop: any) => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentDay = now.getDay();
    
    if (shop.holidays) {
      try {
        const holidays = JSON.parse(shop.holidays);
        if (holidays.includes(currentDay)) {
          return { isOpen: false, status: 'Closed' };
        }
      } catch {}
    }

    if (shop.openingHours && shop.closingHours) {
      try {
        const openHour = parseInt(shop.openingHours.split(':')[0]);
        const closeHour = parseInt(shop.closingHours.split(':')[0]);
        
        if (currentHour < openHour) {
          const hoursUntilOpen = openHour - currentHour;
          if (hoursUntilOpen <= 2) {
            return { isOpen: false, status: 'Opening soon' };
          }
          return { isOpen: false, status: 'Closed' };
        }
        
        if (currentHour >= closeHour) {
          return { isOpen: false, status: 'Closed' };
        }
        
        return { isOpen: true, status: 'Open' };
      } catch {}
    }

    if (shop.status === 'TEMPORARILY_CLOSED' || shop.status === 'PAUSED') {
      return { isOpen: false, status: 'Temporarily unavailable' };
    }

    if (shop.status !== 'APPROVED') {
      return { isOpen: false, status: 'Unavailable' };
    }

    if (currentHour >= 9 && currentHour < 20) {
      return { isOpen: true, status: 'Open' };
    }
    
    return { isOpen: false, status: 'Closed' };
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const fetchShops = async (q?: string, cat?: string) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (q || search) params.set('search', q || search);
      if (cat || category) params.set('category', cat || category);
      
      const res = await fetch(`/api/shops?${params.toString()}`);
      if (!res.ok) throw new Error('Unable to load shops');
      
      const data = await res.json();
      let shopsData = data.shops || [];

      // Add distance if user location available
      if (userLocation) {
        shopsData = shopsData.map((shop: any) => {
          if (shop.latitude && shop.longitude) {
            const distance = calculateDistance(userLocation.lat, userLocation.lng, shop.latitude, shop.longitude);
            return { ...shop, distance };
          }
          return shop;
        });
      }

      // Add real open status
      shopsData = shopsData.map((shop: any) => {
        const openStatus = getShopOpenStatus(shop);
        return { ...shop, isOpen: openStatus.isOpen, openStatus: openStatus.status };
      });

      setShops(shopsData);

      // Extract real categories
      const cats = [...new Set(shopsData.map((s: any) => s.category).filter(Boolean))] as string[];
      setCategories(cats);
    } catch (e: any) {
      setError(e.message);
      setShops([]);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...shops];

    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(s => 
        s.name.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q) ||
        s.address.toLowerCase().includes(q) ||
        s.city.toLowerCase().includes(q)
      );
    }

    if (category) {
      filtered = filtered.filter(s => s.category === category);
    }

    if (openNow) {
      filtered = filtered.filter(s => s.isOpen === true);
    }

    // Sort
    if (sortBy === 'distance' && userLocation) {
      filtered.sort((a, b) => (a.distance || 999) - (b.distance || 999));
    } else if (sortBy === 'rating') {
      filtered.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === 'products') {
      filtered.sort((a, b) => (b._count?.products || 0) - (a._count?.products || 0));
    } else {
      // Default: open first, then rating
      filtered.sort((a, b) => {
        if (a.isOpen && !b.isOpen) return -1;
        if (!a.isOpen && b.isOpen) return 1;
        return b.rating - a.rating;
      });
    }

    setFilteredShops(filtered);
  };

  const handleUseLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation not supported');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(loc);
        localStorage.setItem('db_user_location', JSON.stringify(loc));
        fetchShops();
      },
      (err) => {
        if (err.code === 1) {
          alert('Location permission denied. You can still browse shops without distance sorting.');
        }
      }
    );
  };

  return (
    <div className="page">
      <Header />
      <main className="main-content">
        <div className="container" style={{ paddingTop: 24, paddingBottom: 88 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h1 style={{ fontSize: '26px', fontWeight: 700, letterSpacing: '-0.02em' }}>Nearby shops</h1>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: 4 }}>
                {filteredShops.length > 0 ? `${filteredShops.length} shops in your area` : 'Discover verified local shops'}
                {userLocation && ' • Sorted by distance'}
              </p>
            </div>
            
            {!userLocation && (
              <button className="btn btn-secondary btn-sm" onClick={handleUseLocation} style={{ borderRadius: 8 }}>
                <Navigation size={14} />
                Use my location
              </button>
            )}
          </div>
          
          {/* Filters - Professional */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 16, marginBottom: 20 }}>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ position: 'relative', flex: '1', minWidth: 200 }}>
                <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                <input
                  className="form-input"
                  placeholder="Search shops by name, category or area"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{ paddingLeft: 36, borderRadius: 8 }}
                />
              </div>
              
              <select className="form-select" style={{ minWidth: 160, borderRadius: 8 }} value={category} onChange={e => setCategory(e.target.value)}>
                <option value="">All categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              
              <select className="form-select" style={{ minWidth: 140, borderRadius: 8 }} value={sortBy} onChange={e => setSortBy(e.target.value)}>
                <option value="recommended">Recommended</option>
                <option value="distance">Distance {userLocation ? '' : '(enable location)'}</option>
                <option value="rating">Rating</option>
                <option value="products">Most products</option>
              </select>
              
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '14px', cursor: 'pointer', background: openNow ? 'var(--brand-light)' : 'var(--surface-muted)', padding: '8px 12px', borderRadius: 8, border: `1px solid ${openNow ? 'var(--brand)' : 'var(--border)'}` }}>
                <input type="checkbox" checked={openNow} onChange={e => setOpenNow(e.target.checked)} />
                <Clock size={14} />
                Open now
              </label>

              {(search || category || openNow) && (
                <button className="btn btn-ghost btn-sm" onClick={() => { setSearch(''); setCategory(''); setOpenNow(false); }} style={{ borderRadius: 8 }}>
                  <X size={14} />
                  Clear filters
                </button>
              )}
            </div>
            
            {(search || category || openNow) && (
              <div style={{ marginTop: 12, fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <span>Filters:</span>
                {search && <span style={{ background: 'var(--brand-light)', color: 'var(--brand)', padding: '2px 8px', borderRadius: 20 }}>Search: {search}</span>}
                {category && <span style={{ background: 'var(--brand-light)', color: 'var(--brand)', padding: '2px 8px', borderRadius: 20 }}>{category}</span>}
                {openNow && <span style={{ background: 'var(--success-light)', color: 'var(--success)', padding: '2px 8px', borderRadius: 20 }}>Open now</span>}
                <span>• {filteredShops.length} results</span>
              </div>
            )}
          </div>

          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
              {[1,2,3,4,5,6].map(i => (
                <div key={i} className="card" style={{ padding: 16 }}>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <div className="skeleton" style={{ width: 48, height: 48, borderRadius: 12 }} />
                    <div style={{ flex: 1 }}>
                      <div className="skeleton skeleton-title" style={{ height: 16, width: '70%' }} />
                      <div className="skeleton skeleton-text" style={{ height: 12, width: '50%', marginTop: 8 }} />
                      <div className="skeleton skeleton-text" style={{ height: 12, width: '80%', marginTop: 8 }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="card" style={{ padding: 32, textAlign: 'center' }}>
              <div style={{ width: 48, height: 48, background: 'var(--danger-light)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <span style={{ fontSize: '20px' }}>⚠️</span>
              </div>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>Unable to load shops</div>
              <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: 16 }}>{error}</div>
              <button className="btn btn-primary" onClick={() => fetchShops()}>Try again</button>
            </div>
          ) : filteredShops.length === 0 ? (
            <div className="card" style={{ padding: 40, textAlign: 'center' }}>
              <div style={{ width: 56, height: 56, background: 'var(--surface-muted)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <Search size={24} color="var(--text-tertiary)" />
              </div>
              <div style={{ fontWeight: 600, fontSize: '16px', marginBottom: 8 }}>
                {shops.length === 0 ? 'No shops nearby' : 'No shops found'}
              </div>
              <div style={{ fontSize: '14px', color: 'var(--text-secondary)', maxWidth: 400, margin: '0 auto 20px', lineHeight: 1.5 }}>
                {shops.length === 0 
                  ? 'We couldn\'t find any shops in your area yet. Try changing your location or check back later as more shops join.'
                  : 'No shops match your current filters. Try adjusting your search or clearing filters.'}
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                <button className="btn btn-secondary" onClick={() => { setSearch(''); setCategory(''); setOpenNow(false); }}>
                  Clear filters
                </button>
                <button className="btn btn-primary" onClick={handleUseLocation}>
                  <MapPin size={16} />
                  Change location
                </button>
              </div>
            </div>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
                {filteredShops.map(shop => (
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
              
              <div style={{ marginTop: 24, textAlign: 'center', fontSize: '13px', color: 'var(--text-secondary)' }}>
                Showing {filteredShops.length} of {shops.length} shops
                {userLocation && ' • Sorted by distance from your location'}
              </div>
            </>
          )}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
