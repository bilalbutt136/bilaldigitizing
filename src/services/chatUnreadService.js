const CACHE_TTL_MS = 60_000;
const DEDUPING_INTERVAL_MS = 45_000;
const cache = new Map();
const inFlight = new Map();
const lastRequestAt = new Map();
const authBlocked = new Set();

const ZERO_COUNTS = Object.freeze({ inbox: 0, support: 0, total: 0 });

export async function fetchChatUnreadCounts({ email = '', isAdmin = false, force = false } = {}) {
  const identityKey = isAdmin ? 'admin' : String(email || '').toLowerCase().trim();
  if (!identityKey) return ZERO_COUNTS;

  // A 401 means the browser credentials are no longer usable. Stop all repeated
  // unread requests for this identity until auth state explicitly resets the block.
  if (authBlocked.has(identityKey)) {
    return ZERO_COUNTS;
  }

  const now = Date.now();
  const cached = cache.get(identityKey);

  // Hidden tabs rely on Realtime state until the document becomes visible again.
  // This prevents background browser activity from waking a Vercel function.
  if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
    return cached?.data || ZERO_COUNTS;
  }

  if (!force && cached && cached.expiresAt > now) {
    return cached.data;
  }

  if (inFlight.has(identityKey)) {
    return inFlight.get(identityKey);
  }

  // Multiple mounted shells and Realtime callbacks can all request the same count.
  // Even "force" refreshes are deduped across components for at least 30 seconds.
  const previousRequestAt = lastRequestAt.get(identityKey) || 0;
  if (now - previousRequestAt < DEDUPING_INTERVAL_MS) {
    return cached?.data || ZERO_COUNTS;
  }

  lastRequestAt.set(identityKey, now);

  const request = fetch('/api/chat/unread-counts', {
    credentials: 'include',
    cache: 'no-store'
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

      const data = await response.json();
      const normalized = {
        inbox: Number(data?.inbox || 0),
        support: Number(data?.support || 0),
        total: Number(data?.total || 0)
      };

      cache.set(identityKey, {
        data: normalized,
        expiresAt: Date.now() + CACHE_TTL_MS
      });
      return normalized;
    })
    .finally(() => {
      inFlight.delete(identityKey);
    });

  inFlight.set(identityKey, request);
  return request;
}

export function clearChatUnreadCache() {
  cache.clear();
  inFlight.clear();
  lastRequestAt.clear();
  authBlocked.clear();
}
