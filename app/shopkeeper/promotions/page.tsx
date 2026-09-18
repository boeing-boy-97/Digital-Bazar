'use client';
import { useEffect, useState } from 'react';
import { formatPaise } from '@/lib/domain/money';
import { Tag, Plus, Percent, Calendar } from 'lucide-react';

export default function PromotionsPage() {
  const [promotions, setPromotions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ code: '', discountType: 'PERCENTAGE', discountValue: '', minOrder: '', validTill: '', maxDiscount: '' });
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => { fetchPromotions(); }, []);

  const fetchPromotions = async () => {
    setLoading(true);
    try {
      setPromotions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/promotions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: form.code,
          discountType: form.discountType,
          discountValue: parseFloat(form.discountValue),
          minOrder: form.minOrder ? parseFloat(form.minOrder) : undefined,
          maxDiscount: form.maxDiscount ? parseFloat(form.maxDiscount) : undefined,
          validTill: form.validTill || undefined
        })
      });
      
      if (res.ok) {
        alert('Promotion created successfully');
        setShowAdd(false);
        setForm({ code: '', discountType: 'PERCENTAGE', discountValue: '', minOrder: '', validTill: '', maxDiscount: '' });
        fetchPromotions();
      } else {
        const data = await res.json();
        alert(data.error || 'Unable to create promotion');
      }
    } catch {
      alert('Unable to create promotion. Please try again.');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, letterSpacing: '-0.02em' }}>Promotions</h1>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: 4 }}>Create discount codes and offers for your customers</p>
        </div>
        <button className="btn btn-primary" onClick={()=>setShowAdd(true)} style={{ borderRadius: 8 }}>
          <Plus size={16} />
          Create promotion
        </button>
      </div>
      
      <div className="card" style={{ marginBottom: 20, background: 'var(--surface-muted)' }}>
        <div className="card-body" style={{ display: 'flex', gap: 12 }}>
          <div style={{ width: 36, height: 36, background: 'var(--brand-light)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Tag size={18} color="var(--brand)" />
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: '14px' }}>How promotions work</div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: 6, lineHeight: 1.5 }}>
              Create discount codes that customers can apply at checkout. Set percentage or fixed discounts, minimum order values, and expiry dates. All codes are validated at checkout.
            </div>
          </div>
        </div>
      </div>

      {showAdd && (
        <div className="modal-overlay" onClick={()=>setShowAdd(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 16 }}>
          <div className="modal" onClick={e=>e.stopPropagation()} style={{ background: 'white', borderRadius: 12, width: '100%', maxWidth: 520, overflow: 'hidden', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ padding: 20, borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontWeight: 600, fontSize: '16px' }}>Create promotion</div>
              <button className="btn btn-ghost btn-sm" onClick={()=>setShowAdd(false)} style={{ width: 32, height: 32, borderRadius: 8 }}>✕</button>
            </div>
            <form onSubmit={handleCreate} style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Promo code *</label>
                <input className="form-input" value={form.code} onChange={e=>setForm({...form, code: e.target.value.toUpperCase()})} required placeholder="DIWALI10" style={{ borderRadius: 8, fontFamily: 'monospace' }} />
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: 4 }}>Uppercase letters and numbers only</div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' /* responsive handled by fix-all-screens.css */, gap: 12 }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Discount type *</label>
                  <select className="form-select" value={form.discountType} onChange={e=>setForm({...form, discountType: e.target.value})} style={{ borderRadius: 8 }}>
                    <option value="PERCENTAGE">Percentage %</option>
                    <option value="FIXED">Fixed amount ₹</option>
                  </select>
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Discount value *</label>
                  <input type="number" className="form-input" value={form.discountValue} onChange={e=>setForm({...form, discountValue: e.target.value})} required min="1" max={form.discountType==='PERCENTAGE'?'100':'10000'} placeholder={form.discountType==='PERCENTAGE'?'10':'100'} style={{ borderRadius: 8 }} />
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' /* responsive handled by fix-all-screens.css */, gap: 12 }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Minimum order ₹</label>
                  <input type="number" className="form-input" value={form.minOrder} onChange={e=>setForm({...form, minOrder: e.target.value})} min="0" placeholder="1000" style={{ borderRadius: 8 }} />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Maximum discount ₹</label>
                  <input type="number" className="form-input" value={form.maxDiscount} onChange={e=>setForm({...form, maxDiscount: e.target.value})} min="0" placeholder="500" style={{ borderRadius: 8 }} />
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: 2 }}>For percentage discounts</div>
                </div>
              </div>
              
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Valid until</label>
                <input type="date" className="form-input" value={form.validTill} onChange={e=>setForm({...form, validTill: e.target.value})} min={new Date().toISOString().split('T')[0]} style={{ borderRadius: 8 }} />
              </div>
              
              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1, borderRadius: 8 }} onClick={()=>setShowAdd(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, borderRadius: 8 }}>Create promotion</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="card" style={{ overflow: 'hidden' }}>
        <div className="card-header"><div className="card-title">Active promotions</div></div>
        <div className="card-body" style={{ padding: 0 }}>
          {loading ? (
            <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[1,2].map(i => (
                <div key={i} style={{ display: 'flex', gap: 12 }}>
                  <div className="skeleton" style={{ width: 80, height: 24, borderRadius: 6 }} />
                  <div className="skeleton" style={{ height: 14, width: 100 }} />
                </div>
              ))}
            </div>
          ) : promotions.length===0 ? (
            <div style={{ padding: 40, textAlign: 'center' }}>
              <div style={{ width: 56, height: 56, background: 'var(--surface-muted)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <Tag size={24} color="var(--text-tertiary)" />
              </div>
              <div style={{ fontWeight: 600, fontSize: '16px', marginBottom: 8 }}>No promotions yet</div>
              <div style={{ fontSize: '14px', color: 'var(--text-secondary)', maxWidth: 400, margin: '0 auto', lineHeight: 1.5 }}>
                Create your first promotion to offer discounts to customers. For example, a Diwali sale or first-order discount.
              </div>
              <button className="btn btn-primary" style={{ marginTop: 16, borderRadius: 8 }} onClick={()=>setShowAdd(true)}>
                <Plus size={16} />
                Create promotion
              </button>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="table">
                <thead><tr><th>Code</th><th>Type</th><th>Value</th><th>Min order</th><th>Valid till</th><th>Uses</th></tr></thead>
                <tbody>
                  {promotions.map((p:any)=>(
                    <tr key={p.id}>
                      <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{p.code}</td>
                      <td><span className="badge badge-neutral" style={{ display: 'flex', alignItems: 'center', gap: 4, width: 'fit-content' }}>{p.discountType==='PERCENTAGE' ? <Percent size={12} /> : '₹'}{p.discountType}</span></td>
                      <td style={{ fontWeight: 600 }}>{p.discountType==='PERCENTAGE'?`${p.discountValue}%`:`₹${p.discountValue}`}</td>
                      <td>{p.minOrder?formatPaise(p.minOrderPaise ?? Math.round((p.minOrder||0)*100)):'-'}</td>
                      <td style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Calendar size={12} />{p.validTill?new Date(p.validTill).toLocaleDateString():'No expiry'}</td>
                      <td>{p.usageCount||0}/{p.usageLimit||'∞'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
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
