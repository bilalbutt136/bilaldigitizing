import { NextResponse } from 'next/server';
import { sendPushToRecipient } from '../../../../src/lib/pushService.js';
import { getServerAuthUser } from '../../../../src/lib/supabase/serverAuth.js';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const { isAdmin } = await getServerAuthUser(request);
    const authHeader = request.headers.get('authorization') || '';
    const secretHeader = request.headers.get('x-webhook-secret') || '';

    const webhookSecret = process.env.NOTIFICATION_WEBHOOK_SECRET || 'bd_sec_live_notification_trigger_9831';
    const isWebhookAuthorized = secretHeader === webhookSecret || authHeader.replace(/^bearer\s+/i, '') === webhookSecret;

    if (!isAdmin && !isWebhookAuthorized) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Admin privileges or valid webhook secret required.' }, { status: 401 });
    }

    const body = await request.json();
    const {
      targetEmail = null,
      targetRole = null,
      title = 'BDigitizing Notification',
      message = '',
      bodyText = '',
      url = '/client',
      tag = null,
      orderId = null,
      conversationId = null,
      payload = null
    } = body;

    const pushPayload = payload || {
      title,
      body: bodyText || message || 'New alert from BDigitizing Studio',
      icon: '/favicon.svg',
      badge: '/favicon.svg',
      tag: tag || (orderId ? `order-${orderId}` : (conversationId ? `chat-${conversationId}` : `alert-${Date.now()}`)),
      url,
      orderId,
      conversationId,
      vibrate: [200, 100, 200, 100, 200],
      actions: [
        { action: 'open', title: 'Open View' },
        { action: 'close', title: 'Dismiss' }
      ]
    };

    const result = await sendPushToRecipient({
      userEmail: targetEmail,
      role: targetRole,
      payload: pushPayload
    });

    return NextResponse.json({
      success: result.success,
      delivered: result.delivered,
      total: result.total,
      message: result.message || 'Push notification dispatched.'
    });
  } catch (err) {
    console.error('[POST /api/push/send] Error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
