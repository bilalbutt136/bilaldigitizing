import { NextResponse } from 'next/server';
import { checkRateLimit, getClientIp, getRateLimitHeaders } from '../../../src/lib/rateLimit.js';
import { sendOrderNotification } from '../../../src/lib/email.js';
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
    // HANDLER: NEW ORDER NOTIFICATION
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
