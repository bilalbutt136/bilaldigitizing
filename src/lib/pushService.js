import webpush from 'web-push';
import { createAdminClient } from './supabase/admin.js';

let _vapidInitialized = false;
let _cachedVapidKeys = null;

/**
 * Resolves VAPID keys from environment variables or Supabase site_config
 */
export async function getVapidConfig() {
  if (_cachedVapidKeys) {
    return _cachedVapidKeys;
  }

  // 1. Try Environment Variables
  const envPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || process.env.VAPID_PUBLIC_KEY;
  const envPrivate = process.env.VAPID_PRIVATE_KEY;
  const envSubject = process.env.VAPID_SUBJECT || 'mailto:support@bilaldigitizing.com';

  if (envPublic && envPrivate) {
    _cachedVapidKeys = {
      publicKey: envPublic.trim(),
      privateKey: envPrivate.trim(),
      subject: envSubject.trim()
    };
    initWebPush(_cachedVapidKeys);
    return _cachedVapidKeys;
  }

  // 2. Try Supabase site_config
  try {
    const supabase = createAdminClient();
    const { data: configs } = await supabase
      .from('site_config')
      .select('key, value')
      .in('key', ['vapid_public_key', 'vapid_private_key', 'vapid_subject']);

    if (Array.isArray(configs) && configs.length > 0) {
      const configMap = {};
      for (const row of configs) {
        configMap[row.key] = typeof row.value === 'string' ? row.value.replace(/^["']|["']$/g, '').trim() : row.value;
      }

      if (configMap.vapid_public_key && configMap.vapid_private_key) {
        _cachedVapidKeys = {
          publicKey: configMap.vapid_public_key,
          privateKey: configMap.vapid_private_key,
          subject: configMap.vapid_subject || 'mailto:support@bilaldigitizing.com'
        };
        initWebPush(_cachedVapidKeys);
        return _cachedVapidKeys;
      }
    }
  } catch (err) {
    console.warn('[PushService] site_config VAPID lookup note:', err?.message);
  }

  // 3. Fallback Built-in VAPID Key Pair (Matches .env.local)
  _cachedVapidKeys = {
    publicKey: 'BDKsbmvlPoAp6SJQW3BAhB2IE62L9PsssS0rb730Xb3a_mbPn1VarxrvTh5fWTn3lcsYXUg_ANbNrWTkdHIUJtA',
    privateKey: 'Pn4erj7VtldrCk3Jh1hyZo2FTye5271DdPenD6H95cI',
    subject: 'mailto:support@bilaldigitizing.com'
  };

  initWebPush(_cachedVapidKeys);
  return _cachedVapidKeys;
}

function initWebPush(keys) {
  if (_vapidInitialized) return;
  try {
    webpush.setVapidDetails(keys.subject, keys.publicKey, keys.privateKey);
    _vapidInitialized = true;
  } catch (err) {
    console.warn('[PushService] VAPID initialization note:', err?.message);
  }
}

/**
 * Returns Public VAPID Key for browser pushManager.subscribe()
 */
export async function getVapidPublicKey() {
  const config = await getVapidConfig();
  return config?.publicKey || '';
}

/**
 * Persists a Web Push Subscription in Supabase with automatic fallback
 */
export async function savePushSubscription({ subscription, userId = null, userEmail = null, role = 'client', userAgent = null }) {
  if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
    throw new Error('Invalid push subscription object format.');
  }

  const cleanEmail = (userEmail || '').toLowerCase().trim() || null;
  const endpoint = subscription.endpoint;
  const p256dh = subscription.keys.p256dh;
  const auth = subscription.keys.auth;
  const effectiveRole = role === 'admin' ? 'admin' : (role === 'worker' ? 'worker' : 'client');

  const supabase = createAdminClient();

  // 1. Try public.push_subscriptions table
  try {
    const payload = {
      id: `sub_${Buffer.from(endpoint.slice(-24)).toString('hex').slice(0, 32)}`,
      user_id: userId,
      user_email: cleanEmail,
      role: effectiveRole,
      endpoint,
      p256dh,
      auth,
      user_agent: userAgent ? String(userAgent).substring(0, 255) : null,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('push_subscriptions')
      .upsert(payload, { onConflict: 'endpoint' })
      .select()
      .maybeSingle();

    if (!error) {
      return { success: true, record: data || payload };
    }
  } catch (dbErr) {
    console.warn('[PushService] push_subscriptions table insert note:', dbErr?.message);
  }

  // 2. Fallback to site_config (key: push_subscriptions)
  try {
    const { data: configRow } = await supabase
      .from('site_config')
      .select('value')
      .eq('key', 'push_subscriptions')
      .maybeSingle();

    let list = [];
    if (configRow?.value) {
      list = Array.isArray(configRow.value) ? configRow.value : (typeof configRow.value === 'string' ? JSON.parse(configRow.value) : []);
    }

    // Remove any existing subscription with matching endpoint
    list = list.filter(item => item?.endpoint !== endpoint);

    list.push({
      endpoint,
      p256dh,
      auth,
      user_id: userId,
      user_email: cleanEmail,
      role: effectiveRole,
      user_agent: userAgent,
      updated_at: new Date().toISOString()
    });

    // Keep list bounded to last 200 subscriptions
    if (list.length > 200) list = list.slice(-200);

    await supabase
      .from('site_config')
      .upsert({ key: 'push_subscriptions', value: list }, { onConflict: 'key' });

    return { success: true, fallback: true };
  } catch (fbErr) {
    console.warn('[PushService] site_config fallback notice:', fbErr?.message);
    return { success: true, warning: fbErr?.message };
  }
}

/**
 * Removes expired or invalid push subscriptions
 */
export async function removePushSubscription(endpoint) {
  if (!endpoint) return;
  const supabase = createAdminClient();

  try {
    await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint);
  } catch {}

  try {
    const { data: configRow } = await supabase
      .from('site_config')
      .select('value')
      .eq('key', 'push_subscriptions')
      .maybeSingle();

    if (configRow?.value && Array.isArray(configRow.value)) {
      const filtered = configRow.value.filter(s => s?.endpoint !== endpoint);
      await supabase
        .from('site_config')
        .upsert({ key: 'push_subscriptions', value: filtered }, { onConflict: 'key' });
    }
  } catch {}
}

/**
 * Retrieves subscriptions matching target criteria
 */
export async function getSubscriptionsForRecipient({ userEmail = null, role = null }) {
  const supabase = createAdminClient();
  const cleanEmail = (userEmail || '').toLowerCase().trim();
  const subs = [];

  // 1. Try push_subscriptions table
  try {
    let query = supabase.from('push_subscriptions').select('*');
    if (cleanEmail) {
      query = query.ilike('user_email', cleanEmail);
    } else if (role) {
      query = query.eq('role', role);
    }

    const { data, error } = await query;
    if (!error && Array.isArray(data)) {
      subs.push(...data);
    }
  } catch {}

  // 2. Check site_config fallback list
  try {
    const { data: configRow } = await supabase
      .from('site_config')
      .select('value')
      .eq('key', 'push_subscriptions')
      .maybeSingle();

    if (configRow?.value) {
      const list = Array.isArray(configRow.value) ? configRow.value : (typeof configRow.value === 'string' ? JSON.parse(configRow.value) : []);
      for (const item of list) {
        if (!subs.some(s => s.endpoint === item.endpoint)) {
          if (cleanEmail && item.user_email && item.user_email.toLowerCase() === cleanEmail) {
            subs.push(item);
          } else if (role && item.role === role) {
            subs.push(item);
          }
        }
      }
    }
  } catch {}

  return subs;
}

/**
 * Sends encrypted Web Push notification to a single browser subscription
 */
export async function sendPushNotification(subscription, payload = {}) {
  await getVapidConfig();

  const pushSubscription = {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: subscription.p256dh || subscription.keys?.p256dh,
      auth: subscription.auth || subscription.keys?.auth
    }
  };

  const payloadString = typeof payload === 'string' ? payload : JSON.stringify(payload);

  try {
    const result = await webpush.sendNotification(pushSubscription, payloadString, {
      TTL: 86400, // 24 hours
      urgency: 'high'
    });
    return { success: true, statusCode: result.statusCode };
  } catch (err) {
    // If subscription is 404 or 410 (unsubscribed or expired), purge it automatically
    if (err.statusCode === 404 || err.statusCode === 410) {
      console.log('[PushService] Removing expired subscription:', subscription.endpoint.slice(-20));
      await removePushSubscription(subscription.endpoint);
      return { success: false, expired: true, error: err.message };
    }
    console.warn('[PushService] sendNotification notice:', err?.message);
    return { success: false, error: err?.message };
  }
}

/**
 * Dispatches a push notification to all devices matching recipient criteria
 */
export async function sendPushToRecipient({ userEmail = null, role = null, payload = {} }) {
  try {
    const subscriptions = await getSubscriptionsForRecipient({ userEmail, role });
    if (!subscriptions || subscriptions.length === 0) {
      return { success: true, count: 0, message: 'No registered push devices found.' };
    }

    const results = await Promise.allSettled(
      subscriptions.map(sub => sendPushNotification(sub, payload))
    );

    const delivered = results.filter(r => r.status === 'fulfilled' && r.value?.success).length;
    return {
      success: delivered > 0,
      total: subscriptions.length,
      delivered
    };
  } catch (err) {
    console.error('[PushService] sendPushToRecipient error:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Formatters for WhatsApp/TikTok style alerts
 */
export function formatChatMessagePush({ senderName, messageText, conversationId, isSupport = false, targetRole = 'admin' }) {
  const title = `💬 ${senderName || 'Customer'}`;
  const snippet = messageText ? (messageText.length > 80 ? messageText.substring(0, 80) + '...' : messageText) : 'Sent an attachment';

  const destinationUrl = targetRole === 'admin'
    ? `/admin-portal?tab=inbox`
    : (isSupport ? `/contact` : `/client-portal?tab=inbox`);

  return {
    title,
    body: snippet,
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    tag: `chat-${conversationId || 'stream'}`,
    vibrate: [200, 100, 200, 100, 200],
    url: destinationUrl,
    conversationId,
    senderName,
    type: 'chat_message',
    actions: [
      { action: 'open', title: 'Reply Now' },
      { action: 'close', title: 'Dismiss' }
    ]
  };
}

export function formatOrderPush({ orderId, clientName, serviceName, status = 'created', targetRole = 'client' }) {
  const cleanId = String(orderId || '').replace(/^#+/, '');
  const isAdmin = targetRole === 'admin';

  const title = isAdmin
    ? `🎉 New Order #${cleanId}`
    : `✅ Order #${cleanId} Confirmed`;

  const body = isAdmin
    ? `${serviceName || 'Custom Digitizing'} ordered by ${clientName || 'Client'}.`
    : `Your ${serviceName || 'embroidery'} order is received and queued for express processing.`;

  const destinationUrl = isAdmin
    ? `/admin-portal?tab=orders&trackOrder=${cleanId}`
    : `/client?tab=orders&trackOrder=${cleanId}`;

  return {
    title,
    body,
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    tag: `order-${cleanId}`,
    vibrate: [250, 150, 250],
    url: destinationUrl,
    orderId: cleanId,
    type: 'order_update',
    actions: [
      { action: 'open', title: 'Track Order' },
      { action: 'close', title: 'Dismiss' }
    ]
  };
}
