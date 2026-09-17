'use client';
import { useState } from 'react';
import { MapPin, Languages, Bell, ArrowRight, Navigation } from 'lucide-react';
import Link from 'next/link';

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [location, setLocation] = useState('');
  const [language, setLanguage] = useState('en');
  const [coords, setCoords] = useState<{lat:number,lng:number}|null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  
  const handleUseLocation = () => {
    setLocationError(null);
    setLocationLoading(true);
    
    if (!navigator.geolocation) {
      setLocationError('Location services are not available on this device. Please enter your city manually.');
      setLocationLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      pos => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocation(`Current location`);
        setLocationLoading(false);
      },
      err => {
        if (err.code === 1) {
          setLocationError('Location access denied. You can still enter your city manually to continue.');
        } else if (err.code === 2) {
          setLocationError('Unable to determine your location. Please enter your city manually.');
        } else {
          setLocationError('Location request timed out. Please enter your city manually.');
        }
        setLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };
  
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--background)', padding: 16 }}>
      <div className="card" style={{ width: '100%', maxWidth: 480, borderRadius: 16, overflow: 'hidden' }}>
        <div className="card-body" style={{ padding: 32 }}>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{ width: 48, height: 48, background: 'var(--brand)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: 'white', fontWeight: 700, fontSize: '20px' }}>DB</div>
            <div style={{ fontSize: '24px', fontWeight: 700, letterSpacing: '-0.02em' }}>Welcome to Digital Bazar</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: 6, lineHeight: 1.4 }}>Select what you need before you arrive at the shop</div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20 }}>
              {[1,2,3].map(s=><div key={s} style={{ width: 32, height: 6, borderRadius: 3, background: step>=s ? 'var(--brand)' : 'var(--border)', transition: 'all 0.3s' }} />)}
            </div>
          </div>

          {step===1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ width: 56, height: 56, background: 'var(--brand-light)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                  <MapPin size={28} color="var(--brand)" />
                </div>
                <div style={{ fontWeight: 600, fontSize: '16px' }}>Where are you located?</div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: 4 }}>We'll show you nearby shops and products</div>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontWeight: 500 }}>Your city</label>
                  <input 
                    className="form-input" 
                    value={location} 
                    onChange={e=>{ setLocation(e.target.value); setCoords(null); setLocationError(null); }} 
                    placeholder="e.g. Nagpur, Pune, Mumbai" 
                    style={{ borderRadius: 10, padding: '12px 14px' }}
                    autoFocus
                  />
                </div>
                
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontWeight: 500 }}>Area or pincode (optional)</label>
                  <input className="form-input" placeholder="e.g. Dharampeth, 440010" style={{ borderRadius: 10, padding: '12px 14px' }} />
                </div>

                {coords && (
                  <div style={{ fontSize: '13px', color: 'var(--success)', background: 'var(--success-light)', padding: '10px 12px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8, border: '1px solid var(--success)' }}>
                    <Navigation size={14} />
                    Location detected • We'll use this to find nearby shops
                  </div>
                )}
                
                {locationError && (
                  <div style={{ fontSize: '13px', color: 'var(--warning)', background: 'var(--warning-light)', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--warning)' }}>
                    {locationError}
                  </div>
                )}

                <button 
                  className="btn btn-secondary" 
                  style={{ borderRadius: 10, padding: '12px', justifyContent: 'center' }}
                  onClick={handleUseLocation}
                  disabled={locationLoading}
                >
                  <Navigation size={16} />
                  {locationLoading ? 'Detecting location...' : 'Use my current location'}
                </button>
              </div>
              
              <button className="btn btn-primary" style={{ borderRadius: 10, padding: '12px', justifyContent: 'center', fontWeight: 600 }} onClick={()=>setStep(2)} disabled={!location.trim()}>
                Continue
                <ArrowRight size={16} />
              </button>
              
              <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', textAlign: 'center', lineHeight: 1.4 }}>
                You can change your location anytime from the homepage
              </div>
            </div>
          )}

          {step===2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ width: 56, height: 56, background: 'var(--brand-light)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                  <Languages size={28} color="var(--brand)" />
                </div>
                <div style={{ fontWeight: 600, fontSize: '16px' }}>Choose your language</div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: 4 }}>Search in your preferred language</div>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { code: 'en', label: 'English', native: 'English' },
                  { code: 'hi', label: 'Hindi', native: 'हिंदी' },
                  { code: 'mr', label: 'Marathi', native: 'मराठी' },
                ].map(l=>(
                  <button 
                    key={l.code} 
                    className={`btn ${language===l.code?'btn-primary':'btn-secondary'}`} 
                    style={{ justifyContent: 'space-between', borderRadius: 10, padding: '14px 16px' }} 
                    onClick={()=>setLanguage(l.code)}
                  >
                    <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}>
                      <span style={{ fontWeight: 600 }}>{l.label}</span>
                      <span style={{ fontSize: '12px', opacity: 0.8 }}>{l.native}</span>
                    </span>
                    {language===l.code && <span style={{ fontSize: '14px' }}>✓</span>}
                  </button>
                ))}
              </div>
              
              <button className="btn btn-primary" style={{ borderRadius: 10, padding: '12px', justifyContent: 'center', fontWeight: 600 }} onClick={()=>setStep(3)}>
                Continue in {language === 'en' ? 'English' : language === 'hi' ? 'Hindi' : 'Marathi'}
                <ArrowRight size={16} />
              </button>
              
              <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', textAlign: 'center' }}>
                You can change language anytime from settings
              </div>
            </div>
          )}

          {step===3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ width: 56, height: 56, background: 'var(--brand-light)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                  <Bell size={28} color="var(--brand)" />
                </div>
                <div style={{ fontWeight: 600, fontSize: '16px' }}>Personalize your experience</div>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: 4 }}>Get notified when your orders are ready</div>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontWeight: 500 }}>Favorite categories (optional)</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                    {['Cement','Bricks','Plumbing','Paint','Electrical','Hardware','Tools'].map(cat=>(
                      <button key={cat} className="badge" style={{ padding: '8px 14px', borderRadius: 20, border: '1px solid var(--border)', background: 'var(--surface)', cursor: 'pointer', fontSize: '13px' }} onClick={(e)=>{ 
                        const el = e.target as HTMLElement;
                        const isSelected = el.style.background === 'var(--brand)' || el.getAttribute('data-selected') === 'true';
                        if (isSelected) {
                          el.style.background = 'var(--surface)';
                          el.style.color = 'var(--text-primary)';
                          el.style.borderColor = 'var(--border)';
                          el.setAttribute('data-selected', 'false');
                        } else {
                          el.style.background = 'var(--brand)';
                          el.style.color = 'white';
                          el.style.borderColor = 'var(--brand)';
                          el.setAttribute('data-selected', 'true');
                        }
                      }}>{cat}</button>
                    ))}
                  </div>
                </div>
                
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: '14px', cursor: 'pointer', padding: 12, background: 'var(--surface-muted)', borderRadius: 10, border: '1px solid var(--border-light)' }}>
                  <input type="checkbox" defaultChecked style={{ marginTop: 2 }} />
                  <span>
                    <span style={{ fontWeight: 500 }}>Enable notifications</span>
                    <br/>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Get updates when your order is ready for pickup</span>
                  </span>
                </label>
              </div>
              
              <Link href="/" className="btn btn-primary" style={{ borderRadius: 10, padding: '12px', justifyContent: 'center', fontWeight: 600, textDecoration: 'none' }}>
                Start shopping
                <ArrowRight size={16} />
              </Link>
              
              <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', textAlign: 'center' }}>
                You can update these preferences anytime
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
