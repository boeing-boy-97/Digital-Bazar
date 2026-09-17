import Link from 'next/link';

export function Logo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const iconSize = size === 'sm' ? 28 : size === 'lg' ? 44 : 36;
  return (
    <Link href="/" className="logo">
      <div className="logo-icon" style={{ width: iconSize, height: iconSize, fontSize: size === 'lg' ? '20px' : '16px' }}>
        DB
      </div>
      <div className="logo-text">
        <span className="logo-text-main" style={{ fontSize: size === 'sm' ? '16px' : size === 'lg' ? '22px' : '18px' }}>
          Digital Bazar
        </span>
        <span className="logo-text-sub">Select Before You Arrive</span>
      </div>
    </Link>
  );
}
