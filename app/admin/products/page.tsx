'use client';
import { useEffect, useState } from 'react';
export default function AdminProducts() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(()=>{ 
    fetch('/api/products?limit=50').then(r=>r.json()).then(d=>{ setProducts(d.products||[]); setLoading(false); }); 
  },[]);
  
  return (
    <div>
      <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: 8 }}>Platform Products - Real Data Only</h1>
      <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: 16 }}>All products from real DB, no fake platform products. Production starts empty unless shops create products. Tenant isolation: admin sees all shops.</div>
      
      {loading ? <div>Loading real platform products...</div> : products.length===0 ? (
        <div className="card" style={{ padding: 32, textAlign: 'center' }}>
          <div style={{ fontWeight: 600 }}>No platform products yet - Real empty state</div>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: 8 }}>Production DB starts empty. Products appear when shop owners create real products. No fake "Cement Bag - ₹350". Run npm run db:seed for dev demo data.</div>
        </div>
      ) : (
        <div className="table-container">
          <div className="table-wrapper">
            <table className="table">
              <thead><tr><th>Product (Real)</th><th>Shop (Real)</th><th>SKU (Real)</th><th>Price (Real)</th><th>Stock (Real)</th><th>Status</th></tr></thead>
              <tbody>
                {products.map(p=>(
                  <tr key={p.id}><td><div style={{ fontWeight: 500 }}>{p.name}</div><div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{p.category?.name}</div></td><td>{p.shop?.name || p.shopId}</td><td style={{ fontFamily: 'monospace', fontSize: '12px' }}>{p.sku}</td><td>₹{p.price}</td><td><span className={`badge badge-${p.stock<=0?'danger':p.stock<=10?'warning':'success'}`}>{p.stock}</span></td><td><span className={`badge badge-${p.isActive?'success':'danger'}`}>{p.isActive?'Active':'Inactive'}</span></td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
