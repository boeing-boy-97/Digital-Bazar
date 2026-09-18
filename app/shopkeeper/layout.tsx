'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Logo } from '@/components/common/Logo';
import { 
  LayoutDashboard, ShoppingBag, Package, Warehouse, BarChart3, 
  Users, Settings, Store, Bell, LogOut, Menu, X
} from 'lucide-react';

const navItems = [
  { href: '/shopkeeper', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/shopkeeper/orders', label: 'Orders', icon: ShoppingBag },
  { href: '/shopkeeper/reservations', label: 'Reservations', icon: ShoppingBag },
  { href: '/shopkeeper/products', label: 'Products', icon: Package },
  { href: '/shopkeeper/inventory', label: 'Inventory', icon: Warehouse },
  { href: '/shopkeeper/zones', label: 'Storage Zones', icon: Store },
  { href: '/shopkeeper/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/shopkeeper/employees', label: 'Employees', icon: Users },
  { href: '/shopkeeper/settings', label: 'Settings', icon: Settings },
];

export default function ShopkeeperLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetch('/api/auth/me').then(r=>r.json()).then(data=>{
      if (!data.user) router.push('/auth/login');
      else if (!['shop_owner','shop_employee','admin','super_admin'].includes(data.user.role)) router.push('/');
      else setUser(data.user);
    });
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/auth/login');
  };

  return (
    <div className="dashboard-layout">
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Logo size="sm" />
          <button className="btn btn-ghost btn-sm" onClick={() => setSidebarOpen(false)} style={{ display: 'none' }}><X size={16} /></button>
        </div>
        <nav className="sidebar-nav">
          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8, padding: '0 8px' }}>Shop Management</div>
          {navItems.map(item => {
            const active = pathname === item.href || (item.href !== '/shopkeeper' && pathname.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8,
                background: active ? 'var(--brand-muted)' : 'transparent',
                color: active ? 'var(--brand)' : 'var(--text-secondary)',
                fontWeight: active ? 600 : 400, fontSize: '14px', marginBottom: 2
              }}>
                <item.icon size={18} /> {item.label}
              </Link>
            );
          })}
        </nav>
        <div style={{ padding: 16, borderTop: '1px solid var(--border)', marginTop: 'auto' }}>
          {user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <div style={{ width: 32, height: 32, background: 'var(--brand)', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '14px' }}>
                {user.name?.[0] || 'S'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 500, fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{user.role}</div>
              </div>
            </div>
          )}
          <button className="btn btn-ghost btn-sm btn-full" onClick={handleLogout}><LogOut size={14} /> Logout</button>
        </div>
      </aside>

      <div className="dashboard-main">
        <header style={{ height: 'var(--header-height)', background: 'var(--surface)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', position: 'sticky', top: 0, zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button className="btn btn-ghost" onClick={() => setSidebarOpen(true)} style={{ display: 'none' }}><Menu size={20} /></button>
            <div style={{ fontWeight: 600 }}>Shopkeeper Dashboard</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button className="btn btn-ghost"><Bell size={18} /></button>
            <Link href="/" className="btn btn-secondary btn-sm">View Store</Link>
          </div>
        </header>
        <div className="dashboard-content">
          {children}
        </div>
      </div>

      {sidebarOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 80 }} onClick={() => setSidebarOpen(false)} />
      )}

      <style>{`
        @media(max-width: 1024px){
          .dashboard-main{ margin-left: 0 !important; }
          .sidebar{ transform: translateX(-100%); }
          .sidebar.open{ transform: translateX(0); }
          button[style*="display: none"]{ display: flex !important; }
        }
      `}</style>
    </div>
  );
}
