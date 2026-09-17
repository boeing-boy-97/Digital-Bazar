import Link from 'next/link';
import { Star, Clock, MapPin, Package, Store, Check } from 'lucide-react';
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
  
  const getStatusConfig = () => {
    const status = shop.openStatus || (shop.isOpen ? 'Open' : 'Closed');
    if (status === 'Open') return { label: 'Open', color: '#059669', bg: '#ECFDF5', border: '#A7F3D0', dot: '#059669' };
    if (status === 'Closed') return { label: 'Closed', color: 'var(--text-tertiary)', bg: 'var(--surface-muted)', border: 'var(--border)', dot: 'var(--text-tertiary)' };
    if (status === 'Opening soon') return { label: 'Opening soon', color: '#D97706', bg: '#FFFBEB', border: '#FDE68A', dot: '#D97706' };
    if (status === 'Closing soon') return { label: 'Closing soon', color: '#D97706', bg: '#FFFBEB', border: '#FDE68A', dot: '#D97706' };
    return { label: status, color: 'var(--text-secondary)', bg: 'var(--surface-muted)', border: 'var(--border)', dot: 'var(--text-tertiary)' };
  };

  const statusConfig = getStatusConfig();

  return (
    <Link 
      href={`/shops/${shop.slug}`} 
      className="shop-card-elite" 
      style={{ 
        textDecoration: 'none',
        background: 'white',
        border: '1px solid var(--border)',
        borderRadius: 16,
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.2s cubic-bezier(0.16,1,0.3,1)',
        boxShadow: 'var(--shadow-xs)',
        minHeight: 140
      }}
    >
      <div style={{ display: 'flex', gap: 14, flex: 1, minWidth: 0 }}>
        <div style={{ 
          width: 56, 
          height: 56, 
          background: shop.logoUrl ? `url(${shop.logoUrl})` : '#E6F4F3',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          borderRadius: 12,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#0F766E',
          fontWeight: 700,
          fontSize: 14,
          border: '1px solid var(--border)',
          flexShrink: 0
        }} aria-hidden="true">
          {!shop.logoUrl && shop.name.slice(0, 2).toUpperCase()}
        </div>
        
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', minWidth: 0 }}>
            <span style={{ 
              fontWeight: 700, 
              fontSize: 15, 
              color: 'var(--text-primary)', 
              whiteSpace: 'nowrap', 
              overflow: 'hidden', 
              textOverflow: 'ellipsis',
              letterSpacing: '-0.01em',
              lineHeight: 1.2
            }}>{shop.name}</span>
            <span style={{ 
              fontSize: 11, 
              fontWeight: 600, 
              color: statusConfig.color, 
              background: statusConfig.bg, 
              border: `1px solid ${statusConfig.border}`,
              padding: '3px 8px', 
              borderRadius: 100,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              whiteSpace: 'nowrap',
              lineHeight: 1
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: statusConfig.dot, display: 'inline-block' }} aria-hidden="true"></span>
              {statusConfig.label}
            </span>
          </div>
          
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500, lineHeight: 1.3 }}>{shop.category} • Verified shop</div>
          
          <div style={{ marginTop: 6, display: 'flex', gap: 10, flexWrap: 'wrap', fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.3 }}>
            {hasRatings ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Star size={12} fill="#F59E0B" color="#F59E0B" aria-hidden="true" />
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{shop.rating.toFixed(1)}</span>
                <span>({shop.reviewCount})</span>
              </span>
            ) : (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-tertiary)' }}>
                <Star size={12} color="var(--text-tertiary)" aria-hidden="true" />
                New shop
              </span>
            )}
            
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Clock size={12} aria-hidden="true" />
              {shop.preparationTimeMin ? `${shop.preparationTimeMin} min prep` : 'Prep time varies'}
            </span>
            
            {shop.productCount !== undefined && shop.productCount > 0 && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Package size={12} aria-hidden="true" />
                {shop.productCount} products • Real photos
              </span>
            )}
            
            {hasDistance && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <MapPin size={12} aria-hidden="true" />
                {formatDistance(shop.distance!)}
              </span>
            )}
          </div>

          <div style={{ marginTop: 'auto', paddingTop: 8, display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-tertiary)', lineHeight: 1.3 }}>
            <Store size={10} aria-hidden="true" />
            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>Real shop • Real photos • No placeholder</span>
            <Check size={10} color="#059669" aria-hidden="true" />
          </div>
        </div>
      </div>
      
      <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, minWidth: 0 }}>
        <span style={{ fontSize: 12, color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1, lineHeight: 1.3, display: 'flex', alignItems: 'center', gap: 4 }}>
          <MapPin size={10} aria-hidden="true" style={{ flexShrink: 0 }} />
          {shop.address}
        </span>
        <span style={{ fontSize: 11, fontWeight: 600, color: '#0F766E', whiteSpace: 'nowrap', flexShrink: 0 }}>View shop →</span>
      </div>

      <style>{`
        .shop-card-elite:hover {
          border-color: var(--border-strong) !important;
          box-shadow: var(--shadow-md) !important;
          transform: translateY(-2px);
        }
        @media (max-width: 640px) {
          .shop-card-elite {
            padding: 14px !important;
            border-radius: 14px !important;
            min-height: 130px !important;
          }
        }
        @media (max-width: 375px) {
          .shop-card-elite {
            padding: 12px !important;
          }
        }
      `}</style>
    </Link>
  );
}
