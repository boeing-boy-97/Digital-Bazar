'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Store, Clock, Users, BarChart3, MapPin, Package, CheckCircle, ArrowRight, ShieldCheck, Zap, FileText, CreditCard, Building2, Wrench, Pill, ShoppingCart, Smartphone } from 'lucide-react';
import { EliteHeader } from '@/components/layout/EliteHeader';
import { EliteFooter } from '@/components/layout/EliteFooter';

export default function ShopkeeperOnboarding() {
  const [activeStep, setActiveStep] = useState(0);

  return (
    <div style={{ background: 'var(--surface)', minHeight: '100vh' }}>
      <EliteHeader />
      <main id="main-content">
        {/* Hero - Blinkit-inspired but Digital Bazar concept */}
        <section style={{ background: 'linear-gradient(180deg, #F0FAF9 0%, #FFFFFF 100%)', borderBottom: '1px solid var(--border)', padding: '64px 0 48px', position: 'relative', overflow: 'hidden' }}>
          <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 30% 20%, rgba(15, 118, 110, 0.08) 0%, transparent 50%), radial-gradient(ellipse at 80% 80%, rgba(15, 118, 110, 0.05) 0%, transparent 40%)`, pointerEvents: 'none' }} />
          <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', position: 'relative', textAlign: 'center' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'white', border: '1px solid var(--border)', borderRadius: 100, padding: '7px 14px', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 20, boxShadow: 'var(--shadow-xs)' }}>
              <span style={{ width: 6, height: 6, background: '#059669', borderRadius: '50%' }}></span>
              Digital Bazar Shop Onboarding • Real Local Market Digitization
            </div>
            <h1 style={{ fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: 800, lineHeight: 1, letterSpacing: '-0.03em', color: 'var(--text-primary)', margin: 0, fontFamily: 'var(--font-heading)' }}>
              Start your digital journey<br />
              <span style={{ color: '#0F766E' }}>with Digital Bazar</span>
            </h1>
            <p style={{ fontSize: 16, color: 'var(--text-secondary)', lineHeight: 1.6, marginTop: 16, maxWidth: 600, margin: '16px auto 0' }}>
              As a Digital Bazar shop owner, you digitize your real local shop - from medical to hardware. Customers nearby see your real inventory, reserve before visiting, and collect with QR. You keep customer, margin and relationship.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 24, flexWrap: 'wrap' }}>
              <Link href="/auth/register" style={{ background: '#0F766E', color: 'white', borderRadius: 12, padding: '14px 24px', fontWeight: 600, fontSize: 14, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8, minHeight: 48, boxShadow: '0 4px 14px -2px rgb(15 118 110 / 0.28)' }}>Get listed free<ArrowRight size={16} /></Link>
              <Link href="/about" style={{ background: 'white', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 24px', fontWeight: 500, fontSize: 14, textDecoration: 'none', minHeight: 48 }}>How it works</Link>
            </div>
          </div>
        </section>

        {/* Eligibility - Blinkit-inspired */}
        <section className="blinkit-eligibility-section">
          <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px 24px', textAlign: 'center' }}>
            <h2 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em', margin: 0, fontFamily: 'var(--font-heading)' }}>Eligibility for Digital Bazar shops</h2>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 8 }}>Real shops only, no fake listings. Verified with real photos and GST.</p>
          </div>
          <div className="blinkit-eligibility-grid">
            <div className="blinkit-eligibility-card">
              <div className="blinkit-eligibility-icon"><Clock size={28} /></div>
              <div className="blinkit-eligibility-title">Full Time Commitment • Real shop owner</div>
            </div>
            <div className="blinkit-eligibility-card">
              <div className="blinkit-eligibility-icon"><Users size={28} /></div>
              <div className="blinkit-eligibility-title">Manpower Hiring & Management at Scale</div>
            </div>
            <div className="blinkit-eligibility-card">
              <div className="blinkit-eligibility-icon"><Package size={28} /></div>
              <div className="blinkit-eligibility-title">Strong Inventory Management Skills • FIFO, audits</div>
            </div>
            <div className="blinkit-eligibility-card">
              <div className="blinkit-eligibility-icon"><BarChart3 size={28} /></div>
              <div className="blinkit-eligibility-title">Data-driven Decision Making • Real sales tracking</div>
            </div>
          </div>
        </section>

        {/* Program Overview - Blinkit-inspired 5 steps */}
        <section style={{ background: 'var(--surface-muted)', padding: '72px 0', borderBottom: '1px solid var(--border)' }}>
          <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px 24px', textAlign: 'center' }}>
            <h2 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em', margin: 0, fontFamily: 'var(--font-heading)' }}>Program overview • How to get listed</h2>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 8 }}>From registration to your first order in as little as 15 minutes</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 20, maxWidth: 1280, margin: '0 auto', padding: '0 24px', position: 'relative' }} className="blinkit-selection-grid">
            {[
              { n: 1, icon: MapPin, title: 'Location & Shop Details', desc: 'You provide shop location, category, real photos, address verification' },
              { n: 2, icon: Store, title: 'Shop Setup', desc: 'Digital Bazar verifies your shop with GST, real photos, completion %' },
              { n: 3, icon: Users, title: 'Operational Readiness', desc: 'You add products via master/barcode/CSV/manual, set price/stock' },
              { n: 4, icon: Zap, title: 'Shop Launch', desc: 'Admin approves, shop goes live for customers nearby in Nagpur' },
              { n: 5, icon: BarChart3, title: 'Performance Tracking', desc: 'You track real-time orders, inventory, sales, reservations on dashboard' },
            ].map(step => (
              <div key={step.n} className="blinkit-selection-card">
                <div className="blinkit-selection-number">{step.n}</div>
                <div className="blinkit-selection-icon"><step.icon size={20} /></div>
                <div className="blinkit-selection-title">{step.title}</div>
                <div className="blinkit-selection-desc">{step.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Your Role - Blinkit-inspired */}
        <section className="blinkit-role-section">
          <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px 24px', textAlign: 'center' }}>
            <h2 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em', margin: 0, fontFamily: 'var(--font-heading)' }}>Your role as shop owner</h2>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 8 }}>Real operational workflow: inbound putaway outbound picking packing handover inventory hygiene per Blinkit partners</p>
          </div>
          <div className="blinkit-role-grid">
            <div className="blinkit-role-card">
              <div className="blinkit-role-icon"><Users size={20} /></div>
              <div className="blinkit-role-title">Team Management</div>
              <div className="blinkit-role-list">
                <div className="blinkit-role-item"><div className="blinkit-role-check"><CheckCircle size={12} /></div>Hire, train, manage your team to handle daily shop operations</div>
                <div className="blinkit-role-item"><div className="blinkit-role-check"><CheckCircle size={12} /></div>Manage putting, picking, packing, handover of orders to customers per Blinkit partners</div>
                <div className="blinkit-role-item"><div className="blinkit-role-check"><CheckCircle size={12} /></div>Staff roles: Owner/Manager/Inventory Staff/Order Picker/Cashier/Delivery Staff permissions server-side</div>
              </div>
            </div>
            <div className="blinkit-role-card">
              <div className="blinkit-role-icon"><ShieldCheck size={20} /></div>
              <div className="blinkit-role-title">Inventory Integrity • Real</div>
              <div className="blinkit-role-list">
                <div className="blinkit-role-item"><div className="blinkit-role-check"><CheckCircle size={12} /></div>Manage stock timely using FIFO method, conduct regular audits, uphold hygiene standards</div>
                <div className="blinkit-role-item"><div className="blinkit-role-check"><CheckCircle size={12} /></div>Stocktake Expected vs counted difference reason per point 53 • Real inventory hygiene</div>
                <div className="blinkit-role-item"><div className="blinkit-role-check"><CheckCircle size={12} /></div>Bulk update CSV/barcode/table per point 52 • Catalog health warnings per point 55</div>
              </div>
            </div>
            <div className="blinkit-role-card">
              <div className="blinkit-role-icon"><BarChart3 size={20} /></div>
              <div className="blinkit-role-title">Track Performance • Real Data Only</div>
              <div className="blinkit-role-list">
                <div className="blinkit-role-item"><div className="blinkit-role-check"><CheckCircle size={12} /></div>Monitor sales, productivity, losses, take corrective actions • Real analytics</div>
                <div className="blinkit-role-item"><div className="blinkit-role-check"><CheckCircle size={12} /></div>Adhere to SLAs • Preparation time 15 min configurable per point 50, max active orders capacity per point 32</div>
                <div className="blinkit-role-item"><div className="blinkit-role-check"><CheckCircle size={12} /></div>Demand gap per point 71, forecast transparency Estimated stockout 4-6 days only meaningful per point 72</div>
              </div>
            </div>
          </div>
        </section>

        {/* Selection Process - Blinkit-inspired */}
        <section className="blinkit-selection-section">
          <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px 24px', textAlign: 'center' }}>
            <h2 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em', margin: 0, fontFamily: 'var(--font-heading)' }}>Selection process • How you get verified</h2>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 8 }}>Real verification, not fake approval. Admin reviews shop details, photos, GST, completion %</p>
          </div>
          <div className="blinkit-selection-grid">
            {[
              { n: 1, icon: FileText, title: 'Application', desc: 'Fill form with shop details, category, address, real photos' },
              { n: 2, icon: ShieldCheck, title: 'Screening', desc: 'Admin screens within 24 hours, checks real shop, GST, photos' },
              { n: 3, icon: Users, title: 'Shortlisting', desc: 'If eligible, admin approves, you get onboarding checklist' },
              { n: 4, icon: Store, title: 'Shop Allotment', desc: 'Shop goes live, you add products via master/barcode/CSV/manual' },
              { n: 5, icon: Zap, title: 'Go Live', desc: 'Customers nearby see your real inventory, reserve, order, collect via QR' },
            ].map(s => (
              <div key={s.n} className="blinkit-selection-card">
                <div className="blinkit-selection-number">{s.n}</div>
                <div className="blinkit-selection-icon"><s.icon size={20} /></div>
                <div className="blinkit-selection-title">{s.title}</div>
                <div className="blinkit-selection-desc">{s.desc}</div>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: 32 }}>
            <Link href="/auth/register" style={{ background: '#0F766E', color: 'white', borderRadius: 12, padding: '14px 24px', fontWeight: 600, fontSize: 14, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8, minHeight: 48 }}>Apply now to join Digital Bazar<ArrowRight size={16} /></Link>
            <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 12 }}>Join our growing network of verified local shops in Nagpur • Real shops only</p>
          </div>
        </section>

        {/* Tools - Blinkit-inspired Powerful tools */}
        <section className="blinkit-tools-section">
          <div className="blinkit-tools-container">
            <div className="blinkit-tools-content">
              <h2 className="blinkit-tools-title">Powerful tools to grow your local shop • Real operational</h2>
              <p className="blinkit-tools-subtitle">Use Digital Bazar seller tools to manage real inventory, reservations, orders with real-time insights. Not instant delivery, but real local commerce per Blinkit seller ecosystem ideas.</p>
              <div className="blinkit-tools-list">
                {[
                  { icon: Package, name: 'Bulk stock update', desc: 'Method A search master B scan barcode C bulk CSV/XLSX D manual E bulk stock/price update per point 52', active: activeStep === 0 },
                  { icon: ShieldCheck, name: 'Digital shelf control', desc: 'Visible/Hidden/Out of stock/Temporarily unavailable toggle per point 56,57 • Controls what customer can see', active: activeStep === 1 },
                  { icon: Clock, name: 'Shop pause & reservations', desc: 'Pause online orders/reservations/pickup/delivery without closing physical per point 58,59 + reservation first-class', active: activeStep === 2 },
                ].map((tool, idx) => (
                  <div key={idx} className={`blinkit-tool-item ${tool.active ? 'active' : ''}`} onClick={() => setActiveStep(idx)}>
                    <div className="blinkit-tool-icon"><tool.icon size={18} /></div>
                    <div className="blinkit-tool-text">
                      <div className="blinkit-tool-name">{tool.name}</div>
                      <div className="blinkit-tool-desc">{tool.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="blinkit-tools-image">
              <div className="blinkit-tools-image-placeholder">
                <Store size={32} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>{['Bulk Stock Manager', 'Digital Shelf Manager', 'Pause & Reservation Control'][activeStep]}</div>
                  <div style={{ fontSize: 12, marginTop: 4 }}>Real operational tools from Blinkit seller ecosystem • {['CSV/barcode/table', 'Visible/Hidden/Out/Temporarily', 'Online/Offline per point 58,59'][activeStep]}</div>
                  <div style={{ fontSize: 11, marginTop: 8, color: '#0F766E', fontWeight: 600 }}>Real data only • No fake functionality • Transactional inventory</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Categories - Real, not fake brand logos */}
        <section className="blinkit-brands-section">
          <div className="blinkit-brands-title">Trusted categories • From medical to hardware • Real shops only</div>
          <div style={{ display: 'flex', gap: 16, overflowX: 'auto', padding: '0 24px', scrollbarWidth: 'none' }} className="no-scrollbar">
            {[
              { name: 'Medical', icon: Pill, desc: 'Medicines, equipment' },
              { name: 'Hardware', icon: Wrench, desc: 'Tools, fittings' },
              { name: 'Building Material', icon: Building2, desc: 'Cement, bricks' },
              { name: 'Electrical', icon: Building2, desc: 'Wires, lights' },
              { name: 'Plumbing', icon: Building2, desc: 'Pipes, sanitary' },
              { name: 'Paint', icon: Building2, desc: 'Paints, putty' },
              { name: 'Grocery', icon: ShoppingCart, desc: 'Daily needs' },
              { name: 'Electronics', icon: Smartphone, desc: 'Mobiles, accessories' },
            ].map(cat => (
              <div key={cat.name} className="blinkit-brand-logo" style={{ flexDirection: 'column', gap: 6, height: 80 }}>
                <cat.icon size={20} color="#0F766E" />
                <span>{cat.name}</span>
                <span style={{ fontSize: 10, color: 'var(--text-tertiary)', fontWeight: 400 }}>{cat.desc}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section style={{ padding: '80px 0', background: '#0F172A', color: 'white', position: 'relative', overflow: 'hidden' }}>
          <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', position: 'relative', textAlign: 'center' }}>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.1, margin: 0, fontFamily: 'var(--font-heading)' }}>Your customers are already searching online. Right now they find someone else.</h2>
            <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.7)', marginTop: 16, lineHeight: 1.6, maxWidth: 560, margin: '16px auto 0' }}>List your shop on Digital Bazar and people nearby see what you have in stock. Real local market digitization, not instant delivery.</p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 32, flexWrap: 'wrap' }}>
              <Link href="/auth/register" style={{ background: 'white', color: '#0F172A', borderRadius: 12, padding: '14px 24px', fontWeight: 600, fontSize: 14, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8, minHeight: 48 }}>Get listed free<ArrowRight size={16} /></Link>
              <Link href="/contact" style={{ background: 'rgba(255,255,255,0.08)', color: 'white', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: '14px 24px', fontWeight: 500, fontSize: 14, textDecoration: 'none', minHeight: 48 }}>Talk to us</Link>
            </div>
          </div>
        </section>
      </main>
      <EliteFooter />
    </div>
  );
}
