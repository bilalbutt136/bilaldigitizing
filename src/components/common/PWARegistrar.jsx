'use client';

import { useEffect } from 'react';

export const PWARegistrar = () => {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      const registerSW = async () => {
        try {
          await navigator.serviceWorker.register('/sw.js');
        } catch (error) {
          console.warn('[PWA] Service Worker registration notice:', error);
        }
      };

      if (document.readyState === 'complete') {
        registerSW();
      } else {
        window.addEventListener('load', registerSW, { once: true });
      }
    }
  }, []);

  return null;
};

export default PWARegistrar;
