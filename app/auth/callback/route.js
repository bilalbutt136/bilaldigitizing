import { NextResponse } from 'next/server';
import { createClient } from '../../../src/lib/supabase/server';

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  let next = (searchParams.get('next') || '/').trim();

  // Validate next URL to prevent open redirect vulnerabilities
  if (!next.startsWith('/') || next.startsWith('//') || next.includes('://')) {
    next = '/';
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/?error=auth-callback-failed`);
}
