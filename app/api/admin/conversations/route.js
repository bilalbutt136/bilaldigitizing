import { NextResponse } from 'next/server';
import { createAdminClient } from '../../../../src/lib/supabase/admin';
import { getServerAuthUser } from '../../../../src/lib/supabase/serverAuth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0',
  'CDN-Cache-Control': 'no-store',
  'Vercel-CDN-Cache-Control': 'no-store',
  'Pragma': 'no-cache',
  'Expires': '0'
};

export async function GET(request) {
  try {
    const { user, isAdmin } = await getServerAuthUser(request);
    if (!user || !isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Access denied. Administrator privileges required.' },
        { status: 403, headers: NO_CACHE_HEADERS }
      );
    }

    const { searchParams } = new URL(request.url);
    const typeParam = (searchParams.get('type') || searchParams.get('channel') || 'inbox').toLowerCase().trim();
    const isSupportRequested = typeParam === 'support';

    // Delegate to the authoritative messages endpoint with the strict channel filter
    const url = new URL(request.url);
    url.pathname = '/api/messages';
    url.searchParams.set('action', 'fetchConversations');
    url.searchParams.set('channel', isSupportRequested ? 'support' : 'inbox');
    url.searchParams.set('type', isSupportRequested ? 'support' : 'inbox');

    const headers = new Headers(request.headers);
    headers.set('Cache-Control', 'no-cache');

    const response = await fetch(url.toString(), {
      headers,
      cache: 'no-store'
    });

    const data = await response.json();
    const list = isSupportRequested ? (data.supportConversations || data.conversations || []) : (data.inboxConversations || data.conversations || []);

    return NextResponse.json({
      success: true,
      type: isSupportRequested ? 'support' : 'inbox',
      conversations: list,
      inboxConversations: data.inboxConversations || [],
      supportConversations: data.supportConversations || []
    }, { headers: NO_CACHE_HEADERS });
  } catch (err) {
    console.error('[Admin Conversations API error]:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500, headers: NO_CACHE_HEADERS });
  }
}
