import { withApiObservability } from '../../../../src/lib/observability/apiObservability.js';
import { NextResponse } from 'next/server';
import { createAdminClient } from '../../../../src/lib/supabase/admin';
import { getServerAuthUser } from '../../../../src/lib/supabase/serverAuth';
import { enforceApiBurstLimit } from '../../../../src/lib/apiBurstGuard.js';

export const dynamic = 'force-dynamic';

const PRESENCE_TTL_MS = 150 * 1000;
const SESSION_ID_REGEX = /^[a-zA-Z0-9_-]{8,128}$/;

function getPresenceExpiry(now = Date.now()) {
  return new Date(now + PRESENCE_TTL_MS).toISOString();
}

function normalizeSessionId(value) {
  const sessionId = String(value || '').trim();
  return SESSION_ID_REGEX.test(sessionId) ? sessionId : null;
}

async function GET_impl(request) {
  const burstResponse = enforceApiBurstLimit(request, 'chat-presence-get', 12, 60_000);
  if (burstResponse) return burstResponse;

  try {
    const { user } = await getServerAuthUser(request);
    if (!user?.email) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }

    const supabase = createAdminClient();
    const nowIso = new Date().toISOString();

    const { data, error } = await supabase
      .from('user_presence_sessions')
      .select('email, role, last_seen_at, expires_at')
      .eq('status', 'online')
      .gt('expires_at', nowIso)
      .order('last_seen_at', { ascending: false });

    if (error) {
      console.error('[Presence API GET] Query error:', error.message);
      return NextResponse.json({ error: 'Unable to load presence.' }, { status: 500 });
    }

    const byEmail = new Map();
    for (const row of data || []) {
      const email = String(row.email || '').toLowerCase().trim();
      if (!email) continue;
      if (!byEmail.has(email)) {
        byEmail.set(email, {
          email,
          role: row.role || 'client',
          lastSeenAt: row.last_seen_at,
          expiresAt: row.expires_at
        });
      }
    }

    return NextResponse.json({
      success: true,
      onlineUsers: Array.from(byEmail.keys()),
      presence: Array.from(byEmail.values()),
      count: byEmail.size,
      timestamp: Date.now()
    }, {
      headers: {
        'Cache-Control': 'private, max-age=30, stale-while-revalidate=60'
      }
    });
  } catch (error) {
    console.error('[Presence API GET] Unexpected error:', error);
    return NextResponse.json({ error: 'Unable to load presence.' }, { status: 500 });
  }
}

async function POST_impl(request) {
  const burstResponse = enforceApiBurstLimit(request, 'chat-presence-post', 12, 60_000);
  if (burstResponse) return burstResponse;

  try {
    const { user, isAdmin, isWorker } = await getServerAuthUser(request);
    if (!user?.email || !user?.id) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const status = String(body.status || 'online').toLowerCase().trim();
    if (!['online', 'offline'].includes(status)) {
      return NextResponse.json({ error: 'Invalid presence status.' }, { status: 400 });
    }

    const sessionId = normalizeSessionId(body.sessionId || body.session_id);
    if (!sessionId) {
      return NextResponse.json({ error: 'A valid presence session ID is required.' }, { status: 400 });
    }

    const email = user.email.toLowerCase().trim();
    const role = isAdmin ? 'admin' : (isWorker ? 'worker' : 'client');
    const nowIso = new Date().toISOString();
    const supabase = createAdminClient();

    if (status === 'online') {
      const { error } = await supabase
        .from('user_presence_sessions')
        .upsert([{
          user_id: user.id,
          session_id: sessionId,
          email,
          role,
          status: 'online',
          conversation_id: body.conversationId || body.conversation_id || null,
          last_seen_at: nowIso,
          expires_at: getPresenceExpiry(),
          updated_at: nowIso
        }], {
          onConflict: 'user_id,session_id'
        });

      if (error) {
        console.error('[Presence API POST] Heartbeat upsert error:', error.message);
        return NextResponse.json({ error: 'Unable to update presence.' }, { status: 500 });
      }
    } else {
      const { error } = await supabase
        .from('user_presence_sessions')
        .update({
          status: 'offline',
          last_seen_at: nowIso,
          expires_at: nowIso,
          updated_at: nowIso
        })
        .eq('user_id', user.id)
        .eq('session_id', sessionId);

      if (error) {
        console.error('[Presence API POST] Offline update error:', error.message);
        return NextResponse.json({ error: 'Unable to update presence.' }, { status: 500 });
      }
    }

    if (!isAdmin && !isWorker) {
      try {
        let effectiveStatus = status;

        if (status === 'offline') {
          const { data: activeSessions, error: activeSessionError } = await supabase
            .from('user_presence_sessions')
            .select('session_id')
            .eq('user_id', user.id)
            .eq('status', 'online')
            .gt('expires_at', nowIso)
            .limit(1);

          if (!activeSessionError && Array.isArray(activeSessions) && activeSessions.length > 0) {
            effectiveStatus = 'online';
          }
        }

        await supabase
          .from('conversations')
          .update({
            status: effectiveStatus,
            last_seen_at: nowIso,
            updated_at: nowIso
          })
          .ilike('client_email', email);
      } catch (dbErr) {
        console.warn('[Presence API Conversation Sync Notice]:', dbErr?.message);
      }
    }

    return NextResponse.json({
      success: true,
      email,
      role,
      status,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('[Presence API POST] Unexpected error:', error);
    return NextResponse.json({ error: 'Unable to update presence.' }, { status: 500 });
  }
}

export const GET = withApiObservability(GET_impl);
export const POST = withApiObservability(POST_impl);
