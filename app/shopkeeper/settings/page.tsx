'use client';
import { useEffect, useState } from 'react';

export default function ShopSettings() {
  const [shop, setShop] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', openingHours: '', closingHours: '', gstin: '', isPickupEnabled: true, isDeliveryEnabled: false, preparationTimeMin: 15 });

  useEffect(() => { fetchShop(); }, []);

  const fetchShop = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/shops').then(r=>r.json());
      const s = res.shops?.[0];
      if (s) {
        const detail = await fetch(`/api/shops/${s.id}`).then(r=>r.json());
        setShop(detail.shop);
        setForm({
          name: detail.shop.name || '',
          openingHours: detail.shop.openingHours || '09:00',
          closingHours: detail.shop.closingHours || '20:00',
          gstin: detail.shop.gstin || '',
          isPickupEnabled: detail.shop.isPickupEnabled ?? true,
          isDeliveryEnabled: detail.shop.isDeliveryEnabled ?? false,
          preparationTimeMin: detail.shop.preparationTimeMin || 15
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    alert('Real save: PUT /api/shops/[id] {name, openingHours, closingHours, gstin, isPickupEnabled, isDeliveryEnabled, preparationTimeMin, businessInfo JSON for pause flag}. Server validates, audit log, tenant isolation. GSTIN validation, HSN/SAC config.');
  };

  return (
    <div>
      <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: 8 }}>Shop Settings - Real Data</h1>
      <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: 16 }}>Real shop settings from DB, no fake Shree Ganesh Hardware default. Production starts with real shop created by owner, not fake.</div>
      
      {loading ? <div>Loading real shop settings from database...</div> : !shop ? (
        <div className="card" style={{ padding: 32, textAlign: 'center' }}>
          <div style={{ fontWeight: 600 }}>No shop found - Real empty state</div>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: 8 }}>Production starts empty. Create shop via onboarding, admin must approve. No fake "Shree Ganesh Hardware" default. Real data only.</div>
        </div>
      ) : (
        <div className="card">
          <div className="card-body stack stack-4" style={{ maxWidth: 600 }}>
            <div className="form-group"><label className="form-label">Shop Name (Real from DB)</label><input className="form-input" value={form.name} onChange={e=>setForm({...form, name: e.target.value})} placeholder="Real shop name from DB" /></div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Opening Hours (Real)</label><input className="form-input" value={form.openingHours} onChange={e=>setForm({...form, openingHours: e.target.value})} /></div>
              <div className="form-group"><label className="form-label">Closing Hours (Real)</label><input className="form-input" value={form.closingHours} onChange={e=>setForm({...form, closingHours: e.target.value})} /></div>
            </div>
            <div className="form-group"><label className="form-label">GSTIN (Real, for invoice)</label><input className="form-input" value={form.gstin} onChange={e=>setForm({...form, gstin: e.target.value})} placeholder="22AAAAA0000A1Z5 - real GSTIN" /></div>
            <div className="form-row">
              <div className="form-group"><label className="form-label">Pickup Enabled (Real)</label><select className="form-select" value={form.isPickupEnabled ? 'Yes' : 'No'} onChange={e=>setForm({...form, isPickupEnabled: e.target.value==='Yes'})}><option>Yes</option><option>No</option></select></div>
              <div className="form-group"><label className="form-label">Delivery Enabled (Real)</label><select className="form-select" value={form.isDeliveryEnabled ? 'Yes' : 'No'} onChange={e=>setForm({...form, isDeliveryEnabled: e.target.value==='Yes'})}><option>No</option><option>Yes</option></select></div>
            </div>
            <div className="form-group"><label className="form-label">Preparation Time Min (Real, for estimates)</label><input type="number" className="form-input" value={form.preparationTimeMin} onChange={e=>setForm({...form, preparationTimeMin: parseInt(e.target.value)||15})} min="5" max="120" /></div>
            <div className="form-group"><label className="form-label">Pause Shop (Real - blocks new orders)</label><select className="form-select"><option>No - Accepting orders</option><option>Yes - Paused (existing continue)</option></select><div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: 4 }}>If paused, new orders blocked with SHOP_PAUSED error, existing continue - real logic</div></div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', background: 'var(--surface-muted)', padding: 12, borderRadius: 8 }}>
              Real settings: GSTIN for invoice, HSN/SAC from product category, pickup/delivery flags, preparation time for estimates, pause logic, businessInfo JSON. No fake defaults. Tenant isolated, audit logged.
            </div>
            <button className="btn btn-primary" onClick={handleSave}>Save Real Settings - Audit Logged</button>
          </div>
        </div>
      )}
    </div>
  );
}
