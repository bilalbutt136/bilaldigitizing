import { withApiObservability } from '../../../../src/lib/observability/apiObservability.js';
import { NextResponse } from 'next/server';
import { createAdminClient } from '../../../../src/lib/supabase/admin';
import { getServerAuthUser, resolveTrustedUserAccess } from '../../../../src/lib/supabase/serverAuth';
import { enforceApiBurstLimit } from '../../../../src/lib/apiBurstGuard.js';

async function GET_impl(request) {
  const burstResponse = enforceApiBurstLimit(request, 'auth-profile-get', 90, 60_000);
  if (burstResponse) return burstResponse;

  try {
    const { user, isAdmin, isWorker } = await getServerAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const callerEmail = String(user.email || '').toLowerCase().trim();
    const { searchParams } = new URL(request.url);
    const requestedEmail = String(searchParams.get('email') || callerEmail).toLowerCase().trim();
    const isSelf = requestedEmail === callerEmail;

    if (!isAdmin && !isSelf) {
      return NextResponse.json({ error: 'Forbidden: Cannot access another user profile.' }, { status: 403 });
    }

    const supabase = createAdminClient();

    let role = isSelf
      ? (isAdmin ? 'admin' : (isWorker ? 'worker' : 'customer'))
      : 'customer';

    // Admin lookups for another account still use the same trusted one-RPC role resolver.
    if (!isSelf && isAdmin) {
      const targetAccess = await resolveTrustedUserAccess({ email: requestedEmail }, supabase);
      role = targetAccess.isAdmin ? 'admin' : (targetAccess.isWorker ? 'worker' : 'customer');
    }

    const { data: clientData, error: clientError } = await supabase
      .from('clients')
      .select('role, wallet_balance')
      .eq('email', requestedEmail)
      .maybeSingle();

    if (clientError) throw clientError;

    if (clientData && role === 'customer') {
      role = clientData.role || 'customer';
    }

    return NextResponse.json({
      role,
      balance: Number.parseFloat(clientData?.wallet_balance || 0) || 0
    });
  } catch (error) {
    console.error('[Auth Profile API GET]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export const GET = withApiObservability(GET_impl);
