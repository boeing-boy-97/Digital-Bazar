'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Logo } from '@/components/common/Logo';

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
      
      // Redirect based on role
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
      const res = await fetch('/api/auth/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, action: 'send' })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setStep('otp');
      if (data.testOtp) alert(`Test OTP: ${data.testOtp} (Dev mode)`);
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
      const res = await fetch('/api/auth/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp, action: 'verify' })
      });
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
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--background)', padding: 16 }}>
      <div className="card" style={{ width: '100%', maxWidth: 420 }}>
        <div className="card-body" style={{ padding: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
            <Logo />
          </div>
          
          <h1 style={{ fontSize: '24px', fontWeight: 700, textAlign: 'center', marginBottom: 8 }}>Welcome back</h1>
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '14px', marginBottom: 24 }}>
            Login to Digital Bazar
          </p>

          <div className="tabs" style={{ marginBottom: 24 }}>
            <button className={`tab ${mode === 'password' ? 'active' : ''}`} onClick={() => setMode('password')}>Password</button>
            <button className={`tab ${mode === 'otp' ? 'active' : ''}`} onClick={() => { setMode('otp'); setStep('input'); }}>OTP</button>
          </div>

          {error && <div className="alert alert-danger" style={{ marginBottom: 16 }}>{error}</div>}

          {mode === 'password' ? (
            <form onSubmit={handlePasswordLogin} className="stack stack-4">
              <div className="form-group">
                <label className="form-label">Phone or Email</label>
                <input className="form-input" placeholder="Enter phone or email" value={phone || email} onChange={e => {
                  const v = e.target.value;
                  if (v.includes('@')) { setEmail(v); setPhone(''); } else { setPhone(v); setEmail(''); }
                }} required />
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <input type="password" className="form-input" value={password} onChange={e => setPassword(e.target.value)} required />
              </div>
              <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </form>
          ) : (
            <>
              {step === 'input' ? (
                <form onSubmit={handleSendOtp} className="stack stack-4">
                  <div className="form-group">
                    <label className="form-label">Mobile Number</label>
                    <input className="form-input" placeholder="+91 98765 43210" value={phone} onChange={e => setPhone(e.target.value)} required />
                    <div className="form-hint">We'll send a 6-digit OTP</div>
                  </div>
                  <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
                    {loading ? 'Sending...' : 'Send OTP'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="stack stack-4">
                  <div className="form-group">
                    <label className="form-label">Enter OTP sent to {phone}</label>
                    <input className="form-input" placeholder="123456" value={otp} onChange={e => setOtp(e.target.value)} maxLength={6} required style={{ letterSpacing: '8px', textAlign: 'center', fontSize: '20px' }} />
                    <div className="form-hint">Test OTP: 123456 in development</div>
                  </div>
                  <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
                    {loading ? 'Verifying...' : 'Verify OTP'}
                  </button>
                  <button type="button" className="btn btn-ghost btn-full" onClick={() => setStep('input')}>Change number</button>
                </form>
              )}
            </>
          )}

          <div style={{ textAlign: 'center', marginTop: 24, fontSize: '14px', color: 'var(--text-secondary)' }}>
            Don't have account? <Link href="/auth/register" style={{ color: 'var(--brand)', fontWeight: 600 }}>Register</Link>
          </div>

          <div style={{ marginTop: 24, padding: 12, background: 'var(--surface-muted)', borderRadius: '8px', fontSize: '12px' }}>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>Demo Credentials:</div>
            <div>Customer: 9876543210 / password123</div>
            <div>Shop Owner: owner@ganesh.com / owner123</div>
            <div>Admin: admin@digitalbazar.com / admin123</div>
            <div>OTP Test Code: 123456</div>
          </div>
        </div>
      </div>
    </div>
  );
}
