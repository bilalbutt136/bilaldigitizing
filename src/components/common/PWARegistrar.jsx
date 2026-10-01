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

function arrayBufferToUrlBase64(buffer) {
  if (!buffer) return '';
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return window.btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function subscriptionUsesVapidKey(subscription, publicKey) {
  const currentKey = subscription?.options?.applicationServerKey;
  if (!currentKey || !publicKey) return false;
  return arrayBufferToUrlBase64(currentKey) === String(publicKey).replace(/=+$/g, '');
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
          const keyRes = await fetch('/api/push/vapid-key');
          const keyData = await keyRes.json();
          if (!keyData.success || !keyData.publicKey) {
            throw new Error(keyData.error || 'Failed to retrieve VAPID key');
          }

          const applicationServerKey = urlBase64ToUint8Array(keyData.publicKey);
          let sub = await reg.pushManager.getSubscription();
          if (sub && !subscriptionUsesVapidKey(sub, keyData.publicKey)) {
            await sub.unsubscribe();
            sub = null;
            hasSubscribedRef.current = false;
          }
          if (!sub) {
            sub = await reg.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey
            });
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
        const reg = await navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' });
        reg.update().catch(() => {});
        await setupPush(reg);

        // Never request push-notification permission on an unrelated first tap.
        // That browser prompt can collide with the native PWA install dialog and
        // feels like two permissions at once. If permission was already granted,
        // setupPush() above keeps the subscription current; new permission should
        // only be requested from an explicit notifications control.
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
