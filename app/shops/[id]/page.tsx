'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Header } from '@/components/common/Header';
import { BottomNav } from '@/components/common/BottomNav';
import { ProductCard } from '@/components/customer/ProductCard';
import { Star, MapPin, Clock, Phone, Package, Search } from 'lucide-react';
import Link from 'next/link';

export default function ShopPage() {
  const params = useParams();
  const id = params.id as string;
  const [shop, setShop] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCat, setSelectedCat] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchShop();
  }, [id]);

  const fetchShop = async () => {
    setLoading(true);
    const res = await fetch(`/api/shops/${id}`);
    const data = await res.json();
    if (data.shop) {
      setShop(data.shop);
      setProducts(data.products || []);
      setCategories(data.categories || []);
    }
    setLoading(false);
  };

  const filteredProducts = products.filter(p => {
    if (selectedCat && p.category?.name !== selectedCat) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleAddToCart = async (productId: string) => {
    const res = await fetch('/api/cart/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shopId: shop.id, productId, quantity: 1 })
    });
    const data = await res.json();
    if (res.ok) {
      const count = parseInt(localStorage.getItem('db_cart_count') || '0') + 1;
      localStorage.setItem('db_cart_count', count.toString());
      window.dispatchEvent(new Event('cart-updated'));
      alert('Added to cart');
    } else {
      alert(data.error || 'Failed to add');
    }
  };

  if (loading) {
    return (
      <div className="page">
        <Header />
        <main className="main-content">
          <div className="container" style={{ paddingTop: 24 }}>
            <div className="skeleton" style={{ height: 200, borderRadius: 16 }} />
          </div>
        </main>
      </div>
    );
  }

  if (!shop) return <div>Shop not found</div>;

  return (
    <div className="page">
      <Header />
      <main className="main-content">
        <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
          <div className="container" style={{ paddingTop: 24, paddingBottom: 24 }}>
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              <div style={{ width: 80, height: 80, background: 'var(--brand-light)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, fontWeight: 700, color: 'var(--brand)' }}>
                {shop.name.slice(0,2).toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 300 }}>
                <h1 style={{ fontSize: '28px', fontWeight: 800 }}>{shop.name}</h1>
                <div style={{ display: 'flex', gap: 12, marginTop: 8, flexWrap: 'wrap', fontSize: '14px', color: 'var(--text-secondary)' }}>
                  <span className="flex items-center gap-1"><Star size={14} fill="#F59E0B" color="#F59E0B" /> {shop.rating} ({shop.reviewCount} reviews)</span>
                  <span>• {shop.category}</span>
                  <span className="flex items-center gap-1"><Clock size={14} /> {shop.preparationTimeMin} min prep</span>
                  <span className="flex items-center gap-1"><MapPin size={14} /> {shop.address}</span>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <span className="badge badge-success">Open • Pickup Available</span>
                  <span className="badge badge-neutral">{shop._count?.products || products.length} Products</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <Link href={`/cart?shop=${shop.id}`} className="btn btn-secondary">View Cart</Link>
                <button className="btn btn-primary">Contact Shop</button>
              </div>
            </div>
          </div>
        </div>

        <div className="container" style={{ paddingTop: 24, paddingBottom: 80 }}>
          <div style={{ display: 'flex', gap: 24 }}>
            {/* Sidebar */}
            <div style={{ width: 240, flexShrink: 0, display: 'none' }} className="desktop-sidebar">
              <div className="card" style={{ padding: 16, position: 'sticky', top: 80 }}>
                <div style={{ fontWeight: 600, marginBottom: 12 }}>Categories</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <button className={`btn ${!selectedCat ? 'btn-primary' : 'btn-ghost'}`} style={{ justifyContent: 'flex-start' }} onClick={() => setSelectedCat('')}>All Products</button>
                  {categories.map(cat => (
                    <button key={cat.id} className={`btn ${selectedCat === cat.name ? 'btn-primary' : 'btn-ghost'}`} style={{ justifyContent: 'flex-start' }} onClick={() => setSelectedCat(cat.name)}>
                      {cat.name} ({cat._count.products})
                    </button>
                  ))}
                </div>

                <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                  <div style={{ fontWeight: 600, marginBottom: 8 }}>Storage Zones</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {shop.storageZones?.map((z: any) => (
                      <div key={z.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                        <span>{z.code}</span>
                        <span>{z.name.split('-')[1] || z.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Products */}
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                <div className="search-input-wrapper" style={{ flex: 1 }}>
                  <Search size={16} className="search-input-icon" />
                  <input className="search-input" placeholder={`Search in ${shop.name}...`} value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <select className="form-select" style={{ width: 140 }} value={selectedCat} onChange={e => setSelectedCat(e.target.value)}>
                  <option value="">All</option>
                  {categories.map(cat => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
                {filteredProducts.map(product => (
                  <ProductCard key={product.id} product={product} onAdd={handleAddToCart} />
                ))}
              </div>

              {filteredProducts.length === 0 && (
                <div className="empty-state">
                  <div className="empty-state-icon"><Package size={32} /></div>
                  <div className="empty-state-title">No products found</div>
                  <div className="empty-state-description">Try different search or category</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <BottomNav />
      <style>{`@media(min-width: 1024px){ .desktop-sidebar{ display: block !important; } }`}</style>
    </div>
  );
}
