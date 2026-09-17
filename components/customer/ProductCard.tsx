'use client';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils/helpers';
import { Plus } from 'lucide-react';

interface ProductCardProps {
  product: {
    id: string;
    name: string;
    slug: string;
    brand?: string | null;
    price: number;
    compareAtPrice?: number | null;
    stock: number;
    unit: string;
    images?: { url: string }[];
  };
  onAdd?: (id: string) => void;
}

export function ProductCard({ product, onAdd }: ProductCardProps) {
  const lowStock = product.stock > 0 && product.stock <= 10;
  const outOfStock = product.stock <= 0;
  const imageUrl = product.images?.[0]?.url;

  return (
    <div className="product-card">
      <Link href={`/products/${product.id}`}>
        <div className="product-card-image">
          {imageUrl ? (
            <img src={imageUrl} alt={product.name} />
          ) : (
            <div style={{ fontSize: '32px', color: 'var(--text-tertiary)' }}>📦</div>
          )}
        </div>
      </Link>
      <div className="product-card-body">
        <Link href={`/products/${product.id}`}>
          <div className="product-card-name">{product.name}</div>
          {product.brand && <div className="product-card-brand">{product.brand} • {product.unit}</div>}
        </Link>
        
        <div className="product-card-price">
          <span className="product-card-price-current">{formatCurrency(product.price)}</span>
          {product.compareAtPrice && product.compareAtPrice > product.price && (
            <span className="product-card-price-original">{formatCurrency(product.compareAtPrice)}</span>
          )}
        </div>

        <div className="product-card-stock">
          {outOfStock ? (
            <span className="badge badge-danger">Out of Stock</span>
          ) : lowStock ? (
            <span className="badge badge-warning">Low Stock • {product.stock} left</span>
          ) : (
            <span className="badge badge-success">In Stock • {product.stock}</span>
          )}
        </div>

        <button
          className="btn btn-primary btn-sm btn-full"
          style={{ marginTop: '10px' }}
          disabled={outOfStock}
          onClick={() => onAdd?.(product.id)}
        >
          <Plus size={14} />
          {outOfStock ? 'Unavailable' : 'Add'}
        </button>
      </div>
    </div>
  );
}
