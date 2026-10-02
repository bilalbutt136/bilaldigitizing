import { withApiObservability, logServerCaughtError } from '../../../../src/lib/observability/apiObservability.js';
import { NextResponse, after } from 'next/server';
import { createAdminClient } from '../../../../src/lib/supabase/admin';
import { getServerAuthUser } from '../../../../src/lib/supabase/serverAuth';
import { canAccessConversation } from '../../../../src/lib/chat/authorization';
import { enforceApiBurstLimit } from '../../../../src/lib/apiBurstGuard.js';

export const dynamic = 'force-dynamic';

const MESSAGE_FIELDS = 'id, conversation_id, thread_id, client_email, guest_id, sender, sender_name, sender_email, text, type, attachment, attachments, attachment_url, attachment_name, attachment_size, attachment_type, file_id, reply_to, offer_id, offer_data, metadata, status, is_read, read_at, is_autopilot, auto_pilot, deleted_at, timestamp, created_at';
const OFFER_FIELDS = 'id, conversation_id, thread_id, order_id, customer_id, created_by, client_name, client_email, title, description, service_type, price, discount_amount, final_price, delivery_time_text, delivery_days, revisions_allowed, expires_in_hours, expires_at, requires_requirements, status, payment_status, payment_intent_id, stripe_session_id, accepted_at, created_at, updated_at';

async function GET_impl(request) {
  const burstResponse = enforceApiBurstLimit(request, 'chat-messages-get', 30, 60_000);
  if (burstResponse) return burstResponse;

  try {
    const { user, isAdmin } = await getServerAuthUser(request);
    if (!user?.email) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId') || searchParams.get('conversation_id');
    const clientEmail = searchParams.get('clientEmail')?.toLowerCase().trim();

    if (!conversationId && !clientEmail) {
      return NextResponse.json({ error: 'Missing conversationId or clientEmail' }, { status: 400 });
    }

    const supabase = createAdminClient();
    const authEmail = user.email.toLowerCase().trim();

    if (conversationId && !isAdmin) {
      const allowed = await canAccessConversation(supabase, { user, isAdmin }, conversationId);
      if (!allowed) {
        return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
      }
    }

    let query = supabase.from('messages').select(MESSAGE_FIELDS).order('created_at', { ascending: false }).limit(150);

    if (conversationId) {
      query = query.eq('conversation_id', conversationId);
    } else if (isAdmin && clientEmail) {
      query = query.ilike('client_email', clientEmail);
    } else {
      query = query.ilike('client_email', authEmail);
    }

    // Defense in depth: customer queries are always scoped to the authenticated email.
    if (!isAdmin) {
      query = query.ilike('client_email', authEmail);
    }

    const { data: messages, error } = await query;
    if (error) {
      console.warn('[Chat Messages GET Error]:', error.message);
      return NextResponse.json({ messages: [] });
    }

    // Strict Channel Isolation: Check if current thread is a support thread
    const isSupportThread = conversationId && (
      conversationId.startsWith('support-') || 
      conversationId === 'general-support' || 
      conversationId === 'help-support'
    );

    let syncedMessages = (messages || []).reverse();

    if (isSupportThread) {
      // RULE: Support Desk is strictly for customer support inquiries.
      // NEVER leak or synthesize custom offers into support threads.
      syncedMessages = syncedMessages.filter(msg => msg.type !== 'custom_offer' && !msg.offer_id);
    } else if (conversationId || clientEmail) {
      // INBOX CHANNEL: Fetch & sync live custom offers strictly for this inbox conversation
      try {
        let offerQuery = supabase.from('custom_offers').select(OFFER_FIELDS);
        if (conversationId) {
          // Strictly match by conversation_id to avoid cross-thread offer leakage
          offerQuery = offerQuery.eq('conversation_id', conversationId);
        } else if (isAdmin && clientEmail) {
          offerQuery = offerQuery.ilike('client_email', clientEmail);
        } else {
          offerQuery = offerQuery.ilike('client_email', authEmail);
        }
        if (!isAdmin) {
          offerQuery = offerQuery.ilike('client_email', authEmail);
        }

        const { data: offers } = await offerQuery;

        if (offers && offers.length > 0) {
          const offerMap = new Map();
          offers.forEach(off => {
            offerMap.set(off.id, off);
          });

          // 1. Sync offer_data on existing messages
          const seenOfferIds = new Set();
          syncedMessages = syncedMessages.map(msg => {
            if (msg.offer_id && offerMap.has(msg.offer_id)) {
              seenOfferIds.add(msg.offer_id);
              return {
                ...msg,
                type: 'custom_offer',
                offer_data: offerMap.get(msg.offer_id)
              };
            }
            return msg;
          });

          // 2. Synthesize missing offer messages for any custom_offer not yet in messages
          // This guarantees custom offers always show on both sender and receiver sides in Inbox!
          const missingOffers = offers.filter(off => !seenOfferIds.has(off.id));
          for (const off of missingOffers) {
            const targetConvId = conversationId || off.conversation_id;
            // Never synthesize into a support thread
            if (targetConvId && (targetConvId.startsWith('support-') || targetConvId === 'general-support' || targetConvId === 'help-support')) {
              continue;
            }

            const synthesizedMsg = {
              id: `msg-offer-${off.id}`,
              conversation_id: targetConvId,
              client_email: off.client_email || clientEmail,
              sender: 'admin',
              sender_name: 'BDigitizing Support',
              sender_email: off.created_by || 'support@bdigitizing.com',
              text: `Custom Offer: ${off.title}`,
              type: 'custom_offer',
              offer_id: off.id,
              offer_data: off,
              attachments: [],
              is_read: false,
              created_at: off.created_at || new Date().toISOString()
            };
            syncedMessages.push(synthesizedMsg);

            // Safely backfill into messages table asynchronously
            supabase.from('messages').insert([synthesizedMsg]).then(() => {}).catch((error) => { logServerCaughtError(error, { operation: 'chat.offer_backfill_failed' }); });
          }

          // Sort messages by created_at ascending
          syncedMessages.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        }
      } catch (offErr) {
        console.warn('[Chat Offers Sync Notice]:', offErr.message);
      }
    }

    return NextResponse.json({ messages: syncedMessages }, {
      headers: {
        'Cache-Control': 'private, max-age=10, stale-while-revalidate=50'
      }
    });
  } catch (err) {
    console.error('[Chat Messages API GET Error]:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

async function POST_impl(request) {
  const burstResponse = enforceApiBurstLimit(request, 'chat-messages-post', 60, 60_000);
  if (burstResponse) return burstResponse;

  try {
    const { user, isAdmin } = await getServerAuthUser(request);
    if (!user?.email) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }

    const body = await request.json();

    const {
      conversation_id,
      client_email,
      sender = 'admin',
      sender_name,
      sender_email,
      text = '',
      type = 'text',
      attachments = [],
      attachment_url = null,
      attachment_name = null,
      attachment_size = null,
      attachment_type = null,
      offer_id = null,
      offer_data = null,
      reply_to_message_id = null,
      reply_to = null
    } = body;

    if (!conversation_id) {
      return NextResponse.json({ error: 'Missing conversation_id' }, { status: 400 });
    }

    const cleanEmail = (isAdmin ? (client_email || user.email) : user.email).toLowerCase().trim();
    if (!cleanEmail) {
      return NextResponse.json({ error: 'Missing client_email' }, { status: 400 });
    }

    const isSupportThread = conversation_id.startsWith('support-') || conversation_id === 'general-support' || conversation_id === 'help-support';
    if (isSupportThread && (offer_id || type === 'custom_offer')) {
      return NextResponse.json({ error: 'Custom offers cannot be dispatched in Support Desk. Please use the Inbox channel.' }, { status: 400 });
    }

    // Role enforcement
    const effectiveSender = isAdmin ? (sender || 'admin') : 'client';
    const effectiveSenderName = sender_name || (effectiveSender === 'admin' ? 'BDigitizing Support' : (user?.name || cleanEmail.split('@')[0] || 'Client'));
    const effectiveSenderEmail = sender_email || user?.email || (effectiveSender === 'admin' ? 'support@bdigitizing.com' : cleanEmail);

    const supabase = createAdminClient();
    const nowIso = new Date().toISOString();

    // Resolve the conversation once. Previously customer messages queried the same
    // conversation twice before inserting the message, adding an avoidable DB round trip.
    let existingConversation = null;
    const { data: conversationRow, error: conversationLookupError } = await supabase
      .from('conversations')
      .select('id, client_email, client_name, unread_admin_count, unread_client_count')
      .eq('id', conversation_id)
      .maybeSingle();

    if (conversationLookupError) {
      return NextResponse.json({ error: 'Unable to verify conversation access.' }, { status: 500 });
    }
    existingConversation = conversationRow;

    if (!isAdmin && existingConversation && String(existingConversation.client_email || '').trim().toLowerCase() !== cleanEmail) {
      return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
    }

    if (!existingConversation) {
      const newConversation = {
        id: conversation_id,
        client_email: cleanEmail,
        client_name: effectiveSender === 'client' ? effectiveSenderName : cleanEmail.split('@')[0],
        order_title: isSupportThread ? '24/7 Customer Support Desk' : 'Direct Studio Communication & Offers',
        status: effectiveSender === 'client' ? 'online' : 'offline',
        tags: isSupportThread ? ['support'] : ['inbox'],
        last_message: text || (attachments.length > 0 ? `Sent ${attachments.length} attachment(s)` : 'New message'),
        last_message_at: nowIso,
        last_seen_at: nowIso,
        unread_admin_count: 0,
        unread_client_count: 0,
        is_starred: false,
        created_at: nowIso,
        updated_at: nowIso
      };
      const { error: createConversationError } = await supabase.from('conversations').insert([newConversation]);
      if (createConversationError && createConversationError.code !== '23505') {
        return NextResponse.json({ error: 'Unable to create conversation.' }, { status: 500 });
      }
      existingConversation = newConversation;
    }

    // Resolve reply references on the server so clients cannot spoof quoted content
    // or reference a message from a different conversation.
    const requestedReplyId = String(reply_to_message_id || reply_to?.id || '').trim();
    let resolvedReply = null;

    if (requestedReplyId) {
      const { data: repliedMessage, error: repliedMessageError } = await supabase
        .from('messages')
        .select('id, conversation_id, sender, sender_name, text, type, attachment_name, attachments')
        .eq('id', requestedReplyId)
        .eq('conversation_id', conversation_id)
        .maybeSingle();

      if (repliedMessageError) {
        return NextResponse.json({ error: 'Unable to verify replied message.' }, { status: 500 });
      }
      if (!repliedMessage) {
        return NextResponse.json({ error: 'The replied message is no longer available in this conversation.' }, { status: 400 });
      }

      const firstAttachment = Array.isArray(repliedMessage.attachments)
        ? repliedMessage.attachments[0]
        : null;
      const replyText = String(repliedMessage.text || '').trim();

      resolvedReply = {
        id: repliedMessage.id,
        sender: repliedMessage.sender,
        sender_name: repliedMessage.sender_name || (repliedMessage.sender === 'admin' ? 'BDigitizing' : 'Client'),
        text: replyText.substring(0, 500),
        type: repliedMessage.type || 'text',
        attachment_name: repliedMessage.attachment_name || firstAttachment?.name || null
      };
    }

    // 2. Prepare message record
    const messageId = `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const normalizedAttachments = Array.isArray(attachments) ? attachments : (attachment_url ? [{
      name: attachment_name || 'attachment',
      url: attachment_url,
      size: attachment_size || '',
      type: attachment_type || 'application/octet-stream'
    }] : []);

    const messageRow = {
      id: messageId,
      conversation_id,
      client_email: cleanEmail,
      sender: effectiveSender,
      sender_name: effectiveSenderName,
      sender_email: effectiveSenderEmail,
      text: (text || '').trim(),
      type: offer_id ? 'custom_offer' : (normalizedAttachments.length > 0 && !text ? 'attachment' : type),
      attachments: normalizedAttachments,
      attachment_url: attachment_url || (normalizedAttachments[0]?.url || null),
      attachment_name: attachment_name || (normalizedAttachments[0]?.name || null),
      attachment_size: attachment_size || (normalizedAttachments[0]?.size || null),
      attachment_type: attachment_type || (normalizedAttachments[0]?.type || null),
      offer_id: offer_id || null,
      offer_data: offer_data || null,
      reply_to: resolvedReply,
      is_read: false,
      created_at: nowIso
    };

    const { data: insertedMsg, error: msgErr } = await supabase
      .from('messages')
      .insert([messageRow])
      .select()
      .single();

    if (msgErr) {
      console.error('[Chat Messages Insert Error]:', msgErr);
      return NextResponse.json({ error: msgErr.message }, { status: 500 });
    }

    // 3. Update conversation last_message snippet and increment unread counter
    try {
      let snippet = (text || '').trim();
      if (!snippet && offer_id) snippet = `Custom Offer: ${offer_data?.title || 'Special Digitizing Offer'}`;
      if (!snippet && normalizedAttachments.length > 0) snippet = `📎 Attachment: ${normalizedAttachments[0].name}`;
      if (!snippet) snippet = 'New message';

      const updatePayload = {
        last_message: snippet.substring(0, 180),
        last_message_at: nowIso,
        updated_at: nowIso
      };

      if (effectiveSender === 'client') {
        // Client is actively messaging right now
        updatePayload.status = 'online';
        updatePayload.last_seen_at = nowIso;
        // Increment from the conversation snapshot already loaded above.
        updatePayload.unread_admin_count = Number(existingConversation?.unread_admin_count || 0) + 1;
      } else {
        // Increment from the conversation snapshot already loaded above.
        updatePayload.unread_client_count = Number(existingConversation?.unread_client_count || 0) + 1;
      }

      await supabase.from('conversations').update(updatePayload).eq('id', conversation_id);
    } catch (updErr) {
      console.warn('[Chat Conversation Update Notice]:', updErr.message);
    }

    // Email, push, and Realtime fan-out are post-response work. The message and
    // conversation state are already durable at this point.
    after(async () => {
    // 4. Trigger guaranteed email notification alert when a customer sends a message
    if (effectiveSender === 'client') {
      try {
        const { sendNotificationEmail } = await import('../../../../src/lib/emailService');
        await sendNotificationEmail({
          type: 'NEW_MESSAGE',
          senderName: effectiveSenderName,
          clientEmail: cleanEmail,
          messageText: (text || '').trim(),
          channel: isSupportThread ? '24/7 Customer Live Support Desk' : `Studio Inbox (${conversation_id})`,
          attachments: normalizedAttachments,
          orderId: (conversation_id.startsWith('ord-') || conversation_id.startsWith('order-') || conversation_id.includes('ORD')) ? conversation_id : null
        });
      } catch (emailErr) {
        console.warn('[Chat Message Email Dispatch Notice]:', emailErr?.message);
      }
    }

    // 5. Trigger instant high-urgency mobile lock-screen push notification (WhatsApp-style)
    try {
      const { dispatchChatMessagePush } = await import('../../../../src/lib/pushService.js');
      dispatchChatMessagePush({
        senderRole: effectiveSender,
        senderName: effectiveSenderName,
        messageText: (text || '').trim() || (normalizedAttachments.length > 0 ? `📎 ${normalizedAttachments[0].name}` : 'New message'),
        recipientEmail: cleanEmail,
        conversationId: conversation_id,
        orderId: (conversation_id.startsWith('ord-') || conversation_id.startsWith('order-')) ? conversation_id : null
      }).catch(pushErr => console.warn('[Chat Push Notice]:', pushErr?.message));
    } catch (pushImportErr) {
      console.warn('[Chat Push Service Import Notice]:', pushImportErr?.message);
    }

    // 6. Realtime broadcast via explicit HTTP delivery (server routes are not subscribed sockets)
    try {
      const liveChannel = supabase.channel('bdigitizing-live-hub-v2');
      await liveChannel.httpSend('new_chat_message', insertedMsg);
    } catch (bErr) {
      console.warn('[Chat Live Broadcast Notice]:', bErr?.message);
    }
    });

    return NextResponse.json({ success: true, message: insertedMsg });
  } catch (err) {
    console.error('[Chat Messages POST Error]:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export const GET = withApiObservability(GET_impl);
export const POST = withApiObservability(POST_impl);
