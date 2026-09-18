'use client';
import { useEffect, useState } from 'react';
import { Users, UserPlus, Shield, Clock } from 'lucide-react';

export default function EmployeesPage() {
  const [members, setMembers] = useState<any[]>([]);
  const [shopId, setShopId] = useState('');
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ email: '', permission: 'picker' });
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => { fetchMembers(); }, []);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const shops = await fetch('/api/shops').then(r=>r.json());
      const sId = shops.shops?.[0]?.id;
      if (!sId) { setLoading(false); return; }
      setShopId(sId);
      const detail = await fetch(`/api/shops/${sId}`).then(r=>r.json());
      setMembers(detail.shop?.members || []);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/shops/${shopId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, permission: form.permission })
      });
      
      if (res.ok) {
        alert('Employee invitation sent successfully');
        setShowAdd(false);
        setForm({ email: '', permission: 'picker' });
        fetchMembers();
      } else {
        const data = await res.json();
        alert(data.error || 'Unable to add employee. Please check the email and try again.');
      }
    } catch {
      alert('Unable to add employee. Please try again.');
    }
  };

  const getPermissionLabel = (perm: string) => {
    const labels: any = {
      picker: 'Picker',
      inventory_manager: 'Inventory Manager',
      billing_employee: 'Billing Staff',
      delivery_employee: 'Delivery Staff',
      manager: 'Manager',
      owner: 'Owner'
    };
    return labels[perm] || perm.replace(/_/g, ' ');
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, letterSpacing: '-0.02em' }}>Team</h1>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: 4 }}>Manage employees and permissions for your shop</p>
        </div>
        <button className="btn btn-primary" onClick={()=>setShowAdd(true)} style={{ borderRadius: 8 }}>
          <UserPlus size={16} />
          Add employee
        </button>
      </div>
      
      <div className="card" style={{ marginBottom: 20, background: 'var(--surface-muted)' }}>
        <div className="card-body">
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ width: 36, height: 36, background: 'var(--brand-light)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Shield size={18} color="var(--brand)" />
            </div>
            <div>
              <div style={{ fontWeight: 600, fontSize: '14px' }}>Roles and permissions</div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, marginTop: 6 }}>
                <strong>Picker:</strong> View orders and mark items as picked<br/>
                <strong>Inventory Manager:</strong> Manage products and stock levels<br/>
                <strong>Billing Staff:</strong> Handle payments and invoices<br/>
                <strong>Delivery Staff:</strong> Manage delivery orders<br/>
                <strong>Manager:</strong> Full access to shop operations
              </div>
            </div>
          </div>
        </div>
      </div>

      {showAdd && (
        <div className="modal-overlay" onClick={()=>setShowAdd(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 16 }}>
          <div className="modal" onClick={e=>e.stopPropagation()} style={{ background: 'white', borderRadius: 12, width: '100%', maxWidth: 480, overflow: 'hidden' }}>
            <div style={{ padding: 20, borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontWeight: 600, fontSize: '16px' }}>Add team member</div>
              <button className="btn btn-ghost btn-sm" onClick={()=>setShowAdd(false)} style={{ width: 32, height: 32, borderRadius: 8 }}>✕</button>
            </div>
            <form onSubmit={handleAdd} style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Employee email</label>
                <input className="form-input" type="email" value={form.email} onChange={e=>setForm({...form, email: e.target.value})} required placeholder="employee@example.com" style={{ borderRadius: 8 }} />
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: 4 }}>The employee must have an account on Digital Bazar</div>
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Role</label>
                <select className="form-select" value={form.permission} onChange={e=>setForm({...form, permission: e.target.value})} style={{ borderRadius: 8 }}>
                  <option value="picker">Picker • View orders, mark as picked</option>
                  <option value="inventory_manager">Inventory Manager • Manage stock</option>
                  <option value="billing_employee">Billing Staff • Handle payments</option>
                  <option value="delivery_employee">Delivery Staff • Manage delivery</option>
                  <option value="manager">Manager • Full shop access</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1, borderRadius: 8 }} onClick={()=>setShowAdd(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, borderRadius: 8 }}>Send invitation</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="card" style={{ overflow: 'hidden' }}>
        <div className="card-header"><div className="card-title">Team members</div></div>
        <div className="card-body" style={{ padding: 0 }}>
          {loading ? (
            <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[1,2].map(i => (
                <div key={i} style={{ display: 'flex', gap: 12 }}>
                  <div className="skeleton" style={{ width: 40, height: 40, borderRadius: '50%' }} />
                  <div style={{ flex: 1 }}>
                    <div className="skeleton" style={{ height: 14, width: '30%' }} />
                    <div className="skeleton" style={{ height: 12, width: '20%', marginTop: 8 }} />
                  </div>
                </div>
              ))}
            </div>
          ) : members.length===0 ? (
            <div style={{ padding: 40, textAlign: 'center' }}>
              <div style={{ width: 56, height: 56, background: 'var(--surface-muted)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <Users size={24} color="var(--text-tertiary)" />
              </div>
              <div style={{ fontWeight: 600, fontSize: '16px', marginBottom: 8 }}>No team members yet</div>
              <div style={{ fontSize: '14px', color: 'var(--text-secondary)', maxWidth: 400, margin: '0 auto', lineHeight: 1.5 }}>
                You are the only member of this shop. Add employees to help manage orders, inventory, and billing.
              </div>
              <button className="btn btn-primary" style={{ marginTop: 16, borderRadius: 8 }} onClick={()=>setShowAdd(true)}>
                <UserPlus size={16} />
                Add your first employee
              </button>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="table">
                <thead><tr><th>Member</th><th>Role</th><th>Status</th><th>Added</th></tr></thead>
                <tbody>
                  {members.map((m:any)=>(
                    <tr key={m.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 36, height: 36, background: 'var(--brand-light)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand)', fontWeight: 600, fontSize: '13px' }}>
                            {(m.user?.name || m.userId || 'U').slice(0,2).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 500, fontSize: '14px' }}>{m.user?.name || 'Team member'}</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{m.user?.email}</div>
                          </div>
                        </div>
                      </td>
                      <td><span className="badge badge-neutral">{getPermissionLabel(m.permission)}</span></td>
                      <td><span className={`badge badge-${m.isActive?'success':'danger'}`}>{m.isActive?'Active':'Inactive'}</span></td>
                      <td style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={12} />{new Date(m.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
          <style>{`
        @media (max-width: 768px) {
          .table-wrapper {
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
          }
          .table-wrapper::after {
            content: '← Swipe to see more →';
            display: block;
            text-align: center;
            font-size: 11px;
            color: var(--text-tertiary);
            padding: 8px;
            background: var(--surface-muted);
          }
          .table { min-width: 600px; }
        }
        @media (max-width: 640px) {
          .table th, .table td { padding: 12px 8px !important; font-size: 12px !important; }
        }
      `}</style>
    </div>
  );
}
