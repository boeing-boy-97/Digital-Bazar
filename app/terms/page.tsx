import { EliteHeader } from '@/components/layout/EliteHeader';
import { EliteFooter } from '@/components/layout/EliteFooter';

export default function TermsPage() {
  return (
    <div style={{ background: 'var(--surface)', minHeight: '100vh' }}>
      <EliteHeader />
      <main style={{ padding: '64px 0 80px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 24px' }}>
          <h1 style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-0.02em', margin: '0 0 12px', fontFamily: 'var(--font-heading)' }}>Terms of Service</h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 32 }}>Last updated: January 2026</p>

          <div style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, display: 'flex', flexDirection: 'column', gap: 24 }}>
            <section>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>1. Acceptance of terms</h2>
              <p>By using Digital Bazar, you agree to these terms. Digital Bazar is a local commerce marketplace connecting customers with verified nearby shops for all product types — from medical to hardware.</p>
            </section>
            <section>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>2. User roles</h2>
              <p>Three roles: customer (browse shops, order, pickup), shop owner/employee (manage products, orders, inventory, employees), admin (master catalog, shop approval, system health). Each has distinct permissions.</p>
            </section>
            <section>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>3. Orders and payments</h2>
              <p>Orders are placed with server-side validation of price, stock, and availability. Inventory is reserved transactionally. Payments via Razorpay with server verification. GST invoices generated on completion. Pickup via QR verification — single-use, secure.</p>
            </section>
            <section>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>4. Shop responsibilities</h2>
              <p>Shop owners must provide accurate business details, GSTIN, and maintain real inventory. Orders must be accepted/prepared promptly. Zone-based picking for efficient operations. No fake availability — real data only.</p>
            </section>
            <section>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>5. Limitation of liability</h2>
              <p>Digital Bazar facilitates transactions between customers and local shops. Product quality and fulfillment are shop responsibilities. We provide secure platform, real-time notifications, and transactional integrity.</p>
            </section>
          </div>
        </div>
      </main>
      <EliteFooter />
    </div>
  );
}
