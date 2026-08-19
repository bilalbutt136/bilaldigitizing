'use client';

import { useEffect } from 'react';

export const PWARegistrar = () => {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      let refreshing = false;

      // Auto-reload when new service worker takes over
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });

      const registerAndTrackSW = async () => {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js');

          // Check for updates on load
          if (registration) {
            registration.update();

            // Periodic check for updates every 10 minutes
            const interval = setInterval(() => {
              registration.update().catch(() => {});
            }, 10 * 60 * 1000);

            // Check for updates when user returns to the app
            const handleFocus = () => {
              registration.update().catch(() => {});
            };
            window.addEventListener('focus', handleFocus);
            document.addEventListener('visibilitychange', () => {
              if (document.visibilityState === 'visible') {
                registration.update().catch(() => {});
              }
            });

            // If a new worker is already waiting, trigger activation
            if (registration.waiting) {
              registration.waiting.postMessage({ type: 'SKIP_WAITING' });
            }

            // Listen for new workers arriving
            registration.addEventListener('updatefound', () => {
              const newWorker = registration.installing;
              if (newWorker) {
                newWorker.addEventListener('statechange', () => {
                  if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    newWorker.postMessage({ type: 'SKIP_WAITING' });
                  }
                });
              }
            });

            return () => {
              clearInterval(interval);
              window.removeEventListener('focus', handleFocus);
            };
          }
        } catch (error) {
          console.warn('[PWA] Service Worker registration failed:', error);
        }
      };

      if (document.readyState === 'complete') {
        registerAndTrackSW();
      } else {
        window.addEventListener('load', registerAndTrackSW, { once: true });
      }
    }

    // Global Auto-Recovery for Next.js Chunk Loading Mismatches on new deployments
    if (typeof window !== 'undefined') {
      const handleGlobalChunkError = (e) => {
        const errorMsg = e?.message || e?.reason?.message || '';
        const errorName = e?.error?.name || e?.reason?.name || '';
        const isChunkError = 
          errorName === 'ChunkLoadError' ||
          errorMsg.includes('Loading chunk') ||
          errorMsg.includes('Failed to fetch dynamically imported module') ||
          errorMsg.includes('_next/static/chunks');

        if (isChunkError) {
          const lastReload = sessionStorage.getItem('last_chunk_reload');
          const now = Date.now();
          if (!lastReload || (now - Number(lastReload)) > 10000) {
            sessionStorage.setItem('last_chunk_reload', String(now));
            window.location.reload();
          }
        }
      };

      window.addEventListener('error', handleGlobalChunkError);
      window.addEventListener('unhandledrejection', handleGlobalChunkError);

      return () => {
        window.removeEventListener('error', handleGlobalChunkError);
        window.removeEventListener('unhandledrejection', handleGlobalChunkError);
      };
    }
  }, []);

  return null;
};

export default PWARegistrar;
