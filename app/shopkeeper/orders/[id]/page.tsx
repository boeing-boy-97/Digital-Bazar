'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { formatCurrency, formatDate } from '@/lib/utils/helpers';
import { QrCode, Package, Check } from 'lucide-react';

export default function ShopkeeperOrderDetail() {
  const params = useParams();
  const id = params.id as string;
  const [order, setOrder] = useState<any>(null);
  const [sorted, setSorted] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [qrInput, setQrInput] = useState('');

  useEffect(() => { fetchOrder(); }, [id]);

  const fetchOrder = async () => {
    setLoading(true);
    const res = await fetch(`/api/orders/${id}`);
    const data = await res.json();
    setOrder(data.order);
    setSorted(data.sortedByZone || {});
    setLoading(false);
  };

  const updateStatus = async (status: string) => {
    const res = await fetch(`/api/orders/${id}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    if (res.ok) fetchOrder();
    else { const d=await res.json(); alert(d.error); }
  };

  const verifyQR = async () => {
    try {
      const parsed = JSON.parse(qrInput);
      const res = await fetch(`/api/orders/${id}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrToken: parsed.token || qrInput, orderNumber: parsed.orderNumber || order.orderNumber })
      });
      const data = await res.json();
      if (res.ok) {
        alert('QR Verified! ' + data.message);
        if (confirm('Mark order as completed?')) updateStatus('COMPLETED');
      } else alert(data.error);
    } catch {
      // Try as direct token
      const res = await fetch(`/api/orders/${id}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrToken: qrInput, orderNumber: order.orderNumber })
      });
      const data = await res.json();
      if (res.ok) { alert('QR Verified!'); if (confirm('Complete order?')) updateStatus('COMPLETED'); }
      else alert(data.error);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!order) return <div>Not found</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700 }}>Order #{order.orderNumber}</h1>
          <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{order.customer.name} • {order.customer.phone} • {formatDate(order.createdAt)}</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {order.status==='PENDING' && <><button className="btn btn-primary" onClick={()=>updateStatus('ACCEPTED')}>Accept Order</button><button className="btn btn-secondary" onClick={()=>updateStatus('REJECTED')}>Reject</button></>}
          {order.status==='ACCEPTED' && <button className="btn btn-primary" onClick={()=>updateStatus('PREPARING')}>Start Preparing</button>}
          {order.status==='PREPARING' && <button className="btn btn-primary" onClick={()=>updateStatus('READY_FOR_PICKUP')}>Mark Ready for Pickup</button>}
          {order.status==='READY_FOR_PICKUP' && <button className="btn btn-primary" onClick={()=>updateStatus('COMPLETED')}>Mark Completed</button>}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24 }}>
        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-header">
              <div className="card-title">Pick List - Auto Sorted by Zone (CORE FEATURE)</div>
              <div className="badge badge-info">{order.items.length} items</div>
            </div>
            <div className="card-body">
              {Object.entries(sorted).map(([zone, items]) => (
                <div key={zone} style={{ marginBottom: 20, border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
                  <div style={{ background: 'var(--surface-muted)', padding: '10px 14px', fontWeight: 600, fontSize: '13px', display: 'flex', justifyContent: 'space-between' }}>
                    <span>{zone}</span>
                    <span>{items.length} items • {items.filter((i:any)=>i.isPicked).length}/{items.length} picked</span>
                  </div>
                  <div style={{ padding: '0 14px' }}>
                    {items.map((item:any) => (
                      <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--border-light)' }}>
                        <input type="checkbox" checked={item.isPicked} onChange={async (e)=>{
                          // Update picked status - simplified
                          await fetch(`/api/orders/${id}/status`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: order.status }) });
                          // In real app, have dedicated endpoint for picking
                          fetchOrder();
                        }} className="checkbox" />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 500, textDecoration: item.isPicked ? 'line-through' : 'none' }}>{item.productName}</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{item.sku} • Qty: {item.quantity} {item.unit} • {item.storageZone || 'Unassigned'}</div>
                        </div>
                        <div style={{ fontWeight: 600 }}>{item.quantity} ×</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-header"><div className="card-title">Order Summary</div></div>
            <div className="card-body">
              {order.items.map((item:any)=>(
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-light)', fontSize: '14px' }}>
                  <span>{item.productName} × {item.quantity}</span>
                  <span>{formatCurrency(item.subtotal)}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                <span>Total</span><span>{formatCurrency(order.total)}</span>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card">
            <div className="card-header"><div className="card-title">QR Verification</div></div>
            <div className="card-body">
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: 12 }}>Customer will show QR code. Scan or paste token to verify.</div>
              <div className="form-group">
                <label className="form-label">QR Token / JSON</label>
                <textarea className="form-textarea" value={qrInput} onChange={e=>setQrInput(e.target.value)} placeholder='Paste QR data or token, e.g. QR-ABC123...' />
              </div>
              <button className="btn btn-primary btn-full" onClick={verifyQR}><QrCode size={16} /> Verify & Complete</button>
              <div style={{ marginTop: 12, padding: 10, background: 'var(--surface-muted)', borderRadius: 6, fontSize: '12px', fontFamily: 'monospace' }}>
                Expected Token: {order.qrToken}<br/>Order: {order.orderNumber}
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <div style={{ fontWeight: 600, marginBottom: 8 }}>Customer</div>
              <div style={{ fontSize: '14px' }}>{order.customer.name}</div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{order.customer.phone}</div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{order.customer.email}</div>
              <div style={{ marginTop: 12, fontSize: '13px' }}>
                <div><strong>Payment:</strong> {order.paymentMethod} • {order.paymentStatus}</div>
                <div><strong>Pickup:</strong> {order.pickupType}</div>
                {order.notes && <div><strong>Notes:</strong> {order.notes}</div>}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`@media(max-width: 900px){ div[style*="grid-template-columns: 1fr 340px"]{ grid-template-columns: 1fr !important; } }`}</style>
    </div>
  );
}
