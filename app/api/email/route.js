import { NextResponse } from 'next/server';
import { getServerAuthUser } from '../../../src/lib/supabase/serverAuth';
import { checkRateLimit, getClientIp, getRateLimitHeaders } from '../../../src/lib/rateLimit';
import { sendNotificationEmail } from '../../../src/lib/emailService';

export const dynamic = 'force-dynamic';

const ALLOWED_TYPES = [
  'NEW_ORDER', 
  'ORDER_DELIVERED', 
  'ORDER_COMPLETED', 
  'ORDER_REVISION', 
  'NEW_MESSAGE', 
  'ORDER_UPDATE',
  'TEST_EMAIL'
];

export async function POST(req) {
  try {
    const ip = getClientIp(req);
    const rateLimit = checkRateLimit(`email-dispatch:${ip}`, 30, 60000);
    if (!rateLimit.success) {
      return NextResponse.json(
        { success: false, error: 'Too many email requests. Please try again shortly.' },
        { status: 429, headers: getRateLimitHeaders(rateLimit) }
      );
    }

    const { user, isAdmin } = await getServerAuthUser(req);
    const body = await req.json().catch(() => ({}));
    const { 
      type, 
      orderId, 
      clientEmail, 
      recipientEmail
    } = body;

    if (!type || !ALLOWED_TYPES.includes(type)) {
      return NextResponse.json({ success: false, error: 'Invalid email notification type.' }, { status: 400 });
    }

    if (type === 'TEST_EMAIL' && !isAdmin && !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Admin authentication required for test email.' }, { status: 403 });
    }

    // Require either active user session OR valid orderId / clientEmail / recipientEmail
    if (!user && !orderId && !clientEmail && !recipientEmail && type !== 'TEST_EMAIL') {
      return NextResponse.json({ success: false, error: 'Unauthorized: Authentication or valid order payload required.' }, { status: 401 });
    }

    // Delegate to unified emailService engine
    const result = await sendNotificationEmail({
      ...body,
      clientEmail: clientEmail || user?.email || recipientEmail || ''
    });

    if (!result.success && result.warning) {
      return NextResponse.json({ success: true, warning: result.warning });
    }

    return NextResponse.json({
      success: true,
      message: result.message || 'Notification email processed successfully.',
      results: result.results
    });
  } catch (error) {
    console.error('[Email API Route Error]:', error);
    return NextResponse.json({ success: false, error: 'Failed to send email notification', details: error.message }, { status: 500 });
  }
}
