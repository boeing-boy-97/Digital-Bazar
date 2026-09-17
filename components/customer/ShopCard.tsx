import Link from 'next/link';
import { Star, Clock, MapPin, Package } from 'lucide-react';
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
    openStatus?: string;
    distance?: number;
    preparationTimeMin: number;
    logoUrl?: string | null;
    status: string;
    productCount?: number;
  };
}

export function ShopCard({ shop }: ShopCardProps) {
  const hasRatings = shop.reviewCount > 0 && shop.rating > 0;
  const hasDistance = shop.distance !== undefined && shop.distance !== null && shop.distance < 999;
  
  // Real open status - not defaulting to true
  const getStatusConfig = () => {
    const status = shop.openStatus || (shop.isOpen ? 'Open' : 'Closed');
    
    if (status === 'Open') return { label: 'Open', color: 'var(--success)', bg: 'var(--success-light)', dot: 'var(--success)' };
    if (status === 'Closed') return { label: 'Closed', color: 'var(--text-tertiary)', bg: 'var(--surface-muted)', dot: 'var(--text-tertiary)' };
    if (status === 'Opening soon') return { label: 'Opening soon', color: 'var(--warning)', bg: 'var(--warning-light)', dot: 'var(--warning)' };
    if (status === 'Closing soon') return { label: 'Closing soon', color: 'var(--warning)', bg: 'var(--warning-light)', dot: 'var(--warning)' };
    if (status === 'Temporarily unavailable') return { label: 'Temporarily unavailable', color: 'var(--warning)', bg: 'var(--warning-light)', dot: 'var(--warning)' };
    return { label: status, color: 'var(--text-secondary)', bg: 'var(--surface-muted)', dot: 'var(--text-tertiary)' };
  };

  const statusConfig = getStatusConfig();
  const isActuallyOpen = shop.isOpen === true;

  return (
    <Link href={`/shops/${shop.slug}`} className="shop-card" style={{ textDecoration: 'none' }}>
      <div className="shop-card-header">
        <div className="shop-card-logo" style={{ 
          background: shop.logoUrl ? `url(${shop.logoUrl})` : 'var(--brand-light)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          color: 'var(--brand)',
          fontWeight: 700,
          fontSize: '14px'
        }}>
          {!shop.logoUrl && shop.name.slice(0, 2).toUpperCase()}
        </div>
        <div className="shop-card-info" style={{ flex: 1, minWidth: 0 }}>
          <div className="shop-card-name" style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 600, fontSize: '15px', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{shop.name}</span>
            <span style={{ 
              fontSize: '11px', 
              fontWeight: 500, 
              color: statusConfig.color, 
              background: statusConfig.bg, 
              padding: '2px 8px', 
              borderRadius: 20,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              whiteSpace: 'nowrap'
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: statusConfig.dot, display: 'inline-block' }}></span>
              {statusConfig.label}
            </span>
          </div>
          <div className="shop-card-category" style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: 2 }}>{shop.category}</div>
          <div className="shop-card-meta" style={{ marginTop: 8, display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: '12px', color: 'var(--text-secondary)' }}>
            {hasRatings ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <Star size={12} fill="#F59E0B" color="#F59E0B" />
                <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{shop.rating.toFixed(1)}</span>
                <span>({shop.reviewCount})</span>
              </span>
            ) : (
              <span style={{ display: 'flex', alignItems: 'center', gap: 3, color: 'var(--text-tertiary)' }}>
                <Star size={12} color="var(--text-tertiary)" />
                No ratings yet
              </span>
            )}
            
            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <Clock size={12} />
              {shop.preparationTimeMin ? `${shop.preparationTimeMin} min prep` : 'Prep time varies'}
            </span>
            
            {shop.productCount !== undefined && shop.productCount > 0 && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <Package size={12} />
                {shop.productCount} products
              </span>
            )}
            
            {hasDistance && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <MapPin size={12} />
                {formatDistance(shop.distance!)}
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="shop-card-footer" style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '12px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '70%' }}>
          {shop.address}
        </span>
        {!isActuallyOpen && shop.openStatus && (
          <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{shop.openStatus !== 'Closed' ? shop.openStatus : ''}</span>
        )}
      </div>
    </Link>
  );
}
