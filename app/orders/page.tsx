'use client';
import { useEffect, useState } from 'react';
import { Header } from '@/components/common/Header';
import { BottomNav } from '@/components/common/BottomNav';
import { formatCurrency, formatDate, orderStatusColor } from '@/lib/utils/helpers';
import Link from 'next/link';

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    fetchOrders();
  }, [filter]);

  const fetchOrders = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filter) params.set('status', filter);
    const res = await fetch(`/api/orders?${params.toString()}`);
    const data = await res.json();
    setOrders(data.orders || []);
    setLoading(false);
  };

  return (
    <div className="page">
      <Header />
      <main className="main-content">
        <div className="container" style={{ paddingTop: 24, paddingBottom: 80 }}>
          <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: 16 }}>My Orders</h1>

          <div className="tabs" style={{ marginBottom: 16 }}>
            {[
              { label: 'All', value: '' },
              { label: 'Pending', value: 'PENDING' },
              { label: 'Preparing', value: 'PREPARING' },
              { label: 'Ready', value: 'READY_FOR_PICKUP' },
              { label: 'Completed', value: 'COMPLETED' },
            ].map(tab => (
              <button key={tab.value} className={`tab ${filter === tab.value ? 'active' : ''}`} onClick={() => setFilter(tab.value)}>
                {tab.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div>Loading...</div>
          ) : orders.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📦</div>
              <div className="empty-state-title">No orders yet</div>
              <div className="empty-state-description">Your orders will appear here. Start shopping!</div>
              <Link href="/shops" className="btn btn-primary">Browse Shops</Link>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 16 }}>
              {orders.map(order => (
                <Link key={order.id} href={`/orders/${order.id}`} className="order-card">
                  <div className="order-card-header">
                    <div>
                      <div style={{ fontWeight: 600 }}>Order #{order.orderNumber}</div>
                      <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{order.shop.name} • {formatDate(order.createdAt)}</div>
                    </div>
                    <span className={`badge badge-${orderStatusColor(order.status)}`}>{order.status.replace(/_/g, ' ')}</span>
                  </div>
                  <div className="order-card-body">
                    <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                      {order.items.length} items • {order.items.slice(0,2).map((i:any)=>i.productName).join(', ')}{order.items.length>2?'...':''}
                    </div>
                  </div>
                  <div className="order-card-footer">
                    <span style={{ fontWeight: 600 }}>{formatCurrency(order.total)}</span>
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{order.paymentMethod.replace(/_/g,' ')} • {order.paymentStatus}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
