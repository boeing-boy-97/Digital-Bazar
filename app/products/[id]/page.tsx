'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { EliteHeader } from '@/components/layout/EliteHeader';
import { EliteFooter } from '@/components/layout/EliteFooter';
import { formatCurrency } from '@/lib/utils/helpers';
import { ProductCard } from '@/components/customer/ProductCard';
import { ShoppingCart, Heart, Share2, Star, MapPin, Clock, Package, ShieldCheck, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function ProductDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [product, setProduct] = useState<any>(null);
  const [related, setRelated] = useState<any[]>([]);
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchProduct(); }, [id]);

  const fetchProduct = async () => {
    setLoading(true);
    const res = await fetch(`/api/products/${id}`);
    const data = await res.json();
    setProduct(data.product);
    setRelated(data.related || []);
    setLoading(false);
  };

  const addToCart = async () => {
    if (!product) return;
    const res = await fetch('/api/cart/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shopId: product.shopId, productId: product.id, quantity: qty })
    });
    if (res.ok) {
      const count = parseInt(localStorage.getItem('db_cart_count') || '0') + qty;
      localStorage.setItem('db_cart_count', count.toString());
      window.dispatchEvent(new Event('cart-updated'));
      alert('Added to cart');
    } else {
      const d = await res.json();
      alert(d.error);
    }
  };

  if (loading) {
    return (
      <div style={{ background: 'var(--background)', minHeight: '100vh' }}>
        <EliteHeader />
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '40px 24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48 }}>
            <div style={{ height: 480, background: 'white', borderRadius: 16, border: '1px solid var(--border)' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ height: 24, background: 'var(--surface-muted)', borderRadius: 8, width: '60%' }} />
              <div style={{ height: 32, background: 'var(--surface-muted)', borderRadius: 8, width: '80%' }} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div style={{ background: 'var(--background)', minHeight: '100vh' }}>
        <EliteHeader />
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '80px 24px', textAlign: 'center' }}>
          <div style={{ fontWeight: 700, fontSize: 20, marginBottom: 8 }}>Product not found</div>
          <Link href="/search" style={{ color: 'var(--brand)', fontWeight: 600 }}>Browse products</Link>
        </div>
        <EliteFooter />
      </div>
    );
  }

  const available = product.stock - (product.reservedStock || 0);
  const outOfStock = available <= 0 || product.isActive === false;

  return (
    <div style={{ background: 'var(--background)', minHeight: '100vh' }}>
      <EliteHeader />

      <main style={{ paddingBottom: 80 }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '24px 24px 0' }}>
          <Link href="/search" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-secondary)', textDecoration: 'none', marginBottom: 20 }}>
            <ArrowLeft size={14} />Back to products
          </Link>
        </div>

        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48 }} className="product-grid">
            {/* Images */}
            <div>
              <div style={{ aspectRatio: '1', background: 'white', borderRadius: 16, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                {product.images?.[0]?.url ? <img src={product.images[0].url} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ fontSize: 64 }}>📦</div>}
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                {[1,2,3].map(i => <div key={i} style={{ width: 72, height: 72, background: 'white', borderRadius: 12, border: '1px solid var(--border)' }} />)}
              </div>
            </div>

            {/* Details */}
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500, letterSpacing: '0.02em' }}>{product.shop?.name || 'Local Shop'} • {product.category?.name || 'General'} {product.brand && `• ${product.brand}`}</div>
              <h1 style={{ fontSize: 28, fontWeight: 800, marginTop: 8, lineHeight: 1.2, letterSpacing: '-0.02em', fontFamily: 'var(--font-heading)' }}>{product.name}</h1>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 16 }}>
                <span style={{ fontSize: 28, fontWeight: 800 }}>{formatCurrency(product.price)}</span>
                {product.compareAtPrice && <span style={{ textDecoration: 'line-through', color: 'var(--text-tertiary)', fontSize: 14 }}>{formatCurrency(product.compareAtPrice)}</span>}
                {product.discount > 0 && <span style={{ background: 'var(--success-light)', color: 'var(--success)', fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 100 }}>{product.discount}% OFF</span>}
              </div>

              <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {outOfStock ? <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--danger)', background: 'var(--danger-light)', padding: '4px 10px', borderRadius: 100 }}>Out of stock</span> : available <= (product.lowStockThreshold || 10) ? <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--warning)', background: 'var(--warning-light)', padding: '4px 10px', borderRadius: 100 }}>Low stock • {available} left</span> : <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--success)', background: 'var(--success-light)', padding: '4px 10px', borderRadius: 100 }}>In stock • {available} available</span>}
                <span style={{ fontSize: 11, fontWeight: 500, background: 'var(--surface-muted)', color: 'var(--text-secondary)', padding: '4px 10px', borderRadius: 100, border: '1px solid var(--border)' }}>{product.unit}</span>
                {product.storageZone && <span style={{ fontSize: 11, background: 'var(--surface-muted)', padding: '4px 10px', borderRadius: 100, border: '1px solid var(--border)' }}>{product.storageZone.code} - {product.storageZone.name}</span>}
              </div>

              <div style={{ marginTop: 24, background: 'white', border: '1px solid var(--border)', borderRadius: 16, padding: 20 }}>
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>Quantity</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
                    <button onClick={() => setQty(Math.max(1, qty-1))} style={{ width: 36, height: 36, border: 'none', background: 'var(--surface-muted)', cursor: 'pointer' }}>-</button>
                    <div style={{ width: 40, textAlign: 'center', fontWeight: 600, fontSize: 14 }}>{qty}</div>
                    <button onClick={() => setQty(Math.min(available, qty+1))} style={{ width: 36, height: 36, border: 'none', background: 'var(--surface-muted)', cursor: 'pointer' }}>+</button>
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Min: {product.minOrderQty || 1} {product.unit} • {formatCurrency(product.price * qty)} total</span>
                </div>

                <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
                  <button onClick={addToCart} disabled={outOfStock} style={{ flex: 1, background: outOfStock ? 'var(--surface-muted)' : 'var(--brand)', color: outOfStock ? 'var(--text-tertiary)' : 'white', border: 'none', borderRadius: 12, padding: '14px 20px', fontWeight: 600, fontSize: 14, cursor: outOfStock ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <ShoppingCart size={18} />{outOfStock ? 'Out of stock' : `Add to cart • ${formatCurrency(product.price*qty)}`}
                  </button>
                  <button style={{ width: 48, height: 48, background: 'white', border: '1px solid var(--border)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Heart size={18} /></button>
                  <button style={{ width: 48, height: 48, background: 'white', border: '1px solid var(--border)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Share2 size={18} /></button>
                </div>

                <div style={{ marginTop: 16, display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-secondary)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><ShieldCheck size={12} />Secure checkout</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Package size={12} />QR pickup</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={12} />{product.shop?.preparationTimeMin || 15} min prep</span>
                </div>
              </div>

              <div style={{ marginTop: 24, background: 'white', border: '1px solid var(--border)', borderRadius: 16, padding: 20 }}>
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8 }}>About this product</div>
                <div style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{product.description || 'High quality product suitable for professional and home use. Durable and reliable.'}</div>
                <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 12.5 }}>
                  <div><span style={{ color: 'var(--text-secondary)' }}>SKU:</span> {product.sku}</div>
                  <div><span style={{ color: 'var(--text-secondary)' }}>Unit:</span> {product.unit}</div>
                  {product.hsnCode && <div><span style={{ color: 'var(--text-secondary)' }}>HSN:</span> {product.hsnCode}</div>}
                  <div><span style={{ color: 'var(--text-secondary)' }}>GST:</span> {product.taxRate}%</div>
                  {product.shop && <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}><MapPin size={12} />Sold by {product.shop.name} • {product.shop.address?.slice(0, 40)}</div>}
                </div>
              </div>
            </div>
          </div>

          {related.length > 0 && (
            <div style={{ marginTop: 64 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Related products</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
                {related.map((p: any) => <ProductCard key={p.id} product={p} onAdd={() => {}} />)}
              </div>
            </div>
          )}
        </div>
      </main>

      <EliteFooter />

      <style>{`
        @media (max-width: 768px) {
          .product-grid { grid-template-columns: 1fr !important; gap: 24px !important; }
        }
      `}</style>
    </div>
  );
}
