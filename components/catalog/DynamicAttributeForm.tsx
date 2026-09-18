'use client';
import { useEffect, useState } from 'react';

interface AttributeDef {
  name: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'boolean' | 'color';
  required: boolean;
  options?: string[];
  unit?: string;
}

interface DynamicAttributeFormProps {
  categoryId?: string;
  value?: Record<string, any>;
  onChange: (attrs: Record<string, any>) => void;
}

export function DynamicAttributeForm({ categoryId, value = {}, onChange }: DynamicAttributeFormProps) {
  const [attributes, setAttributes] = useState<AttributeDef[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!categoryId) {
      setAttributes([]);
      return;
    }
    fetchAttributes();
  }, [categoryId]);

  const fetchAttributes = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/master-categories/${categoryId}/attributes`);
      const data = await res.json();
      if (data.success) {
        setAttributes(data.attributes || []);
      }
    } catch {}
    setLoading(false);
  };

  const handleChange = (name: string, val: any) => {
    const newAttrs = { ...value, [name]: val };
    onChange(newAttrs);
  };

  if (!categoryId) {
    return (
      <div style={{ padding: 16, background: 'var(--surface-muted)', borderRadius: 10, border: '1px solid var(--border)', fontSize: 13, color: 'var(--text-secondary)', textAlign: 'center' }}>
        Select a category to see specific attributes. Example: Mobile shows RAM/Storage/Color, Paint shows Shade/Finish/Volume, Cement shows Grade/Bag Size.
      </div>
    );
  }

  if (loading) {
    return <div style={{ padding: 16, fontSize: 13, color: 'var(--text-secondary)' }}>Loading attributes for this category...</div>;
  }

  if (attributes.length === 0) {
    return (
      <div style={{ padding: 16, background: 'var(--surface-muted)', borderRadius: 10, border: '1px solid var(--border)', fontSize: 13, color: 'var(--text-secondary)', textAlign: 'center' }}>
        No specific attributes defined for this category. Admin can define attributes like RAM, Storage, Color for Mobile; Shade, Finish, Volume for Paint; Grade, Bag Size for Cement.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: 16, background: 'white', border: '1px solid var(--border)', borderRadius: 12 }}>
      <div style={{ fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
        Category attributes — auto-adapts per category
        <span style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)', borderRadius: 100, padding: '2px 8px', fontSize: 11, fontWeight: 500 }}>{attributes.length} fields</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
        {attributes.map(attr => (
          <div key={attr.name} className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {attr.label}
              {attr.required && <span style={{ color: '#DC2626' }}>*</span>}
              {attr.unit && <span style={{ fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 400 }}>({attr.unit})</span>}
            </label>
            {attr.type === 'text' && (
              <input
                className="form-input"
                value={value[attr.name] || ''}
                onChange={e => handleChange(attr.name, e.target.value)}
                required={attr.required}
                placeholder={attr.label}
                style={{ borderRadius: 8 }}
              />
            )}
            {attr.type === 'number' && (
              <input
                type="number"
                className="form-input"
                value={value[attr.name] || ''}
                onChange={e => handleChange(attr.name, e.target.value ? parseFloat(e.target.value) : '')}
                required={attr.required}
                placeholder={attr.label}
                style={{ borderRadius: 8 }}
              />
            )}
            {attr.type === 'select' && (
              <select
                className="form-select"
                value={value[attr.name] || ''}
                onChange={e => handleChange(attr.name, e.target.value)}
                required={attr.required}
                style={{ borderRadius: 8 }}
              >
                <option value="">Select {attr.label}</option>
                {attr.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            )}
            {attr.type === 'boolean' && (
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '10px 0' }}>
                <input
                  type="checkbox"
                  checked={!!value[attr.name]}
                  onChange={e => handleChange(attr.name, e.target.checked)}
                />
                <span style={{ fontSize: 13 }}>{attr.label}</span>
              </label>
            )}
            {attr.type === 'color' && (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  type="color"
                  value={value[attr.name] || '#000000'}
                  onChange={e => handleChange(attr.name, e.target.value)}
                  style={{ width: 40, height: 40, borderRadius: 8, border: '1px solid var(--border)', padding: 2 }}
                />
                <input
                  className="form-input"
                  value={value[attr.name] || ''}
                  onChange={e => handleChange(attr.name, e.target.value)}
                  placeholder="Color name"
                  style={{ flex: 1, borderRadius: 8 }}
                />
              </div>
            )}
          </div>
        ))}
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-tertiary)', background: 'var(--surface-muted)', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-light)' }}>
        Real attributes from admin-defined category engine. Forms auto-adapt: Mobile → RAM/Storage/Color/Processor, Paint → Shade/Finish/Volume, Cement → Grade/Bag Size, Clothing → Size/Color/Fabric, Electrical → Voltage/Wattage/Type.
      </div>
    </div>
  );
}
