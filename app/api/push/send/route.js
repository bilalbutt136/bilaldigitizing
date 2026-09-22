import { NextResponse } from 'next/server';
import { dispatchPushToDevices } from '../../../../src/lib/pushService.js';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const { 
      title = '💬 BDigitizing Alert', 
      message = 'Test mobile lock screen notification. Your system notifications are active!',
      body: customBody,
      url = '/', 
      role = null, 
      email = null, 
      all = false,
      delaySeconds = 0,
      orderId = null,
      conversationId = null
    } = body;

    // Support delayed dispatch for the user to lock their phone screen before receiving the alert
    const waitTime = Math.min(Math.max(Number(delaySeconds) || 0, 0), 30);
    if (waitTime > 0) {
      await new Promise(resolve => setTimeout(resolve, waitTime * 1000));
    }

    const payload = {
      title,
      body: customBody || message,
      icon: '/favicon.svg',
      badge: '/favicon.svg',
      tag: `bdigi-alert-${Date.now()}`,
      url: url || '/',
      orderId,
      conversationId,
      timestamp: Date.now()
    };

    const result = await dispatchPushToDevices({
      email,
      role,
      all: all || (!email && !role),
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
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
