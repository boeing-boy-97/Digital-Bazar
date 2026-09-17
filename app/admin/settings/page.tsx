'use client';
export default function AdminSettings() {
  return (
    <div>
      <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: 16 }}>Platform Settings</h1>
      <div style={{ display: 'grid', gap: 16, maxWidth: 600 }}>
        <div className="card"><div className="card-body"><div style={{ fontWeight: 600 }}>Commission</div><div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: 4 }}>Default 5%, configurable per shop/category</div><input className="form-input" defaultValue="5" style={{ marginTop: 8 }} /></div></div>
        <div className="card"><div className="card-body"><div style={{ fontWeight: 600 }}>Feature Flags</div><div style={{ fontSize: '13px', marginTop: 8 }}><label className="flex items-center gap-2"><input type="checkbox" defaultChecked /> AI Assistant</label><label className="flex items-center gap-2"><input type="checkbox" defaultChecked /> Image Search</label><label className="flex items-center gap-2"><input type="checkbox" defaultChecked /> Voice Shopping</label><label className="flex items-center gap-2"><input type="checkbox" defaultChecked /> Online Payment</label></div></div></div>
      </div>
    </div>
  );
}
