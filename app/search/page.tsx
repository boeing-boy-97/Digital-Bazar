'use client';
import { useEffect, useState, Suspense } from 'react';
import { Header } from '@/components/common/Header';
import { BottomNav } from '@/components/common/BottomNav';
import { ProductCard } from '@/components/customer/ProductCard';
import { Search as SearchIcon, Mic, Camera, Sparkles, Clock, X, Filter, SlidersHorizontal } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

function SearchContent() {
  const searchParams = useSearchParams();
  const initialQ = searchParams.get('q') || searchParams.get('category') || '';
  const [query, setQuery] = useState(initialQ);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiMode, setAiMode] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filters, setFilters] = useState({ category: '', brand: '', inStock: false, maxPrice: '' });
  const [sortBy, setSortBy] = useState('relevance');

  useEffect(() => {
    loadRecentSearches();
    if (initialQ) doSearch(initialQ);
  }, [initialQ]);

  const loadRecentSearches = () => {
    try {
      const saved = localStorage.getItem('db_recent_searches');
      if (saved) setRecentSearches(JSON.parse(saved));
    } catch {}
  };

  const saveRecentSearch = (term: string) => {
    try {
      const updated = [term, ...recentSearches.filter(s => s !== term)].slice(0, 8);
      setRecentSearches(updated);
      localStorage.setItem('db_recent_searches', JSON.stringify(updated));
    } catch {}
  };

  const doSearch = async (q: string) => {
    if (!q.trim()) return;
    
    setLoading(true);
    setError(null);
    setShowSuggestions(false);
    saveRecentSearch(q.trim());
    
    try {
      if (aiMode) {
        const res = await fetch('/api/ai/search', { 
          method: 'POST', 
          headers: { 'Content-Type': 'application/json' }, 
          body: JSON.stringify({ query: q }) 
        });
        if (!res.ok) throw new Error('Search failed');
        const data = await res.json();
        // AI search must never invent products - only return existing DB products
        setProducts(data.products || []);
        setAiResult(data);
      } else {
        const params = new URLSearchParams({ q: q.trim(), limit: '30' });
        if (filters.category) params.set('category', filters.category);
        if (filters.brand) params.set('brand', filters.brand);
        if (filters.inStock) params.set('inStock', 'true');
        if (filters.maxPrice) params.set('maxPrice', filters.maxPrice);
        if (sortBy) params.set('sortBy', sortBy);
        
        const res = await fetch(`/api/products?${params.toString()}`);
        if (!res.ok) throw new Error('Unable to search products');
        const data = await res.json();
        setProducts(data.products || []);
      }
    } catch (e: any) {
      setError(e.message);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = async (value: string) => {
    setQuery(value);
    
    if (value.trim().length >= 2) {
      // Instant suggestions from recent searches and popular terms
      const recentMatches = recentSearches.filter(s => s.toLowerCase().includes(value.toLowerCase())).slice(0, 3);
      const popular = ['Cement', 'Bricks', 'PVC Pipe', 'Paint', 'Electrical wire', 'Hardware tools']
        .filter(p => p.toLowerCase().includes(value.toLowerCase()))
        .slice(0, 3);
      
      setSuggestions([...recentMatches, ...popular].slice(0, 5));
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleVoiceSearch = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      // @ts-ignore
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-IN';
      recognition.continuous = false;
      recognition.interimResults = false;
      
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setQuery(transcript);
        doSearch(transcript);
      };
      
      recognition.onerror = () => {
        alert('Voice search failed. Please try typing your search.');
      };
      
      recognition.start();
    } else {
      alert('Voice search is not supported in this browser. Please type your search.');
    }
  };

  const handleImageSearch = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (!file) return;
      
      // In production: upload to /api/ai/vision, get attributes, search catalog
      setLoading(true);
      try {
        const formData = new FormData();
        formData.append('image', file);
        
        const res = await fetch('/api/ai/vision', {
          method: 'POST',
          body: formData
        });
        
        if (res.ok) {
          const data = await res.json();
          if (data.searchQuery) {
            setQuery(data.searchQuery);
            doSearch(data.searchQuery);
          }
          if (data.products) {
            setProducts(data.products);
          }
        } else {
          alert('Image search is being processed. Try describing what you need in the search bar.');
        }
      } catch {
        alert('Image search is currently unavailable. Please describe the product you need.');
      } finally {
        setLoading(false);
      }
    };
    input.click();
  };

  const handleAddToCart = async (productId: string, shopId: string, qty: number = 1) => {
    try {
      const res = await fetch('/api/cart/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shopId, productId, quantity: qty })
      });
      
      if (res.ok) {
        const count = parseInt(localStorage.getItem('db_cart_count') || '0') + qty;
        localStorage.setItem('db_cart_count', count.toString());
        window.dispatchEvent(new Event('cart-updated'));
      } else {
        const data = await res.json();
        alert(data.error?.message || data.error || 'Unable to add to cart. The product may be out of stock.');
      }
    } catch (e) {
      console.error('Add to cart failed', e);
    }
  };

  const clearFilters = () => {
    setFilters({ category: '', brand: '', inStock: false, maxPrice: '' });
    setSortBy('relevance');
    if (query) doSearch(query);
  };

  return (
    <div className="container" style={{ paddingTop: 24, paddingBottom: 88 }}>
      <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: 4, letterSpacing: '-0.02em' }}>Search products</h1>
      <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: 20 }}>Find what you need from local shops near you</p>
      
      {/* Search Bar - Professional */}
      <div style={{ position: 'relative', marginBottom: 16 }}>
        <form onSubmit={(e) => { e.preventDefault(); doSearch(query); }} style={{ display: 'flex', gap: 8 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <SearchIcon size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
            <input
              type="text"
              placeholder="Search for products, brands, or categories"
              value={query}
              onChange={e => handleInputChange(e.target.value)}
              onFocus={() => query.length >= 2 && setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              style={{ 
                width: '100%', 
                padding: '14px 90px 14px 44px', 
                borderRadius: 12, 
                border: '1px solid var(--border)', 
                fontSize: '15px',
                background: 'white',
                outline: 'none'
              }}
            />
            <div style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', display: 'flex', gap: 4 }}>
              <button type="button" onClick={handleVoiceSearch} style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} aria-label="Voice search">
                <Mic size={16} color="var(--text-secondary)" />
              </button>
              <button type="button" onClick={handleImageSearch} style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} aria-label="Image search">
                <Camera size={16} color="var(--text-secondary)" />
              </button>
            </div>
          </div>
          <button type="submit" className="btn btn-primary" style={{ borderRadius: 12, padding: '14px 20px', fontWeight: 600 }}>Search</button>
        </form>

        {/* Instant Suggestions */}
        {showSuggestions && suggestions.length > 0 && (
          <div style={{ position: 'absolute', top: '100%', left: 0, right: 80, background: 'white', border: '1px solid var(--border)', borderRadius: 12, marginTop: 8, boxShadow: 'var(--shadow-lg)', zIndex: 10, overflow: 'hidden' }}>
            {suggestions.map(term => (
              <button key={term} onClick={() => { setQuery(term); doSearch(term); }} style={{ width: '100%', textAlign: 'left', padding: '12px 16px', border: 'none', background: 'none', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: '14px' }}>
                <SearchIcon size={14} color="var(--text-tertiary)" />
                {term}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Filters and Sorting - Professional */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <SlidersHorizontal size={16} color="var(--text-secondary)" />
          <span style={{ fontSize: '13px', fontWeight: 500 }}>Filters:</span>
        </div>
        
        <select className="form-select" value={filters.category} onChange={e => setFilters({ ...filters, category: e.target.value })} style={{ borderRadius: 8, fontSize: '13px' }}>
          <option value="">All categories</option>
          <option value="Building Material">Building Material</option>
          <option value="Plumbing">Plumbing</option>
          <option value="Paint">Paint</option>
          <option value="Electrical">Electrical</option>
          <option value="Hardware">Hardware</option>
        </select>
        
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '13px', cursor: 'pointer', background: filters.inStock ? 'var(--brand-light)' : 'var(--surface)', padding: '8px 12px', borderRadius: 8, border: `1px solid ${filters.inStock ? 'var(--brand)' : 'var(--border)'}` }}>
          <input type="checkbox" checked={filters.inStock} onChange={e => setFilters({ ...filters, inStock: e.target.checked })} />
          In stock only
        </label>
        
        <select className="form-select" value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ borderRadius: 8, fontSize: '13px' }}>
          <option value="relevance">Most relevant</option>
          <option value="price_low">Price: Low to high</option>
          <option value="price_high">Price: High to low</option>
          <option value="rating">Highest rated</option>
          <option value="newest">Newest</option>
        </select>

        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '13px', cursor: 'pointer' }}>
          <input type="checkbox" checked={aiMode} onChange={e => setAiMode(e.target.checked)} />
          <Sparkles size={14} color="var(--brand)" />
          AI search
        </label>

        {(filters.category || filters.inStock || sortBy !== 'relevance') && (
          <button onClick={clearFilters} style={{ fontSize: '12px', color: 'var(--text-secondary)', background: 'none', border: '1px solid var(--border)', borderRadius: 20, padding: '6px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
            <X size={12} />
            Clear
          </button>
        )}
      </div>

      {/* Recent Searches */}
      {recentSearches.length > 0 && !query && !loading && products.length === 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Clock size={14} color="var(--text-tertiary)" />
            <span style={{ fontSize: '13px', fontWeight: 500 }}>Recent searches</span>
            <button onClick={() => { setRecentSearches([]); localStorage.removeItem('db_recent_searches'); }} style={{ fontSize: '11px', color: 'var(--text-tertiary)', background: 'none', border: 'none', cursor: 'pointer', marginLeft: 'auto' }}>Clear</button>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {recentSearches.map(term => (
              <button key={term} onClick={() => { setQuery(term); doSearch(term); }} style={{ fontSize: '13px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: '8px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Clock size={12} color="var(--text-tertiary)" />
                {term}
              </button>
            ))}
          </div>
        </div>
      )}

      {aiResult && (
        <div style={{ background: 'var(--brand-light)', border: '1px solid var(--brand)', borderRadius: 12, padding: 12, marginBottom: 20, fontSize: '13px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600, marginBottom: 4 }}>
            <Sparkles size={14} color="var(--brand)" />
            AI understood your search
          </div>
          <div style={{ color: 'var(--text-secondary)' }}>{aiResult.message || `Found ${products.length} products matching your description`}</div>
          {aiResult.filters && (
            <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {Object.entries(aiResult.filters).map(([k, v]) => (
                <span key={k} style={{ fontSize: '11px', background: 'white', border: '1px solid var(--border)', borderRadius: 20, padding: '3px 8px' }}>{k}: {String(v)}</span>
              ))}
            </div>
          )}
        </div>
      )}

      {loading ? (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, fontSize: '14px', color: 'var(--text-secondary)' }}>
            <div className="skeleton" style={{ width: 16, height: 16, borderRadius: '50%' }} />
            Searching products...
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
            {[1,2,3,4,5,6,7,8].map(i => (
              <div key={i} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div className="skeleton" style={{ height: 180, borderRadius: 0 }} />
                <div style={{ padding: 12 }}>
                  <div className="skeleton skeleton-title" style={{ height: 14 }} />
                  <div className="skeleton skeleton-text" style={{ height: 12, width: '60%', marginTop: 8 }} />
                  <div className="skeleton skeleton-text" style={{ height: 16, width: '40%', marginTop: 12 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : error ? (
        <div className="card" style={{ padding: 32, textAlign: 'center' }}>
          <div style={{ width: 48, height: 48, background: 'var(--danger-light)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <span style={{ fontSize: '20px' }}>⚠️</span>
          </div>
          <div style={{ fontWeight: 600, fontSize: '16px', marginBottom: 8 }}>Unable to search products</div>
          <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: 20 }}>{error}</div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button className="btn btn-primary" onClick={() => doSearch(query)}>Try again</button>
            <button className="btn btn-secondary" onClick={() => { setQuery(''); setProducts([]); setError(null); }}>Clear search</button>
          </div>
        </div>
      ) : products.length === 0 ? (
        <div className="card" style={{ padding: 40, textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, background: 'var(--surface-muted)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <SearchIcon size={24} color="var(--text-tertiary)" />
          </div>
          <div style={{ fontWeight: 600, fontSize: '16px', marginBottom: 8 }}>
            {query ? `No products found for "${query}"` : 'Search for products'}
          </div>
          <div style={{ fontSize: '14px', color: 'var(--text-secondary)', maxWidth: 400, margin: '0 auto 20px', lineHeight: 1.5 }}>
            {query 
              ? 'Try different keywords, check spelling, or browse categories. All results come from actual shop inventory.'
              : 'Enter a product name, brand, or category to find what you need from local shops. You can also use voice or image search.'}
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
            {['Cement', 'PVC Pipe', 'Paint', 'Electrical wire', 'Bricks', 'Hardware'].map(term => (
              <button key={term} className="btn btn-secondary btn-sm" style={{ borderRadius: 20 }} onClick={() => { setQuery(term); doSearch(term); }}>{term}</button>
            ))}
          </div>
          
          {query && (
            <div style={{ marginTop: 24, padding: 16, background: 'var(--surface-muted)', borderRadius: 12, textAlign: 'left', maxWidth: 400, margin: '24px auto 0' }}>
              <div style={{ fontWeight: 600, fontSize: '13px', marginBottom: 8 }}>Search tips</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                • Try general terms like "pipe" instead of specific models<br/>
                • Search by brand: "Finolex", "Asian Paints"<br/>
                • Use category filter for broader results<br/>
                • Check "In stock only" if you need immediate availability
              </div>
            </div>
          )}
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
              {products.length} products found {query && `for "${query}"`}
              {aiMode && ' • AI search'}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
              All products from real shop inventory
            </div>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
            {products.map(p => (
              <ProductCard key={p.id} product={p} onAdd={(id, qty) => handleAddToCart(id, p.shopId, qty)} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <div className="page">
      <Header />
      <main className="main-content">
        <Suspense fallback={
          <div className="container" style={{ paddingTop: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '14px', color: 'var(--text-secondary)' }}>
              <div className="skeleton" style={{ width: 16, height: 16, borderRadius: '50%' }} />
              Loading search...
            </div>
          </div>
        }>
          <SearchContent />
        </Suspense>
      </main>
      <BottomNav />
    </div>
  );
}
