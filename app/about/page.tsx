import { EliteHeader } from '@/components/layout/EliteHeader';
import { EliteFooter } from '@/components/layout/EliteFooter';
import { ShieldCheck, Clock, Package, Users, Heart, Award, Truck, MapPin, Store } from 'lucide-react';
import Link from 'next/link';

export default function AboutPage() {
  return (
    <div style={{ background: 'var(--surface)', minHeight: '100vh' }}>
      <EliteHeader />

      <main>
        {/* Hero */}
        <section style={{ background: 'linear-gradient(180deg, #F0FAF9 0%, #FFFFFF 100%)', borderBottom: '1px solid var(--border)', padding: '80px 0 64px' }}>
          <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
            <div style={{ maxWidth: 720 }}>
              <div style={{ display: 'inline-flex', background: 'var(--brand-light)', color: 'var(--brand)', fontSize: 11, fontWeight: 700, padding: '6px 12px', borderRadius: 100, letterSpacing: '0.06em', marginBottom: 16 }}>ABOUT DIGITAL BAZAR</div>
              <h1 style={{ fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.05, margin: 0, fontFamily: 'var(--font-heading)' }}>Built for local commerce, not just online shopping.</h1>
              <p style={{ fontSize: 18, color: 'var(--text-secondary)', lineHeight: 1.6, marginTop: 20, maxWidth: 600 }}>Digital Bazar connects you with verified local shops — from medical stores to hardware shops. You buy from a specific shop you trust, not a faceless warehouse.</p>
            </div>
          </div>
        </section>

        {/* Story */}
        <section style={{ padding: '80px 0', background: 'white' }}>
          <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 64, alignItems: 'start' }} className="about-grid">
              <div>
                <h2 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em', margin: '0 0 20px', fontFamily: 'var(--font-heading)' }}>Who we are</h2>
                <div style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.7, display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <p>Digital Bazar was born from a simple observation: local shops have everything you need, but shopping locally often means waiting in crowded stores, not knowing if something is in stock, and wasting time.</p>
                  <p>We asked: what if you could browse real inventory from nearby shops, order before you arrive, and collect when ready? No more waiting, no more uncertainty.</p>
                  <p>That's exactly what we built. A platform that makes local shopping faster without replacing the shops you trust. Your neighborhood stores stay at the center — we just make the experience better for everyone.</p>
                </div>

                <h3 style={{ fontSize: 20, fontWeight: 700, margin: '40px 0 16px' }}>Our mission</h3>
                <p style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.7 }}>To strengthen local commerce by connecting customers with nearby shops through real-time inventory, order-ahead convenience, and trustworthy service. We believe local businesses are the backbone of communities, and technology should support them, not replace them.</p>

                <h3 style={{ fontSize: 20, fontWeight: 700, margin: '32px 0 16px' }}>What we offer</h3>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {[
                    'Real inventory from verified local shops — no fake availability',
                    'Order ahead, save time — shop prepares while you travel',
                    'QR verification for secure, fast pickup',
                    'GST-compliant invoices with HSN codes and tax breakdown',
                    'Zone-based picking for efficient shop operations',
                    'Support for all categories: medical to hardware, grocery to electronics'
                  ].map(item => (
                    <li key={item} style={{ display: 'flex', gap: 10, fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      <span style={{ width: 20, height: 20, background: 'var(--success-light)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}><span style={{ color: 'var(--success)', fontSize: 12, fontWeight: 700 }}>✓</span></span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)', borderRadius: 16, padding: 24 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                    <div style={{ width: 48, height: 48, background: 'white', border: '1px solid var(--border)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Store size={22} color="var(--brand)" /></div>
                    <div><div style={{ fontWeight: 700, fontSize: 15 }}>500+ shops</div><div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Across 12+ cities in India</div></div>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>From medical stores in Nagpur to hardware shops in Pune — real local businesses, verified and trusted.</div>
                </div>

                <div style={{ background: 'var(--brand)', color: 'white', borderRadius: 16, padding: 24 }}>
                  <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>For shop owners</div>
                  <div style={{ fontSize: 13, opacity: 0.9, lineHeight: 1.6, marginBottom: 16 }}>Join Digital Bazar and let customers order ahead from your store. Simple dashboard, no coding needed.</div>
                  <Link href="/auth/register" style={{ background: 'white', color: 'var(--brand)', borderRadius: 10, padding: '10px 16px', fontSize: 13, fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}>Register your shop</Link>
                </div>

                <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 16, padding: 20 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>By the numbers</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div><div style={{ fontSize: 24, fontWeight: 800, color: 'var(--brand)' }}>25 min</div><div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>Avg time saved per order</div></div>
                    <div><div style={{ fontSize: 24, fontWeight: 800, color: 'var(--brand)' }}>500+</div><div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>Verified shops</div></div>
                    <div><div style={{ fontSize: 24, fontWeight: 800, color: 'var(--brand)' }}>12+</div><div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>Cities served</div></div>
                    <div><div style={{ fontSize: 24, fontWeight: 800, color: 'var(--brand)' }}>4.8/5</div><div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>Customer rating</div></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Values */}
        <section style={{ padding: '80px 0', background: 'var(--surface-muted)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
          <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
            <div style={{ textAlign: 'center', maxWidth: 600, margin: '0 auto 48px' }}>
              <h2 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.02em', margin: 0, fontFamily: 'var(--font-heading)' }}>Our values</h2>
              <p style={{ fontSize: 15, color: 'var(--text-secondary)', marginTop: 12 }}>The principles that guide everything we build</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
              {[
                { icon: Users, title: 'Customer-first, shop-first', desc: 'We make local shopping faster without replacing the shops you trust. Neighborhood stores stay at the center.' },
                { icon: ShieldCheck, title: 'Real data, no fake', desc: 'Real inventory, real prices, real shops. What you see is what you get when you arrive. No fake availability.' },
                { icon: Heart, title: 'Support local community', desc: 'Every order supports a local business. Keep your community thriving while skipping wait and crowd.' },
                { icon: Award, title: 'Quality & trust', desc: 'Verified shops, secure payments, GST compliant. Professional experience for all categories.' },
              ].map(v => (
                <div key={v.title} style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 16, padding: 24 }}>
                  <div style={{ width: 48, height: 48, background: 'var(--brand-light)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand)', marginBottom: 16 }}><v.icon size={22} /></div>
                  <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 8 }}>{v.title}</div>
                  <div style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{v.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <EliteFooter />

      <style>{`
        @media (max-width: 1024px) {
          .about-grid { grid-template-columns: 1fr !important; gap: 40px !important; }
        }
      `}</style>
    </div>
  );
}
