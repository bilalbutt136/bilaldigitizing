// BDigitizing Studio PWA Service Worker with Native Push & Lock-Screen Alerts
const CACHE_VERSION = 'bdigi-pwa-v4.3';
const STATIC_ASSETS = [
  '/artwork-placeholder.svg',
  '/service-preview-placeholder.svg',
  '/product-placeholder.svg'
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
  const request = event.request;

  if (request.method !== 'GET') return;

  let requestUrl;
  try {
    requestUrl = new URL(request.url);
  } catch {
    return;
  }

  // Never proxy cross-origin resources through the service worker.
  // External images/scripts use the document CSP and normal browser cache.
  if (requestUrl.origin !== self.location.origin) {
    return;
  }

  // API calls, Next.js chunks, and byte-range requests should bypass SW caching.
  if (
    requestUrl.pathname.startsWith('/api/') ||
    requestUrl.pathname.startsWith('/_next/') ||
    request.headers.has('range')
  ) {
    return;
  }

  const offlineHtmlResponse = () => new Response(
    '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>BDigitizing</title></head><body style="font-family:Arial,sans-serif;padding:2rem;color:#0f172a"><h1>You are offline</h1><p>Please reconnect and try again.</p></body></html>',
    {
      status: 503,
      statusText: 'Offline',
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store'
      }
    }
  );

  const networkFirst = async () => {
    try {
      return await fetch(request);
    } catch {
      const cached = await caches.match(request);
      return cached || offlineHtmlResponse();
    }
  };

  // HTML navigation is network-first so layout and bundles never get stuck on stale markup.
  if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(networkFirst());
    return;
  }

  // Branding assets and the dynamic manifest update immediately, with cached fallback only when offline.
  if (
    requestUrl.pathname === '/manifest.webmanifest' ||
    requestUrl.pathname.includes('favicon') ||
    requestUrl.pathname.includes('apple-touch-icon') ||
    requestUrl.pathname.includes('icon-')
  ) {
    event.respondWith(networkFirst());
    return;
  }

  // Same-origin stale-while-revalidate. Always resolve to a Response so failed
  // requests cannot create repeated 'Uncaught (in promise)' fetch loops.
  event.respondWith((async () => {
    const cached = await caches.match(request);

    if (cached) {
      event.waitUntil(
        fetch(request)
          .then(async (networkResponse) => {
            if (networkResponse?.ok && networkResponse.type === 'basic') {
              const cache = await caches.open(CACHE_VERSION);
              await cache.put(request, networkResponse.clone());
            }
          })
          .catch(() => {})
      );
      return cached;
    }

    try {
      const networkResponse = await fetch(request);
      if (networkResponse?.ok && networkResponse.type === 'basic') {
        const cache = await caches.open(CACHE_VERSION);
        await cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    } catch {
      return new Response('', {
        status: 503,
        statusText: 'Offline',
        headers: { 'Cache-Control': 'no-store' }
      });
    }
  })());
});
// =============================================================================
// NATIVE MOBILE PUSH NOTIFICATIONS (WHATSAPP-STYLE LOCK SCREEN POPUPS)
// =============================================================================
self.addEventListener('push', (event) => {
  let data = {
    title: 'BDigitizing Notification',
    body: 'You have a new message or order update.',
    icon: '/icon-192x192.png',
    badge: '/favicon.png',
    tag: 'bdigi-alert',
    url: '/?app=true'
  };

  if (event.data) {
    try {
      const parsed = event.data.json();
      data = { ...data, ...parsed };
    } catch {
      try {
        data.body = event.data.text() || data.body;
      } catch {}
    }
  }

  const notificationOptions = {
    body: data.body,
    icon: (data.icon && !data.icon.endsWith('.svg')) ? data.icon : '/icon-192x192.png',
    badge: (data.badge && !data.badge.endsWith('.svg')) ? data.badge : '/favicon.png',
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
