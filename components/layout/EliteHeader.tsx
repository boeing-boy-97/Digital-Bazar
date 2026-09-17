'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MapPin, Search, ShoppingBag, Menu, X, ChevronDown, User, Store } from 'lucide-react';

interface EliteHeaderProps {
  showLocation?: boolean;
}

export function EliteHeader({ showLocation = true }: EliteHeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [location, setLocation] = useState<{ city: string; pincode?: string } | null>(null);
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
        setLocation({ city: parsed.city || 'Current location', pincode: parsed.pincode });
      } else {
        const savedCity = localStorage.getItem('db_city');
        const savedPincode = localStorage.getItem('db_pincode');
        if (savedCity) setLocation({ city: savedCity, pincode: savedPincode || undefined });
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
      <a href="#main-content" style={{
        position: 'absolute',
        left: -9999,
        top: 0,
        background: '#0F172A',
        color: 'white',
        padding: '12px 20px',
        borderRadius: '0 0 8px 0',
        zIndex: 100,
        fontSize: 14,
        fontWeight: 600,
        textDecoration: 'none'
      }}
      onFocus={e => { e.currentTarget.style.left = '0'; }}
      onBlur={e => { e.currentTarget.style.left = '-9999px'; }}
      >Skip to content</a>

      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 40,
        background: scrolled ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.96)',
        backdropFilter: scrolled ? 'blur(20px) saturate(180%)' : 'blur(12px) saturate(180%)',
        WebkitBackdropFilter: scrolled ? 'blur(20px) saturate(180%)' : 'blur(12px) saturate(180%)',
        borderBottom: scrolled ? '1px solid var(--border)' : '1px solid transparent',
        boxShadow: scrolled ? '0 1px 3px 0 rgb(0 0 0 / 0.05), 0 1px 2px -1px rgb(0 0 0 / 0.05)' : 'none',
        transition: 'all 0.25s cubic-bezier(0.16,1,0.3,1)'
      }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 72 }}>
          {/* Left: Logo + Nav */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 36 }}>
            <Link href="/" aria-label="Digital Bazar - Home" style={{ display: 'flex', alignItems: 'center', gap: 11, textDecoration: 'none' }}>
              <div style={{ 
                width: 38, 
                height: 38, 
                background: '#0F766E', 
                borderRadius: 11, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                color: 'white', 
                fontWeight: 800, 
                fontSize: 14, 
                letterSpacing: '-0.03em',
                boxShadow: '0 2px 10px -3px rgb(15 118 110 / 0.4)'
              }} aria-hidden="true">
                <svg width="22" height="22" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <g fill="white"><path d="M6 9C6 8.17 6.67 7.5 7.5 7.5H12.2C13.03 7.5 13.7 8.17 13.7 9L14.6 15C14.6 16.9 13 18.5 11.1 18.5C9.2 18.5 7.6 16.9 7.6 15L6 9Z"/><path d="M14.3 7.5H25.7L26.6 15C26.6 16.9 25 18.5 23.1 18.5H16.9C15 18.5 13.4 16.9 13.4 15L14.3 7.5Z"/><path d="M26.3 7.5H32.5C33.33 7.5 34 8.17 34 9L32.4 15C32.4 16.9 30.8 18.5 28.9 18.5C27 18.5 25.4 16.9 25.4 15L26.3 7.5Z"/></g>
                  <path d="M9 21.5V31C9 31.83 9.67 32.5 10.5 32.5H29.5C30.33 32.5 31 31.83 31 31V21.5" stroke="white" strokeWidth="1.7" strokeLinecap="round" fill="none"/>
                  <rect x="14.5" y="22.8" width="11" height="9.7" rx="1" stroke="white" strokeWidth="1.7" fill="none"/>
                  <path d="M23.2 26.2V28" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
                <span style={{ fontWeight: 800, fontSize: 17, color: 'var(--text-primary)', letterSpacing: '-0.03em', fontFamily: 'var(--font-heading)' }}>Digital Bazar</span>
                <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-tertiary)', letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: 1 }}>Nagpur • Local</span>
              </div>
            </Link>

            <nav aria-label="Main navigation" style={{ display: 'flex', alignItems: 'center', gap: 2 }} className="elite-desktop-nav">
              {navLinks.map(link => (
                <Link 
                  key={link.href} 
                  href={link.href} 
                  aria-current={isActive(link.href) ? 'page' : undefined}
                  style={{
                    fontSize: 14,
                    fontWeight: isActive(link.href) ? 600 : 500,
                    color: isActive(link.href) ? '#0F766E' : 'var(--text-secondary)',
                    background: isActive(link.href) ? '#E6F4F3' : 'transparent',
                    padding: '9px 14px',
                    borderRadius: 10,
                    textDecoration: 'none',
                    transition: 'all 0.2s ease',
                    letterSpacing: '-0.01em'
                  }}
                >{link.label}</Link>
              ))}
            </nav>
          </div>

          {/* Right: Location, Search, Cart, Account, CTA */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div className="elite-desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {showLocation && (
                <button 
                  onClick={() => setShowLocationPicker(!showLocationPicker)} 
                  aria-label={`Location: ${location?.city || 'Select location'}. Click to change.`}
                  aria-expanded={showLocationPicker}
                  aria-haspopup="dialog"
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 6, 
                    background: 'var(--surface-muted)', 
                    border: '1px solid var(--border)', 
                    borderRadius: 11, 
                    padding: '9px 12px', 
                    cursor: 'pointer', 
                    fontSize: 13, 
                    fontWeight: 500, 
                    color: 'var(--text-primary)',
                    transition: 'all 0.2s ease',
                    minHeight: 40
                  }}
                >
                  <MapPin size={14} color="#0F766E" aria-hidden="true" />
                  <span style={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{location?.city || 'Nagpur'}</span>
                  <ChevronDown size={12} style={{ opacity: 0.5, transform: showLocationPicker ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} aria-hidden="true" />
                </button>
              )}
              <Link 
                href="/search" 
                aria-label="Search products"
                style={{ 
                  width: 40, 
                  height: 40, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  borderRadius: 11, 
                  color: 'var(--text-secondary)', 
                  textDecoration: 'none', 
                  transition: 'all 0.2s',
                  border: '1px solid transparent'
                }}
              ><Search size={18} aria-hidden="true" /></Link>
              <Link 
                href="/cart" 
                aria-label={`Shopping cart, ${cartCount} items`}
                style={{ 
                  width: 40, 
                  height: 40, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  borderRadius: 11, 
                  color: 'var(--text-secondary)', 
                  textDecoration: 'none', 
                  position: 'relative',
                  border: '1px solid transparent'
                }}
              >
                <ShoppingBag size={18} aria-hidden="true" />
                {cartCount > 0 && <span style={{ position: 'absolute', top: 2, right: 2, background: '#0F766E', color: 'white', fontSize: 10, fontWeight: 700, minWidth: 18, height: 18, borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px', border: '2px solid white' }} aria-hidden="true">{cartCount > 99 ? '99+' : cartCount}</span>}
              </Link>
              <Link 
                href="/auth/login" 
                aria-label="Account - login or register"
                style={{ 
                  width: 40, 
                  height: 40, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  borderRadius: 11, 
                  color: 'var(--text-secondary)', 
                  textDecoration: 'none',
                  border: '1px solid transparent'
                }}
              ><User size={18} aria-hidden="true" /></Link>
              <Link 
                href="/auth/register" 
                style={{ 
                  background: '#0F766E', 
                  color: 'white', 
                  borderRadius: 11, 
                  padding: '10px 18px', 
                  fontSize: 13.5, 
                  fontWeight: 600, 
                  textDecoration: 'none', 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: 6, 
                  boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05), 0 4px 12px -2px rgb(15 118 110 / 0.22)',
                  transition: 'all 0.2s ease',
                  minHeight: 40
                }}
              >
                <Store size={14} aria-hidden="true" />
                Get listed free
              </Link>
            </div>

            <button 
              onClick={() => setMobileOpen(!mobileOpen)} 
              aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'} 
              aria-expanded={mobileOpen}
              aria-controls="mobile-menu"
              className="elite-mobile-btn" 
              style={{ 
                width: 44, 
                height: 44, 
                display: 'none', 
                alignItems: 'center', 
                justifyContent: 'center', 
                borderRadius: 11, 
                border: '1px solid var(--border)', 
                background: 'white', 
                cursor: 'pointer',
                color: 'var(--text-primary)'
              }}
            >
              {mobileOpen ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div 
            id="mobile-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
            style={{ 
              borderTop: '1px solid var(--border)', 
              background: 'white', 
              padding: '16px 24px 24px',
              maxHeight: '80vh',
              overflowY: 'auto'
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {navLinks.map(link => (
                <Link 
                  key={link.href} 
                  href={link.href} 
                  onClick={() => setMobileOpen(false)} 
                  aria-current={isActive(link.href) ? 'page' : undefined}
                  style={{
                    padding: '14px 16px',
                    borderRadius: 12,
                    fontSize: 15,
                    fontWeight: isActive(link.href) ? 600 : 500,
                    color: isActive(link.href) ? '#0F766E' : 'var(--text-primary)',
                    background: isActive(link.href) ? '#E6F4F3' : 'var(--surface-muted)',
                    textDecoration: 'none',
                    minHeight: 44,
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >{link.label}</Link>
              ))}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                <Link href="/shops" onClick={() => setMobileOpen(false)} style={{ background: '#0F766E', color: 'white', borderRadius: 12, padding: '14px', textAlign: 'center', fontWeight: 600, fontSize: 14, textDecoration: 'none', minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Find Shops</Link>
                <Link href="/search" onClick={() => setMobileOpen(false)} style={{ background: 'var(--surface-muted)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px', textAlign: 'center', fontWeight: 500, fontSize: 14, textDecoration: 'none', minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Products</Link>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <Link href="/cart" onClick={() => setMobileOpen(false)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: 'var(--surface-muted)', border: '1px solid var(--border)', borderRadius: 12, padding: '12px', fontSize: 13, fontWeight: 500, textDecoration: 'none', color: 'var(--text-primary)', minHeight: 44 }}><ShoppingBag size={14} aria-hidden="true" />Cart {cartCount > 0 ? `(${cartCount})` : ''}</Link>
                <Link href="/auth/login" onClick={() => setMobileOpen(false)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: 'var(--surface-muted)', border: '1px solid var(--border)', borderRadius: 12, padding: '12px', fontSize: 13, fontWeight: 500, textDecoration: 'none', color: 'var(--text-primary)', minHeight: 44 }}><User size={14} aria-hidden="true" />Account</Link>
              </div>
            </div>
          </div>
        )}

        {/* Location Picker */}
        {showLocationPicker && (
          <div role="dialog" aria-modal="true" aria-labelledby="location-picker-title" style={{ borderTop: '1px solid var(--border)', background: 'var(--surface-muted)', padding: '16px 24px' }}>
            <div style={{ maxWidth: 1280, margin: '0 auto' }}>
              <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 16, padding: 20, maxWidth: 420, boxShadow: 'var(--shadow-lg)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <h2 id="location-picker-title" style={{ fontWeight: 700, fontSize: 15, margin: 0 }}>Choose location</h2>
                  <button onClick={() => setShowLocationPicker(false)} aria-label="Close location picker" style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid var(--border)', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><X size={14} aria-hidden="true" /></button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <button onClick={() => {
                    localStorage.setItem('db_city', 'Nagpur');
                    localStorage.setItem('db_pincode', '440001');
                    setLocation({ city: 'Nagpur', pincode: '440001' });
                    setShowLocationPicker(false);
                    window.dispatchEvent(new Event('location-updated'));
                  }} style={{ textAlign: 'left', padding: '12px 14px', borderRadius: 10, border: '1px solid var(--border)', background: location?.city === 'Nagpur' ? '#E6F4F3' : 'white', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>
                    <div style={{ fontWeight: 600 }}>Nagpur</div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>Maharashtra • Launching here first</div>
                  </button>
                  <button onClick={() => {
                    if (!navigator.geolocation) return;
                    navigator.geolocation.getCurrentPosition(pos => {
                      localStorage.setItem('db_user_location', JSON.stringify({ lat: pos.coords.latitude, lng: pos.coords.longitude, city: 'Current location' }));
                      setLocation({ city: 'Current location' });
                      setShowLocationPicker(false);
                      window.dispatchEvent(new Event('location-updated'));
                    });
                  }} style={{ width: '100%', background: '#0F766E', color: 'white', border: 'none', borderRadius: 11, padding: '12px', fontWeight: 600, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 44 }}>
                    <MapPin size={14} aria-hidden="true" />
                    Use current location
                  </button>
                </div>
                <div style={{ marginTop: 12, fontSize: 11, color: 'var(--text-tertiary)', lineHeight: 1.5 }}>We use location to show nearby shops and distance. Stored locally, never shared. Pincode is how Indians navigate — we use it.</div>
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
        @media (hover: hover) {
          a:hover { opacity: 0.9; }
        }
        a:focus-visible, button:focus-visible {
          outline: 2px solid #0F766E;
          outline-offset: 2px;
        }
      `}</style>
    </>
  );
}
