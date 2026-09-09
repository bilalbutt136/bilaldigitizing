import { NextResponse } from 'next/server';
import { checkRateLimit, getClientIp, getRateLimitHeaders } from '../../../src/lib/rateLimit.js';
import { sendChatMessageNotification, sendOrderNotification } from '../../../src/lib/email.js';
import { createAdminClient } from '../../../src/lib/supabase/admin.js';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const DEFAULT_SECRET = 'bd_sec_live_notification_trigger_9831';

/**
 * Validates incoming webhook secret or Bearer token
 * @param {Request} req
 * @returns {Promise<boolean>}
 */
async function verifyWebhookSecret(req) {
  const headerSecret = req.headers.get('x-webhook-secret') || '';
  const authHeader = req.headers.get('authorization') || '';
  const bearerToken = authHeader.toLowerCase().startsWith('bearer ')
    ? authHeader.substring(7).trim()
    : '';

  const incomingToken = (headerSecret || bearerToken).trim();
  if (!incomingToken) return false;

  // 1. Check environment variable
  const envSecret = process.env.NOTIFICATION_WEBHOOK_SECRET || process.env.SUPABASE_WEBHOOK_SECRET;
  if (envSecret && incomingToken === envSecret.trim()) {
    return true;
  }

  // 2. Check hardcoded fallback default
  if (incomingToken === DEFAULT_SECRET) {
    return true;
  }

  // 3. Check live dynamic setting stored in site_config
  try {
    const supabase = createAdminClient();
    const { data: config } = await supabase
      .from('site_config')
      .select('value')
      .eq('key', 'notification_webhook_secret')
      .maybeSingle();

    if (config?.value) {
      const dbSecret = String(config.value).trim().replace(/^["']|["']$/g, '');
      if (dbSecret && incomingToken === dbSecret) {
        return true;
      }
    }
  } catch (err) {
    console.warn('[verifyWebhookSecret] site_config lookup warning:', err?.message);
  }

  return false;
}

export async function POST(req) {
  try {
    const ip = getClientIp(req);
    // Rate limit: Max 60 requests per minute per IP
    const rateLimit = checkRateLimit(`send-notification:${ip}`, 60, 60000);
    if (!rateLimit.success) {
      return NextResponse.json(
        { success: false, error: 'Rate limit exceeded for notification webhook. Please slow down.' },
        { status: 429, headers: getRateLimitHeaders(rateLimit) }
      );
    }

    // 1. Verify Secret / Authentication
    const isAuthorized = await verifyWebhookSecret(req);
    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Invalid or missing webhook secret (x-webhook-secret).' },
        { status: 401 }
      );
    }

    // 2. Parse Incoming Payload (supports pg_net triggers, native Supabase webhooks, and direct calls)
    const rawBody = await req.json().catch(() => ({}));
    const payload = rawBody.payload || rawBody;

    // Detect format:
    // A. Native Supabase Database Webhook: { type: 'INSERT', table: 'messages'|'orders', record: { ... } }
    // B. pg_net Trigger: { event: 'new_message'|'new_order', ... }
    // C. Direct API Call: { type: 'NEW_MESSAGE'|'NEW_ORDER', ... }
    const isSupabaseDbWebhook = Boolean(payload.table && payload.record);
    const table = isSupabaseDbWebhook ? payload.table : '';
    const record = isSupabaseDbWebhook ? payload.record : {};

    const event = (
      payload.event ||
      (table === 'messages' ? 'new_message' : table === 'orders' ? 'new_order' : '') ||
      (payload.type ? String(payload.type).toLowerCase() : '')
    );

    // Diagnostics / Ping
    if (event === 'ping' || event === 'test') {
      return NextResponse.json({
        success: true,
        message: 'Notification webhook endpoint is operational and authenticated.',
        timestamp: new Date().toISOString()
      });
    }

    // ==========================================================================
    // HANDLER 1: NEW CHAT MESSAGE NOTIFICATION
    // ==========================================================================
    if (event === 'new_message' || event === 'message') {
      const data = isSupabaseDbWebhook ? record : payload;

      const conversationId = String(data.conversation_id || data.thread_id || data.chatId || '').trim();
      const sender = String(data.sender || 'client').toLowerCase().trim();
      const senderName = data.sender_name || data.senderName || (sender === 'client' ? 'Customer' : 'Studio Support');
      const text = data.text || data.message || '';
      const attachmentName = data.attachment_name || data.attachment || null;
      const attachmentUrl = data.attachment_url || data.attachmentUrl || null;
      const orderId = data.order_id || data.orderId || (conversationId.startsWith('order-') ? conversationId.replace('order-', '') : null);

      // Determine recipient:
      // If sender is client -> Recipient is studio admin
      // If sender is admin/staff -> Recipient is client
      const isClientSender = sender === 'client';
      const isClientRecipient = !isClientSender;

      let recipientEmail = data.recipient_email || data.recipientEmail || '';
      let recipientName = data.recipient_name || data.recipientName || '';

      // If sender is client and no explicit recipient provided, fetch dynamic admin email
      if (isClientSender && !recipientEmail) {
        try {
          const supabase = createAdminClient();
          const { data: config } = await supabase
            .from('site_config')
            .select('value')
            .eq('key', 'admin_notification_email')
            .maybeSingle();

          if (config?.value) {
            recipientEmail = String(config.value).trim().replace(/^["']|["']$/g, '');
          }
        } catch {}

        if (!recipientEmail) {
          recipientEmail = process.env.MASTER_ADMIN_EMAIL || process.env.ADMIN_EMAIL || process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'orders@bdigitizing-pro.com';
        }
        recipientName = 'Studio Admin';
      }

      // If sender is admin and client email missing, lookup conversation
      if (isClientRecipient && !recipientEmail && conversationId) {
        try {
          const supabase = createAdminClient();
          const { data: conv } = await supabase
            .from('conversations')
            .select('client_email, client_name')
            .eq('id', conversationId)
            .maybeSingle();

          if (conv?.client_email) {
            recipientEmail = conv.client_email;
            recipientName = conv.client_name || recipientName;
          }
        } catch {}
      }

      if (!recipientEmail || !recipientEmail.includes('@')) {
        return NextResponse.json({
          success: true,
          status: 'bypassed',
          message: 'Notification skipped: No valid recipient email address found for conversation.',
          conversationId
        });
      }

      // Dispatch chat notification
      const result = await sendChatMessageNotification({
        recipientEmail,
        recipientName,
        senderName,
        senderRole: sender,
        messageSnippet: text,
        conversationId,
        orderId,
        attachmentName,
        attachmentUrl,
        isClientRecipient
      });

      return NextResponse.json({
        success: result.success,
        event: 'new_message',
        status: result.status,
        resendId: result.resendId,
        recipientEmail,
        error: result.error
      });
    }

    // ==========================================================================
    // HANDLER 2: NEW ORDER NOTIFICATION
    // ==========================================================================
    if (event === 'new_order' || event === 'order') {
      const data = isSupabaseDbWebhook ? record : payload;

      const orderId = String(data.order_id || data.id || data.orderId || 'Direct').trim();
      const clientEmail = data.client_email || data.clientEmail || '';
      const clientName = data.client_name || data.clientName || 'Valued Client';
      const serviceName = data.service_category || data.service_type || data.serviceName || data.title || 'Embroidery Digitizing';
      const amount = data.price || data.amount || 15.00;

      // Extract notes and specs safely
      let parsedNotes = data.notes;
      if (typeof parsedNotes === 'string' && parsedNotes.startsWith('{')) {
        try { parsedNotes = JSON.parse(parsedNotes); } catch {}
      }

      const dimensions = (parsedNotes?.patchWidth && parsedNotes?.patchHeight)
        ? `${parsedNotes.patchWidth}" × ${parsedNotes.patchHeight}"`
        : (data.dimensions?.width && data.dimensions?.height ? `${data.dimensions.width}" × ${data.dimensions.height}"` : 'Standard (3.5" × 3.0")');

      const placement = data.placement_type || data.placement || parsedNotes?.placement || 'Left Chest / Cap';
      const instructions = typeof parsedNotes === 'object' && parsedNotes?.notes ? parsedNotes.notes : (typeof parsedNotes === 'string' ? parsedNotes : 'Standard studio specifications');

      // Dispatch order notification (dual: Admin alert + Client receipt)
      const result = await sendOrderNotification({
        orderId,
        clientEmail,
        clientName,
        serviceName,
        amount,
        dimensions,
        placement,
        instructions,
        targetRole: 'both'
      });

      return NextResponse.json({
        success: result.success,
        event: 'new_order',
        status: result.status,
        resendId: result.resendId,
        orderId,
        error: result.error
      });
    }

    return NextResponse.json(
      { success: false, error: `Unrecognized notification event type: "${event}". Expected "new_message" or "new_order".` },
      { status: 400 }
    );
  } catch (error) {
    console.error('[POST /api/send-notification] Handler error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal notification dispatch failure', details: error.message },
      { status: 500 }
    );
  }
}
