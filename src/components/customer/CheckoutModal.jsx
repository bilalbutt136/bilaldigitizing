'use client';

import React, { useState, useEffect } from 'react';
import { useAppState } from '../../context/StateContext';
import { X, CheckCircle, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase/client';

// Authentic Branded Payment Method SVG Components
const WalletBrandIcon = () => (
  <div style={{
    width: '42px',
    height: '42px',
    borderRadius: '12px',
    background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 12px rgba(249, 115, 22, 0.35)',
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

const CardBrandIcon = () => (
  <div style={{
    width: '42px',
    height: '42px',
    borderRadius: '12px',
    background: '#ffffff',
    border: '1.5px solid #e2e8f0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
    flexShrink: 0
  }}>
    <svg width="30" height="20" viewBox="0 0 32 22" fill="none">
      <rect width="32" height="22" rx="4" fill="#0f172a" />
      <rect y="4" width="32" height="3.5" fill="#38bdf8" />
      <rect x="3.5" y="13" width="5.5" height="4" rx="1" fill="#fbbf24" />
      {/* Mastercard Brand Circles */}
      <circle cx="21" cy="15" r="3.2" fill="#eb001b" />
      <circle cx="25" cy="15" r="3.2" fill="#f79e1b" fillOpacity="0.85" />
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
    boxShadow: '0 3px 8px rgba(0,0,0,0.2)',
    flexShrink: 0
  }}>
    <svg width="28" height="18" viewBox="0 0 48 20" fill="#ffffff">
      <path d="M7.7 7.7c-.5.6-1.3 1-2.1 1-.1-.8.2-1.6.7-2.1.5-.6 1.4-1 2.1-1 .1.8-.2 1.6-.7 2.1zm2.2 1.1c-.8-.1-1.6.4-2 .4s-1.1-.4-1.8-.4c-.9 0-1.8.5-2.3 1.4-1 1.7-.3 4.2.7 5.6.5.7 1.1 1.5 1.9 1.4.7 0 1-.5 1.9-.5s1.1.5 1.9.5c.8 0 1.3-.7 1.8-1.4.6-.8.8-1.6.8-1.7-.1 0-1.5-.6-1.5-2.2 0-1.4 1.1-2.1 1.2-2.1-.7-1-1.7-1-2.1-1z" />
      <path d="M19 6.2h3.5c2.3 0 3.8 1.5 3.8 3.7 0 2.3-1.6 3.8-3.9 3.8H20.7v4.6H19V6.2zm3.4 6c1.4 0 2.2-.9 2.2-2.3 0-1.4-.8-2.3-2.2-2.3h-1.7v4.6h1.7z" />
      <path d="M28.4 14.5c0-1.7 1.3-2.6 3.7-2.7l2-.1v-.6c0-.9-.6-1.5-1.7-1.5-1 0-1.6.5-1.8 1.2h-1.5c.2-1.5 1.5-2.4 3.4-2.4 2 0 3.2 1 3.2 2.7v7.2h-1.6v-1.6c-.6 1.1-1.8 1.8-3.1 1.8-1.7 0-2.6-1-2.6-2.6zm5.7-1.2v-.8l-1.8.1c-1.4.1-2.2.6-2.2 1.6 0 .9.7 1.4 1.7 1.4 1.3 0 2.3-.9 2.3-2.3z" />
      <path d="M39.6 21.8l2-5.7-3.4-7.8h1.8l2.5 6 2.4-6h1.8l-5.3 12.1h-1.8z" />
    </svg>
  </div>
);

const GooglePayBrandIcon = () => (
  <div style={{
    width: '42px',
    height: '42px',
    borderRadius: '12px',
    background: '#ffffff',
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
    background: '#ffffff',
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

export const CheckoutModal = () => {
  const { 
    isCheckoutModalOpen, 
    setIsCheckoutModalOpen, 
    checkoutSession, 
    setCheckoutSession,
    updateOrderStatus,
    showToast,
    walletBalance,
    deductWalletBalance,
    fetchUserWalletBalance,
    authUser
  } = useAppState();

  const [isPaid, setIsPaid] = useState(false);
  const [isIframeLoaded, setIsIframeLoaded] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [isInitializing, setIsInitializing] = useState(false);

  const paymentMethods = [
    { 
      id: 'studio_wallet', 
      name: 'Studio Wallet', 
      subtext: `Available Balance: $${(walletBalance || 0).toFixed(2)}`,
      icon: <WalletBrandIcon />,
      badge: 'INSTANT'
    },
    { 
      id: 'card', 
      name: 'Credit / Debit Card', 
      subtext: 'Visa, Mastercard, Amex, Discover',
      icon: <CardBrandIcon />,
      badge: 'POPULAR'
    },
    { 
      id: 'dollarpay_apple_pay', 
      name: 'Apple Pay', 
      subtext: 'Touch ID / Face ID 1-Click',
      icon: <ApplePayBrandIcon />,
      badge: 'FAST'
    },
    { 
      id: 'dollarpay_google_pay', 
      name: 'Google Pay', 
      subtext: 'Google Wallet & Saved Cards',
      icon: <GooglePayBrandIcon />,
      badge: 'FAST'
    },
    { 
      id: 'dollarpay_paypal', 
      name: 'PayPal', 
      subtext: 'PayPal Balance & Buyer Protection',
      icon: <PayPalBrandIcon />,
      badge: 'VERIFIED'
    },
    { 
      id: 'dollarpay_cashapp', 
      name: 'Cash App Pay', 
      subtext: '$Cashtag & QR Scan',
      icon: <CashAppBrandIcon />,
      badge: 'MOBILE'
    },
  ];

  const handleSelectMethod = async (methodId) => {
    // 1. Handle Studio Wallet payment directly
    if (methodId === 'studio_wallet') {
      const amount = parseFloat(checkoutSession?.amount || 0);
      const currentBalance = parseFloat(walletBalance || 0);
      
      if (currentBalance < amount) {
        showToast(`Insufficient wallet balance. You have $${currentBalance.toFixed(2)} but need $${amount.toFixed(2)}.`, 'error');
        return;
      }

      setSelectedMethod(methodId);
      setIsInitializing(true);

      try {
        const orderId = checkoutSession?.orderId || checkoutSession?.id || null;
        const success = await deductWalletBalance(amount, orderId);

        if (success) {
          setIsPaid(true);
          showToast('Payment successful! Funds deducted from your Studio Wallet.', 'success');
          
          if (orderId && updateOrderStatus) {
            updateOrderStatus(orderId, 'in_progress', 'paid');
          }

          if (fetchUserWalletBalance && authUser?.email) {
            fetchUserWalletBalance(authUser.email);
          }
        } else {
          showToast('Wallet payment could not be completed. Please try again.', 'error');
          setSelectedMethod(null);
        }
      } catch (err) {
        console.error('Wallet payment error:', err);
        showToast('Wallet payment error: ' + (err.message || 'Unknown error'), 'error');
        setSelectedMethod(null);
      } finally {
        setIsInitializing(false);
      }
      return;
    }

    // 2. Handle External Payment Gateway methods
    setSelectedMethod(methodId);
    setIsInitializing(true);
    try {
      const res = await fetch('/api/boltpayouts/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: checkoutSession.amount,
          method: methodId,
          orderId: checkoutSession?.orderId
        })
      });
      const data = await res.json();
      
      if (data.success && data.paymentUrl) {
        setCheckoutSession({
          ...checkoutSession,
          url: data.paymentUrl,
          invoiceId: data.invoice?.id
        });
        
        if (['card', 'dollarpay_apple_pay', 'dollarpay_google_pay'].includes(methodId)) {
          window.open(data.paymentUrl, '_blank');
        }
      } else {
        throw new Error(data.error || 'Failed to initialize payment gateway.');
      }
    } catch (err) {
       console.error('Payment setup error:', err);
       showToast('Error setting up payment: ' + (err.message || 'Unknown error'), 'error');
       setSelectedMethod(null);
    } finally {
      setIsInitializing(false);
    }
  };

  useEffect(() => {
    let intervalId;
    
    if (isCheckoutModalOpen && checkoutSession?.invoiceId && !isPaid) {
      intervalId = setInterval(async () => {
        try {
          const res = await fetch(`/api/boltpayouts/status?invoiceId=${checkoutSession.invoiceId}`);
          const data = await res.json();
          if (data.success && (data.status === 'paid' || data.status === 'completed')) {
            setIsPaid(true);
            showToast('Payment confirmed! Order assigned to design desk.', 'success');
            if (checkoutSession?.orderId && updateOrderStatus) {
              updateOrderStatus(checkoutSession.orderId, 'in_progress', 'paid');
            }
          }
        } catch (err) {
          console.error('Polling error:', err);
        }
      }, 3000);
    }
    
    return () => clearInterval(intervalId);
  }, [isCheckoutModalOpen, checkoutSession, isPaid, showToast, updateOrderStatus]);

  const handleClose = () => {
    setIsCheckoutModalOpen(false);
    setTimeout(() => {
      setCheckoutSession(null);
      setIsPaid(false);
      setIsIframeLoaded(false);
      setSelectedMethod(null);
      setIsInitializing(false);
    }, 300);
  };

  if (!isCheckoutModalOpen || !checkoutSession) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 99999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      background: 'rgba(15, 23, 42, 0.85)',
      backdropFilter: 'blur(12px)',
      animation: 'fadeIn 0.3s ease-out forwards'
    }}>
      <style>
        {`
          @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
          @keyframes scaleUp { from { opacity: 0; transform: scale(0.95) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        `}
      </style>

      <div style={{
        background: '#ffffff',
        border: '1px solid #cbd5e1',
        borderRadius: '24px',
        width: '100%',
        maxWidth: '520px',
        boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.25)',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        animation: 'scaleUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards'
      }}>
        
        {/* Header */}
        <div style={{ 
          padding: '1.25rem 1.5rem', 
          borderBottom: '1px solid #334155', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ 
              width: '36px', height: '36px', borderRadius: '50%', 
              background: isPaid ? 'rgba(16, 185, 129, 0.2)' : 'rgba(249, 115, 22, 0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: isPaid ? '#10b981' : 'var(--orange-400)'
            }}>
              {isPaid ? <CheckCircle size={20} /> : <Loader2 size={18} style={{ animation: (isInitializing || (!isIframeLoaded && checkoutSession.url)) ? 'spin 2s linear infinite' : 'none' }} />}
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900, color: '#ffffff' }}>
                {isPaid ? 'Payment Successful' : 'Secure Checkout'}
              </h3>
              <p style={{ margin: 0, fontSize: '0.78rem', color: '#94a3b8' }}>
                {isPaid ? 'Your order is now in production.' : '256-Bit Encrypted Payment Processing'}
              </p>
            </div>
          </div>

          <button 
            onClick={handleClose}
            style={{ 
              background: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.15)', color: '#cbd5e1', 
              width: '32px', height: '32px', borderRadius: '50%', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', 
              cursor: 'pointer', transition: 'all 0.2s ease' 
            }}
            onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.2)'; e.currentTarget.style.color = '#fff'; }}
            onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#cbd5e1'; }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div style={{ position: 'relative', width: '100%', minHeight: '460px', display: 'flex', flexDirection: 'column', background: '#f8fafc' }}>
          
          {isPaid ? (
            <div style={{ 
              flex: 1, display: 'flex', flexDirection: 'column', 
              alignItems: 'center', justifyContent: 'center', padding: '3rem 2rem', textAlign: 'center' 
            }}>
              <CheckCircle size={64} style={{ color: '#16a34a', marginBottom: '1.5rem' }} />
              <h2 style={{ color: 'var(--navy-950)', fontSize: '1.6rem', fontWeight: 900, marginBottom: '0.5rem' }}>Thank You!</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.925rem', marginBottom: '2rem', maxWidth: '340px' }}>
                We've received your payment. Your design order has been assigned to our master digitizing desk.
              </p>
              <button 
                onClick={handleClose}
                style={{ 
                  background: 'var(--orange-500)', color: '#fff', border: 'none', 
                  padding: '0.85rem 2rem', borderRadius: '12px', fontSize: '0.95rem', 
                  fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 15px rgba(255, 122, 0, 0.35)' 
                }}
              >
                Return to Dashboard
              </button>
            </div>
          ) : !checkoutSession.url ? (
            <div style={{ padding: '1.75rem' }}>
              <div style={{ background: '#ffffff', border: '1.5px solid #e2e8f0', borderRadius: '16px', padding: '1.25rem', textAlign: 'center', marginBottom: '1.25rem', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>TOTAL AMOUNT DUE</div>
                <div style={{ color: 'var(--orange-600)', fontSize: '2.2rem', fontWeight: 900, fontFamily: 'var(--font-heading)' }}>
                  ${checkoutSession.amount?.toFixed(2)}
                </div>
              </div>
              
              <p style={{ color: 'var(--navy-900)', fontSize: '0.88rem', fontWeight: 800, marginBottom: '0.85rem', textAlign: 'center' }}>
                Select your preferred payment method:
              </p>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.65rem' }}>
                {paymentMethods.map(method => {
                  const isWallet = method.id === 'studio_wallet';
                  const isInsufficient = isWallet && (walletBalance || 0) < (checkoutSession.amount || 0);

                  return (
                    <button
                      key={method.id}
                      onClick={() => handleSelectMethod(method.id)}
                      disabled={isInitializing || isInsufficient}
                      style={{
                        background: '#ffffff',
                        border: isWallet ? '1.5px solid #fed7aa' : '1.5px solid #e2e8f0',
                        borderRadius: '14px',
                        padding: '0.85rem 1.15rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.85rem',
                        cursor: (isInitializing || isInsufficient) ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s ease',
                        opacity: isInitializing && selectedMethod !== method.id ? 0.5 : (isInsufficient ? 0.6 : 1),
                        boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                        textAlign: 'left'
                      }}
                      onMouseOver={(e) => {
                        if (!isInitializing && !isInsufficient) {
                          e.currentTarget.style.background = '#fff7ed';
                          e.currentTarget.style.borderColor = 'var(--orange-500)';
                          e.currentTarget.style.transform = 'translateY(-1px)';
                        }
                      }}
                      onMouseOut={(e) => {
                        if (!isInitializing && !isInsufficient) {
                          e.currentTarget.style.background = '#ffffff';
                          e.currentTarget.style.borderColor = isWallet ? '#fed7aa' : '#e2e8f0';
                          e.currentTarget.style.transform = 'none';
                        }
                      }}
                    >
                      {method.icon}
                      
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                          <span style={{ color: 'var(--navy-950)', fontWeight: 800, fontSize: '0.92rem' }}>
                            {method.name}
                          </span>
                          {method.badge && (
                            <span style={{
                              background: isWallet ? 'var(--orange-100)' : '#f1f5f9',
                              color: isWallet ? 'var(--orange-700)' : 'var(--navy-700)',
                              fontSize: '0.65rem',
                              fontWeight: 800,
                              padding: '0.15rem 0.45rem',
                              borderRadius: '6px',
                              letterSpacing: '0.03em'
                            }}>
                              {method.badge}
                            </span>
                          )}
                        </div>
                        <div style={{ color: isInsufficient ? '#dc2626' : 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, marginTop: '0.15rem' }}>
                          {isInsufficient ? `Insufficient funds ($${(walletBalance || 0).toFixed(2)})` : method.subtext}
                        </div>
                      </div>

                      {isInitializing && selectedMethod === method.id && (
                        <Loader2 size={18} style={{ animation: 'spin 1s linear infinite', color: 'var(--orange-500)', marginLeft: 'auto' }} />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <>
              {['card', 'dollarpay_apple_pay', 'dollarpay_google_pay'].includes(selectedMethod) ? (
                <div style={{ padding: '3rem 2rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, justifyContent: 'center' }}>
                  <Loader2 size={48} style={{ color: 'var(--orange-500)', animation: 'spin 2s linear infinite', marginBottom: '1.5rem' }} />
                  <h3 style={{ color: 'var(--navy-950)', fontSize: '1.35rem', fontWeight: 900, marginBottom: '0.5rem' }}>Complete Payment in New Tab</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.925rem', marginBottom: '2rem', maxWidth: '320px', lineHeight: 1.5 }}>
                    We opened a secure checkout page in a new tab. Please finalize your transaction there—this window will automatically confirm upon receipt.
                  </p>
                  <button 
                    onClick={() => window.open(checkoutSession.url, '_blank')} 
                    style={{ background: '#ffffff', color: 'var(--navy-900)', border: '1.5px solid #cbd5e1', padding: '0.75rem 1.5rem', borderRadius: '10px', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 800, transition: 'all 0.2s ease', boxShadow: '0 2px 6px rgba(0,0,0,0.04)' }}
                    onMouseOver={(e) => { e.currentTarget.style.background = '#f1f5f9'; }}
                    onMouseOut={(e) => { e.currentTarget.style.background = '#ffffff'; }}
                  >
                    Re-open Checkout Tab
                  </button>
                </div>
              ) : (
                <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <h3 style={{ color: 'var(--navy-950)', fontSize: '1.25rem', fontWeight: 900, marginBottom: '1.25rem', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '1.5rem' }}>🧾</span> Invoice & Receipt
                  </h3>
                  
                  <div style={{ background: '#ffffff', border: '1.5px solid #e2e8f0', borderRadius: '16px', padding: '1.5rem', marginBottom: '1.5rem', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', alignItems: 'center' }}>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 700 }}>Invoice ID:</span>
                      <span style={{ color: 'var(--navy-950)', fontSize: '0.85rem', fontWeight: 900, background: '#f1f5f9', padding: '0.2rem 0.6rem', borderRadius: '6px' }}>
                        #{checkoutSession.invoiceId || 'PENDING'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', alignItems: 'center' }}>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 700 }}>Payment Method:</span>
                      <span style={{ color: 'var(--navy-950)', fontSize: '0.85rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        {paymentMethods.find(m => m.id === selectedMethod)?.name || 'Digital Wallet'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', alignItems: 'center' }}>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 700 }}>Payment Status:</span>
                      <span style={{ color: '#d97706', fontSize: '0.75rem', fontWeight: 900, background: '#fef3c7', padding: '0.25rem 0.65rem', borderRadius: '999px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Awaiting Payment
                      </span>
                    </div>
                    
                    <div style={{ height: '1px', background: '#e2e8f0', margin: '1.25rem 0' }} />
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: 'var(--navy-950)', fontSize: '1.1rem', fontWeight: 900 }}>Total Amount:</span>
                      <span style={{ color: 'var(--orange-600)', fontSize: '1.5rem', fontWeight: 900, fontFamily: 'var(--font-heading)' }}>
                        ${checkoutSession.amount?.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  
                  <div style={{ marginTop: 'auto' }}>
                    <button 
                      onClick={() => window.open(checkoutSession.url, '_blank')}
                      style={{ background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)', color: '#fff', border: 'none', padding: '1rem', borderRadius: '12px', fontSize: '1.05rem', fontWeight: 900, cursor: 'pointer', boxShadow: '0 8px 20px -6px rgba(255,122,0,0.5)', width: '100%', transition: 'all 0.2s ease', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
                      onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                      onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                      Pay Invoice Now 
                    </button>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textAlign: 'center', marginTop: '0.85rem', marginBottom: 0 }}>
                      Opens the 256-bit encrypted checkout portal in a secure window.
                    </p>
                  </div>
                </div>
              )}
            </>
          )}

        </div>
      </div>
    </div>
  );
};
