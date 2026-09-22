'use client';

import { useEffect, useRef } from 'react';
import { useAppState } from '../../context/StateContext';

function urlBase64ToUint8Array(base64String) {
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

export const PWARegistrar = () => {
  const { authUser, currentUser } = useAppState();
  const activeUser = authUser || currentUser;
  const userEmail = activeUser?.email ? activeUser.email.toLowerCase().trim() : '';
  const role = activeUser?.role === 'admin' ? 'admin' : 'client';
  const userId = activeUser?.id || null;

  const hasSubscribedRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    const setupPush = async (reg) => {
      if (!('PushManager' in window) || !('Notification' in window)) return;

      try {
        if (Notification.permission === 'granted') {
          let sub = await reg.pushManager.getSubscription();
          if (!sub) {
            const keyRes = await fetch('/api/push/vapid-key');
            const keyData = await keyRes.json();
            if (keyData.success && keyData.publicKey) {
              const applicationServerKey = urlBase64ToUint8Array(keyData.publicKey);
              sub = await reg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey
              });
            }
          }

          if (sub && !hasSubscribedRef.current) {
            hasSubscribedRef.current = true;
            await fetch('/api/push/subscribe', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                subscription: sub,
                userEmail,
                role,
                userId,
                userAgent: navigator.userAgent
              })
            }).catch(() => {});
          }
        }
      } catch (err) {
        console.warn('[PWA] Background push registration notice:', err?.message);
      }
    };

    const registerSW = async () => {
      try {
        const reg = await navigator.serviceWorker.register('/sw.js');
        await setupPush(reg);

        // If permission is default, politely request on first user touch/click
        if ('Notification' in window && Notification.permission === 'default') {
          const handleFirstInteraction = async () => {
            window.removeEventListener('click', handleFirstInteraction);
            window.removeEventListener('touchend', handleFirstInteraction);
            try {
              const res = await Notification.requestPermission();
              if (res === 'granted') {
                await setupPush(reg);
              }
            } catch {}
          };
          window.addEventListener('click', handleFirstInteraction, { once: true });
          window.addEventListener('touchend', handleFirstInteraction, { once: true });
        }
      } catch (error) {
        console.warn('[PWA] Service Worker registration notice:', error);
      }
    };

    if (document.readyState === 'complete') {
      registerSW();
    } else {
      window.addEventListener('load', registerSW, { once: true });
    }
  }, [userEmail, role, userId]);

  return null;
};

export default PWARegistrar;
