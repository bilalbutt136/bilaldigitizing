import webpush from 'web-push';
import { createAdminClient } from './supabase/admin.js';

export const DEFAULT_VAPID_SUBJECT = 'mailto:support@bdigitizing.com';

let isVapidConfigured = false;
let cachedVapidKeys = null;

/**
 * Loads web-push credentials from environment variables, with a server-only
 * Supabase secret-store fallback for deployments where environment management
 * is unavailable. The fallback table is inaccessible to anon/authenticated roles.
 */
export async function getVapidKeys() {
  let publicKey = (process.env.VAPID_PUBLIC_KEY || process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '').trim();
  let privateKey = (process.env.VAPID_PRIVATE_KEY || '').trim();
  let subject = (process.env.VAPID_SUBJECT || DEFAULT_VAPID_SUBJECT).trim();

  if ((!publicKey || !privateKey) && cachedVapidKeys) {
    ({ publicKey, privateKey, subject } = cachedVapidKeys);
  }

  if (!publicKey || !privateKey) {
    try {
      const supabase = createAdminClient();
      const { data, error } = await supabase
        .from('private_server_config')
        .select('value')
        .eq('key', 'vapid_keys')
        .maybeSingle();

      if (error) throw error;
      const stored = typeof data?.value === 'string' ? JSON.parse(data.value) : data?.value;
      publicKey = String(stored?.publicKey || '').trim();
      privateKey = String(stored?.privateKey || '').trim();
      subject = String(stored?.subject || subject || DEFAULT_VAPID_SUBJECT).trim();
    } catch (error) {
      console.warn('[pushService] Unable to load server-side VAPID configuration:', error?.message);
    }
  }

  if (!publicKey || !privateKey) {
    throw new Error('VAPID credentials are not configured in the server environment or private server configuration.');
  }

  cachedVapidKeys = { publicKey, privateKey, subject };

  if (!isVapidConfigured) {
    webpush.setVapidDetails(subject, publicKey, privateKey);
    isVapidConfigured = true;
  }

  return cachedVapidKeys;
}

/**
 * Returns the public VAPID key for client registration.
 */
export async function getPublicVapidKey() {
  const { publicKey } = await getVapidKeys();
  return publicKey;
}

/**
 * Saves an authenticated browser push subscription to the dedicated private table.
 */
export async function savePushSubscription({ subscription, userId = null, userEmail = null, role = 'client', userAgent = '' }) {
  if (!subscription?.endpoint) {
    throw new Error('Invalid subscription object: missing endpoint');
  }
  if (!subscription?.keys?.p256dh || !subscription?.keys?.auth) {
    throw new Error('Invalid subscription object: missing encryption keys');
  }
  if (!userId || !userEmail) {
    throw new Error('Authenticated user identity is required for push subscriptions.');
  }

  const cleanEmail = String(userEmail).toLowerCase().trim();
  const cleanRole = role === 'admin' ? 'admin' : (role === 'worker' ? 'worker' : 'client');
  const supabase = createAdminClient();

  const { error } = await supabase
    .from('push_subscriptions')
    .upsert({
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
      user_id: String(userId),
      user_email: cleanEmail,
      role: cleanRole,
      user_agent: userAgent || null,
      updated_at: new Date().toISOString()
    }, { onConflict: 'endpoint' });

  if (error) {
    console.error('[pushService] push_subscriptions write failed:', error.message);
    return { success: false, error: 'Unable to persist push subscription.' };
  }

  return { success: true, storage: 'push_subscriptions' };
}

/**
 * Removes an expired or revoked subscription endpoint.
 */
export async function removePushSubscription(endpoint) {
  if (!endpoint) return;
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint);
    if (error) console.warn('[pushService] Subscription cleanup notice:', error.message);
  } catch (error) {
    console.warn('[pushService] Subscription cleanup notice:', error?.message);
  }
}

/**
 * Retrieves subscriptions from the dedicated private table only.
 */
export async function getActiveSubscriptions({ email = null, role = null, all = false }) {
  const cleanEmail = email ? String(email).toLowerCase().trim() : null;
  const supabase = createAdminClient();
  let query = supabase.from('push_subscriptions').select('endpoint, p256dh, auth, role, user_email');

  if (!all) {
    if (!cleanEmail && !role) return [];
    if (cleanEmail) query = query.eq('user_email', cleanEmail);
    if (role) query = query.eq('role', role);
  }

  const { data, error } = await query;
  if (error) {
    console.error('[pushService] push_subscriptions query failed:', error.message);
    return [];
  }

  return (Array.isArray(data) ? data : [])
    .filter(item => item?.endpoint && item?.p256dh && item?.auth)
    .map(item => ({
      endpoint: item.endpoint,
      keys: { p256dh: item.p256dh, auth: item.auth },
      role: item.role,
      user_email: item.user_email
    }));
}

/**
 * Dispatches a single high-urgency push notification to a device endpoint
 */
export async function sendPushNotification(subscription, payload) {
  await getVapidKeys();

  const pushPayload = typeof payload === 'object' ? JSON.stringify(payload) : String(payload);

  const pushOptions = {
    TTL: 86400, // 24 hours
    urgency: 'high', // High urgency wakes mobile device from deep sleep / screen-off
    headers: {
      'Urgency': 'high'
    }
  };

  try {
    await webpush.sendNotification(subscription, pushPayload, pushOptions);
    return { success: true };
  } catch (error) {
    const statusCode = error.statusCode || error.status;
    // Expired or unsubscribed endpoint (HTTP 404 Not Found or HTTP 410 Gone)
    if (statusCode === 404 || statusCode === 410) {
      await removePushSubscription(subscription.endpoint);
      return { success: false, expired: true, error: 'Endpoint expired or unregistered' };
    }
    console.warn('[pushService] sendNotification error:', statusCode, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Dispatches a push notification to all target device subscriptions
 */
export async function dispatchPushToDevices({ email = null, role = null, all = false, payload }) {
  try {
    const subscriptions = await getActiveSubscriptions({ email, role, all });
    if (!subscriptions || subscriptions.length === 0) {
      return { success: true, count: 0, notice: 'No active device subscriptions registered for target' };
    }

    const results = await Promise.allSettled(
      subscriptions.map(sub => sendPushNotification(sub, payload))
    );

    let sent = 0;
    let failed = 0;

    results.forEach(res => {
      if (res.status === 'fulfilled' && res.value.success) sent++;
      else failed++;
    });

    return { success: true, count: subscriptions.length, sent, failed };
  } catch (err) {
    console.error('[pushService] dispatchPushToDevices error:', err);
    return { success: false, error: err.message };
  }
}

/**
 * High-level helper: Trigger instant mobile lock-screen alert for Chat Messages
 */
export async function dispatchChatMessagePush({
  senderRole = 'client', // 'client' | 'admin'
  senderName = 'Customer',
  messageText = '',
  recipientEmail = null,
  conversationId = '',
  orderId = null
}) {
  const snippet = (messageText || 'Sent an attachment or file').substring(0, 100);
  const isFromAdmin = senderRole === 'admin';

  const title = isFromAdmin
    ? '💬 BDigitizing Support'
    : `💬 New Message from ${senderName || 'Customer'}`;

  const body = snippet;
  const url = isFromAdmin
    ? `/client-portal?tab=inbox${conversationId ? `&chatId=${encodeURIComponent(conversationId)}` : ''}`
    : `/admin-portal?tab=inbox${conversationId ? `&chatId=${encodeURIComponent(conversationId)}` : ''}`;

  const payload = {
    title,
    body,
    icon: '/icon-192x192.png',
    badge: '/favicon.png',
    tag: `chat-${conversationId || Date.now()}`,
    url,
    conversationId,
    orderId,
    timestamp: Date.now()
  };

  if (isFromAdmin) {
    // Send to specific client device
    return await dispatchPushToDevices({ email: recipientEmail, payload });
  } else {
    // Send to all registered Admin devices
    return await dispatchPushToDevices({ role: 'admin', payload });
  }
}

/**
 * High-level helper: Trigger instant mobile lock-screen alert for Orders & Quotes
 */
export async function dispatchOrderPush({
  orderId,
  clientName = 'Customer',
  serviceName = 'Embroidery Digitizing',
  status = 'submitted',
  role = 'admin', // 'admin' | 'client'
  recipientEmail = null
}) {
  const cleanId = String(orderId || '').replace(/^#+/, '');
  const isClientTarget = role === 'client';

  let title = `📦 Order #${cleanId}`;
  let body = '';
  let url = '';

  if (isClientTarget) {
    url = `/client-portal?tab=orders&trackOrder=${encodeURIComponent(cleanId)}`;
    if (status === 'delivered') {
      title = `🎉 Order #${cleanId} Files Ready!`;
      body = 'Your embroidery / vector design files have been completed and delivered.';
    } else if (status === 'in_progress') {
      title = `⚙️ Order #${cleanId} in Production`;
      body = `Our digitizers are currently crafting your ${serviceName} order.`;
    } else {
      title = `✅ Order #${cleanId} Confirmed`;
      body = `Thank you! Your order for ${serviceName} is now in queue.`;
    }
    return await dispatchPushToDevices({ email: recipientEmail, payload: { title, body, url, orderId: cleanId, tag: `order-${cleanId}`, icon: '/icon-192x192.png', badge: '/favicon.png' } });
  } else {
    // Admin Alert
    url = `/admin-portal?tab=orders&trackOrder=${encodeURIComponent(cleanId)}`;
    title = `🎉 New Order #${cleanId}`;
    body = `${clientName} placed an order for ${serviceName}.`;
    return await dispatchPushToDevices({ role: 'admin', payload: { title, body, url, orderId: cleanId, tag: `order-${cleanId}`, icon: '/icon-192x192.png', badge: '/favicon.png' } });
  }
}

/**
 * High-level helper: Trigger instant mobile lock-screen alert for System Notifications
 */
export async function dispatchSystemNotificationPush({
  title = 'BDigitizing Notification',
  message = '',
  link = '/',
  orderId = null,
  recipientRole = 'client',
  recipientEmail = null
}) {
  const payload = {
    title,
    body: message,
    icon: '/icon-192x192.png',
    badge: '/favicon.png',
    tag: orderId ? `order-${orderId}` : `notif-${Date.now()}`,
    url: link || '/',
    orderId,
    timestamp: Date.now()
  };

  if (recipientRole === 'admin') {
    return await dispatchPushToDevices({ role: 'admin', payload });
  } else if (recipientEmail) {
    return await dispatchPushToDevices({ email: recipientEmail, payload });
  } else {
    return await dispatchPushToDevices({ all: true, payload });
  }
}
