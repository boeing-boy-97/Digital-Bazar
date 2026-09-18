'use client';
import { useEffect, useState } from 'react';
import { formatPaise } from '@/lib/domain/money';
import { calculateAvailable, isLowStock, forecastStockout } from '@/lib/domain/inventory';
import { Package, AlertTriangle, TrendingDown, DollarSign, Search } from 'lucide-react';

export default function InventoryPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [prodRes, ordersRes] = await Promise.all([
        fetch('/api/products?limit=100').then(r=>r.json()).catch(()=>({products:[]})),
        fetch('/api/orders').then(r=>r.json()).catch(()=>({orders:[]}))
      ]);
      setProducts(prodRes.products || []);
      setOrders(ordersRes.orders || []);
    } finally {
      setLoading(false);
    }
  };

  const filtered = products.filter(p => {
    const matchesSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.sku?.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;
    if (filter === 'low') return p.stock <= p.lowStockThreshold && p.stock > 0;
    if (filter === 'out') return p.stock <= 0;
    if (filter === 'over') return p.stock > 100;
    return true;
  });

  const forecastLowStock = (p: any) => {
    const completedOrders = orders.filter(o=>o.status==='COMPLETED');
    const thirtyDaysAgo = Date.now() - 30*24*60*60*1000;
    const recentOrders = completedOrders.filter((o:any) => new Date(o.createdAt).getTime() > thirtyDaysAgo);
    const totalSold = recentOrders.reduce((sum:number, o:any) => {
      const item = o.items?.find((i:any) => i.productId === p.id);
      return sum + (item?.quantity || 0);
    }, 0);
    const dailyVelocity = recentOrders.length > 0 ? totalSold / 30 : 0;
    const available = calculateAvailable(p.stock, p.reservedStock || 0);
    const forecast = forecastStockout(available, dailyVelocity, 0);
    return {
      daysLeft: forecast.days,
      message: forecast.message,
      confidence: forecast.confidence,
      dailyAvg: dailyVelocity > 0 ? dailyVelocity.toFixed(1) : null
    };
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, letterSpacing: '-0.02em' }}>Inventory</h1>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: 4 }}>Track stock levels and manage inventory</p>
        </div>
        <div style={{ position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
          <input className="form-input" placeholder="Search products or SKU" value={search} onChange={e=>setSearch(e.target.value)} style={{ paddingLeft: 32, borderRadius: 8, minWidth: 240 }} />
        </div>
      </div>
      
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {[
          { label: 'All', value: 'all' },
          { label: 'Low stock', value: 'low' },
          { label: 'Out of stock', value: 'out' },
          { label: 'Overstock', value: 'over' },
        ].map(t => (
          <button key={t.value} className={`btn ${filter===t.value?'btn-primary':'btn-secondary'} btn-sm`} style={{ borderRadius: 20 }} onClick={()=>setFilter(t.value)}>{t.label}</button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 20 }}>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Package size={12} /> Total products
              </div>
              <div style={{ fontSize: '22px', fontWeight: 700, marginTop: 6 }}>{products.length}</div>
            </div>
            <div style={{ width: 36, height: 36, background: 'var(--brand-light)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand)' }}>
              <Package size={18} />
            </div>
          </div>
        </div>
        
        <div className="card" style={{ padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <AlertTriangle size={12} /> Low stock
              </div>
              <div style={{ fontSize: '22px', fontWeight: 700, marginTop: 6, color: 'var(--warning)' }}>{products.filter(p=>p.stock<=p.lowStockThreshold && p.stock>0).length}</div>
            </div>
            <div style={{ width: 36, height: 36, background: 'var(--warning-light)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--warning)' }}>
              <AlertTriangle size={18} />
            </div>
          </div>
        </div>
        
        <div className="card" style={{ padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <TrendingDown size={12} /> Out of stock
              </div>
              <div style={{ fontSize: '22px', fontWeight: 700, marginTop: 6, color: 'var(--danger)' }}>{products.filter(p=>p.stock<=0).length}</div>
            </div>
            <div style={{ width: 36, height: 36, background: 'var(--danger-light)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--danger)' }}>
              <TrendingDown size={18} />
            </div>
          </div>
        </div>
        
        <div className="card" style={{ padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <DollarSign size={12} /> Inventory value
              </div>
              <div style={{ fontSize: '22px', fontWeight: 700, marginTop: 6 }}>{formatPaise(products.reduce((sum,p)=>sum+(p.pricePaise ?? Math.round((p.price||0)*100)) * p.stock,0))}</div>
            </div>
            <div style={{ width: 36, height: 36, background: 'var(--success-light)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--success)' }}>
              <DollarSign size={18} />
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="card" style={{ padding: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1,2,3].map(i => (
              <div key={i} style={{ display: 'flex', gap: 12 }}>
                <div className="skeleton" style={{ width: 40, height: 40, borderRadius: 8 }} />
                <div style={{ flex: 1 }}>
                  <div className="skeleton" style={{ height: 14, width: '40%' }} />
                  <div className="skeleton" style={{ height: 12, width: '20%', marginTop: 8 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : products.length===0 ? (
        <div className="card" style={{ padding: 40, textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, background: 'var(--surface-muted)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Package size={24} color="var(--text-tertiary)" />
          </div>
          <div style={{ fontWeight: 600, fontSize: '16px', marginBottom: 8 }}>No products yet</div>
          <div style={{ fontSize: '14px', color: 'var(--text-secondary)', maxWidth: 400, margin: '0 auto', lineHeight: 1.5 }}>
            Add products to start managing your inventory. You can add them manually or import via CSV.
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ padding: 32, textAlign: 'center' }}>
          <div style={{ fontWeight: 500 }}>No products match your filters</div>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: 4 }}>Try adjusting your search or filter criteria</div>
        </div>
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div className="table-wrapper">
            <table className="table">
              <thead><tr><th>Product</th><th>Available</th><th>Reserved</th><th>Threshold</th><th>Forecast</th><th>Value</th></tr></thead>
              <tbody>
                {filtered.map(p => {
                  const forecast = forecastLowStock(p);
                  return (
                    <tr key={p.id}>
                      <td>
                        <div style={{ fontWeight: 500, fontSize: '14px' }}>{p.name}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{p.sku} • {p.unit}</div>
                      </td>
                      <td><span className={`badge badge-${p.stock<=0?'danger':p.stock<=p.lowStockThreshold?'warning':'success'}`}>{p.stock} {p.unit}</span></td>
                      <td><span style={{ fontSize: '13px' }}>{p.reservedStock || 0}</span></td>
                      <td><span style={{ fontSize: '13px' }}>{p.lowStockThreshold}</span></td>
                      <td>
                        {p.stock<=0 ? <span className="badge badge-danger">Out of stock</span> : 
                         forecast.daysLeft === null ? <span className="badge badge-neutral">Insufficient data</span> :
                         forecast.daysLeft < 7 ? <span className="badge badge-warning">~{forecast.daysLeft} days left</span> : 
                         <span className="badge badge-success">{forecast.daysLeft} days</span>}
                        {forecast.dailyAvg && <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: 2 }}>~{forecast.dailyAvg}/day</div>}
                      </td>
                      <td style={{ fontWeight: 600 }}>{formatPaise((p.pricePaise ?? Math.round((p.price||0)*100)) * p.stock)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
