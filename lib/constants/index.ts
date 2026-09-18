// Business Constants - No Magic Numbers, Centralized per senior dev best practice
// All hardcoded rules, thresholds, limits, durations in one place

export const MONEY = {
  MINOR_UNIT: 100, // 1 INR = 100 paise
  MAX_AMOUNT_PA: 1000000 * 100, // 10 lakhs in paise
  MAX_AMOUNT_INR: 1000000,
  DEFAULT_TAX_RATE: 18,
  DEFAULT_DISCOUNT_MAX: 100,
} as const;

export const INVENTORY = {
  LOW_STOCK_DEFAULT: 10,
  OUT_OF_STOCK: 0,
  MIN_ORDER_QTY_DEFAULT: 1,
  MAX_ORDER_QTY_DEFAULT: null,
  RESERVED_EXPIRY_MINUTES: 30, // Reserve expires after 30 min if not ordered
  STOCKOUT_FORECAST_DAYS: 7,
} as const;

export const ORDER = {
  NUMBER_PREFIX: 'DB',
  NUMBER_PAD: 6,
  QR_EXPIRY_MINUTES: 15,
  QR_PREFIX: 'QR-',
  NONCE_BYTES: 8,
  HMAC_LENGTH: 32,
  PREP_TIME_DEFAULT_MIN: 15,
  PREP_TIME_BUFFER_MIN: 10,
  MAX_ACTIVE_ORDERS_DEFAULT: 50,
  CANCEL_WINDOW_MINUTES: 30, // Customer can cancel within 30 min of PENDING
  PICKUP_WINDOW_HOURS: 24,
  PICKUP_WINDOW_PERISHABLE_HOURS: 6,
  IDEMPOTENCY_WINDOW_MINUTES: 10,
} as const;

export const SHOP = {
  STATUS: {
    PENDING_REVIEW: 'PENDING_REVIEW',
    APPROVED: 'APPROVED',
    REJECTED: 'REJECTED',
    OPEN: 'OPEN',
    CLOSED: 'CLOSED',
    TEMPORARILY_CLOSED: 'TEMPORARILY_CLOSED',
    SUSPENDED: 'SUSPENDED',
  } as const,
  TIMEZONE_DEFAULT: 'Asia/Kolkata',
  RATING_DEFAULT: 0,
  REVIEW_COUNT_DEFAULT: 0,
  COMPLETION_TOTAL: 10,
  MAX_ACTIVE_ORDERS_DEFAULT: 50,
  BUSINESS_HOURS_DEFAULT: [
    { dayOfWeek: 1, openTime: '09:00', closeTime: '21:00', isClosed: false, sortOrder: 0 },
    { dayOfWeek: 2, openTime: '09:00', closeTime: '21:00', isClosed: false, sortOrder: 0 },
    { dayOfWeek: 3, openTime: '09:00', closeTime: '21:00', isClosed: false, sortOrder: 0 },
    { dayOfWeek: 4, openTime: '09:00', closeTime: '21:00', isClosed: false, sortOrder: 0 },
    { dayOfWeek: 5, openTime: '09:00', closeTime: '21:00', isClosed: false, sortOrder: 0 },
    { dayOfWeek: 6, openTime: '09:00', closeTime: '21:00', isClosed: false, sortOrder: 0 },
    { dayOfWeek: 0, openTime: '10:00', closeTime: '18:00', isClosed: false, sortOrder: 0 },
  ],
} as const;

export const PAYMENT = {
  METHOD: {
    ONLINE: 'ONLINE',
    UPI: 'UPI',
    CARD: 'CARD',
    NETBANKING: 'NETBANKING',
    PAY_AT_STORE: 'PAY_AT_STORE',
    COD: 'COD',
  } as const,
  STATUS: {
    PENDING: 'PENDING',
    CREATED: 'CREATED',
    CAPTURED: 'CAPTURED',
    FAILED: 'FAILED',
    REFUNDED: 'REFUNDED',
  } as const,
  PROVIDER: {
    RAZORPAY: 'razorpay',
  } as const,
  CURRENCY: 'INR',
  RECONCILIATION_INTERVAL_MIN: 15,
} as const;

export const AUTH = {
  JWT_EXPIRY_DAYS: 7,
  JWT_SECRET_MIN_LENGTH: 32,
  BCRYPT_ROUNDS: 12,
  OTP_LENGTH: 6,
  OTP_EXPIRY_MIN: 5,
  OTP_MAX_ATTEMPTS: 3,
  OTP_RESEND_COOLDOWN_SEC: 60,
  PASSWORD_MIN_LENGTH: 6,
} as const;

export const RATE_LIMIT = {
  AUTH: { windowMs: 15 * 60 * 1000, max: 20 },
  OTP: { windowMs: 60 * 1000, max: 3 },
  CHECKOUT: { windowMs: 60 * 1000, max: 5 },
  PAYMENT: { windowMs: 60 * 1000, max: 10 },
  SEARCH: { windowMs: 60 * 1000, max: 30 },
  AI: { windowMs: 60 * 1000, max: 10 },
  UPLOAD: { windowMs: 60 * 1000, max: 10 },
} as const;

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
  SHOPS_LIMIT: 50,
  PRODUCTS_LIMIT: 20,
} as const;

export const FILE_UPLOAD = {
  MAX_SIZE_MB: 5,
  MAX_SIZE_BYTES: 5 * 1024 * 1024,
  ALLOWED_MIMES: ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'],
  ALLOWED_EXTS: ['.jpg', '.jpeg', '.png', '.webp'],
  MAX_DIMENSIONS: { width: 4000, height: 4000 },
  MIN_DIMENSIONS: { width: 10, height: 10 },
} as const;

export const NOTIFICATION = {
  CHANNEL: {
    IN_APP: 'in_app',
    PUSH: 'push',
    EMAIL: 'email',
    SMS: 'sms',
  } as const,
  TYPE: {
    ORDER_PLACED: 'order_placed',
    ORDER_ACCEPTED: 'order_accepted',
    ORDER_REJECTED: 'order_rejected',
    ORDER_PREPARING: 'order_preparing',
    ORDER_READY: 'order_ready',
    ORDER_COMPLETED: 'order_completed',
    ORDER_CANCELLED: 'order_cancelled',
    PAYMENT_RECEIVED: 'payment_received',
    PAYMENT_FAILED: 'payment_failed',
    LOW_STOCK: 'low_stock',
    NEW_ORDER_SHOP: 'new_order_shop',
  } as const,
} as const;

export const PROMOTION = {
  TYPE: {
    PERCENTAGE: 'PERCENTAGE',
    FLAT: 'FLAT',
  } as const,
  MAX_DISCOUNT_PERCENT: 100,
  MIN_ORDER_DEFAULT_PA: 0,
} as const;

export const SEARCH = {
  MIN_QUERY_LENGTH: 2,
  MAX_RESULTS: 50,
  DEBOUNCE_MS: 300,
} as const;

export const UI = {
  TOUCH_TARGET_MIN: 44,
  CONTAINER_MAX: 1280,
  BREAKPOINTS: {
    SM: 640,
    MD: 768,
    LG: 1024,
    XL: 1280,
    XXL: 1536,
  },
  SKELETON_COUNT: 3,
} as const;

export const ERROR_CODES = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  RATE_LIMITED: 'RATE_LIMITED',
  INSUFFICIENT_STOCK: 'INSUFFICIENT_STOCK',
  SHOP_NOT_FOUND: 'SHOP_NOT_FOUND',
  SHOP_PAUSED: 'SHOP_PAUSED',
  SHOP_AT_CAPACITY: 'SHOP_AT_CAPACITY',
  CART_EMPTY: 'CART_EMPTY',
  ORDER_NOT_FOUND: 'ORDER_NOT_FOUND',
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  QR_EXPIRED: 'QR_EXPIRED',
  QR_ALREADY_USED: 'QR_ALREADY_USED',
  INVALID_QR_TOKEN: 'INVALID_QR_TOKEN',
} as const;
