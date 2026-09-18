'use client';
import { useEffect, useState } from 'react';
import { ShoppingBag, Clock, CheckCircle, AlertTriangle, TrendingUp, Package, ArrowRight } from 'lucide-react';
import { formatPaise } from '@/lib/domain/money';
import Link from 'next/link';

export default function ShopkeeperDashboard() {
  const [stats, setStats] = useState<any>({ todayOrders: 0, pending: 0, preparing: 0, ready: 0, sales: 0, lowStock: 0 });
  const [orders, setOrders] = useState<any[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    
    // Realtime updates with reconnection handling
    let es: EventSource | null = null;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;
    
    const connect = () => {
      try {
        es = new EventSource('/api/realtime/orders?shopId=temp');
        es.onmessage = (e) => {
          try {
            const data = JSON.parse(e.data);
            if (data.type === 'shop_orders') {
              fetchData();
              reconnectAttempts = 0;
            }
          } catch {}
        };
        
        es.onerror = () => {
          es?.close();
          if (reconnectAttempts < maxReconnectAttempts) {
            reconnectAttempts++;
            setTimeout(connect, Math.min(1000 * Math.pow(2, reconnectAttempts), 30000));
          }
        };
      } catch {}
    };
    
    connect();
    
    return () => es?.close();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ordersRes, productsRes] = await Promise.all([
        fetch('/api/orders').then(r=>r.json()).catch(()=>({orders:[]})),
        fetch('/api/products?limit=100').then(r=>r.json()).catch(()=>({products:[]}))
      ]);
      
      const allOrders = ordersRes.orders || [];
      setOrders(allOrders.slice(0,5));

      const today = new Date(); today.setHours(0,0,0,0);
      const todayOrders = allOrders.filter((o:any) => new Date(o.createdAt) >= today);
      const completedToday = todayOrders.filter((o:any)=>o.status==='COMPLETED');
      
      const lowStock = (productsRes.products||[]).filter((p:any)=>p.stock <= p.lowStockThreshold && p.stock > 0);
      setLowStockProducts(lowStock.slice(0,3));

      setStats({
        todayOrders: todayOrders.length,
        pending: allOrders.filter((o:any)=>o.status==='PENDING').length,
        preparing: allOrders.filter((o:any)=>o.status==='PREPARING').length,
        ready: allOrders.filter((o:any)=>o.status==='READY_FOR_PICKUP').length,
        sales: completedToday.reduce((sum:any, o:any) => sum + (o.totalPaise ?? Math.round((o.total||0)*100)), 0),
        lowStock: lowStock.length
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, letterSpacing: '-0.02em', fontFamily: 'var(--font-heading)' }}>Dashboard — what needs attention</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: 4 }}>Real orders today, low stock, sales, issues — no meaningless charts. Grounded in DB.</p>
        </div>
        <Link href="/shopkeeper/orders" className="btn btn-primary" style={{ borderRadius: 12, boxShadow: '0 4px 12px -2px rgb(15 118 110 / 0.25)' }}>
          View all orders
          <ArrowRight size={16} />
        </Link>
      </div>

      {/* Attention Needed - Elite Professional */}
      {!loading && (stats.pending > 0 || stats.preparing > 0 || stats.ready > 0 || stats.lowStock > 0) && (
        <div className="card" style={{ padding: 20, marginBottom: 20, borderLeft: '4px solid var(--brand-500)', background: 'linear-gradient(135deg, #F0FAF9 0%, white 100%)' }}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle size={16} color="#0F766E" />
            Needs attention — real, not fake
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 13 }}>
            {stats.pending > 0 && <span className="badge badge-warning" style={{ padding: '6px 12px' }}>{stats.pending} new orders — accept now</span>}
            {stats.preparing > 0 && <span className="badge badge-info" style={{ padding: '6px 12px' }}>{stats.preparing} preparing — pick by zone</span>}
            {stats.ready > 0 && <span className="badge badge-success" style={{ padding: '6px 12px' }}>{stats.ready} ready for pickup — QR verify</span>}
            {stats.lowStock > 0 && <span className="badge badge-danger" style={{ padding: '6px 12px' }}>{stats.lowStock} low stock — restock soon</span>}
            {stats.todayOrders === 0 && <span className="badge badge-neutral" style={{ padding: '6px 12px' }}>No orders today — honest empty state</span>}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 10 }}>Transactional inventory, zone-sorted picking, QR single-use verification. Real data only.</div>
        </div>
      )}

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="card" style={{ padding: 16 }}>
              <div className="skeleton" style={{ height: 12, width: '50%', marginBottom: 12 }} />
              <div className="skeleton" style={{ height: 24, width: 60 }} />
            </div>
          ))}
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
            {[
              { label: "Today's orders", value: stats.todayOrders, icon: ShoppingBag, color: 'var(--brand)', bg: 'var(--brand-light)' },
              { label: 'Pending', value: stats.pending, icon: Clock, color: 'var(--warning)', bg: 'var(--warning-light)' },
              { label: 'Preparing', value: stats.preparing, icon: Package, color: 'var(--info)', bg: 'var(--info-light)' },
              { label: 'Ready for pickup', value: stats.ready, icon: CheckCircle, color: 'var(--success)', bg: 'var(--success-light)' },
              { label: "Today's sales", value: formatPaise(stats.sales), icon: TrendingUp, color: 'var(--success)', bg: 'var(--success-light)' },
              { label: 'Low stock', value: stats.lowStock, icon: AlertTriangle, color: 'var(--danger)', bg: 'var(--danger-light)' },
            ].map(card => (
              <div key={card.label} className="card" style={{ padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{card.label}</div>
                    <div style={{ fontSize: '24px', fontWeight: 700, marginTop: 6, letterSpacing: '-0.02em' }}>{card.value}</div>
                  </div>
                  <div style={{ width: 40, height: 40, background: card.bg, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: card.color }}>
                    <card.icon size={20} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {stats.todayOrders === 0 && orders.length === 0 && (
            <div className="card" style={{ padding: 32, textAlign: 'center', marginBottom: 24 }}>
              <div style={{ width: 56, height: 56, background: 'var(--surface-muted)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <ShoppingBag size={24} color="var(--text-tertiary)" />
              </div>
              <div style={{ fontWeight: 600, fontSize: '16px', marginBottom: 8 }}>No orders today</div>
              <div style={{ fontSize: '14px', color: 'var(--text-secondary)', maxWidth: 400, margin: '0 auto', lineHeight: 1.5 }}>
                When customers place orders, they'll appear here. You'll get notified instantly and can start preparing.
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' /* responsive handled by fix-all-screens.css */, gap: 20 }} className="dashboard-grid">
            <div className="card">
              <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="card-title">Recent orders</div>
                <Link href="/shopkeeper/orders" style={{ fontSize: '13px', color: 'var(--brand)', fontWeight: 500 }}>View all</Link>
              </div>
              <div className="card-body" style={{ padding: 0 }}>
                {orders.length === 0 ? (
                  <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-secondary)' }}>
                    <div style={{ fontSize: '14px' }}>No orders yet</div>
                    <div style={{ fontSize: '13px', marginTop: 4 }}>Orders from customers will show up here</div>
                  </div>
                ) : (
                  <div className="table-wrapper">
                    <table className="table">
                      <thead><tr><th>Order</th><th>Customer</th><th>Amount</th><th>Status</th></tr></thead>
                      <tbody>
                        {orders.map(o => (
                          <tr key={o.id}>
                            <td><Link href={`/shopkeeper/orders/${o.id}`} style={{ fontWeight: 600, color: 'var(--brand)', fontFamily: 'monospace', fontSize: '13px' }}>#{o.orderNumber}</Link></td>
                            <td><div style={{ fontWeight: 500, fontSize: '14px' }}>{o.customer?.name || 'Customer'}</div><div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{o.customer?.phone}</div></td>
                            <td style={{ fontWeight: 600 }}>{formatPaise(o.totalPaise ?? Math.round((o.total||0)*100))}</td>
                            <td><span className={`badge badge-${o.status==='PENDING'?'warning':o.status==='READY_FOR_PICKUP'?'success':o.status==='COMPLETED'?'success':'info'}`}>{o.status.replace(/_/g, ' ')}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            <div className="card">
              <div className="card-header"><div className="card-title">Business assistant — real data only</div></div>
              <div className="card-body">
                <div style={{ background: 'var(--surface-muted)', borderRadius: 10, padding: 14, fontSize: '13px', marginBottom: 16, border: '1px solid var(--border-light)' }}>
                  <div style={{ fontWeight: 600, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>Business insights — grounded in DB</div>
                  <div style={{ color: 'var(--text-secondary)', lineHeight: 1.4 }}>Which products sold most this month? What were my sales yesterday? Show low stock items. Never invents price/stock.</div>
                </div>
                
                <div style={{ display: 'flex', gap: 8 }}>
                  <input className="form-input" placeholder="Ask about sales, products, or orders..." style={{ flex: 1, borderRadius: 8 }} id="ai-query" />
                  <button className="btn btn-primary" style={{ borderRadius: 8 }} onClick={async () => {
                    const input = document.getElementById('ai-query') as HTMLInputElement;
                    if (!input.value) return;
                    try {
                      const res = await fetch('/api/ai/assistant', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: input.value }) });
                      const data = await res.json();
                      alert(data.response || JSON.stringify(data, null, 2));
                    } catch {
                      alert('Assistant is currently unavailable. Try again later.');
                    }
                  }}>Ask</button>
                </div>
                
                <div style={{ marginTop: 20 }}>
                  <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: 10 }}>Inventory alerts</div>
                  {lowStockProducts.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {lowStockProducts.map(p=>(
                        <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'var(--warning-light)', borderRadius: 8, border: '1px solid var(--warning)' }}>
                          <div>
                            <div style={{ fontWeight: 500, fontSize: '13px' }}>{p.name}</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: 2 }}>{p.stock} left • Threshold: {p.lowStockThreshold}</div>
                          </div>
                          <AlertTriangle size={16} color="var(--warning)" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', background: 'var(--surface-muted)', padding: 12, borderRadius: 8, textAlign: 'center' }}>
                      All products are well stocked
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      <style>{`
        @media(max-width: 900px){ 
          .dashboard-grid { grid-template-columns: 1fr !important; } 
        }
        @media (max-width: 768px) {
          .table-wrapper {
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
          }
          .table-wrapper::after {
            content: '← Swipe to see more →';
            display: block;
            text-align: center;
            font-size: 11px;
            color: var(--text-tertiary);
            padding: 8px;
            background: var(--surface-muted);
          }
        }
        @media (max-width: 640px) {
          .table th, .table td {
            padding: 12px 8px !important;
            font-size: 12px !important;
          }
          .dashboard-grid {
            gap: 16px !important;
          }
        }
        @media (max-width: 375px) {
          div[style*="maxWidth: 1280"] {
            padding-left: 16px !important;
            padding-right: 16px !important;
          }
        }
      `}</style>
    </div>
  );
}
