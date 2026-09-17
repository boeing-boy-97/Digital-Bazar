'use client';
import { useEffect, useState } from 'react';

export function useRealtimeOrders(orderId?: string, shopId?: string) {
  const [data, setData] = useState<any>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!orderId && !shopId) return;

    const params = new URLSearchParams();
    if (orderId) params.set('orderId', orderId);
    if (shopId) params.set('shopId', shopId);

    const es = new EventSource(`/api/realtime/orders?${params.toString()}`);
    
    es.onopen = () => setConnected(true);
    es.onmessage = (e) => {
      try {
        const parsed = JSON.parse(e.data);
        setData(parsed);
      } catch {}
    };
    es.onerror = () => setConnected(false);

    return () => {
      es.close();
      setConnected(false);
    };
  }, [orderId, shopId]);

  return { data, connected };
}
