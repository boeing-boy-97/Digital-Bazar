import { EliteHeader } from '@/components/layout/EliteHeader';
import { EliteFooter } from '@/components/layout/EliteFooter';

export const metadata = {
  title: 'Shipping & Pickup Policy - How collection works | Digital Bazar',
  description: 'Pickup-first marketplace. How order ahead and QR collection works, collection window, what happens to uncollected orders. Starting in Nagpur.',
  alternates: { canonical: '/shipping' },
};

export default function ShippingPage() {
  return (
    <div style={{ background: 'var(--surface)', minHeight: '100vh' }}>
      <EliteHeader />
      <main id="main-content" style={{ padding: '64px 0 80px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 24px' }}>
          <h1 style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-0.02em', margin: '0 0 8px', fontFamily: 'var(--font-heading)', lineHeight: 1.1 }}>Shipping & Pickup Policy</h1>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 32 }}>Pickup-first marketplace • Starting in Nagpur • Real inventory • QR verification</p>

          <div style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, display: 'flex', flexDirection: 'column', gap: 24 }}>
            <section>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8, fontFamily: 'var(--font-heading)' }}>1. Our model: order ahead, collect in person</h2>
              <p>Digital Bazar is pickup-first, not delivery. You reserve products from a specific nearby shop, the shop prepares your order, you get notified when ready, and you collect by showing a QR code at the counter. This saves you 20-30 minutes per order and keeps the shop's customer relationship intact. You know exactly who to talk to if something is wrong — they're ten-minute walk away.</p>
            </section>
            <section>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8, fontFamily: 'var(--font-heading)' }}>2. How pickup works — 4 steps</h2>
              <p><strong>1. Search</strong> products across nearby shops — real inventory from counter. <strong>2. Add to cart</strong> from one shop at a time (one shop per order). <strong>3. Place order</strong> with pickup time. Shop accepts within 30 min and starts picking with zone-based picking. <strong>4. Collect:</strong> You get WhatsApp notification when ready. Walk in, show QR code, shop scans, you collect. GST invoice sent to your messages. Skip queue.</p>
            </section>
            <section>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8, fontFamily: 'var(--font-heading)' }}>3. Collection window — 24 hours</h2>
              <p>Once order is marked READY, you have 24 hours to collect. Shop holds your order in reserved area. You'll get reminder after 12 hours, and warning 2 hours before expiry via WhatsApp. Perishable items (if any) have 6-hour window. QR token is short-lived signed HMAC with 15-minute expiry — show fresh code from app.</p>
            </section>
            <section>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8, fontFamily: 'var(--font-heading)' }}>4. What happens to uncollected orders — expiry</h2>
              <p>After 24 hours, order marked EXPIRED. Perishable: shop disposes, no refund. Non-perishable: shop restocks and may refund 80% or hold 48 hours more at discretion. Customer notified before expiry. Repeated no-shows may affect account standing. Shop can report no-show.</p>
            </section>
            <section>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8, fontFamily: 'var(--font-heading)' }}>5. Delivery — where available</h2>
              <p>Some shops offer delivery within 3-5km. Check shop page for delivery badge. Delivery fee and time shown at checkout before payment. Delivery orders still use QR verification at doorstep — customer shows QR, delivery person scans. Currently pickup is primary focus, delivery secondary.</p>
            </section>
            <section>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8, fontFamily: 'var(--font-heading)' }}>6. No shipping charges for pickup — pay shop price only</h2>
              <p>Pickup orders have no shipping fee. You pay shop price only — we don't add commission that inflates price. Delivery orders (where offered) show fee at checkout before payment. All prices in INR, GST included where applicable, HSN codes on invoice. GST invoices auto-generated with sequential numbers per shop per financial year.</p>
            </section>
          </div>
        </div>
      </main>
      <EliteFooter />
    </div>
  );
}
