import { withApiObservability, logServerCaughtError } from '../../../../src/lib/observability/apiObservability.js';
import { NextResponse } from 'next/server';
import { createAdminClient } from '../../../../src/lib/supabase/admin';
import { getServerAuthUser } from '../../../../src/lib/supabase/serverAuth';
import { canAccessConversation } from '../../../../src/lib/chat/authorization';
import { enforceApiBurstLimit } from '../../../../src/lib/apiBurstGuard.js';

export const dynamic = 'force-dynamic';

const localTypingCache = new Map();

async function GET_impl(request) {
  const burstResponse = enforceApiBurstLimit(request, 'chat-typing-get', 90, 60_000);
  if (burstResponse) return burstResponse;

  const { user, isAdmin } = await getServerAuthUser(request);
  if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const conversationId = searchParams.get('conversationId') || searchParams.get('conversation_id');
  if (!conversationId) return NextResponse.json({ isTyping: false });

  const supabase = createAdminClient();
  if (!(await canAccessConversation(supabase, { user, isAdmin }, conversationId))) {
    return NextResponse.json({ error: 'Conversation access denied.' }, { status: 403 });
  }

  const otherRole = isAdmin ? 'client' : 'admin';
  const cacheKey = `${conversationId}:${otherRole}`;
  const localTs = localTypingCache.get(cacheKey);
  if (localTs && Date.now() - localTs < 3500) {
    return NextResponse.json({ isTyping: true, role: otherRole, conversationId });
  }

  try {
    const field = otherRole === 'client' ? 'typing_client_at' : 'typing_admin_at';
    const { data: conv } = await supabase
      .from('conversations')
      .select(`id, ${field}`)
      .eq('id', conversationId)
      .maybeSingle();

    const dbTs = conv?.[field];
    const isTyping = Boolean(dbTs && Date.now() - new Date(dbTs).getTime() < 3500);
    return NextResponse.json({ isTyping, role: otherRole, conversationId });
  } catch {
    return NextResponse.json({ isTyping: false, role: otherRole, conversationId });
  }
}

async function POST_impl(request) {
  const burstResponse = enforceApiBurstLimit(request, 'chat-typing-post', 90, 60_000);
  if (burstResponse) return burstResponse;

  try {
    const { user, isAdmin } = await getServerAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const conversationId = body.conversationId;
    const typingBool = Boolean(body.isTyping ?? true);
    if (!conversationId) return NextResponse.json({ error: 'Missing conversationId' }, { status: 400 });

    const supabase = createAdminClient();
    if (!(await canAccessConversation(supabase, { user, isAdmin }, conversationId))) {
      return NextResponse.json({ error: 'Conversation access denied.' }, { status: 403 });
    }

    const senderRole = isAdmin ? 'admin' : 'client';
    const cacheKey = `${conversationId}:${senderRole}`;
    if (typingBool) localTypingCache.set(cacheKey, Date.now());
    else localTypingCache.delete(cacheKey);

    try {
      const channel = supabase.channel(`chat-room-${conversationId}`);
      await channel.send({
        type: 'broadcast',
        event: 'typing',
        payload: { role: senderRole, isTyping: typingBool, conversationId, timestamp: Date.now() }
      });
      supabase.removeChannel(channel);
    } catch (realtimeErr) {
      console.warn('[Typing API] Supabase broadcast notice:', realtimeErr.message);
    }

    try {
      const field = senderRole === 'client' ? 'typing_client_at' : 'typing_admin_at';
      await supabase.from('conversations').update({
        [field]: typingBool ? new Date().toISOString() : null
      }).eq('id', conversationId);
    } catch (error) { logServerCaughtError(error, { operation: 'chat.typing_db_fallback_failed' }); }

    return NextResponse.json({ success: true, isTyping: typingBool });
  } catch {
    return NextResponse.json({ error: 'Unable to update typing state.' }, { status: 500 });
  }
}

export const GET = withApiObservability(GET_impl);
export const POST = withApiObservability(POST_impl);
