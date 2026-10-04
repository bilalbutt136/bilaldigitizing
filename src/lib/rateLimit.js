import { createAdminClient } from './supabase/admin.js';

/**
 * Local fixed-window limiter retained for deterministic unit tests and as a
 * non-production utility. Production API routes must use checkDistributedRateLimit().
 */
const tracker = new Map();
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanupExpiredEntries() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;

  for (const [key, record] of tracker.entries()) {
    if (now > record.resetTime) tracker.delete(key);
  }
}

export function getClientIp(request) {
  if (!request?.headers) return '127.0.0.1';

  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    const firstIp = forwardedFor.split(',')[0].trim();
    if (firstIp) return firstIp;
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp.trim();

  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  if (cfConnectingIp) return cfConnectingIp.trim();

  return '127.0.0.1';
}

export function checkRateLimit(identifier, maxRequests = 30, windowMs = 60000) {
  cleanupExpiredEntries();

  const now = Date.now();
  const record = tracker.get(identifier);

  if (!record || now > record.resetTime) {
    const newRecord = { count: 1, resetTime: now + windowMs };
    tracker.set(identifier, newRecord);
    return {
      success: true,
      limit: maxRequests,
      remaining: Math.max(0, maxRequests - 1),
      reset: Math.ceil(newRecord.resetTime / 1000),
      retryAfter: 0,
      unavailable: false
    };
  }

  record.count += 1;
  const remaining = Math.max(0, maxRequests - record.count);
  const reset = Math.ceil(record.resetTime / 1000);
  const retryAfter = Math.max(1, Math.ceil((record.resetTime - now) / 1000));

  return {
    success: record.count <= maxRequests,
    limit: maxRequests,
    remaining,
    reset,
    retryAfter: record.count > maxRequests ? retryAfter : 0,
    unavailable: false
  };
}

const distributedLocalCache = new Map();
const DISTRIBUTED_CACHE_MAX_AGE_MS = 10_000;

/**
 * Atomic, deployment-wide rate limiting backed by Supabase/Postgres.
 * This prevents bypassing limits by hopping between Vercel serverless instances.
 * It fails closed when the shared limiter is unavailable.
 */
export async function checkDistributedRateLimit(identifier, maxRequests = 30, windowMs = 60000) {
  const safeIdentifier = String(identifier || '').trim().slice(0, 512);
  const limit = Math.max(1, Math.min(Number(maxRequests) || 30, 10000));
  const window = Math.max(1000, Math.min(Number(windowMs) || 60000, 24 * 60 * 60 * 1000));

  if (!safeIdentifier) {
    return {
      success: false,
      unavailable: true,
      limit,
      remaining: 0,
      reset: Math.ceil((Date.now() + 5000) / 1000),
      retryAfter: 5
    };
  }

  const now = Date.now();
  const cached = distributedLocalCache.get(safeIdentifier);
  if (cached && cached.expiresAt > now) {
    if (cached.blocked) {
      return {
        success: false,
        unavailable: false,
        limit,
        remaining: 0,
        reset: cached.reset,
        retryAfter: Math.max(1, Math.ceil((cached.expiresAt - now) / 1000))
      };
    }
    if (cached.remaining > 2) {
      cached.remaining -= 1;
      return {
        success: true,
        unavailable: false,
        limit,
        remaining: cached.remaining,
        reset: cached.reset,
        retryAfter: 0
      };
    }
  }

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.rpc('consume_rate_limit', {
      p_identifier: safeIdentifier,
      p_max_requests: limit,
      p_window_ms: window
    });

    if (error) throw error;

    const row = Array.isArray(data) ? data[0] : data;
    if (!row || typeof row.allowed !== 'boolean') {
      throw new Error('Shared rate limiter returned an invalid response.');
    }

    const resetEpoch = Number(row.reset_epoch) || Math.ceil((now + window) / 1000);
    const retryAfter = Math.max(0, Number(row.retry_after) || 0);
    const remaining = Math.max(0, Number(row.remaining) || 0);

    if (row.allowed) {
      const windowExpiry = resetEpoch * 1000;
      distributedLocalCache.set(safeIdentifier, {
        blocked: false,
        remaining,
        reset: resetEpoch,
        expiresAt: Math.min(now + DISTRIBUTED_CACHE_MAX_AGE_MS, windowExpiry)
      });
    } else {
      const retryMs = (retryAfter > 0 ? retryAfter : 5) * 1000;
      distributedLocalCache.set(safeIdentifier, {
        blocked: true,
        remaining: 0,
        reset: resetEpoch,
        expiresAt: now + retryMs
      });
    }

    if (distributedLocalCache.size > 1000) {
      for (const [k, v] of distributedLocalCache.entries()) {
        if (now > v.expiresAt) distributedLocalCache.delete(k);
      }
    }

    return {
      success: row.allowed,
      unavailable: false,
      limit,
      remaining,
      reset: resetEpoch,
      retryAfter
    };
  } catch (error) {
    console.error('[rateLimit] Shared limiter unavailable:', error?.message || error);
    return {
      success: false,
      unavailable: true,
      limit,
      remaining: 0,
      reset: Math.ceil((Date.now() + 5000) / 1000),
      retryAfter: 5
    };
  }
}

export function getRateLimitHeaders(rateLimitResult) {
  const headers = {
    'X-RateLimit-Limit': String(rateLimitResult.limit),
    'X-RateLimit-Remaining': String(rateLimitResult.remaining),
    'X-RateLimit-Reset': String(rateLimitResult.reset)
  };

  if (!rateLimitResult.success && rateLimitResult.retryAfter > 0) {
    headers['Retry-After'] = String(rateLimitResult.retryAfter);
  }

  if (rateLimitResult.unavailable) {
    headers['Cache-Control'] = 'no-store';
  }

  return headers;
}
