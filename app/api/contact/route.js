import { NextResponse, after } from 'next/server';

import { checkDistributedRateLimit, getClientIp, getRateLimitHeaders } from '../../../src/lib/rateLimit';
import { EMAIL_REGEX } from '../../../src/lib/emailService';
import { createAdminClient } from '../../../src/lib/supabase/admin';
import { withApiObservability, logServerCaughtError } from '../../../src/lib/observability/apiObservability';

export const dynamic = 'force-dynamic';
const SERVICE_TYPES = new Set(['Embroidery Digitizing', 'Vector Art Tracing', 'Custom Patches', 'General Support']);

const safeText = (value, max) => String(value || '').trim().slice(0, max);
const contactConversationId = (email) =>
  `inbox-contact_${String(email || '').toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 120)}`;

export function validateContactInquiry(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return null;
  const name = safeText(body.name, 120);
  const email = safeText(body.email, 254).toLowerCase();
  const phone = safeText(body.phone, 48);
  const service = safeText(body.service, 80);
  const subject = safeText(body.subject, 150);
  const message = safeText(body.message, 5000);
  if (name.length < 2 || name.length > 120 || !EMAIL_REGEX.test(email) ||
      message.length < 10 || !SERVICE_TYPES.has(service)) return null;
  if (body.name?.length > 120 || body.email?.length > 254 ||
      body.subject?.length > 150 || body.message?.length > 5000 ||
      body.phone?.length > 48) return null;
  return { name, email, phone, service, subject, message };
}

async function persistInquiryToAdminInbox(inquiry) {
  const supabase = createAdminClient();
  const conversationId = contactConversationId(inquiry.email);
  const nowIso = new Date().toISOString();

  const { data: existing, error: existingError } = await supabase
    .from('conversations')
    .select('id, unread_admin_count')
    .eq('id', conversationId)
    .maybeSingle();

  if (existingError) {
    throw new Error(`Unable to load contact conversation: ${existingError.message}`);
  }

  const conversationTitle = inquiry.subject
    ? `Website Inquiry — ${inquiry.subject}`
    : `Website Inquiry — ${inquiry.service}`;

  const unreadAdminCount = Number(existing?.unread_admin_count || 0) + 1;
  const conversationUpdate = {
    client_email: inquiry.email,
    client_name: inquiry.name,
    order_title: conversationTitle.slice(0, 180),
    last_message: inquiry.message.slice(0, 180),
    last_message_at: nowIso,
    last_seen_at: nowIso,
    status: 'online',
    unread_admin_count: unreadAdminCount,
    is_archived: false,
    updated_at: nowIso
  };

  if (existing) {
    const { error: updateError } = await supabase
      .from('conversations')
      .update(conversationUpdate)
      .eq('id', conversationId);

    if (updateError) {
      throw new Error(`Unable to update contact conversation: ${updateError.message}`);
    }
  } else {
    const { error: createError } = await supabase
      .from('conversations')
      .insert([{
        id: conversationId,
        ...conversationUpdate,
        unread_client_count: 0,
        is_starred: false,
        tags: ['inbox', 'contact', 'website'],
        created_at: nowIso
      }]);

    if (createError && createError.code !== '23505') {
      throw new Error(`Unable to create contact conversation: ${createError.message}`);
    }
  }

  const contextLines = [
    `Service: ${inquiry.service}`,
    inquiry.subject ? `Subject: ${inquiry.subject}` : null,
    inquiry.phone ? `Phone: ${inquiry.phone}` : null,
    '',
    inquiry.message
  ].filter((line) => line !== null);

  const messageRow = {
    id: `msg-contact-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    conversation_id: conversationId,
    client_email: inquiry.email,
    sender: 'client',
    sender_name: inquiry.name,
    sender_email: inquiry.email,
    text: contextLines.join('\n'),
    type: 'text',
    is_read: false,
    created_at: nowIso
  };

  const { data: insertedMessage, error: messageError } = await supabase
    .from('messages')
    .insert([messageRow])
    .select()
    .single();

  if (messageError) {
    throw new Error(`Unable to save contact message: ${messageError.message}`);
  }

  try {
    const { ensureAdminMessageNotification } = await import('../../../src/lib/adminMessageNotification.js');
    await ensureAdminMessageNotification({
      messageId: insertedMessage.id,
      conversationId,
      senderName: inquiry.name,
      clientEmail: inquiry.email,
      messageText: inquiry.message,
      createdAt: insertedMessage.created_at || nowIso
    });
  } catch (notificationError) {
    logServerCaughtError(notificationError, { operation: 'contact.persist_admin_alert' });
  }

  return { supabase, conversationId, insertedMessage };
}

async function POST_impl(request) {
  try {
    const length = Number(request.headers.get('content-length') || 0);
    if (length > 12000) {
      return NextResponse.json({ success: false, error: 'Message is too long.' }, { status: 413 });
    }

    const rate = await checkDistributedRateLimit('public-contact:' + getClientIp(request), 6, 600000);
    if (!rate.success) {
      return NextResponse.json(
        { success: false, error: rate.unavailable ? 'Contact service temporarily unavailable.' : 'Too many inquiries. Please try again later.' },
        { status: rate.unavailable ? 503 : 429, headers: getRateLimitHeaders(rate) }
      );
    }

    const body = await request.json().catch(() => null);
    if (body?.website) {
      return NextResponse.json({ success: false, error: 'Unable to process this inquiry.' }, { status: 400 });
    }

    const inquiry = validateContactInquiry(body);
    if (!inquiry) {
      return NextResponse.json({ success: false, error: 'Please enter a valid name, email, service and message (at least 10 characters).' }, { status: 400 });
    }

    // Admin Inbox is the source of truth. Save the inquiry before sending the email alert.
    let persisted;
    try {
      persisted = await persistInquiryToAdminInbox(inquiry);
    } catch (persistError) {
      logServerCaughtError(persistError, { operation: 'contact.persist_admin_inbox' });
      return NextResponse.json(
        { success: false, error: 'Your message could not be saved to our support desk. Please try again.' },
        { status: 503 }
      );
    }

    // Message persistence + admin alert are already durable. Email, push and
    // realtime fan-out are best-effort secondary channels and must never make
    // the customer believe their inquiry was lost.
    after(async () => {
      try {
        const liveChannel = persisted.supabase.channel('bdigitizing-live-hub-v2');
        await liveChannel.httpSend('new_chat_message', persisted.insertedMessage);
      } catch (broadcastError) {
        logServerCaughtError(broadcastError, { operation: 'contact.realtime_broadcast_failed' });
      }

      const contextMessage = [
        `Service: ${inquiry.service}`,
        inquiry.subject ? `Subject: ${inquiry.subject}` : null,
        inquiry.phone ? `Phone: ${inquiry.phone}` : null,
        '',
        inquiry.message
      ].filter((line) => line !== null).join('\n');

      try {
        const { sendNotificationEmail } = await import('../../../src/lib/emailService.js');
        const emailResult = await sendNotificationEmail({
          type: 'NEW_MESSAGE',
          senderName: inquiry.name,
          clientName: inquiry.name,
          clientEmail: inquiry.email,
          messageText: contextMessage,
          channel: `Website Contact Form — ${inquiry.service}`,
          conversationId: persisted.conversationId
        });
        if (emailResult?.success === false) {
          logServerCaughtError(new Error(emailResult.error || 'Contact email notification failed'), {
            operation: 'contact.email_alert_failed'
          });
        }
      } catch (emailError) {
        logServerCaughtError(emailError, { operation: 'contact.email_alert_failed' });
      }

      try {
        const { dispatchChatMessagePush } = await import('../../../src/lib/pushService.js');
        const pushResult = await dispatchChatMessagePush({
          senderRole: 'client',
          senderName: inquiry.name,
          messageText: inquiry.message,
          recipientEmail: inquiry.email,
          conversationId: persisted.conversationId
        });
        if (pushResult?.success === false) {
          logServerCaughtError(new Error(pushResult.error || 'Contact push notification failed'), {
            operation: 'contact.push_alert_failed'
          });
        }
      } catch (pushError) {
        logServerCaughtError(pushError, { operation: 'contact.push_alert_failed' });
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Your inquiry has been received and saved.',
      conversationId: persisted.conversationId
    }, { status: 200 });
  } catch (error) {
    console.error('[Contact] Dispatch failed:', error?.message);
    return NextResponse.json({ success: false, error: 'Contact service temporarily unavailable. Please try again.' }, { status: 503 });
  }
}

export const POST = withApiObservability(POST_impl);
