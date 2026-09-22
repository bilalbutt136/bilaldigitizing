import webpush from 'web-push';
import { createAdminClient } from './supabase/admin.js';

// Pre-configured permanent VAPID keypair (works out of the box on live Vercel deployments)
export const DEFAULT_VAPID_PUBLIC_KEY = 'BLpbdzESZqfA4Coj36smEyG1UMD13BekGtVOKBOWvha9puENh5eXHg3-SLXCMWo-VbFkqPA2X-gSiMnM-_20qNM';
export const DEFAULT_VAPID_PRIVATE_KEY = 'QJkDk8tJ43PqLVBlYQFYYsMX-L8Gw7SHavd-4V8WpFI';
export const DEFAULT_VAPID_SUBJECT = 'mailto:support@bilaldigitizing.com';

let isVapidConfigured = false;

/**
 * Ensures web-push is initialized with valid VAPID keys
 */
export function getVapidKeys() {
  const publicKey = (process.env.VAPID_PUBLIC_KEY || process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || DEFAULT_VAPID_PUBLIC_KEY).trim();
  const privateKey = (process.env.VAPID_PRIVATE_KEY || DEFAULT_VAPID_PRIVATE_KEY).trim();
  const subject = (process.env.VAPID_SUBJECT || DEFAULT_VAPID_SUBJECT).trim();

  if (!isVapidConfigured && publicKey && privateKey) {
    try {
      webpush.setVapidDetails(subject, publicKey, privateKey);
      isVapidConfigured = true;
    } catch (err) {
      console.warn('[pushService] VAPID initialization warning:', err.message);
    }
  }

  return { publicKey, privateKey, subject };
}

/**
 * Returns the public VAPID key for client registration
 */
export function getPublicVapidKey() {
  const { publicKey } = getVapidKeys();
  return publicKey;
}

/**
 * Saves a browser push subscription to Supabase with resilient fallback to site_config
 */
export async function savePushSubscription({ subscription, userId = null, userEmail = null, role = 'client', userAgent = '' }) {
  if (!subscription || !subscription.endpoint) {
    throw new Error('Invalid subscription object: missing endpoint');
  }

  const endpoint = subscription.endpoint;
  const p256dh = subscription.keys?.p256dh || '';
  const auth = subscription.keys?.auth || '';
  const cleanEmail = userEmail ? userEmail.toLowerCase().trim() : null;
  const cleanRole = role === 'admin' ? 'admin' : 'client';

  try {
    const supabase = createAdminClient();

    // 1. Try persisting into dedicated `push_subscriptions` table
    const { error: tableError } = await supabase
      .from('push_subscriptions')
      .upsert({
        endpoint,
        p256dh,
        auth,
        user_id: userId || null,
        user_email: cleanEmail,
        role: cleanRole,
        user_agent: userAgent || (typeof navigator !== 'undefined' ? navigator.userAgent : null),
        updated_at: new Date().toISOString()
      }, { onConflict: 'endpoint' });

    if (!tableError) {
      return { success: true, storage: 'table' };
    }

    console.warn('[pushService] push_subscriptions table write notice:', tableError.message);
  } catch (err) {
    console.warn('[pushService] Database connection notice:', err.message);
  }

  // 2. Resilient fallback: store in site_config if table is pending migration
  try {
    const supabase = createAdminClient();
    const { data: configRecord } = await supabase
      .from('site_config')
      .select('value')
      .eq('key', 'push_subscriptions_store')
      .maybeSingle();

    let store = [];
    if (configRecord?.value) {
      try {
        store = typeof configRecord.value === 'string' ? JSON.parse(configRecord.value) : configRecord.value;
      } catch {}
    }
    if (!Array.isArray(store)) store = [];

    // Filter out previous entry with same endpoint
    store = store.filter(s => s && s.endpoint !== endpoint);
    store.push({
      endpoint,
      p256dh,
      auth,
      user_id: userId || null,
      user_email: cleanEmail,
      role: cleanRole,
      user_agent: userAgent || null,
      updated_at: new Date().toISOString()
    });

    // Keep store capped at most recent 200 devices
    if (store.length > 200) {
      store = store.slice(-200);
    }

    await supabase
      .from('site_config')
      .upsert({
        key: 'push_subscriptions_store',
        value: JSON.stringify(store),
        updated_at: new Date().toISOString()
      }, { onConflict: 'key' });

    return { success: true, storage: 'site_config' };
  } catch (fallbackErr) {
    console.warn('[pushService] Fallback store notice:', fallbackErr.message);
    return { success: false, error: fallbackErr.message };
  }
}

/**
 * Removes an expired or revoked subscription endpoint
 */
export async function removePushSubscription(endpoint) {
  if (!endpoint) return;
  try {
    const supabase = createAdminClient();
    await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint);
  } catch {}

  try {
    const supabase = createAdminClient();
    const { data: configRecord } = await supabase
      .from('site_config')
      .select('value')
      .eq('key', 'push_subscriptions_store')
      .maybeSingle();

    if (configRecord?.value) {
      let store = typeof configRecord.value === 'string' ? JSON.parse(configRecord.value) : configRecord.value;
      if (Array.isArray(store)) {
        store = store.filter(s => s && s.endpoint !== endpoint);
        await supabase
          .from('site_config')
          .upsert({
            key: 'push_subscriptions_store',
            value: JSON.stringify(store),
            updated_at: new Date().toISOString()
          }, { onConflict: 'key' });
      }
    }
  } catch {}
}

/**
 * Retrieves all valid subscriptions matching email, role, or broadcast
 */
export async function getActiveSubscriptions({ email = null, role = null, all = false }) {
  const cleanEmail = email ? email.toLowerCase().trim() : null;
  const subscriptionsMap = new Map();

  // 1. Try querying push_subscriptions table
  try {
    const supabase = createAdminClient();
    let query = supabase.from('push_subscriptions').select('*');

    if (!all) {
      if (cleanEmail && role) {
        query = query.or(`user_email.eq.${cleanEmail},role.eq.${role}`);
      } else if (cleanEmail) {
        query = query.eq('user_email', cleanEmail);
      } else if (role) {
        query = query.eq('role', role);
      }
    }

    const { data, error } = await query;
    if (!error && Array.isArray(data)) {
      data.forEach(item => {
        if (item.endpoint && item.p256dh && item.auth) {
          subscriptionsMap.set(item.endpoint, {
            endpoint: item.endpoint,
            keys: { p256dh: item.p256dh, auth: item.auth },
            role: item.role,
            user_email: item.user_email
          });
        }
      });
    }
  } catch (err) {
    console.warn('[pushService] Table query notice:', err.message);
  }

  // 2. Supplement / fallback with site_config store
  try {
    const supabase = createAdminClient();
    const { data: configRecord } = await supabase
      .from('site_config')
      .select('value')
      .eq('key', 'push_subscriptions_store')
      .maybeSingle();

    if (configRecord?.value) {
      let store = typeof configRecord.value === 'string' ? JSON.parse(configRecord.value) : configRecord.value;
      if (Array.isArray(store)) {
        store.forEach(item => {
          if (!item || !item.endpoint || !item.p256dh || !item.auth) return;
          const matchEmail = cleanEmail && item.user_email && item.user_email.toLowerCase() === cleanEmail;
          const matchRole = role && item.role === role;

          if (all || matchEmail || matchRole) {
            if (!subscriptionsMap.has(item.endpoint)) {
              subscriptionsMap.set(item.endpoint, {
                endpoint: item.endpoint,
                keys: { p256dh: item.p256dh, auth: item.auth },
                role: item.role,
                user_email: item.user_email
              });
            }
          }
        });
      }
    }
  } catch {}

  return Array.from(subscriptionsMap.values());
}

/**
 * Dispatches a single high-urgency push notification to a device endpoint
 */
export async function sendPushNotification(subscription, payload) {
  getVapidKeys();

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
    ? '💬 Bilal Digitizing Support' 
    : `💬 New Message from ${senderName || 'Customer'}`;

  const body = snippet;
  const url = isFromAdmin 
    ? `/client-portal?tab=inbox${conversationId ? `&chatId=${encodeURIComponent(conversationId)}` : ''}`
    : `/admin-portal?tab=inbox${conversationId ? `&chatId=${encodeURIComponent(conversationId)}` : ''}`;

  const payload = {
    title,
    body,
    icon: '/favicon.svg',
    badge: '/favicon.svg',
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
    return await dispatchPushToDevices({ email: recipientEmail, payload: { title, body, url, orderId: cleanId, tag: `order-${cleanId}`, icon: '/favicon.svg' } });
  } else {
    // Admin Alert
    url = `/admin-portal?tab=orders&trackOrder=${encodeURIComponent(cleanId)}`;
    title = `🎉 New Order #${cleanId}`;
    body = `${clientName} placed an order for ${serviceName}.`;
    return await dispatchPushToDevices({ role: 'admin', payload: { title, body, url, orderId: cleanId, tag: `order-${cleanId}`, icon: '/favicon.svg' } });
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
    icon: '/favicon.svg',
    badge: '/favicon.svg',
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
