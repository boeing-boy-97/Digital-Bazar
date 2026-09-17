import { EliteHeader } from '@/components/layout/EliteHeader';
import { EliteFooter } from '@/components/layout/EliteFooter';

export const metadata = {
  title: 'Terms of Service - Rules for customers and shops | Digital Bazar',
  description: 'Terms of service for Digital Bazar local commerce marketplace. User roles, orders, payments, shop responsibilities, and liability. Pickup-first.',
  alternates: { canonical: '/terms' },
};

export default function TermsPage() {
  return (
    <div style={{ background: 'var(--surface)', minHeight: '100vh' }}>
      <EliteHeader />
      <main id="main-content" style={{ padding: '64px 0 80px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 24px' }}>
          <h1 style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-0.02em', margin: '0 0 8px', fontFamily: 'var(--font-heading)', lineHeight: 1.1 }}>Terms of Service</h1>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>Last updated: September 2026 • Pickup-first marketplace • Nagpur</p>
          <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 32, lineHeight: 1.5, background: 'var(--surface-muted)', border: '1px solid var(--border)', borderRadius: 8, padding: 12 }}>This is a general template and should be reviewed by an Indian lawyer before taking real payments or listing medicines. It aims to comply with Consumer Protection E-Commerce Rules and IT Rules, 2021.</p>

          <div style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, display: 'flex', flexDirection: 'column', gap: 28 }}>
            <section>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8, fontFamily: 'var(--font-heading)' }}>1. What Digital Bazar is</h2>
              <p>Digital Bazar is a marketplace that connects customers with verified local shops in Nagpur (expanding later). We are not the seller — the shop is. We facilitate discovery, order-ahead reservation, payment (where online), and QR collection. We are pickup-first: you order from a specific shop, that shop prepares, you collect in person with QR verification. Real inventory from shop counter, real photos, no placeholders.</p>
            </section>

            <section>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8, fontFamily: 'var(--font-heading)' }}>2. Who can use — 18+ only</h2>
              <p>You must be 18+ and able to form a contract under Indian law. We collect date of birth at registration to verify. For medical category, additional age and prescription checks apply. One person, one customer account. Shops must provide real business details, GSTIN where applicable, address with pincode, and verifiable documents. Real photos only — no stock images.</p>
            </section>

            <section>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8, fontFamily: 'var(--font-heading)' }}>3. Orders, inventory, and collection — how it works</h2>
              <p>Inventory is transactional: total/reserved/available/sold. When you place order, stock is reserved in a DB transaction with row lock (SELECT FOR UPDATE) to prevent overselling. Shop has 30 minutes to accept. If shop rejects or times out, order auto-cancels and you get full refund (if prepaid). If shop accepts, they prepare. You get WhatsApp notification when ready. Collection window 24 hours (6 hours for perishable). Uncollected orders expire — see Shipping Policy. QR token is short-lived signed HMAC over orderId+shopId+nonce with 15-min expiry, consumed atomically on first scan. No QR sharing.</p>
            </section>

            <section>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8, fontFamily: 'var(--font-heading)' }}>4. Payments and invoices — GST compliant</h2>
              <p>Online payments via Razorpay with server-side webhook signature verification — we never mark paid from browser callback. Pay at store option available where shop allows. GST invoices with sequential numbers per shop per financial year, HSN codes, CGST/SGST split, generated on order completion. Prices in INR, GST included where applicable. No hidden fees. Pickup has no shipping fee.</p>
            </section>

            <section>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8, fontFamily: 'var(--font-heading)' }}>5. Shop responsibilities — real data only</h2>
              <p>Shops must maintain accurate inventory, honour reserved orders, provide GST-compliant invoices, display drug licence for medical, and not sell Schedule H/H1/X without prescription verification (prescription workflow is being built — currently OTC only). Shops set their own prices and stock. Repeated rejections or false inventory affect visibility. Shops handle returns per Refund Policy. All product photos must be real — no placeholders. Real inventory from counter.</p>
            </section>

            <section>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8, fontFamily: 'var(--font-heading)' }}>6. What we don't allow</h2>
              <p>No fake inventory, no placeholder images (all shop and product photos must be real), no misleading discounts, no sale of prohibited items under Indian law. Customers: no fake orders, no QR sharing, no abusive behaviour. We log order events for dispute resolution with audit trail. No fake reviews or ratings.</p>
            </section>

            <section>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8, fontFamily: 'var(--font-heading)' }}>7. Liability and disputes — intermediary</h2>
              <p>We are intermediary under IT Act. Seller is responsible for product quality and statutory compliance. We help resolve disputes with audit trail of order events, but final liability for product lies with shop. For grievances, contact Grievance Officer per /grievance — acknowledged 24h, resolved 15 days per IT Rules. For consumer disputes, approach NCH (1915) or CDRC under Consumer Protection Act, 2019.</p>
            </section>

            <section>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8, fontFamily: 'var(--font-heading)' }}>8. Changes to terms</h2>
              <p>We may update these terms. Material changes notified via email/WhatsApp 7 days in advance. Continued use after effective date means acceptance. Check this page regularly for updates.</p>
            </section>
          </div>
        </div>
      </main>
      <EliteFooter />
    </div>
  );
}
