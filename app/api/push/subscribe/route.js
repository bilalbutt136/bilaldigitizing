import { NextResponse } from 'next/server';
import { savePushSubscription } from '../../../../src/lib/pushService.js';
import { getServerAuthUser } from '../../../../src/lib/supabase/serverAuth.js';
import { checkDistributedRateLimit, getClientIp, getRateLimitHeaders } from '../../../../src/lib/rateLimit.js';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(req) {
  try {
    const { user, isAdmin, isWorker } = await getServerAuthUser(req);
    if (!user?.email) {
      return NextResponse.json({ success: false, error: 'Authentication required.' }, { status: 401 });
    }

    const ip = getClientIp(req);
    const rateLimit = await checkDistributedRateLimit(`push-subscribe:${user.id || ip}`, 20, 60000);
    if (!rateLimit.success) {
      return NextResponse.json(
        { success: false, error: 'Too many subscription requests.' },
        { status: rateLimit.unavailable ? 503 : 429, headers: getRateLimitHeaders(rateLimit) }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { subscription } = body;
    if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
      return NextResponse.json({ success: false, error: 'Invalid push subscription data.' }, { status: 400 });
    }

    const role = isAdmin ? 'admin' : (isWorker ? 'worker' : 'client');
    const result = await savePushSubscription({
      subscription,
      userId: user.id,
      userEmail: user.email,
      role,
      userAgent: req.headers.get('user-agent') || ''
    });

    return NextResponse.json({
      success: result.success,
      storage: result.storage,
      error: result.error || null
    });
  } catch (error) {
    console.error('[POST /api/push/subscribe] error:', error);
    return NextResponse.json({ success: false, error: 'Unable to save push subscription.' }, { status: 500 });
  }
}
