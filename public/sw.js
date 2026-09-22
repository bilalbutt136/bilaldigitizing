// BDigitizing Studio PWA & Native Web Push Service Worker
const CACHE_VERSION = 'bdigi-pwa-v3.0';
const STATIC_ASSETS = [
  '/favicon.svg',
  '/favicon.ico',
  '/manifest.json'
];

// ==============================================================================
// 1. LIFECYCLE & CACHING
// ==============================================================================
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[PWA Service Worker] Asset caching note:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_VERSION) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  // Pass through non-GET, API requests, and Next.js dynamic chunks directly to network
  if (
    event.request.method !== 'GET' || 
    event.request.url.includes('/api/') ||
    event.request.url.includes('/_next/')
  ) {
    return;
  }

  // Network-First Strategy for HTML Navigation to always load latest code from Vercel
  if (event.request.mode === 'navigate' || event.request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          return caches.match('/');
        })
    );
    return;
  }

  // Stale-while-revalidate for standalone static assets (icons, manifest)
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_VERSION).then((cache) => {
              cache.put(event.request, responseToCache).catch(() => {});
            });
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});

// ==============================================================================
// 2. NATIVE MOBILE WEB PUSH NOTIFICATIONS (WhatsApp / TikTok Style)
// ==============================================================================
self.addEventListener('push', (event) => {
  let payload = {};

  if (event.data) {
    try {
      payload = event.data.json();
    } catch {
      payload = {
        title: 'BDigitizing Alert',
        body: event.data.text()
      };
    }
  }

  const title = payload.title || 'BDigitizing Studio';
  const body = payload.body || payload.message || 'You have a new update from BDigitizing Studio.';
  const icon = payload.icon || '/favicon.svg';
  const badge = payload.badge || '/favicon.svg';
  const tag = payload.tag || (payload.conversationId ? `chat-${payload.conversationId}` : (payload.orderId ? `order-${payload.orderId}` : `bdigi-${Date.now()}`));

  // Native Haptic Vibration Pattern (Dual-pulse WhatsApp/TikTok style)
  const vibrate = payload.vibrate || [200, 100, 200, 100, 200];

  // Deep Link destination URL
  const targetUrl = payload.url || (payload.orderId ? `/client?tab=orders&trackOrder=${payload.orderId}` : '/client');

  const options = {
    body,
    icon,
    badge,
    image: payload.image || undefined,
    tag,
    renotify: true,
    vibrate,
    requireInteraction: false,
    data: {
      url: targetUrl,
      orderId: payload.orderId || null,
      conversationId: payload.conversationId || null,
      senderName: payload.senderName || null,
      type: payload.type || 'alert',
      timestamp: Date.now(),
      ...payload.data
    },
    actions: payload.actions || [
      { action: 'open', title: 'Open View' },
      { action: 'close', title: 'Dismiss' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// ==============================================================================
// 3. INTERACTIVE NOTIFICATION CLICK & DEEP LINKING
// ==============================================================================
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  // If user tapped "Dismiss" action button
  if (event.action === 'close') {
    return;
  }

  const notifData = event.notification.data || {};
  const rawUrl = notifData.url || '/client';
  const targetUrl = new URL(rawUrl, self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // 1. If an existing app window is open, focus it and navigate to destination
      for (const client of clientList) {
        if (client.url.startsWith(self.location.origin) && 'focus' in client) {
          if ('navigate' in client) {
            client.navigate(targetUrl);
          }
          return client.focus();
        }
      }

      // 2. If no window is open (e.g. background delivery or app closed), launch it
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

self.addEventListener('notificationclose', (event) => {
  // Notification dismissed by user
});
