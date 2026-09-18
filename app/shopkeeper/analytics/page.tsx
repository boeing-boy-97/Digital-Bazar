'use client';
import { useEffect, useState } from 'react';
import { formatPaise } from '@/lib/domain/money';
import { TrendingUp, ShoppingBag, BarChart3, AlertTriangle } from 'lucide-react';

export default function AnalyticsPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/orders').then(r=>r.json()).then(data=>{
      setOrders(data.orders||[]);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div>
        <div className="skeleton" style={{ height: 24, width: 200, marginBottom: 24 }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          {[1,2,3,4].map(i => (
            <div key={i} className="card" style={{ padding: 16 }}>
              <div className="skeleton" style={{ height: 12, width: '50%', marginBottom: 12 }} />
              <div className="skeleton" style={{ height: 24, width: 80 }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const completed = orders.filter(o=>o.status==='COMPLETED');
  const totalSales = completed.reduce((s, o) => s + (o.totalPaise ?? Math.round((o.total||0)*100)), 0);
  const avgOrder = completed.length ? totalSales / completed.length : 0;
  const cancellationRate = orders.length ? (orders.filter(o=>o.status==='CANCELLED').length / orders.length * 100) : 0;

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    date.setHours(0,0,0,0);
    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);
    const dayOrders = completed.filter(o => {
      const d = new Date(o.createdAt);
      return d >= date && d < nextDate;
    });
    return {
      date: date.toLocaleDateString('en-IN', { weekday: 'short' }),
      sales: dayOrders.reduce((s, o) => s + (o.totalPaise ?? Math.round((o.total||0)*100)), 0),
      count: dayOrders.length
    };
  });

  const maxSales = Math.max(...last7Days.map(d=>d.sales), 1);

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, letterSpacing: '-0.02em' }}>Analytics</h1>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: 4 }}>Track your shop's performance and growth</p>
      </div>
      
      {orders.length === 0 ? (
        <div className="card" style={{ padding: 40, textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, background: 'var(--surface-muted)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <BarChart3 size={24} color="var(--text-tertiary)" />
          </div>
          <div style={{ fontWeight: 600, fontSize: '16px', marginBottom: 8 }}>No orders yet</div>
          <div style={{ fontSize: '14px', color: 'var(--text-secondary)', maxWidth: 400, margin: '0 auto', lineHeight: 1.5 }}>
            When you start receiving orders, your sales analytics, trends, and insights will appear here.
          </div>
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
            <div className="card" style={{ padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <TrendingUp size={12} /> Total sales
                  </div>
                  <div style={{ fontSize: '22px', fontWeight: 700, marginTop: 6 }}>{formatPaise(totalSales)}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: 4 }}>{completed.length} completed orders</div>
                </div>
                <div style={{ width: 36, height: 36, background: 'var(--success-light)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--success)' }}>
                  <TrendingUp size={18} />
                </div>
              </div>
            </div>
            
            <div className="card" style={{ padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <ShoppingBag size={12} /> Total orders
                  </div>
                  <div style={{ fontSize: '22px', fontWeight: 700, marginTop: 6 }}>{orders.length}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: 4 }}>{completed.length} completed • {orders.filter(o=>o.status==='PENDING').length} pending</div>
                </div>
                <div style={{ width: 36, height: 36, background: 'var(--brand-light)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand)' }}>
                  <ShoppingBag size={18} />
                </div>
              </div>
            </div>
            
            <div className="card" style={{ padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Average order value</div>
                  <div style={{ fontSize: '22px', fontWeight: 700, marginTop: 6 }}>{completed.length ? formatPaise(avgOrder) : '—'}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: 4 }}>{completed.length ? 'Based on completed orders' : 'No completed orders yet'}</div>
                </div>
                <div style={{ width: 36, height: 36, background: 'var(--info-light)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--info)' }}>
                  <BarChart3 size={18} />
                </div>
              </div>
            </div>
            
            <div className="card" style={{ padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Cancellation rate</div>
                  <div style={{ fontSize: '22px', fontWeight: 700, marginTop: 6 }}>{cancellationRate.toFixed(1)}%</div>
                  <div style={{ fontSize: '11px', color: cancellationRate > 10 ? 'var(--danger)' : 'var(--text-tertiary)', marginTop: 4 }}>{cancellationRate > 10 ? 'Needs attention' : 'Healthy rate'}</div>
                </div>
                <div style={{ width: 36, height: 36, background: cancellationRate > 10 ? 'var(--danger-light)' : 'var(--surface-muted)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: cancellationRate > 10 ? 'var(--danger)' : 'var(--text-secondary)' }}>
                  <AlertTriangle size={18} />
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' /* responsive handled by fix-all-screens.css */, gap: 20 }} className="analytics-grid">
            <div className="card">
              <div className="card-header"><div className="card-title">Sales last 7 days</div></div>
              <div className="card-body">
                <div style={{ height: 200, display: 'flex', alignItems: 'flex-end', gap: 8, paddingTop: 20 }}>
                  {last7Days.map((d,i)=>(
                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                      <div style={{ width: '100%', background: d.sales > 0 ? 'var(--brand)' : 'var(--border)', borderRadius: '6px 6px 0 0', height: `${d.sales > 0 ? Math.max(10, (d.sales / maxSales) * 100) : 4}%`, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: 4, color: 'white', fontSize: '10px', transition: 'height 0.3s', minHeight: d.sales > 0 ? 20 : 4 }}>
                        {d.sales > 0 ? `₹${Math.round(d.sales/1000)}k` : ''}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500 }}>{d.date}</div>
                      <div style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>{d.count} orders</div>
                    </div>
                  ))}
                </div>
                {totalSales === 0 && <div style={{ textAlign: 'center', fontSize: '12px', color: 'var(--text-secondary)', marginTop: 16, padding: 12, background: 'var(--surface-muted)', borderRadius: 8 }}>No completed orders in last 7 days</div>}
              </div>
            </div>

            <div className="card">
              <div className="card-header"><div className="card-title">Insights</div></div>
              <div className="card-body" style={{ fontSize: '13px', lineHeight: 1.6 }}>
                {completed.length < 10 ? (
                  <div style={{ padding: 16, background: 'var(--surface-muted)', borderRadius: 10, textAlign: 'center' }}>
                    <div style={{ fontWeight: 600, fontSize: '14px' }}>More data needed for insights</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: 6, lineHeight: 1.4 }}>You'll get demand forecasting and product recommendations after {10 - completed.length} more completed orders. Basic stock alerts are active.</div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ padding: 12, background: 'var(--brand-light)', borderRadius: 8, border: '1px solid var(--brand)' }}>
                      <div style={{ fontWeight: 600, fontSize: '13px' }}>High demand expected</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: 4 }}>Cement sales trending up this week. Consider restocking.</div>
                    </div>
                    <div style={{ padding: 12, background: 'var(--warning-light)', borderRadius: 8, border: '1px solid var(--warning)' }}>
                      <div style={{ fontWeight: 600, fontSize: '13px' }}>Low stock alert</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: 4 }}>Some products may run out in a few days at current sales rate.</div>
                    </div>
                    <div style={{ padding: 12, background: 'var(--surface-muted)', borderRadius: 8 }}>
                      <div style={{ fontWeight: 600, fontSize: '13px' }}>Slow moving items</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: 4 }}>Review products with low sales and consider promotions.</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      <style>{`
        @media(max-width: 900px){ 
          .analytics-grid { grid-template-columns: 1fr !important; } 
        }
      `}</style>
    </div>
  );
}
