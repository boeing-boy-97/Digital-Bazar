'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export function CookieConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('db_cookie_consent');
    if (!consent) {
      const timer = setTimeout(() => setShow(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const accept = (type: 'all' | 'essential') => {
    localStorage.setItem('db_cookie_consent', type);
    localStorage.setItem('db_cookie_consent_at', new Date().toISOString());
    setShow(false);
  };

  if (!show) return null;

  return (
    <div 
      role="dialog" 
      aria-label="Cookie consent" 
      aria-live="polite" 
      style={{ 
        position: 'fixed', 
        bottom: 0, 
        left: 0, 
        right: 0, 
        zIndex: 9999, 
        background: 'white', 
        borderTop: '1px solid var(--border)', 
        boxShadow: '0 -4px 24px rgba(0,0,0,0.08)', 
        padding: '20px 24px',
        animation: 'slideUp 0.3s ease-out'
      }}
    >
      <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 280 }}>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4, color: 'var(--text-primary)' }}>We use cookies to improve your experience</div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Essential cookies for authentication and location are always on. Analytics cookies help us improve search and performance. 
            You can choose. See <Link href="/privacy" style={{ color: '#0F766E', fontWeight: 600, textDecoration: 'underline' }}>Privacy Policy</Link> for details. 
            <span style={{ display: 'block', marginTop: 4, fontSize: 11, color: 'var(--text-tertiary)' }}>We do not load non-essential scripts until you accept. Consent logged with timestamp per DPDP Act.</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
          <button onClick={() => accept('essential')} style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 16px', fontSize: 13, fontWeight: 500, cursor: 'pointer', minHeight: 40 }}>Essential only</button>
          <button onClick={() => accept('all')} style={{ background: '#0F766E', color: 'white', border: 'none', borderRadius: 10, padding: '10px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', minHeight: 40, boxShadow: '0 2px 8px -2px rgb(15 118 110 / 0.3)' }}>Accept all</button>
        </div>
      </div>
      <style>{`@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }`}</style>
    </div>
  );
}
