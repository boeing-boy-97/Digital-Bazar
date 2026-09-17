import { EliteHeader } from '@/components/layout/EliteHeader';
import { EliteFooter } from '@/components/layout/EliteFooter';
import Link from 'next/link';

export const metadata = {
  title: 'FAQ - How Digital Bazar works for customers and shops | Digital Bazar',
  description: 'Frequently asked questions about Digital Bazar local commerce marketplace. How order ahead works, categories, shop onboarding, inventory, payments, QR verification.',
  alternates: { canonical: '/faq' },
};

const faqs = [
  { q: 'What is Digital Bazar and how is it different from big e-commerce?', a: 'Digital Bazar is a local commerce marketplace connecting customers with verified nearby shops in Nagpur. Unlike big e-commerce warehouses, you buy from a specific local shop you trust — from medical stores to hardware shops. Real inventory from shop counter, real prices, real photos, real community. Starting in Nagpur, onboarding verified shops every week. No fake stock, no placeholders.' },
  { q: 'How does order ahead and collect work?', a: 'Search products from nearby shops, add to cart from one shop, place order with pickup time. Shop gets instant notification, accepts and prepares your order. You get WhatsApp notification when ready, walk in, show QR code, shop scans it, you collect. GST invoice sent to your messages. You skip queue and save 20-30 minutes per order.' },
  { q: 'What product categories are supported?', a: 'All local commerce categories: Medical (currently OTC and personal care only — prescription workflow with pharmacist verification being built), Hardware, Building Materials (cement, bricks), Plumbing (pipes, fittings), Paint, Electrical, Tools, Grocery, Electronics, and more. If a local shop sells it, we can list it with category-specific attributes. Real inventory only.' },
  { q: 'How do shop owners join Digital Bazar?', a: 'Shop owners register with business details, GSTIN, address with pincode, and documents. Admin verifies (PENDING_REVIEW → APPROVED). Then add products by searching master catalog, set price/stock/SKU, manage orders in dashboard with zone-based picking. No coding needed, no website needed. Setup takes about fifteen minutes. No monthly fee while getting started.' },
  { q: 'Is inventory real-time? Can overselling happen?', a: 'Yes, inventory is transactional: total/reserved/available/sold with server-side validation. When you order, stock is reserved transactionally in a database transaction with SELECT FOR UPDATE row lock. On completion, deducted and invoice generated. On cancel/reject, released. Prevents overselling. Available = onHand - reserved. Real inventory from shop counter.' },
  { q: 'What about payments, GST invoices and QR verification?', a: 'Razorpay integration with server-side webhook signature verification — we never mark order paid from browser callback. GST-compliant invoices with GSTIN, HSN codes, CGST/SGST split auto-generated on order completion with sequential numbers per shop per financial year. QR verification is a short-lived signed HMAC token over orderId + shopId + nonce with 15-minute expiry, marked consumed atomically on first scan. No QR sharing.' },
  { q: 'Do you support delivery or only pickup?', a: 'Pickup-first: order ahead, collect when ready. Some shops offer delivery within 3-5km — check shop page for delivery badge. Delivery fee shown at checkout. Pickup has no shipping fee. You pay shop price only. Starting in Nagpur.' },
  { q: 'How are shops verified and how is my data handled?', a: 'Shop owners submit business details, GSTIN, address with pincode, phone, and documents. Admin verifies documents and shop existence. Only APPROVED shops appear with real photos. Your location is stored locally to show nearby shops, never shared. Passwords stored with bcrypt, JWT httpOnly cookies, RBAC, Zod validation, rate limiting, audit logs. See Privacy Policy for DPDP-aligned details. We log consent timestamp.' },
  { q: 'What happens if I do not collect my order?', a: 'Once order is marked READY, you have 24 hours to collect (6 hours for perishable). Shop holds your order in reserved area. You get reminder after 12 hours, warning 2 hours before expiry. After 24 hours, order marked EXPIRED. Perishable: shop disposes, no refund. Non-perishable: shop may restock and refund 80% or hold 48 hours more. Customer notified via WhatsApp before expiry.' },
];

export default function FAQPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(f => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a }
    }))
  };

  return (
    <div style={{ background: 'var(--surface)', minHeight: '100vh' }}>
      <EliteHeader />
      <main id="main-content">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

        <section style={{ background: 'linear-gradient(180deg, #F0FAF9 0%, #FFFFFF 100%)', borderBottom: '1px solid var(--border)', padding: '64px 0 48px' }}>
          <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
            <div style={{ maxWidth: 640 }}>
              <h1 style={{ fontSize: 'clamp(32px, 5vw, 44px)', fontWeight: 800, letterSpacing: '-0.03em', margin: 0, fontFamily: 'var(--font-heading)', lineHeight: 1.05 }}>Frequently asked questions</h1>
              <p style={{ fontSize: 16, color: 'var(--text-secondary)', marginTop: 12, lineHeight: 1.6 }}>Everything you need to know about Digital Bazar — for customers and shop owners. All answers are in HTML for search indexing, with JSON-LD.</p>
              <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 100, padding: '6px 12px', fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)' }}>Real shops • Real inventory</div>
                <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 100, padding: '6px 12px', fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)' }}>Pickup-first • QR verification</div>
              </div>
            </div>
          </div>
        </section>

        <section style={{ padding: '48px 0 80px', background: 'var(--surface-muted)' }}>
          <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 24px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {faqs.map((faq, idx) => (
                <details key={idx} open={idx === 0} style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 16, padding: '0 22px', boxShadow: 'var(--shadow-xs)' }} className="faq-details">
                  <summary style={{ padding: '20px 0', fontWeight: 600, fontSize: 15, color: 'var(--text-primary)', cursor: 'pointer', listStyle: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, minHeight: 44 }}>
                    <span style={{ lineHeight: 1.4 }}>{faq.q}</span>
                    <span aria-hidden="true" style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--surface-muted)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0, transition: 'all 0.2s ease' }}>+</span>
                  </summary>
                  <div style={{ padding: '0 0 20px', fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.65 }}>
                    {faq.a}
                  </div>
                </details>
              ))}
            </div>

            <div style={{ marginTop: 48, background: 'white', border: '1px solid var(--border)', borderRadius: 16, padding: 32, textAlign: 'center', boxShadow: 'var(--shadow-xs)' }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 8px', fontFamily: 'var(--font-heading)' }}>Still have questions?</h2>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 20, lineHeight: 1.5 }}>Can't find what you're looking for? Our support team is here to help within 24 hours.</p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link href="/contact" style={{ background: '#0F766E', color: 'white', borderRadius: 11, padding: '11px 20px', fontWeight: 600, fontSize: 13, textDecoration: 'none', minHeight: 44, display: 'inline-flex', alignItems: 'center' }}>Contact support</Link>
                <Link href="/shops" style={{ background: 'var(--surface-muted)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 11, padding: '11px 20px', fontWeight: 500, fontSize: 13, textDecoration: 'none', minHeight: 44, display: 'inline-flex', alignItems: 'center' }}>Browse shops</Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <EliteFooter />

      <style>{`
        .faq-details[open] summary span:last-child { background: #0F766E !important; color: white !important; border-color: #0F766E !important; transform: rotate(45deg); }
        .faq-details summary::-webkit-details-marker { display: none; }
        .faq-details:hover { border-color: var(--border-strong) !important; }
      `}</style>
    </div>
  );
}
