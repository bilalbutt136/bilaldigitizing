'use client';

import React, { useState, useEffect } from 'react';
import { Bell, BellRing, Check, X, Loader2, Sparkles } from 'lucide-react';
import { usePushNotifications } from '../../hooks/usePushNotifications';

export default function PushNotificationPrompt({
  userEmail = null,
  role = 'client',
  variant = 'banner', // 'banner' | 'card' | 'inline' | 'floating'
  onSubscribed = null
}) {
  const {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    subscribeToPush,
    sendTestPush
  } = usePushNotifications({ userEmail, role, autoSync: true });

  const [isDismissed, setIsDismissed] = useState(false);
  const [testSent, setTestSent] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const dismissed = localStorage.getItem('bdigi_push_prompt_dismissed');
      if (dismissed && Date.now() - Number(dismissed) < 7 * 24 * 60 * 60 * 1000) {
        setIsDismissed(true);
      }
    }
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem('bdigi_push_prompt_dismissed', String(Date.now()));
    }
  };

  const handleEnable = async () => {
    const res = await subscribeToPush();
    if (res?.success) {
      if (typeof onSubscribed === 'function') onSubscribed(res);
      // Automatically send a quick verification chime
      sendTestPush().catch(() => {});
    }
  };

  const handleTestNotification = async () => {
    setTestSent(true);
    await sendTestPush();
    setTimeout(() => setTestSent(false), 3000);
  };

  // If not supported on this browser or already dismissed while not subscribed
  if (!isSupported) return null;
  if (isDismissed && !isSubscribed) return null;

  // If already subscribed
  if (isSubscribed) {
    if (variant === 'inline') {
      return (
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.45rem',
          padding: '0.35rem 0.75rem',
          borderRadius: '20px',
          background: '#f0fdf4',
          border: '1px solid #bbf7d0',
          fontSize: '0.75rem',
          color: '#166534',
          fontWeight: 600
        }}>
          <Check size={14} style={{ color: '#16a34a' }} />
          <span>Mobile Push Alerts Active</span>
          <button
            type="button"
            onClick={handleTestNotification}
            style={{
              background: 'none',
              border: 'none',
              color: '#2563eb',
              textDecoration: 'underline',
              cursor: 'pointer',
              fontSize: '0.72rem',
              marginLeft: '0.25rem',
              padding: 0
            }}
          >
            {testSent ? '✓ Alert Sent!' : 'Test'}
          </button>
        </div>
      );
    }
    return null;
  }

  // If user explicitly blocked/denied in browser
  if (permission === 'denied') {
    return null;
  }

  // Floating Pill Variant (Ideal for Mobile App View)
  if (variant === 'floating') {
    return (
      <div style={{
        position: 'fixed',
        bottom: '80px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 50,
        width: 'calc(100% - 2rem)',
        maxWidth: '420px',
        background: '#0f172a',
        color: '#ffffff',
        padding: '0.85rem 1rem',
        borderRadius: '16px',
        boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.4), 0 8px 10px -6px rgba(15, 23, 42, 0.3)',
        border: '1px solid #334155',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '0.75rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0, flex: 1 }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #ff7a00 0%, #ea580c 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <BellRing size={18} color="#ffffff" />
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              Turn On Mobile Alerts
            </div>
            <div style={{ fontSize: '0.7rem', color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              Instant lock screen chat & order updates
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexShrink: 0 }}>
          <button
            type="button"
            onClick={handleEnable}
            disabled={isLoading}
            style={{
              background: 'linear-gradient(135deg, #ff7a00 0%, #ea580c 100%)',
              color: '#ffffff',
              border: 'none',
              padding: '0.45rem 0.85rem',
              borderRadius: '8px',
              fontSize: '0.78rem',
              fontWeight: 700,
              cursor: isLoading ? 'wait' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              boxShadow: '0 2px 6px rgba(234, 88, 12, 0.35)'
            }}
          >
            {isLoading ? <Loader2 size={13} className="spin-icon" /> : <Sparkles size={13} />}
            Enable
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            style={{
              background: 'none',
              border: 'none',
              color: '#64748b',
              padding: '0.35rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={16} />
          </button>
        </div>
      </div>
    );
  }

  // Standard Banner Variant
  return (
    <div style={{
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      border: '1px solid #334155',
      borderRadius: '12px',
      padding: '0.85rem 1.15rem',
      color: '#ffffff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '1rem',
      margin: '0.5rem 0 1rem 0',
      boxShadow: '0 4px 12px rgba(15, 23, 42, 0.08)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', minWidth: 0, flex: 1 }}>
        <div style={{
          width: '38px',
          height: '38px',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, #ff7a00 0%, #ea580c 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          <BellRing size={20} color="#ffffff" />
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: '0.88rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <span>Enable Mobile Push Notifications</span>
            <span style={{ fontSize: '0.65rem', background: 'rgba(234, 88, 12, 0.25)', color: '#fdba74', padding: '0.1rem 0.45rem', borderRadius: '4px', fontWeight: 700 }}>
              WhatsApp Style
            </span>
          </div>
          <div style={{ fontSize: '0.76rem', color: '#94a3b8', marginTop: '0.15rem' }}>
            Receive message alerts and order completions directly on your lock screen and notification bar.
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
        <button
          type="button"
          onClick={handleEnable}
          disabled={isLoading}
          style={{
            background: 'linear-gradient(135deg, #ff7a00 0%, #ea580c 100%)',
            color: '#ffffff',
            border: 'none',
            padding: '0.5rem 1.1rem',
            borderRadius: '8px',
            fontSize: '0.8rem',
            fontWeight: 700,
            cursor: isLoading ? 'wait' : 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            boxShadow: '0 2px 6px rgba(234, 88, 12, 0.35)',
            transition: 'all 0.15s ease'
          }}
        >
          {isLoading ? <Loader2 size={14} className="spin-icon" /> : <Bell size={14} />}
          Enable Notifications
        </button>
        <button
          type="button"
          onClick={handleDismiss}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#94a3b8',
            padding: '0.4rem',
            cursor: 'pointer',
            borderRadius: '6px'
          }}
          title="Dismiss"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
