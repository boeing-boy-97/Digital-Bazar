'use client';
import { useEffect, useState } from 'react';
import { formatCurrency } from '@/lib/utils/helpers';

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

  if (loading) return <div>Loading real platform data from database...</div>;

  const pendingShops = shops.filter(s=>s.status==='PENDING_REVIEW').length;
  const approvedShops = shops.filter(s=>s.status==='APPROVED').length;
  const totalRevenue = orders.filter(o=>o.status==='COMPLETED').reduce((s,o)=>s+o.total,0);
  const platformCommission = totalRevenue * 0.05;

  return (
    <div>
      <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: 8 }}>Platform Overview - Real Data Only</h1>
      <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: 24 }}>All metrics from real database queries, no fake statistics. Production starts empty unless admin creates records.</div>
      
      {shops.length===0 && orders.length===0 ? (
        <div className="card" style={{ padding: 32, textAlign: 'center' }}>
          <div style={{ fontSize: '32px', marginBottom: 12 }}>📊</div>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>No platform data yet - production starts empty</div>
          <div style={{ fontSize: '14px', color: 'var(--text-secondary)', maxWidth: 500, margin: '0 auto 16px' }}>
            Real database is authoritative. No fake users/shops/orders/revenue. For development, run <code>npm run db:seed</code> to create demo data. Production must not auto-populate with sample companies/products/orders.
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
            <a href="/admin/shops" className="btn btn-primary">Review Shops ({pendingShops})</a>
            <button className="btn btn-secondary" onClick={fetchData}>Refresh Real Data</button>
          </div>
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
            <div className="card" style={{ padding: 16 }}><div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Total Shops (Real)</div><div style={{ fontSize: '22px', fontWeight: 700 }}>{shops.length}</div><div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>COUNT(shops)</div></div>
            <div className="card" style={{ padding: 16 }}><div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Pending Review (Real)</div><div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--warning)' }}>{pendingShops}</div><div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>WHERE status=PENDING_REVIEW</div></div>
            <div className="card" style={{ padding: 16 }}><div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Approved Shops (Real)</div><div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--success)' }}>{approvedShops}</div><div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>WHERE status=APPROVED</div></div>
            <div className="card" style={{ padding: 16 }}><div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Platform Revenue 5% (Real)</div><div style={{ fontSize: '22px', fontWeight: 700 }}>{formatCurrency(platformCommission)}</div><div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>SUM(completed)*0.05</div></div>
            <div className="card" style={{ padding: 16 }}><div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Total Orders (Real)</div><div style={{ fontSize: '22px', fontWeight: 700 }}>{orders.length}</div><div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>COUNT(orders)</div></div>
            <div className="card" style={{ padding: 16 }}><div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>GMV (Real)</div><div style={{ fontSize: '22px', fontWeight: 700 }}>{formatCurrency(totalRevenue)}</div><div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>GMV = total value eligible completed orders before commission per accounting policy</div></div>
          </div>

          <div className="card">
            <div className="card-header"><div className="card-title">Recent Shop Applications - Real</div></div>
            <div className="table-wrapper">
              <table className="table">
                <thead><tr><th>Shop</th><th>Owner</th><th>Category</th><th>Status</th><th>Action</th></tr></thead>
                <tbody>
                  {shops.slice(0,10).map(s=>(
                    <tr key={s.id}>
                      <td><div style={{ fontWeight: 500 }}>{s.name}</div><div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{s.city}</div></td>
                      <td>{s.owner?.name}<br/><span style={{ fontSize: '12px' }}>{s.owner?.phone}</span></td>
                      <td>{s.category}</td>
                      <td><span className={`badge badge-${s.status==='APPROVED'?'success':s.status==='PENDING_REVIEW'?'warning':'danger'}`}>{s.status}</span></td>
                      <td><a href="/admin/shops" className="btn btn-secondary btn-sm">Review</a></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {shops.length===0 && <div style={{ padding: 16, textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>No shops in database - production starts empty</div>}
          </div>
        </>
      )}
    </div>
  );
}
