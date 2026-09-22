import { NextResponse } from 'next/server';
import { savePushSubscription } from '../../../../src/lib/pushService.js';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const { subscription, userId, userEmail, role, userAgent } = body;

    if (!subscription || !subscription.endpoint) {
      return NextResponse.json({
        success: false,
        error: 'Missing required push subscription data'
      }, { status: 400 });
    }

    const result = await savePushSubscription({
      subscription,
      userId,
      userEmail,
      role: role || 'client',
      userAgent: userAgent || req.headers.get('user-agent') || ''
    });

    return NextResponse.json({
      success: result.success,
      storage: result.storage,
      error: result.error || null
    });
  } catch (error) {
    console.error('[POST /api/push/subscribe] error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
