'use client';
import { useEffect, useState } from 'react';
import { formatPaise } from '@/lib/domain/money';
import { Plus, Search, Package, Sparkles, MapPin, Tag } from 'lucide-react';

export default function ShopkeeperProducts() {
  const [products, setProducts] = useState<any[]>([]);
  const [zones, setZones] = useState<any[]>([]);
  const [shopId, setShopId] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [addMode, setAddMode] = useState<'search' | 'manual'>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [masterResults, setMasterResults] = useState<any[]>([]);
  const [masterLoading, setMasterLoading] = useState(false);
  const [selectedMaster, setSelectedMaster] = useState<any>(null);
  const [selectedVariant, setSelectedVariant] = useState<string>('');
  const [form, setForm] = useState({ name: '', sku: '', price: '', stock: '', unit: 'piece', brand: '', compareAtPrice: '', taxRate: '', hsnCode: '', lowStockThreshold: '10', storageZoneId: '', minOrderQty: '1' });

  useEffect(() => { fetchProducts(); }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/products?limit=100');
      const data = await res.json();
      setProducts(data.products || []);
      
      const shopRes = await fetch('/api/shops');
      const shopData = await shopRes.json();
      if (shopData.shops?.[0]) {
        setShopId(shopData.shops[0].id);
        const detail = await fetch(`/api/shops/${shopData.shops[0].id}`).then(r=>r.json());
        setZones(detail.shop?.storageZones || []);
      }
    } finally {
      setLoading(false);
    }
  };

  const searchMasterCatalog = async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setMasterResults([]);
      return;
    }
    
    setMasterLoading(true);
    try {
      const res = await fetch(`/api/master-products?search=${encodeURIComponent(query)}&limit=20`);
      const data = await res.json();
      setMasterResults(data.products || []);
    } catch {
      setMasterResults([]);
    } finally {
      setMasterLoading(false);
    }
  };

  const handleSelectMaster = (master: any) => {
    setSelectedMaster(master);
    setForm({
      name: master.name,
      sku: '',
      price: '',
      stock: '',
      unit: 'piece',
      brand: master.brand || '',
      compareAtPrice: '',
      taxRate: '0',
      hsnCode: '',
      lowStockThreshold: '10',
      storageZoneId: zones[0]?.id || '',
      minOrderQty: '1'
    });
    setSelectedVariant('');
  };

  const handleAddFromMaster = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopId) { alert('Create shop first'); return; }
    if (!selectedMaster) { alert('Select a product from catalog'); return; }

    try {
      const res = await fetch(`/api/shops/${shopId}/products/from-master`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          masterProductId: selectedMaster.id,
          masterVariantId: selectedVariant || null,
          price: parseFloat(form.price),
          compareAtPrice: form.compareAtPrice ? parseFloat(form.compareAtPrice) : null,
          stock: parseInt(form.stock) || 0,
          sku: form.sku || undefined,
          unit: form.unit,
          taxRate: form.taxRate ? parseFloat(form.taxRate) : 0,
          hsnCode: form.hsnCode || null,
          lowStockThreshold: parseInt(form.lowStockThreshold) || 10,
          minOrderQty: parseInt(form.minOrderQty) || 1,
          storageZoneId: form.storageZoneId || null,
          isActive: true
        })
      });

      const data = await res.json();
      if (res.ok) {
        setShowAdd(false);
        setSelectedMaster(null);
        setSearchQuery('');
        setMasterResults([]);
        setForm({ name: '', sku: '', price: '', stock: '', unit: 'piece', brand: '', compareAtPrice: '', taxRate: '', hsnCode: '', lowStockThreshold: '10', storageZoneId: '', minOrderQty: '1' });
        fetchProducts();
      } else {
        alert(data.error || 'Failed to add product');
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleManualAdd = async (e: React.FormEvent) => {
    e.preventDefault();
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
        brand: form.brand,
        compareAtPrice: form.compareAtPrice ? parseFloat(form.compareAtPrice) : undefined,
        taxRate: form.taxRate ? parseFloat(form.taxRate) : 0,
        hsnCode: form.hsnCode || undefined,
        lowStockThreshold: parseInt(form.lowStockThreshold) || 10,
        minOrderQty: parseInt(form.minOrderQty) || 1,
        storageZoneId: form.storageZoneId || undefined
      })
    });
    if (res.ok) { 
      setShowAdd(false); 
      fetchProducts(); 
      setForm({ name: '', sku: '', price: '', stock: '', unit: 'piece', brand: '', compareAtPrice: '', taxRate: '', hsnCode: '', lowStockThreshold: '10', storageZoneId: '', minOrderQty: '1' }); 
    }
    else { const d=await res.json(); alert(d.error); }
  };

  const handleAICategorize = async () => {
    if (!form.name) return alert('Enter product name first');
    try {
      const res = await fetch('/api/ai/categorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productName: form.name })
      });
      const data = await res.json();
      if (data.categorization) {
        alert(`AI Suggestion:\nCategory: ${data.categorization.category}\nDescription: ${data.description?.slice(0,150)}...`);
      }
    } catch {
      alert('AI categorization unavailable');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, letterSpacing: '-0.02em' }}>Products</h1>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: 4 }}>{products.length} products in your shop</p>
        </div>
        <button className="btn btn-primary" onClick={()=>{ setShowAdd(true); setAddMode('search'); }} style={{ borderRadius: 8 }}>
          <Plus size={16} /> Add product
        </button>
      </div>

      {showAdd && (
        <div className="modal-overlay" onClick={()=>setShowAdd(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 16 }}>
          <div className="modal" onClick={e=>e.stopPropagation()} style={{ background: 'white', borderRadius: 12, width: '100%', maxWidth: 640, maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: 20, borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '16px' }}>Add product to your shop</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: 2 }}>Search master catalog or add manually - supports all categories from medical to hardware</div>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={()=>setShowAdd(false)} style={{ width: 32, height: 32, borderRadius: 8 }}>✕</button>
            </div>
            
            <div style={{ padding: '0 20px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 8 }}>
              <button className={`btn ${addMode==='search'?'btn-primary':'btn-ghost'} btn-sm`} style={{ borderRadius: 0, borderBottom: addMode==='search'?'2px solid var(--brand)':'2px solid transparent' }} onClick={()=>setAddMode('search')}>
                <Search size={14} />
                Search catalog
              </button>
              <button className={`btn ${addMode==='manual'?'btn-primary':'btn-ghost'} btn-sm`} style={{ borderRadius: 0, borderBottom: addMode==='manual'?'2px solid var(--brand)':'2px solid transparent' }} onClick={()=>setAddMode('manual')}>
                <Package size={14} />
                Add manually
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
              {addMode === 'search' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <div style={{ position: 'relative' }}>
                      <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                      <input
                        className="form-input"
                        placeholder="Search products: Redmi Note 15, cement, PVC pipe, medicine, etc. - ALL categories"
                        value={searchQuery}
                        onChange={e => { setSearchQuery(e.target.value); searchMasterCatalog(e.target.value); }}
                        style={{ paddingLeft: 36, borderRadius: 8 }}
                        autoFocus
                      />
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: 6 }}>Search across all product types: electronics, building material, plumbing, paint, electrical, medical, grocery, etc.</div>
                  </div>

                  {masterLoading && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {[1,2,3].map(i => (
                        <div key={i} className="skeleton" style={{ height: 60, borderRadius: 8 }} />
                      ))}
                    </div>
                  )}

                  {!masterLoading && masterResults.length > 0 && !selectedMaster && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 300, overflowY: 'auto' }}>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>{masterResults.length} products found in master catalog</div>
                      {masterResults.map((master: any) => (
                        <button key={master.id} onClick={() => handleSelectMaster(master)} style={{ textAlign: 'left', padding: 12, border: '1px solid var(--border)', borderRadius: 8, background: 'white', cursor: 'pointer', display: 'flex', gap: 12 }}>
                          <div style={{ width: 48, height: 48, background: 'var(--surface-muted)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {master.images?.[0] ? <img src={master.images[0].url} alt={master.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }} /> : <Package size={20} color="var(--text-tertiary)" />}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 500, fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{master.name}</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: 2 }}>{master.brand} • {master.category?.name} • {master._count?.shopProducts || 0} shops sell this</div>
                            {master.attributes && (
                              <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: 4 }}>
                                {(() => { try { const attrs = JSON.parse(master.attributes); return Object.entries(attrs).slice(0,3).map(([k,v]) => `${k}: ${v}`).join(' • '); } catch { return ''; } })()}
                              </div>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {!masterLoading && searchQuery && masterResults.length === 0 && !selectedMaster && (
                    <div style={{ padding: 24, textAlign: 'center', background: 'var(--surface-muted)', borderRadius: 8 }}>
                      <div style={{ fontWeight: 500 }}>No products found in master catalog</div>
                      <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: 4 }}>Try different keywords or add product manually</div>
                      <button className="btn btn-secondary btn-sm" style={{ marginTop: 12 }} onClick={()=>setAddMode('manual')}>Add manually instead</button>
                    </div>
                  )}

                  {selectedMaster && (
                    <form onSubmit={handleAddFromMaster} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      <div style={{ padding: 12, background: 'var(--brand-light)', borderRadius: 8, border: '1px solid var(--brand)' }}>
                        <div style={{ display: 'flex', gap: 12 }}>
                          <div style={{ width: 48, height: 48, background: 'white', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {selectedMaster.images?.[0] ? <img src={selectedMaster.images[0].url} alt={selectedMaster.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }} /> : <Package size={20} />}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '14px' }}>{selectedMaster.name}</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{selectedMaster.brand} • {selectedMaster.category?.name}</div>
                            <button type="button" className="btn btn-ghost btn-sm" style={{ fontSize: '11px', padding: '2px 6px', marginTop: 4 }} onClick={()=>setSelectedMaster(null)}>Change</button>
                          </div>
                        </div>
                      </div>

                      {selectedMaster.variants?.length > 0 && (
                        <div className="form-group" style={{ margin: 0 }}>
                          <label className="form-label">Variant (optional)</label>
                          <select className="form-select" value={selectedVariant} onChange={e=>setSelectedVariant(e.target.value)} style={{ borderRadius: 8 }}>
                            <option value="">No variant • Base product</option>
                            {selectedMaster.variants.map((v: any) => (
                              <option key={v.id} value={v.id}>{v.name} • {v.sku}</option>
                            ))}
                          </select>
                        </div>
                      )}

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' /* responsive handled by fix-all-screens.css */, gap: 12 }}>
                        <div className="form-group" style={{ margin: 0 }}>
                          <label className="form-label">Your selling price (₹) *</label>
                          <input type="number" step="0.01" className="form-input" value={form.price} onChange={e=>setForm({...form, price: e.target.value})} required placeholder="e.g. 350" style={{ borderRadius: 8 }} />
                        </div>
                        <div className="form-group" style={{ margin: 0 }}>
                          <label className="form-label">MRP / Compare price (₹)</label>
                          <input type="number" step="0.01" className="form-input" value={form.compareAtPrice} onChange={e=>setForm({...form, compareAtPrice: e.target.value})} placeholder="e.g. 400" style={{ borderRadius: 8 }} />
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' /* responsive handled by fix-all-screens.css */, gap: 12 }}>
                        <div className="form-group" style={{ margin: 0 }}>
                          <label className="form-label">Stock quantity *</label>
                          <input type="number" className="form-input" value={form.stock} onChange={e=>setForm({...form, stock: e.target.value})} required min="0" placeholder="e.g. 50" style={{ borderRadius: 8 }} />
                        </div>
                        <div className="form-group" style={{ margin: 0 }}>
                          <label className="form-label">Unit</label>
                          <select className="form-select" value={form.unit} onChange={e=>setForm({...form, unit: e.target.value})} style={{ borderRadius: 8 }}>
                            <option value="piece">Piece</option>
                            <option value="bag">Bag</option>
                            <option value="kg">Kg</option>
                            <option value="meter">Meter</option>
                            <option value="liter">Liter</option>
                            <option value="set">Set</option>
                            <option value="box">Box</option>
                            <option value="packet">Packet</option>
                          </select>
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' /* responsive handled by fix-all-screens.css */, gap: 12 }}>
                        <div className="form-group" style={{ margin: 0 }}>
                          <label className="form-label">Custom SKU (optional)</label>
                          <input className="form-input" value={form.sku} onChange={e=>setForm({...form, sku: e.target.value})} placeholder="Auto if empty" style={{ borderRadius: 8, fontFamily: 'monospace' }} />
                        </div>
                        <div className="form-group" style={{ margin: 0 }}>
                          <label className="form-label">Storage zone</label>
                          <select className="form-select" value={form.storageZoneId} onChange={e=>setForm({...form, storageZoneId: e.target.value})} style={{ borderRadius: 8 }}>
                            <option value="">No zone</option>
                            {zones.map(z => (
                              <option key={z.id} value={z.id}>{z.name} ({z.code})</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                        <button type="button" className="btn btn-secondary" style={{ flex: 1, borderRadius: 8 }} onClick={()=>setShowAdd(false)}>Cancel</button>
                        <button type="submit" className="btn btn-primary" style={{ flex: 1, borderRadius: 8 }}>Add to my shop</button>
                      </div>
                    </form>
                  )}
                </div>
              ) : (
                <form onSubmit={handleManualAdd} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ padding: 10, background: 'var(--warning-light)', borderRadius: 8, border: '1px solid var(--warning)', fontSize: '12px', color: 'var(--warning)' }}>
                    Manual products won't be linked to master catalog. For better discoverability, search catalog first.
                  </div>
                  
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Product name *</label>
                    <input className="form-input" value={form.name} onChange={e=>setForm({...form, name: e.target.value})} required placeholder="e.g. Astral CPVC Elbow 1 inch, Paracetamol 500mg, etc. - ANY category" style={{ borderRadius: 8 }} />
                    <button type="button" className="btn btn-secondary btn-sm" style={{ marginTop: 8, borderRadius: 6 }} onClick={handleAICategorize}>
                      <Sparkles size={12} />
                      AI suggest category
                    </button>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' /* responsive handled by fix-all-screens.css */, gap: 12 }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">SKU</label>
                      <input className="form-input" value={form.sku} onChange={e=>setForm({...form, sku: e.target.value})} placeholder="Auto if empty" style={{ borderRadius: 8, fontFamily: 'monospace' }} />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Brand</label>
                      <input className="form-input" value={form.brand} onChange={e=>setForm({...form, brand: e.target.value})} placeholder="Brand - works for all categories" style={{ borderRadius: 8 }} />
                    </div>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' /* responsive handled by fix-all-screens.css */, gap: 12 }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Price (₹) *</label>
                      <input type="number" step="0.01" className="form-input" value={form.price} onChange={e=>setForm({...form, price: e.target.value})} required style={{ borderRadius: 8 }} />
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Stock *</label>
                      <input type="number" className="form-input" value={form.stock} onChange={e=>setForm({...form, stock: e.target.value})} required style={{ borderRadius: 8 }} />
                    </div>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' /* responsive handled by fix-all-screens.css */, gap: 12 }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Unit</label>
                      <select className="form-select" value={form.unit} onChange={e=>setForm({...form, unit: e.target.value})} style={{ borderRadius: 8 }}>
                        <option value="piece">Piece</option>
                        <option value="bag">Bag</option>
                        <option value="kg">Kg</option>
                        <option value="meter">Meter</option>
                        <option value="liter">Liter</option>
                        <option value="set">Set</option>
                        <option value="box">Box</option>
                        <option value="packet">Packet</option>
                        <option value="strip">Strip</option>
                        <option value="bottle">Bottle</option>
                      </select>
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">Storage zone</label>
                      <select className="form-select" value={form.storageZoneId} onChange={e=>setForm({...form, storageZoneId: e.target.value})} style={{ borderRadius: 8 }}>
                        <option value="">No zone</option>
                        {zones.map(z => (
                          <option key={z.id} value={z.id}>{z.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                    <button type="button" className="btn btn-secondary" style={{ flex: 1, borderRadius: 8 }} onClick={()=>setShowAdd(false)}>Cancel</button>
                    <button type="submit" className="btn btn-primary" style={{ flex: 1, borderRadius: 8 }}>Add product</button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

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
      ) : products.length === 0 ? (
        <div className="card" style={{ padding: 40, textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, background: 'var(--surface-muted)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Package size={24} color="var(--text-tertiary)" />
          </div>
          <div style={{ fontWeight: 600, fontSize: '16px', marginBottom: 8 }}>No products yet</div>
          <div style={{ fontSize: '14px', color: 'var(--text-secondary)', maxWidth: 400, margin: '0 auto 16px', lineHeight: 1.5 }}>
            Add products from master catalog - search for any product from medical to hardware, set your price and stock, and start selling.
          </div>
          <button className="btn btn-primary" onClick={()=>setShowAdd(true)} style={{ borderRadius: 8 }}>
            <Plus size={16} />
            Add your first product
          </button>
        </div>
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div className="table-wrapper">
            <table className="table">
              <thead><tr><th>Product</th><th>SKU</th><th>Price</th><th>Stock</th><th>Zone</th><th>Master</th><th>Status</th></tr></thead>
              <tbody>
                {products.map(p=>(
                  <tr key={p.id}>
                    <td>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        <div style={{ width: 36, height: 36, background: 'var(--surface-muted)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {p.images?.[0] ? <img src={p.images[0].url} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }} /> : <Package size={16} color="var(--text-tertiary)" />}
                        </div>
                        <div>
                          <div style={{ fontWeight: 500, fontSize: '14px' }}>{p.name}</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                            {p.brand && <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Tag size={10} />{p.brand}</span>}
                            <span>{p.unit}</span>
                            {p.masterProduct && <span style={{ background: 'var(--brand-light)', color: 'var(--brand)', padding: '1px 6px', borderRadius: 10, fontSize: '10px' }}>Master linked</span>}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>{p.sku}</td>
                    <td style={{ fontWeight: 600 }}>{formatPaise(p.pricePaise ?? Math.round((p.price||0)*100))}</td>
                    <td><span className={`badge badge-${p.stock<=0?'danger':p.stock<=p.lowStockThreshold?'warning':'success'}`}>{p.stock} {p.stock<=p.lowStockThreshold && p.stock>0?'• Low':''}</span></td>
                    <td><span style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: 3 }}><MapPin size={10} />{p.storageZone?.code || '-'}</span></td>
                    <td>{p.masterProductId ? <span className="badge badge-success">Linked</span> : <span className="badge badge-neutral">Manual</span>}</td>
                    <td><span className={`badge ${p.isActive?'badge-success':'badge-danger'}`}>{p.isActive?'Active':'Inactive'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
          <style>{`
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
          .table { min-width: 600px; }
        }
        @media (max-width: 640px) {
          .table th, .table td { padding: 12px 8px !important; font-size: 12px !important; }
        }
      `}</style>
    </div>
  );
}
