import { withApiObservability } from '../../../../src/lib/observability/apiObservability.js';
import { NextResponse } from 'next/server';
import { getPublicVapidKey } from '../../../../src/lib/pushService.js';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function GET_impl() {
  try {
    const publicKey = await getPublicVapidKey();
    return NextResponse.json({
      success: true,
      enabled: true,
      publicKey
    });
  } catch (err) {
    const message = String(err?.message || '');
    if (message.includes('VAPID credentials are not configured')) {
      return NextResponse.json({
        success: true,
        enabled: false,
        publicKey: null
      }, {
        status: 200,
        headers: {
          'Cache-Control': 'public, max-age=300, s-maxage=300, stale-while-revalidate=3600'
        }
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Unable to load push notification configuration.'
    }, { status: 500 });
  }
}

export const GET = withApiObservability(GET_impl);
