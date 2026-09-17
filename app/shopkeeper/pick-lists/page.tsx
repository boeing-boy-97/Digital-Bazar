'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Package, MapPin, Clock, CheckCircle } from 'lucide-react';

export default function PickLists() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(()=>{ 
    Promise.all([
      fetch('/api/orders?status=PREPARING').then(r=>r.json()).then(d=>d.orders||[]).catch(()=>[]),
      fetch('/api/orders?status=PICKING').then(r=>r.json()).then(d=>d.orders||[]).catch(()=>[]),
      fetch('/api/orders?status=ACCEPTED').then(r=>r.json()).then(d=>d.orders||[]).catch(()=>[])
    ]).then(([preparing, picking, accepted])=>{
      setOrders([...preparing, ...picking, ...accepted]);
      setLoading(false);
    }).catch(()=>setLoading(false));
  },[]);
  
  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, letterSpacing: '-0.02em' }}>Pick lists</h1>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: 4 }}>Orders ready for picking, sorted by storage zone</p>
      </div>
      
      <div className="card" style={{ marginBottom: 20, background: 'var(--surface-muted)' }}>
        <div className="card-body" style={{ display: 'flex', gap: 12 }}>
          <div style={{ width: 36, height: 36, background: 'var(--brand-light)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <MapPin size={18} color="var(--brand)" />
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: '14px' }}>Zone-based picking</div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.4 }}>
              Orders are automatically sorted by storage zones for efficient picking. Items from the same zone are grouped together to minimize walking.
            </div>
          </div>
        </div>
      </div>
      
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1,2,3].map(i => (
            <div key={i} className="card" style={{ padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <div className="skeleton" style={{ height: 18, width: 120, marginBottom: 8 }} />
                  <div className="skeleton" style={{ height: 12, width: 200 }} />
                </div>
                <div className="skeleton" style={{ height: 20, width: 80 }} />
              </div>
            </div>
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="card" style={{ padding: 40, textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, background: 'var(--surface-muted)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Package size={24} color="var(--text-tertiary)" />
          </div>
          <div style={{ fontWeight: 600, fontSize: '16px', marginBottom: 8 }}>No orders to pick</div>
          <div style={{ fontSize: '14px', color: 'var(--text-secondary)', maxWidth: 400, margin: '0 auto', lineHeight: 1.5 }}>
            When orders are accepted and ready for preparation, they will appear here sorted by zone for efficient picking.
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {orders.map(o=>(
            <Link key={o.id} href={`/shopkeeper/orders/${o.id}`} className="card" style={{ padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', textDecoration: 'none', transition: 'all 0.2s' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '16px', fontFamily: 'monospace', color: 'var(--text-primary)' }}>#{o.orderNumber}</div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Package size={12} />{o.items?.length || 0} items</span>
                  <span>•</span>
                  <span>{o.customer?.name || 'Customer'}</span>
                  {o.total && <><span>•</span><span style={{ fontWeight: 500 }}>₹{o.total}</span></>}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <MapPin size={10} />
                  Zone sorted • {o.status.replace(/_/g, ' ')}
                </div>
              </div>
              <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                <span className={`badge badge-${o.status==='PICKING'?'warning':o.status==='PREPARING'?'info':'neutral'}`}>{o.status.replace(/_/g, ' ')}</span>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 3 }}>
                  <Clock size={10} />
                  Tap to pick
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
