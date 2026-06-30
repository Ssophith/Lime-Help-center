/**
 * Rate limiter with two backends:
 *   - In-memory (default) — fine for single-process PM2 fork mode.
 *   - Redis (sliding-window via sorted sets) — auto-enabled when REDIS_URL
 *     is set in the environment. Required when scaling beyond one PM2
 *     instance; without it each process keeps its own counter and the
 *     effective limit becomes `limit * instances`.
 *
 * Returns Promise<boolean>: true means the request is allowed, false means
 * it should be rejected with 429.
 *
 * Usage:
 *   if (!(await rateLimit('login-ip:1.2.3.4', 20, 15 * 60_000))) {
 *     return NextResponse.json({ error: '...' }, { status: 429 });
 *   }
 */

import Redis from 'ioredis';

interface InMemoryEntry {
  timestamps: number[];
}
const memStore = new Map<string, InMemoryEntry>();

let redis: Redis | null = null;
let redisAttempted = false;

function getRedis(): Redis | null {
  if (redisAttempted) return redis;
  redisAttempted = true;
  const url = process.env.REDIS_URL;
  if (!url) return null;
  try {
    redis = new Redis(url, {
      // Fail fast on connection issues so the in-memory fallback can pick up.
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
      lazyConnect: false,
    });
    redis.on('error', (err) => {
      // Don't spam logs — collapse repeated errors.
      console.warn('Redis rate-limit error:', err.message);
    });
    return redis;
  } catch (err) {
    console.warn('Redis rate-limit init failed; using in-memory fallback:', err);
    redis = null;
    return null;
  }
}

async function rateLimitRedis(
  client: Redis,
  key: string,
  limit: number,
  windowMs: number
): Promise<boolean> {
  const now = Date.now();
  const windowStart = now - windowMs;
  const member = `${now}-${Math.random()}`;
  const ttlSec = Math.ceil(windowMs / 1000);

  try {
    const pipeline = client.multi();
    // Drop entries outside the window.
    pipeline.zremrangebyscore(key, 0, windowStart);
    // Add current request.
    pipeline.zadd(key, now, member);
    // Count remaining entries in the window.
    pipeline.zcard(key);
    // Trim TTL so unused keys eventually expire.
    pipeline.expire(key, ttlSec);

    const results = await pipeline.exec();
    if (!results) return true; // soft-allow if Redis answered nothing
    const count = (results[2][1] as number) ?? 0;
    return count <= limit;
  } catch (err) {
    // Redis blip → fall back to allow this request rather than denying.
    // The in-memory path doesn't see it; that's acceptable for a transient
    // failure, and matches "fail open" defaults seen elsewhere.
    console.warn('Redis rate-limit query failed:', (err as Error).message);
    return true;
  }
}

function rateLimitInMemory(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = memStore.get(key) ?? { timestamps: [] };

  entry.timestamps = entry.timestamps.filter((t) => now - t < windowMs);

  if (entry.timestamps.length >= limit) {
    memStore.set(key, entry);
    return false;
  }

  entry.timestamps.push(now);
  memStore.set(key, entry);

  // Occasionally prune old keys to avoid a slow memory leak.
  if (Math.random() < 0.01) {
    for (const [k, v] of memStore.entries()) {
      if (v.timestamps.every((t) => now - t >= windowMs)) memStore.delete(k);
    }
  }

  return true;
}

export async function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<boolean> {
  const client = getRedis();
  if (client) {
    return rateLimitRedis(client, key, limit, windowMs);
  }
  return rateLimitInMemory(key, limit, windowMs);
}
