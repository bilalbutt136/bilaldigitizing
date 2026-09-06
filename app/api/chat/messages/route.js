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
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'inbox';
    const emailParam = (searchParams.get('email') || '').toLowerCase().trim();
    const userIdParam = searchParams.get('userId') || '';
    const conversationId = searchParams.get('conversationId') || '';
    const limit = Math.min(parseInt(searchParams.get('limit') || '100', 10), 500);

    const { user, isAdmin, isWorker } = await getServerAuthUser(request);
    const supabase = createAdminClient();

    const cleanUserEmail = isAdmin 
      ? emailParam || (user?.email ? user.email.toLowerCase().trim() : '')
      : (user?.email ? user.email.toLowerCase().trim() : emailParam);

    // ─────────────────────────────────────────────────────────────
    // 1. INBOX LIST ACTION
    // ─────────────────────────────────────────────────────────────
    if (action === 'inbox') {
      let conversations = [];

      if (isAdmin) {
        // Admin sees all studio conversations sorted by latest activity
        const { data: convs, error: convErr } = await supabase
          .from('conversations')
          .select('id, title, type, order_id, metadata, last_message_preview, last_message_at, created_at, updated_at')
          .order('last_message_at', { ascending: false })
          .limit(100);

        if (convErr) throw convErr;

        // Fetch participants for unread badges and customer metadata
        const convIds = (convs || []).map(c => c.id);
        let participantsByConv = new Map();

        if (convIds.length > 0) {
          const { data: participants } = await supabase
            .from('conversation_participants')
            .select('conversation_id, user_id, user_email, user_name, role, unread_count, last_read_at')
            .in('conversation_id', convIds);

          (participants || []).forEach(p => {
            if (!participantsByConv.has(p.conversation_id)) {
              participantsByConv.set(p.conversation_id, []);
            }
            participantsByConv.get(p.conversation_id).push(p);
          });
        }

        conversations = (convs || []).map(c => {
          const parts = participantsByConv.get(c.id) || [];
          const clientPart = parts.find(p => p.role === 'client' || p.role === 'guest') || parts[0];
          const adminPart = parts.find(p => p.role === 'admin' || p.role === 'staff');
          
          return {
            ...c,
            client_name: clientPart?.user_name || c.metadata?.client_name || 'Customer',
            client_email: clientPart?.user_email || c.metadata?.client_email || '',
            unread_count: adminPart?.unread_count || 0,
            participants: parts
          };
        });
      } else {
        // Client only sees conversations they participate in
        if (!cleanUserEmail && !userIdParam) {
          return NextResponse.json({ conversations: [] }, { headers: NO_CACHE_HEADERS });
        }

        const { data: userParts, error: partErr } = await supabase
          .from('conversation_participants')
          .select('conversation_id, unread_count, last_read_at, user_email')
          .or(`user_email.ilike.${cleanUserEmail},user_id.eq.${userIdParam || 'none'}`);

        if (partErr) throw partErr;

        const convIds = (userParts || []).map(p => p.conversation_id);
        if (convIds.length === 0) {
          return NextResponse.json({ conversations: [] }, { headers: NO_CACHE_HEADERS });
        }

        const { data: convs, error: convErr } = await supabase
          .from('conversations')
          .select('id, title, type, order_id, metadata, last_message_preview, last_message_at, created_at, updated_at')
          .in('id', convIds)
          .order('last_message_at', { ascending: false });

        if (convErr) throw convErr;

        const unreadMap = new Map((userParts || []).map(p => [p.conversation_id, p.unread_count]));

        conversations = (convs || []).map(c => ({
          ...c,
          unread_count: unreadMap.get(c.id) || 0
        }));
      }

      return NextResponse.json({ conversations }, { headers: NO_CACHE_HEADERS });
    }

    // ─────────────────────────────────────────────────────────────
    // 2. MESSAGES HISTORY ACTION
    // ─────────────────────────────────────────────────────────────
    if (action === 'messages') {
      if (!conversationId) {
        return NextResponse.json({ error: 'conversationId is required' }, { status: 400 });
      }

      // Security Check: Verify caller has access to this conversation unless Admin
      if (!isAdmin) {
        const { data: isParticipant } = await supabase
          .from('conversation_participants')
          .select('id')
          .eq('conversation_id', conversationId)
          .or(`user_email.ilike.${cleanUserEmail},user_id.eq.${userIdParam || 'none'}`)
          .maybeSingle();

        // If no participant record found and not admin, block unauthorized access
        if (!isParticipant && cleanUserEmail) {
          return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }
      }

      const { data: messages, error: msgErr } = await supabase
        .from('messages')
        .select('id, conversation_id, sender_id, sender_email, sender_name, sender_role, content, attachments, reply_to, metadata, is_read, created_at')
        .eq('conversation_id', conversationId)
        .is('deleted_at', null)
        .order('created_at', { ascending: true })
        .limit(limit);

      if (msgErr) throw msgErr;

      return NextResponse.json({ messages: messages || [] }, { headers: NO_CACHE_HEADERS });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err) {
    console.error('[API /api/chat/messages GET Error]:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { action, conversationId, userId, role = 'client' } = body;
    const supabase = createAdminClient();

    if (action === 'markRead') {
      if (!conversationId || !userId) {
        return NextResponse.json({ error: 'Missing conversationId or userId' }, { status: 400 });
      }

      // Reset unread count for this participant & update last_read_at
      await supabase
        .from('conversation_participants')
        .update({
          unread_count: 0,
          last_read_at: new Date().toISOString()
        })
        .eq('conversation_id', conversationId)
        .or(`user_id.eq.${userId},user_email.ilike.${userId}`);

      return NextResponse.json({ success: true }, { headers: NO_CACHE_HEADERS });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err) {
    console.error('[API /api/chat/messages POST Error]:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
