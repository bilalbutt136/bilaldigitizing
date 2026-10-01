const PUSH_SYNC_STORAGE_PREFIX = 'bdigi_push_subscription_synced_v1:';
export const CLIENT_VAPID_PUBLIC_KEY = (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '').trim();

let vapidKeyPromise = null;

export function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function arrayBufferToUrlBase64(buffer) {
  if (!buffer) return '';
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return window.btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

export function subscriptionUsesVapidKey(subscription, publicKey) {
  const currentKey = subscription?.options?.applicationServerKey;
  if (!currentKey || !publicKey) return false;
  return arrayBufferToUrlBase64(currentKey) === String(publicKey).replace(/=+$/g, '');
}

function getPushSyncStorageKey(userId) {
  return userId ? `${PUSH_SYNC_STORAGE_PREFIX}${userId}` : '';
}

export function isPushSubscriptionSynced(userId, subscription) {
  if (!userId || !subscription?.endpoint || typeof window === 'undefined') return false;

  try {
    const raw = window.localStorage.getItem(getPushSyncStorageKey(userId));
    if (!raw) return false;

    const stored = JSON.parse(raw);
    if (stored?.endpoint !== subscription.endpoint) return false;

    if (CLIENT_VAPID_PUBLIC_KEY) {
      return stored?.vapidPublicKey === CLIENT_VAPID_PUBLIC_KEY &&
        subscriptionUsesVapidKey(subscription, CLIENT_VAPID_PUBLIC_KEY);
    }

    return true;
  } catch {
    return false;
  }
}

export function markPushSubscriptionSynced(userId, subscription, publicKey = '') {
  if (!userId || !subscription?.endpoint || typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(
      getPushSyncStorageKey(userId),
      JSON.stringify({
        endpoint: subscription.endpoint,
        vapidPublicKey: String(publicKey || CLIENT_VAPID_PUBLIC_KEY || '').replace(/=+$/g, ''),
        syncedAt: Date.now()
      })
    );
  } catch {}
}

export function clearPushSubscriptionSync(userId) {
  if (!userId || typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(getPushSyncStorageKey(userId));
  } catch {}
}

export async function getClientVapidPublicKey() {
  if (CLIENT_VAPID_PUBLIC_KEY) return CLIENT_VAPID_PUBLIC_KEY;

  if (!vapidKeyPromise) {
    vapidKeyPromise = fetch('/api/push/vapid-key', { credentials: 'include' })
      .then(async response => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok || !data?.success || !data?.publicKey) {
          throw new Error(data?.error || 'Failed to retrieve VAPID key');
        }
        return data.publicKey;
      })
      .catch(error => {
        vapidKeyPromise = null;
        throw error;
      });
  }

  return vapidKeyPromise;
}
