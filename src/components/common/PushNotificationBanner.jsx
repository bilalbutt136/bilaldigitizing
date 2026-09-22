'use client';

import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle2, Smartphone, ShieldCheck, AlertCircle, Sparkles, X } from 'lucide-react';
import { usePushNotifications } from '../../hooks/usePushNotifications';
import { useAppState } from '../../context/StateContext';

export const PushNotificationBanner = ({ 
  compact = false, 
  showTestButton = true, 
  className = '',
  onClose = null 
}) => {
  const { authUser, currentUser, theme } = useAppState();
  const isDark = theme === 'dark';

  const activeUser = authUser || currentUser;
  const userEmail = activeUser?.email ? activeUser.email.toLowerCase().trim() : '';
  const role = activeUser?.role === 'admin' ? 'admin' : 'client';
  const userId = activeUser?.id || null;

  const {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    isTesting,
    testCountdown,
    errorMessage,
    subscribeToPush,
    triggerTestNotification
  } = usePushNotifications({ userEmail, role, userId });

  const [isDismissed, setIsDismissed] = useState(false);
  const [isIosBrowser, setIsIosBrowser] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
      const isStandalone = window.navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches;
      if (isIos && !isStandalone) {
        setIsIosBrowser(true);
      }
    }
  }, []);

  if (isDismissed) return null;

  // iOS Safari non-PWA guidance
  if (isIosBrowser && !isSubscribed) {
    return (
      <div 
        className={className}
        style={{
          background: isDark ? 'linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)' : 'linear-gradient(135deg, #eff6ff 0%, #e0e7ff 100%)',
          border: isDark ? '1.5px solid #4338ca' : '1.5px solid #c7d2fe',
          borderRadius: '16px',
          padding: compact ? '0.75rem 1rem' : '1rem 1.15rem',
          boxShadow: '0 4px 14px rgba(67, 56, 202, 0.12)',
          position: 'relative'
        }}
      >
        {onClose && (
          <button 
            type="button" 
            onClick={() => { setIsDismissed(true); if (onClose) onClose(); }}
            style={{ position: 'absolute', top: '10px', right: '10px', background: 'transparent', border: 'none', color: isDark ? '#94a3b8' : '#64748b', cursor: 'pointer' }}
          >
            <X size={16} />
          </button>
        )}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: isDark ? 'rgba(99, 102, 241, 0.2)' : '#e0e7ff',
            color: '#4f46e5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Smartphone size={20} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 800, color: isDark ? '#ffffff' : '#1e1b4b' }}>
              iPhone Lock-Screen Alerts
            </h4>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.78rem', color: isDark ? '#cbd5e1' : '#4338ca', lineHeight: 1.4 }}>
              To receive lock-screen popups on iPhone: tap the browser <strong>Share button (⎙)</strong>, select <strong>"Add to Home Screen"</strong>, then open the app.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Active Subscribed State
  if (isSubscribed) {
    return (
      <div 
        className={className}
        style={{
          background: isDark ? 'linear-gradient(135deg, rgba(6, 78, 59, 0.3) 0%, rgba(15, 23, 42, 0.8) 100%)' : 'linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%)',
          border: isDark ? '1.5px solid rgba(16, 185, 129, 0.4)' : '1.5px solid #a7f3d0',
          borderRadius: '16px',
          padding: compact ? '0.7rem 0.95rem' : '0.9rem 1.15rem',
          display: 'flex',
          flexDirection: compact ? 'column' : 'row',
          alignItems: compact ? 'stretch' : 'center',
          justifyContent: 'space-between',
          gap: '0.75rem',
          boxShadow: '0 2px 8px rgba(16, 185, 129, 0.08)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: '#10b981',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <CheckCircle2 size={18} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ fontSize: '0.86rem', fontWeight: 800, color: isDark ? '#34d399' : '#065f46' }}>
                Lock-Screen Alerts Active
              </span>
              <span style={{
                background: isDark ? 'rgba(52, 211, 153, 0.2)' : '#d1fae5',
                color: isDark ? '#6ee7b7' : '#047857',
                fontSize: '0.65rem',
                fontWeight: 800,
                padding: '0.1rem 0.4rem',
                borderRadius: '6px'
              }}>
                200% READY
              </span>
            </div>
            <p style={{ margin: '0.1rem 0 0', fontSize: '0.74rem', color: isDark ? '#94a3b8' : '#047857' }}>
              Screen-off popups & vibrations active for messages & orders
            </p>
          </div>
        </div>

        {showTestButton && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={() => triggerTestNotification(5)}
              disabled={isTesting}
              style={{
                background: isTesting 
                  ? '#dc2626' 
                  : (isDark ? 'linear-gradient(135deg, #059669 0%, #047857 100%)' : '#059669'),
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                padding: '0.45rem 0.85rem',
                fontSize: '0.78rem',
                fontWeight: 800,
                cursor: isTesting ? 'default' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
                boxShadow: '0 2px 6px rgba(5, 150, 105, 0.3)',
                whiteSpace: 'nowrap'
              }}
            >
              {isTesting ? (
                <>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ffffff', animation: 'pulse 1s infinite' }} />
                  🔒 Lock Screen Now! ({testCountdown}s)
                </>
              ) : (
                <>
                  <Smartphone size={14} />
                  📲 Test Lock Screen (5s)
                </>
              )}
            </button>
          </div>
        )}
      </div>
    );
  }

  // Not Subscribed / Permission Default State
  return (
    <div 
      className={className}
      style={{
        background: isDark 
          ? 'linear-gradient(135deg, rgba(234, 88, 12, 0.15) 0%, rgba(15, 23, 42, 0.9) 100%)' 
          : 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
        border: isDark ? '1.5px solid rgba(234, 88, 12, 0.4)' : '1.5px solid #fed7aa',
        borderRadius: '16px',
        padding: compact ? '0.75rem 0.95rem' : '0.95rem 1.15rem',
        boxShadow: '0 4px 14px rgba(234, 88, 12, 0.12)',
        position: 'relative'
      }}
    >
      <div style={{ display: 'flex', flexDirection: compact ? 'column' : 'row', alignItems: compact ? 'stretch' : 'center', justifyContent: 'space-between', gap: '0.85rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(234, 88, 12, 0.35)',
            flexShrink: 0
          }}>
            <Bell size={20} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 900, color: isDark ? '#ffffff' : '#9a3412' }}>
                Enable Lock-Screen Alerts
              </h4>
              <span style={{
                background: '#ea580c',
                color: '#ffffff',
                fontSize: '0.62rem',
                fontWeight: 900,
                padding: '0.1rem 0.45rem',
                borderRadius: '6px',
                letterSpacing: '0.02em'
              }}>
                WHATSAPP-STYLE
              </span>
            </div>
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.76rem', color: isDark ? '#cbd5e1' : '#7c2d12', lineHeight: 1.35 }}>
              Receive instant screen-wake popups & vibrations when messages or orders arrive, even when your screen is OFF.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={subscribeToPush}
          disabled={isLoading}
          style={{
            background: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '12px',
            padding: '0.6rem 1.15rem',
            fontSize: '0.82rem',
            fontWeight: 900,
            cursor: isLoading ? 'default' : 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.45rem',
            boxShadow: '0 4px 14px rgba(234, 88, 12, 0.35)',
            flexShrink: 0,
            opacity: isLoading ? 0.7 : 1
          }}
        >
          {isLoading ? (
            'Activating...'
          ) : (
            <>
              <Sparkles size={15} />
              Enable Alerts
            </>
          )}
        </button>
      </div>

      {errorMessage && (
        <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#ef4444', fontSize: '0.72rem' }}>
          <AlertCircle size={13} />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
};

export default PushNotificationBanner;
