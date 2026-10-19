'use client';

import React, { useState, useEffect } from 'react';
import { useAppState } from '../../../context/StateContext';
import {
  CreditCard,
  ShieldCheck,
  Zap,
  Save,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sparkles,
  Lock,
  Globe
} from 'lucide-react';

// Authentic Branded Icons
const CardBrandIcon = () => (
  <div style={{
    width: '44px',
    height: '44px',
    borderRadius: '12px',
    background: '#0f172a',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
    flexShrink: 0
  }}>
    <svg width="30" height="20" viewBox="0 0 32 22" fill="none">
      <rect width="32" height="22" rx="4" fill="#0f172a" />
      <rect y="4" width="32" height="4" fill="#f97316" />
      <rect x="4" y="14" width="6" height="3" rx="1.5" fill="#e2e8f0" />
      <circle cx="24" cy="15.5" r="2.5" fill="#ef4444" fillOpacity="0.9" />
      <circle cx="27" cy="15.5" r="2.5" fill="#f59e0b" fillOpacity="0.9" />
    </svg>
  </div>
);

const ApplePayBrandIcon = () => (
  <div style={{
    width: '44px',
    height: '44px',
    borderRadius: '12px',
    background: '#000000',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
    flexShrink: 0
  }}>
    <svg width="32" height="15" viewBox="0 0 165 67" fill="none">
      <path d="M50.57 32.54c-.05-7.39 6.03-10.94 6.3-11.11-3.43-5.01-8.77-5.7-10.67-5.78-4.55-.46-8.88 2.68-11.19 2.68-2.31 0-5.88-2.61-9.66-2.54-4.97.07-9.56 2.89-12.12 7.35-5.17 8.98-1.32 22.28 3.71 29.54 2.46 3.55 5.39 7.54 9.23 7.4 3.7-.15 5.1-2.39 9.57-2.39 4.47 0 5.73 2.39 9.63 2.31 3.97-.07 6.49-3.6 8.93-7.17 2.82-4.12 3.98-8.11 4.05-8.32-.09-.04-7.71-2.96-7.76-11.77zM42.27 10.65c2.05-2.48 3.43-5.93 3.05-9.38-2.95.12-6.52 1.96-8.63 4.44-1.85 2.14-3.47 5.66-3.03 9.04 3.29.26 6.56-1.62 8.61-4.1z" fill="#ffffff" />
      <path d="M78.69 49.33V27.42h8.51c6.51 0 10.82 4.14 10.82 10.95 0 6.84-4.34 10.96-10.89 10.96h-8.44zm4.49-4h3.83c4.27 0 6.94-2.63 6.94-6.96 0-4.3-2.67-6.95-6.94-6.95h-3.83v13.91zM100.86 42.48c0-4.66 3.65-7.35 10.15-7.74l6.09-.36v-1.69c0-2.85-1.92-4.49-5.34-4.49-2.95 0-5.01 1.25-5.54 3.19h-4.04c.48-3.9 4.34-6.84 9.68-6.84 5.92 0 9.4 3.16 9.4 8.65v16.13h-4.16v-3.79h-.18c-1.42 2.45-4.16 4.14-7.46 4.14-5.2 0-8.6-3.16-8.6-7.2zm16.24-2.12v-2.03l-5.32.34c-3.88.24-6.07 1.71-6.07 4.32 0 2.49 2.05 4.14 5.06 4.14 3.88 0 6.33-2.68 6.33-6.77zM126.96 57.65l4.34-13.84-8.83-22.12h4.74l6.23 16.99h.16l6.21-16.99h4.59L131.7 57.65h-4.74z" fill="#ffffff" />
    </svg>
  </div>
);

const GooglePayBrandIcon = () => (
  <div style={{
    width: '44px',
    height: '44px',
    borderRadius: '12px',
    background: '#ffffff',
    border: '1.5px solid #e2e8f0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
    flexShrink: 0
  }}>
    <svg width="34" height="18" viewBox="0 0 54 22" fill="none">
      <path d="M10.8 10.7v-2.3h6.5c.1.4.1.8.1 1.3 0 1.6-.4 3.5-1.8 4.9-1.3 1.4-3 2.1-5.3 2.1-4.2 0-7.7-3.4-7.7-7.7s3.4-7.7 7.7-7.7c2.3 0 4 1 5.3 2.2l-1.6 1.6c-.9-.9-2.1-1.5-3.7-1.5-3 0-5.4 2.5-5.4 5.5s2.4 5.5 5.4 5.5c2 0 3.1-.8 3.8-1.5.6-.6 1-1.5 1.2-2.7h-4.5z" fill="#4285F4" />
      <path d="M26.2 6.8h3.9c1.2 0 2.2.4 2.9 1.1.7.7 1.1 1.6 1.1 2.7s-.4 2-1.1 2.7c-.7.7-1.7 1.1-2.9 1.1h-2v4.8h-1.9V6.8zm3.9 6c.7 0 1.3-.2 1.7-.7.4-.5.7-1.1.7-1.8s-.2-1.3-.7-1.8c-.4-.5-1-.7-1.7-.7h-2v5h2z" fill="#5F6368" />
      <path d="M37.8 14.6c0-1.4 1.1-2.1 3-2.2l2.1-.1v-.5c0-.7-.5-1.2-1.5-1.2-.8 0-1.4.4-1.6 1h-1.8c.2-1.5 1.5-2.4 3.4-2.4 2 0 3.3 1.1 3.3 2.8v7.2h-1.8v-1.6c-.6 1.1-1.8 1.8-3.1 1.8-1.7 0-2.8-1.1-2.8-2.6zm5.1-1v-.8l-1.9.1c-1 .1-1.5.5-1.5 1.2 0 .7.6 1.2 1.4 1.2 1.1 0 2-.8 2-1.7z" fill="#5F6368" />
      <path d="M48.1 21.5l2-5.4-3.5-7.8h2l2.4 5.8 2.3-5.8h1.9l-5.3 12.1h-1.8z" fill="#5F6368" />
    </svg>
  </div>
);

const PayPalBrandIcon = () => (
  <div style={{
    width: '44px',
    height: '44px',
    borderRadius: '12px',
    background: '#ffffff',
    border: '1.5px solid #e2e8f0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
    flexShrink: 0
  }}>
    <svg width="26" height="26" viewBox="0 0 32 32" fill="none">
      <path d="M10.5 4.5h7.2c3.4 0 5.6 1.7 5.1 5.1-.6 4-3.2 6.4-6.8 6.4h-2.5l-1.4 8.5H7.5l3-20z" fill="#003087" />
      <path d="M14.5 10h6.2c3 0 4.8 1.5 4.4 4.5-.6 3.5-2.8 5.6-6 5.6h-2.2l-1.2 7.4H11l3.5-17.5z" fill="#0079C1" fillOpacity="0.85" />
      <path d="M13.8 16h2.8c2.8 0 4.4-1.3 4.8-3.8.4-2.5-1-3.7-3.8-3.7h-4.8l-1.8 11.5h2.8l.8-4z" fill="#00457C" />
    </svg>
  </div>
);

const CashAppBrandIcon = () => (
  <div style={{
    width: '44px',
    height: '44px',
    borderRadius: '12px',
    background: '#00D632',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 12px rgba(0, 214, 50, 0.35)',
    flexShrink: 0
  }}>
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M13.2 4.5c.3-1 .1-1.7-.5-1.9-.6-.2-1.3.3-1.6 1.3L10.5 6.3C7.5 6.8 5.5 8.7 5.9 11.3c.5 3.1 3.5 3.8 5.6 4.3l.6.1c1.5.4 2.6.7 2.4 1.8-.2 1.1-1.5 1.5-2.8 1.3-1.4-.2-2.3-.9-2.6-1.8-.2-.7-.8-1-1.5-.8-.7.2-1 .8-.8 1.5.5 1.6 2 2.7 4.2 3.1l-.6 2.4c-.3 1-.1 1.7.5 1.9.6.2 1.3-.3 1.6-1.3l.6-2.4c3.1-.5 5.2-2.4 4.8-5-.5-3.1-3.6-3.8-5.7-4.3l-.6-.1c-1.5-.4-2.5-.7-2.3-1.8.2-1.1 1.5-1.5 2.6-1.3 1.2.2 2 .8 2.3 1.6.2.7.8 1 1.5.8.7-.2 1-.8.8-1.5-.4-1.4-1.7-2.4-3.8-2.8l.6-2.4z" fill="#ffffff" />
    </svg>
  </div>
);

const WalletBrandIcon = () => (
  <div style={{
    width: '44px',
    height: '44px',
    borderRadius: '12px',
    background: 'linear-gradient(120deg, var(--color-action-start, #2563eb) 0%, var(--color-action-end, #4338ca) 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 12px var(--color-primary-glow)',
    color: '#ffffff',
    flexShrink: 0
  }}>
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4" />
      <path d="M4 6v12a2 2 0 0 0 2 2h14v-4" />
      <path d="M18 12a2 2 0 0 0-2 2c0 1.1.9 2 2 2h4v-4h-4z" />
      <circle cx="18" cy="14" r="1" fill="#ffffff" />
    </svg>
  </div>
);

export const PaymentMethodSettings = () => {
  const { siteSettings = {}, updateSiteSettings, showToast } = useAppState();

  const savedMethods = siteSettings?.paymentMethods || {};

  // Form states - defaults: Card, Apple Pay, Google Pay, Wallet ON; PayPal & Cash App OFF
  const [cardEnabled, setCardEnabled] = useState(savedMethods.card !== false);
  const [applePayEnabled, setApplePayEnabled] = useState(savedMethods.apple_pay !== false);
  const [googlePayEnabled, setGooglePayEnabled] = useState(savedMethods.google_pay !== false);
  const [paypalEnabled, setPaypalEnabled] = useState(savedMethods.paypal === true);
  const [cashappEnabled, setCashappEnabled] = useState(savedMethods.cashapp === true);
  const [walletEnabled, setWalletEnabled] = useState(savedMethods.studio_wallet !== false);

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (siteSettings?.paymentMethods) {
      const pm = siteSettings.paymentMethods;
      if (pm.card !== undefined) setCardEnabled(pm.card !== false);
      if (pm.apple_pay !== undefined) setApplePayEnabled(pm.apple_pay !== false);
      if (pm.google_pay !== undefined) setGooglePayEnabled(pm.google_pay !== false);
      if (pm.paypal !== undefined) setPaypalEnabled(pm.paypal === true);
      if (pm.cashapp !== undefined) setCashappEnabled(pm.cashapp === true);
      if (pm.studio_wallet !== undefined) setWalletEnabled(pm.studio_wallet !== false);
    }
  }, [siteSettings]);

  const activeCount = [cardEnabled, applePayEnabled, googlePayEnabled, paypalEnabled, cashappEnabled, walletEnabled].filter(Boolean).length;

  const handleSave = async (overrides = null) => {
    setIsSaving(true);
    try {
      const payload = {
        card: overrides?.card !== undefined ? overrides.card : cardEnabled,
        apple_pay: overrides?.apple_pay !== undefined ? overrides.apple_pay : applePayEnabled,
        google_pay: overrides?.google_pay !== undefined ? overrides.google_pay : googlePayEnabled,
        paypal: overrides?.paypal !== undefined ? overrides.paypal : paypalEnabled,
        cashapp: overrides?.cashapp !== undefined ? overrides.cashapp : cashappEnabled,
        studio_wallet: overrides?.studio_wallet !== undefined ? overrides.studio_wallet : walletEnabled
      };

      await updateSiteSettings({ paymentMethods: payload });
      showToast('Payment gateway preferences saved to live database!', 'success');
    } catch (err) {
      console.error('Failed to save payment settings:', err);
      showToast('Could not save payment settings: ' + (err.message || 'Unknown error'), 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleMethod = (key, currentVal, setter) => {
    const nextVal = !currentVal;
    setter(nextVal);
    // Auto-save on toggle for VIP immediate feedback
    handleSave({ [key]: nextVal });
  };

  const methodsList = [
    {
      id: 'card',
      key: 'card',
      name: 'Credit / Debit Card',
      subtitle: 'Visa, MasterCard, American Express, Discover',
      desc: 'Seamless direct card payment powered by BoltPayouts. Directly opens the secure checkout portal without any intermediate crypto steps.',
      icon: <CardBrandIcon />,
      enabled: cardEnabled,
      setter: setCardEnabled,
      badge: 'POPULAR & RECOMMENDED',
      badgeColor: '#059669',
      isPrimary: true
    },
    {
      id: 'apple_pay',
      key: 'apple_pay',
      name: 'Apple Pay',
      subtitle: 'Apple Wallet & Express Touch/Face ID',
      desc: 'Instant checkout for Apple Safari and iOS devices. Seamlessly routed through BoltPayouts Apple Pay gateway.',
      icon: <ApplePayBrandIcon />,
      enabled: applePayEnabled,
      setter: setApplePayEnabled,
      badge: 'EXPRESS CHECKOUT',
      badgeColor: '#000000',
      isPrimary: true
    },
    {
      id: 'google_pay',
      key: 'google_pay',
      name: 'Google Pay',
      subtitle: 'Google Wallet & Saved Credit Cards',
      desc: 'Fast 1-tap checkout for Android, Chrome, and Google account users via BoltPayouts Google Pay gateway.',
      icon: <GooglePayBrandIcon />,
      enabled: googlePayEnabled,
      setter: setGooglePayEnabled,
      badge: 'FAST & SECURE',
      badgeColor: '#2563eb',
      isPrimary: true
    },
    {
      id: 'paypal',
      key: 'paypal',
      name: 'PayPal (PYUSD & Direct)',
      subtitle: 'PayPal PYUSD Crypto & Gateway',
      desc: 'Accept PayPal payments. Turn this ON whenever you wish to show PayPal as an option on checkout and deposits.',
      icon: <PayPalBrandIcon />,
      enabled: paypalEnabled,
      setter: setPaypalEnabled,
      badge: paypalEnabled ? 'ACTIVATED' : 'DISABLED (CLICK TO ACTIVATE)',
      badgeColor: paypalEnabled ? '#003087' : '#64748b',
      isPrimary: false
    },
    {
      id: 'cashapp',
      key: 'cashapp',
      name: 'Cash App Pay',
      subtitle: 'Bitcoin Lightning ⚡ Instant Settlement',
      desc: 'Accept Cash App via instant Bitcoin Lightning network. Turn this ON whenever you want to offer Cash App payments.',
      icon: <CashAppBrandIcon />,
      enabled: cashappEnabled,
      setter: setCashappEnabled,
      badge: cashappEnabled ? 'ACTIVATED' : 'DISABLED (CLICK TO ACTIVATE)',
      badgeColor: cashappEnabled ? '#00D632' : '#64748b',
      isPrimary: false
    },
    {
      id: 'studio_wallet',
      key: 'studio_wallet',
      name: 'Studio Wallet',
      subtitle: 'Internal Pre-Funded Client Balance',
      desc: 'Allows registered studio clients to pay orders instantly using their deposited wallet balance.',
      icon: <WalletBrandIcon />,
      enabled: walletEnabled,
      setter: setWalletEnabled,
      badge: 'INTERNAL BALANCE',
      badgeColor: '#4338ca',
      isPrimary: false
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

      {/* 1. Executive Header & Live Gateway Card */}
      <div className="card" style={{
        padding: '2rem',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: '20px',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.35rem' }}>
              <div style={{
                background: 'linear-gradient(135deg, rgba(5, 150, 105, 0.15) 0%, rgba(37, 99, 235, 0.15) 100%)',
                color: '#059669',
                padding: '0.6rem',
                borderRadius: '12px'
              }}>
                <CreditCard size={24} />
              </div>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--color-text-primary)', margin: 0 }}>
                Payment Gateways & Methods Engine
              </h3>
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', margin: 0, maxWidth: '640px', lineHeight: 1.5 }}>
              Control which payment methods are presented to clients during order checkout and Studio Wallet top-ups. Toggle PayPal or Cash App ON whenever needed.
            </p>
          </div>

          {/* Quick Metrics */}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div style={{
              background: 'var(--color-subtle, var(--bg-subtle))',
              border: '1px solid var(--border-color)',
              padding: '0.65rem 1rem',
              borderRadius: '12px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', fontWeight: 800, textTransform: 'uppercase' }}>
                Active Methods
              </div>
              <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#059669', marginTop: '0.1rem' }}>
                {activeCount} / 6
              </div>
            </div>

            <div style={{
              background: 'var(--color-subtle, var(--bg-subtle))',
              border: '1px solid var(--border-color)',
              padding: '0.65rem 1rem',
              borderRadius: '12px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', fontWeight: 800, textTransform: 'uppercase' }}>
                Gateway Provider
              </div>
              <div style={{ fontSize: '0.95rem', fontWeight: 900, color: 'var(--color-text-primary)', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <ShieldCheck size={16} style={{ color: '#059669' }} /> BoltPayouts Live
              </div>
            </div>
          </div>
        </div>

        {/* Informative notice on direct VIP portal checkout */}
        <div style={{
          marginTop: '1.5rem',
          background: 'rgba(5, 150, 105, 0.08)',
          border: '1px solid rgba(5, 150, 105, 0.25)',
          borderRadius: '12px',
          padding: '0.85rem 1.15rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <Sparkles size={18} style={{ color: '#059669', flexShrink: 0 }} />
          <div style={{ fontSize: '0.84rem', color: 'var(--color-text-primary)', lineHeight: 1.45 }}>
            <strong>VIP Direct Checkout Enabled:</strong> Card, Apple Pay, and Google Pay now open the checkout portal directly without confusing address copy/paste steps.
          </div>
        </div>
      </div>

      {/* 2. Methods Toggle Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.25rem' }}>
        {methodsList.map((method) => {
          return (
            <div
              key={method.id}
              style={{
                background: 'var(--bg-card)',
                border: method.enabled ? '2px solid rgba(5, 150, 105, 0.4)' : '1px solid var(--border-color)',
                borderRadius: '16px',
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '1.25rem',
                boxShadow: method.enabled ? '0 4px 18px rgba(5, 150, 105, 0.08)' : 'var(--shadow-sm)',
                transition: 'all 0.2s ease',
                position: 'relative'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    {method.icon}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900, color: 'var(--color-text-primary)' }}>
                          {method.name}
                        </h4>
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', fontWeight: 600, marginTop: '0.2rem' }}>
                        {method.subtitle}
                      </div>
                    </div>
                  </div>

                  {/* Toggle Switch */}
                  <button
                    type="button"
                    onClick={() => toggleMethod(method.key, method.enabled, method.setter)}
                    disabled={isSaving}
                    aria-label={`Toggle ${method.name}`}
                    style={{
                      width: '54px',
                      height: '30px',
                      borderRadius: '999px',
                      background: method.enabled ? '#059669' : 'var(--color-subtle, #94a3b8)',
                      border: 'none',
                      position: 'relative',
                      cursor: 'pointer',
                      transition: 'background 0.25s ease',
                      flexShrink: 0,
                      padding: 0,
                      boxShadow: method.enabled ? '0 2px 8px rgba(5, 150, 105, 0.4)' : 'none'
                    }}
                  >
                    <div style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: '#ffffff',
                      position: 'absolute',
                      top: '3px',
                      left: method.enabled ? '27px' : '3px',
                      transition: 'left 0.25s ease',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {method.enabled ? (
                        <CheckCircle2 size={13} style={{ color: '#059669' }} />
                      ) : (
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#94a3b8' }} />
                      )}
                    </div>
                  </button>
                </div>

                <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--color-text-secondary, var(--color-text-muted))', lineHeight: 1.5 }}>
                  {method.desc}
                </p>
              </div>

              {/* Status footer pill */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: '0.85rem',
                borderTop: '1px solid var(--border-color)',
                fontSize: '0.78rem'
              }}>
                <span style={{
                  fontSize: '0.72rem',
                  fontWeight: 900,
                  padding: '0.2rem 0.6rem',
                  borderRadius: '6px',
                  background: method.enabled ? 'rgba(5, 150, 105, 0.12)' : 'var(--color-subtle, #f1f5f9)',
                  color: method.enabled ? '#059669' : 'var(--color-text-muted)',
                  border: method.enabled ? '1px solid rgba(5, 150, 105, 0.3)' : '1px solid var(--border-color)',
                  letterSpacing: '0.03em'
                }}>
                  {method.enabled ? '● ACTIVE ON CHECKOUT' : '○ HIDDEN / DISABLED'}
                </span>

                <span style={{
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  color: method.badgeColor,
                  textTransform: 'uppercase'
                }}>
                  {method.badge}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Global Save Bar */}
      <div className="card" style={{
        padding: '1.25rem 1.75rem',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: '16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
          <ShieldCheck size={16} style={{ color: '#059669' }} />
          <span>Settings sync in real-time with customer checkout and Studio Wallet deposit modals.</span>
        </div>

        <button
          type="button"
          onClick={() => handleSave()}
          disabled={isSaving}
          style={{
            background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
            color: '#ffffff',
            border: 'none',
            padding: '0.75rem 1.75rem',
            borderRadius: '12px',
            fontSize: '0.9rem',
            fontWeight: 800,
            cursor: isSaving ? 'not-allowed' : 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            boxShadow: '0 4px 14px rgba(5, 150, 105, 0.35)',
            transition: 'all 0.15s ease'
          }}
        >
          <Save size={16} />
          {isSaving ? 'Saving Preferences...' : 'Save Payment Preferences'}
        </button>
      </div>

    </div>
  );
};

export default PaymentMethodSettings;
