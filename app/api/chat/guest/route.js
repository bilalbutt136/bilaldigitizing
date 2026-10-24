import { NextResponse, after } from 'next/server';
import { withApiObservability, logServerCaughtError } from '../../../../src/lib/observability/apiObservability.js';
import { createAdminClient } from '../../../../src/lib/supabase/admin';
import { checkDistributedRateLimit, getClientIp, getRateLimitHeaders } from '../../../../src/lib/rateLimit.js';
import { enforceApiBurstLimit } from '../../../../src/lib/apiBurstGuard.js';

export const dynamic = 'force-dynamic';

const SESSION_REGEX = /^[a-zA-Z0-9_-]{8,64}$/;
const GUEST_EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function sanitizeSessionId(raw) {
  if (!raw || typeof raw !== 'string') return null;
  const clean = raw.trim();
  return SESSION_REGEX.test(clean) ? clean : null;
}

async function GET_impl(request) {
  const burstResponse = enforceApiBurstLimit(request, 'chat-guest-get', 60, 60_000);
  if (burstResponse) return burstResponse;

  try {
    const { searchParams } = new URL(request.url);
    const sessionId = sanitizeSessionId(searchParams.get('sessionId'));
    if (!sessionId) {
      return NextResponse.json({ error: 'Valid sessionId required' }, { status: 400 });
    }

    const conversationId = `support-guest_${sessionId}`;
    const supabase = createAdminClient();

    const { data: messages, error } = await supabase
      .from('messages')
      .select('id, conversation_id, sender, sender_name, text, type, is_read, created_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(100);

    if (error) {
      console.warn('[Guest Chat GET] Messages fetch notice:', error.message);
      return NextResponse.json({ success: true, messages: [] });
    }

    return NextResponse.json({ success: true, messages: messages || [] });
  } catch (err) {
    console.error('[Guest Chat GET Error]:', err);
    return NextResponse.json({ error: 'Unable to load messages.' }, { status: 500 });
  }
}

async function POST_impl(request) {
  const burstResponse = enforceApiBurstLimit(request, 'chat-guest-post', 60, 60_000);
  if (burstResponse) return burstResponse;

  const rate = await checkDistributedRateLimit('guest-chat:' + getClientIp(request), 30, 60_000);
  if (!rate.success) {
    return NextResponse.json(
      { error: 'Too many messages. Please slow down.' },
      { status: 429, headers: getRateLimitHeaders(rate) }
    );
  }

  try {
    const body = await request.json();
    const sessionId = sanitizeSessionId(body?.sessionId);
    if (!sessionId) {
      return NextResponse.json({ error: 'Valid sessionId required' }, { status: 400 });
    }

    const rawMessage = String(body?.message || '').trim().slice(0, 2000);
    if (!rawMessage) {
      return NextResponse.json({ error: 'Message cannot be empty.' }, { status: 400 });
    }

    const conversationId = `support-guest_${sessionId}`;
    const providedEmail = String(body?.senderEmail || '').trim().toLowerCase().slice(0, 254);
    const guestEmail = GUEST_EMAIL_REGEX.test(providedEmail)
      ? providedEmail
      : `guest_${sessionId}@guest.bdigitizing.com`;
    const senderName = String(body?.senderName || 'Website Visitor').trim().slice(0, 80);
    const isAgentRequest = Boolean(body?.isAgentRequest);
    const nowIso = new Date().toISOString();

    const supabase = createAdminClient();

    // 1. Get or create the guest support conversation
    const { data: existingConv } = await supabase
      .from('conversations')
      .select('id, client_email, client_name, unread_admin_count, order_title')
      .eq('id', conversationId)
      .maybeSingle();

    let unreadCount = 1;
    if (existingConv) {
      unreadCount = Number(existingConv.unread_admin_count || 0) + 1;
      const updateData = {
        client_email: guestEmail,
        client_name: senderName,
        last_message: rawMessage.slice(0, 180),
        last_message_at: nowIso,
        status: 'online',
        last_seen_at: nowIso,
        unread_admin_count: unreadCount,
        updated_at: nowIso
      };
      if (isAgentRequest) {
        updateData.order_title = '🔴 24/7 Live Agent Requested (Guest)';
      }
      await supabase.from('conversations').update(updateData).eq('id', conversationId);
    } else {
      const newConv = {
        id: conversationId,
        client_email: guestEmail,
        client_name: senderName,
        order_title: isAgentRequest ? '🔴 24/7 Live Agent Requested (Guest)' : '24/7 Support Desk (Guest)',
        status: 'online',
        tags: ['support', 'guest', 'helpdesk'],
        last_message: rawMessage.slice(0, 180),
        last_message_at: nowIso,
        last_seen_at: nowIso,
        unread_admin_count: 1,
        unread_client_count: 0,
        is_starred: false,
        created_at: nowIso,
        updated_at: nowIso
      };
      const { error: convErr } = await supabase.from('conversations').insert([newConv]);
      if (convErr && convErr.code !== '23505') {
        console.error('[Guest Chat POST] Conversation create error:', convErr);
      }
    }

    // 2. Insert message
    const messageId = `msg-guest-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const messageRow = {
      id: messageId,
      conversation_id: conversationId,
      client_email: guestEmail,
      sender: 'client',
      sender_name: senderName,
      sender_email: guestEmail,
      text: rawMessage,
      type: isAgentRequest ? 'system' : 'text',
      is_read: false,
      created_at: nowIso
    };

    const { data: insertedMsg, error: msgErr } = await supabase
      .from('messages')
      .insert([messageRow])
      .select()
      .single();

    if (msgErr) {
      console.error('[Guest Chat POST] Message insert error:', msgErr);
      return NextResponse.json({ error: 'Failed to record message in Help Desk.' }, { status: 500 });
    }

    // 3. Post-response fan-out (Realtime broadcast + notifications)
    after(async () => {
      try {
        const liveChannel = supabase.channel('bdigitizing-live-hub-v2');
        await liveChannel.httpSend('new_chat_message', insertedMsg);
      } catch (bErr) {
        console.warn('[Guest Chat Live Broadcast Notice]:', bErr?.message);
      }

      try {
        const { sendNotificationEmail } = await import('../../../../src/lib/emailService');
        await sendNotificationEmail({
          type: 'NEW_MESSAGE',
          senderName: isAgentRequest ? `${senderName} [Live Agent Requested]` : senderName,
          clientEmail: guestEmail,
          messageText: rawMessage,
          channel: isAgentRequest ? '24/7 Live Support Desk — Agent Requested' : 'Website Live Chat',
          conversationId
        });
      } catch (emailErr) {
        logServerCaughtError(emailErr, { operation: 'chat.guest_email_failed' });
      }

      if (isAgentRequest) {
        try {
          const { dispatchChatMessagePush } = await import('../../../../src/lib/pushService.js');
          dispatchChatMessagePush({
            senderRole: 'client',
            senderName: `${senderName} (Help Desk)`,
            messageText: `Live Agent Requested: ${rawMessage}`,
            recipientEmail: guestEmail,
            conversationId: conversationId
          }).catch((pushErr) => {
            logServerCaughtError(pushErr, { operation: 'chat.guest_push_failed' });
          });
        } catch (pushImportErr) {
          logServerCaughtError(pushImportErr, { operation: 'chat.guest_push_import_failed' });
        }
      }
    });

    return NextResponse.json({ success: true, message: insertedMsg });
  } catch (err) {
    console.error('[Guest Chat POST Error]:', err);
    return NextResponse.json({ error: 'Server error sending message.' }, { status: 500 });
  }
}

export const GET = withApiObservability(GET_impl);
export const POST = withApiObservability(POST_impl);
