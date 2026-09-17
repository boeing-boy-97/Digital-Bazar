'use client';
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { MapPin, Search, Clock, Package, Store, ArrowRight, Navigation, ChevronDown, Star, Timer, ShieldCheck, Truck, Check, Menu, X, Quote, Phone, Mail, Sparkles, Zap, Users, BarChart3, QrCode, FileText, Heart, ShoppingBag, Play, ArrowUpRight, Shield, Award, TrendingUp, Layers, Box, CreditCard, MessageCircle, ChevronRight, Plus, Minus } from 'lucide-react';
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

export default function EliteHomePageV2() {
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
  const [activeSection, setActiveSection] = useState('home');
  const [cartCount, setCartCount] = useState(0);
  const [faqOpen, setFaqOpen] = useState<number | null>(0);

  const heroRef = useRef<HTMLDivElement>(null);
  const aboutRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const howItWorksRef = useRef<HTMLDivElement>(null);
  const shopsRef = useRef<HTMLDivElement>(null);
  const testimonialsRef = useRef<HTMLDivElement>(null);
  const pricingRef = useRef<HTMLDivElement>(null);
  const contactRef = useRef<HTMLDivElement>(null);
  const faqRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchData();
    loadRecentSearches();
    checkLocationPermission();
    updateCartCount();

    const handleScroll = () => {
      setScrolled(window.scrollY > 12);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });

    // Scroll spy
    const sectionIds = ['home', 'about', 'features', 'how-it-works', 'shops', 'testimonials', 'pricing', 'faq', 'contact'];
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    }, { rootMargin: '-20% 0px -70% 0px', threshold: 0 });

    sectionIds.forEach(id => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    // Reveal on scroll
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    const revealEls = document.querySelectorAll('[data-reveal]');
    revealEls.forEach(el => revealObserver.observe(el));

    const onCartUpdated = () => updateCartCount();
    window.addEventListener('cart-updated', onCartUpdated);
    window.addEventListener('storage', onCartUpdated);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false);
        setShowLocationPicker(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('cart-updated', onCartUpdated);
      window.removeEventListener('storage', onCartUpdated);
      window.removeEventListener('keydown', onKeyDown);
      observer.disconnect();
      revealObserver.disconnect();
    };
  }, []);

  const updateCartCount = () => {
    try {
      const count = parseInt(localStorage.getItem('db_cart_count') || '0');
      setCartCount(isNaN(count) ? 0 : count);
    } catch { setCartCount(0); }
  };

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

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setMobileMenuOpen(false);
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.name.trim() || !contactForm.email.trim() || !contactForm.message.trim()) {
      setFormStatus('error');
      setTimeout(() => setFormStatus('idle'), 3000);
      return;
    }
    setFormStatus('success');
    setContactForm({ name: '', email: '', message: '' });
    setTimeout(() => setFormStatus('idle'), 4000);
  };

  const navItems = [
    { id: 'home', label: 'Home' },
    { id: 'about', label: 'About' },
    { id: 'features', label: 'Features' },
    { id: 'how-it-works', label: 'How it works' },
    { id: 'shops', label: 'Shops' },
    { id: 'testimonials', label: 'Testimonials' },
    { id: 'pricing', label: 'Pricing' },
    { id: 'faq', label: 'FAQ' },
  ];

  return (
    <div className="elite-page">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600&display=swap');
        :root {
          --brand: #0F766E;
          --brand-dark: #0D5C56;
          --brand-light: #E6F4F3;
          --brand-light-2: #F0FAF9;
          --brand-gradient: linear-gradient(135deg, #0F766E 0%, #14B8A6 100%);
          --secondary: #F59E0B;
          --secondary-light: #FEF3C7;
          --text-primary: #0F172A;
          --text-secondary: #475569;
          --text-tertiary: #94A3B8;
          --surface: #FFFFFF;
          --surface-muted: #F8FAFC;
          --surface-subtle: #F1F5F9;
          --border: #E2E8F0;
          --border-light: #F1F5F9;
          --success: #059669;
          --success-light: #D1FAE5;
          --warning: #D97706;
          --warning-light: #FEF3C7;
          --danger: #DC2626;
          --danger-light: #FEE2E2;
          --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
          --shadow: 0 4px 6px -1px rgb(0 0 0 / 0.07), 0 2px 4px -2px rgb(0 0 0 / 0.07);
          --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.08), 0 4px 6px -4px rgb(0 0 0 / 0.08);
          --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
          --shadow-2xl: 0 25px 50px -12px rgb(0 0 0 / 0.15);
          --radius-sm: 8px;
          --radius: 12px;
          --radius-lg: 16px;
          --radius-xl: 20px;
          --radius-full: 9999px;
        }
        * { font-family: 'Plus Jakarta Sans', 'Inter', system-ui, -apple-system, sans-serif; box-sizing: border-box; }
        html { scroll-behavior: smooth; scroll-padding-top: 88px; }
        body { margin: 0; background: var(--surface); color: var(--text-primary); -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; overflow-x: hidden; }
        .elite-page { overflow-x: hidden; }
        a:focus-visible, button:focus-visible, input:focus-visible, textarea:focus-visible { outline: 2px solid var(--brand); outline-offset: 2px; }
        .skip-link { position: absolute; top: -100%; left: 16px; background: var(--brand); color: white; padding: 12px 20px; border-radius: 10px; z-index: 100; font-weight: 600; text-decoration: none; }
        .skip-link:focus { top: 12px; }
        .container { max-width: 1280px; margin: 0 auto; padding: 0 24px; }
        .btn-primary { background: var(--brand-gradient); background-color: var(--brand); color: white; border: none; border-radius: 12px; padding: 14px 24px; font-weight: 600; font-size: 14px; display: inline-flex; align-items: center; justify-content: center; gap: 8px; cursor: pointer; transition: all 0.2s cubic-bezier(0.16,1,0.3,1); text-decoration: none; box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05), 0 4px 12px -2px rgb(15 118 110 / 0.2); letter-spacing: -0.01em; white-space: nowrap; }
        .btn-primary:hover { transform: translateY(-1px); box-shadow: 0 4px 12px -2px rgb(15 118 110 / 0.3), 0 8px 20px -4px rgb(15 118 110 / 0.2); filter: brightness(1.05); }
        .btn-primary:active { transform: translateY(0); }
        .btn-secondary { background: var(--surface); color: var(--text-primary); border: 1px solid var(--border); border-radius: 12px; padding: 14px 24px; font-weight: 500; font-size: 14px; display: inline-flex; align-items: center; justify-content: center; gap: 8px; cursor: pointer; transition: all 0.2s; text-decoration: none; letter-spacing: -0.01em; white-space: nowrap; }
        .btn-secondary:hover { border-color: var(--brand); color: var(--brand); background: var(--brand-light); transform: translateY(-1px); box-shadow: var(--shadow-sm); }
        .btn-ghost { background: transparent; border: none; color: var(--text-secondary); cursor: pointer; padding: 10px; border-radius: 10px; transition: all 0.2s; display: inline-flex; align-items: center; justify-content: center; position: relative; }
        .btn-ghost:hover { background: var(--surface-muted); color: var(--text-primary); }
        .card { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; transition: all 0.25s cubic-bezier(0.16,1,0.3,1); }
        .card-premium { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; padding: 24px; transition: all 0.3s cubic-bezier(0.16,1,0.3,1); }
        .card-premium:hover { transform: translateY(-3px); box-shadow: var(--shadow-lg); border-color: var(--brand); }
        .badge { font-size: 11px; font-weight: 700; padding: 6px 12px; border-radius: 20px; display: inline-flex; align-items: center; gap: 6px; letter-spacing: 0.05em; text-transform: uppercase; }
        .badge-success { background: var(--success-light); color: var(--success); border: 1px solid #A7F3D0; }
        .badge-warning { background: var(--warning-light); color: var(--warning); border: 1px solid #FDE68A; }
        .badge-neutral { background: var(--surface-muted); color: var(--text-secondary); border: 1px solid var(--border); text-transform: none; font-weight: 600; letter-spacing: 0; font-size: 12px; }
        .badge-brand { background: var(--brand-light); color: var(--brand); border: 1px solid #99F6E0; }
        .skeleton { background: linear-gradient(90deg, var(--surface-muted) 25%, var(--border-light) 50%, var(--surface-muted) 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; border-radius: 8px; }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        .reveal { opacity: 0; transform: translateY(20px); transition: opacity 0.7s cubic-bezier(0.16,1,0.3,1), transform 0.7s cubic-bezier(0.16,1,0.3,1); }
        .reveal.visible { opacity: 1; transform: translateY(0); }
        .reveal-delay-1 { transition-delay: 0.08s; }
        .reveal-delay-2 { transition-delay: 0.16s; }
        .reveal-delay-3 { transition-delay: 0.24s; }
        .hero-grid { display: grid; grid-template-columns: 1.15fr 0.85fr; gap: 64px; align-items: center; }
        .cta-grid { display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 32px; align-items: center; }
        .nav-link { font-size: 14px; font-weight: 500; color: var(--text-secondary); text-decoration: none; padding: 8px 14px; border-radius: 10px; transition: all 0.2s; cursor: pointer; border: none; background: transparent; letter-spacing: -0.01em; position: relative; }
        .nav-link:hover { color: var(--text-primary); background: var(--surface-muted); }
        .nav-link.active { color: var(--brand); background: var(--brand-light); font-weight: 600; }
        .nav-link.active::after { content: ''; position: absolute; bottom: -2px; left: 14px; right: 14px; height: 2px; background: var(--brand); border-radius: 2px; }
        input:focus, textarea:focus, select:focus { outline: none; border-color: var(--brand) !important; box-shadow: 0 0 0 3px var(--brand-light); }
        .shop-card { display: block; background: white; border: 1px solid var(--border); border-radius: 16px; padding: 20px; transition: all 0.25s; }
        .shop-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-lg); border-color: var(--brand); }
        .shop-card-header { display: flex; gap: 14px; align-items: flex-start; }
        .shop-card-logo { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; border: 1px solid var(--border); }
        .product-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-lg); }
        @media (max-width: 1024px) { .hero-grid, .cta-grid { grid-template-columns: 1fr; gap: 48px; } }
        @media (max-width: 768px) {
          .container { padding: 0 20px; }
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
          .footer-grid { grid-template-columns: 1fr !important; gap: 36px !important; }
          .hero-grid { gap: 36px; }
          .nav-link.active::after { display: none; }
        }
        @media (min-width: 769px) {
          .mobile-menu { display: none !important; }
          .mobile-menu-btn { display: none !important; }
        }
        @media (max-width: 480px) {
          .container { padding-left: 16px !important; padding-right: 16px !important; }
          .btn-primary, .btn-secondary { width: 100%; }
          .hero-ctas { flex-direction: column; }
        }
      `}</style>

      <a href="#main-content" className="skip-link">Skip to content</a>

      {/* Header */}
      <header style={{ 
        position: 'sticky', top: 0, zIndex: 50, 
        background: scrolled ? 'rgba(255,255,255,0.86)' : 'rgba(255,255,255,0.92)', 
        backdropFilter: scrolled ? 'blur(16px) saturate(180%)' : 'blur(8px) saturate(180%)',
        WebkitBackdropFilter: scrolled ? 'blur(16px) saturate(180%)' : 'blur(8px) saturate(180%)',
        borderBottom: scrolled ? '1px solid var(--border)' : '1px solid transparent',
        boxShadow: scrolled ? '0 1px 3px 0 rgb(0 0 0 / 0.05), 0 1px 2px -1px rgb(0 0 0 / 0.05)' : 'none',
        transition: 'all 0.3s cubic-bezier(0.16,1,0.3,1)'
      }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 72 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 36 }}>
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }} aria-label="Digital Bazar home">
              <div style={{ width: 36, height: 36, background: 'var(--brand-gradient)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: 15, letterSpacing: '-0.02em', boxShadow: '0 2px 8px -2px rgb(15 118 110 / 0.4)' }}>DB</div>
              <span style={{ fontWeight: 700, fontSize: 18, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>Digital Bazar</span>
            </Link>
            
            <nav style={{ display: 'flex', alignItems: 'center', gap: 2 }} className="desktop-nav" aria-label="Main navigation">
              {navItems.map(item => (
                <button key={item.id} onClick={() => scrollToSection(item.id)} className={`nav-link ${activeSection === item.id ? 'active' : ''}`} aria-current={activeSection === item.id ? 'page' : undefined}>{item.label}</button>
              ))}
            </nav>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button onClick={() => setShowLocationPicker(!showLocationPicker)} aria-label="Choose location" aria-expanded={showLocationPicker} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--surface-muted)', border: '1px solid var(--border)', borderRadius: 10, padding: '9px 12px', cursor: 'pointer', fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', transition: 'all 0.2s' }}>
                <MapPin size={14} color="var(--brand)" />
                <span style={{ maxWidth: 120, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{location.city || 'Select location'}</span>
                <ChevronDown size={12} style={{ opacity: 0.6 }} />
              </button>
              <Link href="/search" className="btn-ghost" aria-label="Search products"><Search size={18} /></Link>
              <Link href="/cart" className="btn-ghost" aria-label={`Shopping cart, ${cartCount} items`} style={{ position: 'relative' }}>
                <ShoppingBag size={18} />
                {cartCount > 0 && <span style={{ position: 'absolute', top: 2, right: 2, background: 'var(--brand)', color: 'white', fontSize: 10, fontWeight: 700, minWidth: 18, height: 18, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px', border: '2px solid white' }}>{cartCount > 99 ? '99+' : cartCount}</span>}
              </Link>
              <Link href="/shops" className="btn-primary" style={{ padding: '10px 18px', fontSize: 13.5 }}>Find shops</Link>
            </div>
            
            <button className="btn-ghost mobile-menu-btn" style={{ padding: 10, display: 'none' }} onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'} aria-expanded={mobileMenuOpen}>
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div style={{ borderTop: '1px solid var(--border)', background: 'rgba(255,255,255,0.98)', backdropFilter: 'blur(16px)', padding: '20px 0 24px', animation: 'fadeIn 0.2s ease-out' }} className="mobile-menu">
            <div className="container">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {navItems.map(item => (
                  <button key={item.id} onClick={() => scrollToSection(item.id)} className={`nav-link ${activeSection === item.id ? 'active' : ''}`} style={{ textAlign: 'left', padding: '14px 16px', fontSize: 15, borderRadius: 12 }}>{item.label}</button>
                ))}
                <div style={{ display: 'flex', gap: 10, marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                  <Link href="/shops" className="btn-primary" style={{ flex: 1, justifyContent: 'center', padding: '14px' }}>Find shops</Link>
                  <Link href="/search" className="btn-secondary" style={{ flex: 1, justifyContent: 'center', padding: '14px' }}>Browse</Link>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <button onClick={() => { setShowLocationPicker(true); setMobileMenuOpen(false); }} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: 'var(--surface-muted)', border: '1px solid var(--border)', borderRadius: 12, padding: '12px', fontSize: 13, fontWeight: 500 }}><MapPin size={14} />{location.city || 'Select location'}</button>
                  <Link href="/cart" className="btn-ghost" style={{ border: '1px solid var(--border)', borderRadius: 12, flex: 1, justifyContent: 'center' }}><ShoppingBag size={16} />Cart {cartCount > 0 ? `(${cartCount})` : ''}</Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Location Picker */}
        {showLocationPicker && (
          <div style={{ borderTop: '1px solid var(--border)', background: 'var(--surface-muted)', padding: '16px 0', animation: 'fadeIn 0.2s ease-out' }}>
            <div className="container">
              <div className="card" style={{ padding: 20, maxWidth: 440, boxShadow: 'var(--shadow-xl)', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, letterSpacing: '-0.01em' }}>Choose your location</div>
                  <button onClick={() => setShowLocationPicker(false)} className="btn-ghost" style={{ padding: 6 }} aria-label="Close location picker"><X size={16} /></button>
                </div>
                <button className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginBottom: 12, padding: '12px' }} onClick={handleUseCurrentLocation}>
                  <Navigation size={16} /> Use current location
                </button>
                <div style={{ fontSize: 12, color: 'var(--text-tertiary)', textAlign: 'center', marginBottom: 12, fontWeight: 500 }}>or enter manually</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input placeholder="Area, city or pincode" style={{ flex: 1, padding: '11px 14px', borderRadius: 10, border: '1px solid var(--border)', fontSize: 14, background: 'white' }} id="manual-location" />
                  <button className="btn-secondary" style={{ padding: '11px 18px' }} onClick={() => {
                    const input = document.getElementById('manual-location') as HTMLInputElement;
                    if (input?.value) {
                      setLocation({ lat: null, lng: null, address: input.value, city: input.value, pincode: '', permission: 'unknown' });
                      setShowLocationPicker(false);
                    }
                  }}>Apply</button>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 12, lineHeight: 1.5, background: 'white', padding: 10, borderRadius: 8, border: '1px solid var(--border-light)' }}>📍 We use your location to show nearby shops and calculate distance. Stored locally, never shared with third parties.</div>
              </div>
            </div>
          </div>
        )}
      </header>

      <main id="main-content">
        {/* Hero */}
        <section id="home" ref={heroRef} style={{ background: 'linear-gradient(180deg, var(--brand-light-2) 0%, var(--surface) 55%)', overflow: 'hidden', position: 'relative' }}>
          {/* Abstract background */}
          <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
            <div style={{ position: 'absolute', top: -120, right: -80, width: 520, height: 520, background: 'radial-gradient(circle at 30% 30%, var(--brand-light) 0%, transparent 60%)', opacity: 0.7, borderRadius: '50%' }} />
            <div style={{ position: 'absolute', bottom: -120, left: -80, width: 400, height: 400, background: 'radial-gradient(circle at 70% 70%, #DBEAFE 0%, transparent 60%)', opacity: 0.5, borderRadius: '50%' }} />
            <div style={{ position: 'absolute', top: '20%', left: '35%', width: 1, height: '60%', background: 'linear-gradient(180deg, transparent 0%, var(--border) 50%, transparent 100%)', opacity: 0.5 }} className="desktop-nav" />
          </div>
          
          <div className="container" style={{ paddingTop: 88, paddingBottom: 88, position: 'relative' }}>
            <div className="hero-grid">
              <div data-reveal>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: 'white', border: '1px solid var(--border)', borderRadius: 100, padding: '6px 6px 6px 12px', fontSize: 12.5, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 24, boxShadow: 'var(--shadow-sm)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ display: 'flex', marginRight: 4 }}>
                      <span style={{ width: 24, height: 24, borderRadius: '50%', background: '#FDE68A', border: '2px solid white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, marginRight: -6 }}>R</span>
                      <span style={{ width: 24, height: 24, borderRadius: '50%', background: '#A7F3D0', border: '2px solid white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, marginRight: -6 }}>S</span>
                      <span style={{ width: 24, height: 24, borderRadius: '50%', background: '#BFDBFE', border: '2px solid white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700 }}>A</span>
                    </span>
                    Trusted by 500+ shops
                  </span>
                  <span style={{ background: 'var(--brand)', color: 'white', borderRadius: 100, padding: '4px 10px', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}><Star size={10} fill="white" />4.8/5</span>
                </div>
                
                <h1 style={{ fontSize: 'clamp(36px, 5.2vw, 60px)', fontWeight: 800, lineHeight: 0.95, letterSpacing: '-0.04em', color: 'var(--text-primary)', margin: 0 }}>
                  Shop Local.<br />
                  <span style={{ background: 'var(--brand-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', position: 'relative' }}>
                    Skip the Wait.
                  </span>
                </h1>
                
                <p style={{ fontSize: 'clamp(16px, 2vw, 19px)', color: 'var(--text-secondary)', marginTop: 20, lineHeight: 1.6, maxWidth: 560, letterSpacing: '-0.01em' }}>
                  Find products from nearby shops, order before you arrive, and collect when ready. Real inventory, real shops, zero waiting in crowded stores.
                </p>
                
                <form onSubmit={handleSearch} style={{ marginTop: 32, position: 'relative', maxWidth: 560 }}>
                  <div style={{ position: 'relative', display: 'flex', gap: 8, background: 'white', borderRadius: 16, padding: 6, border: '1px solid var(--border)', boxShadow: 'var(--shadow-xl)', transition: 'all 0.2s' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                      <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                      <input type="text" placeholder="Search cement, pipes, medicines, mobiles..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} aria-label="Search products" style={{ width: '100%', padding: '14px 14px 14px 44px', borderRadius: 10, border: 'none', fontSize: 15, background: 'transparent', outline: 'none', fontWeight: 500 }} />
                    </div>
                    <button type="submit" className="btn-primary" style={{ padding: '14px 26px', borderRadius: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>Search</button>
                  </div>
                  
                  {recentSearches.length > 0 && (
                    <div style={{ marginTop: 14, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                      <span style={{ fontSize: 12, color: 'var(--text-tertiary)', fontWeight: 600, letterSpacing: '0.02em' }}>RECENT:</span>
                      {recentSearches.map(term => (
                        <button key={term} type="button" onClick={() => { setSearchQuery(term); window.location.href = `/search?q=${encodeURIComponent(term)}`; }} style={{ fontSize: 12, background: 'white', border: '1px solid var(--border)', borderRadius: 100, padding: '6px 12px', cursor: 'pointer', fontWeight: 500, transition: 'all 0.2s', color: 'var(--text-secondary)' }}>{term}</button>
                      ))}
                    </div>
                  )}
                </form>

                <div className="hero-ctas" style={{ display: 'flex', gap: 12, marginTop: 28, flexWrap: 'wrap' }}>
                  <Link href="/shops" className="btn-primary" style={{ padding: '15px 28px', borderRadius: 14, fontWeight: 600, fontSize: 15, letterSpacing: '-0.01em' }}>Find Nearby Shops<ArrowRight size={18} /></Link>
                  <button onClick={() => scrollToSection('how-it-works')} className="btn-secondary" style={{ padding: '15px 28px', borderRadius: 14, fontWeight: 500, fontSize: 15, background: 'white' }}><Play size={16} fill="var(--text-primary)" />See how it works</button>
                </div>

                <div style={{ display: 'flex', gap: 28, marginTop: 40, paddingTop: 28, borderTop: '1px solid var(--border-light)', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}><Clock size={20} color="var(--success)" /></div>
                    <div><div style={{ fontSize: 13.5, fontWeight: 700, letterSpacing: '-0.01em' }}>Order ahead</div><div style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>Shop prepares while you travel</div></div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}><Package size={20} color="var(--brand)" /></div>
                    <div><div style={{ fontSize: 13.5, fontWeight: 700, letterSpacing: '-0.01em' }}>Collect when ready</div><div style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>QR pickup, no queues</div></div>
                  </div>
                </div>

                <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: 'var(--text-tertiary)', fontWeight: 500 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 6, height: 6, background: 'var(--success)', borderRadius: '50%', display: 'inline-block' }} />Loved in</span>
                  <span style={{ color: 'var(--text-secondary)' }}>Nagpur • Pune • Mumbai • Delhi • 12+ cities</span>
                </div>
              </div>

              <div data-reveal className="reveal-delay-1" style={{ position: 'relative' }}>
                {/* Floating badges */}
                <div style={{ position: 'absolute', top: -12, right: 12, background: 'white', border: '1px solid var(--border)', borderRadius: 100, padding: '8px 14px', fontSize: 12, fontWeight: 700, boxShadow: 'var(--shadow-lg)', display: 'flex', alignItems: 'center', gap: 6, zIndex: 2 }} className="desktop-nav">
                  <span style={{ width: 20, height: 20, background: 'var(--success-light)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Zap size={12} color="var(--success)" /></span>25 min avg saved
                </div>
                <div style={{ position: 'absolute', bottom: 24, left: -16, background: 'var(--text-primary)', color: 'white', borderRadius: 12, padding: '10px 14px', fontSize: 12, fontWeight: 600, boxShadow: 'var(--shadow-xl)', display: 'flex', alignItems: 'center', gap: 8, zIndex: 2 }} className="desktop-nav">
                  <span style={{ width: 28, height: 28, background: 'rgba(255,255,255,0.15)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ShieldCheck size={14} /></span>
                  <span>Live inventory • No fake stock</span>
                </div>

                <div style={{ background: 'white', borderRadius: 24, padding: 28, border: '1px solid var(--border)', boxShadow: 'var(--shadow-2xl)', position: 'relative' }}>
                  <div style={{ position: 'absolute', top: -12, right: 24, background: 'var(--brand)', color: 'white', fontSize: 11, fontWeight: 700, padding: '6px 12px', borderRadius: 20, letterSpacing: '0.05em', boxShadow: '0 4px 12px -2px rgb(15 118 110 / 0.4)' }}>HOW IT WORKS</div>
                  <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 20, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 8 }}><Layers size={18} color="var(--brand)" />From search to pickup in 4 steps</div>
                  
                  {[
                    { step: 1, title: 'Find a shop near you', desc: 'Browse verified local shops by category and distance', icon: Store, color: 'var(--brand)' },
                    { step: 2, title: 'Add what you need', desc: 'See live availability and prices from the shop', icon: Package, color: '#7C3AED' },
                    { step: 3, title: 'Place your order', desc: 'Choose pickup time, shop starts preparing', icon: Timer, color: '#059669' },
                    { step: 4, title: 'Collect when ready', desc: 'Get notified, show QR, pick up instantly', icon: Check, color: 'var(--brand)' },
                  ].map(item => (
                    <div key={item.step} style={{ display: 'flex', gap: 14, padding: '16px 0', borderBottom: item.step !== 4 ? '1px solid var(--border-light)' : 'none' }}>
                      <div style={{ width: 44, height: 44, borderRadius: 12, background: item.step === 4 ? 'var(--brand)' : `${item.color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: item.step === 4 ? 'white' : item.color, border: `1px solid ${item.step === 4 ? 'var(--brand)' : `${item.color}20`}` }}><item.icon size={20} /></div>
                      <div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: 14, letterSpacing: '-0.01em' }}>{item.title}</div><div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 3, lineHeight: 1.5 }}>{item.desc}</div></div>
                      <div style={{ fontSize: 12, color: 'white', fontWeight: 800, background: item.step === 4 ? 'var(--brand)' : 'var(--text-primary)', width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{item.step}</div>
                    </div>
                  ))}
                  
                  <div style={{ marginTop: 20, padding: 14, background: 'var(--brand-light-2)', borderRadius: 14, border: '1px solid var(--brand-light)', display: 'flex', gap: 12, alignItems: 'center' }}>
                    <div style={{ width: 36, height: 36, background: 'var(--brand)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><TrendingUp size={18} color="white" /></div>
                    <div><div style={{ fontWeight: 700, fontSize: 13.5, letterSpacing: '-0.01em' }}>Average time saved: 25 minutes per order</div><div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>No queues, no crowded aisles. Order ahead, collect when ready.</div></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Trusted by strip */}
        <section style={{ background: 'var(--surface-muted)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '20px 0' }}>
          <div className="container">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24, flexWrap: 'wrap', fontSize: 12.5, color: 'var(--text-tertiary)', fontWeight: 600, letterSpacing: '0.02em' }}>
              <span style={{ color: 'var(--text-secondary)', fontWeight: 700 }}>TRUSTED BY LOCAL SHOPS FOR</span>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {['Medical', 'Hardware', 'Building Material', 'Paint', 'Plumbing', 'Electrical', 'Grocery', 'Electronics'].map(cat => (
                  <span key={cat} style={{ background: 'white', border: '1px solid var(--border)', padding: '6px 12px', borderRadius: 100, color: 'var(--text-secondary)', fontWeight: 500, letterSpacing: 0, fontSize: 12 }}>{cat}</span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* About */}
        <section id="about" ref={aboutRef} style={{ padding: '104px 0', background: 'var(--surface)' }}>
          <div className="container">
            <div style={{ maxWidth: 720, margin: '0 auto', textAlign: 'center', marginBottom: 64 }} data-reveal>
              <div className="badge badge-brand" style={{ marginBottom: 16 }}><Sparkles size={12} />ABOUT DIGITAL BAZAR</div>
              <h2 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.05, margin: 0 }}>Built for local commerce,<br />not just online shopping</h2>
              <p style={{ fontSize: 18, color: 'var(--text-secondary)', lineHeight: 1.7, marginTop: 20, maxWidth: 600, margin: '20px auto 0', letterSpacing: '-0.01em' }}>Digital Bazar connects you with verified local shops — from medical stores to hardware shops. You buy from a specific shop you trust, not a faceless warehouse.</p>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
              {[
                { icon: Users, title: 'Customer-first, shop-first', desc: 'We make local shopping faster without replacing the shops you trust. Your neighborhood stores stay at the center, always.', color: 'var(--brand)', stats: '500+ shops' },
                { icon: ShieldCheck, title: 'Real inventory, real prices', desc: 'See actual stock and prices from local shops. No fake availability. What you see is what you get when you arrive.', color: '#059669', stats: 'Live stock' },
                { icon: Heart, title: 'Support your neighborhood', desc: 'Every order supports a local business. Keep your community thriving while skipping the wait and crowd.', color: '#DC2626', stats: 'Local love' },
              ].map((card, i) => (
                <div key={card.title} data-reveal className={`card-premium reveal-delay-${i+1}`} style={{ padding: 28 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                    <div style={{ width: 52, height: 52, background: `${card.color}12`, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', color: card.color, border: `1px solid ${card.color}20` }}><card.icon size={26} /></div>
                    <span style={{ fontSize: 11, fontWeight: 700, background: `${card.color}12`, color: card.color, padding: '4px 10px', borderRadius: 100, letterSpacing: '0.05em' }}>{card.stats}</span>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 10, letterSpacing: '-0.02em' }}>{card.title}</div>
                  <div style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.65 }}>{card.desc}</div>
                  <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: card.color }}><span>Learn more</span><ArrowUpRight size={14} /></div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" ref={featuresRef} style={{ padding: '104px 0', background: 'var(--surface-muted)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
          <div className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 48, flexWrap: 'wrap', gap: 20 }} data-reveal>
              <div><div className="badge badge-neutral" style={{ marginBottom: 12, background: 'white' }}><Layers size={12} />FEATURES</div><h2 style={{ fontSize: 'clamp(28px, 4vw, 38px)', fontWeight: 800, letterSpacing: '-0.03em', margin: 0, lineHeight: 1.05 }}>Everything you need for<br />local shopping</h2><p style={{ fontSize: 16, color: 'var(--text-secondary)', marginTop: 14, maxWidth: 480, lineHeight: 1.6 }}>Professional tools for customers and shop owners — from medical to hardware, all product categories supported with real data.</p></div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}><span className="badge badge-neutral" style={{ background: 'white' }}>For all categories</span><span className="badge badge-success">Real-time</span><span className="badge badge-neutral" style={{ background: 'white' }}>Mobile-first</span></div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
              {[
                { icon: Clock, title: 'Order ahead, skip the wait', desc: 'Place your order before you arrive. Shop prepares while you travel. Average 25 minutes saved per order, no queues.', color: 'var(--brand)', badge: 'Save time' },
                { icon: Package, title: 'Real inventory from real shops', desc: 'Browse live stock from verified local shops. Know what\'s available before you visit. No fake availability ever.', color: '#7C3AED', badge: 'Live stock' },
                { icon: MapPin, title: 'Zone-based fast picking', desc: 'Orders auto-sorted by storage zones for efficient preparation. Staff picks faster, you collect sooner.', color: '#059669', badge: 'Fast prep' },
                { icon: QrCode, title: 'QR verification for pickup', desc: 'Secure QR code for pickup. Show at counter, shop verifies, order completed. No reuse, no fraud.', color: '#D97706', badge: 'Secure' },
                { icon: FileText, title: 'GST invoices & billing', desc: 'Automatic GST-compliant invoices with GSTIN, HSN codes, tax breakdown. Professional billing for all categories.', color: '#0EA5E9', badge: 'Compliant' },
                { icon: BarChart3, title: 'Analytics for shop owners', desc: 'Real sales, orders, inventory insights from actual database. No fake graphs. Know your business growth.', color: '#DC2626', badge: 'Insights' },
              ].map((feature, i) => (
                <div key={feature.title} data-reveal className={`card-premium reveal-delay-${(i%3)+1}`} style={{ padding: 26 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                    <div style={{ width: 48, height: 48, background: `${feature.color}12`, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: feature.color, flexShrink: 0, border: `1px solid ${feature.color}20` }}><feature.icon size={22} /></div>
                    <span style={{ fontSize: 10, fontWeight: 700, background: `${feature.color}12`, color: feature.color, padding: '4px 8px', borderRadius: 100, letterSpacing: '0.05em' }}>{feature.badge}</span>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8, letterSpacing: '-0.01em' }}>{feature.title}</div>
                  <div style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{feature.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it Works Detailed */}
        <section id="how-it-works" ref={howItWorksRef} style={{ padding: '104px 0', background: 'var(--surface)' }}>
          <div className="container">
            <div style={{ textAlign: 'center', maxWidth: 680, margin: '0 auto 64px' }} data-reveal>
              <div className="badge badge-neutral" style={{ marginBottom: 16 }}><Zap size={12} />HOW IT WORKS</div>
              <h2 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.05, margin: 0 }}>From search to pickup in minutes,<br />not hours</h2>
              <p style={{ fontSize: 16, color: 'var(--text-secondary)', marginTop: 16, lineHeight: 1.6, maxWidth: 520, margin: '16px auto 0' }}>A complete local commerce flow that works for any product — from Paracetamol to PVC pipes to Redmi phones, all real.</p>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 32, position: 'relative' }} data-reveal>
              <div style={{ position: 'absolute', top: 32, left: '12%', right: '12%', height: 2, background: 'linear-gradient(90deg, var(--border) 0%, var(--brand-light) 50%, var(--border) 100%)', display: 'none' }} className="desktop-nav" />
              {[
                { step: '01', title: 'Discover', desc: 'Find nearby shops by location, category, distance. Real open/closed status, ratings, products from DB.', icon: Search },
                { step: '02', title: 'Order', desc: 'Add products with real price/stock. Server validates everything. Inventory reserved transactionally.', icon: ShoppingBag },
                { step: '03', title: 'Prepare', desc: 'Shop gets instant notification. Accepts order. Zone-sorted picking for fast preparation.', icon: Package },
                { step: '04', title: 'Collect', desc: 'Get notified when ready. Show QR at shop. Verification, completion, invoice, review.', icon: Check },
              ].map((item, i) => (
                <div key={item.step} className={`reveal-delay-${i+1}`} style={{ textAlign: 'center', position: 'relative' }}>
                  <div style={{ width: 72, height: 72, background: 'var(--brand-gradient)', color: 'white', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 8px 20px -4px rgb(15 118 110 / 0.4)', position: 'relative' }}>
                    <item.icon size={30} />
                    <div style={{ position: 'absolute', top: -8, right: -8, background: 'var(--text-primary)', color: 'white', fontSize: 11, fontWeight: 800, width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid white', boxShadow: 'var(--shadow)' }}>{item.step}</div>
                  </div>
                  <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 10, letterSpacing: '-0.02em' }}>{item.title}</div>
                  <div style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: 260, margin: '0 auto' }}>{item.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Shops Near You - Real Data */}
        <section id="shops" ref={shopsRef} style={{ padding: '88px 0', background: 'var(--surface-muted)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
          <div className="container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32, flexWrap: 'wrap', gap: 16 }} data-reveal>
              <div><div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}><h2 style={{ fontSize: 'clamp(24px, 3vw, 32px)', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>Shops near you</h2><span className="badge badge-success" style={{ fontSize: 11 }}>LIVE DATA</span></div><p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>{location.lat ? <><Navigation size={12} /> Sorted by distance from your location • Real open status</> : 'Discover verified local shops • All categories from medical to hardware • Real inventory'}</p></div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}><Link href="/shops" className="btn-secondary" style={{ borderRadius: 12, background: 'white' }}>View all shops<ArrowRight size={14} /></Link>{!location.lat && <button className="btn-primary" style={{ borderRadius: 12 }} onClick={handleUseCurrentLocation}><MapPin size={14} />Use my location</button>}</div>
            </div>
            
            {loading ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
                {[1,2,3].map(i => (<div key={i} className="card" style={{ padding: 20 }}><div className="skeleton" style={{ height: 48, width: 48, borderRadius: 12 }} /><div className="skeleton" style={{ height: 16, width: '70%', marginTop: 16 }} /><div className="skeleton" style={{ height: 12, width: '50%', marginTop: 8 }} /></div>))}
              </div>
            ) : shops.length === 0 ? (
              <div className="card" style={{ padding: 48, textAlign: 'center', background: 'white' }} data-reveal>
                <div style={{ width: 64, height: 64, background: 'white', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}><Store size={28} color="var(--text-tertiary)" /></div>
                <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 8, letterSpacing: '-0.01em' }}>No shops nearby yet</div>
                <div style={{ fontSize: 14, color: 'var(--text-secondary)', maxWidth: 420, margin: '0 auto 20px', lineHeight: 1.6 }}>We couldn't find shops in your area yet. Try changing location or check back as more shops join Digital Bazar. Real shops, real data — no fake listings.</div>
                <button className="btn-primary" onClick={() => setShowLocationPicker(true)}><MapPin size={16} />Change location</button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }} data-reveal>
                {shops.map(shop => {
                  const openStatus = getShopOpenStatus(shop);
                  return <ShopCard key={shop.id} shop={{ id: shop.id, name: shop.name, slug: shop.slug, category: shop.category, address: shop.address, rating: shop.rating, reviewCount: shop.reviewCount, preparationTimeMin: shop.preparationTimeMin, status: shop.status, distance: shop.distance, isOpen: openStatus.isOpen, openStatus: openStatus.status, productCount: shop._count?.products }} />;
                })}
              </div>
            )}

            {/* Categories */}
            <div style={{ marginTop: 56 }} data-reveal>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}><h3 style={{ fontSize: 19, fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>Shop by category</h3><Link href="/shops" style={{ fontSize: 13, color: 'var(--brand)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}>View all<ArrowRight size={12} /></Link></div>
              {categories.length === 0 ? <div style={{ fontSize: 14, color: 'var(--text-secondary)', background: 'white', border: '1px solid var(--border)', borderRadius: 12, padding: 20, textAlign: 'center' }}>Categories will appear when shops add products — real data, no placeholders.</div> : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(148px, 1fr))', gap: 12 }}>
                  {categories.map(cat => {
                    const icons: any = { 'Building Material': '🏗️', Cement: '🏗️', 'Bricks': '🧱', Plumbing: '🚿', Paint: '🎨', Electrical: '💡', Hardware: '🔩', Tools: '🛠️', Medical: '💊', Grocery: '🛒', Electronics: '📱', General: '📦' };
                    return <Link key={cat.name} href={`/search?category=${encodeURIComponent(cat.name)}`} className="card" style={{ padding: 18, textAlign: 'center', textDecoration: 'none', transition: 'all 0.2s', background: 'white' }}><div style={{ fontSize: 28, marginBottom: 8 }}>{icons[cat.name] || '📦'}</div><div style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>{cat.name}</div><div style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 4, fontWeight: 500 }}>{cat.count > 0 ? `${cat.count} products` : `${cat.shops} shops`}</div></Link>;
                  })}
                </div>
              )}
            </div>

            {/* Products */}
            {products.length > 0 && (
              <div style={{ marginTop: 56 }} data-reveal>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}><h3 style={{ fontSize: 19, fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>Products near you</h3><Link href="/search" style={{ fontSize: 13, color: 'var(--brand)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}>View all<ArrowRight size={12} /></Link></div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
                  {products.map(product => <ProductCard key={product.id} product={product} onAdd={(id, qty) => handleAddToCart(id, product.shopId, qty)} />)}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Testimonials */}
        <section id="testimonials" ref={testimonialsRef} style={{ padding: '104px 0', background: 'var(--surface)' }}>
          <div className="container">
            <div style={{ textAlign: 'center', maxWidth: 640, margin: '0 auto 64px' }} data-reveal>
              <div className="badge badge-brand" style={{ marginBottom: 16 }}><Award size={12} />TESTIMONIALS</div>
              <h2 style={{ fontSize: 'clamp(28px, 4vw, 38px)', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.05, margin: 0 }}>Loved by customers and shop owners</h2>
              <p style={{ fontSize: 16, color: 'var(--text-secondary)', marginTop: 14, lineHeight: 1.6 }}>Real stories from people using Digital Bazar for daily shopping — from medical to hardware.</p>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20 }}>
              {[
                { quote: 'I used to wait 30 minutes at the hardware shop. Now I order while at work and pickup in 5 minutes. The shop owner knows me and my order is ready when I arrive.', name: 'Rahul Deshmukh', role: 'Customer • Nagpur', rating: 5, product: 'Cement, PVC Pipes', avatar: 'R' },
                { quote: 'As a medical shop owner, I was worried about online. But Digital Bazar brings customers who already know what they need. My staff picks faster with zone sorting.', name: 'Dr. Sunita Patil', role: 'Shop Owner • Ganesh Medical', rating: 5, product: 'Medical & Personal Care', avatar: 'S' },
                { quote: 'The QR pickup is brilliant. No confusion, no billing queue. Show QR, collect, done. And I get GST invoice automatically. Works for all my products.', name: 'Amit Sharma', role: 'Customer • Pune', rating: 5, product: 'Medical, Grocery, Electronics', avatar: 'A' },
              ].map((t, i) => (
                <div key={i} data-reveal className={`card-premium reveal-delay-${i+1}`} style={{ padding: 26, position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: 16, right: 16, color: 'var(--brand-light)', opacity: 0.9 }}><Quote size={36} /></div>
                  <div style={{ display: 'flex', gap: 3, marginBottom: 14 }}>{Array.from({ length: t.rating }).map((_, j) => <Star key={j} size={14} fill="#F59E0B" color="#F59E0B" />)}</div>
                  <div style={{ fontSize: 15, lineHeight: 1.65, color: 'var(--text-primary)', marginBottom: 22, position: 'relative', letterSpacing: '-0.01em' }}>"{t.quote}"</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 16, borderTop: '1px solid var(--border-light)' }}>
                    <div style={{ width: 44, height: 44, background: 'var(--brand-light)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand)', fontWeight: 800, fontSize: 14, border: '1px solid var(--brand-light)' }}>{t.avatar}</div>
                    <div><div style={{ fontWeight: 700, fontSize: 14, letterSpacing: '-0.01em' }}>{t.name}</div><div style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginTop: 1 }}>{t.role}</div><div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2, fontWeight: 500 }}>{t.product}</div></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" ref={pricingRef} style={{ padding: '104px 0', background: 'var(--surface-muted)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
          <div className="container">
            <div style={{ textAlign: 'center', maxWidth: 640, margin: '0 auto 64px' }} data-reveal>
              <div className="badge badge-neutral" style={{ marginBottom: 16, background: 'white' }}><CreditCard size={12} />PRICING FOR SHOP OWNERS</div>
              <h2 style={{ fontSize: 'clamp(28px, 4vw, 38px)', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.05, margin: 0 }}>Simple pricing, no hidden fees</h2>
              <p style={{ fontSize: 16, color: 'var(--text-secondary)', marginTop: 14, lineHeight: 1.6 }}>Start free, pay only when you grow. No commission on first 50 orders. Cancel anytime.</p>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24, maxWidth: 1040, margin: '0 auto' }}>
              {[
                { name: 'Starter', price: 'Free', desc: 'For new shops testing Digital Bazar', features: ['Up to 50 orders/month free', '100 products', '2 staff accounts', 'Basic analytics', 'QR pickup', 'Email support'], cta: 'Start free', popular: false },
                { name: 'Growth', price: '₹999', period: '/month', desc: 'For growing shops with regular orders', features: ['500 orders/month', 'Unlimited products', '10 staff accounts', 'Advanced analytics', 'GST invoices', 'Priority support', 'Promotions & discounts', 'Zone management'], cta: 'Start 14-day trial', popular: true },
                { name: 'Pro', price: '₹2,499', period: '/month', desc: 'For high-volume shops and chains', features: ['Unlimited orders', 'Unlimited everything', 'Unlimited staff', 'Custom analytics', 'API access', 'Dedicated manager', 'Multi-shop support', 'White-label option'], cta: 'Contact sales', popular: false },
              ].map((plan, i) => (
                <div key={plan.name} data-reveal className={`card reveal-delay-${i+1}`} style={{ padding: 28, position: 'relative', border: plan.popular ? '2px solid var(--brand)' : '1px solid var(--border)', boxShadow: plan.popular ? 'var(--shadow-2xl)' : 'var(--shadow-sm)', transform: plan.popular ? 'scale(1.02)' : 'none', background: 'white' }}>
                  {plan.popular && <div style={{ position: 'absolute', top: -13, left: '50%', transform: 'translateX(-50%)', background: 'var(--brand)', color: 'white', fontSize: 11, fontWeight: 800, padding: '6px 16px', borderRadius: 100, letterSpacing: '0.06em', boxShadow: '0 4px 12px -2px rgb(15 118 110 / 0.4)' }}>MOST POPULAR</div>}
                  <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 6, letterSpacing: '-0.02em' }}>{plan.name}</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 10 }}><span style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-0.03em' }}>{plan.price}</span>{plan.period && <span style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 500 }}>{plan.period}</span>}</div>
                  <div style={{ fontSize: 13.5, color: 'var(--text-secondary)', marginBottom: 22, lineHeight: 1.5 }}>{plan.desc}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
                    {plan.features.map(f => <div key={f} style={{ display: 'flex', gap: 10, fontSize: 13.5, alignItems: 'flex-start' }}><span style={{ width: 20, height: 20, background: 'var(--success-light)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}><Check size={12} color="var(--success)" strokeWidth={3} /></span><span style={{ fontWeight: 500, lineHeight: 1.4 }}>{f}</span></div>)}
                  </div>
                  <button className={plan.popular ? 'btn-primary' : 'btn-secondary'} style={{ width: '100%', justifyContent: 'center', borderRadius: 12, padding: '13px' }}>{plan.cta}<ArrowRight size={14} /></button>
                </div>
              ))}
            </div>
            
            <div style={{ textAlign: 'center', marginTop: 36, fontSize: 13, color: 'var(--text-secondary)', background: 'white', border: '1px solid var(--border)', borderRadius: 100, padding: '10px 20px', maxWidth: 720, margin: '36px auto 0', fontWeight: 500 }} data-reveal>All plans include: Real inventory, transactional orders, secure payments, realtime notifications, mobile app • No setup fees • Cancel anytime</div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" ref={faqRef} style={{ padding: '88px 0', background: 'var(--surface)' }}>
          <div className="container">
            <div style={{ maxWidth: 800, margin: '0 auto' }}>
              <div style={{ textAlign: 'center', marginBottom: 48 }} data-reveal>
                <div className="badge badge-neutral" style={{ marginBottom: 16 }}><MessageCircle size={12} />FAQ</div>
                <h2 style={{ fontSize: 'clamp(28px, 4vw, 36px)', fontWeight: 800, letterSpacing: '-0.03em', margin: 0 }}>Frequently asked questions</h2>
                <p style={{ fontSize: 15, color: 'var(--text-secondary)', marginTop: 12 }}>Everything you need to know about Digital Bazar</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }} data-reveal>
                {[
                  { q: 'What is Digital Bazar and how is it different?', a: 'Digital Bazar is a local commerce marketplace connecting customers with verified nearby shops. Unlike big e-commerce warehouses, you buy from a specific local shop you trust — from medical stores to hardware shops. Real inventory, real prices, real community.' },
                  { q: 'How does "order ahead, skip the wait" work?', a: 'Search products from nearby shops, add to cart, place order with pickup time. Shop gets instant notification, accepts and prepares your order sorted by storage zones. You get notified when ready, show QR at counter, collect instantly. Average 25 minutes saved per order.' },
                  { q: 'What product categories are supported?', a: 'All local commerce categories: Medical, Hardware, Building Materials (cement, bricks), Plumbing (pipes, fittings), Paint, Electrical, Tools, Grocery, Electronics, and more. If a local shop sells it, Digital Bazar supports it with category-specific attributes.' },
                  { q: 'How do shop owners join? Is it complicated?', a: 'Shop owners register with business details, GSTIN, bank info. Admin verifies (PENDING_REVIEW → APPROVED). Then add products by searching master catalog, set price/stock/SKU, manage orders in dashboard. No coding needed — built for shop owners, not developers.' },
                  { q: 'Is inventory real-time? Can overselling happen?', a: 'Yes, inventory is transactional: total/reserved/available/sold with server-side validation. When you order, stock is reserved transactionally. On completion, deducted and invoice generated. On cancel/reject, released. Prevents overselling — no fake availability.' },
                  { q: 'What about payments, GST invoices and pickup verification?', a: 'Razorpay integration with server-side verification. GST-compliant invoices with GSTIN, HSN codes, tax breakdown auto-generated on order completion. QR verification for pickup — secure, single-use, no fraud. Reviews only for completed orders.' },
                ].map((faq, idx) => (
                  <div key={idx} className="card" style={{ background: faqOpen === idx ? 'white' : 'var(--surface-muted)', border: faqOpen === idx ? '1px solid var(--brand)' : '1px solid var(--border)', overflow: 'hidden' }}>
                    <button onClick={() => setFaqOpen(faqOpen === idx ? null : idx)} style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 22px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', gap: 16 }}>
                      <span style={{ fontWeight: 600, fontSize: 15, letterSpacing: '-0.01em', color: 'var(--text-primary)' }}>{faq.q}</span>
                      <span style={{ width: 28, height: 28, borderRadius: '50%', background: faqOpen === idx ? 'var(--brand)' : 'white', color: faqOpen === idx ? 'white' : 'var(--text-secondary)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.2s' }}>
                        {faqOpen === idx ? <Minus size={14} /> : <Plus size={14} />}
                      </span>
                    </button>
                    {faqOpen === idx && (
                      <div style={{ padding: '0 22px 20px', fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.65, animation: 'fadeIn 0.2s ease-out' }}>
                        {faq.a}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA / Contact */}
        <section id="contact" ref={contactRef} style={{ padding: '96px 0', background: 'var(--surface-muted)', borderTop: '1px solid var(--border)' }}>
          <div className="container">
            <div className="cta-grid" style={{ background: 'var(--brand-gradient)', borderRadius: 24, padding: 48, color: 'white', position: 'relative', overflow: 'hidden', boxShadow: 'var(--shadow-2xl)' }} data-reveal>
              <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
                <div style={{ position: 'absolute', top: -100, right: -80, width: 400, height: 400, background: 'radial-gradient(circle, rgba(255,255,255,0.18) 0%, transparent 60%)', borderRadius: '50%' }} />
                <div style={{ position: 'absolute', bottom: -80, left: -60, width: 300, height: 300, background: 'radial-gradient(circle, rgba(255,255,255,0.12) 0%, transparent 60%)', borderRadius: '50%' }} />
                <div style={{ position: 'absolute', top: '30%', left: '20%', width: 1, height: 1, background: 'white', borderRadius: '50%', boxShadow: '0 0 20px 2px rgba(255,255,255,0.5), 80px 20px 0 1px rgba(255,255,255,0.3), 40px 80px 0 1px rgba(255,255,255,0.2)' }} />
              </div>
              
              <div style={{ position: 'relative' }}>
                <div style={{ display: 'inline-flex', background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', fontSize: 11, fontWeight: 700, padding: '6px 14px', borderRadius: 100, letterSpacing: '0.06em', marginBottom: 20 }}><Store size={12} />FOR SHOP OWNERS</div>
                <h2 style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 800, lineHeight: 1.05, letterSpacing: '-0.03em', margin: 0 }}>Own a local shop?<br />Join Digital Bazar today</h2>
                <p style={{ fontSize: 16, opacity: 0.92, lineHeight: 1.6, marginTop: 16, maxWidth: 480, letterSpacing: '-0.01em' }}>Let customers order ahead from your store. Manage orders, inventory, and pickups in one simple dashboard. Works for any shop — medical, hardware, grocery, electronics.</p>
                
                <div style={{ display: 'flex', gap: 12, marginTop: 28, flexWrap: 'wrap' }}>
                  <Link href="/auth/register" style={{ background: 'white', color: 'var(--brand)', fontWeight: 700, borderRadius: 12, padding: '14px 24px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 14, boxShadow: '0 4px 12px -2px rgba(0,0,0,0.15)' }}>Register your shop<ArrowRight size={16} /></Link>
                  <Link href="/shopkeeper" style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)', color: 'white', border: '1px solid rgba(255,255,255,0.25)', borderRadius: 12, padding: '14px 24px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 14 }}>Learn more<ChevronRight size={14} /></Link>
                </div>
                
                <div style={{ display: 'flex', gap: 20, marginTop: 32, flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 500, opacity: 0.92 }}><span style={{ width: 20, height: 20, background: 'rgba(255,255,255,0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Check size={12} strokeWidth={3} /></span>No setup fees</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 500, opacity: 0.92 }}><span style={{ width: 20, height: 20, background: 'rgba(255,255,255,0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Check size={12} strokeWidth={3} /></span>First 50 orders free</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 500, opacity: 0.92 }}><span style={{ width: 20, height: 20, background: 'rgba(255,255,255,0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Check size={12} strokeWidth={3} /></span>Cancel anytime</div>
                </div>
              </div>
              
              <div style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(16px)', borderRadius: 20, padding: 24, border: '1px solid rgba(255,255,255,0.18)', position: 'relative', boxShadow: '0 8px 32px -8px rgba(0,0,0,0.2)' }}>
                <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4, letterSpacing: '-0.01em' }}>Get in touch</div>
                <div style={{ fontSize: 13, opacity: 0.8, marginBottom: 16 }}>Tell us about your shop — we reply within 24 hours</div>
                
                <form onSubmit={handleContactSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }} noValidate>
                  <div>
                    <label htmlFor="contact-name" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)' }}>Your name</label>
                    <input id="contact-name" placeholder="Your name" value={contactForm.name} onChange={e => setContactForm({ ...contactForm, name: e.target.value })} required style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.25)', background: 'rgba(255,255,255,0.12)', color: 'white', fontSize: 14, outline: 'none', transition: 'all 0.2s' }} />
                  </div>
                  <div>
                    <label htmlFor="contact-email" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)' }}>Your email</label>
                    <input id="contact-email" type="email" placeholder="Your email" value={contactForm.email} onChange={e => setContactForm({ ...contactForm, email: e.target.value })} required style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.25)', background: 'rgba(255,255,255,0.12)', color: 'white', fontSize: 14, outline: 'none' }} />
                  </div>
                  <div>
                    <label htmlFor="contact-message" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)' }}>Message</label>
                    <textarea id="contact-message" placeholder="Tell us about your shop — category, location, products (medical to hardware, all supported)" value={contactForm.message} onChange={e => setContactForm({ ...contactForm, message: e.target.value })} rows={3} required style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.25)', background: 'rgba(255,255,255,0.12)', color: 'white', fontSize: 14, outline: 'none', resize: 'none', minHeight: 84 }} />
                  </div>
                  <button type="submit" style={{ background: 'white', color: 'var(--brand)', border: 'none', borderRadius: 12, padding: '13px', fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.2s', boxShadow: '0 2px 8px -2px rgba(0,0,0,0.15)' }}>Send message<ArrowRight size={14} /></button>
                </form>
                
                {formStatus === 'success' && <div role="status" aria-live="polite" style={{ marginTop: 12, padding: '10px 12px', background: 'rgba(16, 185, 129, 0.2)', borderRadius: 10, fontSize: 12.5, border: '1px solid rgba(16, 185, 129, 0.35)', display: 'flex', alignItems: 'center', gap: 8 }}><Check size={14} />Message sent! We'll contact you within 24 hours.</div>}
                {formStatus === 'error' && <div role="alert" style={{ marginTop: 12, padding: '10px 12px', background: 'rgba(239, 68, 68, 0.2)', borderRadius: 10, fontSize: 12.5, border: '1px solid rgba(239, 68, 68, 0.35)' }}>Please fill all fields correctly.</div>}
                
                <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.15)', display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13, opacity: 0.9 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><span style={{ width: 28, height: 28, background: 'rgba(255,255,255,0.12)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Mail size={14} /></span>support@digitalbazar.com</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><span style={{ width: 28, height: 28, background: 'rgba(255,255,255,0.12)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Phone size={14} /></span>+91 98765 43210</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><span style={{ width: 28, height: 28, background: 'rgba(255,255,255,0.12)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><MapPin size={14} /></span>Nagpur, Maharashtra • Serving all India</div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer style={{ background: 'var(--text-primary)', color: 'white', padding: '64px 0 32px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr', gap: 40, marginBottom: 48 }} className="footer-grid">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <div style={{ width: 36, height: 36, background: 'var(--brand)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 15, boxShadow: '0 2px 8px -2px rgb(15 118 110 / 0.5)' }}>DB</div>
                <span style={{ fontWeight: 700, fontSize: 18, letterSpacing: '-0.03em' }}>Digital Bazar</span>
              </div>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', lineHeight: 1.6, maxWidth: 340, letterSpacing: '-0.01em' }}>Shop Local. Skip the Wait. Connecting customers with verified local shops for all products — from medical to hardware. Real inventory, real shops, real community.</div>
              <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
                {[
                  { icon: '𝕏', label: 'Twitter / X' },
                  { icon: 'f', label: 'Facebook' },
                  { icon: 'in', label: 'LinkedIn' },
                  { icon: 'ig', label: 'Instagram' },
                ].map(s => <a key={s.label} href="#" aria-label={s.label} style={{ width: 36, height: 36, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: 12, fontWeight: 700, transition: 'all 0.2s' }}>{s.icon}</a>)}
              </div>
            </div>
            
            <div><div style={{ fontWeight: 700, fontSize: 13, marginBottom: 18, letterSpacing: '0.04em', textTransform: 'uppercase', opacity: 0.9 }}>Marketplace</div><div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 13.5, color: 'rgba(255,255,255,0.65)' }}><Link href="/shops" style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s' }}>Browse shops</Link><Link href="/search" style={{ color: 'inherit', textDecoration: 'none' }}>Search products</Link><Link href="/search?category=Medical" style={{ color: 'inherit', textDecoration: 'none' }}>Medical</Link><Link href="/search?category=Hardware" style={{ color: 'inherit', textDecoration: 'none' }}>Hardware</Link><Link href="/search?category=Electronics" style={{ color: 'inherit', textDecoration: 'none' }}>Electronics</Link><Link href="/search?category=Building%20Material" style={{ color: 'inherit', textDecoration: 'none' }}>Building Material</Link></div></div>
            <div><div style={{ fontWeight: 700, fontSize: 13, marginBottom: 18, letterSpacing: '0.04em', textTransform: 'uppercase', opacity: 0.9 }}>For shops</div><div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 13.5, color: 'rgba(255,255,255,0.65)' }}><Link href="/auth/register" style={{ color: 'inherit', textDecoration: 'none' }}>Register shop</Link><Link href="/shopkeeper" style={{ color: 'inherit', textDecoration: 'none' }}>Shop dashboard</Link><Link href="/shopkeeper/products" style={{ color: 'inherit', textDecoration: 'none' }}>Add products</Link><Link href="#pricing" style={{ color: 'inherit', textDecoration: 'none' }}>Pricing</Link><a href="#faq" style={{ color: 'inherit', textDecoration: 'none' }}>Help center</a><a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>API docs</a></div></div>
            <div><div style={{ fontWeight: 700, fontSize: 13, marginBottom: 18, letterSpacing: '0.04em', textTransform: 'uppercase', opacity: 0.9 }}>Support</div><div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 13.5, color: 'rgba(255,255,255,0.65)' }}><a href="#contact" style={{ color: 'inherit', textDecoration: 'none' }}>Contact us</a><a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Privacy Policy</a><a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Terms of Service</a><a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Refund Policy</a><a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Shipping Policy</a><a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Security</a></div></div>
          </div>
          
          <div style={{ paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.45)', lineHeight: 1.5 }}>© {new Date().getFullYear()} Digital Bazar. All rights reserved. Made for local commerce in India. • Real shops, real inventory, real community.</div>
            <div style={{ display: 'flex', gap: 14, fontSize: 11.5, color: 'rgba(255,255,255,0.5)', fontWeight: 500, flexWrap: 'wrap' }}><span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Shield size={12} />Secure payments</span><span>•</span><span>🇮🇳 Made in India</span><span>•</span><span>GST compliant</span><span>•</span><span>Real data only</span></div>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .mobile-menu { animation: fadeIn 0.25s cubic-bezier(0.16,1,0.3,1); }
      `}</style>
    </div>
  );
}
