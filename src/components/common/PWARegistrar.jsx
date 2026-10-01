'use client';

import { useEffect, useRef } from 'react';
import { useAppState } from '../../context/StateContext';
import {
  clearPushSubscriptionSync,
  getClientVapidPublicKey,
  isPushSubscriptionSynced,
  markPushSubscriptionSynced,
  subscriptionUsesVapidKey,
  urlBase64ToUint8Array
} from '../../utils/pushSubscriptionClient';

export const PWARegistrar = () => {
  const { authUser, currentUser, isAuthenticated, isAuthInitialized } = useAppState();
  const activeUser = authUser || currentUser;
  const userEmail = activeUser?.email ? activeUser.email.toLowerCase().trim() : '';
  const role = activeUser?.role === 'admin' ? 'admin' : (activeUser?.role === 'worker' ? 'worker' : 'client');
  const userId = activeUser?.id || null;
  const canSyncPush = Boolean(isAuthInitialized && isAuthenticated && userEmail && userId);

  const hasSubscribedRef = useRef(false);
  const isSubscribingRef = useRef(false);
  const syncedUserIdRef = useRef(null);

  useEffect(() => {
    if (syncedUserIdRef.current !== userId) {
      hasSubscribedRef.current = false;
      syncedUserIdRef.current = userId;
    }
  }, [userId]);

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    const setupPush = async (reg) => {
      if (!canSyncPush || !('PushManager' in window) || !('Notification' in window)) return;
      if (Notification.permission !== 'granted' || isSubscribingRef.current) return;

      isSubscribingRef.current = true;

      try {
        let sub = await reg.pushManager.getSubscription();

        // The browser subscription was already persisted for this authenticated user.
        // Avoid both the VAPID lookup and the subscription POST on every auth/render pass.
        if (sub && isPushSubscriptionSynced(userId, sub)) {
          hasSubscribedRef.current = true;
          return;
        }

        const publicKey = await getClientVapidPublicKey();
        const applicationServerKey = urlBase64ToUint8Array(publicKey);

        if (sub && !subscriptionUsesVapidKey(sub, publicKey)) {
          await sub.unsubscribe();
          clearPushSubscriptionSync(userId);
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
          const response = await fetch('/api/push/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              subscription: sub,
              userEmail,
              role,
              userId,
              userAgent: navigator.userAgent
            })
          });
          const data = await response.json().catch(() => ({}));

          if (response.ok && data?.success) {
            hasSubscribedRef.current = true;
            markPushSubscriptionSynced(userId, sub, publicKey);
          } else if (response.status !== 401) {
            throw new Error(data?.error || `Push subscription sync failed with ${response.status}`);
          }
        }
      } catch (err) {
        console.warn('[PWA] Background push registration notice:', err?.message);
      } finally {
        isSubscribingRef.current = false;
      }
    };

    const registerSW = async () => {
      try {
        const reg = await navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' });
        reg.update().catch(() => {});
        await setupPush(reg);

        // Never request push-notification permission on an unrelated first tap.
        // New permission should only be requested from an explicit notifications control.
      } catch (error) {
        console.warn('[PWA] Service Worker registration notice:', error);
      }
    };

    if (document.readyState === 'complete') {
      registerSW();
    } else {
      window.addEventListener('load', registerSW, { once: true });
    }

    return () => {
      window.removeEventListener('load', registerSW);
    };
  }, [canSyncPush, userEmail, role, userId]);

  return null;
};

export default PWARegistrar;
