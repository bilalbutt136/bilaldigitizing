/**
 * High-performance throttle, debounce, and navigation batching utility.
 * Prevents request stampedes and deduplicates tracking & presence calls
 * per route transition (enforcing a minimum 5-second interval).
 */

const STORAGE_PREFIX = 'bdigi_nav_dedupe:';
const inMemoryDedupeMap = new Map();

/**
 * Standard debounce utility with optional per-key tracking and maxWait.
 */
export function debounce(fn, waitMs = 300, { maxWait = null, keyFn = null } = {}) {
  const timers = new Map();
  const maxWaitTimers = new Map();

  const debounced = function(...args) {
    const key = typeof keyFn === 'function' ? String(keyFn(...args)) : '__default__';
    const context = this;

    const execute = () => {
      timers.delete(key);
      maxWaitTimers.delete(key);
      return fn.apply(context, args);
    };

    if (timers.has(key)) {
      clearTimeout(timers.get(key));
    }

    timers.set(key, setTimeout(execute, waitMs));

    if (maxWait && !maxWaitTimers.has(key)) {
      maxWaitTimers.set(key, setTimeout(execute, maxWait));
    }
  };

  debounced.cancel = (key = '__default__') => {
    if (timers.has(key)) {
      clearTimeout(timers.get(key));
      timers.delete(key);
    }
    if (maxWaitTimers.has(key)) {
      clearTimeout(maxWaitTimers.get(key));
      maxWaitTimers.delete(key);
    }
  };

  debounced.cancelAll = () => {
    timers.forEach(t => clearTimeout(t));
    maxWaitTimers.forEach(t => clearTimeout(t));
    timers.clear();
    maxWaitTimers.clear();
  };

  return debounced;
}

/**
 * Standard throttle utility with leading/trailing execution controls and per-key isolation.
 */
export function throttle(fn, waitMs = 5000, { leading = true, trailing = false, keyFn = null } = {}) {
  const lastExecMap = new Map();
  const trailingTimers = new Map();

  const throttled = function(...args) {
    const key = typeof keyFn === 'function' ? String(keyFn(...args)) : '__default__';
    const now = Date.now();
    const lastExec = lastExecMap.get(key) || 0;
    const elapsed = now - lastExec;
    const context = this;

    if (elapsed >= waitMs) {
      if (trailingTimers.has(key)) {
        clearTimeout(trailingTimers.get(key));
        trailingTimers.delete(key);
      }
      if (leading) {
        lastExecMap.set(key, now);
        return fn.apply(context, args);
      }
      lastExecMap.set(key, now);
    } else if (trailing && !trailingTimers.has(key)) {
      const remaining = waitMs - elapsed;
      trailingTimers.set(
        key,
        setTimeout(() => {
          trailingTimers.delete(key);
          lastExecMap.set(key, Date.now());
          fn.apply(context, args);
        }, remaining)
      );
    }
  };

  throttled.cancel = (key = '__default__') => {
    if (trailingTimers.has(key)) {
      clearTimeout(trailingTimers.get(key));
      trailingTimers.delete(key);
    }
  };

  throttled.reset = (key = null) => {
    if (key) {
      lastExecMap.delete(key);
      if (trailingTimers.has(key)) {
        clearTimeout(trailingTimers.get(key));
        trailingTimers.delete(key);
      }
    } else {
      lastExecMap.clear();
      trailingTimers.forEach(t => clearTimeout(t));
      trailingTimers.clear();
    }
  };

  return throttled;
}

/**
 * Checks whether an action for a specific key (e.g. route path, event name, user presence)
 * should be allowed or deduplicated within a minimum interval (default 5000ms).
 * Leverages in-memory Map and sessionStorage (where available) to persist across fast re-renders.
 *
 * @param {string} key Identifier for the route transition or event
 * @param {number} minIntervalMs Minimum elapsed milliseconds before allowing again (min: 5000ms)
 * @returns {boolean} true if allowed (and updates timestamp), false if throttled/deduplicated
 */
export function dedupeRouteTransition(key, minIntervalMs = 5000) {
  if (!key) return true;
  const safeInterval = Math.max(5000, Number(minIntervalMs) || 5000);
  const now = Date.now();
  const cleanKey = String(key).trim().toLowerCase();

  // 1. In-memory check
  const memLastTime = inMemoryDedupeMap.get(cleanKey) || 0;
  if (now - memLastTime < safeInterval) {
    return false;
  }

  // 2. Session storage check (survives SPA route re-mounts & fast transitions)
  if (typeof window !== 'undefined' && window.sessionStorage) {
    try {
      const stored = Number(window.sessionStorage.getItem(`${STORAGE_PREFIX}${cleanKey}`) || 0);
      if (now - stored < safeInterval) {
        inMemoryDedupeMap.set(cleanKey, Math.max(memLastTime, stored));
        return false;
      }
      window.sessionStorage.setItem(`${STORAGE_PREFIX}${cleanKey}`, String(now));
    } catch {}
  }

  inMemoryDedupeMap.set(cleanKey, now);

  // Evict old entries to prevent memory leak
  if (inMemoryDedupeMap.size > 200) {
    for (const [k, ts] of inMemoryDedupeMap.entries()) {
      if (now - ts > safeInterval * 2) {
        inMemoryDedupeMap.delete(k);
      }
    }
  }

  return true;
}

/**
 * Resets transition deduplication history (useful for testing or explicit full reload).
 */
export function resetRouteTransitionDedupe(key = null) {
  if (key) {
    const cleanKey = String(key).trim().toLowerCase();
    inMemoryDedupeMap.delete(cleanKey);
    if (typeof window !== 'undefined' && window.sessionStorage) {
      try {
        window.sessionStorage.removeItem(`${STORAGE_PREFIX}${cleanKey}`);
      } catch {}
    }
  } else {
    inMemoryDedupeMap.clear();
    if (typeof window !== 'undefined' && window.sessionStorage) {
      try {
        for (let i = window.sessionStorage.length - 1; i >= 0; i -= 1) {
          const k = window.sessionStorage.key(i);
          if (k?.startsWith(STORAGE_PREFIX)) {
            window.sessionStorage.removeItem(k);
          }
        }
      } catch {}
    }
  }
}

/**
 * Batched Route Tracker:
 * Gathers and deduplicates tracking events per route transition so rapid consecutive calls
 * (such as PageView + ViewContent on mount) coalesce into a single HTTP dispatch.
 */
export function createBatchedRouteTracker(dispatchFn, { minIntervalMs = 5000, debounceMs = 250 } = {}) {
  const safeInterval = Math.max(5000, Number(minIntervalMs) || 5000);
  let pendingEvents = [];
  let pendingTimeout = null;

  const flush = () => {
    if (pendingTimeout) {
      clearTimeout(pendingTimeout);
      pendingTimeout = null;
    }
    if (pendingEvents.length === 0) return;

    const eventsToProcess = [...pendingEvents];
    pendingEvents = [];

    // Group by normalized page path
    const byPath = new Map();
    for (const ev of eventsToProcess) {
      const path = String(ev?.pagePath || (typeof window !== 'undefined' ? window.location.pathname : '') || '/').toLowerCase().trim();
      if (!byPath.has(path)) {
        byPath.set(path, []);
      }
      byPath.get(path).push(ev);
    }

    byPath.forEach((events, path) => {
      // Deduplicate per route transition
      const dedupeKey = `tracking_route:${path}`;
      if (!dedupeRouteTransition(dedupeKey, safeInterval)) {
        return;
      }

      // Pick the primary event (prioritizing high-intent conversion/standard events over plain PageView)
      const primary = events.find(e => e.eventName && e.eventName !== 'PageView') || events[0];
      if (primary && typeof dispatchFn === 'function') {
        try {
          dispatchFn(primary);
        } catch (err) {
          console.warn('[BatchedRouteTracker] Dispatch error:', err);
        }
      }
    });
  };

  const track = (eventData) => {
    if (!eventData || typeof eventData !== 'object') return;
    pendingEvents.push(eventData);

    if (pendingTimeout) {
      clearTimeout(pendingTimeout);
    }
    pendingTimeout = setTimeout(flush, debounceMs);
  };

  track.flush = flush;
  track.cancel = () => {
    if (pendingTimeout) {
      clearTimeout(pendingTimeout);
      pendingTimeout = null;
    }
    pendingEvents = [];
  };

  return track;
}

/**
 * Presence Route Transition Coordinator:
 * Debounces offline un-tracking by 5 seconds so route navigation within the SPA
 * cancels the pending offline call instead of ping-ponging /api/chat/presence.
 */
export function createPresenceCoordinator({
  onOnline,
  onOffline,
  minIntervalMs = 5000,
  offlineDebounceMs = 5000
} = {}) {
  const safeInterval = Math.max(5000, Number(minIntervalMs) || 5000);
  const safeOfflineDebounce = Math.max(5000, Number(offlineDebounceMs) || 5000);

  let pendingOfflineTimer = null;
  let lastOnlineAt = 0;
  let activePayload = null;

  return {
    trackOnline(payload) {
      // 1. Immediately cancel any scheduled offline untrack (route navigation occurred)
      if (pendingOfflineTimer) {
        clearTimeout(pendingOfflineTimer);
        pendingOfflineTimer = null;
      }

      activePayload = payload;
      const now = Date.now();
      const email = String(payload?.email || '').toLowerCase().trim();
      const dedupeKey = `presence_online:${email}`;

      // Deduplicate rapid consecutive online calls (min 5 seconds)
      if (now - lastOnlineAt < safeInterval || !dedupeRouteTransition(dedupeKey, safeInterval)) {
        return;
      }

      lastOnlineAt = now;
      if (typeof onOnline === 'function') {
        onOnline(payload);
      }
    },

    untrackOffline(email) {
      if (pendingOfflineTimer) {
        clearTimeout(pendingOfflineTimer);
      }

      // Delay offline call by 5 seconds: if user navigated to a new route in the app,
      // the new route's trackOnline will cancel this offline call before it fires.
      pendingOfflineTimer = setTimeout(() => {
        pendingOfflineTimer = null;
        activePayload = null;
        const cleanEmail = String(email || '').toLowerCase().trim();
        const dedupeKey = `presence_offline:${cleanEmail}`;
        if (!dedupeRouteTransition(dedupeKey, safeInterval)) {
          return;
        }
        if (typeof onOffline === 'function') {
          onOffline(cleanEmail);
        }
      }, safeOfflineDebounce);
    },

    cancelPendingOffline() {
      if (pendingOfflineTimer) {
        clearTimeout(pendingOfflineTimer);
        pendingOfflineTimer = null;
      }
    },

    reset() {
      if (pendingOfflineTimer) {
        clearTimeout(pendingOfflineTimer);
        pendingOfflineTimer = null;
      }
      lastOnlineAt = 0;
      activePayload = null;
    }
  };
}
