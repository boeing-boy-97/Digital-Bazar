'use client';
import { useEffect, useState } from 'react';
import { EliteHeader } from '@/components/layout/EliteHeader';
import { EliteFooter } from '@/components/layout/EliteFooter';
import { formatCurrency } from '@/lib/utils/helpers';
import { Trash2, Plus, Minus, ShoppingBag, ArrowLeft, Package, ShieldCheck, Clock, MapPin } from 'lucide-react';
import Link from 'next/link';

export default function CartPage() {
  const [carts, setCarts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState<string | null>(null);

  useEffect(() => { fetchCarts(); }, []);

  const fetchCarts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/cart');
      const data = await res.json();
      setCarts(data.carts || []);
      const total = (data.carts || []).reduce((sum: number, c: any) => sum + c.items.reduce((s: number, i: any) => s + i.quantity, 0), 0);
      localStorage.setItem('db_cart_count', total.toString());
      window.dispatchEvent(new Event('cart-updated'));
    } catch {}
    setLoading(false);
  };

  const updateQty = async (itemId: string, qty: number) => {
    if (qty < 1) return;
    await fetch('/api/cart/add', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ itemId, quantity: qty }) });
    fetchCarts();
  };

  const removeItem = async (itemId: string) => {
    await fetch(`/api/cart/add?itemId=${itemId}`, { method: 'DELETE' });
    fetchCarts();
  };

  const placeOrder = async (shopId: string) => {
    setPlacing(shopId);
    try {
      const key = `order_${shopId}_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
      const res = await fetch('/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-idempotency-key': key }, body: JSON.stringify({ shopId, paymentMethod: 'PAY_AT_STORE', pickupType: 'PICKUP', idempotencyKey: key }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || data.error || 'Failed to place order');
      fetchCarts();
      window.location.href = `/orders/${data.order.id}`;
    } catch (e: any) {
      alert(e.message);
    } finally {
      setPlacing(null);
    }
  };

  const calcTotals = (items: any[]) => {
    let subtotal = 0, discount = 0, tax = 0;
    for (const item of items) {
      const price = item.product.price;
      const qty = item.quantity;
      const disc = (item.product.discount || 0) / 100 * price * qty;
      const after = price * qty - disc;
      const t = (item.product.taxRate || 0) / 100 * after;
      subtotal += price * qty;
      discount += disc;
      tax += t;
    }
    return { subtotal, discount, tax, total: subtotal - discount + tax };
  };

  if (loading) {
    return (
      <div style={{ background: 'var(--background)', minHeight: '100vh' }}>
        <EliteHeader />
        <div style={{ maxWidth: 960, margin: '0 auto', padding: '40px 24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[1,2].map(i => <div key={i} style={{ height: 200, background: 'white', borderRadius: 16, border: '1px solid var(--border)' }} />)}
          </div>
        </div>
      </div>
    );
  }

  if (carts.length === 0) {
    return (
      <div style={{ background: 'var(--background)', minHeight: '100vh' }}>
        <EliteHeader />
        <main id="main-content" style={{ padding: '80px 24px', maxWidth: 640, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ width: 72, height: 72, background: 'white', border: '1px solid var(--border)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: 'var(--shadow-xs)' }} aria-hidden="true"><ShoppingBag size={28} color="var(--text-tertiary)" /></div>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 8px', fontFamily: 'var(--font-heading)' }}>Your cart is empty</h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 8, lineHeight: 1.5 }}>Browse verified local shops and add products to cart. Real inventory from shop counter, no fake stock.</p>
          <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 24 }}>One shop per order • Real inventory reserved • QR pickup verification</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/shops" style={{ background: '#0F766E', color: 'white', borderRadius: 12, padding: '12px 24px', fontWeight: 600, fontSize: 14, textDecoration: 'none', display: 'inline-block', minHeight: 44 }}>Browse shops</Link>
            <Link href="/search" style={{ background: 'white', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 12, padding: '12px 24px', fontWeight: 500, fontSize: 14, textDecoration: 'none', display: 'inline-block', minHeight: 44 }}>Search products</Link>
          </div>
        </main>
        <EliteFooter />
      </div>
    );
  }

  return (
    <div style={{ background: 'var(--background)', minHeight: '100vh' }}>
      <EliteHeader />
      <main id="main-content" style={{ padding: '32px 0 80px' }}>
        <div style={{ maxWidth: 960, margin: '0 auto', padding: '0 24px' }}>
          <Link href="/shops" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-secondary)', textDecoration: 'none', marginBottom: 20, fontWeight: 500 }}><ArrowLeft size={14} aria-hidden="true" />Continue shopping</Link>
          <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em', margin: '0 0 8px', fontFamily: 'var(--font-heading)' }}>Shopping cart</h1>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 24 }}>One shop per order • Real inventory reserved transactionally • QR pickup verification • GST invoices</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {carts.map(cart => {
              const totals = calcTotals(cart.items);
              const shopName = cart.items[0]?.product?.shop?.name || 'Shop Cart';
              return (
                <div key={cart.id} style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden', boxShadow: 'var(--shadow-xs)' }}>
                  <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface-muted)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 32, height: 32, background: 'white', border: '1px solid var(--border)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }} aria-hidden="true"><Package size={16} color="#0F766E" /></div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{shopName}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{cart.items.length} items • Real inventory • One shop per order</div>
                      </div>
                    </div>
                    <button onClick={async () => { await fetch(`/api/cart/add?cartId=${cart.id}`, { method: 'DELETE' }); fetchCarts(); }} style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 12px', fontSize: 12, cursor: 'pointer', minHeight: 36 }}>Clear cart</button>
                  </div>
                  <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {cart.items.map((item: any) => (
                      <div key={item.id} style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                        <div style={{ width: 56, height: 56, background: 'var(--surface-muted)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '1px solid var(--border)', flexShrink: 0 }}>
                          {item.product.images?.[0] ? <img src={item.product.images[0].url} alt={item.product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" /> : <Package size={20} color="var(--text-tertiary)" aria-hidden="true" />}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 500, fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--text-primary)' }}>{item.product.name}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                            <span>{item.product.brand}</span>
                            <span>•</span>
                            <span>{formatCurrency(item.product.price)} / {item.product.unit}</span>
                            <span style={{ background: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0', borderRadius: 100, padding: '2px 6px', fontSize: 10, fontWeight: 600 }}>Real stock</span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', background: 'white' }}>
                          <button aria-label="Decrease quantity" onClick={() => updateQty(item.id, item.quantity - 1)} style={{ width: 36, height: 36, border: 'none', background: 'var(--surface-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Minus size={12} aria-hidden="true" /></button>
                          <div style={{ width: 36, textAlign: 'center', fontSize: 13, fontWeight: 600 }} aria-live="polite">{item.quantity}</div>
                          <button aria-label="Increase quantity" onClick={() => updateQty(item.id, item.quantity + 1)} style={{ width: 36, height: 36, border: 'none', background: 'var(--surface-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Plus size={12} aria-hidden="true" /></button>
                        </div>
                        <div style={{ width: 80, textAlign: 'right', fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>{formatCurrency(item.product.price * item.quantity)}</div>
                        <button aria-label={`Remove ${item.product.name} from cart`} onClick={() => removeItem(item.id)} style={{ width: 36, height: 36, border: '1px solid var(--border)', background: 'white', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Trash2 size={14} color="var(--text-tertiary)" aria-hidden="true" /></button>
                      </div>
                    ))}
                  </div>
                  <div style={{ padding: 20, background: 'var(--surface-muted)', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text-secondary)' }}><span>Subtotal • Real shop price</span><span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{formatCurrency(totals.subtotal)}</span></div>
                    {totals.discount > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#059669' }}><span>Discount</span><span>-{formatCurrency(totals.discount)}</span></div>}
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text-secondary)' }}><span>Tax • GST included</span><span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{formatCurrency(totals.tax)}</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 16, paddingTop: 12, borderTop: '1px solid var(--border)', color: 'var(--text-primary)' }}><span>Total</span><span>{formatCurrency(totals.total)}</span></div>
                    
                    <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 10, padding: 12, display: 'flex', gap: 8, alignItems: 'flex-start', marginTop: 4 }}>
                      <div style={{ width: 28, height: 28, background: '#E6F4F3', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }} aria-hidden="true"><ShieldCheck size={14} color="#0F766E" /></div>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 11 }}>Secure • Transactional inventory • QR verification</div>
                        <div style={{ marginTop: 2 }}>Stock reserved with SELECT FOR UPDATE. GST invoice auto-generated. QR single-use signed token.</div>
                      </div>
                    </div>

                    <button onClick={() => placeOrder(cart.shopId)} disabled={placing === cart.shopId} style={{ marginTop: 8, background: placing === cart.shopId ? 'var(--text-tertiary)' : '#0F766E', color: 'white', border: 'none', borderRadius: 12, padding: '14px', fontWeight: 600, fontSize: 14, cursor: placing === cart.shopId ? 'not-allowed' : 'pointer', minHeight: 48, transition: 'all 0.2s ease', boxShadow: '0 4px 12px -2px rgb(15 118 110 / 0.25)' }}>{placing === cart.shopId ? 'Placing order...' : `Place order • ${formatCurrency(totals.total)} • Pickup`}</button>
                    <div style={{ fontSize: 11, color: 'var(--text-tertiary)', textAlign: 'center', lineHeight: 1.4, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={10} aria-hidden="true" />Shop prepares while you travel</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={10} aria-hidden="true" />Pay at store or online</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
      <EliteFooter />
    </div>
  );
}
