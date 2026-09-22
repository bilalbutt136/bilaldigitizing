import { NextResponse } from 'next/server';
import { getPublicVapidKey } from '../../../../src/lib/pushService.js';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const publicKey = getPublicVapidKey();
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
