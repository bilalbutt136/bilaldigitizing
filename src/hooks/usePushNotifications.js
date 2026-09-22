'use client';

import { useState, useEffect, useCallback } from 'react';

/**
 * Converts URL-safe base64 string to Uint8Array for applicationServerKey
 */
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

export function usePushNotifications(userContext = {}) {
  const { userEmail = '', role = 'client', userId = null } = userContext;

  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testCountdown, setTestCountdown] = useState(0);
  const [errorMessage, setErrorMessage] = useState(null);

  // Check support and current subscription status on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
    setIsSupported(supported);

    if (supported) {
      setPermission(Notification.permission);

      // Check if registration exists and has an active subscription
      navigator.serviceWorker.ready
        .then((reg) => reg.pushManager.getSubscription())
        .then((sub) => {
          if (sub) {
            setIsSubscribed(true);
            // Sync current active subscription in background
            if (userEmail || role) {
              fetch('/api/push/subscribe', {
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
          } else {
            setIsSubscribed(false);
          }
        })
        .catch((err) => {
          console.warn('[usePushNotifications] Subscription check notice:', err);
        });
    }
  }, [userEmail, role, userId]);

  /**
   * Request permission and subscribe to Web Push
   */
  const subscribeToPush = useCallback(async () => {
    if (!isSupported) {
      setErrorMessage('Push notifications are not supported on this browser.');
      return { success: false, error: 'Not supported' };
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      // 1. Request Browser Permission
      const requestedPermission = await Notification.requestPermission();
      setPermission(requestedPermission);

      if (requestedPermission !== 'granted') {
        setIsLoading(false);
        return { success: false, error: 'Permission not granted' };
      }

      // 2. Ensure Service Worker is ready
      const registration = await navigator.serviceWorker.ready;

      // 3. Get Public VAPID Key from Server
      const keyRes = await fetch('/api/push/vapid-key');
      const keyData = await keyRes.json();

      if (!keyData.success || !keyData.publicKey) {
        throw new Error(keyData.error || 'Failed to retrieve VAPID key');
      }

      const applicationServerKey = urlBase64ToUint8Array(keyData.publicKey);

      // 4. Register Push Subscription with Browser Push Service (FCM / APNs)
      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey
        });
      }

      // 5. Send subscription to our server to persist
      const saveRes = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription,
          userEmail,
          role,
          userId,
          userAgent: navigator.userAgent
        })
      });

      const saveData = await saveRes.json();
      if (saveData.success) {
        setIsSubscribed(true);
        setIsLoading(false);
        return { success: true, subscription };
      } else {
        throw new Error(saveData.error || 'Server failed to save subscription');
      }
    } catch (err) {
      console.error('[usePushNotifications] Subscription failed:', err);
      setErrorMessage(err.message);
      setIsLoading(false);
      return { success: false, error: err.message };
    }
  }, [isSupported, userEmail, role, userId]);

  /**
   * Trigger a delayed test notification so user can lock their phone and verify lock-screen alert
   */
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
        body: JSON.stringify({
          title: '💬 Bilal Digitizing Studio',
          message: '🌟 Lock Screen Alert: Your mobile notifications are 100% active and working!',
          url: '/client-portal?tab=inbox',
          delaySeconds,
          email: userEmail,
          role,
          all: !userEmail && !role
        })
      });
    } catch (err) {
      console.warn('[usePushNotifications] Test push notice:', err);
    } finally {
      setTimeout(() => {
        setIsTesting(false);
      }, (delaySeconds + 1) * 1000);
    }
  }, [isSubscribed, subscribeToPush, userEmail, role]);

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
