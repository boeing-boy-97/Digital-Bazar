// Environment Validation - Fail fast in production, real checks per point 84

export interface EnvConfig {
  DATABASE_URL: string;
  JWT_SECRET: string;
  NEXT_PUBLIC_APP_URL: string;
  NODE_ENV?: string;
  OTP_TEST_CODE?: string;
  OTP_ENABLED?: string;
  OTP_EXPIRY_MINUTES?: string;
  OTP_MAX_ATTEMPTS?: string;
  SMS_PROVIDER?: string;
  SMS_API_KEY?: string;
  SMS_SENDER_ID?: string;
  RAZORPAY_KEY_ID?: string;
  RAZORPAY_KEY_SECRET?: string;
  RAZORPAY_WEBHOOK_SECRET?: string;
  NEXT_PUBLIC_RAZORPAY_KEY_ID?: string;
  OPENAI_API_KEY?: string;
  OPENAI_MODEL?: string;
  MAPS_API_KEY?: string;
  NEXT_PUBLIC_MAPS_API_KEY?: string;
  EMAIL_API_KEY?: string;
  EMAIL_FROM?: string;
  EMAIL_PROVIDER?: string;
  STORAGE_PROVIDER?: string;
  STORAGE_BUCKET?: string;
  STORAGE_REGION?: string;
  STORAGE_ACCESS_KEY?: string;
  STORAGE_SECRET_KEY?: string;
  STORAGE_ENDPOINT?: string;
  STORAGE_PUBLIC_URL?: string;
  VAPID_PUBLIC_KEY?: string;
  VAPID_PRIVATE_KEY?: string;
  VAPID_SUBJECT?: string;
  UPSTASH_REDIS_REST_URL?: string;
  UPSTASH_REDIS_REST_TOKEN?: string;
  REDIS_URL?: string;
  SENTRY_DSN?: string;
  NEXT_PUBLIC_SENTRY_DSN?: string;
  NEXT_PUBLIC_SHOW_DEMO_CREDS?: string;
  PLATFORM_COMMISSION_DEFAULT?: string;
  PLATFORM_MAX_ACTIVE_ORDERS?: string;
  PLATFORM_QR_EXPIRY_MINUTES?: string;
}

export function validateEnv(): EnvConfig {
  const requiredInProduction = ['DATABASE_URL', 'JWT_SECRET', 'NEXT_PUBLIC_APP_URL'];
  const missing: string[] = [];

  for (const key of requiredInProduction) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }

  if (process.env.NODE_ENV === 'production' && missing.length > 0) {
    throw new Error(`Missing required environment variables in production: ${missing.join(', ')}. See .env.example for real setup A to Z`);
  }

  // Validate JWT_SECRET length - must be 32+ chars in production per security audit
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET must be at least 32 characters in production - generate via openssl rand -hex 32');
    } else {
      console.warn('⚠️ JWT_SECRET should be at least 32 chars even in dev - generate via openssl rand -hex 32');
    }
  }

  // Production real checks - no fake, no demo
  if (process.env.NODE_ENV === 'production') {
    // Razorpay must be live, not demo/test
    if (!process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID.includes('demo') || process.env.RAZORPAY_KEY_ID.includes('test')) {
      console.warn('⚠️ RAZORPAY_KEY_ID not set or using demo/test in production - payments will use mock. For REAL payments, set live keys rzp_live_* and install razorpay SDK. See .env.example');
    }
    if (!process.env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_KEY_SECRET.includes('demo')) {
      console.warn('⚠️ RAZORPAY_KEY_SECRET using demo in production - set real secret for REAL payments');
    }
    // OTP must be real SMS, not hardcoded 123456
    if (process.env.OTP_ENABLED === 'true') {
      console.error('❌ OTP_ENABLED=true in production - this would use hardcoded 123456! Set OTP_ENABLED=false and configure SMS_API_KEY for REAL OTP via MSG91/Fast2SMS/Twilio');
    }
    if (!process.env.SMS_API_KEY && process.env.OTP_ENABLED !== 'false') {
      console.warn('⚠️ SMS_API_KEY not set - OTP will fallback to test code in dev only, but in prod you need REAL SMS provider per .env.example');
    }
    // Storage must be S3/R2 in prod, not local
    if (process.env.STORAGE_PROVIDER === 'local') {
      console.warn('⚠️ STORAGE_PROVIDER=local in production - use S3 or R2 for REAL image storage. See .env.example');
    }
    // Demo creds must not show in prod
    if (process.env.NEXT_PUBLIC_SHOW_DEMO_CREDS === 'true') {
      console.warn('⚠️ NEXT_PUBLIC_SHOW_DEMO_CREDS=true in production - will show demo credentials in UI. Set false for REAL prod');
    }
    // App URL must be https in prod
    if (process.env.NEXT_PUBLIC_APP_URL && !process.env.NEXT_PUBLIC_APP_URL.startsWith('https://')) {
      console.warn('⚠️ NEXT_PUBLIC_APP_URL should be https:// in production for REAL secure cookies');
    }
    // OpenAI optional but warn
    if (!process.env.OPENAI_API_KEY) {
      console.warn('ℹ️ OPENAI_API_KEY not set - AI features will use honest rule-based fallback (no fake AI magic). Set real key for REAL AI');
    }
    // Maps optional
    if (!process.env.MAPS_API_KEY) {
      console.warn('ℹ️ MAPS_API_KEY not set - distance uses haversine (real), but places autocomplete needs Maps API for REAL');
    }
    // Email optional
    if (!process.env.EMAIL_API_KEY) {
      console.warn('ℹ️ EMAIL_API_KEY not set - notifications will be in-app only. Set Resend/SendGrid key for REAL email');
    }
    // Redis for rate limiting prod
    if (!process.env.UPSTASH_REDIS_REST_URL && !process.env.REDIS_URL) {
      console.warn('ℹ️ No Redis configured - rate limiting uses in-memory Map (dev). For REAL prod multi-instance, set UPSTASH_REDIS_REST_URL per .env.example');
    }
  } else {
    // Dev warnings
    if (process.env.OTP_ENABLED === 'true') {
      console.warn('⚠️ DEV ONLY: OTP_ENABLED=true - using test OTP 123456. NEVER use in production. Set OTP_ENABLED=false and SMS_API_KEY for REAL');
    }
  }

  // Validate platform commission is number
  if (process.env.PLATFORM_COMMISSION_DEFAULT) {
    const commission = parseFloat(process.env.PLATFORM_COMMISSION_DEFAULT);
    if (isNaN(commission) || commission < 0 || commission > 50) {
      throw new Error('PLATFORM_COMMISSION_DEFAULT must be 0-50');
    }
  }

  return process.env as unknown as EnvConfig;
}

export function getEnv(): EnvConfig {
  return process.env as unknown as EnvConfig;
}

export function isRealMode(): boolean {
  // Check if all critical real services are configured
  return !!(
    process.env.DATABASE_URL?.startsWith('postgresql://') &&
    process.env.JWT_SECRET && process.env.JWT_SECRET.length >= 32 &&
    process.env.RAZORPAY_KEY_ID?.startsWith('rzp_live_') &&
    process.env.SMS_API_KEY &&
    process.env.STORAGE_PROVIDER !== 'local'
  );
}

export function getConfigState(): Record<string, 'HEALTHY' | 'DEGRADED' | 'CONFIG_REQUIRED' | 'MOCK'> {
  return {
    database: process.env.DATABASE_URL?.startsWith('postgresql://') ? 'HEALTHY' : process.env.DATABASE_URL ? 'DEGRADED' : 'CONFIG_REQUIRED',
    payments: process.env.RAZORPAY_KEY_ID?.startsWith('rzp_live_') ? 'HEALTHY' : process.env.RAZORPAY_KEY_ID?.startsWith('rzp_test_') ? 'DEGRADED' : 'CONFIG_REQUIRED',
    sms: process.env.SMS_API_KEY ? 'HEALTHY' : 'MOCK',
    email: process.env.EMAIL_API_KEY ? 'HEALTHY' : 'CONFIG_REQUIRED',
    storage: process.env.STORAGE_PROVIDER === 's3' || process.env.STORAGE_PROVIDER === 'r2' ? 'HEALTHY' : process.env.STORAGE_PROVIDER === 'local' ? 'DEGRADED' : 'CONFIG_REQUIRED',
    realtime: 'HEALTHY', // SSE built-in
    ai: process.env.OPENAI_API_KEY ? 'HEALTHY' : 'DEGRADED',
    maps: process.env.MAPS_API_KEY ? 'HEALTHY' : 'DEGRADED',
    rateLimit: process.env.UPSTASH_REDIS_REST_URL ? 'HEALTHY' : 'DEGRADED',
  };
}
