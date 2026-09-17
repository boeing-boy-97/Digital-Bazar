'use client';
import { useEffect, useState } from 'react';
import { formatCurrency, formatDate } from '@/lib/utils/helpers';
import { FileText, Download, Receipt } from 'lucide-react';

export default function BillingPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(()=>{ 
    fetch('/api/orders?status=COMPLETED').then(r=>r.json()).then(d=>{
      setOrders(d.orders||[]);
      setInvoices((d.orders||[]).map((o:any, idx:number)=>({
        ...o,
        invoiceNumber: o.invoiceNumber || `INV-${new Date().getFullYear()}-${String(idx+1).padStart(5,'0')}-${o.orderNumber.slice(-4)}`,
      })));
      setLoading(false);
    }).catch(()=>setLoading(false)); 
  },[]);

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, letterSpacing: '-0.02em' }}>Billing & invoices</h1>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: 4 }}>Manage invoices and billing for completed orders</p>
      </div>
      
      <div className="card" style={{ marginBottom: 20, background: 'var(--brand-light)', borderColor: 'var(--brand)' }}>
        <div className="card-body" style={{ display: 'flex', gap: 12 }}>
          <div style={{ width: 36, height: 36, background: 'var(--brand)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Receipt size={18} color="white" />
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: '14px' }}>GST compliant invoicing</div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.4 }}>
              Invoices include your shop GSTIN, HSN codes, tax breakdown, and are generated automatically for completed orders. PDF invoices are available for download.
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="card" style={{ padding: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1,2,3].map(i => (
              <div key={i} style={{ display: 'flex', gap: 12 }}>
                <div className="skeleton" style={{ height: 16, width: 120 }} />
                <div className="skeleton" style={{ height: 16, width: 80 }} />
              </div>
            ))}
          </div>
        </div>
      ) : invoices.length === 0 ? (
        <div className="card" style={{ padding: 40, textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, background: 'var(--surface-muted)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <FileText size={24} color="var(--text-tertiary)" />
          </div>
          <div style={{ fontWeight: 600, fontSize: '16px', marginBottom: 8 }}>No invoices yet</div>
          <div style={{ fontSize: '14px', color: 'var(--text-secondary)', maxWidth: 400, margin: '0 auto', lineHeight: 1.5 }}>
            Invoices are generated automatically when orders are completed. You'll find them here with PDF download option.
          </div>
        </div>
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div className="table-wrapper">
            <table className="table">
              <thead><tr><th>Invoice</th><th>Order</th><th>Customer</th><th>Amount</th><th>Date</th><th>Status</th><th>PDF</th></tr></thead>
              <tbody>
                {invoices.map(o=>(
                  <tr key={o.id}>
                    <td style={{ fontFamily: 'monospace', fontSize: '12px', fontWeight: 500 }}>{o.invoiceNumber}</td>
                    <td><span style={{ fontFamily: 'monospace', fontSize: '13px' }}>#{o.orderNumber}</span></td>
                    <td><div style={{ fontWeight: 500, fontSize: '14px' }}>{o.customer?.name}</div><div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{o.customer?.phone}</div></td>
                    <td style={{ fontWeight: 600 }}>{formatCurrency(o.total)}</td>
                    <td style={{ fontSize: '12px' }}>{formatDate(o.createdAt)}</td>
                    <td><span className="badge badge-success">{o.paymentStatus || 'Paid'}</span></td>
                    <td><a href={`/api/orders/${o.id}/invoice`} target="_blank" className="btn btn-secondary btn-sm" style={{ borderRadius: 6 }}><Download size={14} />PDF</a></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div style={{ marginTop: 16, fontSize: '12px', color: 'var(--text-secondary)', background: 'var(--surface)', padding: 14, borderRadius: 10, border: '1px solid var(--border)', lineHeight: 1.5 }}>
        <strong>About invoices:</strong> Invoice numbers are generated sequentially and cannot be edited after creation. For corrections, a credit note will be issued. All invoices include GSTIN, HSN codes, and tax breakdown as per Indian GST requirements.
      </div>
    </div>
  );
}
