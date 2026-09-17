'use client';
import { useEffect, useState, Suspense } from 'react';
import { Header } from '@/components/common/Header';
import { BottomNav } from '@/components/common/BottomNav';
import { ProductCard } from '@/components/customer/ProductCard';
import { Search as SearchIcon, Mic, Camera, Sparkles } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

function SearchContent() {
  const searchParams = useSearchParams();
  const initialQ = searchParams.get('q') || searchParams.get('category') || '';
  const [query, setQuery] = useState(initialQ);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [aiMode, setAiMode] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);

  useEffect(() => {
    if (initialQ) doSearch(initialQ);
  }, [initialQ]);

  const doSearch = async (q: string) => {
    setLoading(true);
    if (aiMode) {
      const res = await fetch('/api/ai/search', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query: q }) });
      const data = await res.json();
      setProducts(data.products || []);
      setAiResult(data);
    } else {
      const res = await fetch(`/api/products?q=${encodeURIComponent(q)}&limit=30`);
      const data = await res.json();
      setProducts(data.products || []);
    }
    setLoading(false);
  };

  const handleVoiceSearch = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      // @ts-ignore
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-IN';
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setQuery(transcript);
        doSearch(transcript);
      };
      recognition.start();
    } else {
      alert('Voice search not supported in this browser');
    }
  };

  const handleAddToCart = async (productId: string, shopId: string) => {
    const res = await fetch('/api/cart/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shopId, productId, quantity: 1 })
    });
    if (res.ok) {
      const count = parseInt(localStorage.getItem('db_cart_count') || '0') + 1;
      localStorage.setItem('db_cart_count', count.toString());
      window.dispatchEvent(new Event('cart-updated'));
      alert('Added to cart');
    }
  };

  return (
    <div className="container" style={{ paddingTop: 24, paddingBottom: 80 }}>
      <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: 16 }}>Search Products</h1>
      
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <div className="search-input-wrapper" style={{ flex: 1 }}>
          <SearchIcon size={16} className="search-input-icon" />
          <input className="search-input" placeholder='Try "waterproof outdoor wall paint" or "Mujhe 500 bricks chahiye"' value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>e.key==='Enter'&&doSearch(query)} style={{ paddingRight: 80 }} />
          <div style={{ position: 'absolute', right: 8, display: 'flex', gap: 4 }}>
            <button className="btn btn-ghost btn-sm" onClick={handleVoiceSearch}><Mic size={16} /></button>
            <button className="btn btn-ghost btn-sm" onClick={()=>alert('Image search: Upload product photo - coming soon, use AI vision API')}><Camera size={16} /></button>
          </div>
        </div>
        <button className="btn btn-primary" onClick={()=>doSearch(query)}>Search</button>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <label className="flex items-center gap-2" style={{ fontSize: '13px', cursor: 'pointer' }}>
          <input type="checkbox" checked={aiMode} onChange={e=>setAiMode(e.target.checked)} /> <Sparkles size={14} /> AI Semantic Search
        </label>
        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>• Try natural language: "I need waterproof outdoor paint" • Voice: "Mujhe 500 bricks aur 10 cement chahiye"</span>
      </div>

      {aiResult && (
        <div className="alert alert-info" style={{ marginBottom: 16, fontSize: '13px' }}>
          <strong>AI Parsed:</strong> {JSON.stringify(aiResult.filters)} • {aiResult.message}
        </div>
      )}

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
          {[1,2,3,4,5,6].map(i=><div key={i} className="card" style={{ padding: 12 }}><div className="skeleton skeleton-image" style={{ height: 120 }} /><div className="skeleton skeleton-title" style={{ marginTop: 8 }} /></div>)}
        </div>
      ) : products.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🔍</div>
          <div className="empty-state-title">Search products across all shops</div>
          <div className="empty-state-description">Try "PVC pipe", "cement", "waterproof paint", or use voice search in Hindi/English</div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginTop: 16 }}>
            {['PVC pipe', 'Cement bag', 'Waterproof paint', 'Electrical wire', 'Red bricks'].map(term=>(
              <button key={term} className="btn btn-secondary btn-sm" onClick={()=>{setQuery(term); doSearch(term);}}>{term}</button>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
          {products.map(p=>(
            <ProductCard key={p.id} product={p} onAdd={(id)=>handleAddToCart(id, p.shopId)} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <div className="page">
      <Header />
      <main className="main-content">
        <Suspense fallback={<div className="container" style={{ paddingTop: 24 }}>Loading search...</div>}>
          <SearchContent />
        </Suspense>
      </main>
      <BottomNav />
    </div>
  );
}
