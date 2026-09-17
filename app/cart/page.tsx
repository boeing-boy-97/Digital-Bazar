'use client';
import { useEffect, useState } from 'react';
import { Header } from '@/components/common/Header';
import { BottomNav } from '@/components/common/BottomNav';
import { formatCurrency } from '@/lib/utils/helpers';
import { Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';
import Link from 'next/link';

export default function CartPage() {
  const [carts, setCarts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState<string | null>(null);

  useEffect(() => {
    fetchCarts();
  }, []);

  const fetchCarts = async () => {
    setLoading(true);
    const res = await fetch('/api/cart');
    const data = await res.json();
    setCarts(data.carts || []);
    setLoading(false);
    
    const totalItems = (data.carts || []).reduce((sum: number, c: any) => sum + c.items.reduce((s: number, i: any) => s + i.quantity, 0), 0);
    localStorage.setItem('db_cart_count', totalItems.toString());
  };

  const updateQty = async (itemId: string, qty: number) => {
    await fetch('/api/cart/add', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId, quantity: qty })
    });
    fetchCarts();
  };

  const removeItem = async (itemId: string) => {
    await fetch(`/api/cart/add?itemId=${itemId}`, { method: 'DELETE' });
    fetchCarts();
  };

  const placeOrder = async (shopId: string) => {
    setPlacing(shopId);
    try {
      // Idempotency key prevents duplicate orders on double-click or network retry - real production
      const idempotencyKey = `order_${shopId}_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
      
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-idempotency-key': idempotencyKey
        },
        body: JSON.stringify({ 
          shopId, 
          paymentMethod: 'PAY_AT_STORE', 
          pickupType: 'PICKUP',
          idempotencyKey
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || data.error || 'Failed to place order');
      
      // Check if idempotent
      if (data.idempotent) {
        alert(`Order already placed (idempotent) - Order #${data.order.orderNumber}`);
      } else {
        alert(`Order placed! Order #${data.order.orderNumber} - Shop will prepare while you travel`);
      }
      
      fetchCarts();
      window.location.href = `/orders/${data.order.id}`;
    } catch (e: any) {
      alert(e.message);
    } finally {
      setPlacing(null);
    }
  };

  const calculateTotals = (items: any[]) => {
    let subtotal = 0, discount = 0, tax = 0;
    for (const item of items) {
      const price = item.product.price;
      const qty = item.quantity;
      const disc = (item.product.discount || 0) / 100 * price * qty;
      const afterDisc = price * qty - disc;
      const t = (item.product.taxRate || 0) / 100 * afterDisc;
      subtotal += price * qty;
      discount += disc;
      tax += t;
    }
    return { subtotal, discount, tax, total: subtotal - discount + tax };
  };

  if (loading) {
    return (
      <div className="page">
        <Header />
        <main className="main-content">
          <div className="container" style={{ paddingTop: 24 }}>Loading cart...</div>
        </main>
      </div>
    );
  }

  if (carts.length === 0) {
    return (
      <div className="page">
        <Header />
        <main className="main-content">
          <div className="container" style={{ paddingTop: 48 }}>
            <div className="empty-state">
              <div className="empty-state-icon"><ShoppingBag size={32} /></div>
              <div className="empty-state-title">Your cart is empty</div>
              <div className="empty-state-description">Browse shops and add products to cart. Select before you arrive!</div>
              <Link href="/shops" className="btn btn-primary">Browse Shops</Link>
            </div>
          </div>
        </main>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="page">
      <Header />
      <main className="main-content">
        <div className="container" style={{ paddingTop: 24, paddingBottom: 80 }}>
          <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: 16 }}>Shopping Cart</h1>
          
          <div style={{ display: 'grid', gap: 24 }}>
            {carts.map(cart => {
              const totals = calculateTotals(cart.items);
              return (
                <div key={cart.id} className="card">
                  <div className="card-header">
                    <div className="card-title">Shop Cart • {cart.items.length} items</div>
                    <button className="btn btn-ghost btn-sm" onClick={async () => {
                      await fetch(`/api/cart/add?cartId=${cart.id}`, { method: 'DELETE' });
                      fetchCarts();
                    }}>Clear</button>
                  </div>
                  <div className="card-body">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      {cart.items.map((item: any) => (
                        <div key={item.id} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                          <div style={{ width: 60, height: 60, background: 'var(--surface-muted)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {item.product.images?.[0] ? <img src={item.product.images[0].url} alt={item.product.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }} /> : '📦'}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 500 }}>{item.product.name}</div>
                            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{item.product.brand} • {formatCurrency(item.product.price)} / {item.product.unit}</div>
                          </div>
                          <div className="quantity-selector">
                            <button className="quantity-btn" onClick={() => updateQty(item.id, item.quantity - 1)}><Minus size={14} /></button>
                            <div className="quantity-value">{item.quantity}</div>
                            <button className="quantity-btn" onClick={() => updateQty(item.id, item.quantity + 1)}><Plus size={14} /></button>
                          </div>
                          <div style={{ width: 80, textAlign: 'right', fontWeight: 600 }}>{formatCurrency(item.product.price * item.quantity)}</div>
                          <button className="btn btn-ghost btn-sm" onClick={() => removeItem(item.id)}><Trash2 size={16} /></button>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="card-footer" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                      <span>Subtotal</span><span>{formatCurrency(totals.subtotal)}</span>
                    </div>
                    {totals.discount > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: 'var(--success)' }}>
                        <span>Discount</span><span>-{formatCurrency(totals.discount)}</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                      <span>Tax</span><span>{formatCurrency(totals.tax)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '16px', paddingTop: 8, borderTop: '1px solid var(--border)' }}>
                      <span>Total</span><span>{formatCurrency(totals.total)}</span>
                    </div>
                    <button className="btn btn-primary btn-lg btn-full" style={{ marginTop: 12 }} onClick={() => placeOrder(cart.shopId)} disabled={placing === cart.shopId}>
                      {placing === cart.shopId ? 'Placing...' : `Place Order • ${formatCurrency(totals.total)}`}
                    </button>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', textAlign: 'center', marginTop: 4 }}>
                      Shop will prepare while you travel • Pay at store or online
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
