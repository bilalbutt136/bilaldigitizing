import { NextResponse } from 'next/server';
import { createAdminClient } from '../../../../src/lib/supabase/admin';
import { getServerAuthUser } from '../../../../src/lib/supabase/serverAuth';

export const dynamic = 'force-dynamic';

const activePresenceMap = new Map();
const PRESENCE_TTL_MS = 2.5 * 60 * 1000;

export function pruneStalePresences() {
  const now = Date.now();
  for (const [email, data] of activePresenceMap.entries()) {
    if (now - data.timestamp > PRESENCE_TTL_MS) activePresenceMap.delete(email);
  }
}

export async function GET(request) {
  try {
    const { user } = await getServerAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });

    pruneStalePresences();
    const activeEmails = Array.from(activePresenceMap.keys());
    return NextResponse.json({ success: true, onlineUsers: activeEmails, count: activeEmails.length, timestamp: Date.now() });
  } catch {
    return NextResponse.json({ error: 'Unable to load presence.' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { user, isAdmin, isWorker } = await getServerAuthUser(request);
    if (!user?.email) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const status = String(body.status || 'online').toLowerCase().trim();
    if (!['online', 'offline'].includes(status)) {
      return NextResponse.json({ error: 'Invalid presence status.' }, { status: 400 });
    }

    const email = user.email.toLowerCase().trim();
    const role = isAdmin ? 'admin' : (isWorker ? 'worker' : 'client');
    const nowIso = new Date().toISOString();

    if (status === 'online') {
      activePresenceMap.set(email, { timestamp: Date.now(), lastSeen: nowIso, role });
    } else {
      activePresenceMap.delete(email);
    }

    if (!isAdmin && !isWorker) {
      try {
        const supabase = createAdminClient();
        await supabase
          .from('conversations')
          .update({
            status: status === 'online' ? 'online' : 'offline',
            last_seen_at: nowIso,
            updated_at: nowIso
          })
          .ilike('client_email', email);
      } catch (dbErr) {
        console.warn('[Presence API Notice]:', dbErr.message);
      }
    }

    return NextResponse.json({ success: true, email, role, status, timestamp: Date.now() });
  } catch {
    return NextResponse.json({ error: 'Unable to update presence.' }, { status: 500 });
  }
}
