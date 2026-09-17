'use client';
import { useEffect, useState } from 'react';
import { formatCurrency, formatPaise, formatDate } from '@/lib/utils/helpers';

export default function AdminOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  useEffect(() => { fetch('/api/orders').then(r=>r.json()).then(d=>setOrders(d.orders||[])); }, []);
  return (
    <div>
      <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: 16 }}>All Orders - Platform View</h1>
      <div className="table-container">
        <div className="table-wrapper">
          <table className="table">
            <thead><tr><th>Order</th><th>Shop</th><th>Customer</th><th>Total</th><th>Status</th><th>Date</th></tr></thead>
            <tbody>
              {orders.map(o=>(
                <tr key={o.id}><td>#{o.orderNumber}</td><td>{o.shop?.name}</td><td>{o.customer?.name}</td><td>{formatPaise(o.totalPaise ?? Math.round((o.total||0)*100))}</td><td><span className="badge badge-info">{o.status}</span></td><td style={{ fontSize: '12px' }}>{formatDate(o.createdAt)}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
