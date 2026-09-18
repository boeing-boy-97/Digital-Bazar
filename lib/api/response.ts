// API Response Helpers - Consistent format per point 108
// Success: {success: true, data: ...} or {success: true, products, total...} for backward compat
// Error: {success: false, error: {code, message, details}}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

export function successResponse(data: any, meta?: any, requestId?: string) {
  return {
    success: true,
    ...data,
    ...(meta ? { meta } : {}),
    ...(requestId ? { requestId } : {})
  };
}

export function errorResponse(code: string, message: string, status: number, details?: any, requestId?: string) {
  return {
    success: false,
    error: {
      code,
      message,
      ...(details ? { details } : {})
    },
    ...(requestId ? { requestId } : {})
  };
}

// Legacy compat helpers - maintain existing frontend expectations while adding success flag
export function legacyProductsResponse(products: any[], total: number, page: number, totalPages: number, requestId?: string) {
  return {
    success: true,
    products,
    total,
    page,
    totalPages,
    data: { products, total, page, totalPages },
    ...(requestId ? { requestId } : {})
  };
}

export function legacyShopsResponse(shops: any[], requestId?: string) {
  return {
    success: true,
    shops,
    data: { shops },
    ...(requestId ? { requestId } : {})
  };
}

// Error codes per point 109
export const ERROR_CODES = {
  INSUFFICIENT_STOCK: 'INSUFFICIENT_STOCK',
  PRICE_CHANGED: 'PRICE_CHANGED',
  SHOP_CLOSED: 'SHOP_CLOSED',
  SHOP_SUSPENDED: 'SHOP_SUSPENDED',
  LISTING_INACTIVE: 'LISTING_INACTIVE',
  INVALID_ORDER_STATE: 'INVALID_ORDER_STATE',
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  PAYMENT_VERIFICATION_FAILED: 'PAYMENT_VERIFICATION_FAILED',
  INVALID_QR: 'INVALID_QR',
  QR_EXPIRED: 'QR_EXPIRED',
  QR_ALREADY_USED: 'QR_ALREADY_USED',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  DUPLICATE_REQUEST: 'DUPLICATE_REQUEST',
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  NOT_FOUND: 'NOT_FOUND',
  RATE_LIMITED: 'RATE_LIMITED',
  CART_EMPTY: 'CART_EMPTY',
  ORDER_NOT_FOUND: 'ORDER_NOT_FOUND',
  SHOP_NOT_FOUND: 'SHOP_NOT_FOUND',
  SHOP_PAUSED: 'SHOP_PAUSED',
  SHOP_AT_CAPACITY: 'SHOP_AT_CAPACITY'
} as const;
