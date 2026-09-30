import { supabase, isSupabaseConfigured } from '../lib/supabase/client';

let presenceChannel = null;
let isChannelSubscribed = false;
let currentTrackingPayload = null;
let presenceSessionId = null;
const presenceListeners = new Set();
let realtimeOnlineEmails = new Set();
let restOnlineEmails = new Set();

function isValidPresenceSessionId(value) {
  return /^[a-zA-Z0-9_-]{8,128}$/.test(String(value || ''));
}

function getPresenceSessionId() {
  if (presenceSessionId) return presenceSessionId;

  if (typeof window !== 'undefined') {
    try {
      const existing = window.sessionStorage.getItem('bdigi_presence_session_id');
      if (isValidPresenceSessionId(existing)) {
        presenceSessionId = existing;
        return presenceSessionId;
      }
    } catch {}

    try {
      if (globalThis.crypto?.randomUUID) {
        presenceSessionId = globalThis.crypto.randomUUID();
      }
    } catch {}

    if (!presenceSessionId) {
      presenceSessionId = `presence_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 12)}`;
    }

    try {
      window.sessionStorage.setItem('bdigi_presence_session_id', presenceSessionId);
    } catch {}

    return presenceSessionId;
  }

  if (!presenceSessionId) {
    presenceSessionId = `presence_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 12)}`;
  }
  return presenceSessionId;
}

function extractOnlineEmails(state) {
  const set = new Set();
  if (!state || typeof state !== 'object') return set;

  Object.entries(state).forEach(([key, presences]) => {
    if (key && key !== 'guest' && key.includes('@')) {
      set.add(key.toLowerCase().trim());
    }
    if (Array.isArray(presences)) {
      presences.forEach(presence => {
        const email = String(presence?.email || presence?.key || '').toLowerCase().trim();
        if (email && email.includes('@')) set.add(email);
      });
    }
  });

  return set;
}

function getCombinedPresence() {
  return new Set([...restOnlineEmails, ...realtimeOnlineEmails]);
}

function emitPresence() {
  const snapshot = getCombinedPresence();
  presenceListeners.forEach(listener => {
    try {
      listener(new Set(snapshot));
    } catch (err) {
      console.warn('[PresenceService] Listener notification error:', err);
    }
  });
}

function syncRealtimePresenceState() {
  if (!presenceChannel) {
    realtimeOnlineEmails = new Set();
    emitPresence();
    return;
  }

  try {
    realtimeOnlineEmails = extractOnlineEmails(presenceChannel.presenceState());
    emitPresence();
  } catch (err) {
    console.warn('[PresenceService] Error reading presence state:', err);
  }
}

function resetRealtimeChannel() {
  isChannelSubscribed = false;
  realtimeOnlineEmails = new Set();

  if (presenceChannel && supabase) {
    try {
      supabase.removeChannel(presenceChannel);
    } catch {}
  }

  presenceChannel = null;
  emitPresence();
}

function initPresenceChannel() {
  if (!isSupabaseConfigured || !supabase) return null;
  if (presenceChannel) return presenceChannel;

  try {
    if (typeof supabase.getChannels === 'function') {
      const existing = supabase.getChannels().find(
        channel => channel.topic === 'realtime:bdigitizing-live-presence'
      );
      if (existing) {
        try {
          supabase.removeChannel(existing);
        } catch {}
      }
    }

    presenceChannel = supabase.channel('bdigitizing-live-presence');

    presenceChannel
      .on('presence', { event: 'sync' }, syncRealtimePresenceState)
      .on('presence', { event: 'join' }, syncRealtimePresenceState)
      .on('presence', { event: 'leave' }, syncRealtimePresenceState);

    presenceChannel.subscribe(async status => {
      if (status === 'SUBSCRIBED') {
        isChannelSubscribed = true;

        if (currentTrackingPayload) {
          try {
            await presenceChannel.track(currentTrackingPayload);
          } catch (trackErr) {
            console.warn('[PresenceService] Track error on subscribe:', trackErr);
          }
        }

        syncRealtimePresenceState();
        return;
      }

      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
        resetRealtimeChannel();
        setTimeout(() => {
          initPresenceChannel();
        }, 2000);
      }
    });

    return presenceChannel;
  } catch (err) {
    console.warn('[PresenceService] Channel initialization error:', err);
    resetRealtimeChannel();
    return null;
  }
}

export function subscribeToPresence(callback) {
  if (typeof callback !== 'function') return () => {};

  presenceListeners.add(callback);
  initPresenceChannel();

  try {
    callback(getCombinedPresence());
  } catch {}

  return () => {
    presenceListeners.delete(callback);
  };
}

export async function trackUserPresence({
  email,
  name = '',
  role = 'client',
  conversationId = null
}) {
  if (!email || typeof email !== 'string') return;

  const cleanEmail = email.toLowerCase().trim();
  const sessionId = getPresenceSessionId();

  currentTrackingPayload = {
    email: cleanEmail,
    name,
    role,
    conversation_id: conversationId,
    session_id: sessionId,
    online_at: new Date().toISOString()
  };

  const channel = initPresenceChannel();
  let realtimeTracked = false;
  if (channel && isChannelSubscribed) {
    try {
      await channel.track(currentTrackingPayload);
      realtimeTracked = true;
    } catch (err) {
      console.warn('[PresenceService] Realtime track notice:', err);
    }
  }

  // Supabase Presence is connection-based and already survives while the WebSocket is open.
  // Do not invoke a Vercel function on every heartbeat when Realtime is healthy.
  if (realtimeTracked) return;

  try {
    const response = await fetch('/api/chat/presence', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      cache: 'no-store',
      body: JSON.stringify({
        status: 'online',
        sessionId,
        conversationId
      })
    });

    if (!response.ok && response.status !== 401) {
      console.warn('[PresenceService] REST heartbeat failed:', response.status);
    }
  } catch {}
}

export async function untrackUserPresence(email) {
  if (!email) return;

  const cleanEmail = email.toLowerCase().trim();
  const sessionId = getPresenceSessionId();

  if (currentTrackingPayload?.email === cleanEmail) {
    currentTrackingPayload = null;
  }

  let realtimeUntracked = false;
  if (presenceChannel && isChannelSubscribed) {
    try {
      await presenceChannel.untrack();
      realtimeUntracked = true;
    } catch {}
  }

  // A successful Realtime untrack is authoritative; only use REST/beacon as fallback.
  if (realtimeUntracked) return;

  const body = JSON.stringify({
    status: 'offline',
    sessionId
  });

  try {
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      const payload = typeof Blob !== 'undefined'
        ? new Blob([body], { type: 'application/json' })
        : body;
      navigator.sendBeacon('/api/chat/presence', payload);
    } else {
      fetch('/api/chat/presence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        cache: 'no-store',
        body,
        keepalive: true
      }).catch(() => {});
    }
  } catch {}
}

export async function syncPresenceFromRest() {
  try {
    const response = await fetch('/api/chat/presence', {
      credentials: 'include',
      cache: 'no-store'
    });

    if (!response.ok) {
      if (response.status === 401) {
        restOnlineEmails = new Set();
        emitPresence();
      }
      return;
    }

    const data = await response.json();
    const nextRestPresence = new Set();

    if (Array.isArray(data?.onlineUsers)) {
      data.onlineUsers.forEach(email => {
        const cleanEmail = String(email || '').toLowerCase().trim();
        if (cleanEmail && cleanEmail.includes('@')) {
          nextRestPresence.add(cleanEmail);
        }
      });
    }

    restOnlineEmails = nextRestPresence;
    emitPresence();
  } catch {}
}
