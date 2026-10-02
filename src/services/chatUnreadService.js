const CACHE_TTL_MS = 60_000;
const DEDUPING_INTERVAL_MS = 60_000;
const STORAGE_PREFIX = 'bdigi_chat_unread_v2:';
const cache = new Map();
const inFlight = new Map();
const lastRequestAt = new Map();
const authBlocked = new Set();

const ZERO_COUNTS = Object.freeze({ inbox: 0, support: 0, total: 0 });

function storageKey(identityKey) {
  return `${STORAGE_PREFIX}${identityKey}`;
}

function readSharedState(identityKey) {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(storageKey(identityKey));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeSharedState(identityKey, state) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(storageKey(identityKey), JSON.stringify(state));
  } catch {}
}

function normalizeCounts(data) {
  return {
    inbox: Number(data?.inbox || 0),
    support: Number(data?.support || 0),
    total: Number(data?.total || 0)
  };
}

function getBestCachedState(identityKey) {
  const memory = cache.get(identityKey);
  const shared = readSharedState(identityKey);

  if (shared?.data) {
    const normalizedShared = {
      data: normalizeCounts(shared.data),
      expiresAt: Number(shared.expiresAt || 0),
      lastRequestAt: Number(shared.lastRequestAt || 0)
    };
    if (!memory || normalizedShared.expiresAt > Number(memory.expiresAt || 0)) {
      cache.set(identityKey, normalizedShared);
      return normalizedShared;
    }
  }

  return memory || null;
}

export async function fetchChatUnreadCounts({ email = '', isAdmin = false, force = false } = {}) {
  const identityKey = isAdmin ? 'admin' : String(email || '').toLowerCase().trim();
  if (!identityKey) return ZERO_COUNTS;

  if (authBlocked.has(identityKey)) {
    return ZERO_COUNTS;
  }

  const now = Date.now();
  const cached = getBestCachedState(identityKey);

  // Background tabs never wake a Vercel function. Realtime/local state remains
  // authoritative until the tab is active again.
  if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
    return cached?.data || ZERO_COUNTS;
  }

  if (!force && cached?.data && cached.expiresAt > now) {
    return cached.data;
  }

  if (inFlight.has(identityKey)) {
    return inFlight.get(identityKey);
  }

  // Hard minimum interval applies even to "force" refreshes and is shared
  // through localStorage so multiple mounted shells/tabs cannot stampede the API.
  const sharedLastRequestAt = Number(cached?.lastRequestAt || 0);
  const previousRequestAt = Math.max(lastRequestAt.get(identityKey) || 0, sharedLastRequestAt);
  if (now - previousRequestAt < DEDUPING_INTERVAL_MS) {
    return cached?.data || ZERO_COUNTS;
  }

  lastRequestAt.set(identityKey, now);
  writeSharedState(identityKey, {
    data: cached?.data || ZERO_COUNTS,
    expiresAt: Number(cached?.expiresAt || 0),
    lastRequestAt: now
  });

  const request = fetch('/api/chat/unread-counts', {
    credentials: 'include',
    cache: 'default'
  })
    .then(async response => {
      if (response.status === 401) {
        authBlocked.add(identityKey);
        cache.delete(identityKey);
        return ZERO_COUNTS;
      }

      if (!response.ok) {
        throw new Error(`Unread count request failed with ${response.status}`);
      }

      const normalized = normalizeCounts(await response.json());
      const state = {
        data: normalized,
        expiresAt: Date.now() + CACHE_TTL_MS,
        lastRequestAt: Date.now()
      };

      cache.set(identityKey, state);
      lastRequestAt.set(identityKey, state.lastRequestAt);
      writeSharedState(identityKey, state);
      return normalized;
    })
    .finally(() => {
      inFlight.delete(identityKey);
    });

  inFlight.set(identityKey, request);
  return request;
}

export function resetChatUnreadAuthBlock() {
  authBlocked.clear();
}

export function clearChatUnreadCache() {
  cache.clear();
  inFlight.clear();
  lastRequestAt.clear();
  authBlocked.clear();

  if (typeof window !== 'undefined') {
    try {
      for (let i = window.localStorage.length - 1; i >= 0; i -= 1) {
        const key = window.localStorage.key(i);
        if (key?.startsWith(STORAGE_PREFIX)) {
          window.localStorage.removeItem(key);
        }
      }
    } catch {}
  }
}
