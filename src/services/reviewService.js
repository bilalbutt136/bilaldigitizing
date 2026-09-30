import { getAuthHeaders } from './supabaseService';

async function authenticatedJsonFetch(url, options = {}) {
  const authHeaders = await getAuthHeaders();
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

export async function fetchOrderReview(orderId) {
  const id = String(orderId || '').trim();
  if (!id) return null;

  const data = await authenticatedJsonFetch(
    `/api/reviews?orderId=${encodeURIComponent(id)}`
  );

  return data?.review || null;
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

  return data;
}

export async function fetchAdminReviews() {
  return authenticatedJsonFetch('/api/reviews?scope=admin');
}

export async function moderateCustomerReview(reviewId, action) {
  return authenticatedJsonFetch('/api/reviews', {
    method: 'PATCH',
    body: JSON.stringify({ reviewId, action })
  });
}
