'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Logo } from '@/components/common/Logo';

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
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--background)', padding: 16 }}>
      <div className="card" style={{ width: '100%', maxWidth: 480 }}>
        <div className="card-body" style={{ padding: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
            <Logo />
          </div>
          
          <h1 style={{ fontSize: '24px', fontWeight: 700, textAlign: 'center', marginBottom: 8 }}>Create account</h1>
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '14px', marginBottom: 24 }}>
            Join Digital Bazar
          </p>

          {error && <div className="alert alert-danger" style={{ marginBottom: 16 }}>{error}</div>}

          <form onSubmit={handleSubmit} className="stack stack-4">
            <div className="form-group">
              <label className="form-label form-label-required">Full Name</label>
              <input className="form-input" value={name} onChange={e => setName(e.target.value)} required placeholder="Your name" />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input className="form-input" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 98765 43210" />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input type="email" className="form-input" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label form-label-required">Password</label>
              <input type="password" className="form-input" value={password} onChange={e => setPassword(e.target.value)} required placeholder="Min 6 characters" />
            </div>

            <div className="form-group">
              <label className="form-label">I am a</label>
              <select className="form-select" value={role} onChange={e => setRole(e.target.value)}>
                <option value="customer">Customer - I want to buy</option>
                <option value="shop_owner">Shop Owner - I want to sell</option>
              </select>
            </div>

            <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
              {loading ? 'Creating...' : 'Create Account'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: 24, fontSize: '14px', color: 'var(--text-secondary)' }}>
            Already have account? <Link href="/auth/login" style={{ color: 'var(--brand)', fontWeight: 600 }}>Login</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
