import { NextResponse } from 'next/server';
import { getServerAuthUser } from '../../../../src/lib/supabase/serverAuth';

// POST /api/admin/session
// Verifies that the caller is an authenticated Supabase user whose email
// is whitelisted in the public.admins table or is the master admin.
// Verified strictly server-side using tokens/cookies.
export async function POST(request) {
  try {
    const { user, isAdmin } = await getServerAuthUser(request);

    if (!user) {
      return NextResponse.json(
        { success: false, isAdmin: false, error: 'Unauthenticated' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      isAdmin: Boolean(isAdmin),
      admin: isAdmin ? { email: user.email } : null
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err.message || 'Session verification failed.' },
      { status: 500 }
    );
  }
}
