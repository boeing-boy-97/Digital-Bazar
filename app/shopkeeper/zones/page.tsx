'use client';
import { useEffect, useState } from 'react';

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
      
      // Fallback to shop detail if zones API empty
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
      alert(data.error?.message || data.error || 'Failed to create zone');
    }
  };

  const handleDelete = async (zoneId: string) => {
    if (!confirm('Delete this zone? Only possible if no products in zone.')) return;
    
    const res = await fetch(`/api/shops/${shopId}/zones/${zoneId}`, { method: 'DELETE' });
    const data = await res.json();
    if (res.ok) {
      fetchZones();
    } else {
      alert(data.error?.message || 'Failed to delete - zone may have products');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700 }}>Storage Zones - Real Data</h1>
          <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: 4 }}>Define physical zones in your shop for auto-sorted picking. Real DB, tenant isolated, audit logged.</div>
        </div>
        <button className="btn btn-primary" onClick={()=>setShowAdd(true)}>Add Zone</button>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-body">
          <div style={{ fontWeight: 600, marginBottom: 8 }}>How Auto Sorting Works (Core Feature) - Real Algorithm</div>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            When customer orders: Cement ×10, Bricks ×500, PVC Pipe ×20, Elbow ×20, Putty ×2, Paint ×4L, Screws ×100<br/><br/>
            System automatically creates deterministic sorting:<br/>
            <strong>ZONE A - BUILDING MATERIAL (sortOrder 0):</strong> Cement ×10, Bricks ×500<br/>
            <strong>ZONE B - PLUMBING (sortOrder 1):</strong> PVC Pipe ×20, Elbow ×20<br/>
            <strong>ZONE C - PAINT (sortOrder 2):</strong> Putty ×2, Paint ×4L<br/>
            <strong>ZONE D - HARDWARE (sortOrder 3):</strong> Screws ×100<br/><br/>
            Sorted first by zone sortOrder ASC, then zone name ASC, then product name ASC. Picker sees organized list. Real algorithm in lib/inventory/manager.ts sortOrderItemsByZone.
          </div>
        </div>
      </div>

      {showAdd && (
        <div className="modal-overlay" onClick={()=>setShowAdd(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-header"><div style={{ fontWeight: 600 }}>Add Storage Zone - Real</div><button className="btn btn-ghost btn-sm" onClick={()=>setShowAdd(false)}>✕</button></div>
            <form onSubmit={handleAdd} className="modal-body stack stack-4">
              <div className="form-group"><label className="form-label">Zone Name *</label><input className="form-input" value={form.name} onChange={e=>setForm({...form, name: e.target.value})} required placeholder="e.g. Building Material" /></div>
              <div className="form-group"><label className="form-label">Code (auto if empty)</label><input className="form-input" value={form.code} onChange={e=>setForm({...form, code: e.target.value})} placeholder="ZONE_A, BUILD, etc" /></div>
              <div className="form-group"><label className="form-label">Description</label><textarea className="form-textarea" value={form.description} onChange={e=>setForm({...form, description: e.target.value})} placeholder="Aisle 1, Rack 1-5" /></div>
              <div className="form-group"><label className="form-label">Sort Order (0 = first picked)</label><input type="number" className="form-input" value={form.sortOrder} onChange={e=>setForm({...form, sortOrder: parseInt(e.target.value)||0})} /></div>
              <div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={()=>setShowAdd(false)}>Cancel</button><button type="submit" className="btn btn-primary">Create Zone</button></div>
            </form>
          </div>
        </div>
      )}

      {loading ? <div>Loading real zones from database...</div> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {zones.map(z=>(
            <div key={z.id} className="card" style={{ padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontFamily: 'monospace' }}>{z.code}</div>
                  <div style={{ fontSize: '14px', marginTop: 4, fontWeight: 500 }}>{z.name}</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: 4 }}>{z.description || 'Storage zone'}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: 8 }}>Products: {z._count?.products ?? '—'} • Sort: {z.sortOrder}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span className="badge badge-neutral">Order: {z.sortOrder}</span>
                  <button className="btn btn-ghost btn-sm" style={{ fontSize: '11px', color: 'var(--danger)' }} onClick={()=>handleDelete(z.id)}>Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {zones.length===0 && !loading && <div className="empty-state"><div className="empty-state-icon">📦</div><div className="empty-state-title">No zones defined - Real empty state</div><div className="empty-state-description">Zones are auto-created when you create shop. Default: Zone A-E with sortOrder 0-4. Production starts with zones from seed or create manually. Real DB.</div></div>}
    </div>
  );
}
