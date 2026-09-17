'use client';
import { useEffect, useState } from 'react';
import { Header } from '@/components/common/Header';
import { BottomNav } from '@/components/common/BottomNav';
import Link from 'next/link';
import { MapPin, Search, Clock, Package, Store, ArrowRight, Navigation, ChevronDown, Star, Timer } from 'lucide-react';
import { ShopCard } from '@/components/customer/ShopCard';
import { ProductCard } from '@/components/customer/ProductCard';

interface LocationState {
  lat: number | null;
  lng: number | null;
  address: string;
  city: string;
  pincode: string;
  permission: 'granted' | 'denied' | 'prompt' | 'unknown';
}

export default function HomePage() {
  const [shops, setShops] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState<LocationState>({
    lat: null,
    lng: null,
    address: '',
    city: '',
    pincode: '',
    permission: 'unknown'
  });
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  useEffect(() => {
    fetchData();
    loadRecentSearches();
    checkLocationPermission();
  }, []);

  const loadRecentSearches = () => {
    try {
      const saved = localStorage.getItem('db_recent_searches');
      if (saved) setRecentSearches(JSON.parse(saved).slice(0, 5));
    } catch {}
  };

  const checkLocationPermission = async () => {
    if (!navigator.permissions) return;
    try {
      const result = await navigator.permissions.query({ name: 'geolocation' as any });
      setLocation(prev => ({ ...prev, permission: result.state as any }));
      result.onchange = () => {
        setLocation(prev => ({ ...prev, permission: result.state as any }));
      };
    } catch {}
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [shopsRes, productsRes] = await Promise.all([
        fetch('/api/shops').then(r => r.json()).catch(() => ({ shops: [] })),
        fetch('/api/products?limit=8').then(r => r.json()).catch(() => ({ products: [] }))
      ]);
      
      const realShops = shopsRes.shops || [];
      
      // Sort shops: open first, then by rating, then by product count
      const sortedShops = [...realShops].sort((a, b) => {
        // Check real open status if available
        const aOpen = getShopOpenStatus(a).isOpen;
        const bOpen = getShopOpenStatus(b).isOpen;
        if (aOpen && !bOpen) return -1;
        if (!aOpen && bOpen) return 1;
        if (a.rating !== b.rating) return b.rating - a.rating;
        return (b._count?.products || 0) - (a._count?.products || 0);
      });

      setShops(sortedShops.slice(0, 6));

      // Extract real categories from products and shops
      const categoryMap = new Map();
      realShops.forEach((shop: any) => {
        if (shop.category) {
          if (!categoryMap.has(shop.category)) {
            categoryMap.set(shop.category, { name: shop.category, count: 0, shops: 0 });
          }
          categoryMap.get(shop.category).shops++;
        }
      });
      
      (productsRes.products || []).forEach((p: any) => {
        const catName = p.category?.name || 'General';
        if (!categoryMap.has(catName)) {
          categoryMap.set(catName, { name: catName, count: 0, shops: 0 });
        }
        categoryMap.get(catName).count++;
      });

      const realCategories = Array.from(categoryMap.values())
        .filter(c => c.count > 0 || c.shops > 0)
        .sort((a, b) => (b.count + b.shops) - (a.count + a.shops))
        .slice(0, 8);

      setCategories(realCategories);
      setProducts((productsRes.products || []).slice(0, 8));
    } catch (e) {
      console.error('Failed to fetch data', e);
    } finally {
      setLoading(false);
    }
  };

  const getShopOpenStatus = (shop: any) => {
    // Real business hours logic
    const now = new Date();
    const currentHour = now.getHours();
    const currentDay = now.getDay();
    
    // If shop has holidays, check if today is holiday
    if (shop.holidays) {
      try {
        const holidays = JSON.parse(shop.holidays);
        if (holidays.includes(currentDay)) {
          return { isOpen: false, status: 'Closed', nextOpen: 'Tomorrow', color: 'var(--danger)' };
        }
      } catch {}
    }

    // Parse opening/closing hours if available
    if (shop.openingHours && shop.closingHours) {
      try {
        const openHour = parseInt(shop.openingHours.split(':')[0]);
        const closeHour = parseInt(shop.closingHours.split(':')[0]);
        
        if (currentHour < openHour) {
          const hoursUntilOpen = openHour - currentHour;
          if (hoursUntilOpen <= 2) {
            return { isOpen: false, status: 'Opening soon', nextOpen: `Opens at ${shop.openingHours}`, color: 'var(--warning)' };
          }
          return { isOpen: false, status: 'Closed', nextOpen: `Opens at ${shop.openingHours}`, color: 'var(--text-tertiary)' };
        }
        
        if (currentHour >= closeHour) {
          return { isOpen: false, status: 'Closed', nextOpen: `Opens tomorrow at ${shop.openingHours}`, color: 'var(--text-tertiary)' };
        }
        
        // Check if closing soon (within 1 hour)
        if (closeHour - currentHour <= 1) {
          return { isOpen: true, status: 'Closing soon', nextOpen: `Closes at ${shop.closingHours}`, color: 'var(--warning)' };
        }
        
        return { isOpen: true, status: 'Open', nextOpen: `Closes at ${shop.closingHours}`, color: 'var(--success)' };
      } catch {}
    }

    // Check if shop status is temporarily unavailable
    if (shop.status === 'TEMPORARILY_CLOSED' || shop.status === 'PAUSED') {
      return { isOpen: false, status: 'Temporarily unavailable', nextOpen: 'Check back later', color: 'var(--warning)' };
    }

    if (shop.status !== 'APPROVED') {
      return { isOpen: false, status: 'Unavailable', nextOpen: '', color: 'var(--text-tertiary)' };
    }

    // Default: if no hours configured, assume open during business hours 9-20
    if (currentHour >= 9 && currentHour < 20) {
      return { isOpen: true, status: 'Open', nextOpen: 'Closes at 8:00 PM', color: 'var(--success)' };
    }
    
    return { isOpen: false, status: 'Closed', nextOpen: 'Opens at 9:00 AM', color: 'var(--text-tertiary)' };
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser. Please enter your location manually.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        
        // Calculate distance for each shop if they have lat/lng
        const shopsWithDistance = shops.map(shop => {
          if (shop.latitude && shop.longitude) {
            const distance = calculateDistance(lat, lng, shop.latitude, shop.longitude);
            return { ...shop, distance, distanceText: `${distance.toFixed(1)} km away` };
          }
          return shop;
        }).sort((a, b) => (a.distance || 999) - (b.distance || 999));

        setShops(shopsWithDistance);
        setLocation({
          lat,
          lng,
          address: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
          city: 'Current location',
          pincode: '',
          permission: 'granted'
        });
        setShowLocationPicker(false);
        
        // Save location
        localStorage.setItem('db_user_location', JSON.stringify({ lat, lng }));
      },
      (err) => {
        console.error('Location error', err);
        if (err.code === 1) {
          setLocation(prev => ({ ...prev, permission: 'denied' }));
          alert('Location permission denied. You can still browse shops and enter your area manually to find nearby stores.');
        } else {
          alert('Unable to get your location. Please enter your area manually.');
        }
        setShowLocationPicker(true);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const handleAddToCart = async (productId: string, shopId: string) => {
    try {
      const res = await fetch('/api/cart/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shopId, productId, quantity: 1 })
      });
      
      if (res.ok) {
        const count = parseInt(localStorage.getItem('db_cart_count') || '0') + 1;
        localStorage.setItem('db_cart_count', count.toString());
        window.dispatchEvent(new Event('cart-updated'));
      } else {
        const data = await res.json();
        alert(data.error?.message || data.error || 'Unable to add to cart');
      }
    } catch (e) {
      console.error('Add to cart failed', e);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Save to recent searches
      const updated = [searchQuery.trim(), ...recentSearches.filter(s => s !== searchQuery.trim())].slice(0, 5);
      setRecentSearches(updated);
      localStorage.setItem('db_recent_searches', JSON.stringify(updated));
      window.location.href = `/search?q=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  return (
    <div className="page">
      <Header />
      
      {/* Location Bar */}
      <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '10px 0' }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <button 
            onClick={() => setShowLocationPicker(!showLocationPicker)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', cursor: 'pointer', fontSize: '14px' }}
          >
            <MapPin size={16} color="var(--brand)" />
            <span style={{ fontWeight: 500 }}>
              {location.city || location.address ? `${location.city || location.address}${location.pincode ? ` - ${location.pincode}` : ''}` : 'Select location'}
            </span>
            <ChevronDown size={14} />
          </button>
          
          {location.lat && location.lng && (
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Navigation size={12} />
              Using your current location • {shops.filter(s => s.distance).length} shops sorted by distance
            </span>
          )}
          
          {location.permission === 'denied' && (
            <span style={{ fontSize: '12px', color: 'var(--warning)', background: 'var(--warning-light)', padding: '4px 8px', borderRadius: 6 }}>
              Location permission denied - enter area manually
            </span>
          )}
        </div>
        
        {showLocationPicker && (
          <div className="container" style={{ marginTop: 12, paddingBottom: 12 }}>
            <div className="card" style={{ padding: 16, maxWidth: 480 }}>
              <div style={{ fontWeight: 600, marginBottom: 12 }}>Choose your location</div>
              <button className="btn btn-primary btn-full" onClick={handleUseCurrentLocation} style={{ marginBottom: 12 }}>
                <Navigation size={16} />
                Use current location
              </button>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: 12, textAlign: 'center' }}>or</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input className="form-input" placeholder="Enter area, city or pincode" style={{ flex: 1 }} id="manual-location" />
                <button className="btn btn-secondary" onClick={() => {
                  const input = document.getElementById('manual-location') as HTMLInputElement;
                  if (input?.value) {
                    setLocation({ lat: null, lng: null, address: input.value, city: input.value, pincode: '', permission: 'unknown' });
                    setShowLocationPicker(false);
                  }
                }}>Apply</button>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: 8 }}>
                We use your location to show nearby shops and calculate distance. Your location is stored locally and never shared.
              </div>
            </div>
          </div>
        )}
      </div>

      <main className="main-content">
        {/* Hero - Professional marketplace messaging */}
        <section style={{ background: 'linear-gradient(180deg, var(--surface) 0%, var(--background) 100%)', borderBottom: '1px solid var(--border)' }}>
          <div className="container" style={{ paddingTop: 48, paddingBottom: 48 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 48, alignItems: 'center' }} className="hero-grid">
              <div>
                <h1 style={{ fontSize: '44px', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>
                  Shop Local.<br />
                  <span style={{ color: 'var(--brand)' }}>Skip the Wait.</span>
                </h1>
                <p style={{ fontSize: '18px', color: 'var(--text-secondary)', marginTop: 16, lineHeight: 1.6, maxWidth: 520 }}>
                  Choose what you need from nearby shops, place your order before you arrive, and collect it when it's ready. No more waiting in crowded stores.
                </p>
                
                {/* Search Bar - Real search */}
                <form onSubmit={handleSearch} style={{ marginTop: 24, position: 'relative', maxWidth: 480 }}>
                  <div style={{ position: 'relative', display: 'flex', gap: 8 }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                      <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                      <input
                        type="text"
                        placeholder="Search for cement, pipes, paint, tools..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        style={{ width: '100%', padding: '14px 14px 14px 44px', borderRadius: 12, border: '1px solid var(--border)', fontSize: '15px', background: 'white' }}
                      />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ padding: '14px 24px', borderRadius: 12, fontWeight: 600 }}>
                      Search
                    </button>
                  </div>
                  
                  {recentSearches.length > 0 && (
                    <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>Recent:</span>
                      {recentSearches.map(term => (
                        <button key={term} type="button" onClick={() => { setSearchQuery(term); window.location.href = `/search?q=${encodeURIComponent(term)}`; }} style={{ fontSize: '12px', background: 'var(--surface-muted)', border: '1px solid var(--border)', borderRadius: 20, padding: '4px 10px', cursor: 'pointer' }}>
                          {term}
                        </button>
                      ))}
                    </div>
                  )}
                </form>

                <div style={{ display: 'flex', gap: 12, marginTop: 24, flexWrap: 'wrap' }}>
                  <Link href="/shops" className="btn btn-primary btn-lg" style={{ borderRadius: 12, padding: '14px 28px', fontWeight: 600 }}>
                    Find Nearby Shops
                    <ArrowRight size={18} />
                  </Link>
                  <Link href="/search" className="btn btn-secondary btn-lg" style={{ borderRadius: 12, padding: '14px 28px', fontWeight: 500 }}>
                    Browse Products
                  </Link>
                </div>

                <div style={{ display: 'flex', gap: 24, marginTop: 32, paddingTop: 24, borderTop: '1px solid var(--border-light)', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--success-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Clock size={18} color="var(--success)" />
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 600 }}>Order ahead</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Shop prepares while you travel</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--brand-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Package size={18} color="var(--brand)" />
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 600 }}>Collect when ready</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Get notified, show QR, pick up</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* How it works - Customer friendly */}
              <div style={{ background: 'white', borderRadius: 16, padding: 24, border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ fontWeight: 700, fontSize: '16px', marginBottom: 20 }}>How Digital Bazar works</div>
                
                {[
                  { step: 1, title: 'Find a shop near you', desc: 'Browse verified local shops by category and distance', icon: Store },
                  { step: 2, title: 'Add what you need', desc: 'See live availability and prices from the shop', icon: Package },
                  { step: 3, title: 'Place your order', desc: 'Choose pickup time, shop starts preparing immediately', icon: Timer },
                  { step: 4, title: 'Collect when ready', desc: 'Get notified when your order is ready for pickup', icon: Clock },
                ].map(item => (
                  <div key={item.step} style={{ display: 'flex', gap: 14, padding: '14px 0', borderBottom: item.step !== 4 ? '1px solid var(--border-light)' : 'none' }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: item.step === 4 ? 'var(--brand)' : 'var(--surface-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: item.step === 4 ? 'white' : 'var(--text-secondary)' }}>
                      <item.icon size={20} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: '14px' }}>{item.title}</div>
                      <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: 2, lineHeight: 1.4 }}>{item.desc}</div>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 600, background: 'var(--surface-muted)', width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{item.step}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="container" style={{ paddingTop: 32, paddingBottom: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '-0.02em' }}>Shop by category</h2>
            <Link href="/shops" style={{ fontSize: '14px', color: 'var(--brand)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}>View all shops <ArrowRight size={14} /></Link>
          </div>
          
          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
              {[1,2,3,4,5,6].map(i => (
                <div key={i} className="card" style={{ padding: 16 }}>
                  <div className="skeleton" style={{ height: 40, width: 40, borderRadius: 8, margin: '0 auto 12px' }} />
                  <div className="skeleton skeleton-text" style={{ height: 14 }} />
                  <div className="skeleton skeleton-text" style={{ height: 12, width: '60%', margin: '8px auto 0' }} />
                </div>
              ))}
            </div>
          ) : categories.length === 0 ? (
            <div className="card" style={{ padding: 32, textAlign: 'center' }}>
              <div style={{ width: 48, height: 48, background: 'var(--surface-muted)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <Package size={24} color="var(--text-tertiary)" />
              </div>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>No categories yet</div>
              <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Categories will appear when shops add products</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
              {categories.map(cat => {
                const icons: Record<string, string> = {
                  'Building Material': '🏗️',
                  'Cement': '🏗️',
                  'Bricks': '🧱',
                  'Plumbing': '🚿',
                  'Paint': '🎨',
                  'Electrical': '💡',
                  'Hardware': '🔩',
                  'Tools': '🛠️',
                  'General': '📦'
                };
                return (
                  <Link key={cat.name} href={`/search?category=${encodeURIComponent(cat.name)}`} className="card" style={{ padding: 16, textAlign: 'center', transition: 'all 0.2s', textDecoration: 'none' }}>
                    <div style={{ fontSize: '32px', marginBottom: 10 }}>{icons[cat.name] || '📦'}</div>
                    <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>{cat.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: 4 }}>
                      {cat.count > 0 ? `${cat.count} products` : `${cat.shops} shops`}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* Nearby Shops - Real with business hours logic */}
        <section className="container" style={{ paddingBottom: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '-0.02em' }}>Shops near you</h2>
            <div style={{ display: 'flex', gap: 8 }}>
              <Link href="/shops" className="btn btn-secondary btn-sm" style={{ borderRadius: 8 }}>View all</Link>
              {location.lat && (
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', background: 'var(--surface)', padding: '6px 10px', borderRadius: 8, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Navigation size={12} /> Sorted by distance
                </span>
              )}
            </div>
          </div>
          
          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
              {[1,2,3].map(i => (
                <div key={i} className="card" style={{ padding: 16 }}>
                  <div className="skeleton" style={{ height: 48, width: 48, borderRadius: 12 }} />
                  <div className="skeleton skeleton-title" style={{ marginTop: 12 }} />
                  <div className="skeleton skeleton-text" style={{ width: '80%' }} />
                </div>
              ))}
            </div>
          ) : shops.length === 0 ? (
            <div className="card" style={{ padding: 32, textAlign: 'center' }}>
              <div style={{ width: 56, height: 56, background: 'var(--surface-muted)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <Store size={28} color="var(--text-tertiary)" />
              </div>
              <div style={{ fontWeight: 600, fontSize: '16px', marginBottom: 8 }}>No shops nearby</div>
              <div style={{ fontSize: '14px', color: 'var(--text-secondary)', maxWidth: 400, margin: '0 auto 20px', lineHeight: 1.5 }}>
                We couldn't find any shops in your area yet. Try changing your location or check back later as more shops join Digital Bazar.
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                <button className="btn btn-primary" onClick={() => setShowLocationPicker(true)}>
                  <MapPin size={16} />
                  Change location
                </button>
                <Link href="/search" className="btn btn-secondary">
                  Browse products
                </Link>
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
              {shops.map(shop => {
                const openStatus = getShopOpenStatus(shop);
                return (
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
                    isOpen: openStatus.isOpen,
                    openStatus: openStatus.status,
                    productCount: shop._count?.products
                  }} />
                );
              })}
            </div>
          )}
        </section>

        {/* Products Near You - Real products */}
        {products.length > 0 && (
          <section className="container" style={{ paddingBottom: 32 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '-0.02em' }}>Products near you</h2>
              <Link href="/search" style={{ fontSize: '14px', color: 'var(--brand)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}>View all <ArrowRight size={14} /></Link>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
              {products.map(product => (
                <ProductCard key={product.id} product={product} onAdd={(id) => handleAddToCart(id, product.shopId)} />
              ))}
            </div>
          </section>
        )}

        {/* Why Digital Bazar - Customer benefits, not dev jargon */}
        <section style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '40px 0' }}>
          <div className="container">
            <div style={{ textAlign: 'center', maxWidth: 600, margin: '0 auto 32px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 12 }}>Why shop with Digital Bazar?</h2>
              <p style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                We make local shopping faster and more convenient, without replacing the shops you trust.
              </p>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24 }}>
              {[
                { title: 'Skip the wait', desc: 'Order before you arrive. Your items are prepared while you travel to the shop.', icon: Clock },
                { title: 'See what\'s available', desc: 'Browse real stock from local shops. Know what\'s in stock before you visit.', icon: Package },
                { title: 'Support local shops', desc: 'Shop from verified local businesses in your area. Keep your neighborhood thriving.', icon: Store },
                { title: 'Simple pickup', desc: 'Get notified when ready. Show your order code at the counter and collect.', icon: MapPin },
              ].map(b => (
                <div key={b.title} style={{ textAlign: 'center', padding: 20 }}>
                  <div style={{ width: 48, height: 48, background: 'white', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
                    <b.icon size={22} color="var(--brand)" />
                  </div>
                  <div style={{ fontWeight: 600, fontSize: '15px', marginBottom: 6 }}>{b.title}</div>
                  <div style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{b.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Shop Owner CTA - Professional */}
        <section className="container" style={{ padding: '40px 16px 88px' }}>
          <div style={{ background: 'var(--brand)', borderRadius: 20, padding: 32, color: 'white', display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 24, alignItems: 'center' }} className="cta-grid">
            <div>
              <div style={{ fontSize: '26px', fontWeight: 700, marginBottom: 10, letterSpacing: '-0.02em', lineHeight: 1.2 }}>Own a local shop? Join Digital Bazar</div>
              <div style={{ opacity: 0.9, fontSize: '15px', lineHeight: 1.5 }}>Let customers order ahead from your store. Manage orders, inventory, and pickups in one simple dashboard. No commission on your first 50 orders.</div>
              <div style={{ display: 'flex', gap: 12, marginTop: 20, flexWrap: 'wrap' }}>
                <Link href="/auth/register" className="btn" style={{ background: 'white', color: 'var(--brand)', fontWeight: 600, borderRadius: 10, padding: '12px 20px' }}>Register your shop</Link>
                <Link href="/shopkeeper" className="btn" style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.25)', borderRadius: 10, padding: '12px 20px' }}>Learn more</Link>
              </div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 16, padding: 20, border: '1px solid rgba(255,255,255,0.15)' }}>
              <div style={{ fontWeight: 600, marginBottom: 12, fontSize: '14px' }}>What you get</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: '13px', opacity: 0.9 }}>
                <div style={{ display: 'flex', gap: 8 }}><span>✓</span> Order management dashboard</div>
                <div style={{ display: 'flex', gap: 8 }}><span>✓</span> Inventory and stock tracking</div>
                <div style={{ display: 'flex', gap: 8 }}><span>✓</span> Zone-based picking for faster prep</div>
                <div style={{ display: 'flex', gap: 8 }}><span>✓</span> QR verification for pickup</div>
                <div style={{ display: 'flex', gap: 8 }}><span>✓</span> GST invoices and reports</div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <BottomNav />

      <style>{`
        @media (max-width: 768px) {
          .hero-grid { grid-template-columns: 1fr !important; gap: 24px !important; }
          .cta-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 480px) {
          .container { padding-left: 16px !important; padding-right: 16px !important; }
        }
      `}</style>
    </div>
  );
}
