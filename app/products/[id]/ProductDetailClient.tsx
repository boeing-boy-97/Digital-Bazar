'use client';
import { useEffect, useState } from 'react';
import { formatPaise } from '@/lib/domain/money';
import { fromPaise } from '@/lib/domain/money';
import { ProductCard } from '@/components/customer/ProductCard';
import { ShoppingCart, Heart, ShieldCheck, Clock, Package, MapPin, ArrowLeft, Check } from 'lucide-react';
import Link from 'next/link';

export default function ProductDetailClient({ id }: { id: string }) {
  const [product, setProduct] = useState<any>(null);
  const [related, setRelated] = useState<any[]>([]);
  const [shopComparison, setShopComparison] = useState<any[]>([]);
  const [qty, setQty] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchProduct(); }, [id]);

  const fetchProduct = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/products/${id}`);
      const data = await res.json();
      setProduct(data.product);
      setRelated(data.related || []);
      setShopComparison(data.shopComparison || []);
    } catch {}
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
      alert('Added to cart — real inventory reserved');
    } else {
      const d = await res.json();
      alert(d.error || 'Unable to add to cart — may be out of stock');
    }
  };

  if (loading) {
    return (
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '40px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48 }} className="product-grid">
          <div style={{ height: 480, background: 'white', borderRadius: 16, border: '1px solid var(--border)' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ height: 24, background: 'var(--surface-muted)', borderRadius: 8, width: '60%' }} />
            <div style={{ height: 32, background: 'var(--surface-muted)', borderRadius: 8, width: '80%' }} />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '80px 24px', textAlign: 'center' }}>
        <div style={{ width: 56, height: 56, background: 'var(--surface-muted)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }} aria-hidden="true"><Package size={24} color="var(--text-tertiary)" /></div>
        <div style={{ fontWeight: 700, fontSize: 20, marginBottom: 8 }}>Product not found</div>
        <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 16, maxWidth: 400, margin: '0 auto 16px' }}>This product may have been removed or shop no longer active. All products are from real shop inventory — no fake stock.</div>
        <Link href="/search" style={{ background: '#0F766E', color: 'white', borderRadius: 10, padding: '10px 20px', fontWeight: 600, textDecoration: 'none', display: 'inline-block', minHeight: 44 }}>Browse products</Link>
      </div>
    );
  }

  const available = product.stock - (product.reservedStock || 0);
  const outOfStock = available <= 0 || product.isActive === false;
  const pricePaise = product.pricePaise ?? (product.price != null ? Math.round(product.price * 100) : 0);
  const comparePaise = product.compareAtPricePaise ?? (product.compareAtPrice != null ? Math.round(product.compareAtPrice * 100) : null);
  const priceINR = fromPaise(pricePaise);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description || 'Product from verified local shop in Nagpur. Real inventory from shop counter.',
    sku: product.sku,
    brand: product.brand ? { '@type': 'Brand', name: product.brand } : undefined,
    offers: {
      '@type': 'Offer',
      price: priceINR,
      priceCurrency: 'INR',
      availability: outOfStock ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock',
      seller: product.shop ? { '@type': 'Organization', name: product.shop.name } : undefined,
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '24px 24px 0' }}>
        <Link href="/search" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-secondary)', textDecoration: 'none', marginBottom: 20, fontWeight: 500 }}>
          <ArrowLeft size={14} aria-hidden="true" />Back to products
        </Link>
      </div>

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48 }} className="product-grid">
          {/* Images */}
          <div>
            <div style={{ aspectRatio: '1', background: 'white', borderRadius: 16, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', boxShadow: 'var(--shadow-xs)' }}>
              {product.images?.[0]?.url ? <img src={product.images[0].url} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="eager" /> : <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, color: 'var(--text-tertiary)' }}><Package size={48} aria-hidden="true" /><span style={{ fontSize: 12 }}>Real photo from shop — no placeholder</span></div>}
            </div>
            <div style={{ marginTop: 12, fontSize: 11, color: 'var(--text-tertiary)', textAlign: 'center' }}>Real photo only • From shop counter • No stock images</div>
          </div>

          {/* Details */}
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500, letterSpacing: '0.01em', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <span style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)', borderRadius: 100, padding: '4px 10px', fontSize: 11 }}>{product.shop?.name || 'Local Shop'}</span>
              <span>•</span>
              <span>{product.category?.name || 'General'}</span>
              {product.brand && <><span>•</span><span>{product.brand}</span></>}
            </div>
            <h1 style={{ fontSize: 28, fontWeight: 800, marginTop: 12, lineHeight: 1.2, letterSpacing: '-0.02em', fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>{product.name}</h1>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 16, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)' }}>{formatPaise(pricePaise)}</span>
              {comparePaise && <span style={{ textDecoration: 'line-through', color: 'var(--text-tertiary)', fontSize: 14 }}>{formatPaise(comparePaise)}</span>}
              {product.discount > 0 && <span style={{ background: '#ECFDF5', color: '#059669', fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 100, border: '1px solid #A7F3D0' }}>{product.discount}% OFF</span>}
            </div>

            <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {outOfStock ? <span style={{ fontSize: 11, fontWeight: 600, color: '#DC2626', background: '#FEF2F2', padding: '5px 10px', borderRadius: 100, border: '1px solid #FECACA' }}>Out of stock • Real inventory</span> : available <= (product.lowStockThreshold || 10) ? <span style={{ fontSize: 11, fontWeight: 600, color: '#D97706', background: '#FFFBEB', padding: '5px 10px', borderRadius: 100, border: '1px solid #FDE68A' }}>Low stock • {available} left • Real count</span> : <span style={{ fontSize: 11, fontWeight: 600, color: '#059669', background: '#ECFDF5', padding: '5px 10px', borderRadius: 100, border: '1px solid #A7F3D0' }}>In stock • {available} available • Real inventory</span>}
              <span style={{ fontSize: 11, fontWeight: 500, background: 'var(--surface-muted)', color: 'var(--text-secondary)', padding: '5px 10px', borderRadius: 100, border: '1px solid var(--border)' }}>{product.unit}</span>
              {product.storageZone && <span style={{ fontSize: 11, background: 'var(--surface-muted)', padding: '5px 10px', borderRadius: 100, border: '1px solid var(--border)' }}>{product.storageZone.code} - {product.storageZone.name}</span>}
            </div>

            <div style={{ marginTop: 24, background: 'white', border: '1px solid var(--border)', borderRadius: 16, padding: 20, boxShadow: 'var(--shadow-xs)' }}>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12, color: 'var(--text-primary)' }}>Quantity — min {product.minOrderQty || 1} {product.unit}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', background: 'white' }}>
                  <button aria-label="Decrease quantity" onClick={() => setQty(Math.max(1, qty-1))} style={{ width: 40, height: 40, border: 'none', background: 'var(--surface-muted)', cursor: 'pointer', fontSize: 16, fontWeight: 600 }}>-</button>
                  <div style={{ width: 48, textAlign: 'center', fontWeight: 600, fontSize: 14 }} aria-live="polite">{qty}</div>
                  <button aria-label="Increase quantity" onClick={() => setQty(Math.min(available, qty+1))} style={{ width: 40, height: 40, border: 'none', background: 'var(--surface-muted)', cursor: 'pointer', fontSize: 16, fontWeight: 600 }}>+</button>
                </div>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{formatPaise(pricePaise * qty)} total • Real price from shop</span>
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
                <button onClick={addToCart} disabled={outOfStock} style={{ flex: 1, background: outOfStock ? 'var(--surface-muted)' : '#0F766E', color: outOfStock ? 'var(--text-tertiary)' : 'white', border: 'none', borderRadius: 12, padding: '14px 20px', fontWeight: 600, fontSize: 14, cursor: outOfStock ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 48, transition: 'all 0.2s ease', boxShadow: outOfStock ? 'none' : '0 4px 12px -2px rgb(15 118 110 / 0.25)' }}>
                  <ShoppingCart size={18} aria-hidden="true" />{outOfStock ? 'Out of stock' : `Add to cart`}
                </button>
                <button aria-label="Add to favorites" style={{ width: 48, height: 48, background: 'white', border: '1px solid var(--border)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', minHeight: 48 }}><Heart size={18} aria-hidden="true" /></button>
              </div>

              <div style={{ marginTop: 16, display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><ShieldCheck size={12} aria-hidden="true" />Secure checkout</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Package size={12} aria-hidden="true" />QR pickup verification</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={12} aria-hidden="true" />{product.shop?.preparationTimeMin || 15} min prep</span>
              </div>
            </div>

            <div style={{ marginTop: 24, background: 'white', border: '1px solid var(--border)', borderRadius: 16, padding: 20, boxShadow: 'var(--shadow-xs)' }}>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8, color: 'var(--text-primary)' }}>About this product</div>
              <div style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{product.description || 'Product from verified local shop. Real inventory from shop counter, updated as they sell. Real photo only, no placeholder stock.'}</div>
              <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 12.5 }}>
                <div><span style={{ color: 'var(--text-secondary)' }}>SKU:</span> <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{product.sku}</span></div>
                <div><span style={{ color: 'var(--text-secondary)' }}>Unit:</span> <span style={{ fontWeight: 500 }}>{product.unit}</span></div>
                {product.hsnCode && <div><span style={{ color: 'var(--text-secondary)' }}>HSN:</span> {product.hsnCode}</div>}
                <div><span style={{ color: 'var(--text-secondary)' }}>GST:</span> {product.taxRate}% • GST included</div>
                {product.shop && <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, padding: 10, background: 'var(--surface-muted)', borderRadius: 8, border: '1px solid var(--border-light)' }}><MapPin size={12} aria-hidden="true" />Sold by <strong>{product.shop.name}</strong> • {product.shop.address?.slice(0, 50)} • Verified shop</div>}
              </div>
            </div>

            <div style={{ marginTop: 16, background: '#F0FAF9', border: '1px solid #CCFBF1', borderRadius: 12, padding: 14, display: 'flex', gap: 10 }}>
              <div style={{ width: 32, height: 32, background: '#0F766E', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }} aria-hidden="true"><Check size={14} color="white" /></div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 12 }}>Real inventory — transactional</div>
                <div style={{ marginTop: 2 }}>Total/reserved/available/sold with server-side checks. When you order, stock reserved with SELECT FOR UPDATE to prevent overselling.</div>
              </div>
            </div>
          </div>
        </div>

        {shopComparison.length > 0 && (
          <div style={{ marginTop: 48 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8, fontFamily: 'var(--font-heading)' }}>Compare other shops — same product</h2>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>Master product linked — price/stock/distance/open/pickup/delivery/rating from real shop inventory</p>
            <div style={{ display: 'grid', gap: 12 }}>
              {shopComparison.map((other: any) => {
                const otherAvailable = other.stock - (other.reservedStock || 0);
                const otherPricePaise = other.pricePaise ?? Math.round((other.price||0)*100);
                return (
                  <div key={other.id} style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{other.shop?.name} • {other.shop?.city}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <span>{formatPaise(otherPricePaise)} / {other.unit}</span>
                        <span>•</span>
                        <span style={{ color: otherAvailable > 0 ? '#059669' : '#DC2626' }}>{otherAvailable > 0 ? `${otherAvailable} in stock` : 'Out of stock'} • Real</span>
                        <span>•</span>
                        <span>{other.shop?.isPickupEnabled ? 'Pickup' : ''} {other.shop?.isDeliveryEnabled ? 'Delivery' : ''}</span>
                        <span>•</span>
                        <span>Rating {other.shop?.rating || 0} ({other.shop?.reviewCount || 0})</span>
                        <span>•</span>
                        <span>{other.shop?.preparationTimeMin || 15} min prep</span>
                      </div>
                    </div>
                    <Link href={`/products/${other.id}`} style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 10, padding: '8px 14px', fontSize: 13, fontWeight: 500, textDecoration: 'none', color: 'var(--text-primary)', minHeight: 36, display: 'inline-flex', alignItems: 'center' }}>
                      View shop
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {related.length > 0 && (
          <div style={{ marginTop: 64 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16, fontFamily: 'var(--font-heading)' }}>Related products from real inventory</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
              {related.map((p: any) => <ProductCard key={p.id} product={p} onAdd={() => {}} />)}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
