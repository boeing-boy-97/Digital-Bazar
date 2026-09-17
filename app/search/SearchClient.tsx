'use client';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ProductCard } from '@/components/customer/ProductCard';
import { Search as SearchIcon, SlidersHorizontal, X } from 'lucide-react';

export default function SearchClient({ initialParams }: { initialParams: { q?: string; category?: string; inStock?: string; sortBy?: string; pincode?: string } }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const q = searchParams.get('q') || initialParams.q || '';
  const category = searchParams.get('category') || initialParams.category || '';
  const inStock = searchParams.get('inStock') || initialParams.inStock || '';
  const sortBy = searchParams.get('sortBy') || initialParams.sortBy || 'relevance';
  const pincode = searchParams.get('pincode') || initialParams.pincode || '';

  const [localQ, setLocalQ] = useState(q);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recent, setRecent] = useState<string[]>([]);
  const [hasSearched, setHasSearched] = useState(!!q);

  useEffect(() => {
    const saved = localStorage.getItem('db_recent_searches');
    if (saved) try { setRecent(JSON.parse(saved)); } catch {}
    if (q) doSearch(q, { category, inStock, sortBy, pincode });
  }, []);

  const doSearch = async (query: string, overrides?: { category?: string; inStock?: string; sortBy?: string; pincode?: string }) => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setHasSearched(true);
    try {
      const cat = overrides?.category ?? category;
      const stock = overrides?.inStock ?? inStock;
      const sort = overrides?.sortBy ?? sortBy;
      const pin = overrides?.pincode ?? pincode;
      const params = new URLSearchParams({ q: query.trim(), limit: '30' });
      if (cat) params.set('category', cat);
      if (stock === '1' || stock === 'true') params.set('inStock', 'true');
      if (sort) params.set('sortBy', sort);
      if (pin) params.set('pincode', pin);
      const res = await fetch(`/api/products?${params.toString()}`);
      if (!res.ok) throw new Error('Search failed');
      const data = await res.json();
      setProducts(data.products || []);
      const updated = [query.trim(), ...recent.filter(s => s !== query.trim())].slice(0, 8);
      setRecent(updated);
      localStorage.setItem('db_recent_searches', JSON.stringify(updated));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const updateURL = (updates: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([k, v]) => {
      if (!v) params.delete(k);
      else params.set(k, v);
    });
    router.replace(`/search?${params.toString()}`, { scroll: false });
  };

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    updateURL({ q: localQ || undefined });
    if (localQ) doSearch(localQ);
  };

  const handleAddToCart = async (productId: string, shopId: string, qty: number = 1) => {
    try {
      const res = await fetch('/api/cart/add', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ shopId, productId, quantity: qty }) });
      if (res.ok) {
        const count = parseInt(localStorage.getItem('db_cart_count') || '0') + qty;
        localStorage.setItem('db_cart_count', count.toString());
        window.dispatchEvent(new Event('cart-updated'));
      }
    } catch {}
  };

  const hasFilters = !!(category || inStock || pincode);

  return (
    <div>
      <section style={{ background: 'white', borderBottom: '1px solid var(--border)', padding: '32px 0 24px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
          <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.02em', margin: 0, fontFamily: 'var(--font-heading)', lineHeight: 1.1 }}>Search products</h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 8, lineHeight: 1.5 }}>Find what you need from verified local shops near you. Real inventory only — no fake stock, real photos.</p>

          <form onSubmit={handleSearch} style={{ marginTop: 24, display: 'flex', gap: 12, maxWidth: 640 }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <SearchIcon size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} aria-hidden="true" />
              <input value={localQ} onChange={e => setLocalQ(e.target.value)} placeholder="Search cement, pipes, medicines..." aria-label="Search products" style={{ width: '100%', padding: '14px 14px 14px 44px', borderRadius: 12, border: '1px solid var(--border)', fontSize: 15, background: 'white', outline: 'none', minHeight: 48 }} />
            </div>
            <button type="submit" style={{ background: '#0F766E', color: 'white', border: 'none', borderRadius: 12, padding: '14px 24px', fontWeight: 600, fontSize: 14, cursor: 'pointer', minHeight: 48 }}>Search</button>
          </form>

          <div style={{ display: 'flex', gap: 12, marginTop: 20, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 500 }}><SlidersHorizontal size={16} aria-hidden="true" />Filters:</div>
            <select value={category} onChange={e => { updateURL({ category: e.target.value || undefined }); doSearch(q, { category: e.target.value, inStock, sortBy, pincode }); }} aria-label="Filter by category" style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border)', fontSize: 13, background: 'white', minHeight: 40 }}>
              <option value="">All categories</option>
              <option value="Building Material">Building Material</option>
              <option value="Plumbing">Plumbing</option>
              <option value="Paint">Paint</option>
              <option value="Electrical">Electrical</option>
              <option value="Hardware">Hardware</option>
              <option value="Medical">Medical</option>
            </select>
            <input value={pincode} onChange={e => { updateURL({ pincode: e.target.value || undefined }); }} placeholder="Pincode" aria-label="Filter by pincode" style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border)', fontSize: 13, background: 'white', width: 120, minHeight: 40 }} />
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, background: inStock ? '#E6F4F3' : 'white', border: `1px solid ${inStock ? '#0F766E' : 'var(--border)'}`, padding: '10px 14px', borderRadius: 10, cursor: 'pointer', minHeight: 40 }}>
              <input type="checkbox" checked={!!inStock} onChange={e => { const v = e.target.checked ? '1' : undefined; updateURL({ inStock: v }); doSearch(q, { category, inStock: v, sortBy, pincode }); }} aria-label="In stock only" />In stock only
            </label>
            <select value={sortBy} onChange={e => { updateURL({ sortBy: e.target.value }); doSearch(q, { category, inStock, sortBy: e.target.value, pincode }); }} aria-label="Sort products" style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border)', fontSize: 13, background: 'white', minHeight: 40 }}>
              <option value="relevance">Most relevant</option>
              <option value="price_low">Price: Low to high</option>
              <option value="price_high">Price: High to low</option>
              <option value="rating">Highest rated</option>
            </select>
            {hasFilters && <button onClick={() => { router.replace(`/search?q=${q}`, { scroll: false }); doSearch(q, { category: '', inStock: '', sortBy: 'relevance', pincode: '' }); }} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'white', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px', fontSize: 13, cursor: 'pointer', minHeight: 40 }}><X size={14} aria-hidden="true" />Clear filters</button>}
          </div>

          {recent.length > 0 && !hasSearched && (
            <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: 'var(--text-tertiary)', fontWeight: 600 }}>RECENT:</span>
              {recent.slice(0, 5).map(term => (
                <button key={term} onClick={() => { setLocalQ(term); updateURL({ q: term }); doSearch(term); }} style={{ fontSize: 12, background: 'var(--surface-muted)', border: '1px solid var(--border)', borderRadius: 100, padding: '6px 12px', cursor: 'pointer' }}>{term}</button>
              ))}
            </div>
          )}
        </div>
      </section>

      <section style={{ padding: '32px 0 80px', background: 'var(--background)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
              {[1,2,3,4,5,6,7,8].map(i => <div key={i} style={{ height: 280, background: 'white', borderRadius: 16, border: '1px solid var(--border)' }} />)}
            </div>
          ) : error ? (
            <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 16, padding: 40, textAlign: 'center' }}>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>Unable to search</div>
              <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 16 }}>{error}</div>
              <button onClick={() => doSearch(q)} style={{ background: '#0F766E', color: 'white', border: 'none', borderRadius: 10, padding: '10px 20px', cursor: 'pointer', minHeight: 44 }}>Try again</button>
            </div>
          ) : !hasSearched ? (
            <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 16, padding: 48, textAlign: 'center' }}>
              <div style={{ width: 56, height: 56, background: 'var(--surface-muted)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }} aria-hidden="true"><SearchIcon size={24} color="var(--text-tertiary)" /></div>
              <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}>Search for products</div>
              <div style={{ fontSize: 14, color: 'var(--text-secondary)', maxWidth: 400, margin: '0 auto 20px', lineHeight: 1.5 }}>Enter a product name, brand, or category to find what you need. Filters are saved in URL so you can share this view. Real inventory only.</div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
                {['Cement', 'PVC Pipe', 'Paint', 'Medicines'].map(t => <button key={t} onClick={() => { setLocalQ(t); updateURL({ q: t }); doSearch(t); }} style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)', borderRadius: 20, padding: '8px 14px', fontSize: 13, cursor: 'pointer' }}>{t}</button>)}
              </div>
            </div>
          ) : products.length === 0 ? (
            <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 16, padding: 48, textAlign: 'center' }}>
              <div style={{ width: 56, height: 56, background: 'var(--surface-muted)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }} aria-hidden="true"><SearchIcon size={24} color="var(--text-tertiary)" /></div>
              <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}>No products found for "{q}"</div>
              <div style={{ fontSize: 14, color: 'var(--text-secondary)', maxWidth: 400, margin: '0 auto 20px', lineHeight: 1.5 }}>Try different keywords, remove filters, or browse categories. All results from real shop inventory — no fake stock, real photos only.</div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
                {['Cement', 'PVC Pipe', 'Paint', 'Medicines'].map(t => <button key={t} onClick={() => { setLocalQ(t); updateURL({ q: t }); doSearch(t); }} style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)', borderRadius: 20, padding: '8px 14px', fontSize: 13, cursor: 'pointer' }}>{t}</button>)}
              </div>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{products.length} products found {q && `for "${q}"`} • Filters in URL • Shareable</div>
                <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Real shop inventory only • Real photos</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
                {products.map(p => <ProductCard key={p.id} product={p} onAdd={(id, qty) => handleAddToCart(id, p.shopId, qty)} />)}
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
