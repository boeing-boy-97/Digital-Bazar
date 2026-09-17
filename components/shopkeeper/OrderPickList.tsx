'use client';
import { useState } from 'react';
import { Check, Package } from 'lucide-react';

interface PickItem {
  id: string;
  productName: string;
  quantity: number;
  sku: string;
  storageZone?: string;
  isPicked?: boolean;
}

interface Props {
  grouped: Record<string, PickItem[]>;
  onPickToggle: (itemId: string) => void;
}

export function OrderPickList({ grouped, onPickToggle }: Props) {
  const totalItems = Object.values(grouped).flat().length;
  const pickedItems = Object.values(grouped).flat().filter(i => i.isPicked).length;
  const progress = totalItems ? Math.round((pickedItems / totalItems) * 100) : 0;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontWeight: 600 }}>Pick List - Auto Sorted by Zone</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 100, height: 8, background: 'var(--surface-muted)', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ width: `${progress}%`, height: '100%', background: 'var(--success)', transition: 'width 0.3s' }} />
          </div>
          <span style={{ fontSize: '13px', fontWeight: 600 }}>{pickedItems}/{totalItems}</span>
        </div>
      </div>

      {Object.entries(grouped).map(([zone, items]) => (
        <div key={zone} style={{ marginBottom: 16, border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
          <div style={{ background: 'var(--surface-muted)', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontWeight: 600, fontSize: '13px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Package size={14} /> {zone}
            </div>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{items.filter(i=>i.isPicked).length}/{items.length} collected</span>
          </div>
          <div>
            {items.map(item => (
              <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderBottom: '1px solid var(--border-light)', background: item.isPicked ? 'var(--success-muted)' : 'var(--surface)' }}>
                <button
                  onClick={() => onPickToggle(item.id)}
                  style={{
                    width: 22, height: 22, borderRadius: 4, border: `1px solid ${item.isPicked ? 'var(--success)' : 'var(--border-strong)'}`,
                    background: item.isPicked ? 'var(--success)' : 'var(--surface)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0
                  }}
                >
                  {item.isPicked && <Check size={14} color="white" />}
                </button>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500, fontSize: '14px', textDecoration: item.isPicked ? 'line-through' : 'none' }}>{item.productName}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{item.sku} • Qty: {item.quantity}</div>
                </div>
                <div style={{ fontWeight: 600, fontSize: '14px' }}>×{item.quantity}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
