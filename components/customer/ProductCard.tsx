'use client';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils/helpers';
import { Plus, Heart, Minus } from 'lucide-react';
import { useState } from 'react';

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    slug: string;
    brand?: string | null;
    price: number;
    compareAtPrice?: number | null;
    discount?: number | null;
    stock: number;
    reservedStock?: number;
    lowStockThreshold?: number;
    unit: string;
    category?: { name: string } | null;
    shop?: { name: string; slug: string } | null;
    shopId?: string;
    images?: { url: string }[];
    isActive?: boolean;
  };
  onAdd?: (id: string, qty?: number) => void;
  showShop?: boolean;
}

export function ProductCard({ product, onAdd, showShop = true }: ProductCardProps) {
  const [qty, setQty] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);
  
  const availableStock = product.stock - (product.reservedStock || 0);
  const lowStockThreshold = product.lowStockThreshold || 10;
  const lowStock = availableStock > 0 && availableStock <= lowStockThreshold;
  const outOfStock = availableStock <= 0 || product.isActive === false;
  const imageUrl = product.images?.[0]?.url;
  const hasRealDiscount = product.discount && product.discount > 0 && product.discount <= 100;
  const hasComparePrice = product.compareAtPrice && product.compareAtPrice > product.price;

  const handleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFavorite(!isFavorite);
    // In production: POST /api/favorites {productId}
    try {
      await fetch('/api/favorites', {
        method: isFavorite ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id })
      }).catch(() => {});
    } catch {}
  };

  return (
    <div className="product-card" style={{ 
      background: 'white', 
      border: '1px solid var(--border)', 
      borderRadius: 12, 
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      transition: 'all 0.2s',
      height: '100%'
    }}>
      <Link href={`/products/${product.id}`} style={{ textDecoration: 'none', position: 'relative' }}>
        <div style={{ 
          aspectRatio: '1', 
          background: 'var(--surface-muted)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {imageUrl ? (
            <img src={imageUrl} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, color: 'var(--text-tertiary)' }}>
              <div style={{ fontSize: '36px' }}>📦</div>
              <div style={{ fontSize: '11px' }}>No image</div>
            </div>
          )}
          
          {/* Discount badge - only when real discount exists */}
          {hasRealDiscount && !outOfStock && (
            <div style={{ position: 'absolute', top: 8, left: 8, background: 'var(--success)', color: 'white', fontSize: '11px', fontWeight: 600, padding: '4px 8px', borderRadius: 6 }}>
              {product.discount}% OFF
            </div>
          )}
          
          {/* Wishlist */}
          <button
            onClick={handleFavorite}
            style={{ position: 'absolute', top: 8, right: 8, width: 32, height: 32, borderRadius: '50%', background: 'white', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: 'var(--shadow-sm)' }}
            aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Heart size={16} fill={isFavorite ? 'var(--danger)' : 'none'} color={isFavorite ? 'var(--danger)' : 'var(--text-tertiary)'} />
          </button>

          {/* Stock overlay for out of stock */}
          {outOfStock && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ background: 'var(--text-primary)', color: 'white', fontSize: '12px', fontWeight: 600, padding: '6px 12px', borderRadius: 20 }}>Out of stock</span>
            </div>
          )}
        </div>
      </Link>
      
      <div style={{ padding: 12, display: 'flex', flexDirection: 'column', flex: 1 }}>
        {showShop && product.shop && (
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {product.shop.name}
          </div>
        )}
        
        <Link href={`/products/${product.id}`} style={{ textDecoration: 'none', flex: 1 }}>
          <div style={{ fontWeight: 500, fontSize: '14px', color: 'var(--text-primary)', lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: 36 }}>
            {product.name}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: 4, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {product.brand && <span>{product.brand}</span>}
            {product.brand && product.category && <span>•</span>}
            {product.category && <span>{product.category.name}</span>}
            <span>•</span>
            <span>{product.unit}</span>
          </div>
        </Link>
        
        <div style={{ marginTop: 8 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 700, fontSize: '16px', color: 'var(--text-primary)' }}>{formatCurrency(product.price)}</span>
            {hasComparePrice && (
              <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', textDecoration: 'line-through' }}>{formatCurrency(product.compareAtPrice!)}</span>
            )}
          </div>
          {hasComparePrice && (
            <div style={{ fontSize: '11px', color: 'var(--success)', fontWeight: 500, marginTop: 2 }}>
              Save {formatCurrency(product.compareAtPrice! - product.price)}
            </div>
          )}
        </div>

        <div style={{ marginTop: 8 }}>
          {outOfStock ? (
            <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--danger)', background: 'var(--danger-light)', padding: '3px 8px', borderRadius: 20, display: 'inline-block' }}>Out of stock</span>
          ) : lowStock ? (
            <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--warning)', background: 'var(--warning-light)', padding: '3px 8px', borderRadius: 20, display: 'inline-block' }}>Low stock • {availableStock} left</span>
          ) : (
            <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--success)', background: 'var(--success-light)', padding: '3px 8px', borderRadius: 20, display: 'inline-block' }}>In stock</span>
          )}
        </div>

        <div style={{ marginTop: 10, display: 'flex', gap: 8, alignItems: 'center' }}>
          {!outOfStock && (
            <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
              <button 
                onClick={(e) => { e.preventDefault(); setQty(Math.max(1, qty - 1)); }}
                style={{ width: 28, height: 32, border: 'none', background: 'var(--surface-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                aria-label="Decrease quantity"
              >
                <Minus size={12} />
              </button>
              <span style={{ width: 32, textAlign: 'center', fontSize: '13px', fontWeight: 500 }}>{qty}</span>
              <button 
                onClick={(e) => { e.preventDefault(); setQty(Math.min(availableStock, qty + 1)); }}
                style={{ width: 28, height: 32, border: 'none', background: 'var(--surface-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                aria-label="Increase quantity"
                disabled={qty >= availableStock}
              >
                <Plus size={12} />
              </button>
            </div>
          )}
          
          <button
            style={{ 
              flex: 1, 
              background: outOfStock ? 'var(--surface-muted)' : 'var(--brand)', 
              color: outOfStock ? 'var(--text-tertiary)' : 'white', 
              border: 'none', 
              borderRadius: 8, 
              padding: '8px 12px', 
              fontSize: '13px', 
              fontWeight: 600, 
              cursor: outOfStock ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6
            }}
            disabled={outOfStock}
            onClick={() => onAdd?.(product.id, qty)}
            aria-label={outOfStock ? 'Out of stock' : `Add ${qty} ${product.unit} of ${product.name} to cart`}
          >
            <Plus size={14} />
            {outOfStock ? 'Unavailable' : 'Add'}
          </button>
        </div>
      </div>
    </div>
  );
}
