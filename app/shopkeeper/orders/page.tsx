'use client';
import { useEffect, useState } from 'react';
import { formatPaise } from '@/lib/domain/money';
import { formatDate } from '@/lib/utils/helpers';
import Link from 'next/link';
import { Clock, Package, CheckCircle, AlertTriangle, Search, Filter } from 'lucide-react';

export default function ShopkeeperOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchOrders(); }, [filter]);

  useEffect(() => {
    // Realtime updates
    let es: EventSource | null = null;
    try {
      es = new EventSource('/api/realtime/orders?shopId=temp');
      es.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data.type === 'shop_orders' || data.type === 'new_order') {
            fetchOrders();
          }
        } catch {}
      };
    } catch {}
    return () => es?.close();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter) params.set('status', filter);
      const res = await fetch(`/api/orders?${params.toString()}`);
      const data = await res.json();
      setOrders(data.orders || []);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: string, reason?: string) => {
    if (status === 'REJECTED' && !reason) {
      const r = prompt('Reason for rejection (customer will see this):');
      if (!r) return;
      reason = r;
    }

    const res = await fetch(`/api/orders/${id}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, reason })
    });
    const data = await res.json();
    if (res.ok) fetchOrders();
    else alert(data.error?.message || data.error || 'Failed to update order');
  };

  const filtered = orders.filter(o => {
    if (!search) return true;
    const q = search.toLowerCase();
    return o.orderNumber.toLowerCase().includes(q) || o.customer?.name?.toLowerCase().includes(q) || o.customer?.phone?.includes(q);
  });

  const getStatusColor = (status: string) => {
    if (status === 'PENDING') return 'warning';
    if (status === 'ACCEPTED') return 'info';
    if (status === 'PREPARING') return 'info';
    if (status === 'READY_FOR_PICKUP') return 'success';
    if (status === 'COMPLETED') return 'success';
    if (status === 'REJECTED' || status === 'CANCELLED') return 'danger';
    return 'neutral';
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, letterSpacing: '-0.02em' }}>Orders</h1>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: 4 }}>{orders.length} orders • Real-time updates</p>
        </div>
        
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
            <input className="form-input" placeholder="Search order or customer" value={search} onChange={e=>setSearch(e.target.value)} style={{ paddingLeft: 32, borderRadius: 8, minWidth: 0, width: "100%", maxWidth: 300 }} />
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {[
          { label: 'All', value: '' },
          { label: 'Pending', value: 'PENDING' },
          { label: 'Accepted', value: 'ACCEPTED' },
          { label: 'Preparing', value: 'PREPARING' },
          { label: 'Ready', value: 'READY_FOR_PICKUP' },
          { label: 'Completed', value: 'COMPLETED' },
          { label: 'Rejected', value: 'REJECTED' },
        ].map(s => (
          <button key={s.value} className={`btn ${filter===s.value?'btn-primary':'btn-secondary'} btn-sm`} style={{ borderRadius: 20 }} onClick={()=>setFilter(s.value)}>
            {s.label}
            {s.value && <span style={{ background: 'rgba(0,0,0,0.1)', padding: '2px 6px', borderRadius: 10, fontSize: '11px', marginLeft: 4 }}>{orders.filter(o=>o.status===s.value).length}</span>}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="card" style={{ padding: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1,2,3].map(i => (
              <div key={i} style={{ display: 'flex', gap: 12 }}>
                <div className="skeleton" style={{ width: 80, height: 20 }} />
                <div className="skeleton" style={{ height: 14, width: 120 }} />
              </div>
            ))}
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ padding: 40, textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, background: 'var(--surface-muted)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Package size={24} color="var(--text-tertiary)" />
          </div>
          <div style={{ fontWeight: 600, fontSize: '16px', marginBottom: 8 }}>{filter ? `No ${filter.toLowerCase()} orders` : 'No orders yet'}</div>
          <div style={{ fontSize: '14px', color: 'var(--text-secondary)', maxWidth: 400, margin: '0 auto', lineHeight: 1.5 }}>
            {filter ? `No orders with status ${filter}. Try different filter.` : 'When customers place orders, they will appear here. You will get notified instantly.'}
          </div>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="card" style={{ overflow: 'hidden' }}>
            <div className="table-wrapper">
              <table className="table">
                <thead><tr><th>Order</th><th>Customer</th><th>Items</th><th>Total</th><th>Status</th><th>Time</th><th>Actions</th></tr></thead>
                <tbody>
                  {filtered.map(o => (
                    <tr key={o.id}>
                      <td>
                        <Link href={`/shopkeeper/orders/${o.id}`} style={{ fontWeight: 600, color: 'var(--brand)', fontFamily: 'monospace', fontSize: '13px' }}>#{o.orderNumber}</Link>
                        <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: 2 }}>{o.pickupType === 'DELIVERY' ? 'Delivery' : 'Pickup'} • {o.paymentMethod}</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 500, fontSize: '14px' }}>{o.customer?.name || 'Customer'}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{o.customer?.phone}</div>
                      </td>
                      <td>
                        <div style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Package size={12} />
                          {o.items?.length || 0} items
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: 2 }}>{o.items?.slice(0,2).map((i:any)=>i.productName).join(', ')}{o.items?.length>2?'...':''}</div>
                      </td>
                      <td style={{ fontWeight: 600 }}>{formatPaise(o.totalPaise ?? Math.round((o.total||0)*100))}</td>
                      <td><span className={`badge badge-${getStatusColor(o.status)}`}>{o.status.replace(/_/g, ' ')}</span></td>
                      <td style={{ fontSize: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={10} />{formatDate(o.createdAt)}</div>
                        {o.pickupTime && <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: 2 }}>Pickup: {new Date(o.pickupTime).toLocaleTimeString()}</div>}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {o.status==='PENDING' && (
                            <>
                              <button className="btn btn-primary btn-sm" style={{ borderRadius: 6 }} onClick={()=>updateStatus(o.id,'ACCEPTED')}>Accept</button>
                              <button className="btn btn-secondary btn-sm" style={{ borderRadius: 6 }} onClick={()=>updateStatus(o.id,'REJECTED')}>Reject</button>
                            </>
                          )}
                          {o.status==='ACCEPTED' && <button className="btn btn-primary btn-sm" style={{ borderRadius: 6 }} onClick={()=>updateStatus(o.id,'PREPARING')}>Start preparing</button>}
                          {o.status==='PREPARING' && <button className="btn btn-primary btn-sm" style={{ borderRadius: 6 }} onClick={()=>updateStatus(o.id,'READY_FOR_PICKUP')}>Mark ready</button>}
                          {o.status==='READY_FOR_PICKUP' && <button className="btn btn-primary btn-sm" style={{ borderRadius: 6 }} onClick={()=>updateStatus(o.id,'COMPLETED')}>Complete</button>}
                          <Link href={`/shopkeeper/orders/${o.id}`} className="btn btn-ghost btn-sm" style={{ borderRadius: 6 }}>View</Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards - Responsive for 320px to 768px */}
          <div className="table-mobile-cards" style={{ display: 'none' }}>
            {filtered.map(o => (
              <div key={`mobile-${o.id}`} className="mobile-card">
                <div className="mobile-card-header">
                  <div>
                    <Link href={`/shopkeeper/orders/${o.id}`} style={{ fontWeight: 700, color: 'var(--brand)', fontFamily: 'monospace', fontSize: '14px', textDecoration: 'none' }}>#{o.orderNumber}</Link>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: 4 }}>{o.customer?.name || 'Customer'} • {o.customer?.phone}</div>
                  </div>
                  <span className={`badge badge-${getStatusColor(o.status)}`}>{o.status.replace(/_/g, ' ')}</span>
                </div>
                <div className="mobile-card-body">
                  <div className="mobile-card-row">
                    <span className="mobile-card-label">Items</span>
                    <span className="mobile-card-value">{o.items?.length || 0} items • {o.items?.slice(0,2).map((i:any)=>i.productName).join(', ')}{o.items?.length>2?'...':''}</span>
                  </div>
                  <div className="mobile-card-row">
                    <span className="mobile-card-label">Total</span>
                    <span className="mobile-card-value" style={{ fontWeight: 700 }}>{formatPaise(o.totalPaise ?? Math.round((o.total||0)*100))}</span>
                  </div>
                  <div className="mobile-card-row">
                    <span className="mobile-card-label">Type</span>
                    <span className="mobile-card-value">{o.pickupType === 'DELIVERY' ? 'Delivery' : 'Pickup'} • {o.paymentMethod}</span>
                  </div>
                  <div className="mobile-card-row">
                    <span className="mobile-card-label">Time</span>
                    <span className="mobile-card-value">{formatDate(o.createdAt)}{o.pickupTime ? ` • Pickup ${new Date(o.pickupTime).toLocaleTimeString()}` : ''}</span>
                  </div>
                </div>
                <div className="mobile-card-footer">
                  {o.status==='PENDING' && (
                    <>
                      <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={()=>updateStatus(o.id,'ACCEPTED')}>Accept</button>
                      <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={()=>updateStatus(o.id,'REJECTED')}>Reject</button>
                    </>
                  )}
                  {o.status==='ACCEPTED' && <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={()=>updateStatus(o.id,'PREPARING')}>Start preparing</button>}
                  {o.status==='PREPARING' && <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={()=>updateStatus(o.id,'READY_FOR_PICKUP')}>Mark ready</button>}
                  {o.status==='READY_FOR_PICKUP' && <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={()=>updateStatus(o.id,'COMPLETED')}>Complete</button>}
                  <Link href={`/shopkeeper/orders/${o.id}`} className="btn btn-secondary btn-sm" style={{ flex: 1, textAlign: 'center', justifyContent: 'center' }}>View</Link>
                </div>
              </div>
            ))}
          </div>

          <style>{`
            @media (max-width: 768px) {
              .table-wrapper { display: none !important; }
              .table-mobile-cards { display: block !important; }
            }
            @media (min-width: 769px) {
              .table-mobile-cards { display: none !important; }
            }
          `}</style>
        </>
      )}
    </div>
  );
}
