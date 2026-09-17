'use client';
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { MapPin, Search, Clock, Package, Store, ArrowRight, Navigation, ChevronDown, Star, Timer, ShieldCheck, Truck, Check, Menu, X, Quote, Phone, Mail, Sparkles, Zap, Users, BarChart3, QrCode, FileText, Heart, ShoppingBag, Play } from 'lucide-react';
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

export default function EliteHomePage() {
  const [shops, setShops] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState<LocationState>({
    lat: null, lng: null, address: '', city: '', pincode: '', permission: 'unknown'
  });
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });
  const [formStatus, setFormStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const heroRef = useRef<HTMLDivElement>(null);
  const aboutRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const howItWorksRef = useRef<HTMLDivElement>(null);
  const shopsRef = useRef<HTMLDivElement>(null);
  const testimonialsRef = useRef<HTMLDivElement>(null);
  const pricingRef = useRef<HTMLDivElement>(null);
  const contactRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchData();
    loadRecentSearches();
    checkLocationPermission();
    
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
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
      const sortedShops = [...realShops].sort((a, b) => {
        const aOpen = getShopOpenStatus(a).isOpen;
        const bOpen = getShopOpenStatus(b).isOpen;
        if (aOpen && !bOpen) return -1;
        if (!aOpen && bOpen) return 1;
        if (a.rating !== b.rating) return b.rating - a.rating;
        return (b._count?.products || 0) - (a._count?.products || 0);
      });

      setShops(sortedShops.slice(0, 6));

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
    const now = new Date();
    const currentHour = now.getHours();
    const currentDay = now.getDay();
    
    if (shop.holidays) {
      try {
        const holidays = JSON.parse(shop.holidays);
        if (holidays.includes(currentDay)) {
          return { isOpen: false, status: 'Closed', color: 'var(--danger)' };
        }
      } catch {}
    }

    if (shop.openingHours && shop.closingHours) {
      try {
        const openHour = parseInt(shop.openingHours.split(':')[0]);
        const closeHour = parseInt(shop.closingHours.split(':')[0]);
        if (currentHour < openHour) {
          const hoursUntilOpen = openHour - currentHour;
          if (hoursUntilOpen <= 2) return { isOpen: false, status: 'Opening soon', color: 'var(--warning)' };
          return { isOpen: false, status: 'Closed', color: 'var(--text-tertiary)' };
        }
        if (currentHour >= closeHour) return { isOpen: false, status: 'Closed', color: 'var(--text-tertiary)' };
        if (closeHour - currentHour <= 1) return { isOpen: true, status: 'Closing soon', color: 'var(--warning)' };
        return { isOpen: true, status: 'Open', color: 'var(--success)' };
      } catch {}
    }

    if (shop.status === 'TEMPORARILY_CLOSED' || shop.status === 'PAUSED') {
      return { isOpen: false, status: 'Temporarily unavailable', color: 'var(--warning)' };
    }
    if (shop.status !== 'APPROVED') return { isOpen: false, status: 'Unavailable', color: 'var(--text-tertiary)' };
    if (currentHour >= 9 && currentHour < 20) return { isOpen: true, status: 'Open', color: 'var(--success)' };
    return { isOpen: false, status: 'Closed', color: 'var(--text-tertiary)' };
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
        const shopsWithDistance = shops.map(shop => {
          if (shop.latitude && shop.longitude) {
            const distance = calculateDistance(lat, lng, shop.latitude, shop.longitude);
            return { ...shop, distance };
          }
          return shop;
        }).sort((a, b) => (a.distance || 999) - (b.distance || 999));

        setShops(shopsWithDistance);
        setLocation({ lat, lng, address: `${lat.toFixed(4)}, ${lng.toFixed(4)}`, city: 'Current location', pincode: '', permission: 'granted' });
        setShowLocationPicker(false);
        localStorage.setItem('db_user_location', JSON.stringify({ lat, lng }));
      },
      (err) => {
        if (err.code === 1) {
          setLocation(prev => ({ ...prev, permission: 'denied' }));
          alert('Location permission denied. You can still browse shops and enter your area manually.');
        } else {
          alert('Unable to get your location. Please enter your area manually.');
        }
        setShowLocationPicker(true);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      const updated = [searchQuery.trim(), ...recentSearches.filter(s => s !== searchQuery.trim())].slice(0, 5);
      setRecentSearches(updated);
      localStorage.setItem('db_recent_searches', JSON.stringify(updated));
      window.location.href = `/search?q=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  const scrollToSection = (ref: React.RefObject<HTMLDivElement>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth' });
    setMobileMenuOpen(false);
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.name || !contactForm.email || !contactForm.message) {
      setFormStatus('error');
      setTimeout(() => setFormStatus('idle'), 3000);
      return;
    }
    setFormStatus('success');
    setContactForm({ name: '', email: '', message: '' });
    setTimeout(() => setFormStatus('idle'), 4000);
  };

  return (
    <div style={{ 
      '--brand': '#0F766E',
      '--brand-dark': '#0D5C56',
      '--brand-light': '#E6F4F3',
      '--brand-light-2': '#F0FAF9',
      '--text-primary': '#0F172A',
      '--text-secondary': '#475569',
      '--text-tertiary': '#94A3B8',
      '--surface': '#FFFFFF',
      '--surface-muted': '#F8FAFC',
      '--border': '#E2E8F0',
      '--border-light': '#F1F5F9',
      '--success': '#059669',
      '--success-light': '#D1FAE5',
      '--warning': '#D97706',
      '--warning-light': '#FEF3C7',
      '--danger': '#DC2626',
      '--danger-light': '#FEE2E2',
      '--shadow-sm': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
      '--shadow': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
      '--shadow-lg': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
      '--shadow-xl': '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    } as any}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600&display=swap');
        * { font-family: 'Plus Jakarta Sans', 'Inter', system-ui, -apple-system, sans-serif; }
        body { margin: 0; background: var(--surface); color: var(--text-primary); -webkit-font-smoothing: antialiased; }
        html { scroll-behavior: smooth; }
        
        .container { max-width: 1280px; margin: 0 auto; padding: 0 24px; }
        @media (max-width: 768px) { .container { padding: 0 20px; } }
        
        .btn-primary { background: var(--brand); color: white; border: none; border-radius: 10px; padding: 12px 20px; font-weight: 600; font-size: 14px; display: inline-flex; align-items: center; gap: 8px; cursor: pointer; transition: all 0.2s; text-decoration: none; }
        .btn-primary:hover { background: var(--brand-dark); transform: translateY(-1px); box-shadow: var(--shadow); }
        .btn-secondary { background: var(--surface); color: var(--text-primary); border: 1px solid var(--border); border-radius: 10px; padding: 12px 20px; font-weight: 500; font-size: 14px; display: inline-flex; align-items: center; gap: 8px; cursor: pointer; transition: all 0.2s; text-decoration: none; }
        .btn-secondary:hover { border-color: var(--brand); color: var(--brand); background: var(--brand-light); }
        .btn-ghost { background: transparent; border: none; color: var(--text-secondary); cursor: pointer; padding: 8px; border-radius: 8px; transition: all 0.2s; }
        .btn-ghost:hover { background: var(--surface-muted); color: var(--text-primary); }
        
        .card { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; transition: all 0.2s; }
        .card:hover { border-color: var(--border); box-shadow: var(--shadow-sm); }
        .card-premium { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; padding: 24px; transition: all 0.3s; }
        .card-premium:hover { transform: translateY(-2px); box-shadow: var(--shadow-lg); border-color: var(--brand); }
        
        .badge { font-size: 11px; font-weight: 600; padding: 4px 10px; border-radius: 20px; display: inline-flex; align-items: center; gap: 4px; }
        .badge-success { background: var(--success-light); color: var(--success); }
        .badge-warning { background: var(--warning-light); color: var(--warning); }
        .badge-neutral { background: var(--surface-muted); color: var(--text-secondary); border: 1px solid var(--border); }
        
        .skeleton { background: linear-gradient(90deg, var(--surface-muted) 25%, var(--border-light) 50%, var(--surface-muted) 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; border-radius: 8px; }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        
        .fade-in { animation: fadeIn 0.6s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        
        .hero-grid { display: grid; grid-template-columns: 1.15fr 0.85fr; gap: 64px; align-items: center; }
        .cta-grid { display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 32px; align-items: center; }
        @media (max-width: 1024px) { .hero-grid, .cta-grid { grid-template-columns: 1fr; gap: 40px; } }
        
        .nav-link { font-size: 14px; font-weight: 500; color: var(--text-secondary); text-decoration: none; padding: 8px 12px; border-radius: 8px; transition: all 0.2s; cursor: pointer; }
        .nav-link:hover { color: var(--text-primary); background: var(--surface-muted); }
        .nav-link.active { color: var(--brand); background: var(--brand-light); }
        
        input:focus, textarea:focus, select:focus { outline: none; border-color: var(--brand) !important; box-shadow: 0 0 0 3px var(--brand-light); }
      `}</style>

      {/* Sticky Header */}
      <header style={{ 
        position: 'sticky', top: 0, zIndex: 50, 
        background: scrolled ? 'rgba(255,255,255,0.85)' : 'var(--surface)', 
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled ? '1px solid var(--border)' : '1px solid transparent',
        boxShadow: scrolled ? 'var(--shadow-sm)' : 'none',
        transition: 'all 0.3s'
      }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 72 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 40 }}>
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
              <div style={{ width: 36, height: 36, background: 'var(--brand)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: 16, letterSpacing: '-0.02em' }}>DB</div>
              <span style={{ fontWeight: 700, fontSize: 18, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Digital Bazar</span>
            </Link>
            
            <nav style={{ display: 'flex', alignItems: 'center', gap: 4 }} className="desktop-nav">
              <button onClick={() => scrollToSection(heroRef)} className="nav-link">Home</button>
              <button onClick={() => scrollToSection(aboutRef)} className="nav-link">About</button>
              <button onClick={() => scrollToSection(featuresRef)} className="nav-link">Features</button>
              <button onClick={() => scrollToSection(howItWorksRef)} className="nav-link">How it works</button>
              <button onClick={() => scrollToSection(shopsRef)} className="nav-link">Shops</button>
              <button onClick={() => scrollToSection(testimonialsRef)} className="nav-link">Testimonials</button>
              <button onClick={() => scrollToSection(pricingRef)} className="nav-link">Pricing</button>
            </nav>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button onClick={() => setShowLocationPicker(!showLocationPicker)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--surface-muted)', border: '1px solid var(--border)', borderRadius: 10, padding: '8px 12px', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>
                <MapPin size={14} color="var(--brand)" />
                <span style={{ maxWidth: 140, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{location.city || 'Select location'}</span>
                <ChevronDown size={12} />
              </button>
              <Link href="/search" className="btn-ghost" style={{ padding: 10 }}><Search size={18} /></Link>
              <Link href="/cart" className="btn-ghost" style={{ padding: 10, position: 'relative' }}><ShoppingBag size={18} /></Link>
              <Link href="/shops" className="btn-primary">Find shops</Link>
            </div>
            
            <button className="btn-ghost" style={{ display: 'none', padding: 10 }} onClick={() => setMobileMenuOpen(!mobileMenuOpen)} id="mobile-menu-btn">
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div style={{ borderTop: '1px solid var(--border)', background: 'var(--surface)', padding: 20 }} className="mobile-menu">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button onClick={() => scrollToSection(heroRef)} className="nav-link" style={{ textAlign: 'left', justifyContent: 'flex-start' }}>Home</button>
              <button onClick={() => scrollToSection(aboutRef)} className="nav-link" style={{ textAlign: 'left' }}>About</button>
              <button onClick={() => scrollToSection(featuresRef)} className="nav-link" style={{ textAlign: 'left' }}>Features</button>
              <button onClick={() => scrollToSection(howItWorksRef)} className="nav-link" style={{ textAlign: 'left' }}>How it works</button>
              <button onClick={() => scrollToSection(shopsRef)} className="nav-link" style={{ textAlign: 'left' }}>Nearby shops</button>
              <button onClick={() => scrollToSection(testimonialsRef)} className="nav-link" style={{ textAlign: 'left' }}>Testimonials</button>
              <button onClick={() => scrollToSection(pricingRef)} className="nav-link" style={{ textAlign: 'left' }}>Pricing</button>
              <button onClick={() => scrollToSection(contactRef)} className="nav-link" style={{ textAlign: 'left' }}>Contact</button>
              <div style={{ display: 'flex', gap: 12, marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                <Link href="/shops" className="btn-primary" style={{ flex: 1, justifyContent: 'center' }}>Find shops</Link>
                <Link href="/search" className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>Browse products</Link>
              </div>
            </div>
          </div>
        )}

        {/* Location Picker */}
        {showLocationPicker && (
          <div style={{ borderTop: '1px solid var(--border)', background: 'var(--surface-muted)', padding: '16px 0' }}>
            <div className="container">
              <div className="card" style={{ padding: 20, maxWidth: 480, boxShadow: 'var(--shadow-lg)' }}>
                <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 16 }}>Choose your location</div>
                <button className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginBottom: 12 }} onClick={handleUseCurrentLocation}>
                  <Navigation size={16} /> Use current location
                </button>
                <div style={{ fontSize: 12, color: 'var(--text-tertiary)', textAlign: 'center', marginBottom: 12 }}>or</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input placeholder="Enter area, city or pincode" style={{ flex: 1, padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border)', fontSize: 14 }} id="manual-location" />
                  <button className="btn-secondary" onClick={() => {
                    const input = document.getElementById('manual-location') as HTMLInputElement;
                    if (input?.value) {
                      setLocation({ lat: null, lng: null, address: input.value, city: input.value, pincode: '', permission: 'unknown' });
                      setShowLocationPicker(false);
                    }
                  }}>Apply</button>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 10, lineHeight: 1.4 }}>We use your location to show nearby shops and calculate distance. Stored locally, never shared.</div>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section - Premium */}
      <section ref={heroRef} style={{ background: 'linear-gradient(180deg, var(--brand-light-2) 0%, var(--surface) 100%)', overflow: 'hidden', position: 'relative' }}>
        <div style={{ position: 'absolute', top: -100, right: -100, width: 400, height: 400, background: 'radial-gradient(circle, var(--brand-light) 0%, transparent 70%)', opacity: 0.6, borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: -80, left: -80, width: 300, height: 300, background: 'radial-gradient(circle, #E0F2FE 0%, transparent 70%)', opacity: 0.5, borderRadius: '50%' }} />
        
        <div className="container" style={{ paddingTop: 80, paddingBottom: 80, position: 'relative' }}>
          <div className="hero-grid">
            <div className="fade-in">
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'white', border: '1px solid var(--border)', borderRadius: 20, padding: '6px 12px', fontSize: 12, fontWeight: 600, color: 'var(--brand)', marginBottom: 20, boxShadow: 'var(--shadow-sm)' }}>
                <Sparkles size={12} /> Trusted by 500+ local shops across India
              </div>
              
              <h1 style={{ fontSize: 'clamp(36px, 5vw, 56px)', fontWeight: 800, lineHeight: 1.05, letterSpacing: '-0.03em', color: 'var(--text-primary)', margin: 0 }}>
                Shop Local.<br />
                <span style={{ color: 'var(--brand)', position: 'relative' }}>
                  Skip the Wait.
                  <span style={{ position: 'absolute', bottom: 8, left: 0, right: 0, height: 8, background: 'var(--brand-light)', zIndex: -1, borderRadius: 4 }} />
                </span>
              </h1>
              
              <p style={{ fontSize: 'clamp(16px, 2vw, 19px)', color: 'var(--text-secondary)', marginTop: 20, lineHeight: 1.6, maxWidth: 520 }}>
                Find products from nearby shops, order before you arrive, and collect when your order is ready. No more waiting in crowded stores.
              </p>
              
              <form onSubmit={handleSearch} style={{ marginTop: 32, position: 'relative', maxWidth: 520 }}>
                <div style={{ position: 'relative', display: 'flex', gap: 8, background: 'white', borderRadius: 14, padding: 6, border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)' }}>
                  <div style={{ position: 'relative', flex: 1 }}>
                    <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                    <input type="text" placeholder="Search for cement, pipes, paint, medicines, mobiles..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ width: '100%', padding: '14px 14px 14px 44px', borderRadius: 10, border: 'none', fontSize: 15, background: 'transparent', outline: 'none' }} />
                  </div>
                  <button type="submit" className="btn-primary" style={{ padding: '14px 24px', borderRadius: 10, fontWeight: 600, whiteSpace: 'nowrap' }}>Search</button>
                </div>
                
                {recentSearches.length > 0 && (
                  <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: 'var(--text-tertiary)', fontWeight: 500 }}>Recent:</span>
                    {recentSearches.map(term => (
                      <button key={term} type="button" onClick={() => { setSearchQuery(term); window.location.href = `/search?q=${encodeURIComponent(term)}`; }} style={{ fontSize: 12, background: 'white', border: '1px solid var(--border)', borderRadius: 20, padding: '6px 12px', cursor: 'pointer', fontWeight: 500, transition: 'all 0.2s' }}>{term}</button>
                    ))}
                  </div>
                )}
              </form>

              <div style={{ display: 'flex', gap: 12, marginTop: 28, flexWrap: 'wrap' }}>
                <Link href="/shops" className="btn-primary" style={{ padding: '14px 28px', borderRadius: 12, fontWeight: 600, fontSize: 15 }}>Find Nearby Shops<ArrowRight size={18} /></Link>
                <Link href="/search" className="btn-secondary" style={{ padding: '14px 28px', borderRadius: 12, fontWeight: 500, fontSize: 15, background: 'white' }}><Play size={16} />See how it works</Link>
              </div>

              <div style={{ display: 'flex', gap: 32, marginTop: 40, paddingTop: 28, borderTop: '1px solid var(--border-light)', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}><Clock size={18} color="var(--success)" /></div>
                  <div><div style={{ fontSize: 13, fontWeight: 600 }}>Order ahead</div><div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Shop prepares while you travel</div></div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}><Package size={18} color="var(--brand)" /></div>
                  <div><div style={{ fontSize: 13, fontWeight: 600 }}>Collect when ready</div><div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Get notified, show QR, pick up</div></div>
                </div>
              </div>
            </div>

            <div style={{ background: 'white', borderRadius: 20, padding: 28, border: '1px solid var(--border)', boxShadow: 'var(--shadow-xl)', position: 'relative' }}>
              <div style={{ position: 'absolute', top: -12, right: 24, background: 'var(--brand)', color: 'white', fontSize: 11, fontWeight: 700, padding: '6px 12px', borderRadius: 20, letterSpacing: '0.02em' }}>HOW IT WORKS</div>
              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 20, letterSpacing: '-0.01em' }}>From search to pickup in 4 steps</div>
              
              {[
                { step: 1, title: 'Find a shop near you', desc: 'Browse verified local shops by category and distance', icon: Store, color: 'var(--brand)' },
                { step: 2, title: 'Add what you need', desc: 'See live availability and prices from the shop', icon: Package, color: '#7C3AED' },
                { step: 3, title: 'Place your order', desc: 'Choose pickup time, shop starts preparing immediately', icon: Timer, color: '#059669' },
                { step: 4, title: 'Collect when ready', desc: 'Get notified when your order is ready for pickup', icon: Check, color: 'var(--brand)' },
              ].map(item => (
                <div key={item.step} style={{ display: 'flex', gap: 14, padding: '16px 0', borderBottom: item.step !== 4 ? '1px solid var(--border-light)' : 'none' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: item.step === 4 ? 'var(--brand)' : `${item.color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: item.step === 4 ? 'white' : item.color, border: `1px solid ${item.step === 4 ? 'var(--brand)' : `${item.color}20`}` }}><item.icon size={20} /></div>
                  <div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: 14 }}>{item.title}</div><div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 3, lineHeight: 1.5 }}>{item.desc}</div></div>
                  <div style={{ fontSize: 12, color: 'white', fontWeight: 700, background: item.step === 4 ? 'var(--brand)' : 'var(--text-primary)', width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{item.step}</div>
                </div>
              ))}
              
              <div style={{ marginTop: 20, padding: 14, background: 'var(--brand-light-2)', borderRadius: 12, border: '1px solid var(--brand-light)', display: 'flex', gap: 10 }}>
                <div style={{ width: 32, height: 32, background: 'var(--brand)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Zap size={16} color="white" /></div>
                <div><div style={{ fontWeight: 600, fontSize: 13 }}>Average time saved: 25 minutes per order</div><div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>No more waiting in crowded stores. Order ahead, collect when ready.</div></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About / Value Prop */}
      <section ref={aboutRef} style={{ padding: '96px 0', background: 'var(--surface)' }}>
        <div className="container">
          <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center', marginBottom: 64 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--brand-light)', color: 'var(--brand)', fontSize: 12, fontWeight: 700, padding: '6px 14px', borderRadius: 20, letterSpacing: '0.05em', marginBottom: 16 }}>ABOUT DIGITAL BAZAR</div>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.1, margin: 0 }}>Built for local commerce,<br />not just online shopping</h2>
            <p style={{ fontSize: 17, color: 'var(--text-secondary)', lineHeight: 1.7, marginTop: 20, maxWidth: 600, margin: '20px auto 0' }}>Digital Bazar connects you with verified local shops - from medical stores to hardware shops. You buy from a specific shop you trust, not a faceless warehouse.</p>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
            {[
              { icon: Users, title: 'Customer-first, shop-first', desc: 'We make local shopping faster without replacing the shops you trust. Your neighborhood stores stay at the center.', color: 'var(--brand)' },
              { icon: ShieldCheck, title: 'Real inventory, real prices', desc: 'See actual stock and prices from local shops. No fake availability. What you see is what you get when you arrive.', color: '#059669' },
              { icon: Heart, title: 'Support your neighborhood', desc: 'Every order supports a local business. Keep your community thriving while skipping the wait and crowd.', color: '#DC2626' },
            ].map(card => (
              <div key={card.title} className="card-premium">
                <div style={{ width: 48, height: 48, background: `${card.color}12`, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: card.color, marginBottom: 16, border: `1px solid ${card.color}20` }}><card.icon size={24} /></div>
                <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>{card.title}</div>
                <div style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{card.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features / Services */}
      <section ref={featuresRef} style={{ padding: '96px 0', background: 'var(--surface-muted)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 48, flexWrap: 'wrap', gap: 20 }}>
            <div><h2 style={{ fontSize: 'clamp(28px, 4vw, 36px)', fontWeight: 800, letterSpacing: '-0.03em', margin: 0, lineHeight: 1.1 }}>Everything you need for<br />local shopping</h2><p style={{ fontSize: 16, color: 'var(--text-secondary)', marginTop: 12, maxWidth: 480, lineHeight: 1.6 }}>Professional tools for customers and shop owners - from medical to hardware, all product categories supported.</p></div>
            <div style={{ display: 'flex', gap: 8 }}><span className="badge badge-neutral">For all categories</span><span className="badge badge-success">Real-time</span><span className="badge badge-neutral">Mobile-first</span></div>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
            {[
              { icon: Clock, title: 'Order ahead, skip the wait', desc: 'Place your order before you arrive. Shop prepares while you travel. Average 25 minutes saved per order.', color: 'var(--brand)' },
              { icon: Package, title: 'Real inventory from real shops', desc: 'Browse live stock from verified local shops. Know what\'s available before you visit. No fake availability.', color: '#7C3AED' },
              { icon: MapPin, title: 'Zone-based fast picking', desc: 'Orders auto-sorted by storage zones for efficient preparation. Staff picks faster, you collect sooner.', color: '#059669' },
              { icon: QrCode, title: 'QR verification for pickup', desc: 'Secure QR code for pickup. Show at counter, shop verifies, order completed. No reuse, no fraud.', color: '#D97706' },
              { icon: FileText, title: 'GST invoices & billing', desc: 'Automatic GST-compliant invoices with GSTIN, HSN codes, tax breakdown. Professional billing for all categories.', color: '#0EA5E9' },
              { icon: BarChart3, title: 'Analytics for shop owners', desc: 'Real sales, orders, inventory insights from actual database. No fake graphs. Know your business.', color: '#DC2626' },
            ].map(feature => (
              <div key={feature.title} className="card-premium" style={{ padding: 24 }}>
                <div style={{ display: 'flex', gap: 14 }}>
                  <div style={{ width: 44, height: 44, background: `${feature.color}12`, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: feature.color, flexShrink: 0, border: `1px solid ${feature.color}20` }}><feature.icon size={20} /></div>
                  <div><div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>{feature.title}</div><div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{feature.desc}</div></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works - Detailed */}
      <section ref={howItWorksRef} style={{ padding: '96px 0', background: 'var(--surface)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: 640, margin: '0 auto 64px' }}>
            <div style={{ display: 'inline-flex', background: 'var(--surface-muted)', border: '1px solid var(--border)', borderRadius: 20, padding: '6px 14px', fontSize: 12, fontWeight: 700, letterSpacing: '0.05em', marginBottom: 16 }}>HOW IT WORKS</div>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.1, margin: 0 }}>From search to pickup in minutes, not hours</h2>
            <p style={{ fontSize: 16, color: 'var(--text-secondary)', marginTop: 16, lineHeight: 1.6 }}>A complete local commerce flow that works for any product - from Paracetamol to PVC pipes to Redmi phones.</p>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 32, position: 'relative' }}>
            <div style={{ position: 'absolute', top: 24, left: '10%', right: '10%', height: 2, background: 'linear-gradient(90deg, var(--border) 0%, var(--brand-light) 50%, var(--border) 100%)', display: 'none' }} id="connector" />
            {[
              { step: '01', title: 'Discover', desc: 'Find nearby shops by location, category, distance. Real open/closed status, ratings, products.', icon: Search },
              { step: '02', title: 'Order', desc: 'Add products with real price/stock. Server validates everything. Inventory reserved transactionally.', icon: ShoppingBag },
              { step: '03', title: 'Prepare', desc: 'Shop gets instant notification. Accepts order. Zone-sorted picking for fast preparation.', icon: Package },
              { step: '04', title: 'Collect', desc: 'Get notified when ready. Show QR at shop. Verification, completion, invoice, review.', icon: Check },
            ].map(item => (
              <div key={item.step} style={{ textAlign: 'center', position: 'relative' }}>
                <div style={{ width: 64, height: 64, background: 'var(--brand)', color: 'white', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: 'var(--shadow-lg)', position: 'relative' }}>
                  <item.icon size={28} />
                  <div style={{ position: 'absolute', top: -8, right: -8, background: 'var(--text-primary)', color: 'white', fontSize: 10, fontWeight: 800, width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{item.step}</div>
                </div>
                <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>{item.title}</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: 260, margin: '0 auto' }}>{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Shops Near You - Real Data */}
      <section ref={shopsRef} style={{ padding: '80px 0', background: 'var(--surface-muted)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
            <div><h2 style={{ fontSize: 'clamp(24px, 3vw, 32px)', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>Shops near you</h2><p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>{location.lat ? <><Navigation size={12} /> Sorted by distance from your location</> : 'Discover verified local shops • All categories from medical to hardware'}</p></div>
            <div style={{ display: 'flex', gap: 8 }}><Link href="/shops" className="btn-secondary" style={{ borderRadius: 10 }}>View all shops<ArrowRight size={14} /></Link>{!location.lat && <button className="btn-primary" style={{ borderRadius: 10 }} onClick={handleUseCurrentLocation}><MapPin size={14} />Use my location</button>}</div>
          </div>
          
          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
              {[1,2,3].map(i => (<div key={i} className="card" style={{ padding: 20 }}><div className="skeleton" style={{ height: 48, width: 48, borderRadius: 12 }} /><div className="skeleton" style={{ height: 16, width: '70%', marginTop: 16 }} /><div className="skeleton" style={{ height: 12, width: '50%', marginTop: 8 }} /></div>))}
            </div>
          ) : shops.length === 0 ? (
            <div className="card" style={{ padding: 48, textAlign: 'center' }}>
              <div style={{ width: 56, height: 56, background: 'white', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', border: '1px solid var(--border)' }}><Store size={28} color="var(--text-tertiary)" /></div>
              <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}>No shops nearby</div>
              <div style={{ fontSize: 14, color: 'var(--text-secondary)', maxWidth: 400, margin: '0 auto 20px', lineHeight: 1.5 }}>We couldn't find shops in your area yet. Try changing location or check back as more shops join.</div>
              <button className="btn-primary" onClick={() => setShowLocationPicker(true)}><MapPin size={16} />Change location</button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
              {shops.map(shop => {
                const openStatus = getShopOpenStatus(shop);
                return <ShopCard key={shop.id} shop={{ id: shop.id, name: shop.name, slug: shop.slug, category: shop.category, address: shop.address, rating: shop.rating, reviewCount: shop.reviewCount, preparationTimeMin: shop.preparationTimeMin, status: shop.status, distance: shop.distance, isOpen: openStatus.isOpen, openStatus: openStatus.status, productCount: shop._count?.products }} />;
              })}
            </div>
          )}

          {/* Categories */}
          <div style={{ marginTop: 48 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}><h3 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Shop by category</h3><Link href="/shops" style={{ fontSize: 13, color: 'var(--brand)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>View all<ArrowRight size={12} /></Link></div>
            {categories.length === 0 ? <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Categories will appear when shops add products</div> : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
                {categories.map(cat => {
                  const icons: any = { 'Building Material': '🏗️', Cement: '🏗️', 'Bricks': '🧱', Plumbing: '🚿', Paint: '🎨', Electrical: '💡', Hardware: '🔩', Tools: '🛠️', Medical: '💊', Grocery: '🛒', Electronics: '📱', General: '📦' };
                  return <Link key={cat.name} href={`/search?category=${encodeURIComponent(cat.name)}`} className="card" style={{ padding: 16, textAlign: 'center', textDecoration: 'none', transition: 'all 0.2s' }}><div style={{ fontSize: 28, marginBottom: 8 }}>{icons[cat.name] || '📦'}</div><div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>{cat.name}</div><div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>{cat.count > 0 ? `${cat.count} products` : `${cat.shops} shops`}</div></Link>;
                })}
              </div>
            )}
          </div>

          {/* Products */}
          {products.length > 0 && (
            <div style={{ marginTop: 48 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}><h3 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Products near you</h3><Link href="/search" style={{ fontSize: 13, color: 'var(--brand)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>View all<ArrowRight size={12} /></Link></div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
                {products.map(product => <ProductCard key={product.id} product={product} onAdd={(id, qty) => handleAddToCart(id, product.shopId, qty)} />)}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Testimonials */}
      <section ref={testimonialsRef} style={{ padding: '96px 0', background: 'var(--surface)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: 640, margin: '0 auto 64px' }}>
            <div style={{ display: 'inline-flex', background: 'var(--brand-light)', color: 'var(--brand)', fontSize: 12, fontWeight: 700, padding: '6px 14px', borderRadius: 20, letterSpacing: '0.05em', marginBottom: 16 }}>TESTIMONIALS</div>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 36px)', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.1, margin: 0 }}>Loved by customers and shop owners</h2>
            <p style={{ fontSize: 16, color: 'var(--text-secondary)', marginTop: 12, lineHeight: 1.6 }}>Real stories from people using Digital Bazar for daily shopping.</p>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20 }}>
            {[
              { quote: 'I used to wait 30 minutes at the hardware shop. Now I order while at work and pickup in 5 minutes. The shop owner knows me and my order is ready when I arrive.', name: 'Rahul Deshmukh', role: 'Customer • Nagpur', rating: 5, product: 'Cement, PVC Pipes' },
              { quote: 'As a medical shop owner, I was worried about online. But Digital Bazar brings customers who already know what they need. My staff picks faster with zone sorting.', name: 'Dr. Sunita Patil', role: 'Shop Owner • Ganesh Medical', rating: 5, product: 'Medical & Personal Care' },
              { quote: 'The QR pickup is brilliant. No confusion, no billing queue. Show QR, collect, done. And I get GST invoice automatically. Works for all my products from medicines to daily needs.', name: 'Amit Sharma', role: 'Customer • Pune', rating: 5, product: 'Medical, Grocery, Electronics' },
            ].map((t, i) => (
              <div key={i} className="card-premium" style={{ padding: 24, position: 'relative' }}>
                <div style={{ position: 'absolute', top: 20, right: 20, color: 'var(--brand-light)', opacity: 0.8 }}><Quote size={32} /></div>
                <div style={{ display: 'flex', gap: 2, marginBottom: 12 }}>{Array.from({ length: t.rating }).map((_, j) => <Star key={j} size={14} fill="#F59E0B" color="#F59E0B" />)}</div>
                <div style={{ fontSize: 15, lineHeight: 1.6, color: 'var(--text-primary)', marginBottom: 20, position: 'relative' }}>"{t.quote}"</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, background: 'var(--brand-light)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand)', fontWeight: 700 }}>{t.name[0]}</div>
                  <div><div style={{ fontWeight: 600, fontSize: 14 }}>{t.name}</div><div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{t.role}</div><div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>{t.product}</div></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section ref={pricingRef} style={{ padding: '96px 0', background: 'var(--surface-muted)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: 640, margin: '0 auto 64px' }}>
            <div style={{ display: 'inline-flex', background: 'white', border: '1px solid var(--border)', color: 'var(--text-secondary)', fontSize: 12, fontWeight: 700, padding: '6px 14px', borderRadius: 20, letterSpacing: '0.05em', marginBottom: 16 }}>PRICING FOR SHOP OWNERS</div>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 36px)', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.1, margin: 0 }}>Simple pricing, no hidden fees</h2>
            <p style={{ fontSize: 16, color: 'var(--text-secondary)', marginTop: 12, lineHeight: 1.6 }}>Start free, pay only when you grow. No commission on first 50 orders.</p>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24, maxWidth: 1000, margin: '0 auto' }}>
            {[
              { name: 'Starter', price: 'Free', desc: 'For new shops testing Digital Bazar', features: ['Up to 50 orders/month free', '100 products', '2 staff accounts', 'Basic analytics', 'QR pickup', 'Email support'], cta: 'Start free', popular: false },
              { name: 'Growth', price: '₹999', period: '/month', desc: 'For growing shops with regular orders', features: ['500 orders/month', 'Unlimited products', '10 staff accounts', 'Advanced analytics', 'GST invoices', 'Priority support', 'Promotions & discounts', 'Zone management'], cta: 'Start 14-day trial', popular: true },
              { name: 'Pro', price: '₹2,499', period: '/month', desc: 'For high-volume shops and chains', features: ['Unlimited orders', 'Unlimited everything', 'Unlimited staff', 'Custom analytics', 'API access', 'Dedicated manager', 'Multi-shop support', 'White-label option'], cta: 'Contact sales', popular: false },
            ].map(plan => (
              <div key={plan.name} className="card" style={{ padding: 28, position: 'relative', border: plan.popular ? '2px solid var(--brand)' : '1px solid var(--border)', boxShadow: plan.popular ? 'var(--shadow-xl)' : 'var(--shadow-sm)', transform: plan.popular ? 'scale(1.02)' : 'none' }}>
                {plan.popular && <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: 'var(--brand)', color: 'white', fontSize: 11, fontWeight: 700, padding: '6px 14px', borderRadius: 20, letterSpacing: '0.05em' }}>MOST POPULAR</div>}
                <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 4 }}>{plan.name}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 8 }}><span style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.02em' }}>{plan.price}</span>{plan.period && <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{plan.period}</span>}</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20, lineHeight: 1.5 }}>{plan.desc}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
                  {plan.features.map(f => <div key={f} style={{ display: 'flex', gap: 8, fontSize: 13 }}><Check size={16} color="var(--success)" style={{ flexShrink: 0, marginTop: 1 }} /><span>{f}</span></div>)}
                </div>
                <button className={plan.popular ? 'btn-primary' : 'btn-secondary'} style={{ width: '100%', justifyContent: 'center', borderRadius: 10, padding: '12px' }}>{plan.cta}<ArrowRight size={14} /></button>
              </div>
            ))}
          </div>
          
          <div style={{ textAlign: 'center', marginTop: 32, fontSize: 13, color: 'var(--text-secondary)' }}>All plans include: Real inventory, transactional orders, secure payments, realtime notifications, mobile app • No setup fees • Cancel anytime</div>
        </div>
      </section>

      {/* Contact / CTA */}
      <section ref={contactRef} style={{ padding: '96px 0', background: 'var(--surface)' }}>
        <div className="container">
          <div className="cta-grid" style={{ background: 'var(--brand)', borderRadius: 24, padding: 48, color: 'white', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -100, right: -100, width: 300, height: 300, background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)', borderRadius: '50%' }} />
            <div style={{ position: 'absolute', bottom: -80, left: -80, width: 200, height: 200, background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)', borderRadius: '50%' }} />
            
            <div style={{ position: 'relative' }}>
              <div style={{ display: 'inline-flex', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', fontSize: 12, fontWeight: 700, padding: '6px 14px', borderRadius: 20, letterSpacing: '0.05em', marginBottom: 16 }}>FOR SHOP OWNERS</div>
              <h2 style={{ fontSize: 'clamp(28px, 4vw, 36px)', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.02em', margin: 0 }}>Own a local shop?<br />Join Digital Bazar today</h2>
              <p style={{ fontSize: 16, opacity: 0.9, lineHeight: 1.6, marginTop: 16, maxWidth: 480 }}>Let customers order ahead from your store. Manage orders, inventory, and pickups in one simple dashboard. Works for any shop - medical, hardware, grocery, electronics.</p>
              
              <div style={{ display: 'flex', gap: 12, marginTop: 28, flexWrap: 'wrap' }}>
                <Link href="/auth/register" style={{ background: 'white', color: 'var(--brand)', fontWeight: 700, borderRadius: 12, padding: '14px 24px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 14 }}>Register your shop<ArrowRight size={16} /></Link>
                <Link href="/shopkeeper" style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.25)', borderRadius: 12, padding: '14px 24px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 14 }}>Learn more</Link>
              </div>
              
              <div style={{ display: 'flex', gap: 20, marginTop: 32, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, opacity: 0.9 }}><Check size={16} />No setup fees</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, opacity: 0.9 }}><Check size={16} />First 50 orders free</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, opacity: 0.9 }}><Check size={16} />Cancel anytime</div>
              </div>
            </div>
            
            <div style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', borderRadius: 16, padding: 24, border: '1px solid rgba(255,255,255,0.15)', position: 'relative' }}>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Get in touch</div>
              
              <form onSubmit={handleContactSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <input placeholder="Your name" value={contactForm.name} onChange={e => setContactForm({ ...contactForm, name: e.target.value })} style={{ padding: '12px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.1)', color: 'white', fontSize: 14, outline: 'none' }} />
                <input type="email" placeholder="Your email" value={contactForm.email} onChange={e => setContactForm({ ...contactForm, email: e.target.value })} style={{ padding: '12px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.1)', color: 'white', fontSize: 14, outline: 'none' }} />
                <textarea placeholder="Tell us about your shop - category, location, products (medical to hardware, all supported)" value={contactForm.message} onChange={e => setContactForm({ ...contactForm, message: e.target.value })} rows={3} style={{ padding: '12px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.1)', color: 'white', fontSize: 14, outline: 'none', resize: 'none' }} />
                <button type="submit" style={{ background: 'white', color: 'var(--brand)', border: 'none', borderRadius: 10, padding: '12px', fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>Send message<ArrowRight size={14} /></button>
              </form>
              
              {formStatus === 'success' && <div style={{ marginTop: 12, padding: 10, background: 'rgba(16, 185, 129, 0.2)', borderRadius: 8, fontSize: 12, border: '1px solid rgba(16, 185, 129, 0.3)' }}>✓ Message sent! We'll contact you within 24 hours.</div>}
              {formStatus === 'error' && <div style={{ marginTop: 12, padding: 10, background: 'rgba(239, 68, 68, 0.2)', borderRadius: 8, fontSize: 12, border: '1px solid rgba(239, 68, 68, 0.3)' }}>Please fill all fields.</div>}
              
              <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.15)', display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12, opacity: 0.9 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Mail size={14} />support@digitalbazar.com</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Phone size={14} />+91 98765 43210</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><MapPin size={14} />Nagpur, Maharashtra • Serving all India</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: 'var(--text-primary)', color: 'white', padding: '64px 0 32px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr', gap: 40, marginBottom: 48 }} className="footer-grid">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <div style={{ width: 36, height: 36, background: 'var(--brand)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 16 }}>DB</div>
                <span style={{ fontWeight: 700, fontSize: 18, letterSpacing: '-0.02em' }}>Digital Bazar</span>
              </div>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, maxWidth: 320 }}>Shop Local. Skip the Wait. Connecting customers with verified local shops for all products - from medical to hardware. Real inventory, real shops, real community.</div>
              <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
                {[
                  { icon: '𝕏', label: 'Twitter' },
                  { icon: 'f', label: 'Facebook' },
                  { icon: 'in', label: 'LinkedIn' },
                  { icon: 'ig', label: 'Instagram' },
                ].map(s => <a key={s.label} href="#" style={{ width: 36, height: 36, background: 'rgba(255,255,255,0.1)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: 12, fontWeight: 700, transition: 'all 0.2s' }}>{s.icon}</a>)}
              </div>
            </div>
            
            <div><div style={{ fontWeight: 600, fontSize: 14, marginBottom: 16 }}>Marketplace</div><div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13, color: 'rgba(255,255,255,0.7)' }}><Link href="/shops" style={{ color: 'inherit', textDecoration: 'none' }}>Browse shops</Link><Link href="/search" style={{ color: 'inherit', textDecoration: 'none' }}>Search products</Link><Link href="/search?category=Medical" style={{ color: 'inherit', textDecoration: 'none' }}>Medical</Link><Link href="/search?category=Hardware" style={{ color: 'inherit', textDecoration: 'none' }}>Hardware</Link><Link href="/search?category=Electronics" style={{ color: 'inherit', textDecoration: 'none' }}>Electronics</Link></div></div>
            <div><div style={{ fontWeight: 600, fontSize: 14, marginBottom: 16 }}>For shops</div><div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13, color: 'rgba(255,255,255,0.7)' }}><Link href="/auth/register" style={{ color: 'inherit', textDecoration: 'none' }}>Register shop</Link><Link href="/shopkeeper" style={{ color: 'inherit', textDecoration: 'none' }}>Shop dashboard</Link><Link href="/shopkeeper/products" style={{ color: 'inherit', textDecoration: 'none' }}>Add products</Link><Link href="/pricing" style={{ color: 'inherit', textDecoration: 'none' }}>Pricing</Link><a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Help center</a></div></div>
            <div><div style={{ fontWeight: 600, fontSize: 14, marginBottom: 16 }}>Support</div><div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13, color: 'rgba(255,255,255,0.7)' }}><a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Contact us</a><a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Privacy Policy</a><a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Terms of Service</a><a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Refund Policy</a><a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Shipping Policy</a></div></div>
          </div>
          
          <div style={{ paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>© {new Date().getFullYear()} Digital Bazar. All rights reserved. Made for local commerce in India. • Real shops, real inventory, real community.</div>
            <div style={{ display: 'flex', gap: 16, fontSize: 11, color: 'rgba(255,255,255,0.5)' }}><span>🇮🇳 Made in India</span><span>•</span><span>Secure payments</span><span>•</span><span>GST compliant</span></div>
          </div>
        </div>
      </footer>

      <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          #mobile-menu-btn { display: flex !important; }
          .footer-grid { grid-template-columns: 1fr !important; gap: 32px !important; }
        }
        @media (min-width: 769px) {
          .mobile-menu { display: none !important; }
        }
        @media (max-width: 480px) {
          .container { padding-left: 16px !important; padding-right: 16px !important; }
        }
      `}</style>
    </div>
  );
}
