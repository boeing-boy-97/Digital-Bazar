'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Reservation {
  id: string;
  reservationNumber: string;
  reservationCode: string;
  status: string;
  expiresAt: string;
  shop: { name: string };
  customer: { name: string; phone: string };
  items: { productName: string; quantity: number; unit: string }[];
}

export default function ShopkeeperReservations() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchReservations = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter) params.set('status', filter);
      const res = await fetch(`/api/reservations?${params.toString()}`);
      const data = await res.json();
      setReservations(data.reservations || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReservations(); }, [filter]);

  const updateStatus = async (id: string, status: string) => {
    let reason = undefined;
    if (status === 'DECLINED') {
      reason = prompt('Reason for declining reservation (customer will see):');
      if (!reason) return;
    }
    const res = await fetch(`/api/reservations/${id}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, reason })
    });
    const data = await res.json();
    if (res.ok) fetchReservations();
    else alert(data.error?.message || 'Failed');
  };

  return (
    <div>
      <div className="flex justify-between items-start mb-5 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reservations</h1>
          <p className="text-sm text-gray-600 mt-1">{reservations.length} reservations • Reserve Before You Go per point 33</p>
          <p className="text-xs text-gray-500 mt-1">Reservation = I will come and collect. Shop confirms availability, holds stock until expiry (e.g. 6:30 PM), customer shows code at counter.</p>
        </div>
      </div>

      <div className="flex gap-2 mb-5 flex-wrap">
        {[
          { label: 'All', value: '' },
          { label: 'Pending', value: 'PENDING' },
          { label: 'Confirmed', value: 'CONFIRMED' },
          { label: 'Held', value: 'HELD' },
          { label: 'Collected', value: 'COLLECTED' },
          { label: 'Declined', value: 'DECLINED' },
          { label: 'Expired', value: 'EXPIRED' },
        ].map(s => (
          <button key={s.value} className={`text-xs px-3 py-1.5 rounded-full border ${filter === s.value ? 'bg-black text-white border-black' : 'bg-white text-gray-700 border-gray-300'}`} onClick={() => setFilter(s.value)}>{s.label}</button>
        ))}
      </div>

      {loading ? (
        <div className="border border-gray-200 rounded p-6 text-sm">Loading...</div>
      ) : reservations.length === 0 ? (
        <div className="border border-gray-200 rounded p-8 text-center">
          <div className="text-sm font-medium">No reservations</div>
          <div className="text-xs text-gray-500 mt-1">When customers reserve products to collect later, they appear here. Timer shows Reserved until 6:30 PM based on real policy.</div>
        </div>
      ) : (
        <div className="space-y-3">
          {reservations.map(r => {
            const expiry = new Date(r.expiresAt);
            const isExpired = expiry < new Date();
            return (
              <div key={r.id} className="border border-gray-200 bg-white rounded p-4">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <div className="text-sm font-semibold">{r.reservationNumber} <span className="font-mono text-xs bg-gray-50 border px-1.5 py-0.5 rounded">{r.reservationCode}</span></div>
                    <div className="text-xs text-gray-600 mt-1">{r.customer.name} • {r.customer.phone}</div>
                    <div className="text-xs text-gray-600 mt-1">{r.items.map(i => `${i.productName} × ${i.quantity} ${i.unit}`).join(', ')}</div>
                    <div className="text-xs text-gray-500 mt-1">Expires: {expiry.toLocaleString()} {isExpired && r.status === 'PENDING' ? '• Overdue' : ''}</div>
                  </div>
                  <div className="text-right flex flex-col gap-2 items-end">
                    <span className={`text-xs px-2 py-1 rounded border ${r.status === 'PENDING' ? 'bg-amber-50 text-amber-800 border-amber-200' : r.status === 'COLLECTED' ? 'bg-green-50 text-green-800 border-green-200' : r.status === 'EXPIRED' || r.status === 'DECLINED' ? 'bg-gray-100 text-gray-600' : 'bg-blue-50 text-blue-800 border-blue-200'}`}>{r.status}</span>
                    <div className="flex gap-1 flex-wrap justify-end">
                      {r.status === 'PENDING' && (
                        <>
                          <button onClick={() => updateStatus(r.id, 'CONFIRMED')} className="text-xs px-2.5 py-1 bg-black text-white rounded">Confirm</button>
                          <button onClick={() => updateStatus(r.id, 'DECLINED')} className="text-xs px-2.5 py-1 border border-gray-300 rounded">Decline</button>
                        </>
                      )}
                      {r.status === 'CONFIRMED' && <button onClick={() => updateStatus(r.id, 'HELD')} className="text-xs px-2.5 py-1 bg-black text-white rounded">Mark held</button>}
                      {r.status === 'HELD' && <button onClick={() => updateStatus(r.id, 'COLLECTED')} className="text-xs px-2.5 py-1 bg-green-600 text-white rounded">Collected • Verify QR</button>}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
          <style>{`
        @media (max-width: 640px) {
          div[style*="maxWidth: 768"], div[style*="maxWidth: 800"] {
            padding-left: 16px !important;
            padding-right: 16px !important;
          }
        }
        @media (max-width: 375px) {
          div[style*="maxWidth: 768"], div[style*="maxWidth: 800"] {
            padding-left: 12px !important;
            padding-right: 12px !important;
          }
        }
      `}</style>
    </div>
  );
}
