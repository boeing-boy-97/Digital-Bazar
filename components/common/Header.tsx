'use client';
import { Logo } from './Logo';
import { Search, ShoppingCart, MapPin, Bell, User } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';

export function Header() {
  const [cartCount, setCartCount] = useState(0);
  const [location, setLocation] = useState('Aurangabad');

  useEffect(() => {
    // Load cart count from localStorage
    const saved = localStorage.getItem('db_cart_count');
    if (saved) setCartCount(parseInt(saved));
    
    const handleStorage = () => {
      const c = localStorage.getItem('db_cart_count');
      if (c) setCartCount(parseInt(c));
    };
    window.addEventListener('storage', handleStorage);
    window.addEventListener('cart-updated', handleStorage as any);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('cart-updated', handleStorage as any);
    };
  }, []);

  return (
    <header className="header">
      <div className="header-inner">
        <Logo size="sm" />
        
        <div className="flex items-center gap-3" style={{ flex: 1, maxWidth: 480, margin: '0 16px' }}>
          <div className="flex items-center gap-2" style={{ 
            padding: '6px 10px', 
            background: 'var(--surface-muted)', 
            borderRadius: 'var(--radius-md)',
            fontSize: '13px',
            color: 'var(--text-secondary)',
            whiteSpace: 'nowrap'
          }}>
            <MapPin size={14} />
            {location}
          </div>
          <div className="search-input-wrapper" style={{ flex: 1 }}>
            <Search size={16} className="search-input-icon" />
            <input 
              placeholder="Search shops, products..." 
              className="search-input"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const val = (e.target as HTMLInputElement).value;
                  window.location.href = `/search?q=${encodeURIComponent(val)}`;
                }
              }}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/cart" className="btn btn-ghost" style={{ position: 'relative' }}>
            <ShoppingCart size={20} />
            {cartCount > 0 && (
              <span style={{
                position: 'absolute',
                top: -2,
                right: -2,
                background: 'var(--brand)',
                color: 'white',
                borderRadius: '50%',
                width: 18,
                height: 18,
                fontSize: 11,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 600
              }}>{cartCount}</span>
            )}
          </Link>
          <Link href="/notifications" className="btn btn-ghost">
            <Bell size={20} />
          </Link>
          <Link href="/profile" className="btn btn-ghost">
            <User size={20} />
          </Link>
        </div>
      </div>
    </header>
  );
}
