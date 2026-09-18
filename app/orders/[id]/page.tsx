'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Header } from '@/components/common/Header';
import { BottomNav } from '@/components/common/BottomNav';
import { formatPaise } from '@/lib/domain/money';
import { formatDate, orderStatusColor } from '@/lib/utils/helpers';
import { QrCode, Clock, Package, CheckCircle, AlertCircle } from 'lucide-react';

export default function OrderDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [order, setOrder] = useState<any>(null);
  const [sortedByZone, setSortedByZone] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [qrData, setQrData] = useState<string>('');

  useEffect(() => {
    fetchOrder();
    // Setup SSE for realtime
    const es = new EventSource(`/api/realtime/orders?orderId=${id}`);
    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === 'order_update' && data.order) {
          setOrder((prev: any) => ({ ...prev, ...data.order }));
        }
      } catch {}
    };
    return () => es.close();
  }, [id]);

  const fetchOrder = async () => {
    setLoading(true);
    const res = await fetch(`/api/orders/${id}`);
    const data = await res.json();
    if (data.order) {
      setOrder(data.order);
      setSortedByZone(data.sortedByZone || {});
      // Generate QR display data
      setQrData(JSON.stringify({ orderNumber: data.order.orderNumber, token: data.order.qrToken, shopId: data.order.shopId }));
    }
    setLoading(false);
  };

  if (loading) return <div className="page"><Header /><main className="main-content"><div className="container" style={{ paddingTop: 24 }}>Loading...</div></main></div>;
  if (!order) return <div>Order not found</div>;

  const statusSteps = [
    { status: 'PENDING', label: 'Order Placed', icon: Package },
    { status: 'ACCEPTED', label: 'Shop Accepted', icon: CheckCircle },
    { status: 'PREPARING', label: 'Preparing', icon: Clock },
    { status: 'READY_FOR_PICKUP', label: 'Ready for Pickup', icon: QrCode },
    { status: 'COMPLETED', label: 'Completed', icon: CheckCircle },
  ];

  const currentStepIndex = statusSteps.findIndex(s => s.status === order.status);
  const isCompleted = order.status === 'COMPLETED';

  return (
    <div className="page">
      <Header />
      <main className="main-content">
        <div className="container" style={{ paddingTop: 24, paddingBottom: 80 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: 700 }}>Order #{order.orderNumber}</h1>
              <div style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: 4 }}>
                {order.shop.name} • {formatDate(order.createdAt)} • {order.pickupType}
              </div>
            </div>
            <span className={`badge badge-${orderStatusColor(order.status)}`} style={{ padding: '6px 12px', fontSize: '13px' }}>
              {order.status.replace(/_/g, ' ')}
            </span>
          </div>

          {/* Status Timeline */}
          <div className="card" style={{ marginBottom: 24 }}>
            <div className="card-body">
              <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
                <div style={{ position: 'absolute', top: 16, left: 20, right: 20, height: 2, background: 'var(--border)', zIndex: 0 }} />
                <div style={{ position: 'absolute', top: 16, left: 20, width: `${(currentStepIndex / (statusSteps.length-1))*100}%`, height: 2, background: 'var(--brand)', zIndex: 1, transition: 'width 0.5s' }} />
                {statusSteps.map((step, idx) => {
                  const done = idx <= currentStepIndex || isCompleted;
                  const current = idx === currentStepIndex;
                  return (
                    <div key={step.status} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2, flex: 1 }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: done ? 'var(--brand)' : 'var(--surface-muted)', border: current ? '2px solid var(--brand)' : '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: done ? 'white' : 'var(--text-tertiary)' }}>
                        <step.icon size={16} />
                      </div>
                      <div style={{ fontSize: '12px', fontWeight: current ? 600 : 400, marginTop: 8, textAlign: 'center', color: done ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>{step.label}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Items by Zone - only if shopkeeper view or detailed */}
              <div className="card">
                <div className="card-header">
                  <div className="card-title">Order Items • {order.items.length} products</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{formatPaise(order.totalPaise ?? Math.round((order.total||0)*100))}</div>
                </div>
                <div className="card-body">
                  {Object.keys(sortedByZone).length > 0 ? (
                    Object.entries(sortedByZone).map(([zone, items]) => (
                      <div key={zone} style={{ marginBottom: 16 }}>
                        <div style={{ fontWeight: 600, fontSize: '13px', background: 'var(--surface-muted)', padding: '6px 10px', borderRadius: 6, marginBottom: 8 }}>
                          {zone} • {items.length} items
                        </div>
                        {items.map((item: any) => (
                          <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-light)', fontSize: '14px' }}>
                            <span>{item.productName} × {item.quantity}</span>
                            <span style={{ fontWeight: 500 }}>{formatPaise(item.subtotalPaise ?? Math.round((item.subtotal||0)*100))}</span>
                          </div>
                        ))}
                      </div>
                    ))
                  ) : (
                    order.items.map((item: any) => (
                      <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border-light)' }}>
                        <div>
                          <div style={{ fontWeight: 500 }}>{item.productName}</div>
                          <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{item.sku} • {item.unit} • Qty {item.quantity}</div>
                        </div>
                        <div style={{ fontWeight: 600 }}>{formatPaise(item.subtotalPaise ?? Math.round((item.subtotal||0)*100))}</div>
                      </div>
                    ))
                  )}
                </div>
                <div className="card-footer">
                  <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 6, fontSize: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Subtotal</span><span>{formatPaise(order.subtotalPaise ?? Math.round((order.subtotal||0)*100))}</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--success)' }}><span>Discount</span><span>-{formatPaise(order.discountPaise ?? Math.round((order.discount||0)*100))}</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Tax</span><span>{formatPaise(order.taxPaise ?? Math.round((order.tax||0)*100))}</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '16px', paddingTop: 8, borderTop: '1px solid var(--border)' }}><span>Total</span><span>{formatPaise(order.totalPaise ?? Math.round((order.total||0)*100))}</span></div>
                  </div>
                </div>
              </div>

              {/* History */}
              <div className="card">
                <div className="card-header"><div className="card-title">Status History</div></div>
                <div className="card-body">
                  {order.statusHistory.map((h: any) => (
                    <div key={h.id} style={{ display: 'flex', gap: 12, padding: '8px 0', fontSize: '13px', borderBottom: '1px solid var(--border-light)' }}>
                      <div style={{ color: 'var(--text-secondary)', minWidth: 120 }}>{formatDate(h.createdAt)}</div>
                      <div>{h.fromStatus ? `${h.fromStatus} → ` : ''}<span style={{ fontWeight: 600 }}>{h.toStatus}</span>{h.reason ? ` • ${h.reason}` : ''}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* QR & Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="card">
                <div className="card-header"><div className="card-title">Pickup Verification</div></div>
                <div className="card-body" style={{ textAlign: 'center' }}>
                  <div style={{ width: 200, height: 200, background: 'var(--surface-muted)', margin: '0 auto 16px', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)' }}>
                    <div style={{ textAlign: 'center' }}>
                      <QrCode size={64} color="var(--text-secondary)" />
                      <div style={{ fontSize: '12px', marginTop: 8, fontFamily: 'monospace', wordBreak: 'break-all', padding: '0 8px' }}>{order.qrToken}</div>
                    </div>
                  </div>
                  <div style={{ fontWeight: 600, fontSize: '16px' }}>{order.orderNumber}</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: 4 }}>Show this at {order.shop.name} counter</div>
                  
                  {order.status === 'READY_FOR_PICKUP' && (
                    <div className="alert alert-success" style={{ marginTop: 16, textAlign: 'left', fontSize: '13px' }}>
                      <strong>Order Ready!</strong> Visit shop and show QR. Shopkeeper will scan to verify.
                    </div>
                  )}
                  
                  <div style={{ marginTop: 16, padding: 12, background: 'var(--surface-muted)', borderRadius: 8, textAlign: 'left', fontSize: '13px' }}>
                    <div><strong>Shop:</strong> {order.shop.name}</div>
                    <div><strong>Address:</strong> {order.shop.address}</div>
                    <div><strong>Pickup:</strong> {order.pickupType}</div>
                    <div><strong>Payment:</strong> {order.paymentMethod} • {order.paymentStatus}</div>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="card-body">
                  <div style={{ fontWeight: 600, marginBottom: 8 }}>Need Help?</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: 12 }}>Contact shop or support if order issue</div>
                  <button className="btn btn-secondary btn-full">Contact Shop</button>
                </div>
              </div>

              {order.invoice && (
                <div className="card">
                  <div className="card-body">
                    <div style={{ fontWeight: 600, marginBottom: 8 }}>Invoice</div>
                    <div style={{ fontSize: '13px', marginBottom: 12 }}>{order.invoice.invoiceNumber}</div>
                    <button className="btn btn-secondary btn-full">Download Invoice</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <BottomNav />
      <style>{`@media(max-width: 900px){ div[style*="grid-template-columns: 1fr 340px"]{ grid-template-columns: 1fr !important; } }`}</style>
    </div>
  );
}
