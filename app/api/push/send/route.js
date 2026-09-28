import { NextResponse } from 'next/server';
import { dispatchPushToDevices } from '../../../../src/lib/pushService.js';
import { getServerAuthUser } from '../../../../src/lib/supabase/serverAuth.js';
import { checkDistributedRateLimit, getClientIp, getRateLimitHeaders } from '../../../../src/lib/rateLimit.js';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(req) {
  try {
    const { user, isAdmin } = await getServerAuthUser(req);
    if (!user?.email) {
      return NextResponse.json({ success: false, error: 'Authentication required.' }, { status: 401 });
    }

    const ip = getClientIp(req);
    const rateLimit = await checkDistributedRateLimit(`push-send:${user.id || ip}`, isAdmin ? 60 : 10, 60000);
    if (!rateLimit.success) {
      return NextResponse.json(
        { success: false, error: 'Too many notification requests.' },
        { status: rateLimit.unavailable ? 503 : 429, headers: getRateLimitHeaders(rateLimit) }
      );
    }

    const body = await req.json().catch(() => ({}));
    const {
      title = 'BDigitizing Alert',
      message = 'Your BDigitizing notification is ready.',
      body: customBody,
      url = '/',
      role = null,
      email = null,
      all = false,
      delaySeconds = 0,
      orderId = null,
      conversationId = null
    } = body;

    let targetEmail = email ? String(email).toLowerCase().trim() : null;
    let targetRole = role ? String(role).toLowerCase().trim() : null;
    let broadcastAll = Boolean(all);

    if (!isAdmin) {
      const ownEmail = user.email.toLowerCase().trim();
      if (broadcastAll || targetRole || (targetEmail && targetEmail !== ownEmail)) {
        return NextResponse.json({ success: false, error: 'You may only send a test notification to your own account.' }, { status: 403 });
      }
      targetEmail = ownEmail;
      targetRole = null;
      broadcastAll = false;
    }

    const waitTime = Math.min(Math.max(Number(delaySeconds) || 0, 0), 10);
    if (waitTime > 0) {
      await new Promise(resolve => setTimeout(resolve, waitTime * 1000));
    }

    const payload = {
      title: String(title).slice(0, 120),
      body: String(customBody || message).slice(0, 500),
      icon: '/icon-192.png',
      badge: '/favicon.png',
      tag: `bdigi-alert-${Date.now()}`,
      url: typeof url === 'string' && url.startsWith('/') ? url : '/',
      orderId,
      conversationId,
      timestamp: Date.now()
    };

    const result = await dispatchPushToDevices({
      email: targetEmail,
      role: targetRole,
      all: isAdmin && broadcastAll,
      payload
    });

    return NextResponse.json({
      success: result.success,
      count: result.count,
      sent: result.sent,
      failed: result.failed,
      notice: result.notice || null
    });
  } catch (error) {
    console.error('[POST /api/push/send] error:', error);
    return NextResponse.json({ success: false, error: 'Unable to send push notification.' }, { status: 500 });
  }
}
