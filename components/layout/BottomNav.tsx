'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, ShoppingBag, Heart, User, Package, ClipboardList, Warehouse, LayoutDashboard } from 'lucide-react';
import { useEffect, useState } from 'react';

export function BottomNav() {
  const pathname = usePathname();
  const [role, setRole] = useState<string | null>(null);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    try {
      const token = document.cookie.split('; ').find(c => c.startsWith('auth-token='));
      if (token) {
        // Decode JWT payload without verification (middleware already verified)
        const payloadB64 = token.split('.')[1];
        const payloadJson = atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/'));
        const payload = JSON.parse(payloadJson);
        setRole(payload.role);
      }
    } catch {}

    const updateCart = () => {
      try {
        const c = parseInt(localStorage.getItem('db_cart_count') || '0');
        setCartCount(isNaN(c) ? 0 : c);
      } catch { setCartCount(0); }
    };
    updateCart();
    window.addEventListener('cart-updated', updateCart);
    return () => window.removeEventListener('cart-updated', updateCart);
  }, []);

  const isShopkeeper = role === 'shop_owner' || role === 'shop_employee';
  const isAdmin = role === 'admin' || role === 'super_admin';

  const customerNav = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/search', label: 'Search', icon: Search },
    { href: '/orders', label: 'Orders', icon: ShoppingBag },
    { href: '/favorites', label: 'Favorites', icon: Heart },
    { href: '/profile', label: 'Account', icon: User },
  ];

  const shopkeeperNav = [
    { href: '/shopkeeper', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/shopkeeper/orders', label: 'Orders', icon: Package },
    { href: '/shopkeeper/pick-lists', label: 'Picking', icon: ClipboardList },
    { href: '/shopkeeper/inventory', label: 'Inventory', icon: Warehouse },
    { href: '/shopkeeper/settings', label: 'More', icon: User },
  ];

  const adminNav = [
    { href: '/admin', label: 'Overview', icon: LayoutDashboard },
    { href: '/admin/shops', label: 'Shops', icon: Home },
    { href: '/admin/orders', label: 'Orders', icon: Package },
    { href: '/admin/health', label: 'Health', icon: Search },
    { href: '/profile', label: 'Account', icon: User },
  ];

  const nav = isAdmin ? adminNav : isShopkeeper ? shopkeeperNav : customerNav;

  return (
    <nav className="bottom-nav" aria-label="Bottom navigation">
      {nav.map(item => {
        const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
        const showCartBadge = item.href === '/search' || item.href === '/shopkeeper/orders';
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`bottom-nav-item ${isActive ? 'active' : ''}`}
            aria-label={item.label}
            aria-current={isActive ? 'page' : undefined}
          >
            <div style={{ position: 'relative' }}>
              <item.icon size={20} aria-hidden="true" />
              {item.label === 'Search' && cartCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: -6,
                  right: -10,
                  background: '#0F766E',
                  color: 'white',
                  fontSize: 10,
                  fontWeight: 700,
                  minWidth: 18,
                  height: 18,
                  borderRadius: 9,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 4px'
                }} aria-label={`${cartCount} items in cart`}>
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
              {item.label === 'Orders' && isShopkeeper && (
                <span style={{
                  position: 'absolute',
                  top: -4,
                  right: -8,
                  width: 8,
                  height: 8,
                  background: '#059669',
                  borderRadius: '50%',
                  border: '2px solid white'
                }} aria-hidden="true" />
              )}
            </div>
            <span style={{ fontSize: 10, fontWeight: isActive ? 600 : 500, marginTop: 2 }}>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
