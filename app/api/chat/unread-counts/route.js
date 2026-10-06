import { NextResponse, after } from 'next/server';
import { withApiObservability, logServerCaughtError } from '../../../../src/lib/observability/apiObservability.js';
import { createAdminClient } from '../../../../src/lib/supabase/admin';
import { getServerAuthUser } from '../../../../src/lib/supabase/serverAuth';
import { checkRateLimit, getClientIp, getRateLimitHeaders } from '../../../../src/lib/rateLimit.js';

export const dynamic = 'force-dynamic';

function isSupportConversation(conversation) {
  const id = String(conversation?.id || '');
  const title = String(conversation?.order_title || '').toLowerCase();
  const tags = Array.isArray(conversation?.tags) ? conversation.tags : [];
  return id.startsWith('support-') ||
    id === 'general-support' ||
    id === 'help-support' ||
    tags.includes('support') ||
    title.includes('support');
}

const unreadMemoryCache = new Map();
const inFlightUnreadQueries = new Map();
const UNREAD_FRESH_TTL_MS = 20_000; // 20 seconds fresh in-memory TTL
const UNREAD_STALE_TTL_MS = 60_000; // 60 seconds stale-while-revalidate window

async function fetchUnreadCountsFromDb(email, isAdmin) {
  const supabase = createAdminClient();
  const cleanEmail = String(email || '').toLowerCase().trim();

  // Select only strictly required columns instead of wide table projections
  let query = supabase
    .from('conversations')
    .select(isAdmin ? 'id, tags, order_title, unread_admin_count' : 'id, tags, order_title, unread_client_count');

  query = query.or('is_archived.is.null,is_archived.eq.false');

  if (isAdmin) {
    query = query.gt('unread_admin_count', 0);
  } else {
    // Utilize index scan on client_email with fallback for case tolerance
    query = query
      .or(`client_email.eq.${cleanEmail},client_email.ilike.${cleanEmail}`)
      .gt('unread_client_count', 0);
  }

  const { data, error } = await query;
  if (error) {
    console.warn('[Chat Unread Counts] Query error:', error.message);
    throw error;
  }

  let inbox = 0;
  let support = 0;
  for (const conversation of data || []) {
    const count = Number(
      isAdmin ? conversation.unread_admin_count : conversation.unread_client_count
    ) || 0;
    if (isSupportConversation(conversation)) support += count;
    else inbox += count;
  }

  return { inbox, support, total: inbox + support };
}

async function getOrRevalidateUnreadCounts(userKey, email, isAdmin, { background = false } = {}) {
  if (inFlightUnreadQueries.has(userKey)) {
    return inFlightUnreadQueries.get(userKey);
  }

  const promise = (async () => {
    try {
      const counts = await fetchUnreadCountsFromDb(email, isAdmin);
      const now = Date.now();
      unreadMemoryCache.set(userKey, {
        data: counts,
        freshUntil: now + UNREAD_FRESH_TTL_MS,
        staleUntil: now + UNREAD_STALE_TTL_MS,
        expiresAt: now + UNREAD_FRESH_TTL_MS
      });

      if (unreadMemoryCache.size > 200) {
        for (const [k, v] of unreadMemoryCache.entries()) {
          if (now > v.staleUntil) unreadMemoryCache.delete(k);
        }
      }

      return counts;
    } catch (err) {
      if (background) {
        logServerCaughtError(err, { operation: 'chat_unread.background_revalidate' });
      } else {
        throw err;
      }
    } finally {
      inFlightUnreadQueries.delete(userKey);
    }
  })();

  inFlightUnreadQueries.set(userKey, promise);
  return promise;
}

async function GET_impl(request) {
  const burst = checkRateLimit(`chat-unread:${getClientIp(request)}`, 12, 60_000);
  if (!burst.success) {
    return NextResponse.json(
      { error: 'Too many unread-count requests.' },
      { status: 429, headers: getRateLimitHeaders(burst) }
    );
  }

  const { user, isAdmin } = await getServerAuthUser(request);
  if (!user?.email) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  const userKey = isAdmin ? 'admin' : user.email.toLowerCase().trim();
  const cached = unreadMemoryCache.get(userKey);
  const now = Date.now();

  const cacheHeaders = {
    ...getRateLimitHeaders(burst),
    'Cache-Control': 'private, max-age=20, stale-while-revalidate=60'
  };

  // 1. Fresh cache hit: return immediately (<1ms)
  if (cached && (cached.freshUntil || cached.expiresAt) > now) {
    return NextResponse.json(cached.data, { headers: cacheHeaders });
  }

  // 2. Stale cache hit: return stale data immediately and revalidate asynchronously
  if (cached && (cached.staleUntil || 0) > now) {
    const dispatchBg = typeof after === 'function'
      ? after
      : (fn) => { fn().catch((err) => { logServerCaughtError(err, { operation: 'chat_unread.bg_dispatch_failed' }); }); };

    dispatchBg(async () => {
      await getOrRevalidateUnreadCounts(userKey, user.email, isAdmin, { background: true });
    });

    return NextResponse.json(cached.data, { headers: cacheHeaders });
  }

  // 3. Cache miss or expired: fetch synchronously and cache
  try {
    const counts = await getOrRevalidateUnreadCounts(userKey, user.email, isAdmin);
    return NextResponse.json(counts, { headers: cacheHeaders });
  } catch (error) {
    console.error('[Chat Unread Counts] Unexpected error:', error);
    return NextResponse.json({ error: 'Unable to load unread counts.' }, { status: 500 });
  }
}

export const GET = withApiObservability(GET_impl);
