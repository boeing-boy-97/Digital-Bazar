import { EliteHeader } from '@/components/layout/EliteHeader';
import { EliteFooter } from '@/components/layout/EliteFooter';
import { ShieldCheck, Package, Users, Heart, Store, MapPin, Clock, Check, Award, TrendingUp } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'About Digital Bazar - Built for local commerce in Nagpur',
  description: 'The idea came from standing in a hardware shop in Nagpur for twenty minutes, waiting, only to be told the fitting was not in stock. We are fixing that with real inventory from local shops.',
  alternates: { canonical: '/about' },
};

export default function AboutPage() {
  return (
    <div style={{ background: 'var(--surface)', minHeight: '100vh' }}>
      <EliteHeader />

      <main id="main-content">
        {/* Hero */}
        <section style={{ background: 'linear-gradient(180deg, #F0FAF9 0%, #FFFFFF 100%)', borderBottom: '1px solid var(--border)', padding: '80px 0 64px' }}>
          <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
            <div style={{ maxWidth: 720 }}>
              <div style={{ display: 'inline-flex', background: 'white', border: '1px solid var(--border)', borderRadius: 100, padding: '6px 14px', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', color: 'var(--text-secondary)', marginBottom: 16, boxShadow: 'var(--shadow-xs)' }}>ABOUT DIGITAL BAZAR • NAGPUR • LOCAL COMMERCE</div>
              <h1 style={{ fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.05, margin: 0, fontFamily: 'var(--font-heading)' }}>Built for local commerce, not just online shopping.</h1>
              <p style={{ fontSize: 18, color: 'var(--text-secondary)', lineHeight: 1.6, marginTop: 20, maxWidth: 600 }}>Digital Bazar connects you with verified local shops — from medical stores to hardware shops. You buy from a specific shop you trust, not a faceless warehouse. Starting in Nagpur, onboarding verified shops now.</p>
            </div>
          </div>
        </section>

        {/* Story */}
        <section style={{ padding: '80px 0', background: 'white' }}>
          <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 64, alignItems: 'start' }} className="about-grid">
              <div>
                <h2 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em', margin: '0 0 20px', fontFamily: 'var(--font-heading)' }}>Why we built this</h2>
                <div style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.7, display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <p style={{ margin: 0 }}>The idea came from standing in a hardware shop in Nagpur for twenty minutes, waiting, only to be told the fitting was not in stock. That wasted trip happens to everyone — medical stores, electrical shops, grocery.</p>
                  <p style={{ margin: 0 }}>Local shops have everything you need, but you never know if something is in stock until you arrive. Phone calls don't work — shop is busy. You go, wait in queue, then find out it's not available.</p>
                  <p style={{ margin: 0 }}>We asked: what if you could see real inventory from the shop counter, reserve it, and walk over knowing it is waiting? No phone calls, no wasted trips, no waiting in line to ask "hai kya?"</p>
                  <p style={{ margin: 0 }}>That's Digital Bazar. Real inventory from shop counter, updated as they sell. You reserve, shop prepares, you collect with QR. Shop keeps customer, you save time. Starting in Nagpur — onboarding verified shops every week.</p>
                </div>

                <h3 style={{ fontSize: 20, fontWeight: 700, margin: '40px 0 16px', fontFamily: 'var(--font-heading)' }}>What we are — and what we are not</h3>
                <div style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)', borderRadius: 12, padding: 20, fontSize: 14, lineHeight: 1.6 }}>
                  <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                    <div style={{ width: 28, height: 28, background: '#E6F4F3', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }} aria-hidden="true"><Check size={14} color="#0F766E" /></div>
                    <div><strong style={{ color: 'var(--text-primary)' }}>We are:</strong> <span style={{ color: 'var(--text-secondary)' }}>pickup-first marketplace for local shops. Order ahead, collect when ready. Real inventory, real shops, real photos. Built for Nagpur's neighbourhood commerce.</span></div>
                  </div>
                  <div style={{ display: 'flex', gap: 12 }}>
                    <div style={{ width: 28, height: 28, background: '#FEF2F2', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }} aria-hidden="true"><span style={{ fontSize: 12 }}>✕</span></div>
                    <div><strong style={{ color: 'var(--text-primary)' }}>We are not:</strong> <span style={{ color: 'var(--text-secondary)' }}>a warehouse e-commerce site, a delivery-only app, or a site with fake 500+ shops and 4.8/5 ratings. We are pre-launch — if you see "no shops in your area yet", that's honest. More joining every week.</span></div>
                  </div>
                </div>

                <h3 style={{ fontSize: 20, fontWeight: 700, margin: '32px 0 16px', fontFamily: 'var(--font-heading)' }}>What we offer</h3>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {[
                    'Real inventory from verified local shops — no fake availability, no placeholder stock',
                    'Order ahead, collect with QR — shop prepares while you travel, you skip queue',
                    'Single-use signed QR tokens, GST invoices with HSN and tax breakdown',
                    'Transactional inventory: total/reserved/available/sold with server-side checks',
                    'All categories: medical (OTC now, prescription workflow being built), hardware, building material, electrical, plumbing, paint, grocery, electronics'
                  ].map(item => (
                    <li key={item} style={{ display: 'flex', gap: 10, fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      <span style={{ width: 20, height: 20, background: '#ECFDF5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }} aria-hidden="true"><span style={{ color: '#059669', fontSize: 11, fontWeight: 700 }}>✓</span></span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'sticky', top: 100 }}>
                <div style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)', borderRadius: 16, padding: 24 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                    <div style={{ width: 48, height: 48, background: 'white', border: '1px solid var(--border)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }} aria-hidden="true"><MapPin size={22} color="#0F766E" /></div>
                    <div><div style={{ fontWeight: 700, fontSize: 15 }}>Nagpur only, for now</div><div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Launching one neighbourhood at a time</div></div>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>We're onboarding our first shops in Nagpur. No fake numbers. If you see empty state, tell us your pincode and we'll notify you when a shop near you joins. Real photos only.</div>
                </div>

                <div style={{ background: '#0F766E', color: 'white', borderRadius: 16, padding: 24 }}>
                  <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8, fontFamily: 'var(--font-heading)' }}>For shop owners</div>
                  <div style={{ fontSize: 13, opacity: 0.9, lineHeight: 1.6, marginBottom: 16 }}>Own a shop in Nagpur? Join free. Add products from master catalog, set price/stock/SKU, manage orders with zone picking. Setup about fifteen minutes.</div>
                  <Link href="/auth/register" style={{ background: 'white', color: '#0F766E', borderRadius: 10, padding: '10px 16px', fontSize: 13, fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, minHeight: 40 }}>Register your shop</Link>
                </div>

                <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 16, padding: 20 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 12 }}>How it works — 4 steps</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    <div style={{ display: 'flex', gap: 10 }}><span style={{ width: 20, height: 20, background: '#0F766E', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, flexShrink: 0 }}>1</span>Browse real inventory from nearby shop</div>
                    <div style={{ display: 'flex', gap: 10 }}><span style={{ width: 20, height: 20, background: '#0F766E', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, flexShrink: 0 }}>2</span>Order ahead — stock reserved transactionally</div>
                    <div style={{ display: 'flex', gap: 10 }}><span style={{ width: 20, height: 20, background: '#0F766E', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, flexShrink: 0 }}>3</span>Shop prepares, you get WhatsApp notification</div>
                    <div style={{ display: 'flex', gap: 10 }}><span style={{ width: 20, height: 20, background: '#0F766E', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, flexShrink: 0 }}>4</span>Walk in, show QR, collect — skip queue</div>
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
              <p style={{ fontSize: 15, color: 'var(--text-secondary)', marginTop: 12, lineHeight: 1.6 }}>Real shops, real data, no fake numbers — built for local commerce</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
              {[
                { icon: Users, title: 'Customer-first, shop-first', desc: 'We make local shopping faster without replacing shops. Neighborhood stores stay at center, keep customer relationship and margin.' },
                { icon: ShieldCheck, title: 'Real data only', desc: 'Real inventory from counter, real prices, real photos. If no shops yet, we say so. No 500+ shops or 4.8/5 fake rating.' },
                { icon: Heart, title: 'Support local community', desc: 'Every order supports local business. Keep community thriving while skipping wait and crowd. Ten-minute walk away.' },
                { icon: Package, title: 'Pickup-first, not delivery', desc: 'Order ahead and collect. Shop prepares while you travel. Some shops offer delivery within 3-5km, but pickup is primary.' },
              ].map(v => (
                <div key={v.title} style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 16, padding: 24, transition: 'all 0.2s ease' }} className="value-card">
                  <div style={{ width: 48, height: 48, background: '#E6F4F3', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0F766E', marginBottom: 16 }} aria-hidden="true"><v.icon size={22} /></div>
                  <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 8, color: 'var(--text-primary)' }}>{v.title}</div>
                  <div style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{v.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Team / Trust */}
        <section style={{ padding: '80px 0', background: 'white' }}>
          <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
            <div style={{ maxWidth: 640, margin: '0 auto', textAlign: 'center', marginBottom: 48 }}>
              <h2 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em', margin: 0, fontFamily: 'var(--font-heading)' }}>Built for Nagpur, by people who shop here</h2>
              <p style={{ fontSize: 15, color: 'var(--text-secondary)', marginTop: 12, lineHeight: 1.6 }}>We are not a big warehouse. We are a small team fixing a real problem — knowing if something is in stock before you leave house.</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, maxWidth: 800, margin: '0 auto' }}>
              {[
                { title: 'Real inventory', desc: 'From shop counter, not warehouse. Updated as they sell.' },
                { title: 'GST compliant', desc: 'Invoices with HSN codes, CGST/SGST split, sequential numbers.' },
                { title: 'QR verification', desc: 'Single-use signed tokens, 15-min expiry, consumed atomically.' },
                { title: 'No fake data', desc: 'Real shops, real photos, real stock. No placeholders.' },
              ].map(item => (
                <div key={item.title} style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)', borderRadius: 12, padding: 16, textAlign: 'center' }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)', marginBottom: 4 }}>{item.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4 }}>{item.desc}</div>
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
        .value-card:hover {
          border-color: var(--border-strong) !important;
          box-shadow: var(--shadow-sm) !important;
        }
      `}</style>
    </div>
  );
}
