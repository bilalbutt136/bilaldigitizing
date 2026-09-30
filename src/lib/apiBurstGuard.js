import { NextResponse } from 'next/server';
import { checkRateLimit, getClientIp, getRateLimitHeaders } from './rateLimit.js';

/**
 * Cheap per-instance burst protection for read-heavy endpoints.
 *
 * This is not an authorization/security boundary and intentionally avoids a
 * database RPC. Its job is to stop accidental render loops or runaway clients
 * before they perform expensive auth/database work on a warm Vercel instance.
 */
export function enforceApiBurstLimit(request, scope, maxRequests = 120, windowMs = 60_000) {
  const ip = getClientIp(request);
  const result = checkRateLimit(`burst:${scope}:${ip}`, maxRequests, windowMs);
  if (result.success) return null;

  return NextResponse.json(
    { error: 'Too many requests. Please retry shortly.' },
    { status: 429, headers: getRateLimitHeaders(result) }
  );
}
