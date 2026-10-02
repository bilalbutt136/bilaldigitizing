import { withApiObservability } from '../../../../src/lib/observability/apiObservability.js';
import { NextResponse } from 'next/server';
import { supabaseAdmin, hasServiceRole } from '../../../../src/lib/supabaseAdmin';
import { getServerAuthUser } from '../../../../src/lib/supabase/serverAuth';
import { enforceApiBurstLimit } from '../../../../src/lib/apiBurstGuard.js';

const NOTIFICATION_FIELDS = 'id, user_id, recipient_role, recipient_email, title, message, type, link, order_id, read, created_at, updated_at';

async function requireAdmin(request) {
  if (!hasServiceRole || !supabaseAdmin) {
    return {
      response: NextResponse.json(
        { success: false, error: 'Notification history service is unavailable.' },
        { status: 503 }
      )
    };
  }

  const { user, isAdmin } = await getServerAuthUser(request);
  if (!user?.email || !isAdmin) {
    return {
      response: NextResponse.json(
        { success: false, error: 'Administrator privileges required.' },
        { status: 403 }
      )
    };
  }

  return { user };
}

// Server-authoritative notification history. This intentionally bypasses
// browser RLS/session timing issues after the admin identity is verified.
async function GET_impl(request) {
  const burstResponse = enforceApiBurstLimit(request, 'admin-notification-history-get', 30, 60_000);
  if (burstResponse) return burstResponse;

  try {
    const auth = await requireAdmin(request);
    if (auth.response) return auth.response;

    const { searchParams } = new URL(request.url);
    const requestedLimit = Number(searchParams.get('limit') || 100);
    const limit = Math.min(200, Math.max(20, Number.isFinite(requestedLimit) ? requestedLimit : 100));

    const { data, error } = await supabaseAdmin
      .from('notifications')
      .select(NOTIFICATION_FIELDS)
      .in('recipient_role', ['admin', 'all'])
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[Admin Notification History Error]:', error.message);
      return NextResponse.json(
        { success: false, error: 'Unable to load notification history.' },
        { status: 500, headers: { 'Cache-Control': 'no-store' } }
      );
    }

    return NextResponse.json(
      { success: true, notifications: data || [] },
      { headers: { 'Cache-Control': 'private, no-cache' } }
    );
  } catch (error) {
    console.error('[Admin Notification History Failure]:', error);
    return NextResponse.json(
      { success: false, error: 'Unable to load notification history.' },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}

async function PATCH_impl(request) {
  const burstResponse = enforceApiBurstLimit(request, 'admin-notification-history-patch', 30, 60_000);
  if (burstResponse) return burstResponse;

  try {
    const auth = await requireAdmin(request);
    if (auth.response) return auth.response;

    const body = await request.json().catch(() => ({}));
    const action = String(body?.action || '').toLowerCase().trim();
    const id = body?.id ? String(body.id).trim() : '';

    if (action === 'mark_all_read') {
      const { error } = await supabaseAdmin
        .from('notifications')
        .update({ read: true, updated_at: new Date().toISOString() })
        .in('recipient_role', ['admin', 'all'])
        .eq('read', false);

      if (error) {
        return NextResponse.json({ success: false, error: 'Unable to mark notification history as read.' }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    if (action === 'mark_read' && id) {
      const { data, error } = await supabaseAdmin
        .from('notifications')
        .update({ read: true, updated_at: new Date().toISOString() })
        .eq('id', id)
        .in('recipient_role', ['admin', 'all'])
        .select('id, read, updated_at')
        .maybeSingle();

      if (error) {
        return NextResponse.json({ success: false, error: 'Unable to mark notification as read.' }, { status: 500 });
      }

      return NextResponse.json({ success: true, notification: data || null });
    }

    return NextResponse.json(
      { success: false, error: 'Unsupported notification history action.' },
      { status: 400 }
    );
  } catch (error) {
    console.error('[Admin Notification History Update Failure]:', error);
    return NextResponse.json(
      { success: false, error: 'Unable to update notification history.' },
      { status: 500 }
    );
  }
}

export const GET = withApiObservability(GET_impl);
export const PATCH = withApiObservability(PATCH_impl);
