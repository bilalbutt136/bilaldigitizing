import { NextResponse } from 'next/server';
import { withApiObservability } from '../../../../src/lib/observability/apiObservability.js';
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
const UNREAD_CACHE_TTL_MS = 15_000;

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
  if (cached && cached.expiresAt > now) {
    return NextResponse.json(cached.data, {
      headers: {
        ...getRateLimitHeaders(burst),
        'Cache-Control': 'private, max-age=30, stale-while-revalidate=60'
      }
    });
  }

  try {
    const supabase = createAdminClient();
    let query = supabase
      .from('conversations')
      .select('id, tags, order_title, unread_admin_count, unread_client_count');

    if (isAdmin) {
      query = query.gt('unread_admin_count', 0);
    } else {
      query = query
        .ilike('client_email', user.email.toLowerCase().trim())
        .gt('unread_client_count', 0);
    }

    const { data, error } = await query;
    if (error) {
      console.warn('[Chat Unread Counts] Query error:', error.message);
      return NextResponse.json({ error: 'Unable to load unread counts.' }, { status: 500 });
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

    const resultData = { inbox, support, total: inbox + support };
    unreadMemoryCache.set(userKey, {
      data: resultData,
      expiresAt: now + UNREAD_CACHE_TTL_MS
    });

    if (unreadMemoryCache.size > 200) {
      for (const [k, v] of unreadMemoryCache.entries()) {
        if (now > v.expiresAt) unreadMemoryCache.delete(k);
      }
    }

    return NextResponse.json(
      resultData,
      {
        headers: {
          ...getRateLimitHeaders(burst),
          'Cache-Control': 'private, max-age=30, stale-while-revalidate=60'
        }
      }
    );
  } catch (error) {
    console.error('[Chat Unread Counts] Unexpected error:', error);
    return NextResponse.json({ error: 'Unable to load unread counts.' }, { status: 500 });
  }
}

export const GET = withApiObservability(GET_impl);
