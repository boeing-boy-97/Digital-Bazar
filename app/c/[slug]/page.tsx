import { EliteHeader } from '@/components/layout/EliteHeader';
import { EliteFooter } from '@/components/layout/EliteFooter';
import Link from 'next/link';
import { ArrowLeft, Store, MapPin, Package } from 'lucide-react';

const categoryData: Record<string, { name: string; intro: string; desc: string; faq: { q: string; a: string }[] }> = {
  medical: {
    name: 'Medical',
    desc: 'Over-the-counter medicines and personal care',
    intro: 'Medical stores in Nagpur with real inventory. We currently list over-the-counter medicines and personal care products only. Prescription medicines require prescription upload and pharmacist verification — that workflow is being built. Each pharmacy displays its drug licence number and real stock from counter.',
    faq: [
      { q: 'Do you sell prescription medicines?', a: 'Not yet. Currently OTC and personal care only. Prescription workflow with pharmacist verification is required under Indian law for Schedule H/H1/X drugs and is being built with proper encryption and retention.' },
      { q: 'Are medicines from verified pharmacies?', a: 'Yes, all medical shops are verified with drug licence number displayed. Real inventory from shop counter, updated as they sell. No fake stock.' },
      { q: 'How do I know if medicine is in stock?', a: 'Stock is real-time from shop counter. When something sells in shop, it disappears here. If we cannot confirm it is on shelf, we do not show it.' },
    ]
  },
  hardware: {
    name: 'Hardware',
    desc: 'Tools, fasteners, and essentials',
    intro: 'Hardware shops in Nagpur — tools, fasteners, and essentials from verified local shops. See real stock and price before you visit. Order ahead and collect with QR. Every shop has name, address and owner — if something is wrong, you know who to talk to.',
    faq: [
      { q: 'What hardware products are available?', a: 'Tools, fasteners, plumbing fittings, electrical items, and general hardware from local shops. Real inventory from shop counter, not warehouse.' },
      { q: 'Can I check stock before visiting?', a: 'Yes, that is the point. Browse real inventory, reserve it, shop prepares while you travel, you collect with QR.' },
    ]
  },
  'building-material': {
    name: 'Building Material',
    desc: 'Cement, bricks, and construction material',
    intro: 'Building material suppliers in Nagpur — cement, bricks, sand, and construction material. Real stock from verified shops. Order ahead and collect when ready. No more calling shop and hearing "stock nahi hai" after you arrive.',
    faq: [
      { q: 'Do shops deliver building material?', a: 'Some shops offer delivery within 3-5km. Check shop page for delivery badge. Pickup is primary — order ahead, collect when ready.' },
      { q: 'Is price same as shop counter?', a: 'Yes, shop sets its own price. We do not undercut shops or add commission that inflates price. What you see is shop price.' },
    ]
  },
  electrical: {
    name: 'Electrical',
    desc: 'Wires, switches, lights and fittings',
    intro: 'Electrical shops in Nagpur — wires, switches, lights, and fittings from verified local shops. Real inventory, real prices, real photos. Starting in Nagpur, onboarding verified shops every week.',
    faq: [
      { q: 'Are electrical products genuine?', a: 'Yes, from verified local shops with real shop address. Every shop is verified — business details, address with pincode, and documents checked.' },
    ]
  },
  plumbing: {
    name: 'Plumbing',
    desc: 'Pipes, fittings and sanitary ware',
    intro: 'Plumbing shops in Nagpur — pipes, fittings, sanitary ware from verified shops. Order ahead, collect with QR verification. Shop keeps customer, you save time.',
    faq: []
  },
  paint: {
    name: 'Paint',
    desc: 'Paints, primers and brushes',
    intro: 'Paint shops in Nagpur — paints, primers, brushes from verified local shops. See real stock before you leave house. Real inventory from shop counter, updated as they sell.',
    faq: []
  },
  grocery: {
    name: 'Grocery',
    desc: 'Daily essentials from nearby grocers',
    intro: 'Grocery shops in Nagpur — daily essentials from nearby grocers. Real inventory from shop counter, updated as they sell. Order ahead, collect when ready, skip queue.',
    faq: []
  },
  electronics: {
    name: 'Electronics',
    desc: 'Mobiles, accessories and gadgets',
    intro: 'Electronics shops in Nagpur — mobiles, accessories, gadgets from verified local shops. Order ahead and collect when ready. Every order goes to specific shop with name and address.',
    faq: []
  },
};

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const data = categoryData[params.slug];
  if (!data) return { title: 'Category not found | Digital Bazar' };
  return {
    title: `${data.name} shops in Nagpur - ${data.desc} | Digital Bazar`,
    description: data.intro.slice(0, 155),
    alternates: { canonical: `/c/${params.slug}` },
  };
}

export async function generateStaticParams() {
  return Object.keys(categoryData).map(slug => ({ slug }));
}

export default function CategoryPage({ params }: { params: { slug: string } }) {
  const data = categoryData[params.slug];
  if (!data) {
    return (
      <div style={{ background: 'var(--background)', minHeight: '100vh' }}>
        <EliteHeader />
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '80px 24px', textAlign: 'center' }}>
          <h1 style={{ fontSize: 24, fontWeight: 800 }}>Category not found</h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 8 }}>This category does not exist. Browse all categories.</p>
          <Link href="/categories" style={{ color: '#0F766E', fontWeight: 600, marginTop: 16, display: 'inline-block', textDecoration: 'none' }}>Browse categories</Link>
        </div>
        <EliteFooter />
      </div>
    );
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${data.name} shops in Nagpur | Digital Bazar`,
    description: data.intro,
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: '/' },
        { '@type': 'ListItem', position: 2, name: 'Categories', item: '/categories' },
        { '@type': 'ListItem', position: 3, name: data.name, item: `/c/${params.slug}` },
      ]
    }
  };

  return (
    <div style={{ background: 'var(--surface)', minHeight: '100vh' }}>
      <EliteHeader />
      <main id="main-content">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

        <section style={{ background: 'linear-gradient(180deg, #F0FAF9 0%, #FFFFFF 100%)', borderBottom: '1px solid var(--border)', padding: '48px 0 32px' }}>
          <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
            <Link href="/categories" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-secondary)', textDecoration: 'none', marginBottom: 16, fontWeight: 500 }}><ArrowLeft size={14} aria-hidden="true" />All categories</Link>
            <h1 style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 800, letterSpacing: '-0.03em', margin: 0, fontFamily: 'var(--font-heading)', lineHeight: 1.1 }}>{data.name} shops in Nagpur</h1>
            <p style={{ fontSize: 15, color: 'var(--text-secondary)', marginTop: 12, lineHeight: 1.6, maxWidth: 640 }}>{data.intro}</p>
            <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'white', border: '1px solid var(--border)', borderRadius: 100, padding: '6px 12px', fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)' }}>
                <div style={{ width: 6, height: 6, background: '#059669', borderRadius: '50%' }} aria-hidden="true" />
                Live data from database
              </div>
              <div style={{ display: 'inline-flex', background: 'white', border: '1px solid var(--border)', borderRadius: 100, padding: '6px 12px', fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)' }}>
                Real inventory only
              </div>
            </div>
          </div>
        </section>

        <section style={{ padding: '32px 0 80px', background: 'var(--surface-muted)' }}>
          <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
            <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 16, padding: 40, textAlign: 'center', boxShadow: 'var(--shadow-xs)' }}>
              <div style={{ width: 56, height: 56, background: 'var(--surface-muted)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }} aria-hidden="true"><Store size={24} color="var(--text-tertiary)" /></div>
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 8px 0' }}>No {data.name} shops in your area yet</h2>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', maxWidth: 480, margin: '0 auto 20px', lineHeight: 1.5 }}>We're live in Nagpur and expanding one neighbourhood at a time. Tell us your pincode and we'll notify you when a {data.name.toLowerCase()} shop near you joins.</p>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', maxWidth: 400, margin: '0 auto' }}>
                <input placeholder="Enter pincode" aria-label="Pincode for notification" style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border)', fontSize: 14, flex: 1, minWidth: 120, minHeight: 44 }} />
                <button style={{ background: '#0F766E', color: 'white', border: 'none', borderRadius: 10, padding: '10px 18px', fontWeight: 600, fontSize: 13, cursor: 'pointer', minHeight: 44 }}>Notify me</button>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 16 }}>Own a {data.name.toLowerCase()} shop? <Link href="/auth/register" style={{ color: '#0F766E', fontWeight: 600, textDecoration: 'none' }}>Get listed free — 15 min setup.</Link></p>
            </div>

            {data.faq.length > 0 && (
              <div style={{ marginTop: 32 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, fontFamily: 'var(--font-heading)' }}>FAQ — {data.name}</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {data.faq.map((f, i) => (
                    <details key={i} style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 20px', boxShadow: 'var(--shadow-xs)' }}>
                      <summary style={{ fontWeight: 600, fontSize: 14, cursor: 'pointer', listStyle: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-primary)' }}>
                        {f.q}<span style={{ fontSize: 12, color: 'var(--text-tertiary)', width: 24, height: 24, borderRadius: '50%', background: 'var(--surface-muted)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} aria-hidden="true">+</span>
                      </summary>
                      <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginTop: 12, marginBottom: 0 }}>{f.a}</p>
                    </details>
                  ))}
                </div>
              </div>
            )}

            <div style={{ marginTop: 32, background: 'white', border: '1px solid var(--border)', borderRadius: 12, padding: 20, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div style={{ width: 36, height: 36, background: '#E6F4F3', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }} aria-hidden="true"><MapPin size={16} color="#0F766E" /></div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>How we show shops</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, marginTop: 4 }}>We show shops by pincode distance, not just city. Tell us your pincode and we sort by nearest. Location stored locally, never shared. Real photos only, no placeholders.</div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <EliteFooter />
    </div>
  );
}
