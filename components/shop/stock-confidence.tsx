'use client';

import { useMemo } from 'react';

interface StockConfidenceProps {
  lastInventoryUpdate?: string | Date | null;
  stock: number;
  className?: string;
}

export function StockConfidence({ lastInventoryUpdate, stock, className }: StockConfidenceProps) {
  const { text, stale, minutesAgo } = useMemo(() => {
    if (!lastInventoryUpdate) {
      return { text: 'Stock not recently verified', stale: true, minutesAgo: null };
    }
    const updated = new Date(lastInventoryUpdate);
    const now = new Date();
    const diffMs = now.getTime() - updated.getTime();
    const minutes = Math.floor(diffMs / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    let txt = '';
    if (minutes < 1) txt = 'Stock checked just now';
    else if (minutes < 60) txt = `Stock checked ${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    else if (hours < 24) txt = `Stock checked ${hours} hour${hours > 1 ? 's' : ''} ago`;
    else txt = `Stock checked ${days} day${days > 1 ? 's' : ''} ago`;

    // Stale if > 2 hours per point 23,24
    const isStale = minutes > 120;
    return { text: txt, stale: isStale, minutesAgo: minutes };
  }, [lastInventoryUpdate]);

  if (stock <= 0) {
    return (
      <div className={`inline-flex items-center gap-1.5 text-xs px-2 py-1 bg-gray-100 text-gray-600 border border-gray-200 rounded ${className || ''}`}>
        <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
        Out of stock
      </div>
    );
  }

  return (
    <div className={`inline-flex flex-col gap-0.5 ${className || ''}`}>
      <div className={`inline-flex items-center gap-1.5 text-xs px-2 py-1 border rounded ${stale ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-green-50 text-green-800 border-green-200'}`}>
        <span className={`w-2 h-2 rounded-full ${stale ? 'bg-amber-500' : 'bg-green-600'}`}></span>
        {text}
        {stale && minutesAgo !== null && minutesAgo > 240 && ' • Availability may need confirmation'}
      </div>
      {stale && (
        <span className="text-[10px] text-amber-700 px-1">Confirm with shop before visiting</span>
      )}
    </div>
  );
}

export function ShopStockStatus({ lastInventoryUpdate, isPaused, pauseReason }: { lastInventoryUpdate?: string | Date | null; isPaused?: boolean; pauseReason?: string | null }) {
  if (isPaused) {
    return (
      <div className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 bg-gray-100 text-gray-700 border border-gray-300 rounded">
        <span className="w-2 h-2 bg-gray-500 rounded-full"></span>
        Online orders paused {pauseReason ? `• ${pauseReason}` : ''}
      </div>
    );
  }
  return <StockConfidence lastInventoryUpdate={lastInventoryUpdate} stock={1} />;
}
