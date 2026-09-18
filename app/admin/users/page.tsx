'use client';
import { useEffect, useState } from 'react';
import { Users, Search } from 'lucide-react';

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  useEffect(() => {
    fetchUsers();
  }, []);
  
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users').then(r=>r.json()).catch(()=>({users:[]}));
      setUsers(res.users || []);
    } finally {
      setLoading(false);
    }
  };
  
  const filtered = users.filter(u => 
    !search || 
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.phone?.includes(search) ||
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.role?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, letterSpacing: '-0.02em' }}>Users</h1>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: 4 }}>{users.length} users registered</p>
        </div>
        <div style={{ position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
          <input className="form-input" placeholder="Search by name, phone, or role" value={search} onChange={e=>setSearch(e.target.value)} style={{ paddingLeft: 32, borderRadius: 8, minWidth: 260 }} />
        </div>
      </div>
      
      {loading ? (
        <div className="card" style={{ padding: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1,2,3].map(i => (
              <div key={i} style={{ display: 'flex', gap: 12 }}>
                <div className="skeleton" style={{ width: 40, height: 40, borderRadius: '50%' }} />
                <div style={{ flex: 1 }}>
                  <div className="skeleton" style={{ height: 14, width: '30%' }} />
                  <div className="skeleton" style={{ height: 12, width: '20%', marginTop: 8 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ padding: 40, textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, background: 'var(--surface-muted)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Users size={24} color="var(--text-tertiary)" />
          </div>
          <div style={{ fontWeight: 600, fontSize: '16px', marginBottom: 8 }}>{search ? `No users found for "${search}"` : 'No users yet'}</div>
          <div style={{ fontSize: '14px', color: 'var(--text-secondary)', maxWidth: 400, margin: '0 auto' }}>
            {search ? 'Try a different search term.' : 'Users will appear here when they register on the platform.'}
          </div>
        </div>
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div className="table-wrapper">
            <table className="table">
              <thead><tr><th>User</th><th>Contact</th><th>Role</th><th>Status</th><th>Joined</th></tr></thead>
              <tbody>
                {filtered.map(u=>(
                  <tr key={u.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 36, height: 36, background: 'var(--brand-light)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand)', fontWeight: 600, fontSize: '13px' }}>
                          {u.name?.slice(0,2).toUpperCase() || 'U'}
                        </div>
                        <div style={{ fontWeight: 500, fontSize: '14px' }}>{u.name || 'User'}</div>
                      </div>
                    </td>
                    <td><div style={{ fontSize: '13px' }}>{u.phone || u.email}</div></td>
                    <td><span className={`badge badge-${u.role==='admin'?'danger':u.role==='shop_owner'?'warning':'info'}`}>{u.role?.replace(/_/g, ' ')}</span></td>
                    <td><span className={`badge badge-${u.isActive!==false?'success':'danger'}`}>{u.isActive!==false?'Active':'Inactive'}</span></td>
                    <td style={{ fontSize: '13px' }}>{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ padding: 12, borderTop: '1px solid var(--border)', fontSize: '12px', color: 'var(--text-secondary)', textAlign: 'center' }}>
            Showing {filtered.length} of {users.length} users
          </div>
        </div>
      )}
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
