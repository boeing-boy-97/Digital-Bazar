'use client';
import { useEffect, useState } from 'react';
import { Header } from '@/components/common/Header';
import { BottomNav } from '@/components/common/BottomNav';
import { useRouter } from 'next/navigation';
import { User, LogOut, ShoppingBag, Heart, Store, Shield, Settings } from 'lucide-react';

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/auth/me').then(r=>r.json()).then(data=>{ setUser(data.user); setLoading(false); if (!data.user) router.push('/auth/login'); });
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/auth/login');
  };

  if (loading) {
    return (
      <div className="page">
        <Header />
        <main className="main-content">
          <div className="container" style={{ paddingTop: 24, maxWidth: 600 }}>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 24 }}>
              <div className="skeleton" style={{ width: 64, height: 64, borderRadius: '50%' }} />
              <div>
                <div className="skeleton" style={{ height: 20, width: 120, marginBottom: 8 }} />
                <div className="skeleton" style={{ height: 14, width: 180 }} />
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="page">
      <Header />
      <main className="main-content">
        <div className="container" style={{ paddingTop: 24, paddingBottom: 88, maxWidth: 600 }}>
          <h1 style={{ fontSize: '24px', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 24 }}>Profile</h1>
          
          <div className="card" style={{ marginBottom: 20, overflow: 'hidden' }}>
            <div className="card-body" style={{ display: 'flex', gap: 16, alignItems: 'center', padding: 20 }}>
              <div style={{ width: 64, height: 64, background: 'var(--brand)', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 700, flexShrink: 0 }}>
                {user?.name?.[0]?.toUpperCase() || 'U'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '18px', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name}</div>
                <div style={{ fontSize: '14px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.phone || user?.email}</div>
                <span className="badge badge-brand" style={{ marginTop: 6, textTransform: 'capitalize' }}>{user?.role?.replace(/_/g, ' ')}</span>
              </div>
              <div style={{ width: 40, height: 40, background: 'var(--surface-muted)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <User size={20} color="var(--text-tertiary)" />
              </div>
            </div>
          </div>

          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-header"><div className="card-title">Personal information</div></div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Name</label>
                <input className="form-input" defaultValue={user?.name} style={{ borderRadius: 8 }} />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Phone</label>
                <input className="form-input" defaultValue={user?.phone} style={{ borderRadius: 8 }} />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Email</label>
                <input className="form-input" defaultValue={user?.email} style={{ borderRadius: 8 }} />
              </div>
              <button className="btn btn-primary" style={{ borderRadius: 8, marginTop: 8 }}>
                <Settings size={16} />
                Save changes
              </button>
            </div>
          </div>

          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-body" style={{ padding: 0 }}>
              <div style={{ padding: 16, fontWeight: 600, fontSize: '14px', borderBottom: '1px solid var(--border)' }}>Quick links</div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <a href="/orders" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', textDecoration: 'none', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-light)', fontSize: '14px' }}>
                  <ShoppingBag size={18} color="var(--text-secondary)" />
                  My orders
                </a>
                <a href="/favorites" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', textDecoration: 'none', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-light)', fontSize: '14px' }}>
                  <Heart size={18} color="var(--text-secondary)" />
                  Favorites
                </a>
                <a href="/shops" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', textDecoration: 'none', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-light)', fontSize: '14px' }}>
                  <Store size={18} color="var(--text-secondary)" />
                  Browse shops
                </a>
                {user?.role==='shop_owner' && (
                  <a href="/shopkeeper" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', textDecoration: 'none', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-light)', fontSize: '14px' }}>
                    <Store size={18} color="var(--brand)" />
                    Shop dashboard
                  </a>
                )}
                {['admin','super_admin'].includes(user?.role) && (
                  <a href="/admin" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', textDecoration: 'none', color: 'var(--text-primary)', fontSize: '14px' }}>
                    <Shield size={18} color="var(--text-secondary)" />
                    Admin panel
                  </a>
                )}
              </div>
            </div>
          </div>

          <button className="btn btn-secondary" style={{ width: '100%', borderRadius: 8, padding: '12px', justifyContent: 'center' }} onClick={handleLogout}>
            <LogOut size={16} />
            Logout
          </button>

          <div style={{ marginTop: 24, padding: 16, background: 'var(--surface-muted)', borderRadius: 12, fontSize: '12px', color: 'var(--text-secondary)', textAlign: 'center', lineHeight: 1.5 }}>
            <div style={{ fontWeight: 600, marginBottom: 4, color: 'var(--text-primary)' }}>Digital Bazar</div>
            <div>Shop Local. Skip the Wait.</div>
            <div style={{ marginTop: 4 }}>Supporting local shops in your neighborhood</div>
          </div>
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
