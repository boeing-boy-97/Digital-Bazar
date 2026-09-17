'use client';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { EliteHeader } from '@/components/layout/EliteHeader';
import { EliteFooter } from '@/components/layout/EliteFooter';
import { ProductCard } from '@/components/customer/ProductCard';
import { Search as SearchIcon, SlidersHorizontal } from 'lucide-react';

function SearchContent() {
  const searchParams = useSearchParams();
  const initialQ = searchParams.get('q') || searchParams.get('category') || '';
  const [query, setQuery] = useState(initialQ);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recent, setRecent] = useState<string[]>([]);
  const [filters, setFilters] = useState({ category: searchParams.get('category') || '', inStock: false });
  const [sortBy, setSortBy] = useState('relevance');

  useEffect(() => {
    const saved = localStorage.getItem('db_recent_searches');
    if (saved) try { setRecent(JSON.parse(saved)); } catch {}
    if (initialQ) doSearch(initialQ);
  }, []);

  const doSearch = async (q: string) => {
    if (!q.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ q: q.trim(), limit: '30' });
      if (filters.category) params.set('category', filters.category);
      if (filters.inStock) params.set('inStock', 'true');
      if (sortBy) params.set('sortBy', sortBy);
      const res = await fetch(`/api/products?${params.toString()}`);
      if (!res.ok) throw new Error('Search failed');
      const data = await res.json();
      setProducts(data.products || []);
      const updated = [q.trim(), ...recent.filter(s => s !== q.trim())].slice(0, 8);
      setRecent(updated);
      localStorage.setItem('db_recent_searches', JSON.stringify(updated));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
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

  return (
    <div>
      <section style={{ background: 'white', borderBottom: '1px solid var(--border)', padding: '32px 0 24px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
          <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.02em', margin: 0, fontFamily: 'var(--font-heading)' }}>Search products</h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 8 }}>Find what you need from verified local shops near you</p>

          <form onSubmit={e => { e.preventDefault(); doSearch(query); }} style={{ marginTop: 24, display: 'flex', gap: 12, maxWidth: 640 }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <SearchIcon size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
              <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search cement, pipes, medicines..." style={{ width: '100%', padding: '14px 14px 14px 44px', borderRadius: 12, border: '1px solid var(--border)', fontSize: 15, background: 'white', outline: 'none' }} />
            </div>
            <button type="submit" style={{ background: 'var(--brand)', color: 'white', border: 'none', borderRadius: 12, padding: '14px 24px', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>Search</button>
          </form>

          <div style={{ display: 'flex', gap: 12, marginTop: 20, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 500 }}><SlidersHorizontal size={16} />Filters:</div>
            <select value={filters.category} onChange={e => setFilters({ ...filters, category: e.target.value })} style={{ padding: '8px 14px', borderRadius: 10, border: '1px solid var(--border)', fontSize: 13, background: 'white' }}>
              <option value="">All categories</option>
              <option value="Building Material">Building Material</option>
              <option value="Plumbing">Plumbing</option>
              <option value="Paint">Paint</option>
              <option value="Electrical">Electrical</option>
              <option value="Hardware">Hardware</option>
              <option value="Medical">Medical</option>
            </select>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, background: filters.inStock ? 'var(--brand-light)' : 'white', border: `1px solid ${filters.inStock ? 'var(--brand)' : 'var(--border)'}`, padding: '8px 14px', borderRadius: 10, cursor: 'pointer' }}>
              <input type="checkbox" checked={filters.inStock} onChange={e => setFilters({ ...filters, inStock: e.target.checked })} />In stock only
            </label>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ padding: '8px 14px', borderRadius: 10, border: '1px solid var(--border)', fontSize: 13, background: 'white' }}>
              <option value="relevance">Most relevant</option>
              <option value="price_low">Price: Low to high</option>
              <option value="price_high">Price: High to low</option>
              <option value="rating">Highest rated</option>
            </select>
          </div>

          {recent.length > 0 && !query && (
            <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: 'var(--text-tertiary)', fontWeight: 600 }}>RECENT:</span>
              {recent.slice(0, 5).map(term => (
                <button key={term} onClick={() => { setQuery(term); doSearch(term); }} style={{ fontSize: 12, background: 'var(--surface-muted)', border: '1px solid var(--border)', borderRadius: 100, padding: '6px 12px', cursor: 'pointer' }}>{term}</button>
              ))}
            </div>
          )}
        </div>
      </section>

      <section style={{ padding: '32px 0 80px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
              {[1,2,3,4,5,6,7,8].map(i => <div key={i} style={{ height: 280, background: 'white', borderRadius: 16, border: '1px solid var(--border)' }} />)}
            </div>
          ) : error ? (
            <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 16, padding: 40, textAlign: 'center' }}>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>Unable to search</div>
              <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 16 }}>{error}</div>
              <button onClick={() => doSearch(query)} style={{ background: 'var(--brand)', color: 'white', border: 'none', borderRadius: 10, padding: '10px 20px', cursor: 'pointer' }}>Try again</button>
            </div>
          ) : products.length === 0 ? (
            <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 16, padding: 48, textAlign: 'center' }}>
              <div style={{ width: 56, height: 56, background: 'var(--surface-muted)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}><SearchIcon size={24} color="var(--text-tertiary)" /></div>
              <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}>{query ? `No products found for "${query}"` : 'Search for products'}</div>
              <div style={{ fontSize: 14, color: 'var(--text-secondary)', maxWidth: 400, margin: '0 auto 20px' }}>{query ? 'Try different keywords or browse categories. All results from real shop inventory.' : 'Enter a product name, brand, or category to find what you need.'}</div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
                {['Cement', 'PVC Pipe', 'Paint', 'Medicines'].map(t => <button key={t} onClick={() => { setQuery(t); doSearch(t); }} style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)', borderRadius: 20, padding: '8px 14px', fontSize: 13, cursor: 'pointer' }}>{t}</button>)}
              </div>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{products.length} products found {query && `for "${query}"`}</div>
                <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Real shop inventory only</div>
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

export default function SearchPage() {
  return (
    <div style={{ background: 'var(--background)', minHeight: '100vh' }}>
      <EliteHeader />
      <main>
        <Suspense fallback={<div style={{ padding: 40, textAlign: 'center' }}>Loading search...</div>}>
          <SearchContent />
        </Suspense>
      </main>
      <EliteFooter />
    </div>
  );
}
