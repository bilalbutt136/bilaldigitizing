import { withApiObservability } from '../../../../src/lib/observability/apiObservability.js';
import { NextResponse } from 'next/server';
import { getServerAuthUser } from '../../../../src/lib/supabase/serverAuth';
import { enforceApiBurstLimit } from '../../../../src/lib/apiBurstGuard.js';

// POST /api/admin/session
// Verifies that the caller is an authenticated Supabase user whose email
// is whitelisted in the public.admins table or is the master admin.
// Verified strictly server-side using tokens/cookies.
async function POST_impl(request) {
  const burstResponse = enforceApiBurstLimit(request, 'admin-session-post', 60, 60_000);
  if (burstResponse) return burstResponse;

  try {
    const { user, isAdmin, isAdminIdentity, authLevel, mfaEnabled, mfaRequired } = await getServerAuthUser(request);

    if (!user) {
      return NextResponse.json(
        { success: false, isAdmin: false, error: 'Unauthenticated' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      isAdmin: Boolean(isAdminIdentity),
      mfaEnabled: Boolean(mfaEnabled),
      mfaVerified: authLevel === 'aal2',
      authLevel: authLevel || 'aal1',
      mfaRequired: Boolean(mfaRequired),
      adminAuthorized: Boolean(isAdmin),
      admin: isAdminIdentity ? { email: user.email } : null
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err.message || 'Session verification failed.' },
      { status: 500 }
    );
  }
}

export const POST = withApiObservability(POST_impl);
