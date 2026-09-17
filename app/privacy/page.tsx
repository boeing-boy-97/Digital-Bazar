import { EliteHeader } from '@/components/layout/EliteHeader';
import { EliteFooter } from '@/components/layout/EliteFooter';

export default function PrivacyPage() {
  return (
    <div style={{ background: 'var(--surface)', minHeight: '100vh' }}>
      <EliteHeader />
      <main style={{ padding: '64px 0 80px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 24px' }}>
          <h1 style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-0.02em', margin: '0 0 12px', fontFamily: 'var(--font-heading)' }}>Privacy Policy</h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 32 }}>Last updated: January 2026</p>

          <div style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, display: 'flex', flexDirection: 'column', gap: 24 }}>
            <section>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>1. Information we collect</h2>
              <p>We collect information you provide directly: name, phone, email, address, shop business details, GSTIN, and order information. Location data is stored locally to show nearby shops and calculate distance — never shared with third parties without consent.</p>
            </section>
            <section>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>2. How we use your information</h2>
              <p>To provide marketplace services: show nearby shops, process orders, send notifications about order status, generate GST invoices, and improve shop operations. Real inventory data is transactional and secure.</p>
            </section>
            <section>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>3. Data security</h2>
              <p>We use JWT httpOnly cookies, bcrypt for passwords, RBAC for roles, Zod validation, rate limiting, and audit logs. Payments are verified server-side via Razorpay. Inventory uses transactional logic to prevent overselling.</p>
            </section>
            <section>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>4. Your rights</h2>
              <p>You can access, update, or delete your personal data. Contact support@digitalbazar.com for data requests. Shop owners can manage business information via dashboard.</p>
            </section>
            <section>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>5. Contact</h2>
              <p>For privacy questions, email support@digitalbazar.com or visit our contact page. We're based in Nagpur, Maharashtra, serving all India.</p>
            </section>
          </div>
        </div>
      </main>
      <EliteFooter />
    </div>
  );
}
