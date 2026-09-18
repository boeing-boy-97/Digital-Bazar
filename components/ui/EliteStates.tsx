'use client';
import { AlertTriangle, Package, Lock, WifiOff, Clock, CreditCard, RefreshCw, ShoppingBag } from 'lucide-react';

export function LoadingState({ message = 'Loading real data...' }: { message?: string }) {
  return (
    <div style={{ padding: 40, textAlign: 'center' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
        <div className="skeleton" style={{ width: 48, height: 48, borderRadius: 12 }} />
        <div className="skeleton" style={{ width: 200, height: 14, borderRadius: 6 }} />
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 8 }}>{message}</div>
      </div>
    </div>
  );
}

export function EmptyState({ icon: Icon = Package, title = 'No data', description = 'No data available - honest empty state, not fake.', action }: { icon?: any; title?: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="card" style={{ padding: 40, textAlign: 'center' }}>
      <div style={{ width: 56, height: 56, background: 'var(--surface-muted)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
        <Icon size={24} color="var(--text-tertiary)" aria-hidden="true" />
      </div>
      <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: 14, color: 'var(--text-secondary)', maxWidth: 400, margin: '0 auto', lineHeight: 1.5 }}>{description}</div>
      {action && <div style={{ marginTop: 16 }}>{action}</div>}
    </div>
  );
}

export function ErrorState({ title = 'Unable to load', description = 'Something went wrong. Real error, not fake. Try again.', onRetry }: { title?: string; description?: string; onRetry?: () => void }) {
  return (
    <div className="card" style={{ padding: 40, textAlign: 'center', borderLeft: '4px solid #DC2626' }}>
      <div style={{ width: 56, height: 56, background: '#FEF2F2', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', border: '1px solid #FECACA' }}>
        <AlertTriangle size={24} color="#DC2626" aria-hidden="true" />
      </div>
      <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: 14, color: 'var(--text-secondary)', maxWidth: 400, margin: '0 auto', lineHeight: 1.5 }}>{description}</div>
      {onRetry && <button onClick={onRetry} className="btn btn-primary" style={{ marginTop: 16, borderRadius: 10 }}><RefreshCw size={14} /> Try again</button>}
    </div>
  );
}

export function UnauthorizedState() {
  return <EmptyState icon={Lock} title="Please sign in" description="You need to sign in to view this. Real auth, not demo." />;
}

export function ForbiddenState() {
  return <EmptyState icon={Lock} title="Access denied" description="You don't have permission to view this. Role-based access enforced server-side." />;
}

export function OfflineState({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="card" style={{ padding: 40, textAlign: 'center' }}>
      <div style={{ width: 56, height: 56, background: 'var(--surface-muted)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
        <WifiOff size={24} color="var(--text-tertiary)" aria-hidden="true" />
      </div>
      <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}>You're offline</div>
      <div style={{ fontSize: 14, color: 'var(--text-secondary)', maxWidth: 400, margin: '0 auto' }}>Check your connection. Safe reads only - no fake offline data.</div>
      {onRetry && <button onClick={onRetry} className="btn btn-secondary" style={{ marginTop: 16 }}>Retry</button>}
    </div>
  );
}

export function StaleState({ onRefresh }: { onRefresh?: () => void }) {
  return (
    <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 12, padding: 12, display: 'flex', gap: 10, alignItems: 'center', fontSize: 13 }}>
      <Clock size={16} color="#D97706" aria-hidden="true" />
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, color: '#92400E' }}>Data may be outdated</div>
        <div style={{ color: '#B45309', fontSize: 12, marginTop: 2 }}>This data was fetched earlier. Real inventory may have changed.</div>
      </div>
      {onRefresh && <button onClick={onRefresh} className="btn btn-secondary btn-sm">Refresh</button>}
    </div>
  );
}

export function ConflictState({ message = 'Conflict - real inventory changed while you were ordering. Please review cart.' }: { message?: string }) {
  return (
    <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 12, padding: 16, display: 'flex', gap: 12 }}>
      <AlertTriangle size={18} color="#DC2626" aria-hidden="true" />
      <div style={{ fontSize: 13, color: '#991B1B', lineHeight: 1.5 }}>
        <div style={{ fontWeight: 600 }}>Conflict</div>
        <div style={{ marginTop: 4 }}>{message}</div>
      </div>
    </div>
  );
}

export function PaymentState({ message = 'Payment issue - real payment, no fake success.' }: { message?: string }) {
  return (
    <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 12, padding: 16, display: 'flex', gap: 12 }}>
      <CreditCard size={18} color="#DC2626" aria-hidden="true" />
      <div style={{ fontSize: 13, color: '#991B1B' }}>
        <div style={{ fontWeight: 600 }}>Payment issue</div>
        <div style={{ marginTop: 4 }}>{message}</div>
      </div>
    </div>
  );
}
