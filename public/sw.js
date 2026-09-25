// BDigitizing Studio PWA Service Worker with Native Push & Lock-Screen Alerts
const CACHE_VERSION = 'bdigi-pwa-v3.0';
const STATIC_ASSETS = [
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[PWA Service Worker] Asset caching note:', err);
      });
    })
  );
  self.skipWaiting();
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
  // Pass through non-GET, API requests, and Next.js chunks directly to network
  if (
    event.request.method !== 'GET' || 
    event.request.url.includes('/api/') ||
    event.request.url.includes('/_next/')
  ) {
    return;
  }

  // Favicons, uploaded images, and dynamic assets: always fetch network-first to reflect updates immediately
  if (
    event.request.url.includes('favicon') ||
    event.request.url.includes('apple-touch-icon') ||
    event.request.url.includes('icon-') ||
    event.request.url.includes('cloudinary') ||
    event.request.url.includes('supabase.co')
  ) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
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

// =============================================================================
// NATIVE MOBILE PUSH NOTIFICATIONS (WHATSAPP-STYLE LOCK SCREEN POPUPS)
// =============================================================================
self.addEventListener('push', (event) => {
  let data = {
    title: 'BDigitizing Notification',
    body: 'You have a new message or order update.',
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    tag: 'bdigi-alert',
    url: '/?app=true'
  };

  if (event.data) {
    try {
      const parsed = event.data.json();
      data = { ...data, ...parsed };
    } catch (e) {
      try {
        data.body = event.data.text() || data.body;
      } catch (err) {}
    }
  }

  const notificationOptions = {
    body: data.body,
    icon: data.icon || '/favicon.svg',
    badge: data.badge || '/favicon.svg',
    tag: data.tag || `bdigi-${Date.now()}`,
    renotify: true,
    requireInteraction: true, // Keeps notification active on lock screen
    silent: false,
    vibrate: [300, 100, 300, 100, 300], // High-intensity double pulse for waking lock screen
    timestamp: Date.now(),
    data: {
      url: data.url || '/?app=true',
      orderId: data.orderId || null,
      conversationId: data.conversationId || null,
      timestamp: Date.now()
    },
    actions: data.actions || [
      { action: 'open', title: '💬 View Now' },
      { action: 'dismiss', title: 'Dismiss' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, notificationOptions)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const rawUrl = event.notification.data?.url || '/?app=true';
  const targetUrl = (rawUrl === '/' || !rawUrl) ? '/?app=true' : rawUrl;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // 1. If an existing tab is open on the origin, focus and navigate it
      for (const client of clientList) {
        if ('focus' in client && client.url && client.url.includes(self.location.origin)) {
          if ('navigate' in client) {
            client.navigate(targetUrl);
          }
          return client.focus();
        }
      }
      // 2. Otherwise open a new window
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
