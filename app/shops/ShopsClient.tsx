'use client';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ShopCard } from '@/components/customer/ShopCard';
import { Search, X, Store, MapPin } from 'lucide-react';
import Link from 'next/link';

export default function ShopsClient({ initialParams }: { initialParams: { category?: string; sort?: string; open?: string; q?: string; pincode?: string } }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [shops, setShops] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);

  const q = searchParams.get('q') || initialParams.q || '';
  const category = searchParams.get('category') || initialParams.category || '';
  const sort = searchParams.get('sort') || initialParams.sort || 'recommended';
  const open = searchParams.get('open') || initialParams.open || '';
  const pincode = searchParams.get('pincode') || initialParams.pincode || '';

  const [localQ, setLocalQ] = useState(q);

  useEffect(() => { fetchShops(); }, []);
  useEffect(() => { applyFilters(); }, [shops, q, category, open, sort, pincode]);
  useEffect(() => { setLocalQ(q); }, [q]);

  const getOpenStatus = (shop: any) => {
    if (shop.status !== 'APPROVED') return { isOpen: false, status: 'Unavailable' };
    // Use structured business hours if available, otherwise fallback to isOpenNow from API
    if (typeof shop.isOpenNow === 'boolean') {
      return { isOpen: shop.isOpenNow, status: shop.isOpenNow ? 'Open' : 'Closed' };
    }
    // Fallback: check businessHours structured (client-side)
    try {
      const bh = shop.businessHours;
      if (bh && typeof bh === 'object') {
        // Simple check: if businessHours is object with days, assume open logic handled server-side
        // Client fallback still needs to avoid hardcoded hours - use timezone-aware check via API isOpenNow
        return { isOpen: false, status: 'Hours not available' };
      }
    } catch {}
    // Last fallback - never hardcode 9-20, use status only
    return { isOpen: false, status: shop.status === 'OPEN' ? 'Open' : 'Closed' };
  };

  const fetchShops = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/shops');
      if (!res.ok) throw new Error('Unable to load shops');
      const data = await res.json();
      let list = (data.shops || []).map((s: any) => {
        const openStatus = getOpenStatus(s);
        return { ...s, isOpen: openStatus.isOpen, openStatus: openStatus.status };
      });
      setShops(list);
      setCategories([...new Set(list.map((s: any) => s.category).filter(Boolean))] as string[]);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let f = [...shops];
    if (q) {
      const qq = q.toLowerCase();
      f = f.filter(s => s.name.toLowerCase().includes(qq) || s.category.toLowerCase().includes(qq) || s.address.toLowerCase().includes(qq));
    }
    if (category) f = f.filter(s => s.category === category);
    if (open === '1') f = f.filter(s => s.isOpen);
    if (pincode) f = f.filter(s => s.pincode?.includes(pincode) || s.address?.includes(pincode));
    if (sort === 'rating') f.sort((a, b) => b.rating - a.rating);
    else if (sort === 'products') f.sort((a, b) => (b._count?.products || 0) - (a._count?.products || 0));
    else f.sort((a, b) => { if (a.isOpen && !b.isOpen) return -1; if (!a.isOpen && b.isOpen) return 1; return b.rating - a.rating; });
    setFiltered(f);
  };

  const updateURL = (updates: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([k, v]) => {
      if (!v) params.delete(k);
      else params.set(k, v);
    });
    router.replace(`/shops?${params.toString()}`, { scroll: false });
  };

  const hasFilters = !!(q || category || open || pincode);

  return (
    <div>
      <section style={{ background: 'white', borderBottom: '1px solid var(--border)', padding: '32px 0 24px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.02em', margin: 0, fontFamily: 'var(--font-heading)', lineHeight: 1.1 }}>Verified local shops near you</h1>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 8, lineHeight: 1.5 }}>
                {filtered.length} shops • Real inventory • Real photos • {pincode ? `Pincode ${pincode}` : 'Nagpur only, for now'} • Live from database
              </p>
            </div>
          </div>

          <div style={{ marginTop: 24, background: 'var(--surface-muted)', border: '1px solid var(--border)', borderRadius: 16, padding: 16 }}>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              <form onSubmit={e => { e.preventDefault(); updateURL({ q: localQ || undefined }); }} style={{ position: 'relative', flex: 1, minWidth: 220, display: 'flex', gap: 8 }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} aria-hidden="true" />
                  <input value={localQ} onChange={e => setLocalQ(e.target.value)} placeholder="Search shops by name, category or area" aria-label="Search shops" style={{ width: '100%', padding: '10px 12px 10px 36px', borderRadius: 10, border: '1px solid var(--border)', fontSize: 14, background: 'white', outline: 'none', minHeight: 40 }} />
                </div>
                <button type="submit" style={{ background: '#0F766E', color: 'white', border: 'none', borderRadius: 10, padding: '10px 16px', fontWeight: 600, fontSize: 13, cursor: 'pointer', minHeight: 40 }}>Search</button>
              </form>
              <input value={pincode} onChange={e => updateURL({ pincode: e.target.value || undefined })} placeholder="Pincode" aria-label="Filter by pincode" style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border)', fontSize: 13, background: 'white', width: 120, minHeight: 40 }} />
              <select value={category} onChange={e => updateURL({ category: e.target.value || undefined })} aria-label="Filter by category" style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border)', fontSize: 13, background: 'white', minWidth: 160, minHeight: 40 }}>
                <option value="">All categories</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select value={sort} onChange={e => updateURL({ sort: e.target.value })} aria-label="Sort shops" style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border)', fontSize: 13, background: 'white', minHeight: 40 }}>
                <option value="recommended">Recommended</option>
                <option value="rating">Rating</option>
                <option value="products">Most products</option>
              </select>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer', background: open === '1' ? '#E6F4F3' : 'white', border: `1px solid ${open === '1' ? '#0F766E' : 'var(--border)'}`, padding: '10px 14px', borderRadius: 10, minHeight: 40 }}>
                <input type="checkbox" checked={open === '1'} onChange={e => updateURL({ open: e.target.checked ? '1' : undefined })} aria-label="Show open shops only" />Open now
              </label>
              {hasFilters && (
                <button onClick={() => router.replace('/shops', { scroll: false })} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'white', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px', fontSize: 13, cursor: 'pointer', minHeight: 40 }}><X size={14} aria-hidden="true" />Clear</button>
              )}
            </div>
            {hasFilters && <div style={{ marginTop: 12, fontSize: 12, color: 'var(--text-secondary)' }}>Filters active • {filtered.length} results • Shareable link — filters are in URL</div>}
          </div>
        </div>
      </section>

      <section style={{ padding: '32px 0 80px', background: 'var(--background)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
              {[1,2,3,4,5,6].map(i => <div key={i} style={{ height: 140, background: 'white', borderRadius: 16, border: '1px solid var(--border)' }} />)}
            </div>
          ) : error ? (
            <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 16, padding: 40, textAlign: 'center' }}>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>Unable to load shops</div>
              <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 16 }}>{error}</div>
              <button onClick={fetchShops} style={{ background: '#0F766E', color: 'white', border: 'none', borderRadius: 10, padding: '10px 20px', fontWeight: 600, cursor: 'pointer', minHeight: 44 }}>Try again</button>
            </div>
          ) : filtered.length === 0 ? (
            <>
              {shops.length === 0 ? (
                <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 16, padding: 40, textAlign: 'center', boxShadow: 'var(--shadow-xs)' }}>
                  <div style={{ width: 56, height: 56, background: 'var(--surface-muted)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }} aria-hidden="true"><Store size={24} color="var(--text-tertiary)" /></div>
                  <h2 style={{ fontWeight: 700, fontSize: 18, margin: '0 0 8px 0' }}>No shops in your area yet</h2>
                  <p style={{ fontSize: 14, color: 'var(--text-secondary)', maxWidth: 480, margin: '0 auto 20px', lineHeight: 1.5 }}>We're live in Nagpur and expanding one neighbourhood at a time. Tell us where you are and we'll message you when a shop near you joins. Real shops, real photos, no placeholders.</p>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', maxWidth: 400, margin: '0 auto' }}>
                    <input placeholder="Enter pincode" aria-label="Pincode for notification" style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border)', fontSize: 14, flex: 1, minHeight: 44 }} />
                    <button style={{ background: '#0F766E', color: 'white', border: 'none', borderRadius: 10, padding: '10px 18px', fontWeight: 600, fontSize: 13, cursor: 'pointer', minHeight: 44 }}>Notify me</button>
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 16 }}>Own a shop here? <Link href="/auth/register" style={{ color: '#0F766E', fontWeight: 600, textDecoration: 'none' }}>Get listed free — 15 min setup.</Link></p>
                </div>
              ) : (
                <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 16, padding: 40, textAlign: 'center' }}>
                  <h2 style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}>No shops match these filters</h2>
                  <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 20 }}>Try adjusting your search or clearing filters. Filters are in URL so you can share this view.</p>
                  <button onClick={() => router.replace('/shops', { scroll: false })} style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 20px', fontWeight: 500, cursor: 'pointer', minHeight: 44 }}>Clear filters</button>
                </div>
              )}
            </>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
                {filtered.map(shop => (
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
                    isOpen: shop.isOpen,
                    openStatus: shop.openStatus,
                    productCount: shop._count?.products
                  }} />
                ))}
              </div>
              <div style={{ textAlign: 'center', marginTop: 24, fontSize: 13, color: 'var(--text-secondary)' }}>Showing {filtered.length} of {shops.length} shops • Real data from database • Real photos only</div>
            </>
          )}
        </div>
      </section>
          <style>{`
        @media (max-width: 640px) {
          div[style*="gridTemplateColumns: repeat(auto-fill, minmax(320px"] {
            grid-template-columns: 1fr !important;
          }
          .shops-filters {
            flex-direction: column !important;
          }
        }
        @media (max-width: 375px) {
          div[style*="maxWidth: 1280"] {
            padding-left: 16px !important;
            padding-right: 16px !important;
          }
        }
      `}</style>
    </div>
  );
}
