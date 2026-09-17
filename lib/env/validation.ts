// Environment Validation - Fail fast in production

export interface EnvConfig {
  DATABASE_URL: string;
  JWT_SECRET: string;
  NEXT_PUBLIC_APP_URL: string;
  OTP_TEST_CODE?: string;
  OTP_ENABLED?: string;
  RAZORPAY_KEY_ID?: string;
  RAZORPAY_KEY_SECRET?: string;
  RAZORPAY_WEBHOOK_SECRET?: string;
  NEXT_PUBLIC_RAZORPAY_KEY_ID?: string;
  OPENAI_API_KEY?: string;
  OPENAI_MODEL?: string;
  MAPS_API_KEY?: string;
  NEXT_PUBLIC_MAPS_API_KEY?: string;
  EMAIL_API_KEY?: string;
  SMS_API_KEY?: string;
  STORAGE_PROVIDER?: string;
  VAPID_PUBLIC_KEY?: string;
  VAPID_PRIVATE_KEY?: string;
}

export function validateEnv(): EnvConfig {
  const requiredInProduction = ['DATABASE_URL', 'JWT_SECRET'];
  const missing: string[] = [];

  for (const key of requiredInProduction) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }

  if (process.env.NODE_ENV === 'production' && missing.length > 0) {
    throw new Error(`Missing required environment variables in production: ${missing.join(', ')}. See .env.example`);
  }

  // Validate JWT_SECRET length
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET must be at least 32 characters in production');
    } else {
      console.warn('⚠️ JWT_SECRET should be at least 32 chars even in dev');
    }
  }

  // Warn about missing optional but important
  if (process.env.NODE_ENV === 'production') {
    if (!process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID.includes('demo')) {
      console.warn('⚠️ RAZORPAY_KEY_ID not set or using demo in production - payments will use mock');
    }
    if (!process.env.OPENAI_API_KEY) {
      console.warn('⚠️ OPENAI_API_KEY not set - AI features will use fallback rule-based');
    }
  }

  return process.env as unknown as EnvConfig;
}

export function getEnv(): EnvConfig {
  return process.env as unknown as EnvConfig;
}
