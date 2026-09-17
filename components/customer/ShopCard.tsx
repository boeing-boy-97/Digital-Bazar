import Link from 'next/link';
import { Star, Clock, MapPin } from 'lucide-react';
import { formatDistance } from '@/lib/utils/helpers';

interface ShopCardProps {
  shop: {
    id: string;
    name: string;
    slug: string;
    category: string;
    address: string;
    rating: number;
    reviewCount: number;
    isOpen?: boolean;
    distance?: number;
    preparationTimeMin: number;
    logoUrl?: string | null;
    status: string;
  };
}

export function ShopCard({ shop }: ShopCardProps) {
  // Real data only - if no ratings, show empty state not fake 4.5
  const hasRatings = shop.reviewCount > 0;
  
  return (
    <Link href={`/shops/${shop.slug}`} className="shop-card">
      <div className="shop-card-header">
        <div className="shop-card-logo">
          {shop.name.slice(0, 2).toUpperCase()}
        </div>
        <div className="shop-card-info">
          <div className="shop-card-name">{shop.name}</div>
          <div className="shop-card-category">{shop.category}</div>
          <div className="shop-card-meta">
            <span className="flex items-center gap-1">
              <Star size={12} fill={hasRatings ? "#F59E0B" : "none"} color={hasRatings ? "#F59E0B" : "#CBD5E1"} />
              {hasRatings ? `${shop.rating.toFixed(1)} (${shop.reviewCount})` : 'No ratings yet'}
            </span>
            <span className="flex items-center gap-1">
              <Clock size={12} />
              {shop.preparationTimeMin} min prep
            </span>
            {shop.distance !== undefined && shop.distance !== null ? (
              <span className="flex items-center gap-1">
                <MapPin size={12} />
                {formatDistance(shop.distance)}
              </span>
            ) : null}
          </div>
        </div>
      </div>
      <div className="shop-card-footer">
        <span className={`badge ${shop.isOpen !== false ? 'badge-success' : 'badge-danger'}`}>
          {shop.isOpen !== false ? 'Open' : 'Closed'}
        </span>
        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
          {shop.address.slice(0, 30)}...
        </span>
      </div>
    </Link>
  );
}
