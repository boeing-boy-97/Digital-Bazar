import { z } from 'zod';

export const phoneSchema = z.string().min(10).max(15).regex(/^\+?[0-9]+$/, "Invalid phone number");

export const registerSchema = z.object({
  name: z.string().min(2).max(50),
  phone: phoneSchema.optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).max(100).optional(),
  role: z.enum(['customer', 'shop_owner', 'shop_employee', 'admin', 'super_admin']).default('customer')
}).refine(data => data.phone || data.email, {
  message: "Either phone or email is required",
  path: ["phone"]
});

export const loginSchema = z.object({
  phone: phoneSchema.optional(),
  email: z.string().email().optional(),
  password: z.string().min(1),
}).refine(data => data.phone || data.email, {
  message: "Either phone or email is required"
});

export const otpVerifySchema = z.object({
  phone: phoneSchema,
  otp: z.string().length(6),
  name: z.string().min(2).max(50).optional()
});

export const shopCreateSchema = z.object({
  name: z.string().min(2).max(100),
  category: z.string().min(2).max(50),
  description: z.string().max(500).optional(),
  address: z.string().min(5).max(200),
  city: z.string().min(2).max(50),
  pincode: z.string().max(10).optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  isPickupEnabled: z.boolean().default(true),
  isDeliveryEnabled: z.boolean().default(false),
});

export const productCreateSchema = z.object({
  name: z.string().min(2).max(200),
  sku: z.string().min(2).max(50),
  barcode: z.string().optional(),
  description: z.string().max(1000).optional(),
  brand: z.string().max(50).optional(),
  categoryId: z.string().optional(),
  storageZoneId: z.string().optional(),
  unit: z.string().default("piece"),
  size: z.string().optional(),
  weight: z.string().optional(),
  price: z.number().positive(),
  compareAtPrice: z.number().positive().optional(),
  discount: z.number().min(0).max(100).optional(),
  taxRate: z.number().min(0).max(100).default(0),
  hsnCode: z.string().optional(),
  stock: z.number().int().min(0).default(0),
  minOrderQty: z.number().int().min(1).default(1),
  maxOrderQty: z.number().int().positive().optional(),
  lowStockThreshold: z.number().int().min(0).default(10),
  isActive: z.boolean().default(true),
});

export const cartAddSchema = z.object({
  shopId: z.string(),
  productId: z.string(),
  variantId: z.string().optional(),
  quantity: z.number().int().min(1),
  notes: z.string().max(200).optional()
});

export const orderCreateSchema = z.object({
  shopId: z.string(),
  paymentMethod: z.enum(['ONLINE', 'UPI', 'CARD', 'NETBANKING', 'PAY_AT_STORE', 'COD']).default('PAY_AT_STORE'),
  pickupType: z.enum(['PICKUP', 'DELIVERY']).default('PICKUP'),
  pickupTime: z.string().optional(),
  deliveryAddress: z.any().optional(),
  notes: z.string().max(500).optional(),
  promotionCode: z.string().optional()
});

export const orderStatusUpdateSchema = z.object({
  status: z.enum(['PENDING','ACCEPTED','REJECTED','PREPARING','PARTIALLY_READY','READY_FOR_PICKUP','OUT_FOR_DELIVERY','DELIVERED','COMPLETED','CANCELLED','REFUND_PENDING','REFUNDED']),
  reason: z.string().max(500).optional()
});

export const storageZoneSchema = z.object({
  name: z.string().min(2).max(50),
  code: z.string().min(1).max(20),
  description: z.string().max(200).optional(),
  sortOrder: z.number().int().default(0)
});

// State machine validation
export const validTransitions: Record<string, string[]> = {
  PENDING: ['ACCEPTED', 'REJECTED', 'CANCELLED'],
  ACCEPTED: ['PREPARING', 'CANCELLED'],
  PREPARING: ['PARTIALLY_READY', 'READY_FOR_PICKUP', 'CANCELLED'],
  PARTIALLY_READY: ['READY_FOR_PICKUP', 'CANCELLED'],
  READY_FOR_PICKUP: ['COMPLETED', 'OUT_FOR_DELIVERY'],
  OUT_FOR_DELIVERY: ['DELIVERED', 'CANCELLED'],
  DELIVERED: ['COMPLETED'],
  COMPLETED: ['REFUND_PENDING'],
  CANCELLED: [],
  REJECTED: [],
  REFUND_PENDING: ['REFUNDED'],
  REFUNDED: []
};

export function canTransition(from: string, to: string): boolean {
  return validTransitions[from]?.includes(to) || false;
}
