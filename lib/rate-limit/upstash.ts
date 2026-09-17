// Rate Limiting - REAL Upstash Redis for Prod, Memory for Dev
// Dev: in-memory Map (single instance)
// Prod: Upstash Redis REST API (multi-instance, persists)

import { checkRateLimit as checkMemory, rateLimitConfigs } from './simple';

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  provider: string;
}

export async function checkRateLimitReal(key: string, type: keyof typeof rateLimitConfigs): Promise<RateLimitResult> {
  const provider = process.env.RATE_LIMIT_PROVIDER || 'memory';
  const config = rateLimitConfigs[type];

  if (provider === 'memory' || !process.env.UPSTASH_REDIS_REST_URL) {
    if (process.env.NODE_ENV === 'production') {
      console.warn('[RATE_LIMIT] Using MEMORY in production - not shared across instances. Set UPSTASH_REDIS_REST_URL for REAL prod per .env.example');
    }
    const result = checkMemory(key, config);
    return { ...result, provider: 'memory' };
  }

  // Upstash Redis REST
  try {
    const url = process.env.UPSTASH_REDIS_REST_URL!;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN!;

    // Use Upstash REST API for atomic increment with expiry
    // Key: ratelimit:{type}:{ip} -> count
    const redisKey = `ratelimit:${type}:${key}`;
    
    // INCR
    const incrRes = await fetch(`${url}/incr/${redisKey}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const incrData = await incrRes.json();
    const count = incrData.result as number;

    // If first time, set expiry
    if (count === 1) {
      await fetch(`${url}/expire/${redisKey}/${Math.ceil(config.windowMs / 1000)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
    }

    // Get TTL for resetAt
    const ttlRes = await fetch(`${url}/ttl/${redisKey}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const ttlData = await ttlRes.json();
    const ttlSeconds = ttlData.result as number;
    const resetAt = Date.now() + (ttlSeconds > 0 ? ttlSeconds * 1000 : config.windowMs);

    const allowed = count <= config.max;
    const remaining = Math.max(0, config.max - count);

    if (!allowed) {
      console.warn(`[RATE_LIMIT] Blocked ${type} for ${key} count ${count}/${config.max} via upstash`);
    }

    return { allowed, remaining, resetAt, provider: 'upstash' };
  } catch (e: any) {
    console.error(`[RATE_LIMIT] Upstash failed, falling back to memory: ${e.message}`);
    const result = checkMemory(key, config);
    return { ...result, provider: 'memory_fallback' };
  }
}

export function getRateLimitConfigState() {
  const provider = process.env.RATE_LIMIT_PROVIDER || 'memory';
  const url = process.env.UPSTASH_REDIS_REST_URL;
  if (provider === 'memory' || !url) {
    return {
      mode: 'memory',
      healthy: process.env.NODE_ENV !== 'production',
      message: process.env.NODE_ENV === 'production'
        ? 'MOCK memory rate limiting in prod - not shared, use Upstash per .env.example for REAL'
        : 'Memory rate limiting for dev - OK'
    };
  }
  return { mode: 'upstash', healthy: true, message: `REAL rate limiting via Upstash Redis` };
}
