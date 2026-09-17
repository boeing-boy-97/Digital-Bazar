'use client';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils/helpers';
import { Plus, Heart, Minus, Package } from 'lucide-react';
import { useState } from 'react';

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    slug?: string;
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
    try {
      await fetch('/api/favorites', {
        method: isFavorite ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id })
      }).catch(() => {});
    } catch {}
  };

  return (
    <div className="product-card-elite" style={{ 
      background: 'white', 
      border: '1px solid var(--border)', 
      borderRadius: 16, 
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      transition: 'all 0.2s cubic-bezier(0.16,1,0.3,1)',
      height: '100%',
      boxShadow: 'var(--shadow-xs)'
    }}>
      <Link href={`/products/${product.id}`} style={{ textDecoration: 'none', position: 'relative', display: 'block' }}>
        <div style={{ 
          aspectRatio: '1', 
          background: 'var(--surface-muted)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
          borderBottom: '1px solid var(--border-light)'
        }}>
          {imageUrl ? (
            <img 
              src={imageUrl} 
              alt={product.name} 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
              loading="lazy"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, color: 'var(--text-tertiary)', padding: 16, textAlign: 'center' }}>
              <div style={{ width: 48, height: 48, background: 'white', border: '1px solid var(--border)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }} aria-hidden="true">
                <Package size={20} />
              </div>
              <div style={{ fontSize: 11, fontWeight: 500 }}>Real photo from shop</div>
            </div>
          )}
          
          {hasRealDiscount && !outOfStock && (
            <div style={{ 
              position: 'absolute', 
              top: 10, 
              left: 10, 
              background: '#0F766E', 
              color: 'white', 
              fontSize: 11, 
              fontWeight: 700, 
              padding: '5px 9px', 
              borderRadius: 8,
              boxShadow: '0 2px 8px -2px rgb(15 118 110 / 0.3)',
              letterSpacing: '0.02em'
            }}>
              {product.discount}% OFF
            </div>
          )}
          
          <button
            onClick={handleFavorite}
            aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            style={{ 
              position: 'absolute', 
              top: 10, 
              right: 10, 
              width: 36, 
              height: 36, 
              borderRadius: 10, 
              background: 'white', 
              border: '1px solid var(--border)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              cursor: 'pointer', 
              boxShadow: 'var(--shadow-sm)',
              transition: 'all 0.2s ease'
            }}
          >
            <Heart size={16} fill={isFavorite ? '#DC2626' : 'none'} color={isFavorite ? '#DC2626' : 'var(--text-tertiary)'} aria-hidden="true" />
          </button>

          {outOfStock && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12 }}>
              <span style={{ background: 'var(--text-primary)', color: 'white', fontSize: 12, fontWeight: 600, padding: '8px 14px', borderRadius: 20, textAlign: 'center', lineHeight: 1.3 }}>Out of stock<br /><span style={{ fontSize: 10, opacity: 0.8, fontWeight: 400 }}>Real inventory</span></span>
            </div>
          )}
        </div>
      </Link>
      
      <div style={{ padding: 14, display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
        {showShop && product.shop && (
          <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 500, letterSpacing: '0.01em' }}>
            {product.shop.name} • Verified
          </div>
        )}
        
        <Link href={`/products/${product.id}`} style={{ textDecoration: 'none', flex: 1, display: 'block', minWidth: 0 }}>
          <div style={{ 
            fontWeight: 600, 
            fontSize: 14, 
            color: 'var(--text-primary)', 
            lineHeight: 1.35, 
            display: '-webkit-box', 
            WebkitLineClamp: 2, 
            WebkitBoxOrient: 'vertical', 
            overflow: 'hidden', 
            minHeight: 38,
            letterSpacing: '-0.01em',
            overflowWrap: 'break-word',
            wordBreak: 'break-word'
          }}>
            {product.name}
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 4, display: 'flex', gap: 5, flexWrap: 'wrap', alignItems: 'center', lineHeight: 1.3 }}>
            {product.brand && <span style={{ fontWeight: 500 }}>{product.brand}</span>}
            {product.brand && product.category && <span aria-hidden="true">•</span>}
            {product.category && <span>{product.category.name}</span>}
            <span aria-hidden="true">•</span>
            <span>{product.unit}</span>
          </div>
        </Link>
        
        <div style={{ marginTop: 10 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 800, fontSize: 16, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>{formatCurrency(product.price)}</span>
            {hasComparePrice && (
              <span style={{ fontSize: 12, color: 'var(--text-tertiary)', textDecoration: 'line-through' }}>{formatCurrency(product.compareAtPrice!)}</span>
            )}
          </div>
          {hasComparePrice && (
            <div style={{ fontSize: 11, color: '#059669', fontWeight: 600, marginTop: 2 }}>
              Save {formatCurrency(product.compareAtPrice! - product.price)}
            </div>
          )}
        </div>

        <div style={{ marginTop: 8 }}>
          {outOfStock ? (
            <span style={{ fontSize: 11, fontWeight: 600, color: '#DC2626', background: '#FEF2F2', padding: '4px 8px', borderRadius: 100, display: 'inline-block', border: '1px solid #FECACA' }}>Out of stock • Real count</span>
          ) : lowStock ? (
            <span style={{ fontSize: 11, fontWeight: 600, color: '#D97706', background: '#FFFBEB', padding: '4px 8px', borderRadius: 100, display: 'inline-block', border: '1px solid #FDE68A' }}>Low • {availableStock} left</span>
          ) : (
            <span style={{ fontSize: 11, fontWeight: 600, color: '#059669', background: '#ECFDF5', padding: '4px 8px', borderRadius: 100, display: 'inline-block', border: '1px solid #A7F3D0' }}>In stock • Real</span>
          )}
        </div>

        <div style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
          {!outOfStock && (
            <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', background: 'white', height: 40 }}>
              <button 
                onClick={(e) => { e.preventDefault(); setQty(Math.max(1, qty - 1)); }}
                aria-label="Decrease quantity"
                style={{ width: 36, height: 40, border: 'none', background: 'var(--surface-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <Minus size={14} aria-hidden="true" />
              </button>
              <span style={{ width: 36, textAlign: 'center', fontSize: 13, fontWeight: 600 }} aria-live="polite">{qty}</span>
              <button 
                onClick={(e) => { e.preventDefault(); setQty(Math.min(availableStock, qty + 1)); }}
                aria-label="Increase quantity"
                style={{ width: 36, height: 40, border: 'none', background: 'var(--surface-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                disabled={qty >= availableStock}
              >
                <Plus size={14} aria-hidden="true" />
              </button>
            </div>
          )}
          
          <button
            aria-label={outOfStock ? 'Out of stock' : `Add ${qty} ${product.unit} of ${product.name} to cart`}
            style={{ 
              flex: 1, 
              background: outOfStock ? 'var(--surface-muted)' : '#0F766E', 
              color: outOfStock ? 'var(--text-tertiary)' : 'white', 
              border: 'none', 
              borderRadius: 10, 
              padding: '0 14px', 
              fontSize: 13, 
              fontWeight: 600, 
              cursor: outOfStock ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              height: 40,
              transition: 'all 0.2s ease',
              boxShadow: outOfStock ? 'none' : '0 2px 8px -2px rgb(15 118 110 / 0.25)'
            }}
            disabled={outOfStock}
            onClick={() => onAdd?.(product.id, qty)}
          >
            <Plus size={14} aria-hidden="true" />
            {outOfStock ? 'Unavailable' : 'Add'}
          </button>
        </div>
      </div>

      <style>{`
        .product-card-elite:hover {
          border-color: var(--border-strong) !important;
          box-shadow: var(--shadow-md) !important;
          transform: translateY(-2px);
        }
        @media (max-width: 640px) {
          .product-card-elite {
            border-radius: 14px !important;
          }
        }
      `}</style>
    </div>
  );
}
