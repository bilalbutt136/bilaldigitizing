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
      publicKey
    });
  } catch (err) {
    return NextResponse.json({
      success: false,
      error: err.message
    }, { status: 500 });
  }
}

export const GET = withApiObservability(GET_impl);
