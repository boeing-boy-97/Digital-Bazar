'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Reservation {
  id: string;
  reservationNumber: string;
  reservationCode: string;
  status: string;
  expiresAt: string;
  shop: { name: string; address: string; city: string };
  items: { productName: string; quantity: number; unit: string }[];
}

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/reservations')
      .then(r => r.json())
      .then(d => {
        if (d.success || d.reservations) setReservations(d.reservations || []);
        else setError(d.error || 'Failed to load');
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="min-h-screen p-6 text-sm">Loading reservations...</div>;

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-semibold text-gray-900">Your Reservations</h1>
          <Link href="/shops" className="text-xs px-3 py-1.5 border border-gray-300 rounded">Browse shops</Link>
        </div>

        <div className="text-xs text-gray-600 mb-4 border border-gray-200 bg-gray-50 p-3 rounded">
          <strong>How reservation works per point 33,34:</strong> Reservation = I will come and collect. Different from Pickup (Prepare it for me) and Delivery (Bring it to me). Reserved until expiry based on shop policy (e.g. 6:30 PM). Show code at counter.
        </div>

        {error && <div className="text-sm text-red-700 border border-red-200 bg-red-50 p-3 rounded mb-4">{error}</div>}

        {reservations.length === 0 ? (
          <div className="border border-gray-200 rounded p-8 text-center">
            <div className="text-sm text-gray-700 font-medium">No reservations yet</div>
            <div className="text-xs text-gray-500 mt-1">When you reserve products, they will appear here with expiry timer. Real digital layer over real local market per point 1.</div>
            <Link href="/shops" className="inline-block mt-4 text-xs px-4 py-2 bg-black text-white rounded">Find shops near you</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {reservations.map(r => {
              const expiry = new Date(r.expiresAt);
              const now = new Date();
              const isExpired = expiry < now || r.status === 'EXPIRED';
              const minsLeft = Math.max(0, Math.floor((expiry.getTime() - now.getTime()) / 60000));
              return (
                <div key={r.id} className={`border rounded p-4 ${isExpired ? 'border-gray-200 bg-gray-50' : 'border-green-200 bg-green-50/30'}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-sm font-semibold text-gray-900">{r.reservationNumber} <span className="text-xs font-mono bg-white border px-1.5 py-0.5 rounded">{r.reservationCode}</span></div>
                      <div className="text-xs text-gray-600 mt-1">{r.shop.name} • {r.shop.city}</div>
                      <div className="text-xs text-gray-600 mt-1">{r.items.map(i => `${i.productName} × ${i.quantity} ${i.unit}`).join(', ')}</div>
                    </div>
                    <div className="text-right">
                      <div className={`text-xs px-2 py-1 rounded border inline-block ${r.status === 'PENDING' ? 'bg-amber-50 text-amber-800 border-amber-200' : r.status === 'COLLECTED' ? 'bg-green-50 text-green-800 border-green-200' : r.status === 'EXPIRED' || r.status === 'DECLINED' ? 'bg-gray-100 text-gray-600 border-gray-200' : 'bg-blue-50 text-blue-800 border-blue-200'}`}>{r.status}</div>
                      {!isExpired && r.status !== 'COLLECTED' && r.status !== 'DECLINED' && (
                        <div className="text-xs text-gray-700 mt-1">Reserved until {expiry.toLocaleTimeString()} {minsLeft < 60 ? `• ${minsLeft}m left` : ''}</div>
                      )}
                      {isExpired && <div className="text-xs text-gray-500 mt-1">Expired at {expiry.toLocaleString()}</div>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
