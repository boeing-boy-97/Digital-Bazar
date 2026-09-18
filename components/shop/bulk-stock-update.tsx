'use client';

import { useState, useRef } from 'react';

interface BulkStockUpdateProps {
  shopId: string;
  onComplete?: () => void;
}

type Mode = 'table' | 'csv' | 'barcode';

interface Row {
  sku: string;
  productId?: string;
  productName?: string;
  currentStock?: number;
  newStock: number;
  pricePaise?: number;
}

export function BulkStockUpdate({ shopId, onComplete }: BulkStockUpdateProps) {
  const [mode, setMode] = useState<Mode>('table');
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchProductsForTable = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/shops/${shopId}/products?limit=100`);
      const data = await res.json();
      const prods = data.products || data.shops || [];
      setRows(prods.slice(0, 20).map((p: any) => ({
        sku: p.sku,
        productId: p.id,
        productName: p.name,
        currentStock: p.stock,
        newStock: p.stock,
        pricePaise: p.pricePaise
      })));
    } catch (e: any) {
      setResult(`Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      const lines = text.split('\n').filter(l => l.trim());
      const parsed: Row[] = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map(c => c.trim());
        if (cols.length >= 2) {
          parsed.push({
            sku: cols[0],
            newStock: parseInt(cols[1]) || 0,
            productName: cols[2] || undefined
          });
        }
      }
      setRows(parsed);
      setResult(`Parsed ${parsed.length} rows from CSV. Expected format: sku,stock,pricePaise(optional)`);
    };
    reader.readAsText(file);
  };

  const handleBarcodeScan = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const sku = (e.target as HTMLInputElement).value.trim();
      if (sku) {
        setRows(prev => [...prev, { sku, newStock: 0 }]);
        (e.target as HTMLInputElement).value = '';
      }
    }
  };

  const updateStock = async () => {
    if (rows.length === 0) {
      setResult('No rows to update');
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(`/api/shops/${shopId}/products/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates: rows })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Bulk update failed');
      setResult(`Updated ${data.updated || rows.length} products. ${data.errors ? `Errors: ${data.errors.length}` : ''}`);
      onComplete?.();
    } catch (e: any) {
      setResult(`Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border border-gray-200 bg-white rounded">
      <div className="p-4 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-900">Bulk Stock Update - Method A/B/C per point 52</h3>
        <p className="text-xs text-gray-600 mt-1">Real operational need: shopkeeper receives delivery, needs to update 50 products quickly. Not single edit.</p>
        <div className="flex gap-2 mt-3">
          <button onClick={() => setMode('table')} className={`text-xs px-3 py-1.5 rounded border ${mode === 'table' ? 'bg-black text-white border-black' : 'bg-white text-gray-700 border-gray-300'}`}>Table edit</button>
          <button onClick={() => setMode('csv')} className={`text-xs px-3 py-1.5 rounded border ${mode === 'csv' ? 'bg-black text-white border-black' : 'bg-white text-gray-700 border-gray-300'}`}>CSV/XLSX</button>
          <button onClick={() => setMode('barcode')} className={`text-xs px-3 py-1.5 rounded border ${mode === 'barcode' ? 'bg-black text-white border-black' : 'bg-white text-gray-700 border-gray-300'}`}>Barcode scan</button>
        </div>
      </div>

      <div className="p-4">
        {mode === 'table' && (
          <div>
            <button onClick={fetchProductsForTable} className="text-xs px-3 py-1.5 bg-gray-100 border border-gray-300 rounded mb-3">Load products</button>
            <div className="overflow-x-auto border border-gray-200 rounded">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="text-left p-2 font-medium">SKU</th>
                    <th className="text-left p-2 font-medium">Product</th>
                    <th className="text-left p-2 font-medium">Current</th>
                    <th className="text-left p-2 font-medium">New stock</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, idx) => (
                    <tr key={idx} className="border-t border-gray-100">
                      <td className="p-2 font-mono">{r.sku}</td>
                      <td className="p-2 truncate max-w-[150px]">{r.productName}</td>
                      <td className="p-2">{r.currentStock ?? '-'}</td>
                      <td className="p-2">
                        <input type="number" value={r.newStock} onChange={e => {
                          const v = parseInt(e.target.value) || 0;
                          setRows(prev => prev.map((row, i) => i === idx ? { ...row, newStock: v } : row));
                        }} className="w-20 border border-gray-300 rounded px-2 py-1 text-xs" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {mode === 'csv' && (
          <div>
            <div className="text-xs text-gray-600 mb-2">Format: sku,stock,pricePaise (header row optional). Example:<br/><code className="bg-gray-50 px-1 py-0.5 rounded">SKU001,50,19900<br/>SKU002,0,29900</code></div>
            <input ref={fileRef} type="file" accept=".csv" onChange={handleCsvUpload} className="text-xs border border-gray-300 rounded p-2 w-full" />
            {rows.length > 0 && <div className="mt-2 text-xs text-gray-700">{rows.length} rows parsed</div>}
          </div>
        )}

        {mode === 'barcode' && (
          <div>
            <div className="text-xs text-gray-600 mb-2">Scan barcode or type SKU and press Enter. Each scan adds row.</div>
            <input type="text" placeholder="Scan barcode / type SKU + Enter" onKeyDown={handleBarcodeScan} className="w-full border border-gray-300 rounded px-3 py-2 text-sm" autoFocus />
            <div className="mt-3 space-y-1 max-h-40 overflow-y-auto">
              {rows.map((r, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs border border-gray-100 rounded p-2">
                  <span className="font-mono">{r.sku}</span>
                  <input type="number" value={r.newStock} onChange={e => setRows(prev => prev.map((row, i) => i === idx ? { ...row, newStock: parseInt(e.target.value) || 0 } : row))} className="w-16 border border-gray-300 rounded px-1 py-0.5 ml-auto" />
                  <button onClick={() => setRows(prev => prev.filter((_, i) => i !== idx))} className="text-red-600">×</button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2 mt-4">
          <button onClick={updateStock} disabled={loading || rows.length === 0} className="text-xs px-4 py-2 bg-black text-white rounded disabled:opacity-50">Update {rows.length} products</button>
          <button onClick={() => setRows([])} className="text-xs px-3 py-2 border border-gray-300 rounded">Clear</button>
        </div>

        {result && <div className="mt-3 text-xs p-2 bg-gray-50 border border-gray-200 rounded">{result}</div>}
      </div>
    </div>
  );
}
