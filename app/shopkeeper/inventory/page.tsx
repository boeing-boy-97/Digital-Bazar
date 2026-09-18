'use client';
import { useEffect, useState } from 'react';
import { formatPaise } from '@/lib/domain/money';
import { calculateAvailable, isLowStock, forecastStockout } from '@/lib/domain/inventory';
import { Package, AlertTriangle, TrendingDown, DollarSign, Search, CheckCircle } from 'lucide-react';
import { BulkStockUpdate } from '@/components/shop/bulk-stock-update';
import { CatalogHealthWarnings } from '@/components/shop/catalog-health';

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
          <h1 style={{ fontSize: '24px', fontWeight: 700, letterSpacing: '-0.02em', fontFamily: 'var(--font-heading)' }}>Inventory • Blinkit-inspired operational workflow</h1>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: 4 }}>Track stock levels and manage inventory • Inbound putaway outbound picking packing handover inventory hygiene per Blinkit partners • Real data only</p>
          <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, background: '#F0FAF9', border: '1px solid #CCFBF1', padding: '4px 8px', borderRadius: 100, color: '#0F766E', fontWeight: 600 }}>FIFO method</span>
            <span style={{ fontSize: 11, background: '#FFFBEB', border: '1px solid #FDE68A', padding: '4px 8px', borderRadius: 100, color: '#D97706', fontWeight: 600 }}>Regular audits</span>
            <span style={{ fontSize: 11, background: '#ECFDF5', border: '1px solid #A7F3D0', padding: '4px 8px', borderRadius: 100, color: '#059669', fontWeight: 600 }}>Hygiene standards</span>
          </div>
        </div>
        <div style={{ position: 'relative', minWidth: 240 }}>
          <Search size={16} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
          <input className="form-input" placeholder="Search products or SKU" value={search} onChange={e=>setSearch(e.target.value)} style={{ paddingLeft: 32, borderRadius: 8, width: '100%' }} />
        </div>
      </div>
      
      {/* Inventory Integrity - Blinkit-inspired */}
      <div className="blinkit-role-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 20 }}>
        <div className="blinkit-role-card" style={{ padding: 16 }}>
          <div className="blinkit-role-icon" style={{ width: 36, height: 36, marginBottom: 12 }}><Package size={16} /></div>
          <div style={{ fontSize: 13, fontWeight: 600 }}>Inbound: Inwarding & Putaway</div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>Receive inventory, putaway to storage zones, FIFO</div>
        </div>
        <div className="blinkit-role-card" style={{ padding: 16 }}>
          <div className="blinkit-role-icon" style={{ width: 36, height: 36, marginBottom: 12 }}><TrendingDown size={16} /></div>
          <div style={{ fontSize: 13, fontWeight: 600 }}>Outbound: Picking & Packing</div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>Zone picking, aisle barcode scan, packing, handover</div>
        </div>
        <div className="blinkit-role-card" style={{ padding: 16 }}>
          <div className="blinkit-role-icon" style={{ width: 36, height: 36, marginBottom: 12 }}><AlertTriangle size={16} /></div>
          <div style={{ fontSize: 13, fontWeight: 600 }}>Inventory Hygiene</div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>Accurate stock levels, regular audits, hygiene standards</div>
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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' /* responsive handled by fix-all-screens.css */, gap: 16, marginBottom: 20 }}>
        <BulkStockUpdate shopId={products[0]?.shopId || 'temp'} onComplete={fetchData} />
        <CatalogHealthWarnings products={products.map((p:any)=>({ id: p.id, name: p.name, sku: p.sku, stock: p.stock, pricePaise: p.pricePaise ?? 0, images: p.images || [], productStatus: p.productStatus || 'ACTIVE', masterProductId: p.masterProductId, barcode: p.barcode, categoryId: p.categoryId, updatedAt: p.updatedAt || new Date().toISOString() }))} />
      </div>

      <div style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 16, marginBottom: 20, background: 'white' }}>
        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8 }}>Stocktake - Physical verification per point 53</div>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12 }}>Expected vs counted difference with reason - real inventory hygiene from Blinkit operational workflow</div>
        <StocktakeForm shopId={products[0]?.shopId || ''} onComplete={fetchData} />
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
        <>
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

          {/* Mobile Cards */}
          <div className="table-mobile-cards" style={{ display: 'none' }}>
            {filtered.map(p => {
              const forecast = forecastLowStock(p);
              return (
                <div key={`mobile-${p.id}`} className="mobile-card">
                  <div className="mobile-card-header">
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: 2 }}>{p.sku} • {p.unit}</div>
                    </div>
                    <span className={`badge badge-${p.stock<=0?'danger':p.stock<=p.lowStockThreshold?'warning':'success'}`}>{p.stock} {p.unit}</span>
                  </div>
                  <div className="mobile-card-body">
                    <div className="mobile-card-row">
                      <span className="mobile-card-label">Reserved</span>
                      <span className="mobile-card-value">{p.reservedStock || 0} {p.unit}</span>
                    </div>
                    <div className="mobile-card-row">
                      <span className="mobile-card-label">Threshold</span>
                      <span className="mobile-card-value">{p.lowStockThreshold}</span>
                    </div>
                    <div className="mobile-card-row">
                      <span className="mobile-card-label">Forecast</span>
                      <span className="mobile-card-value">
                        {p.stock<=0 ? 'Out of stock' : forecast.daysLeft === null ? 'Insufficient data' : forecast.daysLeft < 7 ? `~${forecast.daysLeft} days left` : `${forecast.daysLeft} days`}
                        {forecast.dailyAvg ? ` • ~${forecast.dailyAvg}/day` : ''}
                      </span>
                    </div>
                    <div className="mobile-card-row">
                      <span className="mobile-card-label">Value</span>
                      <span className="mobile-card-value" style={{ fontWeight: 700 }}>{formatPaise((p.pricePaise ?? Math.round((p.price||0)*100)) * p.stock)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
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

function StocktakeForm({ shopId, onComplete }: { shopId: string; onComplete: () => void }) {
  const [productId, setProductId] = useState('');
  const [countedQty, setCountedQty] = useState(0);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const submit = async () => {
    if (!productId) { setResult('Select product'); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/shops/${shopId}/stocktake`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, countedQty, reason })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Failed');
      setResult(`Stocktake recorded: expected ${data.stocktake?.expectedQty} counted ${data.stocktake?.countedQty} diff ${data.stocktake?.difference} - ${data.message}`);
      onComplete();
    } catch (e:any) {
      setResult(`Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-end' }}>
      <div>
        <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>Product ID</div>
        <input value={productId} onChange={e=>setProductId(e.target.value)} placeholder="Product ID" style={{ border: '1px solid var(--border)', borderRadius: 8, padding: '6px 10px', fontSize: 12, width: 160 }} />
      </div>
      <div>
        <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>Counted qty</div>
        <input type="number" value={countedQty} onChange={e=>setCountedQty(parseInt(e.target.value)||0)} style={{ border: '1px solid var(--border)', borderRadius: 8, padding: '6px 10px', fontSize: 12, width: 80 }} />
      </div>
      <div style={{ flex: 1, minWidth: 120 }}>
        <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>Reason for difference</div>
        <input value={reason} onChange={e=>setReason(e.target.value)} placeholder="Damaged / miscount / theft..." style={{ border: '1px solid var(--border)', borderRadius: 8, padding: '6px 10px', fontSize: 12, width: '100%' }} />
      </div>
      <button onClick={submit} disabled={loading || !shopId} style={{ background: 'black', color: 'white', borderRadius: 8, padding: '8px 14px', fontSize: 12, fontWeight: 600 }}>Record stocktake</button>
      {result && <div style={{ width: '100%', fontSize: 11, padding: 8, background: 'var(--surface-muted)', borderRadius: 8, marginTop: 8 }}>{result}</div>}
    </div>
  );
}
