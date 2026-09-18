'use client';
import { useEffect, useState } from 'react';
import { Store, Clock, CheckCircle, XCircle, AlertTriangle, Search } from 'lucide-react';

export default function AdminShops() {
  const [shops, setShops] = useState<any[]>([]);
  const [filter, setFilter] = useState('PENDING_REVIEW');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchShops(); }, [filter]);

  const fetchShops = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter) params.set('status', filter);
      const res = await fetch(`/api/admin/shops?${params.toString()}`);
      const data = await res.json();
      setShops(data.shops || []);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (shopId: string, action: string) => {
    let reason = '';
    
    if (action === 'reject' || action === 'request_changes' || action === 'suspend') {
      reason = prompt(`Reason for ${action.replace('_', ' ')} (shop owner will see this):`) || '';
      if (!reason && (action === 'reject' || action === 'request_changes')) {
        alert('Reason is required');
        return;
      }
    }

    if (action === 'approve' && !confirm('Approve this shop? It will become visible to customers.')) {
      return;
    }

    const res = await fetch('/api/admin/shops', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shopId, action, reason })
    });
    
    const data = await res.json();
    if (res.ok) {
      fetchShops();
    } else {
      alert(data.error || 'Failed to update shop');
    }
  };

  const filtered = shops.filter(s => {
    if (!search) return true;
    const q = search.toLowerCase();
    return s.name.toLowerCase().includes(q) || s.city.toLowerCase().includes(q) || s.owner?.name?.toLowerCase().includes(q);
  });

  const getStatusConfig = (status: string) => {
    if (status === 'APPROVED') return { color: 'success', icon: CheckCircle, label: 'Approved' };
    if (status === 'PENDING_REVIEW') return { color: 'warning', icon: Clock, label: 'Pending review' };
    if (status === 'REJECTED') return { color: 'danger', icon: XCircle, label: 'Rejected' };
    if (status === 'SUSPENDED') return { color: 'danger', icon: AlertTriangle, label: 'Suspended' };
    if (status === 'REQUESTED_CHANGES') return { color: 'warning', icon: AlertTriangle, label: 'Changes requested' };
    if (status === 'PAUSED') return { color: 'neutral', icon: Clock, label: 'Paused' };
    return { color: 'neutral', icon: Store, label: status };
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, letterSpacing: '-0.02em' }}>Shop verification</h1>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: 4 }}>Review and approve shop applications</p>
        </div>
        <div style={{ position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
          <input className="form-input" placeholder="Search shops or owners" value={search} onChange={e=>setSearch(e.target.value)} style={{ paddingLeft: 32, borderRadius: 8, minWidth: 0 }} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {[
          { label: 'Pending review', value: 'PENDING_REVIEW' },
          { label: 'Approved', value: 'APPROVED' },
          { label: 'Changes requested', value: 'REQUESTED_CHANGES' },
          { label: 'Rejected', value: 'REJECTED' },
          { label: 'Suspended', value: 'SUSPENDED' },
          { label: 'All', value: '' }
        ].map(s=>(
          <button key={s.value} className={`btn ${filter===s.value?'btn-primary':'btn-secondary'} btn-sm`} style={{ borderRadius: 20 }} onClick={()=>setFilter(s.value)}>
            {s.label}
            <span style={{ background: 'rgba(0,0,0,0.1)', padding: '2px 6px', borderRadius: 10, fontSize: '11px', marginLeft: 6 }}>
              {s.value ? shops.filter(shop=>shop.status===s.value).length : shops.length}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="card" style={{ padding: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1,2,3].map(i => (
              <div key={i} style={{ display: 'flex', gap: 12 }}>
                <div className="skeleton" style={{ width: 40, height: 40, borderRadius: 8 }} />
                <div style={{ flex: 1 }}>
                  <div className="skeleton" style={{ height: 14, width: '30%' }} />
                  <div className="skeleton" style={{ height: 12, width: '50%', marginTop: 8 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ padding: 40, textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, background: 'var(--surface-muted)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Store size={24} color="var(--text-tertiary)" />
          </div>
          <div style={{ fontWeight: 600, fontSize: '16px', marginBottom: 8 }}>{filter ? `No ${filter.toLowerCase().replace(/_/g, ' ')} shops` : 'No shops found'}</div>
          <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{search ? `No shops match "${search}"` : 'Shops will appear here when owners register'}</div>
        </div>
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div className="table-wrapper">
            <table className="table">
              <thead><tr><th>Shop</th><th>Owner</th><th>Location</th><th>Products</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {filtered.map(s=>{
                  const statusConfig = getStatusConfig(s.status);
                  const StatusIcon = statusConfig.icon;
                  return (
                    <tr key={s.id}>
                      <td>
                        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                          <div style={{ width: 40, height: 40, background: 'var(--brand-light)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand)', fontWeight: 600, fontSize: '14px', flexShrink: 0 }}>
                            {s.name.slice(0,2).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '14px' }}>{s.name}</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{s.category} • {s.completionPercent || 0}% complete</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 500, fontSize: '14px' }}>{s.owner?.name}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{s.owner?.email || s.owner?.phone}</div>
                      </td>
                      <td>
                        <div style={{ fontSize: '13px' }}>{s.city}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.address}</div>
                      </td>
                      <td><span style={{ fontSize: '13px', fontWeight: 500 }}>{s._count?.products || 0} products</span></td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <span className={`badge badge-${statusConfig.color}`} style={{ display: 'flex', alignItems: 'center', gap: 4, width: 'fit-content' }}>
                            <StatusIcon size={12} />
                            {statusConfig.label}
                          </span>
                          {s.rejectionReason && (
                            <div style={{ fontSize: '11px', color: 'var(--danger)', maxWidth: 200, background: 'var(--danger-light)', padding: '4px 6px', borderRadius: 4 }}>
                              Reason: {s.rejectionReason}
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {s.status==='PENDING_REVIEW' && (
                            <>
                              <button className="btn btn-primary btn-sm" style={{ borderRadius: 6 }} onClick={()=>handleAction(s.id,'approve')}>Approve</button>
                              <button className="btn btn-secondary btn-sm" style={{ borderRadius: 6 }} onClick={()=>handleAction(s.id,'request_changes')}>Request changes</button>
                              <button className="btn btn-ghost btn-sm" style={{ borderRadius: 6, color: 'var(--danger)' }} onClick={()=>handleAction(s.id,'reject')}>Reject</button>
                            </>
                          )}
                          {s.status==='APPROVED' && <button className="btn btn-secondary btn-sm" style={{ borderRadius: 6 }} onClick={()=>handleAction(s.id,'suspend')}>Suspend</button>}
                          {(s.status==='REJECTED' || s.status==='SUSPENDED' || s.status==='REQUESTED_CHANGES') && <button className="btn btn-primary btn-sm" style={{ borderRadius: 6 }} onClick={()=>handleAction(s.id,'approve')}>Approve</button>}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
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
