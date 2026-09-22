import { NextResponse } from 'next/server';
import { savePushSubscription } from '../../../../src/lib/pushService.js';
import { getServerAuthUser } from '../../../../src/lib/supabase/serverAuth.js';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const { user, isAdmin } = await getServerAuthUser(request);
    const body = await request.json();

    const {
      subscription,
      role = 'client',
      userEmail = null,
      userId = null
    } = body;

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return NextResponse.json(
        { success: false, error: 'Invalid PushSubscription payload: missing endpoint or keys.' },
        { status: 400 }
      );
    }

    const effectiveRole = isAdmin ? 'admin' : (user?.role || role || 'client');
    const effectiveEmail = user?.email || userEmail || null;
    const effectiveUserId = user?.id || userId || null;
    const userAgent = request.headers.get('user-agent');

    const result = await savePushSubscription({
      subscription,
      userId: effectiveUserId,
      userEmail: effectiveEmail,
      role: effectiveRole,
      userAgent
    });

    return NextResponse.json({
      success: true,
      role: effectiveRole,
      recipient: effectiveEmail,
      fallback: result?.fallback || false
    });
  } catch (err) {
    console.error('[POST /api/push/subscribe] Error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
