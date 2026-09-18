'use client';
import { useEffect, useState } from 'react';
import { formatPaise } from '@/lib/domain/money';
import { Users, ShoppingBag, Search } from 'lucide-react';

export default function ShopCustomers() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  useEffect(()=>{ 
    fetch('/api/orders').then(r=>r.json()).then(d=>{ setOrders(d.orders||[]); setLoading(false); }).catch(()=>setLoading(false)); 
  },[]);
  
  const customers = Object.values(orders.reduce((acc:any, o:any)=>{
    const id = o.customerId;
    if (!acc[id]) acc[id] = { id, name: o.customer?.name || 'Customer', phone: o.customer?.phone, orders: 0, totalPaise: 0, lastOrder: o.createdAt };
    acc[id].orders++;
    acc[id].totalPaise+=(o.totalPaise ?? Math.round((o.total||0)*100));
    if (new Date(o.createdAt) > new Date(acc[id].lastOrder)) acc[id].lastOrder = o.createdAt;
    return acc;
  }, {}));

  const filtered = customers.filter((c:any) => 
    !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.phone?.includes(search)
  ) as any[];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, letterSpacing: '-0.02em' }}>Customers</h1>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: 4 }}>{customers.length} customers • Based on order history</p>
        </div>
        <div style={{ position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
          <input className="form-input" placeholder="Search by name or phone" value={search} onChange={e=>setSearch(e.target.value)} style={{ paddingLeft: 32, borderRadius: 8, minWidth: 240 }} />
        </div>
      </div>
      
      {loading ? (
        <div className="card" style={{ padding: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1,2,3].map(i => (
              <div key={i} style={{ display: 'flex', gap: 12 }}>
                <div className="skeleton" style={{ width: 40, height: 40, borderRadius: '50%' }} />
                <div style={{ flex: 1 }}>
                  <div className="skeleton" style={{ height: 14, width: '30%' }} />
                  <div className="skeleton" style={{ height: 12, width: '20%', marginTop: 8 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : filtered.length===0 ? (
        <div className="card" style={{ padding: 40, textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, background: 'var(--surface-muted)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Users size={24} color="var(--text-tertiary)" />
          </div>
          <div style={{ fontWeight: 600, fontSize: '16px', marginBottom: 8 }}>{search ? `No customers found for "${search}"` : 'No customers yet'}</div>
          <div style={{ fontSize: '14px', color: 'var(--text-secondary)', maxWidth: 400, margin: '0 auto', lineHeight: 1.5 }}>
            {search ? 'Try a different search term.' : 'When customers place orders, they will appear here with their order history and spending.'}
          </div>
        </div>
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div className="table-wrapper">
            <table className="table">
              <thead><tr><th>Customer</th><th>Orders</th><th>Total spent</th><th>Average order</th><th>Last order</th></tr></thead>
              <tbody>
                {filtered.map((c:any)=>(
                  <tr key={c.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 36, height: 36, background: 'var(--brand-light)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand)', fontWeight: 600, fontSize: '14px' }}>
                          {c.name.slice(0,2).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 500, fontSize: '14px' }}>{c.name}</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{c.phone}</div>
                        </div>
                      </div>
                    </td>
                    <td><span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><ShoppingBag size={12} />{c.orders}</span></td>
                    <td style={{ fontWeight: 600 }}>{formatPaise(c.totalPaise)}</td>
                    <td>{formatPaise(Math.round(c.totalPaise / (c.orders||1)))}</td>
                    <td style={{ fontSize: '13px' }}>{new Date(c.lastOrder).toLocaleDateString()}</td>
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
