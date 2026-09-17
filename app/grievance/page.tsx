import { EliteHeader } from '@/components/layout/EliteHeader';
import { EliteFooter } from '@/components/layout/EliteFooter';

export const metadata = {
  title: 'Grievance Officer - Consumer complaints | Digital Bazar',
  description: 'Grievance Officer contact details for Digital Bazar marketplace. Required under Indian IT Rules and Consumer Protection e-commerce rules.',
  alternates: { canonical: '/grievance' },
};

export default function GrievancePage() {
  return (
    <div style={{ background: 'var(--surface)', minHeight: '100vh' }}>
      <EliteHeader />
      <main id="main-content" style={{ padding: '64px 0 80px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 24px' }}>
          <h1 style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-0.02em', margin: '0 0 8px', fontFamily: 'var(--font-heading)', lineHeight: 1.1 }}>Grievance Officer</h1>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 32 }}>As required under Information Technology (Intermediary Guidelines) Rules, 2021 and Consumer Protection (E-Commerce) Rules, 2020 • Nagpur</p>

          <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 16, padding: 24, marginBottom: 32, boxShadow: 'var(--shadow-xs)' }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, fontFamily: 'var(--font-heading)' }}>Grievance Officer Details</h2>
            <div style={{ fontSize: 14, lineHeight: 1.7, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div><span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Name:</span> [Your Name] - Founder, Digital Bazar</div>
              <div><span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Designation:</span> Grievance Officer & Nodal Contact</div>
              <div><span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Email:</span> grievance@digital-bazar.example.com</div>
              <div><span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Phone:</span> +91 98765 43210 (Mon-Sat, 10AM-6PM IST)</div>
              <div><span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Address:</span> Digital Bazar, [Your Full Address with Pincode], Nagpur, Maharashtra - 440001, India</div>
              <div><span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Hours:</span> Mon-Sat 10AM-6PM IST, replies within 24 hours</div>
            </div>
            <div style={{ marginTop: 16, padding: 12, background: '#FFFBEB', borderRadius: 10, border: '1px solid #FDE68A', fontSize: 12, color: '#92400E', lineHeight: 1.5 }}>
              <strong>Important:</strong> Replace placeholder name and address with real details before taking payments. This must be a named human, not a generic support email, per IT Rules, 2021. Required for Razorpay and legal compliance.
            </div>
          </div>

          <div style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, display: 'flex', flexDirection: 'column', gap: 24 }}>
            <section>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8, fontFamily: 'var(--font-heading)' }}>Resolution Timelines — as per law</h2>
              <p>We acknowledge every grievance within 24 hours with a ticket reference (like DB-XXXX). We resolve consumer complaints within 15 days as required under e-commerce rules, 2020. For order-related issues, we aim for 48-hour resolution with audit trail. You will receive updates via email and WhatsApp with ticket number.</p>
            </section>
            <section>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8, fontFamily: 'var(--font-heading)' }}>How to file a grievance — 3 ways</h2>
              <p><strong>1. Email:</strong> grievance@digital-bazar.example.com with order number (if applicable), description, and photos. <strong>2. Contact page:</strong> Subject: Grievance. <strong>3. Call:</strong> during business hours Mon-Sat 10AM-6PM. Include ticket reference from previous support if any. We maintain audit log of all grievances with timestamp.</p>
            </section>
            <section>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8, fontFamily: 'var(--font-heading)' }}>Escalation — if not satisfied</h2>
              <p>If not satisfied with Grievance Officer resolution, you may approach Consumer Disputes Redressal Commission under Consumer Protection Act, 2019, or file complaint on National Consumer Helpline (NCH) - 1915 or consumerhelpline.gov.in or e-daakhil. You can also approach Grievance Appellate Committee per IT Rules if applicable.</p>
            </section>
            <section>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8, fontFamily: 'var(--font-heading)' }}>Nodal Officer — for law enforcement</h2>
              <p>For law enforcement requests: nodal@digital-bazar.example.com — available 24x7 for urgent requests. We comply with lawful orders under applicable Indian laws with proper documentation. All requests logged.</p>
            </section>
            <section>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8, fontFamily: 'var(--font-heading)' }}>What counts as grievance</h2>
              <p>Order not delivered, wrong product, product not as described, refund not processed, shop not verified, data privacy issue, counterfeit product, or any violation of Consumer Protection E-Commerce Rules. For general inquiries, use Contact page — replies in 24 hours.</p>
            </section>
          </div>
        </div>
      </main>
      <EliteFooter />
    </div>
  );
}
