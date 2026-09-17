import { EliteHeader } from '@/components/layout/EliteHeader';
import { EliteFooter } from '@/components/layout/EliteFooter';
import { Mail, Phone, MapPin, Clock, MessageCircle, Store } from 'lucide-react';

export default function ContactPage() {
  return (
    <div style={{ background: 'var(--surface)', minHeight: '100vh' }}>
      <EliteHeader />

      <main>
        <section style={{ background: 'linear-gradient(180deg, #F0FAF9 0%, #FFFFFF 100%)', borderBottom: '1px solid var(--border)', padding: '80px 0 64px' }}>
          <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
            <div style={{ maxWidth: 640 }}>
              <div style={{ display: 'inline-flex', background: 'var(--brand-light)', color: 'var(--brand)', fontSize: 11, fontWeight: 700, padding: '6px 12px', borderRadius: 100, letterSpacing: '0.06em', marginBottom: 16 }}>CONTACT US</div>
              <h1 style={{ fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.05, margin: 0, fontFamily: 'var(--font-heading)' }}>Get in touch with Digital Bazar</h1>
              <p style={{ fontSize: 16, color: 'var(--text-secondary)', lineHeight: 1.6, marginTop: 16 }}>Have a question about your order, want to register your shop, or need help? We're here to assist you.</p>
            </div>
          </div>
        </section>

        <section style={{ padding: '64px 0 80px' }}>
          <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 48 }} className="contact-grid">
              <div>
                <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 16, padding: 32 }}>
                  <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 8px' }}>Send us a message</h2>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 24 }}>We typically reply within 24 hours. For urgent order issues, please contact the shop directly.</p>

                  <form style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }} className="form-grid">
                      <div>
                        <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, display: 'block' }}>Your name</label>
                        <input placeholder="Rahul Sharma" style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid var(--border)', fontSize: 14, outline: 'none' }} />
                      </div>
                      <div>
                        <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, display: 'block' }}>Email address</label>
                        <input type="email" placeholder="rahul@example.com" style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid var(--border)', fontSize: 14, outline: 'none' }} />
                      </div>
                    </div>
                    <div>
                      <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, display: 'block' }}>Subject</label>
                      <select style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid var(--border)', fontSize: 14, background: 'white' }}>
                        <option>General inquiry</option>
                        <option>Order support</option>
                        <option>Shop registration</option>
                        <option>Payment issue</option>
                        <option>Feedback</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, display: 'block' }}>Message</label>
                      <textarea placeholder="Tell us how we can help you..." rows={5} style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid var(--border)', fontSize: 14, outline: 'none', resize: 'none' }} />
                    </div>
                    <button type="submit" style={{ background: 'var(--brand)', color: 'white', border: 'none', borderRadius: 12, padding: '14px 24px', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>Send message</button>
                    <div style={{ fontSize: 11, color: 'var(--text-tertiary)', textAlign: 'center' }}>By sending, you agree to our Privacy Policy and Terms of Service.</div>
                  </form>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)', borderRadius: 16, padding: 24 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 16px' }}>Contact information</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <div style={{ width: 40, height: 40, background: 'white', border: '1px solid var(--border)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Mail size={18} color="var(--brand)" /></div>
                      <div><div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>Email</div><div style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>support@digitalbazar.com</div><div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>For general inquiries and support</div></div>
                    </div>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <div style={{ width: 40, height: 40, background: 'white', border: '1px solid var(--border)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Phone size={18} color="var(--brand)" /></div>
                      <div><div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>Phone</div><div style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>+91 98765 43210</div><div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>Mon-Sat, 9AM-7PM IST</div></div>
                    </div>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <div style={{ width: 40, height: 40, background: 'white', border: '1px solid var(--border)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><MapPin size={18} color="var(--brand)" /></div>
                      <div><div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>Office</div><div style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>Nagpur, Maharashtra</div><div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>Serving shops across all India</div></div>
                    </div>
                  </div>
                </div>

                <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 16, padding: 24 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}><Clock size={16} color="var(--text-secondary)" /><span style={{ fontWeight: 600, fontSize: 14 }}>Response time</span></div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>General inquiries: within 24 hours<br />Order issues: within 4 hours<br />Shop registration: within 12 hours</div>
                </div>

                <div style={{ background: 'var(--brand)', color: 'white', borderRadius: 16, padding: 24 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}><Store size={18} /><span style={{ fontWeight: 700, fontSize: 15 }}>Own a local shop?</span></div>
                  <div style={{ fontSize: 13, opacity: 0.9, lineHeight: 1.6, marginBottom: 16 }}>Join 500+ shops on Digital Bazar. Let customers order ahead from your store.</div>
                  <a href="/auth/register" style={{ background: 'white', color: 'var(--brand)', borderRadius: 10, padding: '10px 16px', fontSize: 13, fontWeight: 600, textDecoration: 'none', display: 'inline-block' }}>Register your shop</a>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <EliteFooter />

      <style>{`
        @media (max-width: 1024px) {
          .contact-grid { grid-template-columns: 1fr !important; }
          .form-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
