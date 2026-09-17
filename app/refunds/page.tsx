import { EliteHeader } from '@/components/layout/EliteHeader';
import { EliteFooter } from '@/components/layout/EliteFooter';

export const metadata = {
  title: 'Refund & Cancellation Policy - Timelines and process | Digital Bazar',
  description: 'Refund and cancellation policy for Digital Bazar. Timelines, process, who decides, and what happens when shop is at fault vs customer. Pickup-first marketplace.',
  alternates: { canonical: '/refunds' },
};

export default function RefundsPage() {
  return (
    <div style={{ background: 'var(--surface)', minHeight: '100vh' }}>
      <EliteHeader />
      <main id="main-content" style={{ padding: '64px 0 80px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 24px' }}>
          <h1 style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-0.02em', margin: '0 0 8px', fontFamily: 'var(--font-heading)', lineHeight: 1.1 }}>Refund & Cancellation Policy</h1>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 32 }}>Last updated: September 2026 • Pickup-first marketplace • Nagpur</p>

          <div style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, display: 'flex', flexDirection: 'column', gap: 24 }}>
            <section>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8, fontFamily: 'var(--font-heading)' }}>1. Cancellation by customer — before shop accepts</h2>
              <p>You can cancel an order before the shop accepts it — full refund, no questions asked. After shop accepts and starts picking, cancellation depends on shop policy and preparation stage. If shop hasn't started preparing within 30 minutes of acceptance, you can cancel for full refund. Use Orders → Cancel or contact shop directly.</p>
            </section>
            <section>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8, fontFamily: 'var(--font-heading)' }}>2. Cancellation by shop — auto-cancel</h2>
              <p>If shop rejects order or doesn't accept within 30 minutes, order auto-cancels and you get full refund if prepaid. Shop must provide reason for rejection. Repeated rejections affect shop visibility and ranking. You get notified via WhatsApp instantly.</p>
            </section>
            <section>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8, fontFamily: 'var(--font-heading)' }}>3. Refund timelines — how long</h2>
              <p>Raise issue within 24 hours of scheduled pickup. Refund decision within 48 hours with audit trail. If approved, refund to original payment method within 5-7 business days. Wallet refunds instant. Pay at store orders have no refund — you simply don't pay if you don't collect. Razorpay refunds processed server-side.</p>
            </section>
            <section>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8, fontFamily: 'var(--font-heading)' }}>4. Who decides — shop at fault vs customer</h2>
              <p><strong>Shop at fault</strong> (wrong item, not as described, not ready): full refund, shop bears cost, may affect shop rating. <strong>Customer at fault</strong> (didn't collect, changed mind after acceptance): no refund for perishable/custom items, 50% for others at shop discretion. Disputed cases reviewed by Digital Bazar support with order events audit trail and photos.</p>
            </section>
            <section>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8, fontFamily: 'var(--font-heading)' }}>5. Uncollected orders — expiry</h2>
              <p>Orders not collected within 24 hours of ready notification are marked EXPIRED. Perishable items: no refund, shop disposes. Non-perishable: shop may restock and refund 80% or hold for 48 hours more at discretion. Customer notified via WhatsApp 12 hours and 2 hours before expiry. Repeated no-shows may affect account.</p>
            </section>
            <section>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8, fontFamily: 'var(--font-heading)' }}>6. How to request refund</h2>
              <p>Go to Orders → Select order → Report issue, or email support@digital-bazar.example.com with order number and photos if product issue. You'll get ticket reference instantly like DB-XXXX. We respond within 24 hours, resolve within 48 hours for order issues.</p>
            </section>
          </div>
        </div>
      </main>
      <EliteFooter />
    </div>
  );
}
