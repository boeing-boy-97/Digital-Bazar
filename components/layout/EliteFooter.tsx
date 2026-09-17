import Link from 'next/link';
import { Mail, MapPin, ShieldCheck, Store } from 'lucide-react';

export function EliteFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer style={{ background: '#0F172A', color: 'white', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '72px 24px 32px' }}>
        {/* Main grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr 1fr 1.2fr', gap: 48, marginBottom: 56 }} className="elite-footer-grid">
          {/* Brand */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 16 }}>
              <div style={{ 
                width: 38, 
                height: 38, 
                background: '#0F766E', 
                borderRadius: 11, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                boxShadow: '0 2px 10px -3px rgb(15 118 110 / 0.5)'
              }} aria-hidden="true">
                <svg width="22" height="22" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <g fill="white"><path d="M6 9C6 8.17 6.67 7.5 7.5 7.5H12.2C13.03 7.5 13.7 8.17 13.7 9L14.6 15C14.6 16.9 13 18.5 11.1 18.5C9.2 18.5 7.6 16.9 7.6 15L6 9Z"/><path d="M14.3 7.5H25.7L26.6 15C26.6 16.9 25 18.5 23.1 18.5H16.9C15 18.5 13.4 16.9 13.4 15L14.3 7.5Z"/><path d="M26.3 7.5H32.5C33.33 7.5 34 8.17 34 9L32.4 15C32.4 16.9 30.8 18.5 28.9 18.5C27 18.5 25.4 16.9 25.4 15L26.3 7.5Z"/></g>
                  <path d="M9 21.5V31C9 31.83 9.67 32.5 10.5 32.5H29.5C30.33 32.5 31 31.83 31 31V21.5" stroke="white" strokeWidth="1.7" strokeLinecap="round" fill="none"/>
                  <rect x="14.5" y="22.8" width="11" height="9.7" rx="1" stroke="white" strokeWidth="1.7" fill="none"/>
                  <path d="M23.2 26.2V28" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 18, letterSpacing: '-0.03em', fontFamily: 'var(--font-heading)', lineHeight: 1 }}>Digital Bazar</div>
                <div style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 2 }}>Nagpur • Local Commerce</div>
              </div>
            </div>
            
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', lineHeight: 1.65, maxWidth: 360, margin: 0 }}>
              Know it is in stock before you leave the house. Real inventory from verified local shops in Nagpur. Order ahead, collect when ready.
            </p>
            
            <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>
                <div style={{ width: 28, height: 28, background: 'rgba(255,255,255,0.06)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }} aria-hidden="true"><Mail size={12} /></div>
                <span>support@digital-bazar.example.com</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>
                <div style={{ width: 28, height: 28, background: 'rgba(255,255,255,0.06)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }} aria-hidden="true"><MapPin size={12} /></div>
                <span>Nagpur, Maharashtra • Launching here first</span>
              </div>
            </div>

            <div style={{ marginTop: 24, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 600, color: 'white', marginBottom: 6 }}>
                <Store size={12} aria-hidden="true" />
                Launching in Nagpur
              </div>
              <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.55)', lineHeight: 1.5 }}>
                Onboarding our first shops. Real photos, real inventory, no placeholders. Tell us your pincode and we'll notify you when a shop near you joins.
              </div>
            </div>
          </div>

          {/* Marketplace */}
          <div>
            <h3 style={{ fontWeight: 700, fontSize: 11.5, marginBottom: 20, letterSpacing: '0.08em', textTransform: 'uppercase', opacity: 0.9, margin: '0 0 20px 0' }}>Marketplace</h3>
            <nav aria-label="Marketplace links" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { href: '/shops', label: 'Browse shops' },
                { href: '/search', label: 'Search products' },
                { href: '/categories', label: 'All categories' },
                { href: '/c/medical', label: 'Medical stores' },
                { href: '/c/hardware', label: 'Hardware shops' },
                { href: '/c/building-material', label: 'Building material' },
              ].map(link => (
                <Link key={link.href} href={link.href} style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', textDecoration: 'none', transition: 'color 0.2s', lineHeight: 1.4 }}>{link.label}</Link>
              ))}
            </nav>
          </div>

          {/* For shops & Help */}
          <div>
            <h3 style={{ fontWeight: 700, fontSize: 11.5, marginBottom: 20, letterSpacing: '0.08em', textTransform: 'uppercase', opacity: 0.9, margin: '0 0 20px 0' }}>For shops & Help</h3>
            <nav aria-label="For shops links" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { href: '/auth/register', label: 'Register your shop' },
                { href: '/shopkeeper', label: 'Shop dashboard' },
                { href: '/about', label: 'How it works' },
                { href: '/contact', label: 'Contact support' },
                { href: '/faq', label: 'FAQ' },
              ].map(link => (
                <Link key={link.href} href={link.href} style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', textDecoration: 'none', lineHeight: 1.4 }}>{link.label}</Link>
              ))}
            </nav>
          </div>

          {/* Legal & Trust */}
          <div>
            <h3 style={{ fontWeight: 700, fontSize: 11.5, marginBottom: 20, letterSpacing: '0.08em', textTransform: 'uppercase', opacity: 0.9, margin: '0 0 20px 0' }}>Legal & Trust</h3>
            <nav aria-label="Legal links" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { href: '/privacy', label: 'Privacy Policy' },
                { href: '/terms', label: 'Terms of Service' },
                { href: '/refunds', label: 'Refund & Cancellation' },
                { href: '/shipping', label: 'Shipping & Pickup' },
                { href: '/grievance', label: 'Grievance Officer' },
              ].map(link => (
                <Link key={link.href} href={link.href} style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', textDecoration: 'none', lineHeight: 1.4 }}>{link.label}</Link>
              ))}
            </nav>

            <div style={{ marginTop: 20, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, fontWeight: 600, color: 'white', marginBottom: 6 }}>
                <ShieldCheck size={12} aria-hidden="true" />
                Secure & Compliant
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', lineHeight: 1.5 }}>
                Payments verified server-side via Razorpay. QR tokens single-use signed. Inventory transactional to prevent overselling. GST invoices with HSN.
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{ paddingTop: 28, borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.45)', margin: 0, lineHeight: 1.5 }}>
            © {currentYear} Digital Bazar. All rights reserved. Made for local commerce in Nagpur, India. Real shops, real inventory.
          </p>
          <div style={{ display: 'flex', gap: 16, fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 500, letterSpacing: '0.02em' }}>
            <span>🇮🇳 Made in India</span>
            <span aria-hidden="true">•</span>
            <span>Pickup-first</span>
            <span aria-hidden="true">•</span>
            <span>Real data only</span>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 1024px) {
          .elite-footer-grid { grid-template-columns: 1fr 1fr !important; gap: 40px !important; }
        }
        @media (max-width: 640px) {
          .elite-footer-grid { grid-template-columns: 1fr !important; gap: 36px !important; }
        }
        footer a:hover { color: white !important; }
        footer a:focus-visible {
          outline: 2px solid #0F766E;
          outline-offset: 2px;
          border-radius: 4px;
        }
      `}</style>
    </footer>
  );
}
