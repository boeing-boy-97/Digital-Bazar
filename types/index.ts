export type UserRole = 'customer' | 'shop_owner' | 'shop_employee' | 'admin' | 'super_admin';
export type ShopStatus = 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'SUSPENDED' | 'CLOSED';
export type OrderStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'PREPARING' | 'PARTIALLY_READY' | 'READY_FOR_PICKUP' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'COMPLETED' | 'CANCELLED' | 'REFUND_PENDING' | 'REFUNDED';
export type PaymentStatus = 'PENDING' | 'CREATED' | 'AUTHORIZED' | 'CAPTURED' | 'FAILED' | 'REFUNDED' | 'CANCELLED';
export type PaymentMethod = 'ONLINE' | 'UPI' | 'CARD' | 'NETBANKING' | 'PAY_AT_STORE' | 'COD';

export interface Shop {
  id: string;
  name: string;
  slug: string;
  category: string;
  address: string;
  city: string;
  rating: number;
  reviewCount: number;
  preparationTimeMin: number;
  status: ShopStatus;
  isPickupEnabled: boolean;
  isDeliveryEnabled: boolean;
}

export interface Product {
  id: string;
  shopId: string;
  name: string;
  slug: string;
  sku: string;
  brand?: string;
  price: number;
  compareAtPrice?: number;
  stock: number;
  reservedStock: number;
  unit: string;
  isActive: boolean;
}

export interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  product: Product;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  shopId: string;
  status: OrderStatus;
  total: number;
  qrToken: string;
  createdAt: Date;
}

export interface OrderItemForSorting {
  id: string;
  productName: string;
  quantity: number;
  storageZone?: string | null;
  category?: string;
}
