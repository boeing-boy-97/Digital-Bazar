'use client';
import { useState } from 'react';
import { EliteHeader } from '@/components/layout/EliteHeader';
import { EliteFooter } from '@/components/layout/EliteFooter';
import { Mail, MapPin, Clock, Store, MessageCircle, Check } from 'lucide-react';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: 'General inquiry', message: '', honeypot: '', startedAt: Date.now() });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [ticket, setTicket] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (form.honeypot) {
      setStatus('success');
      setTicket(`DB-${Date.now().toString(36).toUpperCase()}`);
      return;
    }

    if (Date.now() - form.startedAt < 3000) {
      setError('Please take a moment to write your message.');
      setStatus('error');
      return;
    }

    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setError('Please fill all required fields.');
      setStatus('error');
      return;
    }

    setStatus('loading');
    setError('');

    try {
      await new Promise(r => setTimeout(r, 800));
      const newTicket = `DB-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2,6).toUpperCase()}`;
      setTicket(newTicket);
      setStatus('success');
      setForm({ name: '', email: '', subject: 'General inquiry', message: '', honeypot: '', startedAt: Date.now() });
    } catch (err: any) {
      setError('Unable to send message. Please try again or email support@digital-bazar.example.com');
      setStatus('error');
    }
  };

  return (
    <div style={{ background: 'var(--surface)', minHeight: '100vh' }}>
      <EliteHeader />
      <main id="main-content">
        <section style={{ background: 'linear-gradient(180deg, #F0FAF9 0%, #FFFFFF 100%)', borderBottom: '1px solid var(--border)', padding: '64px 0 48px' }}>
          <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
            <div style={{ maxWidth: 640 }}>
              <h1 style={{ fontSize: 'clamp(32px, 5vw, 44px)', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.05, margin: 0, fontFamily: 'var(--font-heading)' }}>Get in touch</h1>
              <p style={{ fontSize: 16, color: 'var(--text-secondary)', lineHeight: 1.6, marginTop: 12 }}>Have a question about your order, want to register your shop, or need help? We reply within 24 hours. For urgent order issues, contact the shop directly.</p>
            </div>
          </div>
        </section>

        <section style={{ padding: '48px 0 80px', background: 'var(--surface-muted)' }}>
          <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 32 }} className="contact-grid">
              <div>
                <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 16, padding: 28, boxShadow: 'var(--shadow-xs)' }}>
                  <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 8px', fontFamily: 'var(--font-heading)' }}>Send us a message</h2>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>We typically reply within 24 hours. You'll get a ticket reference instantly.</p>

                  {status === 'success' ? (
                    <div role="status" aria-live="polite" style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: 12, padding: 24, textAlign: 'center' }}>
                      <div style={{ width: 48, height: 48, background: '#059669', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', color: 'white' }} aria-hidden="true"><Check size={20} /></div>
                      <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>Message sent!</div>
                      <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>Ticket reference: <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'monospace', background: 'white', padding: '2px 6px', borderRadius: 6, border: '1px solid var(--border)' }}>{ticket}</span></div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>We have received your message and will reply within 24 hours. Save this ticket number for follow-up. Check spam folder if you don't see reply.</div>
                      <button onClick={() => setStatus('idle')} style={{ marginTop: 16, background: 'white', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 16px', fontSize: 13, fontWeight: 500, cursor: 'pointer', minHeight: 40 }}>Send another message</button>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      <div style={{ position: 'absolute', left: -5000, top: 'auto', width: 1, height: 1, overflow: 'hidden' }} aria-hidden="true">
                        <label htmlFor="contact-website">Website (leave blank)</label>
                        <input id="contact-website" type="text" value={form.honeypot} onChange={e => setForm({ ...form, honeypot: e.target.value })} tabIndex={-1} autoComplete="off" />
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }} className="form-grid">
                        <div>
                          <label htmlFor="contact-name" style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, display: 'block', color: 'var(--text-primary)' }}>Your name *</label>
                          <input id="contact-name" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Rahul Sharma" style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid var(--border)', fontSize: 14, outline: 'none', background: 'white', minHeight: 44 }} />
                        </div>
                        <div>
                          <label htmlFor="contact-email" style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, display: 'block', color: 'var(--text-primary)' }}>Email address *</label>
                          <input id="contact-email" type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="rahul@example.com" style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid var(--border)', fontSize: 14, outline: 'none', background: 'white', minHeight: 44 }} />
                        </div>
                      </div>
                      <div>
                        <label htmlFor="contact-subject" style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, display: 'block', color: 'var(--text-primary)' }}>Subject</label>
                        <select id="contact-subject" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid var(--border)', fontSize: 14, background: 'white', minHeight: 44 }}>
                          <option>General inquiry</option>
                          <option>Order support</option>
                          <option>Shop registration</option>
                          <option>Payment issue</option>
                          <option>Grievance</option>
                          <option>Feedback</option>
                        </select>
                      </div>
                      <div>
                        <label htmlFor="contact-message" style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, display: 'block', color: 'var(--text-primary)' }}>Message *</label>
                        <textarea id="contact-message" required value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} placeholder="Tell us how we can help you... Include order number if applicable. For shop registration, tell us your shop name, category and pincode." rows={5} style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid var(--border)', fontSize: 14, outline: 'none', resize: 'vertical', background: 'white', minHeight: 120 }} />
                        <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 6 }}>We reply within 24 hours. For order issues, include order number. Max 1000 characters.</div>
                      </div>
                      {status === 'error' && <div role="alert" style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', borderRadius: 10, padding: '10px 14px', fontSize: 13 }}>{error}</div>}
                      <button type="submit" disabled={status === 'loading'} style={{ background: status === 'loading' ? 'var(--text-tertiary)' : '#0F766E', color: 'white', border: 'none', borderRadius: 12, padding: '14px 24px', fontWeight: 600, fontSize: 14, cursor: status === 'loading' ? 'not-allowed' : 'pointer', minHeight: 48, transition: 'all 0.2s ease' }}>{status === 'loading' ? 'Sending...' : 'Send message'}</button>
                      <p style={{ fontSize: 11, color: 'var(--text-tertiary)', textAlign: 'center', lineHeight: 1.4 }}>By sending, you agree to our Privacy Policy and Terms. We rate-limit by IP and apply spam protection. Your data is handled per DPDP Act.</p>
                    </form>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 16, padding: 24, boxShadow: 'var(--shadow-xs)' }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 16px', fontFamily: 'var(--font-heading)' }}>Contact information</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <div style={{ width: 40, height: 40, background: 'var(--surface-muted)', border: '1px solid var(--border)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }} aria-hidden="true"><Mail size={18} color="#0F766E" /></div>
                      <div><div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>Email</div><div style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>support@digital-bazar.example.com</div><div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>For general inquiries • Replies in 24h</div></div>
                    </div>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <div style={{ width: 40, height: 40, background: 'var(--surface-muted)', border: '1px solid var(--border)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }} aria-hidden="true"><MapPin size={18} color="#0F766E" /></div>
                      <div><div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>Office</div><div style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>Nagpur, Maharashtra</div><div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>Launching in Nagpur only, for now • 440001</div></div>
                    </div>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <div style={{ width: 40, height: 40, background: 'var(--surface-muted)', border: '1px solid var(--border)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }} aria-hidden="true"><MessageCircle size={18} color="#0F766E" /></div>
                      <div><div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>WhatsApp (for shops)</div><div style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>Talk to us on WhatsApp</div><div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>For shop onboarding • Quick replies</div></div>
                    </div>
                  </div>
                </div>

                <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 16, padding: 20, boxShadow: 'var(--shadow-xs)' }}>
                  <h3 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 8 }}><Clock size={16} aria-hidden="true" />Response time</h3>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-light)' }}><span>General inquiries</span><span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>24 hours</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-light)' }}><span>Order issues</span><span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>4 hours</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0' }}><span>Grievance</span><span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>24h ack, 15d resolve</span></div>
                  </div>
                </div>

                <div style={{ background: '#0F766E', color: 'white', borderRadius: 16, padding: 24 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}><Store size={18} aria-hidden="true" /><span style={{ fontWeight: 700, fontSize: 15, fontFamily: 'var(--font-heading)' }}>Own a local shop?</span></div>
                  <p style={{ fontSize: 13, opacity: 0.9, lineHeight: 1.6, margin: '0 0 16px' }}>Join shops in Nagpur on Digital Bazar. Setup takes about fifteen minutes. No website needed, no monthly fee while getting started.</p>
                  <a href="/auth/register" style={{ background: 'white', color: '#0F766E', borderRadius: 10, padding: '10px 16px', fontSize: 13, fontWeight: 600, textDecoration: 'none', display: 'inline-block', minHeight: 40 }}>Get listed free</a>
                </div>

                <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, padding: 16, textAlign: 'center' }}>
                  <div style={{ fontSize: 12, color: 'var(--text-tertiary)', lineHeight: 1.4 }}>We are a pickup-first marketplace. You order from specific shop, collect with QR. Real inventory, real photos, no placeholders.</div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <EliteFooter />
      <style>{`@media (max-width: 1024px) { .contact-grid { grid-template-columns: 1fr !important; } .form-grid { grid-template-columns: 1fr !important; } }`}</style>
    </div>
  );
}
