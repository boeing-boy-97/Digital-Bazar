'use client';
import { useEffect, useState } from 'react';
import { Package, Search } from 'lucide-react';

export default function AdminProducts() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  useEffect(()=>{ 
    fetch('/api/products?limit=50').then(r=>r.json()).then(d=>{ setProducts(d.products||[]); setLoading(false); }); 
  },[]);
  
  const filtered = products.filter(p => 
    !search || p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.sku?.toLowerCase().includes(search.toLowerCase()) ||
    p.shop?.name.toLowerCase().includes(search.toLowerCase())
  );
  
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, letterSpacing: '-0.02em' }}>Products</h1>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: 4 }}>Manage products across all shops</p>
        </div>
        <div style={{ position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
          <input className="form-input" placeholder="Search products, SKU, or shop" value={search} onChange={e=>setSearch(e.target.value)} style={{ paddingLeft: 32, borderRadius: 8, minWidth: 260 }} />
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
      ) : filtered.length===0 ? (
        <div className="card" style={{ padding: 40, textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, background: 'var(--surface-muted)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Package size={24} color="var(--text-tertiary)" />
          </div>
          <div style={{ fontWeight: 600, fontSize: '16px', marginBottom: 8 }}>{search ? `No products found for "${search}"` : 'No products yet'}</div>
          <div style={{ fontSize: '14px', color: 'var(--text-secondary)', maxWidth: 400, margin: '0 auto' }}>
            {search ? 'Try a different search term or clear your search.' : 'Products will appear here when shop owners add them to their inventory.'}
          </div>
        </div>
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div className="table-wrapper">
            <table className="table">
              <thead><tr><th>Product</th><th>Shop</th><th>SKU</th><th>Price</th><th>Stock</th><th>Status</th></tr></thead>
              <tbody>
                {filtered.map(p=>(
                  <tr key={p.id}>
                    <td><div style={{ fontWeight: 500, fontSize: '14px' }}>{p.name}</div><div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{p.category?.name || p.category}</div></td>
                    <td><div style={{ fontSize: '13px' }}>{p.shop?.name || p.shopId}</div></td>
                    <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>{p.sku}</td>
                    <td style={{ fontWeight: 600 }}>₹{p.price}</td>
                    <td><span className={`badge badge-${p.stock<=0?'danger':p.stock<=10?'warning':'success'}`}>{p.stock} {p.unit}</span></td>
                    <td><span className={`badge badge-${p.isActive?'success':'danger'}`}>{p.isActive?'Active':'Inactive'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ padding: 12, borderTop: '1px solid var(--border)', fontSize: '12px', color: 'var(--text-secondary)', textAlign: 'center' }}>
            Showing {filtered.length} of {products.length} products
          </div>
        </div>
      )}
    </div>
  );
}
