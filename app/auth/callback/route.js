import { NextResponse } from 'next/server';
import { createClient } from '../../../src/lib/supabase/server';

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type') || 'recovery';
  const errorParam = searchParams.get('error_description') || searchParams.get('error');
  let next = (searchParams.get('next') || '/').trim();

  // Validate next URL to prevent open redirect vulnerabilities
  if (!next.startsWith('/') || next.startsWith('//') || next.includes('://')) {
    next = '/';
  }

  // If Supabase returned an auth error (e.g. token expired, already used)
  if (errorParam) {
    const redirectUrl = new URL(`${origin}${next}`);
    redirectUrl.searchParams.set('error', errorParam);
    return NextResponse.redirect(redirectUrl.toString());
  }

  // 1. Exchange PKCE code for session
  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // 2. Verify token_hash OTP if present
  if (tokenHash) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Return the user to the destination or home with error
  const fallbackUrl = new URL(next !== '/' ? `${origin}${next}` : `${origin}/`);
  fallbackUrl.searchParams.set('error', 'auth-callback-failed');
  return NextResponse.redirect(fallbackUrl.toString());
}
