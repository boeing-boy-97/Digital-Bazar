'use client';
import { useEffect, useState } from 'react';
import { MapPin, Plus, Package, Trash2 } from 'lucide-react';

export default function ZonesPage() {
  const [zones, setZones] = useState<any[]>([]);
  const [shopId, setShopId] = useState<string>('');
  const [form, setForm] = useState({ name: '', code: '', description: '', sortOrder: 0 });
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchZones(); }, []);

  const fetchZones = async () => {
    setLoading(true);
    try {
      const shops = await fetch('/api/shops').then(r=>r.json());
      const sId = shops.shops?.[0]?.id;
      if (!sId) { setLoading(false); return; }
      setShopId(sId);
      const res = await fetch(`/api/shops/${sId}/zones`).then(r=>r.json());
      setZones(res.zones || []);
      
      if (!res.zones || res.zones.length===0) {
        const detail = await fetch(`/api/shops/${sId}`).then(r=>r.json());
        setZones(detail.shop?.storageZones || []);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopId) return alert('No shop found');
    
    const res = await fetch(`/api/shops/${shopId}/zones`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });
    
    const data = await res.json();
    if (res.ok) {
      setShowAdd(false);
      setForm({ name: '', code: '', description: '', sortOrder: 0 });
      fetchZones();
    } else {
      alert(data.error?.message || data.error || 'Unable to create zone');
    }
  };

  const handleDelete = async (zoneId: string) => {
    if (!confirm('Delete this zone? This is only possible if no products are assigned to it.')) return;
    
    const res = await fetch(`/api/shops/${shopId}/zones/${zoneId}`, { method: 'DELETE' });
    const data = await res.json();
    if (res.ok) {
      fetchZones();
    } else {
      alert(data.error?.message || 'Unable to delete zone. It may have products assigned.');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, letterSpacing: '-0.02em' }}>Storage zones</h1>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: 4 }}>Organize your shop into zones for efficient picking</p>
        </div>
        <button className="btn btn-primary" onClick={()=>setShowAdd(true)} style={{ borderRadius: 8 }}>
          <Plus size={16} />
          Add zone
        </button>
      </div>

      <div className="card" style={{ marginBottom: 20, background: 'var(--surface-muted)' }}>
        <div className="card-body" style={{ display: 'flex', gap: 12 }}>
          <div style={{ width: 36, height: 36, background: 'var(--brand-light)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <MapPin size={18} color="var(--brand)" />
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: '14px' }}>How zone sorting works</div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: 6, lineHeight: 1.5 }}>
              When an order contains multiple products, they are automatically grouped by storage zone. For example, cement and bricks from Building Material zone, pipes from Plumbing zone. This helps your picker collect items efficiently without backtracking.
            </div>
          </div>
        </div>
      </div>

      {showAdd && (
        <div className="modal-overlay" onClick={()=>setShowAdd(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 16 }}>
          <div className="modal" onClick={e=>e.stopPropagation()} style={{ background: 'white', borderRadius: 12, width: '100%', maxWidth: 480, overflow: 'hidden' }}>
            <div style={{ padding: 20, borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontWeight: 600, fontSize: '16px' }}>Add storage zone</div>
              <button className="btn btn-ghost btn-sm" onClick={()=>setShowAdd(false)} style={{ width: 32, height: 32, borderRadius: 8 }}>✕</button>
            </div>
            <form onSubmit={handleAdd} style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Zone name *</label>
                <input className="form-input" value={form.name} onChange={e=>setForm({...form, name: e.target.value})} required placeholder="e.g. Building Material, Plumbing, Paint" style={{ borderRadius: 8 }} />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Code (optional)</label>
                <input className="form-input" value={form.code} onChange={e=>setForm({...form, code: e.target.value})} placeholder="ZONE_A, BUILD, etc" style={{ borderRadius: 8, fontFamily: 'monospace' }} />
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: 4 }}>Auto-generated if left empty</div>
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Description</label>
                <textarea className="form-textarea" value={form.description} onChange={e=>setForm({...form, description: e.target.value})} placeholder="Aisle 1, Rack 1-5, or any location hint" style={{ borderRadius: 8, minHeight: 60 }} />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Picking order</label>
                <select className="form-select" value={form.sortOrder} onChange={e=>setForm({...form, sortOrder: parseInt(e.target.value)||0})} style={{ borderRadius: 8 }}>
                  <option value="0">0 • First zone to pick</option>
                  <option value="1">1 • Second zone</option>
                  <option value="2">2 • Third zone</option>
                  <option value="3">3 • Fourth zone</option>
                  <option value="4">4 • Fifth zone</option>
                  <option value="5">5 • Sixth zone</option>
                </select>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: 4 }}>Lower numbers are picked first</div>
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1, borderRadius: 8 }} onClick={()=>setShowAdd(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, borderRadius: 8 }}>Create zone</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {[1,2,3].map(i => (
            <div key={i} className="card" style={{ padding: 16 }}>
              <div className="skeleton" style={{ height: 16, width: '40%', marginBottom: 12 }} />
              <div className="skeleton" style={{ height: 14, width: '60%' }} />
              <div className="skeleton" style={{ height: 12, width: '80%', marginTop: 8 }} />
            </div>
          ))}
        </div>
      ) : zones.length === 0 ? (
        <div className="card" style={{ padding: 40, textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, background: 'var(--surface-muted)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <MapPin size={24} color="var(--text-tertiary)" />
          </div>
          <div style={{ fontWeight: 600, fontSize: '16px', marginBottom: 8 }}>No zones yet</div>
          <div style={{ fontSize: '14px', color: 'var(--text-secondary)', maxWidth: 400, margin: '0 auto', lineHeight: 1.5 }}>
            Storage zones help organize your shop for efficient order picking. Create zones like Building Material, Plumbing, Paint, Hardware, etc.
          </div>
          <button className="btn btn-primary" style={{ marginTop: 16, borderRadius: 8 }} onClick={()=>setShowAdd(true)}>
            <Plus size={16} />
            Create your first zone
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {zones.map(z=>(
            <div key={z.id} className="card" style={{ padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 32, height: 32, background: 'var(--brand-light)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand)', fontWeight: 600, fontSize: '12px', fontFamily: 'monospace' }}>
                      {z.code?.slice(0,3) || z.name.slice(0,2).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '14px' }}>{z.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{z.code}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: 10, lineHeight: 1.4 }}>{z.description || 'Storage zone for organizing products'}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Package size={10} />{z._count?.products ?? 0} products</span>
                    <span>•</span>
                    <span>Order: {z.sortOrder}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginLeft: 12 }}>
                  <span className="badge badge-neutral">#{z.sortOrder}</span>
                  <button className="btn btn-ghost btn-sm" style={{ fontSize: '11px', color: 'var(--danger)', borderRadius: 6 }} onClick={()=>handleDelete(z.id)}>
                    <Trash2 size={12} />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
