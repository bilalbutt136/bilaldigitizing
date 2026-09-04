/**
 * Production-ready In-Memory Rate Limiter
 * Zero-dependency sliding window rate limiter for Next.js App Router.
 */

const tracker = new Map();

// Periodic cleanup of expired rate limit buckets every 5 minutes
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanupExpiredEntries() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;

  for (const [key, record] of tracker.entries()) {
    if (now > record.resetTime) {
      tracker.delete(key);
    }
  }
}

/**
 * Extracts client IP safely from Next.js request headers
 * @param {Request} request
 * @returns {string}
 */
export function getClientIp(request) {
  if (!request || !request.headers) return '127.0.0.1';

  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    // x-forwarded-for can be a comma-separated list; first IP is the client
    const firstIp = forwardedFor.split(',')[0].trim();
    if (firstIp) return firstIp;
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp.trim();

  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  if (cfConnectingIp) return cfConnectingIp.trim();

  return '127.0.0.1';
}

/**
 * Checks rate limit for an identifier (e.g. IP + route identifier)
 * @param {string} identifier - Unique client identifier (e.g., `${ip}:${route}`)
 * @param {number} maxRequests - Maximum requests allowed in the window
 * @param {number} windowMs - Window duration in milliseconds (default 60s)
 * @returns {{ success: boolean, limit: number, remaining: number, reset: number, retryAfter: number }}
 */
export function checkRateLimit(identifier, maxRequests = 30, windowMs = 60000) {
  cleanupExpiredEntries();

  const now = Date.now();
  const record = tracker.get(identifier);

  if (!record || now > record.resetTime) {
    const newRecord = {
      count: 1,
      resetTime: now + windowMs,
    };
    tracker.set(identifier, newRecord);
    return {
      success: true,
      limit: maxRequests,
      remaining: Math.max(0, maxRequests - 1),
      reset: Math.ceil((now + windowMs) / 1000),
      retryAfter: 0,
    };
  }

  record.count += 1;
  const remaining = Math.max(0, maxRequests - record.count);
  const reset = Math.ceil(record.resetTime / 1000);
  const retryAfter = Math.max(1, Math.ceil((record.resetTime - now) / 1000));

  if (record.count > maxRequests) {
    return {
      success: false,
      limit: maxRequests,
      remaining: 0,
      reset,
      retryAfter,
    };
  }

  return {
    success: true,
    limit: maxRequests,
    remaining,
    reset,
    retryAfter: 0,
  };
}

/**
 * Standard HTTP rate limit response headers helper
 * @param {{ limit: number, remaining: number, reset: number, retryAfter: number }} rateLimitResult
 * @returns {Record<string, string>}
 */
export function getRateLimitHeaders(rateLimitResult) {
  const headers = {
    'X-RateLimit-Limit': String(rateLimitResult.limit),
    'X-RateLimit-Remaining': String(rateLimitResult.remaining),
    'X-RateLimit-Reset': String(rateLimitResult.reset),
  };
  if (!rateLimitResult.success && rateLimitResult.retryAfter > 0) {
    headers['Retry-After'] = String(rateLimitResult.retryAfter);
  }
  return headers;
}
