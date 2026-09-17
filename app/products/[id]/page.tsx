'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Header } from '@/components/common/Header';
import { BottomNav } from '@/components/common/BottomNav';
import { formatCurrency } from '@/lib/utils/helpers';
import { ProductCard } from '@/components/customer/ProductCard';
import { ShoppingCart, Heart, Share2 } from 'lucide-react';

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

  if (loading) return <div className="page"><Header /><main className="main-content"><div className="container" style={{ paddingTop: 24 }}>Loading...</div></main></div>;
  if (!product) return <div>Product not found</div>;

  return (
    <div className="page">
      <Header />
      <main className="main-content">
        <div className="container" style={{ paddingTop: 24, paddingBottom: 80 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
            <div>
              <div style={{ aspectRatio: '1', background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                {product.images?.[0]?.url ? <img src={product.images[0].url} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ fontSize: 64 }}>📦</div>}
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                {[1,2,3].map(i=><div key={i} style={{ width: 60, height: 60, background: 'var(--surface-muted)', borderRadius: 8, border: '1px solid var(--border)' }} />)}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{product.shop.name} • {product.category?.name || 'General'}</div>
              <h1 style={{ fontSize: '28px', fontWeight: 700, marginTop: 8, lineHeight: 1.2 }}>{product.name}</h1>
              {product.brand && <div style={{ marginTop: 8, fontSize: '14px' }}><span style={{ color: 'var(--text-secondary)' }}>Brand:</span> <span style={{ fontWeight: 500 }}>{product.brand}</span></div>}
              
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 16 }}>
                <span style={{ fontSize: '28px', fontWeight: 700 }}>{formatCurrency(product.price)}</span>
                {product.compareAtPrice && <span style={{ textDecoration: 'line-through', color: 'var(--text-tertiary)' }}>{formatCurrency(product.compareAtPrice)}</span>}
                {product.discount ? <span className="badge badge-success">{product.discount}% OFF</span> : null}
              </div>

              <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
                {product.stock <=0 ? <span className="badge badge-danger">Out of Stock</span> : product.stock <= product.lowStockThreshold ? <span className="badge badge-warning">Low Stock • {product.stock} left</span> : <span className="badge badge-success">In Stock • {product.stock} available</span>}
                <span className="badge badge-neutral">{product.unit}</span>
                {product.storageZone && <span className="badge badge-info">{product.storageZone.code} - {product.storageZone.name}</span>}
              </div>

              <div style={{ marginTop: 24 }}>
                <div style={{ fontWeight: 600, marginBottom: 8 }}>Quantity</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div className="quantity-selector">
                    <button className="quantity-btn" onClick={()=>setQty(Math.max(1, qty-1))}>-</button>
                    <div className="quantity-value">{qty}</div>
                    <button className="quantity-btn" onClick={()=>setQty(Math.min(product.stock, qty+1))}>+</button>
                  </div>
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Min: {product.minOrderQty} {product.unit}</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                <button className="btn btn-primary btn-lg" style={{ flex: 1 }} onClick={addToCart} disabled={product.stock<=0}><ShoppingCart size={18} /> Add to Cart • {formatCurrency(product.price*qty)}</button>
                <button className="btn btn-secondary btn-lg"><Heart size={18} /></button>
                <button className="btn btn-secondary btn-lg"><Share2 size={18} /></button>
              </div>

              <div className="card" style={{ marginTop: 24 }}>
                <div className="card-body">
                  <div style={{ fontWeight: 600, marginBottom: 8 }}>Product Details</div>
                  <div style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    {product.description || 'High quality product suitable for construction and home improvement. Durable and reliable for professional use.'}
                  </div>
                  <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: '13px' }}>
                    <div><span style={{ color: 'var(--text-secondary)' }}>SKU:</span> {product.sku}</div>
                    <div><span style={{ color: 'var(--text-secondary)' }}>Unit:</span> {product.unit}</div>
                    {product.size && <div><span style={{ color: 'var(--text-secondary)' }}>Size:</span> {product.size}</div>}
                    {product.weight && <div><span style={{ color: 'var(--text-secondary)' }}>Weight:</span> {product.weight}</div>}
                    {product.hsnCode && <div><span style={{ color: 'var(--text-secondary)' }}>HSN:</span> {product.hsnCode}</div>}
                    <div><span style={{ color: 'var(--text-secondary)' }}>Tax:</span> {product.taxRate}% GST</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {related.length>0 && (
            <div style={{ marginTop: 48 }}>
              <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: 16 }}>Related Products</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
                {related.map((p:any)=><ProductCard key={p.id} product={p} onAdd={()=>{}} />)}
              </div>
            </div>
          )}
        </div>
      </main>
      <BottomNav />
      <style>{`@media(max-width: 768px){ div[style*="grid-template-columns: 1fr 1fr"]{ grid-template-columns: 1fr !important; } }`}</style>
    </div>
  );
}
