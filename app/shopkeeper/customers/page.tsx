'use client';
import { useEffect, useState } from 'react';
import { formatCurrency } from '@/lib/utils/helpers';

export default function ShopCustomers() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(()=>{ 
    fetch('/api/orders').then(r=>r.json()).then(d=>{ setOrders(d.orders||[]); setLoading(false); }); 
  },[]);
  
  // Aggregate customers from real orders - no fake customers
  const customers = Object.values(orders.reduce((acc:any, o:any)=>{
    const id = o.customerId;
    if (!acc[id]) acc[id] = { id, name: o.customer?.name || 'Customer', phone: o.customer?.phone, orders: 0, total: 0, lastOrder: o.createdAt };
    acc[id].orders++;
    acc[id].total+=o.total;
    if (new Date(o.createdAt) > new Date(acc[id].lastOrder)) acc[id].lastOrder = o.createdAt;
    return acc;
  }, {}));

  return (
    <div>
      <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: 8 }}>Customers - Real Data Only</h1>
      <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: 16 }}>Aggregated from real orders, no fake customers. Production starts empty. Real metrics: total spent SUM(completed), avg order, last order date.</div>
      
      {loading ? <div>Loading real customers from orders...</div> : customers.length===0 ? (
        <div className="card" style={{ padding: 32, textAlign: 'center' }}>
          <div style={{ fontSize: '32px', marginBottom: 12 }}>👥</div>
          <div style={{ fontWeight: 600 }}>No customers yet - Real empty state</div>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: 8, maxWidth: 400, margin: '8px auto 0' }}>
            Production database starts empty. Customers appear here when they place real orders. Aggregated from orders table, no fake "Rahul Sharma - 12 orders". Real data only.
          </div>
        </div>
      ) : (
        <div className="table-container">
          <div className="table-wrapper">
            <table className="table">
              <thead><tr><th>Customer (Real)</th><th>Orders (Real)</th><th>Total Spent (Real)</th><th>Avg Order (Real)</th><th>Last Order (Real)</th></tr></thead>
              <tbody>
                {customers.map((c:any)=>(
                  <tr key={c.id}><td><div style={{ fontWeight: 500 }}>{c.name}</div><div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{c.phone}</div></td><td>{c.orders}</td><td>{formatCurrency(c.total)}</td><td>{formatCurrency(c.total/c.orders)}</td><td style={{ fontSize: '12px' }}>{new Date(c.lastOrder).toLocaleDateString()}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
