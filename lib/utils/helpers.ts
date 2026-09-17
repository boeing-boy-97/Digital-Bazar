export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(d);
}

export function formatDistance(meters?: number): string {
  if (!meters) return 'Nearby';
  if (meters < 1000) return `${Math.round(meters)}m away`;
  return `${(meters / 1000).toFixed(1)}km away`;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // metres
  const φ1 = lat1 * Math.PI/180;
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lon2-lon1) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c;
}

export function orderStatusColor(status: string): string {
  const map: Record<string, string> = {
    PENDING: 'warning',
    ACCEPTED: 'info',
    PREPARING: 'info',
    PARTIALLY_READY: 'warning',
    READY_FOR_PICKUP: 'success',
    OUT_FOR_DELIVERY: 'info',
    DELIVERED: 'success',
    COMPLETED: 'success',
    CANCELLED: 'danger',
    REJECTED: 'danger',
    REFUND_PENDING: 'warning',
    REFUNDED: 'neutral'
  };
  return map[status] || 'neutral';
}

export function orderStatusLabel(status: string): string {
  return status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
}

// Automatic order sorting by storage zones - CORE FEATURE
export interface OrderItemForSorting {
  id: string;
  productName: string;
  quantity: number;
  storageZone?: string | null;
  storageZoneSort?: number;
  category?: string;
}

export function sortOrderItemsByZone(items: OrderItemForSorting[]): Record<string, OrderItemForSorting[]> {
  // Group by zone
  const grouped: Record<string, OrderItemForSorting[]> = {};
  
  for (const item of items) {
    const zone = item.storageZone || 'Unassigned Zone';
    if (!grouped[zone]) grouped[zone] = [];
    grouped[zone].push(item);
  }

  // Sort zones by sortOrder, then items by category then name
  const sortedZones = Object.keys(grouped).sort((a, b) => {
    // Find sort order - for now alphabetical with Unassigned last
    if (a === 'Unassigned Zone') return 1;
    if (b === 'Unassigned Zone') return -1;
    return a.localeCompare(b);
  });

  const result: Record<string, OrderItemForSorting[]> = {};
  for (const zone of sortedZones) {
    result[zone] = grouped[zone].sort((x, y) => {
      if (x.category && y.category && x.category !== y.category) {
        return x.category.localeCompare(y.category);
      }
      return x.productName.localeCompare(y.productName);
    });
  }

  return result;
}

export function generateQRData(orderNumber: string, qrToken: string, shopId: string): string {
  // Secure QR contains token, not just order number - server validates
  return JSON.stringify({
    orderNumber,
    token: qrToken,
    shopId,
    timestamp: Date.now()
  });
}
