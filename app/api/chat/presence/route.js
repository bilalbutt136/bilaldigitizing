import { NextResponse } from 'next/server';
import { createAdminClient } from '../../../../src/lib/supabase/admin';

export const dynamic = 'force-dynamic';

// In-memory active presence cache for ultra-fast, zero-latency presence lookups
// Maps lowercased email -> { timestamp, role, lastSeen }
const activePresenceMap = new Map();
const PRESENCE_TTL_MS = 2.5 * 60 * 1000; // 2.5 minutes TTL for heartbeat expiration

export function pruneStalePresences() {
  const now = Date.now();
  for (const [email, data] of activePresenceMap.entries()) {
    if (now - data.timestamp > PRESENCE_TTL_MS) {
      activePresenceMap.delete(email);
    }
  }
}

export async function GET(request) {
  try {
    pruneStalePresences();
    const activeEmails = Array.from(activePresenceMap.keys());
    return NextResponse.json({
      success: true,
      onlineUsers: activeEmails,
      count: activeEmails.length,
      timestamp: Date.now()
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const rawEmail = body.email || body.clientEmail;
    const status = (body.status || 'online').toLowerCase().trim(); // 'online' | 'offline'

    if (!rawEmail || typeof rawEmail !== 'string') {
      return NextResponse.json({ error: 'Missing or invalid email' }, { status: 400 });
    }

    const email = rawEmail.toLowerCase().trim();
    const nowIso = new Date().toISOString();

    if (status === 'online') {
      activePresenceMap.set(email, {
        timestamp: Date.now(),
        lastSeen: nowIso,
        role: body.role || 'client'
      });
    } else {
      activePresenceMap.delete(email);
    }

    // Persist status and last_seen_at in Supabase conversations
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

    return NextResponse.json({
      success: true,
      email,
      status,
      timestamp: Date.now()
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
