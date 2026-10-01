import { getAuthHeaders } from './supabaseService';

const REVIEW_READ_TTL_MS = 5 * 60_000;
const reviewReadCache = new Map();
const reviewReadInFlight = new Map();

function getReviewAuthScope(headers = {}) {
  const auth = headers.Authorization || headers.authorization || 'cookie-session';
  return String(auth).slice(-64);
}

function runCachedReviewRead(key, factory, { force = false } = {}) {
  const now = Date.now();
  if (!force) {
    const cached = reviewReadCache.get(key);
    if (cached && cached.expiresAt > now) return Promise.resolve(cached.value);
    if (cached) reviewReadCache.delete(key);
  }

  const existing = reviewReadInFlight.get(key);
  if (existing) return existing;

  const promise = Promise.resolve()
    .then(factory)
    .then(value => {
      reviewReadCache.set(key, {
        value,
        expiresAt: Date.now() + REVIEW_READ_TTL_MS
      });
      return value;
    })
    .finally(() => {
      if (reviewReadInFlight.get(key) === promise) {
        reviewReadInFlight.delete(key);
      }
    });

  reviewReadInFlight.set(key, promise);
  return promise;
}

function invalidateReviewReadCache() {
  reviewReadCache.clear();
}

async function authenticatedJsonFetch(url, options = {}, authHeadersOverride = null) {
  const authHeaders = authHeadersOverride || await getAuthHeaders();
  const headers = {
    ...authHeaders,
    ...(options.headers || {})
  };

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'same-origin',
    cache: options.cache || 'no-store'
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok || data?.success === false) {
    const error = new Error(data?.error || `Request failed with status ${response.status}`);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export async function fetchOrderReview(orderId, options = {}) {
  const id = String(orderId || '').trim();
  if (!id) return null;

  const authHeaders = await getAuthHeaders();
  const requestKey = `order:${getReviewAuthScope(authHeaders)}:${id}`;

  return runCachedReviewRead(requestKey, async () => {
    const data = await authenticatedJsonFetch(
      `/api/reviews?orderId=${encodeURIComponent(id)}`,
      {},
      authHeaders
    );
    return data?.review || null;
  }, { force: Boolean(options?.force) });
}

export async function submitOrderReview({ orderId, rating, reviewText, displayName }) {
  const data = await authenticatedJsonFetch('/api/reviews', {
    method: 'POST',
    body: JSON.stringify({
      orderId,
      rating,
      reviewText,
      displayName
    })
  });

  invalidateReviewReadCache();
  return data;
}

export async function fetchAdminReviews(options = {}) {
  const authHeaders = await getAuthHeaders();
  const requestKey = `admin:${getReviewAuthScope(authHeaders)}`;

  return runCachedReviewRead(
    requestKey,
    () => authenticatedJsonFetch('/api/reviews?scope=admin', {}, authHeaders),
    { force: Boolean(options?.force) }
  );
}

export async function moderateCustomerReview(reviewId, action) {
  const data = await authenticatedJsonFetch('/api/reviews', {
    method: 'PATCH',
    body: JSON.stringify({ reviewId, action })
  });
  invalidateReviewReadCache();
  return data;
}
