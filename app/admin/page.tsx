'use client';
import { useEffect, useState } from 'react';
import { formatCurrency, formatPaise } from '@/lib/utils/helpers';
import { Store, Clock, CheckCircle, TrendingUp, ShoppingBag, DollarSign } from 'lucide-react';

export default function AdminDashboard() {
  const [shops, setShops] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [shopsRes, ordersRes] = await Promise.all([
        fetch('/api/admin/shops').then(r=>r.json()).catch(()=>({shops:[]})),
        fetch('/api/orders').then(r=>r.json()).catch(()=>({orders:[]}))
      ]);
      setShops(shopsRes.shops||[]);
      setOrders(ordersRes.orders||[]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div>
        <div className="skeleton" style={{ height: 24, width: 200, marginBottom: 24 }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="card" style={{ padding: 16 }}>
              <div className="skeleton skeleton-text" style={{ width: '60%' }} />
              <div className="skeleton" style={{ height: 28, width: 80, marginTop: 12 }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const pendingShops = shops.filter(s=>s.status==='PENDING_REVIEW').length;
  const approvedShops = shops.filter(s=>s.status==='APPROVED').length;
  const totalRevenue = orders.filter(o=>o.status==='COMPLETED').reduce((s, o) => s + (o.totalPaise ?? Math.round((o.total||0)*100)), 0);
  const platformCommission = totalRevenue * 0.05;

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, letterSpacing: '-0.02em' }}>Platform overview</h1>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: 4 }}>Monitor shops, orders, and platform performance</p>
      </div>
      
      {shops.length===0 && orders.length===0 ? (
        <div className="card" style={{ padding: 40, textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, background: 'var(--surface-muted)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Store size={28} color="var(--text-tertiary)" />
          </div>
          <div style={{ fontWeight: 600, fontSize: '16px', marginBottom: 8 }}>No platform data yet</div>
          <div style={{ fontSize: '14px', color: 'var(--text-secondary)', maxWidth: 480, margin: '0 auto 20px', lineHeight: 1.5 }}>
            When shops register and orders are placed, your platform metrics will appear here. Review pending shop applications to get started.
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="/admin/shops" className="btn btn-primary">Review shops {pendingShops > 0 && `(${pendingShops})`}</a>
            <button className="btn btn-secondary" onClick={fetchData}>Refresh</button>
          </div>
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
            <div className="card" style={{ padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Store size={12} /> Total shops
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: 700, marginTop: 6 }}>{shops.length}</div>
                </div>
                <div style={{ width: 36, height: 36, background: 'var(--brand-light)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Store size={18} color="var(--brand)" />
                </div>
              </div>
            </div>
            
            <div className="card" style={{ padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Clock size={12} /> Pending review
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: 700, marginTop: 6, color: pendingShops > 0 ? 'var(--warning)' : 'var(--text-primary)' }}>{pendingShops}</div>
                </div>
                <div style={{ width: 36, height: 36, background: 'var(--warning-light)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Clock size={18} color="var(--warning)" />
                </div>
              </div>
            </div>
            
            <div className="card" style={{ padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <CheckCircle size={12} /> Approved shops
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: 700, marginTop: 6, color: 'var(--success)' }}>{approvedShops}</div>
                </div>
                <div style={{ width: 36, height: 36, background: 'var(--success-light)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CheckCircle size={18} color="var(--success)" />
                </div>
              </div>
            </div>
            
            <div className="card" style={{ padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <DollarSign size={12} /> Platform revenue
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: 700, marginTop: 6 }}>{formatPaise(Math.round(platformCommission))}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: 2 }}>5% commission</div>
                </div>
                <div style={{ width: 36, height: 36, background: 'var(--success-light)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <TrendingUp size={18} color="var(--success)" />
                </div>
              </div>
            </div>
            
            <div className="card" style={{ padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <ShoppingBag size={12} /> Total orders
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: 700, marginTop: 6 }}>{orders.length}</div>
                </div>
                <div style={{ width: 36, height: 36, background: 'var(--brand-light)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ShoppingBag size={18} color="var(--brand)" />
                </div>
              </div>
            </div>
            
            <div className="card" style={{ padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Gross merchandise value</div>
                  <div style={{ fontSize: '24px', fontWeight: 700, marginTop: 6 }}>{formatPaise(totalRevenue)}</div>
                </div>
                <div style={{ width: 36, height: 36, background: 'var(--surface-muted)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <DollarSign size={18} color="var(--text-secondary)" />
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="card-title">Recent shop applications</div>
              <a href="/admin/shops" style={{ fontSize: '13px', color: 'var(--brand)', fontWeight: 500 }}>View all</a>
            </div>
            <div className="table-wrapper">
              <table className="table">
                <thead><tr><th>Shop</th><th>Owner</th><th>Category</th><th>Status</th><th>Action</th></tr></thead>
                <tbody>
                  {shops.slice(0,10).map(s=>(
                    <tr key={s.id}>
                      <td><div style={{ fontWeight: 500 }}>{s.name}</div><div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{s.city}</div></td>
                      <td><div>{s.owner?.name}</div><div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{s.owner?.phone}</div></td>
                      <td><span style={{ fontSize: '13px' }}>{s.category}</span></td>
                      <td><span className={`badge badge-${s.status==='APPROVED'?'success':s.status==='PENDING_REVIEW'?'warning':'danger'}`}>{s.status.replace(/_/g, ' ')}</span></td>
                      <td><a href="/admin/shops" className="btn btn-secondary btn-sm">Review</a></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {shops.length===0 && <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-secondary)', fontSize: '14px' }}>No shops registered yet</div>}
          </div>
        </>
      )}
    </div>
  );
}
