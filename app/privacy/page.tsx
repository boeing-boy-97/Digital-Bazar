import { EliteHeader } from '@/components/layout/EliteHeader';
import { EliteFooter } from '@/components/layout/EliteFooter';

export const metadata = {
  title: 'Privacy Policy - How we handle your data | Digital Bazar',
  description: 'Privacy policy for Digital Bazar marketplace. What we collect, how we use it, data retention, and your rights under DPDP Act. Real shops, real data.',
  alternates: { canonical: '/privacy' },
};

export default function PrivacyPage() {
  return (
    <div style={{ background: 'var(--surface)', minHeight: '100vh' }}>
      <EliteHeader />
      <main id="main-content" style={{ padding: '64px 0 80px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 24px' }}>
          <h1 style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-0.02em', margin: '0 0 8px', fontFamily: 'var(--font-heading)', lineHeight: 1.1 }}>Privacy Policy</h1>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>Last updated: September 2026 • Pickup-first marketplace • Nagpur</p>
          <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 32, lineHeight: 1.5, background: 'var(--surface-muted)', border: '1px solid var(--border)', borderRadius: 8, padding: 12 }}>This policy is a general template and should be reviewed by an Indian lawyer before taking real payments or listing medicines. It aims to align with India's Digital Personal Data Protection Act, 2023 and IT Rules.</p>

          <div style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, display: 'flex', flexDirection: 'column', gap: 28 }}>
            <section>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8, fontFamily: 'var(--font-heading)' }}>1. What we collect and why</h2>
              <p style={{ margin: '0 0 12px 0' }}>We collect only what we need to run a local marketplace — no more:</p>
              <ul style={{ margin: '0 0 0 20px', padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <li><strong style={{ color: 'var(--text-primary)' }}>Name, phone, email</strong> — to create your account and send order notifications via WhatsApp/SMS</li>
                <li><strong style={{ color: 'var(--text-primary)' }}>Address and pincode</strong> — to show nearby shops and calculate distance. Pincode is how Indians navigate — we use it, not just city.</li>
                <li><strong style={{ color: 'var(--text-primary)' }}>Location (lat/lng)</strong> — only if you allow geolocation. Stored locally in browser and as cookie so server can pre-localize. You can use manual pincode instead.</li>
                <li><strong style={{ color: 'var(--text-primary)' }}>Shop business details, GSTIN, documents</strong> — to verify shops before they appear to customers. Real shops, real photos only.</li>
                <li><strong style={{ color: 'var(--text-primary)' }}>Order history, cart, product views</strong> — to process orders and show relevant shops</li>
                <li><strong style={{ color: 'var(--text-primary)' }}>Device and usage</strong> — to prevent fraud and improve search</li>
              </ul>
            </section>

            <section>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8, fontFamily: 'var(--font-heading)' }}>2. Consent — how you give it and how you withdraw it</h2>
              <p>We obtain affirmative consent at registration via an unticked checkbox linking to Terms and Privacy — consent must be explicit under Indian data law, not pre-ticked or implied by "by signing up you agree". You can withdraw consent as easily as you gave it: go to Profile → Privacy → Withdraw consent, or email privacy@digital-bazar.example.com. Withdrawing consent will limit marketplace functionality (you cannot order without basic contact info). We keep audit log of consent changes with timestamp.</p>
            </section>

            <section>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8, fontFamily: 'var(--font-heading)' }}>3. How we protect your data</h2>
              <p>Passwords are stored using industry-standard one-way hashing. Access to shop and customer data is restricted by role — customers cannot see other customers' orders, shops can only see their own orders. Payments are processed by our PCI-DSS compliant payment partner Razorpay and we never store card details. Inventory reservations are transactional to prevent overselling. We apply rate limiting, OTP attempt limits, and security headers (X-Frame-Options DENY, HSTS, etc.). QR tokens are single-use signed tokens.</p>
            </section>

            <section>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8, fontFamily: 'var(--font-heading)' }}>4. Data retention — how long we keep it</h2>
              <p>Account data: retained while account active, deleted within 30 days of deletion request. Order data: retained for 7 years for tax/GST compliance (invoices need sequential numbers per shop per financial year). Prescriptions (when medical workflow ships): encrypted at rest, retained for 2 years per drug licence rules, then deleted. Cart and search logs: 90 days. Location cookie: 30 days. Consent logs: 7 years.</p>
            </section>

            <section>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8, fontFamily: 'var(--font-heading)' }}>5. Your rights — correction, erasure, grievance</h2>
              <p>You can access, correct, or request erasure of your personal data via Profile or by emailing grievance@digital-bazar.example.com. We respond within 15 days. For grievances under IT Rules, contact our Grievance Officer on /grievance page — acknowledged within 24 hours, resolved within 15 days. For law enforcement requests, see Nodal Officer on same page. You can also approach Consumer Disputes Redressal Commission.</p>
            </section>

            <section>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8, fontFamily: 'var(--font-heading)' }}>6. Children's data and age gate — 18+ only</h2>
              <p>You must be 18+ to register. We collect date of birth at registration to verify age, especially given medical category. We do not knowingly collect data from children under 18. If you are under 18, you may not use Digital Bazar. For medical products, additional verifications apply. Prescription medicines require prescription upload and pharmacist verification when workflow ships.</p>
            </section>

            <section>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8, fontFamily: 'var(--font-heading)' }}>7. Cross-border transfers and cookies</h2>
              <p>Our primary infrastructure is in India. If any processing occurs outside India, we disclose it here and ensure adequate protection. We use essential cookies for authentication and location personalization. Non-essential analytics are gated behind cookie consent banner — we don't load them until you accept. You can manage consent in footer or via banner. Essential cookies always on, analytics optional.</p>
            </section>

            <section>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8, fontFamily: 'var(--font-heading)' }}>8. Contact — privacy and grievance</h2>
              <p>Privacy questions: privacy@digital-bazar.example.com. Grievance: grievance@digital-bazar.example.com. Office: Nagpur, Maharashtra, India. See /grievance for full officer details and address. For general support: support@digital-bazar.example.com — replies within 24 hours.</p>
            </section>
          </div>
        </div>
      </main>
      <EliteFooter />
    </div>
  );
}
