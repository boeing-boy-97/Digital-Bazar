'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MapPin, Search, ShoppingBag, Menu, X, ChevronDown, User, Bell, Store } from 'lucide-react';

interface EliteHeaderProps {
  showLocation?: boolean;
}

export function EliteHeader({ showLocation = true }: EliteHeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [location, setLocation] = useState<{ city: string } | null>(null);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    
    const updateCart = () => {
      try {
        const c = parseInt(localStorage.getItem('db_cart_count') || '0');
        setCartCount(isNaN(c) ? 0 : c);
      } catch { setCartCount(0); }
    };
    updateCart();
    window.addEventListener('cart-updated', updateCart);
    window.addEventListener('storage', updateCart);
    
    try {
      const loc = localStorage.getItem('db_user_location');
      if (loc) {
        const parsed = JSON.parse(loc);
        setLocation({ city: parsed.city || 'Current location' });
      } else {
        const savedCity = localStorage.getItem('db_city');
        if (savedCity) setLocation({ city: savedCity });
      }
    } catch {}

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('cart-updated', updateCart);
      window.removeEventListener('storage', updateCart);
    };
  }, []);

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/shops', label: 'Shops' },
    { href: '/search', label: 'Products' },
    { href: '/categories', label: 'Categories' },
    { href: '/about', label: 'About' },
    { href: '/contact', label: 'Contact' },
  ];

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <>
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: scrolled ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.95)',
        backdropFilter: scrolled ? 'blur(16px) saturate(180%)' : 'blur(8px) saturate(180%)',
        WebkitBackdropFilter: scrolled ? 'blur(16px) saturate(180%)' : 'blur(8px) saturate(180%)',
        borderBottom: scrolled ? '1px solid var(--border)' : '1px solid transparent',
        boxShadow: scrolled ? '0 1px 3px 0 rgb(0 0 0 / 0.05)' : 'none',
        transition: 'all 0.3s cubic-bezier(0.16,1,0.3,1)'
      }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 72 }}>
          {/* Left */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
            <Link href="/" aria-label="Digital Bazar home" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
              <div style={{ width: 36, height: 36, background: 'var(--brand-gradient)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: 15, letterSpacing: '-0.02em', boxShadow: '0 2px 8px -2px rgb(15 118 110 / 0.3)' }}>DB</div>
              <span style={{ fontWeight: 700, fontSize: 18, color: 'var(--text-primary)', letterSpacing: '-0.03em', fontFamily: 'var(--font-heading)' }}>Digital Bazar</span>
            </Link>

            <nav style={{ display: 'flex', alignItems: 'center', gap: 2 }} className="elite-desktop-nav" aria-label="Main">
              {navLinks.map(link => (
                <Link key={link.href} href={link.href} style={{
                  fontSize: 14,
                  fontWeight: isActive(link.href) ? 600 : 500,
                  color: isActive(link.href) ? 'var(--brand)' : 'var(--text-secondary)',
                  background: isActive(link.href) ? 'var(--brand-light)' : 'transparent',
                  padding: '8px 14px',
                  borderRadius: 10,
                  textDecoration: 'none',
                  transition: 'all 0.2s',
                  letterSpacing: '-0.01em'
                }}>{link.label}</Link>
              ))}
            </nav>
          </div>

          {/* Right */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="elite-desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {showLocation && (
                <button onClick={() => setShowLocationPicker(!showLocationPicker)} aria-label="Choose location" aria-expanded={showLocationPicker} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--surface-muted)', border: '1px solid var(--border)', borderRadius: 10, padding: '9px 12px', cursor: 'pointer', fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>
                  <MapPin size={14} color="var(--brand)" />
                  <span style={{ maxWidth: 110, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{location?.city || 'Select location'}</span>
                  <ChevronDown size={12} style={{ opacity: 0.5 }} />
                </button>
              )}
              <Link href="/search" aria-label="Search" style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 10, color: 'var(--text-secondary)', textDecoration: 'none', transition: 'all 0.2s' }}><Search size={18} /></Link>
              <Link href="/cart" aria-label={`Cart ${cartCount} items`} style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 10, color: 'var(--text-secondary)', textDecoration: 'none', position: 'relative' }}>
                <ShoppingBag size={18} />
                {cartCount > 0 && <span style={{ position: 'absolute', top: 2, right: 2, background: 'var(--brand)', color: 'white', fontSize: 10, fontWeight: 700, minWidth: 18, height: 18, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px', border: '2px solid white' }}>{cartCount > 99 ? '99+' : cartCount}</span>}
              </Link>
              <Link href="/auth/login" style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 10, color: 'var(--text-secondary)', textDecoration: 'none' }} aria-label="Account"><User size={18} /></Link>
              <Link href="/shops" style={{ background: 'var(--brand)', color: 'white', borderRadius: 12, padding: '10px 18px', fontSize: 13.5, fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05), 0 4px 12px -2px rgb(15 118 110 / 0.2)' }}>Shop Now</Link>
            </div>

            <button onClick={() => setMobileOpen(!mobileOpen)} aria-label={mobileOpen ? 'Close menu' : 'Open menu'} aria-expanded={mobileOpen} className="elite-mobile-btn" style={{ width: 40, height: 40, display: 'none', alignItems: 'center', justifyContent: 'center', borderRadius: 10, border: '1px solid var(--border)', background: 'white', cursor: 'pointer' }}>
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div style={{ borderTop: '1px solid var(--border)', background: 'white', padding: '16px 24px 24px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {navLinks.map(link => (
                <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)} style={{
                  padding: '14px 16px',
                  borderRadius: 12,
                  fontSize: 15,
                  fontWeight: isActive(link.href) ? 600 : 500,
                  color: isActive(link.href) ? 'var(--brand)' : 'var(--text-primary)',
                  background: isActive(link.href) ? 'var(--brand-light)' : 'var(--surface-muted)',
                  textDecoration: 'none'
                }}>{link.label}</Link>
              ))}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                <Link href="/shops" onClick={() => setMobileOpen(false)} style={{ background: 'var(--brand)', color: 'white', borderRadius: 12, padding: '14px', textAlign: 'center', fontWeight: 600, fontSize: 14, textDecoration: 'none' }}>Find Shops</Link>
                <Link href="/search" onClick={() => setMobileOpen(false)} style={{ background: 'var(--surface-muted)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px', textAlign: 'center', fontWeight: 500, fontSize: 14, textDecoration: 'none' }}>Products</Link>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <Link href="/cart" onClick={() => setMobileOpen(false)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: 'var(--surface-muted)', border: '1px solid var(--border)', borderRadius: 12, padding: '12px', fontSize: 13, fontWeight: 500, textDecoration: 'none', color: 'var(--text-primary)' }}><ShoppingBag size={14} />Cart {cartCount > 0 ? `(${cartCount})` : ''}</Link>
                <Link href="/auth/login" onClick={() => setMobileOpen(false)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: 'var(--surface-muted)', border: '1px solid var(--border)', borderRadius: 12, padding: '12px', fontSize: 13, fontWeight: 500, textDecoration: 'none', color: 'var(--text-primary)' }}><User size={14} />Account</Link>
              </div>
            </div>
          </div>
        )}

        {showLocationPicker && (
          <div style={{ borderTop: '1px solid var(--border)', background: 'var(--surface-muted)', padding: '16px 24px' }}>
            <div style={{ maxWidth: 1280, margin: '0 auto' }}>
              <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 16, padding: 20, maxWidth: 420, boxShadow: 'var(--shadow-lg)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>Choose location</div>
                  <button onClick={() => setShowLocationPicker(false)} style={{ width: 28, height: 28, borderRadius: 8, border: '1px solid var(--border)', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><X size={14} /></button>
                </div>
                <button onClick={() => {
                  if (!navigator.geolocation) return;
                  navigator.geolocation.getCurrentPosition(pos => {
                    localStorage.setItem('db_user_location', JSON.stringify({ lat: pos.coords.latitude, lng: pos.coords.longitude, city: 'Current location' }));
                    setLocation({ city: 'Current location' });
                    setShowLocationPicker(false);
                    window.location.reload();
                  });
                }} style={{ width: '100%', background: 'var(--brand)', color: 'white', border: 'none', borderRadius: 12, padding: '12px', fontWeight: 600, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>Use current location</button>
                <div style={{ marginTop: 12, fontSize: 11, color: 'var(--text-tertiary)', lineHeight: 1.5 }}>We use location to show nearby shops and distance. Stored locally, never shared.</div>
              </div>
            </div>
          </div>
        )}
      </header>

      <style>{`
        @media (max-width: 1024px) {
          .elite-desktop-nav { display: none !important; }
          .elite-mobile-btn { display: flex !important; }
        }
      `}</style>
    </>
  );
}
