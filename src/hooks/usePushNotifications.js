'use client';

import { useState, useEffect, useCallback } from 'react';

/**
 * Utility to convert base64 URL to Uint8Array for VAPID applicationServerKey
 */
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotifications({ userEmail = null, role = 'client', autoSync = true } = {}) {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // 1. Feature Detection
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
      setIsSupported(supported);
      if (supported) {
        setPermission(Notification.permission);
      }
    }
  }, []);

  // 2. Register Service Worker and Check Existing Subscription
  const checkExistingSubscription = useCallback(async () => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      return null;
    }

    try {
      const reg = await navigator.serviceWorker.register('/sw.js');
      const sub = await reg.pushManager.getSubscription();

      if (sub) {
        setIsSubscribed(true);

        // Auto sync with backend if user email is present
        if (autoSync && userEmail) {
          fetch('/api/push/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              subscription: sub,
              role,
              userEmail
            })
          }).catch(() => {});
        }
        return sub;
      } else {
        setIsSubscribed(false);
        return null;
      }
    } catch (err) {
      console.warn('[Push Hook] SW registration/check note:', err);
      return null;
    }
  }, [userEmail, role, autoSync]);

  useEffect(() => {
    if (isSupported) {
      checkExistingSubscription();
    }
  }, [isSupported, checkExistingSubscription]);

  // 3. User-Initiated Subscription Flow
  const subscribeToPush = useCallback(async (customEmail = null) => {
    if (!isSupported) {
      setError('Push notifications are not supported on this device/browser.');
      return { success: false, error: 'unsupported' };
    }

    setIsLoading(true);
    setError(null);

    try {
      // Step A: Request browser permission
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result !== 'granted') {
        setIsLoading(false);
        return { success: false, error: 'permission_denied' };
      }

      // Step B: Ensure Service Worker is ready
      const reg = await navigator.serviceWorker.ready;

      // Step C: Fetch Public VAPID Key
      let vapidKey = null;
      try {
        const keyRes = await fetch('/api/push/vapid-key');
        const keyData = await keyRes.json();
        if (keyData?.publicKey) {
          vapidKey = keyData.publicKey;
        }
      } catch (keyErr) {
        console.warn('[Push Hook] VAPID key fetch note:', keyErr);
      }

      if (!vapidKey) {
        vapidKey = 'BDKsbmvlPoAp6SJQW3BAhB2IE62L9PsssS0rb730Xb3a_mbPn1VarxrvTh5fWTn3lcsYXUg_ANbNrWTkdHIUJtA';
      }

      // Step D: Create subscription
      const convertedVapidKey = urlBase64ToUint8Array(vapidKey);
      let sub = await reg.pushManager.getSubscription();

      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedVapidKey
        });
      }

      // Step E: Save to Backend
      const targetEmail = customEmail || userEmail;
      const saveRes = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription: sub,
          role,
          userEmail: targetEmail
        })
      });

      const saveData = await saveRes.json();
      setIsSubscribed(true);
      setIsLoading(false);

      return { success: true, subscription: sub, backendResult: saveData };
    } catch (err) {
      console.error('[Push Hook] subscribe error:', err);
      setError(err.message);
      setIsLoading(false);
      return { success: false, error: err.message };
    }
  }, [isSupported, userEmail, role]);

  // 4. Send Test Notification
  const sendTestPush = useCallback(async () => {
    try {
      const res = await fetch('/api/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetEmail: userEmail,
          targetRole: role,
          title: '🔔 BDigitizing Alert Test',
          message: 'Native mobile notifications are working loud and clear on this device!',
          url: role === 'admin' ? '/admin-portal' : '/client'
        })
      });
      return await res.json();
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, [userEmail, role]);

  return {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    error,
    subscribeToPush,
    sendTestPush,
    checkExistingSubscription
  };
}
