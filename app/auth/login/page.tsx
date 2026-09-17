'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { EliteHeader } from '@/components/layout/EliteHeader';
import { EliteFooter } from '@/components/layout/EliteFooter';
import { Eye, EyeOff, Phone, Mail, Lock, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [mode, setMode] = useState<'password' | 'otp'>('password');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const showDemoCreds = process.env.NEXT_PUBLIC_SHOW_DEMO_CREDS === 'true';

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone || undefined, email: email || undefined, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      if (data.user.role === 'shop_owner') router.push('/shopkeeper');
      else if (data.user.role === 'admin') router.push('/admin');
      else router.push('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone || undefined, email: email || undefined, otp })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'OTP verification failed');
      router.push('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const requestOtp = async () => {
    if (!phone && !email) {
      setError('Enter phone or email to get OTP');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone || undefined, email: email || undefined, action: 'send' })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send OTP');
      alert('OTP sent — use 123456 for demo');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: 'var(--background)', minHeight: '100vh' }}>
      <EliteHeader showLocation={false} />
      <main id="main-content" style={{ padding: '48px 16px', display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: 440, background: 'white', border: '1px solid var(--border)', borderRadius: 20, padding: 32, boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{ width: 48, height: 48, background: '#0F766E', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: 18, margin: '0 auto 16px', boxShadow: '0 4px 12px -2px rgb(15 118 110 / 0.3)' }}>DB</div>
            <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, letterSpacing: '-0.02em', fontFamily: 'var(--font-heading)' }}>Welcome back</h1>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 8, lineHeight: 1.5 }}>Login to Digital Bazar — real shops, real inventory, Nagpur</p>
          </div>

          <div style={{ display: 'flex', background: 'var(--surface-muted)', borderRadius: 10, padding: 4, marginBottom: 20 }}>
            <button onClick={() => setMode('password')} style={{ flex: 1, background: mode === 'password' ? 'white' : 'transparent', border: mode === 'password' ? '1px solid var(--border)' : 'none', borderRadius: 8, padding: '8px', fontSize: 13, fontWeight: 600, cursor: 'pointer', boxShadow: mode === 'password' ? 'var(--shadow-xs)' : 'none' }}>Password</button>
            <button onClick={() => setMode('otp')} style={{ flex: 1, background: mode === 'otp' ? 'white' : 'transparent', border: mode === 'otp' ? '1px solid var(--border)' : 'none', borderRadius: 8, padding: '8px', fontSize: 13, fontWeight: 600, cursor: 'pointer', boxShadow: mode === 'otp' ? 'var(--shadow-xs)' : 'none' }}>OTP</button>
          </div>

          {error && <div role="alert" style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', borderRadius: 10, padding: '10px 14px', fontSize: 13, marginBottom: 16 }}>{error}</div>}

          {showDemoCreds && (
            <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 10, padding: 12, marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#92400E', marginBottom: 6, letterSpacing: '0.04em' }}>PREVIEW DEMO (not in production)</div>
              <div style={{ fontSize: 11, color: '#92400E', lineHeight: 1.5, fontFamily: 'monospace' }}>
                Customer: 9876543210 / password123<br />
                Shop: owner@ganesh.com / owner123<br />
                Admin: admin@digitalbazar.com / admin123<br />
                OTP: 123456
              </div>
            </div>
          )}

          {mode === 'password' ? (
            <form onSubmit={handlePasswordLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label htmlFor="login-phone" style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, display: 'block', color: 'var(--text-primary)' }}>Phone or Email</label>
                <div style={{ position: 'relative' }}>
                  <Phone size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} aria-hidden="true" />
                  <input id="login-phone" value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone number" style={{ width: '100%', padding: '12px 14px 12px 36px', borderRadius: 10, border: '1px solid var(--border)', fontSize: 14, outline: 'none', minHeight: 44 }} />
                </div>
                <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-tertiary)', margin: '8px 0' }}>or</div>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} aria-hidden="true" />
                  <input id="login-email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email address" style={{ width: '100%', padding: '12px 14px 12px 36px', borderRadius: 10, border: '1px solid var(--border)', fontSize: 14, outline: 'none', minHeight: 44 }} />
                </div>
              </div>
              <div>
                <label htmlFor="login-password" style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, display: 'block', color: 'var(--text-primary)' }}>Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} aria-hidden="true" />
                  <input id="login-password" type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required placeholder="Your password" style={{ width: '100%', padding: '12px 36px 12px 36px', borderRadius: 10, border: '1px solid var(--border)', fontSize: 14, outline: 'none', minHeight: 44 }} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)' }}>{showPassword ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}</button>
                </div>
              </div>
              <button type="submit" disabled={loading} style={{ background: '#0F766E', color: 'white', border: 'none', borderRadius: 12, padding: '14px', fontWeight: 600, fontSize: 14, cursor: loading ? 'not-allowed' : 'pointer', minHeight: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>{loading ? 'Logging in...' : <>Login<ArrowRight size={16} aria-hidden="true" /></>}</button>
            </form>
          ) : (
            <form onSubmit={handleOtpLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, display: 'block', color: 'var(--text-primary)' }}>Phone or Email for OTP</label>
                <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone number" style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid var(--border)', fontSize: 14, outline: 'none', marginBottom: 8, minHeight: 44 }} />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Or email address" style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid var(--border)', fontSize: 14, outline: 'none', minHeight: 44 }} />
              </div>
              <button type="button" onClick={requestOtp} disabled={loading} style={{ background: 'var(--surface-muted)', color: 'var(--text-primary)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px', fontWeight: 500, fontSize: 13, cursor: 'pointer', minHeight: 44 }}>Send OTP</button>
              <div>
                <label htmlFor="login-otp" style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, display: 'block', color: 'var(--text-primary)' }}>Enter OTP</label>
                <input id="login-otp" value={otp} onChange={e => setOtp(e.target.value)} placeholder="123456" style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid var(--border)', fontSize: 14, outline: 'none', minHeight: 44, letterSpacing: '0.1em' }} />
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 6 }}>OTP is 6 digits, expires in 5 minutes. Rate limited — max 3 attempts per 15 minutes.</div>
              </div>
              <button type="submit" disabled={loading} style={{ background: '#0F766E', color: 'white', border: 'none', borderRadius: 12, padding: '14px', fontWeight: 600, fontSize: 14, cursor: loading ? 'not-allowed' : 'pointer', minHeight: 48 }}>{loading ? 'Verifying...' : 'Verify OTP & Login'}</button>
            </form>
          )}

          <div style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: 'var(--text-secondary)' }}>
            Don't have account? <Link href="/auth/register" style={{ color: '#0F766E', fontWeight: 600, textDecoration: 'none' }}>Create account</Link>
          </div>

          <div style={{ marginTop: 20, padding: 12, background: 'var(--surface-muted)', borderRadius: 10, border: '1px solid var(--border-light)', fontSize: 11, color: 'var(--text-tertiary)', lineHeight: 1.4, textAlign: 'center' }}>
            Secure login • JWT httpOnly cookies • bcrypt passwords • Rate limited • 18+ only
          </div>
        </div>
      </main>
      <EliteFooter />
    </div>
  );
}
