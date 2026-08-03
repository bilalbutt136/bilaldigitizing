import { NextResponse } from 'next/server';

export async function GET(request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') || '/client-portal';

  // Server-side redirect after OAuth code exchange
  return NextResponse.redirect(new URL(next, requestUrl.origin));
}
