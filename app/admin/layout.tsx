'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Logo } from '@/components/common/Logo';
import { LayoutDashboard, Store, Users, ShoppingBag, CreditCard, Settings, Shield, LogOut } from 'lucide-react';

const nav = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/shops', label: 'Shops', icon: Store },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { href: '/admin/payments', label: 'Payments', icon: CreditCard },
  { href: '/admin/settings', label: 'Platform Settings', icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetch('/api/auth/me').then(r=>r.json()).then(data=>{
      if (!data.user) router.push('/auth/login');
      else if (!['admin','super_admin'].includes(data.user.role)) router.push('/');
      else setUser(data.user);
    });
  }, []);

  return (
    <div className="dashboard-layout">
      <aside className="sidebar">
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <Logo size="sm" />
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}><Shield size={12} /> Admin Panel</div>
        </div>
        <nav className="sidebar-nav">
          {nav.map(item => {
            const active = pathname === item.href;
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
          <div style={{ fontSize: '13px', fontWeight: 500 }}>{user?.name}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{user?.role}</div>
          <button className="btn btn-ghost btn-sm btn-full" style={{ marginTop: 8 }} onClick={async()=>{await fetch('/api/auth/logout',{method:'POST'}); router.push('/auth/login');}}><LogOut size={14} /> Logout</button>
        </div>
      </aside>
      <div className="dashboard-main">
        <header style={{ height: 'var(--header-height)', background: 'var(--surface)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', position: 'sticky', top: 0, zIndex: 10 }}>
          <div style={{ fontWeight: 600 }}>Admin Dashboard</div>
          <Link href="/" className="btn btn-secondary btn-sm">View Site</Link>
        </header>
        <div className="dashboard-content">{children}</div>
      </div>
    </div>
  );
}
