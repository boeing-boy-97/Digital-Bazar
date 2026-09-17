'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { EliteHeader } from '@/components/layout/EliteHeader';
import { EliteFooter } from '@/components/layout/EliteFooter';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('customer');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone: phone || undefined, email: email || undefined, password, role })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');
      if (role === 'shop_owner') router.push('/shopkeeper');
      else router.push('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: 'var(--background)', minHeight: '100vh' }}>
      <EliteHeader showLocation={false} />
      <main style={{ padding: '48px 16px', display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: 480, background: 'white', border: '1px solid var(--border)', borderRadius: 20, padding: 32, boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{ width: 48, height: 48, background: 'var(--brand)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: 18, margin: '0 auto 16px' }}>DB</div>
            <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, letterSpacing: '-0.02em', fontFamily: 'var(--font-heading)' }}>Create account</h1>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 8 }}>Join Digital Bazar — for customers and shop owners</p>
          </div>

          {error && <div style={{ background: 'var(--danger-light)', color: 'var(--danger)', border: '1px solid #FECACA', borderRadius: 10, padding: '10px 14px', fontSize: 13, marginBottom: 16 }}>{error}</div>}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, display: 'block' }}>Full Name *</label>
              <input value={name} onChange={e => setName(e.target.value)} required placeholder="Your name" style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid var(--border)', fontSize: 14, outline: 'none' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, display: 'block' }}>Phone</label>
                <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91..." style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid var(--border)', fontSize: 14, outline: 'none' }} />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, display: 'block' }}>Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid var(--border)', fontSize: 14, outline: 'none' }} />
              </div>
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, display: 'block' }}>Password *</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="Min 6 characters" style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid var(--border)', fontSize: 14, outline: 'none' }} />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, display: 'block' }}>I am a</label>
              <select value={role} onChange={e => setRole(e.target.value)} style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid var(--border)', fontSize: 14, background: 'white' }}>
                <option value="customer">Customer — I want to buy</option>
                <option value="shop_owner">Shop Owner — I want to sell</option>
              </select>
            </div>
            <button type="submit" disabled={loading} style={{ background: 'var(--brand)', color: 'white', border: 'none', borderRadius: 12, padding: '14px', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>{loading ? 'Creating...' : 'Create Account'}</button>
          </form>

          <div style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: 'var(--text-secondary)' }}>Already have account? <Link href="/auth/login" style={{ color: 'var(--brand)', fontWeight: 600, textDecoration: 'none' }}>Login</Link></div>
        </div>
      </main>
      <EliteFooter />
    </div>
  );
}
