'use client';

import { useMemo } from 'react';

interface ProductHealth {
  id: string;
  name: string;
  sku: string;
  stock: number;
  pricePaise: number;
  images: string[];
  productStatus: string;
  masterProductId?: string | null;
  barcode?: string | null;
  categoryId?: string | null;
  updatedAt: string;
}

interface CatalogHealthProps {
  products: ProductHealth[];
  className?: string;
}

type IssueType = 'missing_image' | 'missing_price' | 'out_of_stock' | 'low_stock' | 'draft_status' | 'missing_category' | 'missing_barcode' | 'stale' | 'no_master_link';

interface Issue {
  productId: string;
  productName: string;
  sku: string;
  type: IssueType;
  severity: 'high' | 'medium' | 'low';
  message: string;
}

export function CatalogHealthWarnings({ products, className }: CatalogHealthProps) {
  const issues = useMemo(() => {
    const list: Issue[] = [];
    const now = new Date();
    for (const p of products) {
      if (!p.images || p.images.length === 0 || (typeof p.images === 'string' && JSON.parse(p.images as any).length === 0)) {
        list.push({ productId: p.id, productName: p.name, sku: p.sku, type: 'missing_image', severity: 'medium', message: 'Missing image - customers trust photos' });
      }
      if (!p.pricePaise || p.pricePaise <= 0) {
        list.push({ productId: p.id, productName: p.name, sku: p.sku, type: 'missing_price', severity: 'high', message: 'Missing price - not sellable' });
      }
      if (p.stock <= 0) {
        list.push({ productId: p.id, productName: p.name, sku: p.sku, type: 'out_of_stock', severity: 'high', message: 'Out of stock - hidden from customers' });
      } else if (p.stock <= 5) {
        list.push({ productId: p.id, productName: p.name, sku: p.sku, type: 'low_stock', severity: 'medium', message: `Low stock: ${p.stock} left` });
      }
      if (p.productStatus === 'DRAFT') {
        list.push({ productId: p.id, productName: p.name, sku: p.sku, type: 'draft_status', severity: 'medium', message: 'Draft - not visible to customers' });
      }
      if (!p.categoryId) {
        list.push({ productId: p.id, productName: p.name, sku: p.sku, type: 'missing_category', severity: 'low', message: 'No category - hard to find' });
      }
      if (!p.barcode) {
        list.push({ productId: p.id, productName: p.name, sku: p.sku, type: 'missing_barcode', severity: 'low', message: 'No barcode - scanning not possible' });
      }
      const updated = new Date(p.updatedAt);
      const daysDiff = (now.getTime() - updated.getTime()) / (1000 * 60 * 60 * 24);
      if (daysDiff > 30) {
        list.push({ productId: p.id, productName: p.name, sku: p.sku, type: 'stale', severity: 'low', message: `Not updated for ${Math.floor(daysDiff)} days - verify stock` });
      }
      if (!p.masterProductId) {
        list.push({ productId: p.id, productName: p.name, sku: p.sku, type: 'no_master_link', severity: 'low', message: 'Not linked to master catalog - search visibility lower' });
      }
    }
    return list;
  }, [products]);

  const high = issues.filter(i => i.severity === 'high').length;
  const medium = issues.filter(i => i.severity === 'medium').length;
  const low = issues.filter(i => i.severity === 'low').length;

  if (issues.length === 0) {
    return (
      <div className={`border border-green-200 bg-green-50 rounded p-4 ${className || ''}`}>
        <div className="text-sm font-medium text-green-800">Catalog health: Good</div>
        <div className="text-xs text-green-700 mt-1">No issues detected. {products.length} products verified.</div>
      </div>
    );
  }

  return (
    <div className={`border border-gray-200 bg-white rounded ${className || ''}`}>
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">Catalog Health</h3>
          <span className="text-xs text-gray-500">{products.length} products scanned</span>
        </div>
        <div className="flex gap-3 mt-2 text-xs">
          {high > 0 && <span className="px-2 py-1 bg-red-50 text-red-700 border border-red-200 rounded">{high} high</span>}
          {medium > 0 && <span className="px-2 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded">{medium} medium</span>}
          {low > 0 && <span className="px-2 py-1 bg-gray-50 text-gray-600 border border-gray-200 rounded">{low} low</span>}
        </div>
      </div>
      <div className="max-h-64 overflow-y-auto">
        {issues.slice(0, 30).map((issue, idx) => (
          <div key={`${issue.productId}-${issue.type}-${idx}`} className="flex items-start gap-3 p-3 border-b border-gray-50 last:border-0">
            <span className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${issue.severity === 'high' ? 'bg-red-500' : issue.severity === 'medium' ? 'bg-amber-500' : 'bg-gray-400'}`}></span>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-gray-900 truncate">{issue.productName} <span className="text-gray-500 font-normal">({issue.sku})</span></div>
              <div className="text-xs text-gray-600 mt-0.5">{issue.message}</div>
            </div>
            <span className="text-[10px] text-gray-500 uppercase tracking-wide">{issue.type.replace(/_/g, ' ')}</span>
          </div>
        ))}
        {issues.length > 30 && (
          <div className="p-3 text-xs text-gray-500 text-center">+ {issues.length - 30} more issues</div>
        )}
      </div>
    </div>
  );
}
