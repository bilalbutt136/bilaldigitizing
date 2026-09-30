const CACHE_TTL_MS = 5000;
const cache = new Map();
const inFlight = new Map();

export async function fetchChatUnreadCounts({ email = '', isAdmin = false, force = false } = {}) {
  const identityKey = isAdmin ? 'admin' : String(email || '').toLowerCase().trim();
  if (!identityKey) return { inbox: 0, support: 0, total: 0 };

  const now = Date.now();
  const cached = cache.get(identityKey);
  if (!force && cached && cached.expiresAt > now) {
    return cached.data;
  }

  if (inFlight.has(identityKey)) {
    return inFlight.get(identityKey);
  }

  const request = fetch('/api/chat/unread-counts', {
    credentials: 'include'
  })
    .then(async response => {
      if (!response.ok) {
        if (response.status === 401) return { inbox: 0, support: 0, total: 0 };
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
}
