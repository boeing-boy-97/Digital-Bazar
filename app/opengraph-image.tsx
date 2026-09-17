import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Digital Bazar - Shop Local. Skip the Wait. Real inventory from Nagpur shops';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(135deg, #F0FAF9 0%, #FFFFFF 100%)',
          padding: '60px',
          fontFamily: 'Inter, sans-serif',
          position: 'relative',
        }}
      >
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 30% 20%, rgba(15, 118, 110, 0.08) 0%, transparent 50%)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 40, position: 'relative' }}>
          <div style={{ width: 56, height: 56, background: '#0F766E', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: 20 }}>DB</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#0F172A', letterSpacing: '-0.03em' }}>Digital Bazar • Nagpur</div>
        </div>
        <div style={{ fontSize: 64, fontWeight: 800, color: '#0F172A', lineHeight: 0.95, letterSpacing: '-0.04em', maxWidth: 800, position: 'relative' }}>
          Shop Local.<br />
          <span style={{ color: '#0F766E' }}>Skip the Wait.</span>
        </div>
        <div style={{ fontSize: 20, color: '#475569', marginTop: 24, maxWidth: 600, lineHeight: 1.5, position: 'relative' }}>
          Browse real inventory from verified local shops in Nagpur. Order ahead, collect when ready. Real shops, real photos, no fake stock.
        </div>
        <div style={{ marginTop: 'auto', display: 'flex', gap: 12, fontSize: 14, color: '#94A3B8', position: 'relative' }}>
          <span>✓ Real inventory</span><span>•</span><span>✓ QR verification</span><span>•</span><span>✓ GST invoices</span><span>•</span><span>✓ Pickup-first</span>
        </div>
      </div>
    ),
    { ...size }
  );
}
