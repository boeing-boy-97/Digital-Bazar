// Simple In-Memory Rate Limiting - Production should use Redis/Upstash

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

export interface RateLimitConfig {
  windowMs: number; // window in ms
  max: number; // max requests per window
}

export const rateLimitConfigs: Record<string, RateLimitConfig> = {
  auth: { windowMs: 15 * 60 * 1000, max: 20 }, // 20 per 15 min
  otp: { windowMs: 60 * 1000, max: 3 }, // 3 per minute
  ai: { windowMs: 60 * 1000, max: 10 }, // 10 per minute
  search: { windowMs: 60 * 1000, max: 30 },
  checkout: { windowMs: 60 * 1000, max: 5 },
  payment: { windowMs: 60 * 1000, max: 10 },
  upload: { windowMs: 60 * 1000, max: 10 },
};

export function checkRateLimit(key: string, config: RateLimitConfig): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    // New window
    store.set(key, { count: 1, resetAt: now + config.windowMs });
    return { allowed: true, remaining: config.max - 1, resetAt: now + config.windowMs };
  }

  if (entry.count >= config.max) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count++;
  store.set(key, entry);
  return { allowed: true, remaining: config.max - entry.count, resetAt: entry.resetAt };
}

export function rateLimitMiddleware(request: Request, type: keyof typeof rateLimitConfigs): { allowed: boolean; headers: Record<string, string> } {
  const ip = (request as any).ip || (request.headers as any).get?.('x-forwarded-for') || 'unknown';
  const key = `${type}:${ip}`;
  const config = rateLimitConfigs[type];
  const result = checkRateLimit(key, config);

  const headers = {
    'X-RateLimit-Limit': config.max.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': new Date(result.resetAt).toISOString(),
  };

  if (!result.allowed) {
    console.warn(`[RateLimit] Blocked ${type} for ${ip}`);
  }

  return { allowed: result.allowed, headers };
}

// Cleanup old entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (now > entry.resetAt) {
      store.delete(key);
    }
  }
}, 10 * 60 * 1000);
