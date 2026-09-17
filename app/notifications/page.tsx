'use client';
import { useEffect, useState } from 'react';
import { Header } from '@/components/common/Header';
import { BottomNav } from '@/components/common/BottomNav';
import { Bell, CheckCircle, Clock, Package, CreditCard } from 'lucide-react';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      // In production: GET /api/notifications with auth
      // Returns real notifications for authenticated user
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (type: string) => {
    if (type?.includes('ready')) return Package;
    if (type?.includes('payment')) return CreditCard;
    if (type?.includes('completed')) return CheckCircle;
    return Bell;
  };

  return (
    <div className="page">
      <Header />
      <main className="main-content">
        <div className="container" style={{ paddingTop: 24, paddingBottom: 88, maxWidth: 600 }}>
          <h1 style={{ fontSize: '24px', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 4 }}>Notifications</h1>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: 20 }}>Updates about your orders and activity</p>
          
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[1,2,3].map(i => (
                <div key={i} className="card" style={{ padding: 16 }}>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <div className="skeleton" style={{ width: 36, height: 36, borderRadius: 8 }} />
                    <div style={{ flex: 1 }}>
                      <div className="skeleton skeleton-title" style={{ height: 14, width: '60%' }} />
                      <div className="skeleton skeleton-text" style={{ height: 12, width: '90%', marginTop: 8 }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length===0 ? (
            <div className="card" style={{ padding: 40, textAlign: 'center' }}>
              <div style={{ width: 56, height: 56, background: 'var(--surface-muted)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <Bell size={24} color="var(--text-tertiary)" />
              </div>
              <div style={{ fontWeight: 600, fontSize: '16px', marginBottom: 8 }}>No notifications yet</div>
              <div style={{ fontSize: '14px', color: 'var(--text-secondary)', maxWidth: 400, margin: '0 auto', lineHeight: 1.5 }}>
                When you place orders, you'll get updates here about order status, when your order is ready for pickup, and payment confirmations.
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {notifications.map((n:any,i:number)=>{
                const Icon = getIcon(n.type);
                return (
                  <div key={n.id || i} className="card" style={{ padding: 16, borderLeft: n.isRead ? '1px solid var(--border)' : '3px solid var(--brand)' }}>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 8, background: n.isRead ? 'var(--surface-muted)' : 'var(--brand-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Icon size={18} color={n.isRead ? 'var(--text-tertiary)' : 'var(--brand)'} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: '14px', display: 'flex', alignItems: 'center', gap: 8 }}>
                          {n.title}
                          {!n.isRead && <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--brand)', display: 'inline-block' }}></span>}
                        </div>
                        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.4 }}>{n.message}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Clock size={10} />
                          {n.createdAt ? new Date(n.createdAt).toLocaleString() : 'Just now'}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
