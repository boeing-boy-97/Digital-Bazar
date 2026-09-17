'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { EliteHeader } from '@/components/layout/EliteHeader';
import { EliteFooter } from '@/components/layout/EliteFooter';

export default function LoginPage() {
  const [mode, setMode] = useState<'password' | 'otp'>('password');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'input' | 'otp'>('input');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

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
      else if (['admin','super_admin'].includes(data.user.role)) router.push('/admin');
      else router.push('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/otp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone, action: 'send' }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setStep('otp');
      if (data.testOtp) alert(`Test OTP: ${data.testOtp}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/otp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone, otp, action: 'verify' }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.push('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: 'var(--background)', minHeight: '100vh' }}>
      <EliteHeader showLocation={false} />
      <main style={{ padding: '64px 16px', display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: 440, background: 'white', border: '1px solid var(--border)', borderRadius: 20, padding: 32, boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{ width: 48, height: 48, background: 'var(--brand)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: 18, margin: '0 auto 16px' }}>DB</div>
            <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, letterSpacing: '-0.02em', fontFamily: 'var(--font-heading)' }}>Welcome back</h1>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 8 }}>Login to Digital Bazar</p>
          </div>

          <div style={{ display: 'flex', background: 'var(--surface-muted)', borderRadius: 10, padding: 4, marginBottom: 24 }}>
            <button onClick={() => setMode('password')} style={{ flex: 1, padding: '10px', borderRadius: 8, border: 'none', background: mode === 'password' ? 'white' : 'transparent', fontWeight: 600, fontSize: 13, cursor: 'pointer', boxShadow: mode === 'password' ? 'var(--shadow-xs)' : 'none' }}>Password</button>
            <button onClick={() => { setMode('otp'); setStep('input'); }} style={{ flex: 1, padding: '10px', borderRadius: 8, border: 'none', background: mode === 'otp' ? 'white' : 'transparent', fontWeight: 600, fontSize: 13, cursor: 'pointer', boxShadow: mode === 'otp' ? 'var(--shadow-xs)' : 'none' }}>OTP</button>
          </div>

          {error && <div style={{ background: 'var(--danger-light)', color: 'var(--danger)', border: '1px solid #FECACA', borderRadius: 10, padding: '10px 14px', fontSize: 13, marginBottom: 16 }}>{error}</div>}

          {mode === 'password' ? (
            <form onSubmit={handlePasswordLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, display: 'block' }}>Phone or Email</label>
                <input placeholder="Enter phone or email" value={phone || email} onChange={e => { const v = e.target.value; if (v.includes('@')) { setEmail(v); setPhone(''); } else { setPhone(v); setEmail(''); } }} required style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid var(--border)', fontSize: 14, outline: 'none' }} />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, display: 'block' }}>Password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} required style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid var(--border)', fontSize: 14, outline: 'none' }} />
              </div>
              <button type="submit" disabled={loading} style={{ background: 'var(--brand)', color: 'white', border: 'none', borderRadius: 12, padding: '14px', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>{loading ? 'Logging in...' : 'Login'}</button>
            </form>
          ) : (
            <>
              {step === 'input' ? (
                <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, display: 'block' }}>Mobile Number</label>
                    <input placeholder="+91 98765 43210" value={phone} onChange={e => setPhone(e.target.value)} required style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid var(--border)', fontSize: 14, outline: 'none' }} />
                    <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 6 }}>We'll send a 6-digit OTP</div>
                  </div>
                  <button type="submit" disabled={loading} style={{ background: 'var(--brand)', color: 'white', border: 'none', borderRadius: 12, padding: '14px', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>{loading ? 'Sending...' : 'Send OTP'}</button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, display: 'block' }}>Enter OTP sent to {phone}</label>
                    <input placeholder="123456" value={otp} onChange={e => setOtp(e.target.value)} maxLength={6} required style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid var(--border)', fontSize: 18, letterSpacing: '8px', textAlign: 'center', outline: 'none' }} />
                    <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 6 }}>Test OTP: 123456 in development</div>
                  </div>
                  <button type="submit" disabled={loading} style={{ background: 'var(--brand)', color: 'white', border: 'none', borderRadius: 12, padding: '14px', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>{loading ? 'Verifying...' : 'Verify OTP'}</button>
                  <button type="button" onClick={() => setStep('input')} style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)', borderRadius: 12, padding: '12px', fontWeight: 500, fontSize: 13, cursor: 'pointer' }}>Change number</button>
                </form>
              )}
            </>
          )}

          <div style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: 'var(--text-secondary)' }}>Don't have account? <Link href="/auth/register" style={{ color: 'var(--brand)', fontWeight: 600, textDecoration: 'none' }}>Register</Link></div>

          <div style={{ marginTop: 24, padding: 16, background: 'var(--surface-muted)', borderRadius: 12, fontSize: 12, border: '1px solid var(--border)' }}>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>Demo Credentials:</div>
            <div>Customer: 9876543210 / password123</div>
            <div>Shop Owner: owner@ganesh.com / owner123</div>
            <div>Admin: admin@digitalbazar.com / admin123</div>
          </div>
        </div>
      </main>
      <EliteFooter />
    </div>
  );
}
