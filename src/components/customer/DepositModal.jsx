'use client';

import React, { useState, useEffect } from 'react';
import { useAppState } from '../../context/StateContext';
import { getAuthHeaders } from '../../services/supabaseService';
import { 
  X, 
  Wallet, 
  ShieldCheck, 
  CheckCircle, 
  Loader2, 
  Copy, 
  Check, 
  ExternalLink,
  Lock,
  Zap,
  Coins,
  ArrowLeft,
  ChevronRight
} from 'lucide-react';
import { useModalBackNavigation } from '../../hooks/useModalBackNavigation';

// Authentic Branded Payment Method SVG Components (matching CheckoutModal)
const CardBrandIcon = () => (
  <div style={{
    width: '42px',
    height: '42px',
    borderRadius: '12px',
    background: 'var(--color-surface)',
    border: '1.5px solid #e2e8f0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
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
    width: '42px',
    height: '42px',
    borderRadius: '12px',
    background: '#000000',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
    flexShrink: 0
  }}>
    <svg width="30" height="15" viewBox="0 0 165 67" fill="none">
      <path d="M50.57 32.54c-.05-7.39 6.03-10.94 6.3-11.11-3.43-5.01-8.77-5.7-10.67-5.78-4.55-.46-8.88 2.68-11.19 2.68-2.31 0-5.88-2.61-9.66-2.54-4.97.07-9.56 2.89-12.12 7.35-5.17 8.98-1.32 22.28 3.71 29.54 2.46 3.55 5.39 7.54 9.23 7.4 3.7-.15 5.1-2.39 9.57-2.39 4.47 0 5.73 2.39 9.63 2.31 3.97-.07 6.49-3.6 8.93-7.17 2.82-4.12 3.98-8.11 4.05-8.32-.09-.04-7.71-2.96-7.76-11.77zM42.27 10.65c2.05-2.48 3.43-5.93 3.05-9.38-2.95.12-6.52 1.96-8.63 4.44-1.85 2.14-3.47 5.66-3.03 9.04 3.29.26 6.56-1.62 8.61-4.1z" fill="#ffffff" />
      <path d="M78.69 49.33V27.42h8.51c6.51 0 10.82 4.14 10.82 10.95 0 6.84-4.34 10.96-10.89 10.96h-8.44zm4.49-4h3.83c4.27 0 6.94-2.63 6.94-6.96 0-4.3-2.67-6.95-6.94-6.95h-3.83v13.91zM100.86 42.48c0-4.66 3.65-7.35 10.15-7.74l6.09-.36v-1.69c0-2.85-1.92-4.49-5.34-4.49-2.95 0-5.01 1.25-5.54 3.19h-4.04c.48-3.9 4.34-6.84 9.68-6.84 5.92 0 9.4 3.16 9.4 8.65v16.13h-4.16v-3.79h-.18c-1.42 2.45-4.16 4.14-7.46 4.14-5.2 0-8.6-3.16-8.6-7.2zm16.24-2.12v-2.03l-5.32.34c-3.88.24-6.07 1.71-6.07 4.32 0 2.49 2.05 4.14 5.06 4.14 3.88 0 6.33-2.68 6.33-6.77zM126.96 57.65l4.34-13.84-8.83-22.12h4.74l6.23 16.99h.16l6.21-16.99h4.59L131.7 57.65h-4.74z" fill="#ffffff" />
    </svg>
  </div>
);

const GooglePayBrandIcon = () => (
  <div style={{
    width: '42px',
    height: '42px',
    borderRadius: '12px',
    background: 'var(--color-surface)',
    border: '1.5px solid #e2e8f0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
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
    width: '42px',
    height: '42px',
    borderRadius: '12px',
    background: 'var(--color-surface)',
    border: '1.5px solid #e2e8f0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
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
    width: '42px',
    height: '42px',
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

export const DepositModal = () => {
  const { 
    isDepositModalOpen, 
    setIsDepositModalOpen, 
    setWalletBalance,
    fetchUserWalletBalance,
    authUser,
    currentUser,
    showToast,
    theme,
    siteSettings
  } = useAppState();

  const isDark = theme === 'dark';

  const [depositAmount, setDepositAmount] = useState('100');
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [activeView, setActiveView] = useState('select'); // 'select' | 'card' | 'apple_pay' | 'google_pay' | 'cashapp' | 'paypal'
  const [boltPaymentUrl, setBoltPaymentUrl] = useState(null);
  const [invoiceId, setInvoiceId] = useState(null);
  const [isPaid, setIsPaid] = useState(false);
  const [solanaAddress, setSolanaAddress] = useState('');
  const [lightningInvoice, setLightningInvoice] = useState('');
  const [hasCopied, setHasCopied] = useState(false);

  const presets = [25, 50, 100, 250, 500];

  const configuredMethods = siteSettings?.paymentMethods || {};

  const allPaymentMethods = [
    { 
      id: 'card', 
      name: 'Credit / Debit Card', 
      subtext: 'Visa, Mastercard, Amex, Discover',
      icon: <CardBrandIcon />,
      badge: 'POPULAR',
      enabled: configuredMethods.card !== false
    },
    { 
      id: 'apple_pay', 
      name: 'Apple Pay', 
      subtext: 'Apple Wallet & Express Pay',
      icon: <ApplePayBrandIcon />,
      badge: 'FAST',
      enabled: configuredMethods.apple_pay !== false
    },
    { 
      id: 'google_pay', 
      name: 'Google Pay', 
      subtext: 'Google Wallet & Saved Cards',
      icon: <GooglePayBrandIcon />,
      badge: 'FAST',
      enabled: configuredMethods.google_pay !== false
    },
    { 
      id: 'paypal', 
      name: 'PayPal', 
      subtext: 'PYUSD / PayPal Direct',
      icon: <PayPalBrandIcon />,
      badge: 'PYUSD',
      enabled: configuredMethods.paypal === true
    },
    { 
      id: 'cashapp', 
      name: 'Cash App Pay', 
      subtext: 'Bitcoin Lightning ⚡ Instant',
      icon: <CashAppBrandIcon />,
      badge: 'LIGHTNING',
      enabled: configuredMethods.cashapp === true
    },
  ];

  const paymentMethods = allPaymentMethods.filter(m => m.enabled);

  const handleClose = () => {
    setIsDepositModalOpen(false);
    setTimeout(() => {
      setBoltPaymentUrl(null);
      setInvoiceId(null);
      setIsPaid(false);
      setIsInitializing(false);
      setSelectedMethod(null);
      setActiveView('select');
      setSolanaAddress('');
      setLightningInvoice('');
      setHasCopied(false);
    }, 300);
  };

  const { handleSafeClose } = useModalBackNavigation({
    isOpen: isDepositModalOpen,
    onClose: handleClose,
    modalId: 'deposit_modal'
  });

  useEffect(() => {
    if (!isDepositModalOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleSafeClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow || 'unset';
    };
  }, [isDepositModalOpen, handleSafeClose]);

  // Payment status fallback with exponential backoff. Stripe/Bolt webhooks remain
  // authoritative; this only reconciles the UI when a payment provider is delayed.
  useEffect(() => {
    let timerId;
    let cancelled = false;
    let attempt = 0;

    const scheduleNext = (delayMs) => {
      if (!cancelled) timerId = setTimeout(checkDeposit, delayMs);
    };

    const checkDeposit = async () => {
      if (cancelled || !isDepositModalOpen || !invoiceId || isPaid) return;
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
        scheduleNext(15000);
        return;
      }

      try {
        const headers = await getAuthHeaders();
        const res = await fetch(`/api/boltpayouts/status?invoiceId=${encodeURIComponent(invoiceId)}`, { headers });
        const data = await res.json();
        if (data.success && (data.status === 'paid' || data.status === 'completed')) {
          setIsPaid(true);
          const creditedAmount = parseFloat(data.amount || depositAmount || 0);
          setWalletBalance(prev => prev + creditedAmount);
          showToast(`Successfully deposited $${creditedAmount.toFixed(2)} to your Studio Wallet!`, 'success');

          if (fetchUserWalletBalance && authUser?.email) {
            fetchUserWalletBalance(authUser.email);
          }
          return;
        }
      } catch (e) {
        console.error('Deposit status check error:', e);
      }

      attempt += 1;
      scheduleNext(Math.min(5000 + attempt * 2000, 15000));
    };

    if (isDepositModalOpen && invoiceId && !isPaid) scheduleNext(4000);
    return () => {
      cancelled = true;
      if (timerId) clearTimeout(timerId);
    };
  }, [isDepositModalOpen, invoiceId, isPaid, depositAmount, fetchUserWalletBalance, authUser, setWalletBalance, showToast]);

  const copyToClipboard = (text, label = 'Address') => {
    if (text) {
      navigator.clipboard?.writeText(text);
      setHasCopied(true);
      showToast(`${label} copied to clipboard!`, 'success');
      setTimeout(() => setHasCopied(false), 3000);
    }
  };

  const handleSelectMethod = async (methodId) => {
    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount <= 0) {
      showToast('Please enter a valid deposit amount.', 'error');
      return;
    }

    setSelectedMethod(methodId);
    setIsInitializing(true);

    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/boltpayouts/create', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          amount: amount,
          method: methodId,
          clientEmail: authUser?.email || currentUser?.email
        })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Payment gateway initialization failed');
      }

      const solana = data.solanaAddress || '';
      const lightning = data.lightningInvoice || data.lightningAddress || '';
      const paymentUrl = data.paymentUrl || (lightning ? `lightning:${lightning}` : '');

      setInvoiceId(data.invoice?.id);
      setBoltPaymentUrl(paymentUrl);
      setSolanaAddress(solana);
      setLightningInvoice(lightning);
      setHasCopied(false);
      
      // Auto-open checkout portal in a new tab if supported
      if (paymentUrl && (methodId === 'card' || methodId === 'apple_pay' || methodId === 'google_pay')) {
        try {
          const win = window.open(paymentUrl, '_blank');
          if (win) win.focus?.();
        } catch {}
      }

      // Transition directly to the target view
      if (methodId === 'card') {
        setActiveView('card');
      } else if (methodId === 'apple_pay') {
        setActiveView('apple_pay');
      } else if (methodId === 'google_pay') {
        setActiveView('google_pay');
      } else if (methodId === 'cashapp' || methodId === 'lightning' || methodId === 'dollarpay_cashapp') {
        setActiveView('cashapp');
      } else if (methodId === 'paypal' || methodId === 'pyusd' || methodId === 'dollarpay_paypal') {
        setActiveView('paypal');
      } else {
        setActiveView('card');
      }

    } catch (err) {
      console.error('Deposit setup error:', err);
      showToast('Error setting up deposit: ' + (err.message || 'Unknown error'), 'error');
      setSelectedMethod(null);
    } finally {
      setIsInitializing(false);
    }
  };

  if (!isDepositModalOpen) return null;

  return (
    <div 
      className="modal-overlay" 
      onClick={handleSafeClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1000000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        background: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(12px)',
        animation: 'fadeIn 0.3s ease-out forwards'
      }}
    >
      <style>
        {`
          @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
          @keyframes scaleUp { from { opacity: 0; transform: scale(0.95) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        `}
      </style>

      <div 
        className="modal-dialog"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: isDark ? 'var(--color-surface, #111827)' : '#ffffff',
          border: isDark ? '1px solid var(--color-border, #334155)' : '1px solid #cbd5e1',
          borderRadius: 'clamp(14px, 3vw, 24px)',
          width: '100%',
          maxWidth: '520px',
          boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.25)',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '94dvh',
          animation: 'scaleUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards'
        }}
      >
        
        {/* Header */}
        <div style={{ 
          padding: 'clamp(0.85rem, 2vw, 1.25rem) clamp(1rem, 2vw, 1.5rem)', 
          borderBottom: '1px solid #334155', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {activeView !== 'select' && !isPaid ? (
              <button
                type="button"
                onClick={() => { setActiveView('select'); setSelectedMethod(null); }}
                title="Back to Payment Methods"
                style={{
                  background: 'rgba(255, 255, 255, 0.15)',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  color: '#ffffff',
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  flexShrink: 0
                }}
                onMouseOver={(e) => { e.currentTarget.style.background = 'var(--orange-500)'; e.currentTarget.style.borderColor = 'var(--orange-400)'; }}
                onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'; e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.25)'; }}
              >
                <ArrowLeft size={18} />
              </button>
            ) : (
              <div style={{ 
                width: '36px', height: '36px', borderRadius: '50%', 
                background: isPaid ? 'rgba(16, 185, 129, 0.2)' : 'rgba(249, 115, 22, 0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: isPaid ? '#10b981' : 'var(--orange-400)',
                flexShrink: 0
              }}>
                {isPaid ? <CheckCircle size={20} /> : <Wallet size={20} />}
              </div>
            )}
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900, color: '#ffffff' }}>
                {isPaid ? 'Deposit Successful' : (
                  activeView === 'card' ? 'Credit / Debit Card Deposit' :
                  activeView === 'apple_pay' ? 'Apple Pay Deposit' :
                  activeView === 'cashapp' ? 'Cash App Lightning Deposit' :
                  activeView === 'paypal' ? 'PayPal PYUSD Deposit' :
                  (activeView === 'google_pay' || activeView === 'browser_waiting') ? 'Google Pay Deposit' :
                  'Studio Wallet Top-Up'
                )}
              </h3>
              <p style={{ margin: 0, fontSize: '0.78rem', color: '#94a3b8' }}>
                {isPaid ? 'Funds are instantly available in your wallet.' : 'Instant deposit for seamless one-click order dispatch'}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {activeView !== 'select' && !isPaid && (
              <button
                type="button"
                onClick={() => { setActiveView('select'); setSelectedMethod(null); }}
                style={{
                  background: 'rgba(255, 255, 255, 0.12)',
                  border: '1px solid rgba(255, 255, 255, 0.22)',
                  color: '#ffffff',
                  padding: '0.35rem 0.75rem',
                  borderRadius: '8px',
                  fontSize: '0.8rem',
                  fontWeight: 800,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)'; }}
                onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)'; }}
              >
                <ArrowLeft size={14} /> Back
              </button>
            )}

            <button 
              onClick={handleSafeClose}
              style={{ 
                background: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.15)', color: '#cbd5e1', 
                width: '32px', height: '32px', borderRadius: '50%', 
                display: 'flex', alignItems: 'center', justifyContent: 'center', 
                cursor: 'pointer', transition: 'all 0.2s ease' 
              }}
              onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.2)'; e.currentTarget.style.color = '#fff'; }}
              onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#cbd5e1'; }}
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>
        </div>        {/* Content */}
        <div style={{ 
          position: 'relative', 
          width: '100%', 
          display: 'flex', 
          flexDirection: 'column', 
          background: isDark ? 'var(--color-surface, #111827)' : '#f8fafc', 
          overflowY: 'auto', 
          flex: '1 1 auto', 
          minHeight: 0, 
          WebkitOverflowScrolling: 'touch',
          color: isDark ? 'var(--color-text-primary, #ffffff)' : '#0f172a'
        }}>
          
          {isPaid ? (
            /* Success View */
            <div style={{ 
              flex: 1, display: 'flex', flexDirection: 'column', 
              alignItems: 'center', justifyContent: 'center', padding: '3rem 2rem', textAlign: 'center',
              background: isDark ? 'var(--color-surface, #111827)' : '#ffffff'
            }}>
              <CheckCircle size={64} style={{ color: '#059669', marginBottom: '1.5rem' }} />
              <h2 style={{ color: isDark ? 'var(--color-text-primary, #ffffff)' : '#0f172a', fontSize: '1.6rem', fontWeight: 900, marginBottom: '0.5rem' }}>Deposit Confirmed!</h2>
              <p style={{ color: isDark ? 'var(--color-text-secondary, #cbd5e1)' : '#475569', fontSize: '0.925rem', marginBottom: '2rem', maxWidth: '340px' }}>
                Your funds have been deposited to your Studio Wallet balance.
              </p>
              <button 
                onClick={handleSafeClose}
                style={{ 
                  background: 'linear-gradient(135deg, #059669 0%, #047857 100%)', 
                  color: '#ffffff', 
                  border: 'none', 
                  padding: '0.95rem 2.25rem', 
                  borderRadius: '12px', 
                  fontSize: '1rem', 
                  fontWeight: 900, 
                  cursor: 'pointer', 
                  boxShadow: '0 8px 24px rgba(5, 150, 105, 0.35)',
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '0.5rem'
                }}
              >
                Done
              </button>
            </div>

          ) : activeView === 'card' ? (
            /* 1. CREDIT / DEBIT CARD: Direct VIP Portal View (Confusing 2-step crypto/Solana address completely removed) */
            <div style={{ padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column', flex: 1, alignItems: 'center', justifyContent: 'center', textAlign: 'center', background: isDark ? 'var(--color-surface, #111827)' : '#f8fafc' }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                background: isDark ? 'rgba(5, 150, 105, 0.2)' : '#ecfdf5',
                color: isDark ? '#34d399' : '#047857',
                fontSize: '0.78rem',
                fontWeight: 800,
                padding: '0.35rem 0.85rem',
                borderRadius: '999px',
                border: isDark ? '1.5px solid rgba(5, 150, 105, 0.4)' : '1.5px solid #a7f3d0',
                marginBottom: '1rem'
              }}>
                <ShieldCheck size={16} /> 256-Bit SSL Encrypted Card Deposit
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <CardBrandIcon />
              </div>

              <h3 style={{ fontSize: '1.35rem', fontWeight: 900, color: isDark ? 'var(--color-text-primary, #ffffff)' : '#0f172a', margin: '0 0 0.35rem' }}>
                Credit / Debit Card Deposit
              </h3>

              <p style={{ fontSize: '0.88rem', color: isDark ? 'var(--color-text-secondary, #cbd5e1)' : '#475569', margin: '0 0 1.5rem', maxWidth: '360px', lineHeight: 1.5 }}>
                Deposit Amount: <strong style={{ color: isDark ? '#34d399' : '#047857', fontSize: '1.2rem' }}>${parseFloat(depositAmount || 0).toFixed(2)}</strong>
                <br />
                <span style={{ fontSize: '0.82rem', color: isDark ? 'var(--color-text-muted, #94a3b8)' : '#64748b' }}>
                  Tap below to complete your deposit on the secure card portal.
                </span>
              </p>

              <div style={{ width: '100%', maxWidth: '360px', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                <a
                  href={boltPaymentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    width: '100%',
                    padding: '0.95rem 1.25rem',
                    fontSize: '1rem',
                    fontWeight: 900,
                    borderRadius: '14px',
                    background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.55rem',
                    boxShadow: '0 6px 20px rgba(5, 150, 105, 0.35)',
                    textDecoration: 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Lock size={18} /> Proceed to Card Portal <ExternalLink size={16} />
                </a>

                <button
                  type="button"
                  onClick={() => { setActiveView('select'); setSelectedMethod(null); }}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: isDark ? 'var(--color-subtle, #1e293b)' : '#ffffff',
                    color: isDark ? 'var(--color-text-primary, #ffffff)' : '#0f172a',
                    border: isDark ? '1.5px solid var(--color-border, #334155)' : '1.5px solid #cbd5e1',
                    borderRadius: '12px',
                    fontSize: '0.88rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.45rem',
                    transition: 'all 0.15s ease',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.02)'
                  }}
                >
                  <ArrowLeft size={16} />
                  <span>Choose Different Method or Amount</span>
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem', marginTop: '1.25rem', fontSize: '0.78rem', color: isDark ? 'var(--color-text-muted, #94a3b8)' : '#64748b' }}>
                <Loader2 size={14} className="animate-spin" style={{ color: '#059669' }} />
                Awaiting deposit confirmation... Instant wallet top-up upon confirmation
              </div>
            </div>

          ) : activeView === 'apple_pay' ? (
            /* 2. APPLE PAY: VIP Direct Portal View */
            <div style={{ padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column', flex: 1, alignItems: 'center', justifyContent: 'center', textAlign: 'center', background: isDark ? 'var(--color-surface, #111827)' : '#f8fafc' }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                background: isDark ? 'rgba(255, 255, 255, 0.1)' : '#f1f5f9',
                color: isDark ? '#ffffff' : '#0f172a',
                fontSize: '0.78rem',
                fontWeight: 800,
                padding: '0.35rem 0.85rem',
                borderRadius: '999px',
                border: isDark ? '1.5px solid rgba(255, 255, 255, 0.2)' : '1.5px solid #cbd5e1',
                marginBottom: '1rem'
              }}>
                 Apple Pay Express
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <ApplePayBrandIcon />
              </div>

              <h3 style={{ fontSize: '1.35rem', fontWeight: 900, color: isDark ? 'var(--color-text-primary, #ffffff)' : '#0f172a', margin: '0 0 0.35rem' }}>
                Deposit with Apple Pay
              </h3>

              <p style={{ fontSize: '0.88rem', color: isDark ? 'var(--color-text-secondary, #cbd5e1)' : '#475569', margin: '0 0 1.5rem', maxWidth: '360px', lineHeight: 1.5 }}>
                Deposit Amount: <strong style={{ color: isDark ? '#34d399' : '#047857', fontSize: '1.2rem' }}>${parseFloat(depositAmount || 0).toFixed(2)}</strong>
                <br />
                <span style={{ fontSize: '0.82rem', color: isDark ? 'var(--color-text-muted, #94a3b8)' : '#64748b' }}>
                  Tap below to authorize deposit with Touch ID or Face ID.
                </span>
              </p>

              <div style={{ width: '100%', maxWidth: '360px', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                <a
                  href={boltPaymentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    width: '100%',
                    padding: '0.95rem 1.25rem',
                    fontSize: '1rem',
                    fontWeight: 900,
                    borderRadius: '14px',
                    background: '#000000',
                    color: '#ffffff',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.55rem',
                    boxShadow: '0 6px 20px rgba(0, 0, 0, 0.3)',
                    textDecoration: 'none',
                    transition: 'all 0.15s ease'
                  }}
                >
                  Deposit with Pay <ExternalLink size={16} />
                </a>

                <button
                  type="button"
                  onClick={() => { setActiveView('select'); setSelectedMethod(null); }}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: isDark ? 'var(--color-subtle, #1e293b)' : '#ffffff',
                    color: isDark ? 'var(--color-text-primary, #ffffff)' : '#0f172a',
                    border: isDark ? '1.5px solid var(--color-border, #334155)' : '1.5px solid #cbd5e1',
                    borderRadius: '12px',
                    fontSize: '0.88rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.45rem',
                    transition: 'all 0.15s ease',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.02)'
                  }}
                >
                  <ArrowLeft size={16} />
                  <span>Choose Different Method or Amount</span>
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem', marginTop: '1.25rem', fontSize: '0.78rem', color: isDark ? 'var(--color-text-muted, #94a3b8)' : '#64748b' }}>
                <Loader2 size={14} className="animate-spin" style={{ color: '#059669' }} />
                Listening for Apple Pay confirmation...
              </div>
            </div>

          ) : activeView === 'cashapp' ? (
            /* 2. CASH APP ONLY: Lightning Deep-Linking & Instant Invoice */
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', flex: 1, background: isDark ? 'var(--color-surface, #111827)' : '#f8fafc' }}>
              <div style={{ textAlign: 'center', marginBottom: '1.15rem' }}>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  background: isDark ? 'rgba(0, 214, 50, 0.15)' : '#f0fdf4',
                  color: isDark ? '#4ade80' : '#16a34a',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  padding: '0.25rem 0.75rem',
                  borderRadius: '999px',
                  border: isDark ? '1.5px solid rgba(0, 214, 50, 0.3)' : '1.5px solid #bbf7d0',
                  marginBottom: '0.5rem'
                }}>
                  <Zap size={14} /> Bitcoin Lightning Enabled
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: isDark ? 'var(--color-text-primary, #ffffff)' : '#0f172a', margin: '0 0 0.2rem' }}>
                  Deposit with Cash App
                </h3>
                <p style={{ fontSize: '0.85rem', color: isDark ? 'var(--color-text-secondary, #cbd5e1)' : '#475569', margin: 0 }}>
                  Deposit Amount: <strong style={{ color: isDark ? '#4ade80' : '#16a34a', fontSize: '1.1rem' }}>${parseFloat(depositAmount || 0).toFixed(2)}</strong>
                </p>
              </div>

              {/* Instructions */}
              <div style={{
                background: isDark ? 'var(--color-subtle, #1e293b)' : '#ffffff',
                border: isDark ? '1.5px solid var(--color-border, #334155)' : '1.5px solid #cbd5e1',
                borderRadius: '14px',
                padding: '1.15rem',
                marginBottom: '1rem',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
              }}>
                <ul style={{ margin: 0, paddingLeft: '1.15rem', fontSize: '0.85rem', color: isDark ? 'var(--color-text-secondary, #cbd5e1)' : '#1e293b', lineHeight: 1.65 }}>
                  <li>Tap <strong style={{ color: '#00D632' }}>Launch Cash App ⚡</strong> below to open Cash App via instant Bitcoin Lightning.</li>
                  <li>Confirm the transaction in Cash App to credit your Studio Wallet instantly.</li>
                </ul>
              </div>

              {/* Lightning Invoice (Copy backup) */}
              {lightningInvoice && (
                <div style={{
                  background: isDark ? 'var(--color-surface, #111827)' : '#f1f5f9',
                  border: isDark ? '1.5px solid var(--color-border, #334155)' : '1.5px solid #cbd5e1',
                  borderRadius: '10px',
                  padding: '0.65rem 0.85rem',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.5rem'
                }}>
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{ fontSize: '0.68rem', fontWeight: 800, color: isDark ? 'var(--color-text-muted, #94a3b8)' : '#64748b', textTransform: 'uppercase' }}>Lightning Invoice</div>
                    <code style={{ fontFamily: 'monospace', fontSize: '0.78rem', fontWeight: 800, color: isDark ? 'var(--color-text-primary, #ffffff)' : '#0f172a', wordBreak: 'break-all', lineHeight: 1.2 }}>
                      {lightningInvoice.slice(0, 28)}...
                    </code>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(lightningInvoice, 'Lightning Invoice')}
                    style={{
                      background: hasCopied ? '#16a34a' : (isDark ? 'var(--color-border, #334155)' : '#0f172a'),
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '0.45rem 0.75rem',
                      fontSize: '0.78rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem'
                    }}
                  >
                    {hasCopied ? <><Check size={13} /> Copied!</> : <><Copy size={13} /> Copy Invoice</>}
                  </button>
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: 'auto' }}>
                <a
                  href={lightningInvoice ? `lightning:${lightningInvoice}` : boltPaymentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    width: '100%',
                    padding: '0.9rem',
                    fontSize: '1rem',
                    fontWeight: 900,
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #00D632 0%, #00b027 100%)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    boxShadow: '0 4px 15px rgba(0, 214, 50, 0.35)',
                    textDecoration: 'none'
                  }}
                >
                  Launch Cash App <Zap size={18} />
                </a>

                <button
                  type="button"
                  onClick={() => { setActiveView('select'); setSelectedMethod(null); }}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: isDark ? 'var(--color-subtle, #1e293b)' : '#ffffff',
                    color: isDark ? 'var(--color-text-primary, #ffffff)' : '#0f172a',
                    border: isDark ? '1.5px solid var(--color-border, #334155)' : '1.5px solid #cbd5e1',
                    borderRadius: '12px',
                    fontSize: '0.88rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.45rem',
                    transition: 'all 0.15s ease',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.02)'
                  }}
                >
                  <ArrowLeft size={16} />
                  <span>Choose Different Method or Amount</span>
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem', marginTop: '0.85rem', fontSize: '0.78rem', color: isDark ? 'var(--color-text-muted, #94a3b8)' : '#64748b' }}>
                <Loader2 size={14} className="animate-spin" style={{ color: '#00D632' }} />
                Listening for Cash App Lightning confirmation...
              </div>
            </div>

          ) : activeView === 'paypal' ? (
            /* 3. PAYPAL ONLY: PYUSD Instructions View */
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', flex: 1, background: isDark ? 'var(--color-surface, #111827)' : '#f8fafc' }}>
              <div style={{ textAlign: 'center', marginBottom: '1.15rem' }}>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  background: isDark ? 'rgba(59, 130, 246, 0.15)' : '#eff6ff',
                  color: isDark ? '#60a5fa' : '#1d4ed8',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  padding: '0.25rem 0.75rem',
                  borderRadius: '999px',
                  border: isDark ? '1.5px solid rgba(59, 130, 246, 0.3)' : '1.5px solid #bfdbfe',
                  marginBottom: '0.5rem'
                }}>
                  <Coins size={14} /> PayPal PYUSD Gateway
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: isDark ? 'var(--color-text-primary, #ffffff)' : '#0f172a', margin: '0 0 0.2rem' }}>
                  Deposit with PayPal PYUSD
                </h3>
                <p style={{ fontSize: '0.85rem', color: isDark ? 'var(--color-text-secondary, #cbd5e1)' : '#475569', margin: 0 }}>
                  Deposit Amount: <strong style={{ color: isDark ? '#60a5fa' : '#003087', fontSize: '1.1rem' }}>${parseFloat(depositAmount || 0).toFixed(2)}</strong>
                </p>
              </div>

              {/* Step 1 */}
              <div style={{
                background: isDark ? 'var(--color-subtle, #1e293b)' : '#ffffff',
                border: isDark ? '1.5px solid var(--color-border, #334155)' : '1.5px solid #cbd5e1',
                borderRadius: '14px',
                padding: '1rem',
                marginBottom: '0.85rem',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.5rem' }}>
                  <span style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: isDark ? '#2563eb' : '#003087',
                    color: '#ffffff',
                    fontSize: '0.78rem',
                    fontWeight: 900,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>1</span>
                  <span style={{ fontSize: '0.88rem', fontWeight: 900, color: isDark ? 'var(--color-text-primary, #ffffff)' : '#0f172a' }}>
                    Copy Receiving Address:
                  </span>
                </div>

                <div style={{
                  background: isDark ? 'var(--color-surface, #111827)' : '#f1f5f9',
                  border: isDark ? '1.5px solid var(--color-border, #334155)' : '1.5px solid #cbd5e1',
                  borderRadius: '10px',
                  padding: '0.65rem 0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.5rem'
                }}>
                  <code style={{
                    fontFamily: 'monospace',
                    fontSize: '0.8rem',
                    fontWeight: 800,
                    color: isDark ? 'var(--color-text-primary, #ffffff)' : '#0f172a',
                    wordBreak: 'break-all',
                    lineHeight: 1.3
                  }}>
                    {solanaAddress || 'PYUSD address ready'}
                  </code>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(solanaAddress || boltPaymentUrl, 'PYUSD Address')}
                    style={{
                      background: hasCopied ? '#059669' : (isDark ? '#2563eb' : '#003087'),
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '0.45rem 0.85rem',
                      fontSize: '0.78rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem'
                    }}
                  >
                    {hasCopied ? <><Check size={13} /> Copied!</> : <><Copy size={13} /> Copy Address</>}
                  </button>
                </div>
              </div>

              {/* Step 2 */}
              <div style={{
                background: isDark ? 'var(--color-subtle, #1e293b)' : '#ffffff',
                border: isDark ? '1.5px solid var(--color-border, #334155)' : '1.5px solid #cbd5e1',
                borderRadius: '14px',
                padding: '1rem',
                marginBottom: '1rem',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.5rem' }}>
                  <span style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: isDark ? 'var(--color-border, #334155)' : '#0f172a',
                    color: '#ffffff',
                    fontSize: '0.78rem',
                    fontWeight: 900,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>2</span>
                  <span style={{ fontSize: '0.88rem', fontWeight: 900, color: isDark ? 'var(--color-text-primary, #ffffff)' : '#0f172a' }}>
                    Send from PayPal App:
                  </span>
                </div>
                <ul style={{ margin: 0, paddingLeft: '1.15rem', fontSize: '0.82rem', color: isDark ? 'var(--color-text-secondary, #cbd5e1)' : '#334155', lineHeight: 1.6 }}>
                  <li>Open your <strong style={{ color: isDark ? '#60a5fa' : '#003087' }}>PayPal App</strong> and navigate to <strong style={{ color: isDark ? '#60a5fa' : '#003087' }}>Crypto</strong>.</li>
                  <li>Select <strong style={{ color: isDark ? '#60a5fa' : '#003087' }}>PYUSD</strong> (or Solana), tap <strong style={{ color: isDark ? '#60a5fa' : '#003087' }}>Send</strong>, and paste this address.</li>
                </ul>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: 'auto' }}>
                <a
                  href={boltPaymentUrl?.startsWith('http') ? boltPaymentUrl : 'https://www.paypal.com/myaccount/crypto/'}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    width: '100%',
                    padding: '0.9rem',
                    fontSize: '1rem',
                    fontWeight: 900,
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #003087 0%, #0079C1 100%)',
                    color: '#ffffff',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    boxShadow: '0 4px 15px rgba(0, 48, 135, 0.35)',
                    textDecoration: 'none'
                  }}
                >
                  Open PayPal Portal <ExternalLink size={16} />
                </a>

                <button
                  type="button"
                  onClick={() => { setActiveView('select'); setSelectedMethod(null); }}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: isDark ? 'var(--color-subtle, #1e293b)' : '#ffffff',
                    color: isDark ? 'var(--color-text-primary, #ffffff)' : '#0f172a',
                    border: isDark ? '1.5px solid var(--color-border, #334155)' : '1.5px solid #cbd5e1',
                    borderRadius: '12px',
                    fontSize: '0.88rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.45rem',
                    transition: 'all 0.15s ease',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.02)'
                  }}
                >
                  <ArrowLeft size={16} />
                  <span>Choose Different Method or Amount</span>
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem', marginTop: '0.85rem', fontSize: '0.78rem', color: isDark ? 'var(--color-text-muted, #94a3b8)' : '#64748b' }}>
                <Loader2 size={14} className="animate-spin" style={{ color: isDark ? '#60a5fa' : '#003087' }} />
                Awaiting PayPal PYUSD transfer confirmation...
              </div>
            </div>

          ) : (activeView === 'google_pay' || activeView === 'browser_waiting') ? (
            /* 4. GOOGLE PAY View */
            <div style={{ padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column', flex: 1, alignItems: 'center', justifyContent: 'center', textAlign: 'center', background: isDark ? 'var(--color-surface, #111827)' : '#f8fafc' }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                background: isDark ? 'rgba(37, 99, 235, 0.2)' : '#eff6ff',
                color: isDark ? '#60a5fa' : '#2563eb',
                fontSize: '0.75rem',
                fontWeight: 800,
                padding: '0.25rem 0.75rem',
                borderRadius: '999px',
                border: isDark ? '1.5px solid var(--color-border, #334155)' : '1.5px solid #cbd5e1',
                marginBottom: '0.85rem'
              }}>
                🌐 Google Pay Ready
              </div>

              <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: isDark ? 'var(--color-text-primary, #ffffff)' : '#0f172a', margin: '0 0 0.35rem' }}>
                Deposit with Google Pay
              </h3>
              
              <p style={{ fontSize: '0.85rem', color: isDark ? 'var(--color-text-secondary, #cbd5e1)' : '#475569', margin: '0 0 1.5rem', maxWidth: '320px' }}>
                Total: <strong style={{ color: isDark ? '#34d399' : '#047857', fontSize: '1.1rem' }}>${parseFloat(depositAmount || 0).toFixed(2)}</strong>. Tap the button below to authorize deposit.
              </p>

              <div style={{ width: '100%', maxWidth: '320px', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                <a
                  href={boltPaymentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    width: '100%',
                    padding: '0.9rem',
                    fontSize: '1rem',
                    fontWeight: 900,
                    borderRadius: '12px',
                    background: isDark ? 'var(--color-subtle, #1e293b)' : '#ffffff',
                    color: isDark ? 'var(--color-text-primary, #ffffff)' : '#0f172a',
                    border: isDark ? '2px solid var(--color-border, #334155)' : '2px solid #cbd5e1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.05)',
                    textDecoration: 'none'
                  }}
                >
                  Open Google Pay Deposit <ExternalLink size={16} />
                </a>

                <button
                  type="button"
                  onClick={() => { setActiveView('select'); setSelectedMethod(null); }}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: isDark ? 'var(--color-subtle, #1e293b)' : '#ffffff',
                    color: isDark ? 'var(--color-text-primary, #ffffff)' : '#0f172a',
                    border: isDark ? '1.5px solid var(--color-border, #334155)' : '1.5px solid #cbd5e1',
                    borderRadius: '12px',
                    fontSize: '0.88rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.45rem',
                    transition: 'all 0.15s ease',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.02)'
                  }}
                >
                  <ArrowLeft size={16} />
                  <span>Choose Different Method or Amount</span>
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem', marginTop: '1.25rem', fontSize: '0.78rem', color: isDark ? 'var(--color-text-muted, #94a3b8)' : '#64748b' }}>
                <Loader2 size={14} className="animate-spin" style={{ color: '#059669' }} />
                Listening for deposit confirmation...
              </div>
            </div>

          ) : (
            /* 5. AMOUNT & METHOD SELECTION VIEW */
            <div style={{ padding: '1.5rem', overflowY: 'auto', flex: '1 1 auto', minHeight: 0, WebkitOverflowScrolling: 'touch', background: isDark ? 'var(--color-surface, #111827)' : '#f8fafc' }}>
              
              {/* Amount Selection Card */}
              <div style={{ background: isDark ? 'var(--color-subtle, #1e293b)' : '#ffffff', border: isDark ? '1.5px solid var(--color-border, #334155)' : '1.5px solid #cbd5e1', borderRadius: '16px', padding: '1.25rem', textAlign: 'center', marginBottom: '1.25rem', boxShadow: '0 4px 14px rgba(0,0,0,0.04)' }}>
                <div style={{ fontSize: '0.78rem', color: isDark ? 'var(--color-text-muted, #94a3b8)' : '#64748b', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>SELECT TOP-UP AMOUNT</div>
                
                {/* Preset Chips */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.4rem', margin: '0.75rem 0' }}>
                  {presets.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setDepositAmount(preset.toString())}
                      style={{
                        padding: '0.65rem 0.2rem',
                        borderRadius: '10px',
                        border: `1.5px solid ${depositAmount === preset.toString() ? '#059669' : (isDark ? 'var(--color-border, #334155)' : '#cbd5e1')}`,
                        background: depositAmount === preset.toString() ? (isDark ? 'rgba(5, 150, 105, 0.2)' : '#ecfdf5') : (isDark ? 'var(--color-surface, #111827)' : '#ffffff'),
                        color: depositAmount === preset.toString() ? (isDark ? '#6ee7b7' : '#047857') : (isDark ? 'var(--color-text-primary, #ffffff)' : '#0f172a'),
                        fontWeight: 900,
                        fontSize: '0.92rem',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                      }}
                    >
                      ${preset}
                    </button>
                  ))}
                </div>

                {/* Custom Amount Field */}
                <div style={{ position: 'relative', marginTop: '0.5rem' }}>
                  <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', fontWeight: 900, color: isDark ? '#34d399' : '#047857', fontSize: '1.2rem' }}>$</span>
                  <input
                    type="number"
                    min="5"
                    step="1"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    placeholder="Enter custom amount..."
                    style={{
                      width: '100%',
                      padding: '0.65rem 1rem 0.65rem 2.2rem',
                      borderRadius: '10px',
                      border: isDark ? '1.5px solid var(--color-border, #334155)' : '1.5px solid #cbd5e1',
                      fontSize: '1.2rem',
                      fontWeight: 900,
                      color: isDark ? 'var(--color-text-primary, #ffffff)' : '#0f172a',
                      background: isDark ? 'var(--color-surface, #111827)' : '#ffffff',
                      outline: 'none',
                      textAlign: 'center'
                    }}
                  />
                </div>
              </div>
              
              <p style={{ color: isDark ? 'var(--color-text-primary, #ffffff)' : '#0f172a', fontSize: '0.9rem', fontWeight: 900, marginBottom: '0.85rem', textAlign: 'center' }}>
                Select deposit payment method:
              </p>
              
              {/* Payment Methods */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.65rem' }}>
                {paymentMethods.map(method => (
                  <button
                    key={method.id}
                    onClick={() => handleSelectMethod(method.id)}
                    disabled={isInitializing}
                    style={{
                      background: isDark ? 'var(--color-subtle, #1e293b)' : '#ffffff',
                      border: isDark ? '1.5px solid var(--color-border, #334155)' : '1.5px solid #cbd5e1',
                      borderRadius: '14px',
                      padding: '0.95rem 1.15rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.85rem',
                      cursor: isInitializing ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s ease',
                      opacity: isInitializing && selectedMethod !== method.id ? 0.5 : 1,
                      boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                      textAlign: 'left',
                      color: isDark ? 'var(--color-text-primary, #ffffff)' : '#0f172a'
                    }}
                  >
                    {method.icon}
                    
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                        <span style={{ color: isDark ? 'var(--color-text-primary, #ffffff)' : '#0f172a', fontWeight: 900, fontSize: '0.95rem' }}>
                          {method.name}
                        </span>
                        {method.badge && (
                          <span style={{
                            background: isDark ? 'var(--color-surface, #111827)' : '#f1f5f9',
                            color: isDark ? 'var(--color-text-secondary, #cbd5e1)' : '#334155',
                            border: isDark ? '1px solid var(--color-border, #334155)' : '1px solid #cbd5e1',
                            fontSize: '0.65rem',
                            fontWeight: 900,
                            padding: '0.15rem 0.45rem',
                            borderRadius: '6px',
                            letterSpacing: '0.03em'
                          }}>
                            {method.badge}
                          </span>
                        )}
                      </div>
                      <div style={{ color: isDark ? 'var(--color-text-muted, #94a3b8)' : '#64748b', fontSize: '0.78rem', fontWeight: 600, marginTop: '0.18rem' }}>
                        {method.subtext}
                      </div>
                    </div>

                    {isInitializing && selectedMethod === method.id ? (
                      <Loader2 size={20} className="animate-spin" style={{ color: '#059669', marginLeft: 'auto' }} />
                    ) : (
                      <ChevronRight size={18} style={{ color: isDark ? 'var(--color-text-muted, #94a3b8)' : '#94a3b8', marginLeft: 'auto' }} />
                    )}
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', marginTop: '1.25rem', fontSize: '0.75rem', color: isDark ? 'var(--color-text-muted, #94a3b8)' : '#64748b' }}>
                <Lock size={12} /> 256-Bit SSL Encrypted Instant Deposit Gateway
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
};
