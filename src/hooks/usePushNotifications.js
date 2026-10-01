'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  clearPushSubscriptionSync,
  getClientVapidPublicKey,
  isPushSubscriptionSynced,
  markPushSubscriptionSynced,
  subscriptionUsesVapidKey,
  urlBase64ToUint8Array
} from '../utils/pushSubscriptionClient';

/**
 * Web Push hook for authenticated users.
 * Existing browser subscriptions are locally marked after a successful server sync
 * so rerenders/remounts do not repeatedly call the VAPID and subscribe endpoints.
 */
export function usePushNotifications(userContext = {}) {
  const { userEmail = '', role = 'client', userId = null } = userContext;
  const normalizedEmail = String(userEmail || '').toLowerCase().trim();
  const isAuthenticatedUser = Boolean(normalizedEmail && userId);

  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testCountdown, setTestCountdown] = useState(0);
  const [errorMessage, setErrorMessage] = useState(null);
  const isSubscribingRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
    setIsSupported(supported);

    if (!supported) return;

    setPermission(Notification.permission);

    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => {
        setIsSubscribed(Boolean(sub));

        // Never sync anonymous/stale UI state to an auth-required endpoint.
        if (!sub || !isAuthenticatedUser || isPushSubscriptionSynced(userId, sub)) return;

        // Existing unsynced subscriptions are reconciled once for the current user.
        // The callback below has a parallel-request guard.
        return subscribeExistingSubscription(sub);
      })
      .catch((err) => {
        console.warn('[usePushNotifications] Subscription check notice:', err);
      });

    async function subscribeExistingSubscription(sub) {
      if (isSubscribingRef.current) return;
      isSubscribingRef.current = true;

      try {
        const publicKey = await getClientVapidPublicKey();
        if (!subscriptionUsesVapidKey(sub, publicKey)) return;

        const response = await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            subscription: sub,
            userEmail: normalizedEmail,
            role,
            userId,
            userAgent: navigator.userAgent
          })
        });
        const data = await response.json().catch(() => ({}));

        if (response.ok && data?.success) {
          markPushSubscriptionSynced(userId, sub, publicKey);
        }
      } finally {
        isSubscribingRef.current = false;
      }
    }
  }, [normalizedEmail, role, userId, isAuthenticatedUser]);

  /**
   * Request permission and subscribe to Web Push.
   */
  const subscribeToPush = useCallback(async () => {
    if (!isAuthenticatedUser) {
      setErrorMessage('Sign in before enabling push notifications.');
      return { success: false, error: 'Authentication required' };
    }

    if (!isSupported) {
      setErrorMessage('Push notifications are not supported on this browser.');
      return { success: false, error: 'Not supported' };
    }

    if (isSubscribingRef.current) {
      return { success: false, error: 'Subscription already in progress' };
    }

    isSubscribingRef.current = true;
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const requestedPermission = await Notification.requestPermission();
      setPermission(requestedPermission);

      if (requestedPermission !== 'granted') {
        return { success: false, error: 'Permission not granted' };
      }

      const registration = await navigator.serviceWorker.ready;
      let subscription = await registration.pushManager.getSubscription();

      if (subscription && isPushSubscriptionSynced(userId, subscription)) {
        setIsSubscribed(true);
        return { success: true, subscription };
      }

      const publicKey = await getClientVapidPublicKey();
      const applicationServerKey = urlBase64ToUint8Array(publicKey);

      if (subscription && !subscriptionUsesVapidKey(subscription, publicKey)) {
        await subscription.unsubscribe();
        clearPushSubscriptionSync(userId);
        subscription = null;
      }

      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey
        });
      }

      const saveRes = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          subscription,
          userEmail: normalizedEmail,
          role,
          userId,
          userAgent: navigator.userAgent
        })
      });

      const saveData = await saveRes.json().catch(() => ({}));
      if (!saveRes.ok || !saveData.success) {
        throw new Error(saveData.error || `Server failed to save subscription (${saveRes.status})`);
      }

      markPushSubscriptionSynced(userId, subscription, publicKey);
      setIsSubscribed(true);
      return { success: true, subscription };
    } catch (err) {
      console.error('[usePushNotifications] Subscription failed:', err);
      setErrorMessage(err.message);
      return { success: false, error: err.message };
    } finally {
      isSubscribingRef.current = false;
      setIsLoading(false);
    }
  }, [isAuthenticatedUser, isSupported, normalizedEmail, role, userId]);

  const triggerTestNotification = useCallback(async (delaySeconds = 5) => {
    if (!isSubscribed) {
      const res = await subscribeToPush();
      if (!res.success) return;
    }

    setIsTesting(true);
    setTestCountdown(delaySeconds);

    const interval = setInterval(() => {
      setTestCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    try {
      await fetch('/api/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: '💬 BDigitizing Studio',
          message: '🌟 Lock Screen Alert: Your mobile notifications are 100% active and working!',
          url: '/client-portal?tab=inbox',
          delaySeconds,
          email: normalizedEmail,
          role,
          all: false
        })
      });
    } catch (err) {
      console.warn('[usePushNotifications] Test push notice:', err);
    } finally {
      setTimeout(() => {
        setIsTesting(false);
      }, (delaySeconds + 1) * 1000);
    }
  }, [isSubscribed, subscribeToPush, normalizedEmail, role]);

  return {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    isTesting,
    testCountdown,
    errorMessage,
    subscribeToPush,
    triggerTestNotification
  };
}

export default usePushNotifications;
