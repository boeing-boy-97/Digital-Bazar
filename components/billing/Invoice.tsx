import { formatCurrency, formatPaise, formatDate  } from '@/lib/utils/helpers';

interface InvoiceProps {
  invoice: {
    invoiceNumber: string;
    data: string; // JSON
    createdAt: string;
  };
  order: any; // Supports both legacy total and new totalPaise per point 50
  shop: {
    name: string;
    address: string;
    gstin?: string;
    phone?: string;
  };
  customer: {
    name: string;
    phone?: string;
  };
}

export function Invoice({ invoice, order, shop, customer }: InvoiceProps) {
  let parsedData: any = {};
  try { parsedData = JSON.parse(invoice.data); } catch {}

  return (
    <div style={{ background: 'white', padding: 32, borderRadius: 8, border: '1px solid var(--border)', fontSize: '14px', color: 'black', maxWidth: 800, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, borderBottom: '2px solid black', paddingBottom: 16 }}>
        <div>
          <div style={{ fontSize: '20px', fontWeight: 800 }}>{shop.name}</div>
          <div style={{ fontSize: '12px', marginTop: 4, maxWidth: 300 }}>{shop.address}</div>
          {shop.gstin && <div style={{ fontSize: '12px', marginTop: 4 }}>GSTIN: {shop.gstin}</div>}
          {shop.phone && <div style={{ fontSize: '12px' }}>Phone: {shop.phone}</div>}
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '18px', fontWeight: 700 }}>INVOICE</div>
          <div style={{ fontSize: '12px', marginTop: 4 }}>{invoice.invoiceNumber}</div>
          <div style={{ fontSize: '12px' }}>Order: {order.orderNumber}</div>
          <div style={{ fontSize: '12px' }}>{formatDate(invoice.createdAt)}</div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: '12px', textTransform: 'uppercase', color: '#666' }}>Bill To</div>
          <div style={{ fontWeight: 600, marginTop: 4 }}>{customer.name}</div>
          <div style={{ fontSize: '12px' }}>{customer.phone}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontWeight: 600, fontSize: '12px', textTransform: 'uppercase', color: '#666' }}>Payment</div>
          <div style={{ marginTop: 4 }}>{order.paymentMethod.replace(/_/g, ' ')}</div>
          <div style={{ fontSize: '12px' }}>Digital Bazar</div>
        </div>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24 }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #ddd', textAlign: 'left', fontSize: '12px', textTransform: 'uppercase', color: '#666' }}>
            <th style={{ padding: '8px 0' }}>Item</th>
            <th style={{ padding: '8px 0', textAlign: 'center' }}>Qty</th>
            <th style={{ padding: '8px 0', textAlign: 'right' }}>Price</th>
            <th style={{ padding: '8px 0', textAlign: 'right' }}>Total</th>
          </tr>
        </thead>
        <tbody>
          {(parsedData.items || []).map((item: any, idx: number) => (
            <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '8px 0' }}><div style={{ fontWeight: 500 }}>{item.productName}</div><div style={{ fontSize: '11px', color: '#666' }}>{item.sku}</div></td>
              <td style={{ padding: '8px 0', textAlign: 'center' }}>{item.quantity} {item.unit}</td>
              <td style={{ padding: '8px 0', textAlign: 'right' }}>{formatPaise((item as any).unitPricePaise ?? Math.round((item.unitPrice||0)*100))}</td>
              <td style={{ padding: '8px 0', textAlign: 'right' }}>{formatPaise((item as any).subtotalPaise ?? Math.round((item.subtotal||0)*100))}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <div style={{ width: 250 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '13px' }}><span>Subtotal</span><span>{formatPaise((order as any).subtotalPaise ?? Math.round((order.subtotal||0)*100))}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '13px', color: 'green' }}><span>Discount</span><span>-{formatPaise((order as any).discountPaise ?? Math.round((order.discount||0)*100))}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '13px' }}><span>Tax</span><span>{formatPaise((order as any).taxPaise ?? Math.round((order.tax||0)*100))}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontWeight: 700, borderTop: '2px solid black', marginTop: 8 }}><span>Total</span><span>{formatPaise(order.totalPaise ?? Math.round((order.total||0)*100))}</span></div>
        </div>
      </div>

      <div style={{ marginTop: 32, paddingTop: 16, borderTop: '1px solid #eee', fontSize: '11px', color: '#666', textAlign: 'center' }}>
        Thank you for shopping at {shop.name} via Digital Bazar • Select Before You Arrive • This is a computer generated invoice
      </div>
    </div>
  );
}
