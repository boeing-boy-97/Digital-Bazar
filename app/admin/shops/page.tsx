'use client';
import { useEffect, useState } from 'react';

export default function AdminShops() {
  const [shops, setShops] = useState<any[]>([]);
  const [filter, setFilter] = useState('PENDING_REVIEW');

  useEffect(() => { fetchShops(); }, [filter]);

  const fetchShops = async () => {
    const params = new URLSearchParams();
    if (filter) params.set('status', filter);
    const res = await fetch(`/api/admin/shops?${params.toString()}`);
    const data = await res.json();
    setShops(data.shops || []);
  };

  const handleAction = async (shopId: string, action: string) => {
    const res = await fetch('/api/admin/shops', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shopId, action })
    });
    if (res.ok) fetchShops();
    else { const d=await res.json(); alert(d.error); }
  };

  return (
    <div>
      <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: 16 }}>Shop Verification</h1>
      <div className="tabs" style={{ marginBottom: 16 }}>
        {['PENDING_REVIEW','APPROVED','REJECTED','SUSPENDED'].map(s=>(
          <button key={s} className={`tab ${filter===s?'active':''}`} onClick={()=>setFilter(s)}>{s.replace(/_/g,' ')}</button>
        ))}
        <button className={`tab ${filter===''?'active':''}`} onClick={()=>setFilter('')}>All</button>
      </div>

      <div className="table-container">
        <div className="table-wrapper">
          <table className="table">
            <thead><tr><th>Shop</th><th>Owner</th><th>Address</th><th>Products</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {shops.map(s=>(
                <tr key={s.id}>
                  <td><div style={{ fontWeight: 600 }}>{s.name}</div><div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{s.category} • {s.city}</div></td>
                  <td>{s.owner?.name}<br/><span style={{ fontSize: '12px' }}>{s.owner?.email || s.owner?.phone}</span></td>
                  <td style={{ fontSize: '13px' }}>{s.address}</td>
                  <td>{s._count?.products || 0}</td>
                  <td><span className={`badge badge-${s.status==='APPROVED'?'success':s.status==='PENDING_REVIEW'?'warning':'danger'}`}>{s.status}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {s.status==='PENDING_REVIEW' && <><button className="btn btn-primary btn-sm" onClick={()=>handleAction(s.id,'approve')}>Approve</button><button className="btn btn-secondary btn-sm" onClick={()=>handleAction(s.id,'reject')}>Reject</button></>}
                      {s.status==='APPROVED' && <button className="btn btn-secondary btn-sm" onClick={()=>handleAction(s.id,'suspend')}>Suspend</button>}
                      {s.status!=='APPROVED' && s.status!=='PENDING_REVIEW' && <button className="btn btn-primary btn-sm" onClick={()=>handleAction(s.id,'activate')}>Activate</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
