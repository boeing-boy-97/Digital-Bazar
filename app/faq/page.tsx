'use client';
import { useState } from 'react';
import { EliteHeader } from '@/components/layout/EliteHeader';
import { EliteFooter } from '@/components/layout/EliteFooter';
import { Plus, Minus, MessageCircle } from 'lucide-react';
import Link from 'next/link';

const faqs = [
  { q: 'What is Digital Bazar and how is it different?', a: 'Digital Bazar is a local commerce marketplace connecting customers with verified nearby shops. Unlike big e-commerce warehouses, you buy from a specific local shop you trust — from medical stores to hardware shops. Real inventory, real prices, real community.' },
  { q: 'How does "order ahead, skip the wait" work?', a: 'Search products from nearby shops, add to cart, place order with pickup time. Shop gets instant notification, accepts and prepares your order sorted by storage zones. You get notified when ready, show QR at counter, collect instantly. Average 25 minutes saved per order.' },
  { q: 'What product categories are supported?', a: 'All local commerce categories: Medical, Hardware, Building Materials (cement, bricks), Plumbing (pipes, fittings), Paint, Electrical, Tools, Grocery, Electronics, and more. If a local shop sells it, Digital Bazar supports it with category-specific attributes.' },
  { q: 'How do shop owners join? Is it complicated?', a: 'Shop owners register with business details, GSTIN, bank info. Admin verifies (PENDING_REVIEW → APPROVED). Then add products by searching master catalog, set price/stock/SKU, manage orders in dashboard. No coding needed — built for shop owners, not developers.' },
  { q: 'Is inventory real-time? Can overselling happen?', a: 'Yes, inventory is transactional: total/reserved/available/sold with server-side validation. When you order, stock is reserved transactionally. On completion, deducted and invoice generated. On cancel/reject, released. Prevents overselling — no fake availability.' },
  { q: 'What about payments, GST invoices and pickup verification?', a: 'Razorpay integration with server-side verification. GST-compliant invoices with GSTIN, HSN codes, tax breakdown auto-generated on order completion. QR verification for pickup — secure, single-use, no fraud. Reviews only for completed orders.' },
  { q: 'Do you support delivery or only pickup?', a: 'Currently focused on pickup (order ahead, collect when ready) which saves time and supports local shops. Delivery support is available for shops that enable it. Check shop details for pickup/delivery options.' },
  { q: 'How are shops verified?', a: 'Shop owners submit business details, GSTIN, address, phone. Admin team verifies documents, shop existence, and compliance. Only APPROVED shops appear to customers. Status can be PENDING_REVIEW, APPROVED, REJECTED, SUSPENDED with reason.' },
];

export default function FAQPage() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div style={{ background: 'var(--surface)', minHeight: '100vh' }}>
      <EliteHeader />

      <main>
        <section style={{ background: 'linear-gradient(180deg, #F0FAF9 0%, #FFFFFF 100%)', borderBottom: '1px solid var(--border)', padding: '64px 0 48px' }}>
          <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
            <div style={{ maxWidth: 640 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--brand-light)', color: 'var(--brand)', fontSize: 11, fontWeight: 700, padding: '6px 12px', borderRadius: 100, letterSpacing: '0.06em', marginBottom: 16 }}><MessageCircle size={12} />FAQ</div>
              <h1 style={{ fontSize: 'clamp(32px, 5vw, 44px)', fontWeight: 800, letterSpacing: '-0.03em', margin: 0, fontFamily: 'var(--font-heading)' }}>Frequently asked questions</h1>
              <p style={{ fontSize: 16, color: 'var(--text-secondary)', marginTop: 12, lineHeight: 1.6 }}>Everything you need to know about Digital Bazar — for customers and shop owners.</p>
            </div>
          </div>
        </section>

        <section style={{ padding: '48px 0 80px', background: 'var(--surface-muted)' }}>
          <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 24px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {faqs.map((faq, idx) => (
                <div key={idx} style={{ background: 'white', border: open === idx ? '1px solid var(--brand)' : '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
                  <button onClick={() => setOpen(open === idx ? null : idx)} style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 22px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', gap: 16 }}>
                    <span style={{ fontWeight: 600, fontSize: 15, color: 'var(--text-primary)' }}>{faq.q}</span>
                    <span style={{ width: 28, height: 28, borderRadius: '50%', background: open === idx ? 'var(--brand)' : 'var(--surface-muted)', color: open === idx ? 'white' : 'var(--text-secondary)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {open === idx ? <Minus size={14} /> : <Plus size={14} />}
                    </span>
                  </button>
                  {open === idx && (
                    <div style={{ padding: '0 22px 20px', fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.65 }}>
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div style={{ marginTop: 48, background: 'white', border: '1px solid var(--border)', borderRadius: 16, padding: 32, textAlign: 'center' }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 8px' }}>Still have questions?</h3>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 20 }}>Can't find what you're looking for? Our support team is here to help.</p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link href="/contact" style={{ background: 'var(--brand)', color: 'white', borderRadius: 10, padding: '10px 20px', fontWeight: 600, fontSize: 13, textDecoration: 'none' }}>Contact support</Link>
                <Link href="/shops" style={{ background: 'var(--surface-muted)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 20px', fontWeight: 500, fontSize: 13, textDecoration: 'none' }}>Browse shops</Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <EliteFooter />
    </div>
  );
}
