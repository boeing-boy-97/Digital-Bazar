'use client';
import { useEffect, useState } from 'react';
import { formatCurrency, formatDate } from '@/lib/utils/helpers';
import Link from 'next/link';

export default function ShopkeeperOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchOrders(); }, [filter]);

  const fetchOrders = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filter) params.set('status', filter);
    const res = await fetch(`/api/orders?${params.toString()}`);
    const data = await res.json();
    setOrders(data.orders || []);
    setLoading(false);
  };

  const updateStatus = async (id: string, status: string) => {
    const res = await fetch(`/api/orders/${id}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    const data = await res.json();
    if (res.ok) fetchOrders();
    else alert(data.error);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700 }}>Orders</h1>
        <div className="tabs">
          {['','PENDING','ACCEPTED','PREPARING','READY_FOR_PICKUP','COMPLETED'].map(s => (
            <button key={s} className={`tab ${filter===s?'active':''}`} onClick={()=>setFilter(s)}>{s||'All'}</button>
          ))}
        </div>
      </div>

      {loading ? <div>Loading...</div> : (
        <div className="table-container">
          <div className="table-wrapper">
            <table className="table">
              <thead><tr><th>Order</th><th>Customer</th><th>Items</th><th>Total</th><th>Status</th><th>Time</th><th>Actions</th></tr></thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o.id}>
                    <td><Link href={`/shopkeeper/orders/${o.id}`} style={{ fontWeight: 600, color: 'var(--brand)' }}>#{o.orderNumber}</Link></td>
                    <td>{o.customer?.name}<br/><span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{o.customer?.phone}</span></td>
                    <td>{o.items.length} items</td>
                    <td>{formatCurrency(o.total)}</td>
                    <td><span className={`badge badge-${o.status==='PENDING'?'warning':o.status==='READY_FOR_PICKUP'?'success':'info'}`}>{o.status}</span></td>
                    <td style={{ fontSize: '12px' }}>{formatDate(o.createdAt)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {o.status==='PENDING' && <><button className="btn btn-primary btn-sm" onClick={()=>updateStatus(o.id,'ACCEPTED')}>Accept</button><button className="btn btn-secondary btn-sm" onClick={()=>updateStatus(o.id,'REJECTED')}>Reject</button></>}
                        {o.status==='ACCEPTED' && <button className="btn btn-primary btn-sm" onClick={()=>updateStatus(o.id,'PREPARING')}>Start Prep</button>}
                        {o.status==='PREPARING' && <button className="btn btn-primary btn-sm" onClick={()=>updateStatus(o.id,'READY_FOR_PICKUP')}>Mark Ready</button>}
                        {o.status==='READY_FOR_PICKUP' && <button className="btn btn-primary btn-sm" onClick={()=>updateStatus(o.id,'COMPLETED')}>Complete</button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
