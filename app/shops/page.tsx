'use client';
import { useEffect, useState } from 'react';
import { Header } from '@/components/common/Header';
import { BottomNav } from '@/components/common/BottomNav';
import { ShopCard } from '@/components/customer/ShopCard';
import { Search, Filter } from 'lucide-react';

export default function ShopsPage() {
  const [shops, setShops] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');

  useEffect(() => {
    fetchShops();
  }, []);

  const fetchShops = async (q?: string, cat?: string) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q || search) params.set('search', q || search);
    if (cat || category) params.set('category', cat || category);
    
    const res = await fetch(`/api/shops?${params.toString()}`);
    const data = await res.json();
    setShops(data.shops || []);
    setLoading(false);
  };

  return (
    <div className="page">
      <Header />
      <main className="main-content">
        <div className="container" style={{ paddingTop: 24, paddingBottom: 80 }}>
          <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: 16 }}>Nearby Shops</h1>
          
          <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
            <div className="search-input-wrapper" style={{ flex: 1, minWidth: 200 }}>
              <Search size={16} className="search-input-icon" />
              <input
                className="search-input"
                placeholder="Search shops..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && fetchShops()}
              />
            </div>
            <select className="form-select" style={{ width: 160 }} value={category} onChange={e => { setCategory(e.target.value); fetchShops(search, e.target.value); }}>
              <option value="">All Categories</option>
              <option value="Hardware">Hardware</option>
              <option value="Plumbing">Plumbing</option>
              <option value="Paint">Paint</option>
              <option value="Electrical">Electrical</option>
              <option value="Cement">Cement</option>
              <option value="Building">Building Material</option>
            </select>
            <button className="btn btn-secondary" onClick={() => fetchShops()}><Filter size={16} /> Filter</button>
          </div>

          {loading ? (
            <div className="grid grid-3">
              {[1,2,3,4,5,6].map(i => (
                <div key={i} className="card" style={{ padding: 16 }}>
                  <div className="skeleton skeleton-title" />
                  <div className="skeleton skeleton-text" style={{ width: '80%' }} />
                  <div className="skeleton skeleton-text" style={{ width: '60%' }} />
                </div>
              ))}
            </div>
          ) : shops.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🏪</div>
              <div className="empty-state-title">No shops found</div>
              <div className="empty-state-description">Try different search or category filter</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
              {shops.map(shop => (
                <ShopCard key={shop.id} shop={{
                  id: shop.id,
                  name: shop.name,
                  slug: shop.slug,
                  category: shop.category,
                  address: shop.address,
                  rating: shop.rating,
                  reviewCount: shop.reviewCount,
                  preparationTimeMin: shop.preparationTimeMin,
                  status: shop.status,
                  distance: shop.distance,
                  isOpen: true
                }} />
              ))}
            </div>
          )}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
