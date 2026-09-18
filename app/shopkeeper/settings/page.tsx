'use client';
import { useEffect, useState } from 'react';
import { Store, Clock, FileText, Truck, Package, Pause, Save, CheckCircle, XCircle, AlertTriangle, MapPin } from 'lucide-react';
import Link from 'next/link';

export default function ShopSettings() {
  const [shop, setShop] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ 
    name: '', 
    description: '',
    category: '',
    address: '',
    city: '',
    pincode: '',
    phone: '',
    email: '',
    openingHours: '', 
    closingHours: '', 
    gstin: '', 
    isPickupEnabled: true, 
    isDeliveryEnabled: false, 
    isReservationEnabled: true,
    preparationTimeMin: 15, 
    isPaused: false,
    isOnlineOrdersPaused: false,
    isReservationsPaused: false,
    isPickupPaused: false,
    isDeliveryPaused: false,
    pauseReason: '',
    serviceRadiusKm: 5,
    minOrderPaise: 0,
    deliveryFeePaise: 0,
    priceParityMode: 'SAME',
    reservationExpiryMin: 120
  });
  const [pauseLoading, setPauseLoading] = useState(false);


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
          description: detail.shop.description || '',
          category: detail.shop.category || '',
          address: detail.shop.address || '',
          city: detail.shop.city || '',
          pincode: detail.shop.pincode || '',
          phone: detail.shop.phone || '',
          email: detail.shop.email || '',
          openingHours: detail.shop.openingHours || '09:00',
          closingHours: detail.shop.closingHours || '20:00',
          gstin: detail.shop.gstin || '',
          isPickupEnabled: detail.shop.isPickupEnabled ?? true,
          isDeliveryEnabled: detail.shop.isDeliveryEnabled ?? false,
          isReservationEnabled: (detail.shop as any).isReservationEnabled ?? true,
          preparationTimeMin: detail.shop.preparationTimeMin || 15,
          isPaused: detail.shop.status === 'PAUSED',
          isOnlineOrdersPaused: (detail.shop as any).isOnlineOrdersPaused ?? false,
          isReservationsPaused: (detail.shop as any).isReservationsPaused ?? false,
          isPickupPaused: (detail.shop as any).isPickupPaused ?? false,
          isDeliveryPaused: (detail.shop as any).isDeliveryPaused ?? false,
          pauseReason: (detail.shop as any).pauseReason || '',
          serviceRadiusKm: (detail.shop as any).serviceRadiusKm || 5,
          minOrderPaise: (detail.shop as any).minOrderPaise || 0,
          deliveryFeePaise: (detail.shop as any).deliveryFeePaise || 0,
          priceParityMode: (detail.shop as any).priceParityMode || 'SAME',
          reservationExpiryMin: (detail.shop as any).reservationExpiryMin || 120
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePauseToggle = async () => {
    if (!shop) return;
    setPauseLoading(true);
    try {
      const res = await fetch(`/api/shops/${shop.id}/pause`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isOnlineOrdersPaused: form.isOnlineOrdersPaused,
          isReservationsPaused: form.isReservationsPaused,
          isPickupPaused: form.isPickupPaused,
          isDeliveryPaused: form.isDeliveryPaused,
          pauseReason: form.pauseReason
        })
      });
      const data = await res.json();
      if (res.ok) {
        alert('Pause settings updated - physical shop remains open, digital availability changed per point 58,59');
        fetchShop();
      } else {
        alert(data.error?.message || 'Failed to update pause');
      }
    } finally {
      setPauseLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/shops/${shop.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          category: form.category,
          address: form.address,
          city: form.city,
          pincode: form.pincode,
          phone: form.phone,
          email: form.email,
          openingHours: form.openingHours,
          closingHours: form.closingHours,
          gstin: form.gstin,
          isPickupEnabled: form.isPickupEnabled,
          isDeliveryEnabled: form.isDeliveryEnabled,
          isReservationEnabled: form.isReservationEnabled,
          preparationTimeMin: form.preparationTimeMin,
          serviceRadiusKm: form.serviceRadiusKm,
          minOrderPaise: form.minOrderPaise,
          deliveryFeePaise: form.deliveryFeePaise,
          priceParityMode: form.priceParityMode,
          reservationExpiryMin: form.reservationExpiryMin,
          status: form.isPaused ? 'PAUSED' : shop.status === 'PAUSED' ? 'APPROVED' : shop.status
        })
      });
      
      if (res.ok) {
        alert('Shop settings saved successfully');
        fetchShop();
      } else {
        const data = await res.json();
        alert(data.error || 'Unable to save settings');
      }
    } catch {
      alert('Unable to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const getStatusConfig = () => {
    if (!shop) return null;
    if (shop.status === 'APPROVED') return { color: 'var(--success)', bg: 'var(--success-light)', icon: CheckCircle, title: 'Shop approved and live', desc: 'Your shop is visible to customers. Keep your products and stock updated.' };
    if (shop.status === 'PENDING_REVIEW') return { color: 'var(--warning)', bg: 'var(--warning-light)', icon: Clock, title: 'Pending admin approval', desc: 'Your shop is under review. Admin will approve within 24 hours. You can still add products.' };
    if (shop.status === 'REJECTED') return { color: 'var(--danger)', bg: 'var(--danger-light)', icon: XCircle, title: 'Shop application rejected', desc: shop.rejectionReason || 'Your application was rejected. Please check reason below and update.' };
    if (shop.status === 'REQUESTED_CHANGES') return { color: 'var(--warning)', bg: 'var(--warning-light)', icon: AlertTriangle, title: 'Changes requested', desc: shop.rejectionReason || 'Admin requested changes. Please update and resubmit.' };
    if (shop.status === 'SUSPENDED') return { color: 'var(--danger)', bg: 'var(--danger-light)', icon: XCircle, title: 'Shop suspended', desc: shop.rejectionReason || 'Your shop has been suspended. Contact support.' };
    if (shop.status === 'PAUSED') return { color: 'var(--text-tertiary)', bg: 'var(--surface-muted)', icon: Pause, title: 'Shop paused', desc: 'You paused your shop. Existing orders continue, new orders are blocked.' };
    return null;
  };

  const statusConfig = getStatusConfig();

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, letterSpacing: '-0.02em' }}>Shop settings</h1>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: 4 }}>Manage your shop details, hours, and preferences - works for all product categories from medical to hardware</p>
      </div>
      
      {loading ? (
        <div className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[1,2,3,4].map(i => (
              <div key={i}>
                <div className="skeleton" style={{ height: 12, width: 100, marginBottom: 8 }} />
                <div className="skeleton" style={{ height: 36, width: '100%' }} />
              </div>
            ))}
          </div>
        </div>
      ) : !shop ? (
        <div className="card" style={{ padding: 40, textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, background: 'var(--surface-muted)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Store size={24} color="var(--text-tertiary)" />
          </div>
          <div style={{ fontWeight: 600, fontSize: '16px', marginBottom: 8 }}>No shop found</div>
          <div style={{ fontSize: '14px', color: 'var(--text-secondary)', maxWidth: 400, margin: '0 auto 16px', lineHeight: 1.5 }}>
            Your shop hasn't been set up yet. Complete the onboarding to create your shop for any category - medical, hardware, grocery, electronics, etc.
          </div>
          <Link href="/shopkeeper/onboarding" className="btn btn-primary" style={{ borderRadius: 8 }}>Create shop</Link>
        </div>
      ) : (
        <>
          {/* Approval Status - Critical for shop owner */}
          {statusConfig && (
            <div className="card" style={{ marginBottom: 20, background: statusConfig.bg, borderColor: statusConfig.color, borderWidth: 1 }}>
              <div className="card-body" style={{ display: 'flex', gap: 14 }}>
                <div style={{ width: 40, height: 40, background: 'white', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: statusConfig.color }}>
                  <statusConfig.icon size={20} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '15px', color: statusConfig.color }}>{statusConfig.title}</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.4 }}>{statusConfig.desc}</div>
                  
                  {shop.rejectionReason && (shop.status === 'REJECTED' || shop.status === 'REQUESTED_CHANGES' || shop.status === 'SUSPENDED') && (
                    <div style={{ marginTop: 12, padding: 12, background: 'white', borderRadius: 8, border: `1px solid ${statusConfig.color}40` }}>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: statusConfig.color, marginBottom: 4 }}>Admin reason:</div>
                      <div style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.4 }}>{shop.rejectionReason}</div>
                    </div>
                  )}

                  <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', background: 'white', padding: '4px 10px', borderRadius: 20, border: '1px solid var(--border)' }}>
                      Completion: {shop.completionPercent || 0}%
                    </span>
                    <span style={{ fontSize: '12px', background: 'white', padding: '4px 10px', borderRadius: 20, border: '1px solid var(--border)' }}>
                      Status: {shop.status.replace(/_/g, ' ')}
                    </span>
                    {shop.status !== 'APPROVED' && (
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Update details below to improve approval chances</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="card">
            <div className="card-body" style={{ maxWidth: 640, display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }} className="form-grid">
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Store size={14} /> Shop name *
                  </label>
                  <input className="form-input" value={form.name} onChange={e=>setForm({...form, name: e.target.value})} placeholder="e.g. Ganesh Medical, Shree Hardware" style={{ borderRadius: 8 }} />
                </div>
                
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Category *</label>
                  <select className="form-select" value={form.category} onChange={e=>setForm({...form, category: e.target.value})} style={{ borderRadius: 8 }}>
                    <option value="">Select category</option>
                    <option value="Medical">Medical • Medicines, equipment</option>
                    <option value="Hardware">Hardware • Tools, fittings</option>
                    <option value="Building Material">Building Material • Cement, bricks</option>
                    <option value="Plumbing">Plumbing • Pipes, sanitary</option>
                    <option value="Paint">Paint • Paints, putty</option>
                    <option value="Electrical">Electrical • Wires, lights</option>
                    <option value="Grocery">Grocery • Daily needs</option>
                    <option value="Electronics">Electronics • Mobiles, accessories</option>
                    <option value="General">General • All products</option>
                  </select>
                </div>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Description</label>
                <textarea className="form-textarea" value={form.description} onChange={e=>setForm({...form, description: e.target.value})} placeholder="Describe your shop - what do you sell? Works for all categories from medical to hardware" style={{ borderRadius: 8, minHeight: 80 }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }} className="form-grid">
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <MapPin size={14} /> Address *
                  </label>
                  <input className="form-input" value={form.address} onChange={e=>setForm({...form, address: e.target.value})} placeholder="Shop address" style={{ borderRadius: 8 }} />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">City *</label>
                  <input className="form-input" value={form.city} onChange={e=>setForm({...form, city: e.target.value})} placeholder="City" style={{ borderRadius: 8 }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }} className="form-grid-3">
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Pincode</label>
                  <input className="form-input" value={form.pincode} onChange={e=>setForm({...form, pincode: e.target.value})} placeholder="440010" style={{ borderRadius: 8 }} />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Phone</label>
                  <input className="form-input" value={form.phone} onChange={e=>setForm({...form, phone: e.target.value})} placeholder="Shop phone" style={{ borderRadius: 8 }} />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Email</label>
                  <input className="form-input" value={form.email} onChange={e=>setForm({...form, email: e.target.value})} placeholder="Shop email" style={{ borderRadius: 8 }} />
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }} className="form-grid">
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Clock size={14} /> Opening hours
                  </label>
                  <input className="form-input" type="time" value={form.openingHours} onChange={e=>setForm({...form, openingHours: e.target.value})} style={{ borderRadius: 8 }} />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Clock size={14} /> Closing hours
                  </label>
                  <input className="form-input" type="time" value={form.closingHours} onChange={e=>setForm({...form, closingHours: e.target.value})} style={{ borderRadius: 8 }} />
                </div>
              </div>
              
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <FileText size={14} /> GSTIN (for invoices)
                </label>
                <input className="form-input" value={form.gstin} onChange={e=>setForm({...form, gstin: e.target.value})} placeholder="22AAAAA0000A1Z5" style={{ borderRadius: 8, fontFamily: 'monospace' }} />
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: 4 }}>Required for GST invoices - works for all product types</div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }} className="form-grid">
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Package size={14} /> Pickup enabled
                  </label>
                  <select className="form-select" value={form.isPickupEnabled ? 'Yes' : 'No'} onChange={e=>setForm({...form, isPickupEnabled: e.target.value==='Yes'})} style={{ borderRadius: 8 }}>
                    <option value="Yes">Yes • Customers can pickup</option>
                    <option value="No">No • Pickup disabled</option>
                  </select>
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Truck size={14} /> Delivery enabled
                  </label>
                  <select className="form-select" value={form.isDeliveryEnabled ? 'Yes' : 'No'} onChange={e=>setForm({...form, isDeliveryEnabled: e.target.value==='Yes'})} style={{ borderRadius: 8 }}>
                    <option value="No">No • Delivery disabled</option>
                    <option value="Yes">Yes • Offer delivery</option>
                  </select>
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }} className="form-grid">
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Clock size={14} /> Preparation time
                  </label>
                  <select className="form-select" value={form.preparationTimeMin} onChange={e=>setForm({...form, preparationTimeMin: parseInt(e.target.value)})} style={{ borderRadius: 8 }}>
                    <option value="5">5 min • Very fast (medical)</option>
                    <option value="10">10 min • Fast</option>
                    <option value="15">15 min • Standard</option>
                    <option value="20">20 min • Moderate</option>
                    <option value="30">30 min • Longer prep (hardware)</option>
                    <option value="45">45 min • Extended</option>
                    <option value="60">60 min • Maximum</option>
                  </select>
                </div>
                
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Pause size={14} /> Shop status
                  </label>
                  <select className="form-select" value={form.isPaused ? 'Paused' : 'Active'} onChange={e=>setForm({...form, isPaused: e.target.value==='Paused'})} style={{ borderRadius: 8 }}>
                    <option value="Active">Active • Accepting orders</option>
                    <option value="Paused">Paused • Not accepting new orders</option>
                  </select>
                </div>
              </div>
              
              <div style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 16, background: 'var(--surface-muted)' }}>
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8 }}>Shop Pause - Online/Offline per point 58,59</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12 }}>Physical shop remains open, but you can pause online orders, reservations, pickup, delivery separately. Real operational need: shopkeeper busy, inventory check, lunch break.</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }} className="form-grid">
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                    <input type="checkbox" checked={form.isOnlineOrdersPaused} onChange={e=>setForm({...form, isOnlineOrdersPaused: e.target.checked})} />
                    Pause all online orders
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                    <input type="checkbox" checked={form.isReservationsPaused} onChange={e=>setForm({...form, isReservationsPaused: e.target.checked})} />
                    Pause reservations
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                    <input type="checkbox" checked={form.isPickupPaused} onChange={e=>setForm({...form, isPickupPaused: e.target.checked})} />
                    Pause pickup
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                    <input type="checkbox" checked={form.isDeliveryPaused} onChange={e=>setForm({...form, isDeliveryPaused: e.target.checked})} />
                    Pause delivery
                  </label>
                </div>
                <div style={{ marginTop: 12 }}>
                  <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Pause reason (customer sees)</label>
                  <input value={form.pauseReason} onChange={e=>setForm({...form, pauseReason: e.target.value})} placeholder="e.g. Stock checking, lunch break, busy" style={{ width: '100%', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 10px', fontSize: 13, marginTop: 4 }} />
                </div>
                <button onClick={handlePauseToggle} disabled={pauseLoading} style={{ marginTop: 12, background: 'black', color: 'white', borderRadius: 8, padding: '8px 14px', fontSize: 12, fontWeight: 600 }}>
                  {pauseLoading ? 'Updating...' : 'Update pause status'}
                </button>
              </div>

              <div style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 16, background: 'white' }}>
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8 }}>Digital Bazar Real Local Market Settings per points 13,18,33</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }} className="form-grid">
                  <div>
                    <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Service radius km (delivery)</label>
                    <input type="number" value={form.serviceRadiusKm} onChange={e=>setForm({...form, serviceRadiusKm: parseFloat(e.target.value)||0})} style={{ width: '100%', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 10px', fontSize: 13, marginTop: 4 }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Min order paise (e.g. 10000 = ₹100)</label>
                    <input type="number" value={form.minOrderPaise} onChange={e=>setForm({...form, minOrderPaise: parseInt(e.target.value)||0})} style={{ width: '100%', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 10px', fontSize: 13, marginTop: 4 }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Delivery fee paise</label>
                    <input type="number" value={form.deliveryFeePaise} onChange={e=>setForm({...form, deliveryFeePaise: parseInt(e.target.value)||0})} style={{ width: '100%', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 10px', fontSize: 13, marginTop: 4 }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Price parity mode</label>
                    <select value={form.priceParityMode} onChange={e=>setForm({...form, priceParityMode: e.target.value})} style={{ width: '100%', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 10px', fontSize: 13, marginTop: 4 }}>
                      <option value="SAME">Same as offline</option>
                      <option value="DIFFERENT">Different (online extra)</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Reservation expiry minutes (e.g. 120 = 2h, until 6:30 PM logic)</label>
                    <input type="number" value={form.reservationExpiryMin} onChange={e=>setForm({...form, reservationExpiryMin: parseInt(e.target.value)||120})} style={{ width: '100%', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 10px', fontSize: 13, marginTop: 4 }} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input type="checkbox" checked={form.isReservationEnabled} onChange={e=>setForm({...form, isReservationEnabled: e.target.checked})} />
                    <label style={{ fontSize: 13 }}>Enable reservations (Reserve Before You Go)</label>
                  </div>
                </div>
              </div>

              <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ borderRadius: 8, marginTop: 8, padding: '12px 20px', fontWeight: 600 }}>
                <Save size={16} />
                {saving ? 'Saving...' : 'Save settings'}
              </button>
            </div>
          </div>
        </>
      )}
          <style>{`
        @media (max-width: 768px) {
          .form-grid, .form-grid-3 {
            grid-template-columns: 1fr !important;
          }
        }
        @media (max-width: 640px) {
          .card-body {
            padding: 16px !important;
          }
          div[style*="maxWidth: 640"] {
            max-width: 100% !important;
          }
        }
        @media (max-width: 375px) {
          div[style*="maxWidth: 640"] {
            padding-left: 0 !important;
            padding-right: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}
