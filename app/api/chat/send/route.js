import { NextResponse } from 'next/server';
import { createAdminClient } from '../../../../src/lib/supabase/admin';
import { getServerAuthUser } from '../../../../src/lib/supabase/serverAuth';
import { generateHelpDeskAutoReply } from '../../../../src/lib/chat/autoReply';
import { extractGuestId } from '../../../../src/utils/sessionHelper';

export const dynamic = 'force-dynamic';

const isSupportConversation = (id) => {
  if (!id) return false;
  const lower = String(id).toLowerCase().trim();
  return lower === 'general-support' || lower === 'support-guest' || lower === 'help-support' || lower.startsWith('support-');
};

const isValidEmail = (e) => {
  if (!e) return false;
  const str = String(e).toLowerCase().trim();
  if (str === 'client@studio.com' || str.includes('guest@bdigitizing.pro')) return false;
  return str.includes('@') && str.includes('.');
};

export async function POST(req) {
  try {
    const supabase = createAdminClient();
    const { user, isAdmin } = await getServerAuthUser(req);
    const body = await req.json().catch(() => ({}));
    const payload = body.payload || body;

    let convId = String(payload.conversation_id || payload.thread_id || payload.chatId || '').trim();
    const isSupport = isSupportConversation(convId) || payload.isSupport === true || payload.channel === 'support';
    
    // Resolve guest identifier
    let guestId = payload.guest_id || extractGuestId(convId) || extractGuestId(payload.client_email) || null;
    
    // Resolve email safely (never treat guest tokens as emails)
    let targetEmail = null;
    if (isValidEmail(payload.client_email)) {
      targetEmail = String(payload.client_email).toLowerCase().trim();
    } else if (isValidEmail(payload.clientEmail)) {
      targetEmail = String(payload.clientEmail).toLowerCase().trim();
    } else if (user?.email && isValidEmail(user.email)) {
      targetEmail = String(user.email).toLowerCase().trim();
    }

    if (!convId) {
      if (isSupport) {
        convId = targetEmail ? `support-${targetEmail}` : (guestId ? `support-${guestId}` : 'general-support');
      } else {
        convId = targetEmail ? `inbox-${targetEmail}` : (guestId ? `inbox-${guestId}` : 'inbox-guest');
      }
    }

    const actualSender = isAdmin ? 'admin' : (payload.sender === 'admin' && !isAdmin ? 'client' : (payload.sender || 'client'));
    const actualSenderName = isAdmin 
      ? (payload.sender_name || 'Support')
      : (payload.sender_name || payload.senderName || user?.user_metadata?.full_name || (targetEmail ? targetEmail.split('@')[0] : (guestId ? 'Guest Visitor' : 'Customer')));

    const finalClientName = isAdmin 
      ? (payload.client_name || payload.clientName || 'Customer')
      : actualSenderName;

    const nowIso = new Date().toISOString();

    // 1. Idempotency Check
    const messageId = payload.id || `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    if (payload.idempotency_key || payload.id) {
      try {
        let query = supabase.from('messages').select('*');
        if (payload.idempotency_key) {
          query = query.eq('idempotency_key', payload.idempotency_key);
        } else {
          query = query.eq('id', messageId);
        }
        const { data: existing } = await query.maybeSingle();
        if (existing) {
          return NextResponse.json({ success: true, is_duplicate: true, message: existing });
        }
      } catch {}
    }

    // 2. Upsert Conversation
    try {
      await supabase.from('conversations').upsert([{
        id: convId,
        guest_id: guestId,
        client_name: finalClientName,
        client_email: targetEmail,
        client_company: payload.company || (isSupport ? 'Customer Support' : 'Studio Client'),
        status: 'online',
        admin_unread_count: isAdmin ? 0 : 1,
        client_unread_count: isAdmin ? 1 : 0,
        updated_at: nowIso
      }]);
    } catch (convErr) {
      console.warn('[Chat Send] Conversation upsert notice:', convErr.message);
    }

    // 3. Prepare Message Row
    const dbPayload = {
      id: messageId,
      idempotency_key: payload.idempotency_key || null,
      conversation_id: convId,
      thread_id: convId,
      guest_id: guestId,
      type: payload.type || (payload.offer_id || payload.offer_data ? 'custom_offer' : 'text'),
      metadata: payload.metadata || {},
      client_email: targetEmail,
      sender: actualSender,
      sender_name: actualSenderName,
      text: payload.text || '',
      attachment: payload.attachment || payload.attachment_name || null,
      attachment_url: payload.attachment_url || payload.attachmentUrl || null,
      attachment_name: payload.attachment_name || payload.attachmentName || payload.attachment || null,
      attachment_size: payload.attachment_size || payload.attachmentSize || null,
      attachment_type: payload.attachment_type || payload.attachmentType || null,
      reply_to: payload.reply_to || payload.replyTo || null,
      offer_id: payload.offer_id || payload.offerId || null,
      offer_data: payload.offer_data || payload.offerData || null,
      status: 'sent',
      is_read: false,
      timestamp: payload.timestamp || nowIso,
      created_at: nowIso
    };

    let insertedMsg = dbPayload;
    const { data: insData, error: insError } = await supabase.from('messages').insert([dbPayload]).select();
    if (insError) {
      // Fallback insert with core schema
      console.warn('[Chat Send] Initial insert fallback:', insError.message);
      const corePayload = {
        id: dbPayload.id,
        conversation_id: dbPayload.conversation_id,
        sender: dbPayload.sender,
        sender_name: dbPayload.sender_name,
        text: dbPayload.text || '',
        attachment: typeof dbPayload.attachment === 'string' ? dbPayload.attachment : null,
        timestamp: dbPayload.timestamp,
        created_at: dbPayload.created_at
      };
      const { data: coreData, error: coreErr } = await supabase.from('messages').insert([corePayload]).select();
      if (coreErr) {
        console.error('[Chat Send] Core insert error:', coreErr);
        throw coreErr;
      }
      if (coreData && coreData[0]) insertedMsg = { ...dbPayload, ...coreData[0] };
    } else if (insData && insData[0]) {
      insertedMsg = insData[0];
    }

    // 4. Update Conversation Unread Counters
    try {
      const { data: convData } = await supabase
        .from('conversations')
        .select('admin_unread_count, client_unread_count')
        .eq('id', convId)
        .maybeSingle();

      if (isAdmin) {
        const newClientCount = (convData?.client_unread_count || 0) + 1;
        await supabase.from('conversations')
          .update({ updated_at: nowIso, client_unread_count: newClientCount, admin_unread_count: 0 })
          .eq('id', convId);
      } else {
        const newAdminCount = (convData?.admin_unread_count || 0) + 1;
        await supabase.from('conversations')
          .update({ updated_at: nowIso, admin_unread_count: newAdminCount, client_unread_count: 0 })
          .eq('id', convId);
      }
    } catch {}

    // 5. Autonomous 24/7 Live Support AI Engine
    let autoReplyMsg = null;
    if (isSupport && actualSender === 'client' && !payload.is_autopilot && !payload.auto_pilot && payload.text && String(payload.text).trim()) {
      try {
        let isAutoPilotOn = true;
        try {
          const { data: apConfig } = await supabase.from('site_config').select('value').eq('key', 'autopilot_helpdesk').maybeSingle();
          if (apConfig?.value !== undefined && apConfig?.value !== null) {
            const valStr = typeof apConfig.value === 'string' ? apConfig.value.trim().toLowerCase() : apConfig.value;
            isAutoPilotOn = valStr === true || valStr === 'true' || valStr === 1 || valStr === '1';
          }
        } catch {}

        if (isAutoPilotOn) {
          let recentHistory = [];
          try {
            const { data: hist } = await supabase
              .from('messages')
              .select('sender, text, sender_name')
              .eq('conversation_id', convId)
              .order('created_at', { ascending: false })
              .limit(6);
            if (Array.isArray(hist)) recentHistory = hist.reverse();
          } catch {}

          const replyText = await generateHelpDeskAutoReply({
            clientName: actualSenderName,
            targetEmail: targetEmail || '',
            latestText: payload.text,
            attachmentUrl: payload.attachment_url || null,
            history: recentHistory
          });

          if (replyText && replyText.trim()) {
            const autoNowIso = new Date().toISOString();
            const autoMsgPayload = {
              id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
              conversation_id: convId,
              thread_id: convId,
              guest_id: guestId,
              type: 'text',
              metadata: { is_autopilot: true, auto_pilot: true },
              client_email: targetEmail,
              sender: 'admin',
              sender_name: '24/7 Live Support',
              text: replyText.trim(),
              status: 'sent',
              is_read: false,
              timestamp: autoNowIso,
              created_at: autoNowIso
            };

            const { data: autoIns } = await supabase.from('messages').insert([autoMsgPayload]).select();
            autoReplyMsg = (autoIns && autoIns[0]) ? autoIns[0] : autoMsgPayload;

            try {
              await supabase.from('conversations')
                .update({ updated_at: autoNowIso, client_unread_count: 1, admin_unread_count: 0, status: 'online' })
                .eq('id', convId);
            } catch {}
          }
        }
      } catch (apErr) {
        console.warn('[Chat Send] Auto-Pilot notice:', apErr.message);
      }
    }

    // 6. Non-blocking Asynchronous Email Notification for Admin
    if (actualSender === 'client' && !payload.is_autopilot && !payload.auto_pilot) {
      try {
        const siteBase = process.env.NEXT_PUBLIC_SITE_URL || 'https://bilaldigitizing.vercel.app';
        fetch(`${siteBase}/api/email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'NEW_MESSAGE',
            clientEmail: targetEmail || (guestId ? `Guest (${guestId})` : 'In-App Visitor'),
            senderName: actualSenderName,
            messageText: payload.text || payload.attachment_name || 'Customer sent an inquiry or asset.',
            channel: isSupport ? '24/7 Live Support' : `Conversation ${convId}`,
            orderId: convId.startsWith('order-') ? convId.replace('order-', '') : null
          })
        }).catch(err => console.warn('[Chat Send] Admin email notice:', err?.message));
      } catch {}
    }

    return NextResponse.json({
      success: true,
      message: {
        id: insertedMsg.id,
        conversation_id: convId,
        thread_id: convId,
        guest_id: guestId,
        sender: insertedMsg.sender,
        senderName: insertedMsg.sender_name,
        sender_name: insertedMsg.sender_name,
        text: insertedMsg.text,
        attachment: insertedMsg.attachment,
        attachment_url: insertedMsg.attachment_url || null,
        attachment_name: insertedMsg.attachment_name || null,
        attachment_size: insertedMsg.attachment_size || null,
        attachment_type: insertedMsg.attachment_type || null,
        reply_to: insertedMsg.reply_to || null,
        offer_id: insertedMsg.offer_id || null,
        offer_data: insertedMsg.offer_data || null,
        status: 'sent',
        is_read: false,
        timestamp: insertedMsg.timestamp || insertedMsg.created_at
      },
      auto_reply: autoReplyMsg
    });
  } catch (error) {
    console.error('[POST /api/chat/send]', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
