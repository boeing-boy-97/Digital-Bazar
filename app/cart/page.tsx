'use client';
import { useEffect, useState } from 'react';
import { EliteHeader } from '@/components/layout/EliteHeader';
import { EliteFooter } from '@/components/layout/EliteFooter';
import { formatCurrency } from '@/lib/utils/helpers';
import { Trash2, Plus, Minus, ShoppingBag, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function CartPage() {
  const [carts, setCarts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState<string | null>(null);

  useEffect(() => { fetchCarts(); }, []);

  const fetchCarts = async () => {
    setLoading(true);
    const res = await fetch('/api/cart');
    const data = await res.json();
    setCarts(data.carts || []);
    setLoading(false);
    const total = (data.carts || []).reduce((sum: number, c: any) => sum + c.items.reduce((s: number, i: any) => s + i.quantity, 0), 0);
    localStorage.setItem('db_cart_count', total.toString());
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
      if (!res.ok) throw new Error(data.error?.message || data.error || 'Failed');
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
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '40px 24px' }}>Loading cart...</div>
      </div>
    );
  }

  if (carts.length === 0) {
    return (
      <div style={{ background: 'var(--background)', minHeight: '100vh' }}>
        <EliteHeader />
        <main style={{ padding: '80px 24px', maxWidth: 640, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, background: 'white', border: '1px solid var(--border)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}><ShoppingBag size={28} color="var(--text-tertiary)" /></div>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 8px' }}>Your cart is empty</h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24 }}>Browse shops and add products to cart. Order ahead and collect when ready.</p>
          <Link href="/shops" style={{ background: 'var(--brand)', color: 'white', borderRadius: 12, padding: '12px 24px', fontWeight: 600, fontSize: 14, textDecoration: 'none', display: 'inline-block' }}>Browse Shops</Link>
        </main>
        <EliteFooter />
      </div>
    );
  }

  return (
    <div style={{ background: 'var(--background)', minHeight: '100vh' }}>
      <EliteHeader />
      <main style={{ padding: '32px 0 80px' }}>
        <div style={{ maxWidth: 960, margin: '0 auto', padding: '0 24px' }}>
          <Link href="/shops" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-secondary)', textDecoration: 'none', marginBottom: 20 }}><ArrowLeft size={14} />Continue shopping</Link>
          <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em', margin: '0 0 24px', fontFamily: 'var(--font-heading)' }}>Shopping cart</h1>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {carts.map(cart => {
              const totals = calcTotals(cart.items);
              return (
                <div key={cart.id} style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
                  <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{cart.items[0]?.product?.shop?.name || 'Shop Cart'} • {cart.items.length} items</div>
                    <button onClick={async () => { await fetch(`/api/cart/add?cartId=${cart.id}`, { method: 'DELETE' }); fetchCarts(); }} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 12px', fontSize: 12, cursor: 'pointer' }}>Clear</button>
                  </div>
                  <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {cart.items.map((item: any) => (
                      <div key={item.id} style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                        <div style={{ width: 56, height: 56, background: 'var(--surface-muted)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '1px solid var(--border)' }}>
                          {item.product.images?.[0] ? <img src={item.product.images[0].url} alt={item.product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '📦'}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 500, fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.product.name}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{item.product.brand} • {formatCurrency(item.product.price)} / {item.product.unit}</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
                          <button onClick={() => updateQty(item.id, item.quantity - 1)} style={{ width: 32, height: 32, border: 'none', background: 'var(--surface-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Minus size={12} /></button>
                          <div style={{ width: 32, textAlign: 'center', fontSize: 13, fontWeight: 600 }}>{item.quantity}</div>
                          <button onClick={() => updateQty(item.id, item.quantity + 1)} style={{ width: 32, height: 32, border: 'none', background: 'var(--surface-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Plus size={12} /></button>
                        </div>
                        <div style={{ width: 80, textAlign: 'right', fontWeight: 600, fontSize: 14 }}>{formatCurrency(item.product.price * item.quantity)}</div>
                        <button onClick={() => removeItem(item.id)} style={{ width: 32, height: 32, border: '1px solid var(--border)', background: 'white', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Trash2 size={14} color="var(--text-tertiary)" /></button>
                      </div>
                    ))}
                  </div>
                  <div style={{ padding: 20, background: 'var(--surface-muted)', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}><span>Subtotal</span><span>{formatCurrency(totals.subtotal)}</span></div>
                    {totals.discount > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--success)' }}><span>Discount</span><span>-{formatCurrency(totals.discount)}</span></div>}
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}><span>Tax</span><span>{formatCurrency(totals.tax)}</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 16, paddingTop: 8, borderTop: '1px solid var(--border)' }}><span>Total</span><span>{formatCurrency(totals.total)}</span></div>
                    <button onClick={() => placeOrder(cart.shopId)} disabled={placing === cart.shopId} style={{ marginTop: 12, background: 'var(--brand)', color: 'white', border: 'none', borderRadius: 12, padding: '14px', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>{placing === cart.shopId ? 'Placing...' : `Place Order • ${formatCurrency(totals.total)}`}</button>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', textAlign: 'center' }}>Shop will prepare while you travel • Pay at store or online</div>
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
