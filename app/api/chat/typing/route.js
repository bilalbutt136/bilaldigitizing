import { NextResponse } from 'next/server';
import { createAdminClient } from '../../../../src/lib/supabase/admin';

export const dynamic = 'force-dynamic';

// In-process fallback cache for rapid queries within warm instances
const localTypingCache = new Map();

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const conversationId = searchParams.get('conversationId') || searchParams.get('conversation_id');
  const forRole = searchParams.get('forRole') || 'admin'; // 'admin' wants to know if 'client' is typing, and vice versa

  if (!conversationId) {
    return NextResponse.json({ isTyping: false });
  }

  const otherRole = forRole === 'admin' ? 'client' : 'admin';
  const cacheKey = `${conversationId}:${otherRole}`;
  const localTs = localTypingCache.get(cacheKey);

  // If locally recorded within 3.5s, return true immediately
  if (localTs && (Date.now() - localTs < 3500)) {
    return NextResponse.json({
      isTyping: true,
      role: otherRole,
      conversationId
    });
  }

  // Query database for shared state across serverless instances
  try {
    const supabase = createAdminClient();
    const field = otherRole === 'client' ? 'typing_client_at' : 'typing_admin_at';
    const { data: conv } = await supabase
      .from('conversations')
      .select(`id, ${field}`)
      .eq('id', conversationId)
      .maybeSingle();

    const dbTs = conv?.[field];
    const isTyping = Boolean(dbTs && (Date.now() - new Date(dbTs).getTime() < 3500));

    return NextResponse.json({
      isTyping,
      role: otherRole,
      conversationId
    });
  } catch {
    return NextResponse.json({
      isTyping: false,
      role: otherRole,
      conversationId
    });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { conversationId, senderRole = 'client', isTyping = true } = body;

    if (!conversationId) {
      return NextResponse.json({ error: 'Missing conversationId' }, { status: 400 });
    }

    const typingBool = Boolean(isTyping);
    const cacheKey = `${conversationId}:${senderRole}`;

    if (typingBool) {
      localTypingCache.set(cacheKey, Date.now());
    } else {
      localTypingCache.delete(cacheKey);
    }

    // 1. Supabase Realtime REST broadcast: immediately pushes to all WebSocket listeners on the chat room
    try {
      const supabase = createAdminClient();
      const channel = supabase.channel(`chat-room-${conversationId}`);
      await channel.send({
        type: 'broadcast',
        event: 'typing',
        payload: {
          role: senderRole,
          isTyping: typingBool,
          conversationId,
          timestamp: Date.now()
        }
      });
      supabase.removeChannel(channel);
    } catch (realtimeErr) {
      console.warn('[Typing API] Supabase broadcast notice:', realtimeErr.message);
    }

    // 2. Database update: persists timestamp in conversations table for stateless lambdas
    try {
      const supabase = createAdminClient();
      const field = senderRole === 'client' ? 'typing_client_at' : 'typing_admin_at';
      await supabase
        .from('conversations')
        .update({
          [field]: typingBool ? new Date().toISOString() : null
        })
        .eq('id', conversationId);
    } catch (dbErr) {
      // Non-blocking if table/column in transition
    }

    return NextResponse.json({ success: true, isTyping: typingBool });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
