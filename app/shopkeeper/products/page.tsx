'use client';
import { useEffect, useState } from 'react';
import { formatCurrency } from '@/lib/utils/helpers';
import { Plus } from 'lucide-react';

export default function ShopkeeperProducts() {
  const [products, setProducts] = useState<any[]>([]);
  const [zones, setZones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', sku: '', price: '', stock: '', unit: 'piece', category: '', brand: '' });

  useEffect(() => { fetchProducts(); }, []);

  const fetchProducts = async () => {
    setLoading(true);
    const res = await fetch('/api/products?limit=100');
    const data = await res.json();
    setProducts(data.products || []);
    // Fetch shop zones
    const shopRes = await fetch('/api/shops');
    const shopData = await shopRes.json();
    if (shopData.shops?.[0]) {
      const detail = await fetch(`/api/shops/${shopData.shops[0].id}`).then(r=>r.json());
      setZones(detail.shop?.storageZones || []);
    }
    setLoading(false);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const shopRes = await fetch('/api/shops');
    const shopData = await shopRes.json();
    const shopId = shopData.shops?.[0]?.id;
    if (!shopId) { alert('Create shop first'); return; }

    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        shopId,
        name: form.name,
        sku: form.sku || `SKU-${Date.now()}`,
        price: parseFloat(form.price),
        stock: parseInt(form.stock) || 0,
        unit: form.unit,
        brand: form.brand
      })
    });
    if (res.ok) { setShowAdd(false); fetchProducts(); setForm({ name: '', sku: '', price: '', stock: '', unit: 'piece', category: '', brand: '' }); }
    else { const d=await res.json(); alert(d.error); }
  };

  const handleAICategorize = async () => {
    if (!form.name) return alert('Enter product name first');
    const res = await fetch('/api/ai/categorize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productName: form.name })
    });
    const data = await res.json();
    alert(`AI Suggestion:\nCategory: ${data.categorization?.category}\nSub: ${data.categorization?.subcategory}\nDesc: ${data.description?.slice(0,100)}...`);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700 }}>Products</h1>
        <button className="btn btn-primary" onClick={()=>setShowAdd(true)}><Plus size={16} /> Add Product</button>
      </div>

      {showAdd && (
        <div className="modal-overlay" onClick={()=>setShowAdd(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-header"><div style={{ fontWeight: 600 }}>Add Product - AI Assisted</div><button className="btn btn-ghost btn-sm" onClick={()=>setShowAdd(false)}>✕</button></div>
            <form onSubmit={handleAdd} className="modal-body stack stack-4">
              <div className="form-group"><label className="form-label">Product Name *</label><input className="form-input" value={form.name} onChange={e=>setForm({...form, name: e.target.value})} required placeholder="e.g. Astral CPVC Elbow 1 inch" /><button type="button" className="btn btn-secondary btn-sm" style={{ marginTop: 8 }} onClick={handleAICategorize}>🤖 AI Categorize</button></div>
              <div className="form-row"><div className="form-group"><label className="form-label">SKU</label><input className="form-input" value={form.sku} onChange={e=>setForm({...form, sku: e.target.value})} placeholder="Auto if empty" /></div><div className="form-group"><label className="form-label">Brand</label><input className="form-input" value={form.brand} onChange={e=>setForm({...form, brand: e.target.value})} placeholder="Astral, Finolex..." /></div></div>
              <div className="form-row"><div className="form-group"><label className="form-label">Price (₹) *</label><input type="number" step="0.01" className="form-input" value={form.price} onChange={e=>setForm({...form, price: e.target.value})} required /></div><div className="form-group"><label className="form-label">Stock *</label><input type="number" className="form-input" value={form.stock} onChange={e=>setForm({...form, stock: e.target.value})} required /></div></div>
              <div className="form-group"><label className="form-label">Unit</label><select className="form-select" value={form.unit} onChange={e=>setForm({...form, unit: e.target.value})}><option value="piece">Piece</option><option value="bag">Bag</option><option value="kg">Kg</option><option value="meter">Meter</option><option value="liter">Liter</option><option value="set">Set</option><option value="bucket">Bucket</option></select></div>
              <div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={()=>setShowAdd(false)}>Cancel</button><button type="submit" className="btn btn-primary">Add Product</button></div>
            </form>
          </div>
        </div>
      )}

      <div className="table-container">
        <div className="table-wrapper">
          <table className="table">
            <thead><tr><th>Product</th><th>SKU</th><th>Price</th><th>Stock</th><th>Zone</th><th>Status</th></tr></thead>
            <tbody>
              {products.map(p=>(
                <tr key={p.id}>
                  <td><div style={{ fontWeight: 500 }}>{p.name}</div><div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{p.brand} • {p.unit}</div></td>
                  <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>{p.sku}</td>
                  <td>{formatCurrency(p.price)}</td>
                  <td><span className={`badge badge-${p.stock<=0?'danger':p.stock<=p.lowStockThreshold?'warning':'success'}`}>{p.stock} {p.stock<=p.lowStockThreshold?'• Low':''}</span></td>
                  <td>{p.storageZone?.code || '-'}</td>
                  <td><span className={`badge ${p.isActive?'badge-success':'badge-danger'}`}>{p.isActive?'Active':'Inactive'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
