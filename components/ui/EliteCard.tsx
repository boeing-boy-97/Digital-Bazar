'use client';
import React from 'react';

interface EliteCardProps {
  children: React.ReactNode;
  padding?: number;
  hover?: boolean;
  borderLeft?: string;
  className?: string;
  onClick?: () => void;
}

export function EliteCard({ children, padding = 20, hover = false, borderLeft, className = '', onClick }: EliteCardProps) {
  return (
    <div
      className={`card-elite ${hover ? 'card-elite-hover' : ''} ${className}`}
      style={{
        padding,
        borderLeft: borderLeft ? `4px solid ${borderLeft}` : undefined,
        cursor: onClick ? 'pointer' : undefined
      }}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); } : undefined}
    >
      {children}
    </div>
  );
}

export function EliteStatCard({ label, value, icon: Icon, color = '#0F766E', bg = '#F0FAF9', subtext }: { label: string; value: React.ReactNode; icon: any; color?: string; bg?: string; subtext?: string }) {
  return (
    <div className="card-elite" style={{ padding: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{label}</div>
          <div style={{ fontSize: 24, fontWeight: 700, marginTop: 6, letterSpacing: '-0.02em' }}>{value}</div>
          {subtext && <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4 }}>{subtext}</div>}
        </div>
        <div style={{ width: 40, height: 40, background: bg, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>
          <Icon size={20} aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}

export function EliteBadge({ children, variant = 'neutral' }: { children: React.ReactNode; variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral' }) {
  return <span className={`badge badge-${variant}`}>{children}</span>;
}

export function EliteEmptyState({ icon: Icon, title, description, action }: { icon: any; title: string; description: string; action?: React.ReactNode }) {
  return (
    <div className="empty-state">
      <div style={{ width: 56, height: 56, background: 'var(--surface-muted)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
        <Icon size={24} color="var(--text-tertiary)" aria-hidden="true" />
      </div>
      <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: 14, color: 'var(--text-secondary)', maxWidth: 400, margin: '0 auto', lineHeight: 1.5 }}>{description}</div>
      {action && <div style={{ marginTop: 16 }}>{action}</div>}
    </div>
  );
}
