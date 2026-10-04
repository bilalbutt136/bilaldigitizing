import { NextResponse } from 'next/server';
import { withApiObservability } from '../../../../src/lib/observability/apiObservability.js';
import { enforceApiBurstLimit } from '../../../../src/lib/apiBurstGuard.js';
import { supabaseAdmin, hasServiceRole } from '../../../../src/lib/supabaseAdmin';
import {
  getAdminMfaPolicy,
  getServerAuthUser,
  invalidateAdminMfaPolicyCache
} from '../../../../src/lib/supabase/serverAuth';

async function GET_impl(request) {
  const burstResponse = enforceApiBurstLimit(request, 'admin-mfa-policy-get', 60, 60_000);
  if (burstResponse) return burstResponse;

  try {
    const { user, isAdminIdentity, authLevel } = await getServerAuthUser(request);
    if (!user || !isAdminIdentity) {
      return NextResponse.json(
        { success: false, error: 'Administrator identity required.' },
        { status: 403 }
      );
    }

    const enabled = await getAdminMfaPolicy(null, { force: false });
    return NextResponse.json({
      success: true,
      enabled,
      currentLevel: authLevel || 'aal1',
      verified: authLevel === 'aal2'
    }, {
      headers: {
        'Cache-Control': 'private, max-age=15, stale-while-revalidate=30'
      }
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Unable to load MFA policy.' },
      { status: 500 }
    );
  }
}

async function PUT_impl(request) {
  const burstResponse = enforceApiBurstLimit(request, 'admin-mfa-policy-put', 20, 60_000);
  if (burstResponse) return burstResponse;

  try {
    if (!hasServiceRole || !supabaseAdmin) {
      return NextResponse.json(
        { success: false, error: 'Server security configuration is unavailable.' },
        { status: 500 }
      );
    }

    const auth = await getServerAuthUser(request);
    if (!auth?.user || !auth?.isAdminIdentity) {
      return NextResponse.json(
        { success: false, error: 'Administrator identity required.' },
        { status: 403 }
      );
    }

    const currentEnabled = await getAdminMfaPolicy(null, { force: true });

    // Disabling an already-enforced MFA policy requires the current session
    // itself to have completed MFA. This prevents a password-only session from
    // weakening the protection that is currently active.
    if (currentEnabled && !auth.isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Complete two-factor verification before disabling MFA.' },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    if (typeof body?.enabled !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'enabled must be true or false.' },
        { status: 400 }
      );
    }

    const enabled = body.enabled;
    const { error } = await supabaseAdmin
      .from('admin_security_settings')
      .upsert({
        id: 1,
        mfa_enabled: enabled,
        updated_at: new Date().toISOString(),
        updated_by: auth.user.email || null
      }, { onConflict: 'id' });

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    invalidateAdminMfaPolicyCache();

    return NextResponse.json({
      success: true,
      enabled,
      message: enabled
        ? 'Two-factor authentication is now required for administrators.'
        : 'Two-factor authentication is now optional for administrators.'
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Unable to update MFA policy.' },
      { status: 500 }
    );
  }
}

export const GET = withApiObservability(GET_impl);
export const PUT = withApiObservability(PUT_impl);
