'use client';
import { useEffect, useState } from 'react';
import { Header } from '@/components/common/Header';
import { BottomNav } from '@/components/common/BottomNav';
import { useRouter } from 'next/navigation';

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

  if (loading) return <div className="page"><Header /><main className="main-content"><div className="container" style={{ paddingTop: 24 }}>Loading...</div></main></div>;

  return (
    <div className="page">
      <Header />
      <main className="main-content">
        <div className="container" style={{ paddingTop: 24, paddingBottom: 80, maxWidth: 600 }}>
          <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: 24 }}>Profile</h1>
          
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-body" style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              <div style={{ width: 64, height: 64, background: 'var(--brand)', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 700 }}>{user?.name?.[0] || 'U'}</div>
              <div>
                <div style={{ fontSize: '18px', fontWeight: 600 }}>{user?.name}</div>
                <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{user?.phone || user?.email}</div>
                <span className="badge badge-brand" style={{ marginTop: 4 }}>{user?.role}</span>
              </div>
            </div>
          </div>

          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-body stack stack-4">
              <div className="form-group"><label className="form-label">Name</label><input className="form-input" defaultValue={user?.name} /></div>
              <div className="form-group"><label className="form-label">Phone</label><input className="form-input" defaultValue={user?.phone} /></div>
              <div className="form-group"><label className="form-label">Email</label><input className="form-input" defaultValue={user?.email} /></div>
              <button className="btn btn-primary">Save Changes</button>
            </div>
          </div>

          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-body">
              <div style={{ fontWeight: 600, marginBottom: 12 }}>Quick Links</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <a href="/orders" className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}>My Orders</a>
                <a href="/favorites" className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}>Favorites & Regular Items</a>
                <a href="/shops" className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}>Browse Shops</a>
                {user?.role==='shop_owner' && <a href="/shopkeeper" className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}>Shopkeeper Dashboard</a>}
                {['admin','super_admin'].includes(user?.role) && <a href="/admin" className="btn btn-secondary" style={{ justifyContent: 'flex-start' }}>Admin Panel</a>}
              </div>
            </div>
          </div>

          <button className="btn btn-secondary btn-full" onClick={handleLogout}>Logout</button>

          <div style={{ marginTop: 24, padding: 16, background: 'var(--surface-muted)', borderRadius: 8, fontSize: '12px', color: 'var(--text-secondary)' }}>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>Digital Bazar v1.0</div>
            <div>Select Before You Arrive • Made for local commerce in India</div>
            <div style={{ marginTop: 8 }}>Features: Real inventory, Zone-sorted picking, QR verification, Razorpay payments, AI shopping assistant</div>
          </div>
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
