'use client';
import { Header } from '@/components/common/Header';
import { BottomNav } from '@/components/common/BottomNav';

export default function FavoritesPage() {
  return (
    <div className="page">
      <Header />
      <main className="main-content">
        <div className="container" style={{ paddingTop: 24, paddingBottom: 80 }}>
          <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: 16 }}>Favorites</h1>
          <div className="tabs" style={{ marginBottom: 16 }}>
            <button className="tab active">My Regular Items</button>
            <button className="tab">Favorite Shops</button>
            <button className="tab">Favorite Products</button>
          </div>
          <div className="empty-state">
            <div className="empty-state-icon">❤️</div>
            <div className="empty-state-title">No favorites yet</div>
            <div className="empty-state-description">Save shops and products you buy frequently for fast reordering. Your regular items will appear here.</div>
          </div>
          <div className="card" style={{ padding: 16, marginTop: 24 }}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>How Favorites Work</div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              • Favorite shops to see them first<br/>
              • Favorite products to build "My Regular Items" list<br/>
              • Reorder previous orders with one click - system uses current prices<br/>
              • AI recommendations based on your order history
            </div>
          </div>
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
