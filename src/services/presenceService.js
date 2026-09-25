import { supabase, isSupabaseConfigured } from '../lib/supabase/client';

let presenceChannel = null;
let isChannelSubscribed = false;
let currentTrackingPayload = null;
const presenceListeners = new Set();
let cachedOnlineEmails = new Set();

/**
 * Extracts all valid lowercased emails from Supabase presence state
 */
function extractOnlineEmails(state) {
  const set = new Set();
  if (!state || typeof state !== 'object') return set;

  Object.entries(state).forEach(([key, presences]) => {
    if (key && key !== 'guest' && key.includes('@')) {
      set.add(key.toLowerCase().trim());
    }
    if (Array.isArray(presences)) {
      presences.forEach(p => {
        const em = (p?.email || p?.key || '').toLowerCase().trim();
        if (em && em.includes('@')) {
          set.add(em);
        }
      });
    }
  });
  return set;
}

/**
 * Notifies all subscribers with the updated Set of online emails
 */
function notifySubscribers() {
  if (!presenceChannel) return;
  try {
    const state = presenceChannel.presenceState();
    cachedOnlineEmails = extractOnlineEmails(state);
    presenceListeners.forEach(listener => {
      try {
        listener(new Set(cachedOnlineEmails));
      } catch (err) {
        console.warn('[PresenceService] Listener notification error:', err);
      }
    });
  } catch (err) {
    console.warn('[PresenceService] Error reading presence state:', err);
  }
}

/**
 * Ensures the singleton presence channel is initialized and subscribed exactly ONCE.
 * Safely purges any stale channel instance to prevent "callbacks after subscribe" error.
 */
function initPresenceChannel() {
  if (!isSupabaseConfigured || !supabase) return null;
  if (presenceChannel) return presenceChannel;

  try {
    // Purge any stale pre-existing channel with this topic to guarantee fresh subscription
    if (typeof supabase.getChannels === 'function') {
      const existing = supabase.getChannels().find(ch => ch.topic === 'realtime:bdigitizing-live-presence');
      if (existing) {
        try { supabase.removeChannel(existing); } catch {}
      }
    }

    presenceChannel = supabase.channel('bdigitizing-live-presence');

    // Register all presence listeners BEFORE subscribe() is called
    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        notifySubscribers();
      })
      .on('presence', { event: 'join' }, () => {
        notifySubscribers();
      })
      .on('presence', { event: 'leave' }, () => {
        notifySubscribers();
      });

    presenceChannel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        isChannelSubscribed = true;
        if (currentTrackingPayload) {
          try {
            await presenceChannel.track(currentTrackingPayload);
          } catch (trackErr) {
            console.warn('[PresenceService] Track error on subscribe:', trackErr);
          }
        }
        notifySubscribers();
      }
    });

    return presenceChannel;
  } catch (err) {
    console.warn('[PresenceService] Channel initialization error:', err);
    return null;
  }
}

/**
 * Subscribe to online presence changes across the application.
 * Returns an unsubscribe cleanup function.
 */
export function subscribeToPresence(callback) {
  if (typeof callback !== 'function') return () => {};

  presenceListeners.add(callback);

  // Initialize shared channel once
  initPresenceChannel();

  // Immediately notify with currently cached online emails
  try {
    callback(new Set(cachedOnlineEmails));
  } catch {}

  return () => {
    presenceListeners.delete(callback);
  };
}

/**
 * Broadcast current user presence (both via Realtime channel and REST heartbeat)
 */
export async function trackUserPresence({ email, name = '', role = 'client', conversationId = null }) {
  if (!email || typeof email !== 'string') return;
  const cleanEmail = email.toLowerCase().trim();

  currentTrackingPayload = {
    email: cleanEmail,
    name,
    role,
    conversation_id: conversationId,
    online_at: new Date().toISOString()
  };

  const ch = initPresenceChannel();
  if (ch && isChannelSubscribed) {
    try {
      await ch.track(currentTrackingPayload);
    } catch (err) {
      console.warn('[PresenceService] Realtime track notice:', err);
    }
  }

  // REST heartbeat fallback
  try {
    fetch('/api/chat/presence', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: cleanEmail, status: 'online', role })
    }).catch(() => {});
  } catch {}
}

/**
 * Stop tracking user presence (on logout or tab close)
 */
export async function untrackUserPresence(email) {
  if (!email) return;
  const cleanEmail = email.toLowerCase().trim();

  if (currentTrackingPayload?.email === cleanEmail) {
    currentTrackingPayload = null;
  }

  if (presenceChannel && isChannelSubscribed) {
    try {
      await presenceChannel.untrack();
    } catch {}
  }

  // Send offline status via Beacon or fetch
  try {
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      navigator.sendBeacon('/api/chat/presence', JSON.stringify({ email: cleanEmail, status: 'offline' }));
    } else {
      fetch('/api/chat/presence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, status: 'offline' })
      }).catch(() => {});
    }
  } catch {}
}

/**
 * Poll REST endpoint for presence and merge into cache
 */
export async function syncPresenceFromRest() {
  try {
    const res = await fetch('/api/chat/presence');
    const data = await res.json();
    if (Array.isArray(data?.onlineUsers)) {
      data.onlineUsers.forEach(em => {
        if (em && em.includes('@')) {
          cachedOnlineEmails.add(em.toLowerCase().trim());
        }
      });
      presenceListeners.forEach(listener => {
        try { listener(new Set(cachedOnlineEmails)); } catch {}
      });
    }
  } catch {}
}
