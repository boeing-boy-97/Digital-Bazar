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
  const [dob, setDob] = useState('');
  const [role, setRole] = useState('customer');
  const [consent, setConsent] = useState(false);
  const [ageConfirm, setAgeConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const calculateAge = (dobStr: string) => {
    if (!dobStr) return 0;
    const dobDate = new Date(dobStr);
    const diff = Date.now() - dobDate.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!consent) {
      setError('You must agree to Terms of Service and Privacy Policy to create an account. Consent is unticked by default per DPDP Act.');
      return;
    }
    if (!ageConfirm) {
      setError('You must confirm you are 18+ to use Digital Bazar.');
      return;
    }
    if (dob) {
      const age = calculateAge(dob);
      if (age < 18) {
        setError('You must be 18+ to register. Digital Bazar is for adults only, especially for medical category.');
        return;
      }
    } else {
      setError('Please enter your date of birth for age verification — required for medical category and 18+ check.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone: phone || undefined, email: email || undefined, password, role, dob })
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
      <main id="main-content" style={{ padding: '48px 16px', display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: 480, background: 'white', border: '1px solid var(--border)', borderRadius: 20, padding: 32, boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{ width: 48, height: 48, background: '#0F766E', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: 18, margin: '0 auto 16px', boxShadow: '0 4px 12px -2px rgb(15 118 110 / 0.3)' }}>DB</div>
            <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, letterSpacing: '-0.02em', fontFamily: 'var(--font-heading)' }}>Create account</h1>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 8, lineHeight: 1.4 }}>Join Digital Bazar — for customers and shop owners • 18+ only • Nagpur</p>
          </div>

          {error && <div role="alert" style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', borderRadius: 10, padding: '10px 14px', fontSize: 13, marginBottom: 16, lineHeight: 1.4 }}>{error}</div>}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }} noValidate>
            <div>
              <label htmlFor="reg-name" style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, display: 'block', color: 'var(--text-primary)' }}>Full Name *</label>
              <input id="reg-name" value={name} onChange={e => setName(e.target.value)} required placeholder="Your full name" style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid var(--border)', fontSize: 14, outline: 'none', minHeight: 44 }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' /* responsive handled by fix-all-screens.css */, gap: 12 }}>
              <div>
                <label htmlFor="reg-phone" style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, display: 'block', color: 'var(--text-primary)' }}>Phone</label>
                <input id="reg-phone" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91..." style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid var(--border)', fontSize: 14, outline: 'none', minHeight: 44 }} />
              </div>
              <div>
                <label htmlFor="reg-email" style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, display: 'block', color: 'var(--text-primary)' }}>Email</label>
                <input id="reg-email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid var(--border)', fontSize: 14, outline: 'none', minHeight: 44 }} />
              </div>
            </div>
            <div>
              <label htmlFor="reg-dob" style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, display: 'block', color: 'var(--text-primary)' }}>Date of Birth * <span style={{ fontWeight: 400, color: 'var(--text-secondary)', fontSize: 11 }}>(Must be 18+ • Medical category)</span></label>
              <input id="reg-dob" type="date" value={dob} onChange={e => setDob(e.target.value)} required max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]} style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid var(--border)', fontSize: 14, outline: 'none', minHeight: 44 }} />
            </div>
            <div>
              <label htmlFor="reg-password" style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, display: 'block', color: 'var(--text-primary)' }}>Password *</label>
              <input id="reg-password" type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="Min 6 characters, bcrypt hashed" style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid var(--border)', fontSize: 14, outline: 'none', minHeight: 44 }} />
              <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 6 }}>Min 6 characters • Stored with bcrypt • JWT httpOnly cookies</div>
            </div>
            <div>
              <label htmlFor="reg-role" style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, display: 'block', color: 'var(--text-primary)' }}>I am a</label>
              <select id="reg-role" value={role} onChange={e => setRole(e.target.value)} style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid var(--border)', fontSize: 14, background: 'white', minHeight: 44 }}>
                <option value="customer">Customer — I want to buy from local shops</option>
                <option value="shop_owner">Shop Owner — I want to sell • Nagpur</option>
              </select>
            </div>

            <div style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)', borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', cursor: 'pointer', fontSize: 13, lineHeight: 1.5, color: 'var(--text-primary)' }}>
                <input type="checkbox" checked={ageConfirm} onChange={e => setAgeConfirm(e.target.checked)} style={{ marginTop: 3, width: 16, height: 16 }} />
                <span>I confirm I am 18 years or older and eligible to enter into a contract under Indian law. I understand medical products have additional verification and prescription workflow.</span>
              </label>
              <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', cursor: 'pointer', fontSize: 13, lineHeight: 1.5, color: 'var(--text-primary)' }}>
                <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} style={{ marginTop: 3, width: 16, height: 16 }} />
                <span>I have read and agree to the <Link href="/terms" style={{ color: '#0F766E', fontWeight: 600, textDecoration: 'underline' }}>Terms of Service</Link> and <Link href="/privacy" style={{ color: '#0F766E', fontWeight: 600, textDecoration: 'underline' }}>Privacy Policy</Link>. I give explicit consent for collection of my name, contact, address, DOB, and location for marketplace purposes as described. I know I can withdraw consent via Profile → Privacy. Consent logged with timestamp.</span>
              </label>
              <div style={{ fontSize: 11, color: 'var(--text-tertiary)', lineHeight: 1.4, background: 'white', border: '1px solid var(--border-light)', borderRadius: 8, padding: 8 }}>Consent is unticked by default per DPDP Act, 2023. You must tick to proceed. We log consent timestamp and IP for audit. Explicit consent required.</div>
            </div>

            <button type="submit" disabled={loading} style={{ background: consent && ageConfirm ? '#0F766E' : 'var(--text-tertiary)', color: 'white', border: 'none', borderRadius: 12, padding: '14px', fontWeight: 600, fontSize: 14, cursor: loading ? 'not-allowed' : 'pointer', minHeight: 48, transition: 'all 0.2s ease' }}>{loading ? 'Creating account...' : 'Create account • 18+ only'}</button>
          </form>

          <div style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: 'var(--text-secondary)' }}>Already have account? <Link href="/auth/login" style={{ color: '#0F766E', fontWeight: 600, textDecoration: 'none' }}>Login</Link></div>

          <div style={{ marginTop: 16, fontSize: 11, color: 'var(--text-tertiary)', textAlign: 'center', lineHeight: 1.4 }}>Real shops • Real inventory • GST compliant • Secure payments • Pickup-first</div>
        </div>
      </main>
      <EliteFooter />
          <style>{`
        @media (max-width: 640px) {
          div[style*="maxWidth: 400"], div[style*="maxWidth: 440"] {
            padding-left: 16px !important;
            padding-right: 16px !important;
            margin-left: 16px !important;
            margin-right: 16px !important;
            max-width: calc(100% - 32px) !important;
          }
          .form-grid {
            grid-template-columns: 1fr !important;
          }
        }
        @media (max-width: 375px) {
          div[style*="maxWidth: 400"], div[style*="maxWidth: 440"] {
            margin-left: 12px !important;
            margin-right: 12px !important;
            max-width: calc(100% - 24px) !important;
          }
        }
      `}</style>
    </div>
  );
}
