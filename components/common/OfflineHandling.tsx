'use client';
import { useEffect, useState } from 'react';

export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setIsOffline(true);
    }
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="offline-banner" role="alert" aria-live="polite">
      <span>⚠️ You are offline. Some features may not work. Real inventory will sync when online.</span>
    </div>
  );
}

export function StaleDataIndicator({ lastUpdated, thresholdMinutes = 120 }: { lastUpdated?: string | Date | null; thresholdMinutes?: number }) {
  if (!lastUpdated) return null;
  
  const updated = new Date(lastUpdated);
  const now = new Date();
  const diffMins = Math.floor((now.getTime() - updated.getTime()) / 60000);
  
  if (diffMins <= thresholdMinutes) return null;
  
  return (
    <div className="stale-indicator" role="status" aria-label={`Data may be stale, last updated ${diffMins} minutes ago`}>
      <span>Availability may need confirmation • Stock checked {diffMins < 60 ? `${diffMins}m ago` : `${Math.floor(diffMins/60)}h ago`}</span>
    </div>
  );
}
