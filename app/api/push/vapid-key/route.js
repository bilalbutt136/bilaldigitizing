import { NextResponse } from 'next/server';
import { getVapidPublicKey } from '../../../../src/lib/pushService.js';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const publicKey = await getVapidPublicKey();
    return NextResponse.json({ success: true, publicKey });
  } catch (err) {
    console.error('[GET /api/push/vapid-key] Error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
