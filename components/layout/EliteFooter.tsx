import Link from 'next/link';
import { Mail, Phone, MapPin, Shield } from 'lucide-react';

export function EliteFooter() {
  return (
    <footer style={{ background: '#0F172A', color: 'white', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '64px 24px 32px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr', gap: 40, marginBottom: 48 }} className="elite-footer-grid">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ width: 36, height: 36, background: '#0F766E', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 15 }}>DB</div>
              <span style={{ fontWeight: 700, fontSize: 18, letterSpacing: '-0.03em', fontFamily: 'var(--font-heading)' }}>Digital Bazar</span>
            </div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', lineHeight: 1.6, maxWidth: 340 }}>Shop Local. Skip the Wait. Connecting you with verified local shops for all products — from medical to hardware. Real inventory, real community.</div>
            <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Mail size={14} />support@digitalbazar.com</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Phone size={14} />+91 98765 43210</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><MapPin size={14} />Nagpur, Maharashtra • Serving all India</div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
              {[
                { icon: '𝕏', label: 'Twitter' },
                { icon: 'f', label: 'Facebook' },
                { icon: 'in', label: 'LinkedIn' },
                { icon: 'ig', label: 'Instagram' },
              ].map(s => <a key={s.label} href="#" aria-label={s.label} style={{ width: 36, height: 36, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: 12, fontWeight: 700 }}>{s.icon}</a>)}
            </div>
          </div>

          <div>
            <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 18, letterSpacing: '0.06em', textTransform: 'uppercase', opacity: 0.9 }}>Marketplace</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 14, color: 'rgba(255,255,255,0.65)' }}>
              <Link href="/shops" style={{ color: 'inherit', textDecoration: 'none' }}>Browse shops</Link>
              <Link href="/search" style={{ color: 'inherit', textDecoration: 'none' }}>Search products</Link>
              <Link href="/categories" style={{ color: 'inherit', textDecoration: 'none' }}>Categories</Link>
              <Link href="/search?category=Medical" style={{ color: 'inherit', textDecoration: 'none' }}>Medical</Link>
              <Link href="/search?category=Hardware" style={{ color: 'inherit', textDecoration: 'none' }}>Hardware</Link>
              <Link href="/search?category=Electronics" style={{ color: 'inherit', textDecoration: 'none' }}>Electronics</Link>
            </div>
          </div>

          <div>
            <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 18, letterSpacing: '0.06em', textTransform: 'uppercase', opacity: 0.9 }}>For shops & Help</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 14, color: 'rgba(255,255,255,0.65)' }}>
              <Link href="/auth/register" style={{ color: 'inherit', textDecoration: 'none' }}>Register shop</Link>
              <Link href="/shopkeeper" style={{ color: 'inherit', textDecoration: 'none' }}>Shop dashboard</Link>
              <Link href="/about" style={{ color: 'inherit', textDecoration: 'none' }}>About us</Link>
              <Link href="/contact" style={{ color: 'inherit', textDecoration: 'none' }}>Contact</Link>
              <Link href="/faq" style={{ color: 'inherit', textDecoration: 'none' }}>FAQ</Link>
              <Link href="/privacy" style={{ color: 'inherit', textDecoration: 'none' }}>Privacy Policy</Link>
            </div>
          </div>

          <div>
            <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 18, letterSpacing: '0.06em', textTransform: 'uppercase', opacity: 0.9 }}>Support</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 14, color: 'rgba(255,255,255,0.65)' }}>
              <Link href="/terms" style={{ color: 'inherit', textDecoration: 'none' }}>Terms of Service</Link>
              <Link href="/contact" style={{ color: 'inherit', textDecoration: 'none' }}>Help Center</Link>
              <Link href="/contact" style={{ color: 'inherit', textDecoration: 'none' }}>Shipping Policy</Link>
              <Link href="/contact" style={{ color: 'inherit', textDecoration: 'none' }}>Refund Policy</Link>
              <div style={{ marginTop: 12, padding: 12, background: 'rgba(255,255,255,0.06)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'white', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}><Shield size={12} />Secure & Trusted</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', lineHeight: 1.4 }}>Real shops, real inventory, GST compliant, secure payments via Razorpay.</div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.45)' }}>© {new Date().getFullYear()} Digital Bazar. All rights reserved. Made for local commerce in India.</div>
          <div style={{ display: 'flex', gap: 14, fontSize: 11.5, color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}><span>🇮🇳 Made in India</span><span>•</span><span>Secure payments</span><span>•</span><span>GST compliant</span><span>•</span><span>Real data only</span></div>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .elite-footer-grid { grid-template-columns: 1fr !important; gap: 32px !important; }
        }
      `}</style>
    </footer>
  );
}
