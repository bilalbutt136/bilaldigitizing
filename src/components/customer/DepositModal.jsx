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
  Coins
} from 'lucide-react';

// Authentic Branded Payment Method SVG Components (matching CheckoutModal)
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
    boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
    color: '#ffffff',
    flexShrink: 0
  }}>
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.75 1.04-1.8 0.92-2.87-.9.04-2 .6-2.65 1.36-.58.68-.99 1.74-.86 2.78 1.01.08 2.05-.52 2.59-1.27z" />
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

export const DepositModal = () => {
  const { 
    isDepositModalOpen, 
    setIsDepositModalOpen, 
    setWalletBalance,
    fetchUserWalletBalance,
    authUser,
    showToast
  } = useAppState();

  const [depositAmount, setDepositAmount] = useState('100');
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [activeView, setActiveView] = useState('select'); // 'select' | 'card' | 'cashapp' | 'paypal' | 'browser_waiting'
  const [boltPaymentUrl, setBoltPaymentUrl] = useState(null);
  const [invoiceId, setInvoiceId] = useState(null);
  const [isPaid, setIsPaid] = useState(false);
  const [solanaAddress, setSolanaAddress] = useState('');
  const [lightningInvoice, setLightningInvoice] = useState('');
  const [hasCopied, setHasCopied] = useState(false);

  const presets = [25, 50, 100, 250, 500];

  const paymentMethods = [
    { 
      id: 'card', 
      name: 'Credit / Debit Card', 
      subtext: 'Visa, Mastercard, Amex, Discover',
      icon: <CardBrandIcon />,
      badge: 'POPULAR'
    },
    { 
      id: 'apple_pay', 
      name: 'Apple Pay', 
      subtext: 'Touch ID / Face ID 1-Click',
      icon: <ApplePayBrandIcon />,
      badge: 'FAST'
    },
    { 
      id: 'google_pay', 
      name: 'Google Pay', 
      subtext: 'Google Wallet & Saved Cards',
      icon: <GooglePayBrandIcon />,
      badge: 'FAST'
    },
    { 
      id: 'paypal', 
      name: 'PayPal', 
      subtext: 'PYUSD / PayPal Crypto',
      icon: <PayPalBrandIcon />,
      badge: 'PYUSD'
    },
    { 
      id: 'cashapp', 
      name: 'Cash App Pay', 
      subtext: 'Bitcoin Lightning ⚡ Instant',
      icon: <CashAppBrandIcon />,
      badge: 'LIGHTNING'
    },
  ];

  useEffect(() => {
    if (!isDepositModalOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow || 'unset';
    };
  }, [isDepositModalOpen]);

  // Real-time polling for deposit completion
  useEffect(() => {
    let intervalId;
    if (isDepositModalOpen && invoiceId && !isPaid) {
      intervalId = setInterval(async () => {
        try {
          const headers = await getAuthHeaders();
          const res = await fetch(`/api/boltpayouts/status?invoiceId=${invoiceId}`, { headers });
          const data = await res.json();
          if (data.success && (data.status === 'paid' || data.status === 'completed')) {
            setIsPaid(true);
            const creditedAmount = parseFloat(data.amount || depositAmount || 0);
            setWalletBalance(prev => prev + creditedAmount);
            showToast(`Successfully deposited $${creditedAmount.toFixed(2)} to your Studio Wallet!`, 'success');
            
            if (fetchUserWalletBalance && authUser?.email) {
              fetchUserWalletBalance(authUser.email);
            }
          }
        } catch (e) {
          console.error("Deposit polling error:", e);
        }
      }, 3000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isDepositModalOpen, invoiceId, isPaid, depositAmount, fetchUserWalletBalance, authUser, setWalletBalance, showToast]);

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
          method: methodId
        })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Payment gateway initialization failed');
      }

      const solana = data.solanaAddress || '';
      const lightning = data.lightningInvoice || data.lightningAddress || '';

      setInvoiceId(data.invoice?.id);
      setBoltPaymentUrl(data.paymentUrl);
      setSolanaAddress(solana);
      setLightningInvoice(lightning);
      setHasCopied(false);
      
      // Transition directly to the target view - links are opened on explicit user click to prevent popup blocking
      if (methodId === 'card') {
        setActiveView('card');
      } else if (methodId === 'cashapp' || methodId === 'lightning' || methodId === 'dollarpay_cashapp') {
        setActiveView('cashapp');
      } else if (methodId === 'paypal' || methodId === 'pyusd' || methodId === 'dollarpay_paypal') {
        setActiveView('paypal');
      } else {
        setActiveView('browser_waiting');
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
      onClick={handleClose}
      style={{
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
        onClick={(e) => e.stopPropagation()}
        style={{
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
          maxHeight: '92vh',
          animation: 'scaleUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards'
        }}
      >
        
        {/* Header */}
        <div style={{ 
          padding: '1.25rem 1.5rem', 
          borderBottom: '1px solid #334155', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ 
              width: '36px', height: '36px', borderRadius: '50%', 
              background: isPaid ? 'rgba(16, 185, 129, 0.2)' : 'rgba(249, 115, 22, 0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: isPaid ? '#10b981' : 'var(--orange-400)'
            }}>
              {isPaid ? <CheckCircle size={20} /> : <Wallet size={20} />}
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900, color: '#ffffff' }}>
                {isPaid ? 'Deposit Successful' : (
                  activeView === 'card' ? 'Credit / Debit Card Deposit' :
                  activeView === 'cashapp' ? 'Cash App Lightning Deposit' :
                  activeView === 'paypal' ? 'PayPal PYUSD Deposit' :
                  activeView === 'browser_waiting' ? (selectedMethod === 'apple_pay' ? 'Apple Pay Deposit' : 'Google Pay Deposit') :
                  'Studio Wallet Top-Up'
                )}
              </h3>
              <p style={{ margin: 0, fontSize: '0.78rem', color: '#94a3b8' }}>
                {isPaid ? 'Funds are instantly available in your wallet.' : 'Instant deposit for seamless one-click order dispatch'}
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
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ position: 'relative', width: '100%', minHeight: '440px', display: 'flex', flexDirection: 'column', background: '#f8fafc', overflowY: 'auto', flex: '1 1 auto', minHeight: 0, WebkitOverflowScrolling: 'touch' }}>
          
          {isPaid ? (
            /* Success View */
            <div style={{ 
              flex: 1, display: 'flex', flexDirection: 'column', 
              alignItems: 'center', justifyContent: 'center', padding: '3rem 2rem', textAlign: 'center' 
            }}>
              <CheckCircle size={64} style={{ color: '#16a34a', marginBottom: '1.5rem' }} />
              <h2 style={{ color: 'var(--navy-950)', fontSize: '1.6rem', fontWeight: 900, marginBottom: '0.5rem' }}>Deposit Successful!</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.925rem', marginBottom: '2rem', maxWidth: '340px' }}>
                Your Studio Wallet has been credited with <strong>${parseFloat(depositAmount || 0).toFixed(2)}</strong>. You can now place instant orders without checkout delay.
              </p>
              <button 
                onClick={handleClose}
                style={{ 
                  background: 'var(--orange-500)', color: '#fff', border: 'none', 
                  padding: '0.85rem 2rem', borderRadius: '12px', fontSize: '0.95rem', 
                  fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 15px rgba(255, 122, 0, 0.35)' 
                }}
              >
                Return to Studio
              </button>
            </div>

          ) : activeView === 'card' && boltPaymentUrl ? (
            /* 1. CREDIT / DEBIT CARD ONLY: 2-Step Solana Address Instruction Modal */
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
              <div style={{ textAlign: 'center', marginBottom: '1.15rem' }}>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  background: '#ecfdf5',
                  color: '#059669',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  padding: '0.25rem 0.75rem',
                  borderRadius: '999px',
                  border: '1px solid #a7f3d0',
                  marginBottom: '0.5rem'
                }}>
                  <ShieldCheck size={14} /> Deposit Gateway Initialized
                </div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--navy-950)', margin: '0 0 0.2rem' }}>
                  Complete in 2 Easy Steps
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                  Deposit Amount: <strong style={{ color: 'var(--orange-600)' }}>${parseFloat(depositAmount || 0).toFixed(2)}</strong>
                </p>
              </div>

              {/* Step 1 */}
              <div style={{
                background: '#ffffff',
                border: '1.5px solid #e2e8f0',
                borderRadius: '14px',
                padding: '1rem',
                marginBottom: '0.85rem',
                boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.5rem' }}>
                  <span style={{
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    background: 'var(--orange-500)',
                    color: '#ffffff',
                    fontSize: '0.75rem',
                    fontWeight: 900,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>1</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 900, color: 'var(--navy-950)' }}>
                    Copy Your Receiving Address:
                  </span>
                </div>

                <div style={{
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  borderRadius: '10px',
                  padding: '0.65rem 0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.5rem'
                }}>
                  <code style={{
                    fontFamily: 'monospace',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    color: 'var(--navy-900)',
                    wordBreak: 'break-all',
                    lineHeight: 1.3
                  }}>
                    {solanaAddress || 'Receiving link ready'}
                  </code>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(solanaAddress || boltPaymentUrl, 'Address')}
                    style={{
                      background: hasCopied ? '#16a34a' : 'var(--orange-500)',
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
                      gap: '0.35rem',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {hasCopied ? <><Check size={13} /> Copied!</> : <><Copy size={13} /> Copy Address</>}
                  </button>
                </div>
              </div>

              {/* Step 2 */}
              <div style={{
                background: '#ffffff',
                border: '1.5px solid #e2e8f0',
                borderRadius: '14px',
                padding: '1rem',
                marginBottom: '1rem',
                boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.5rem' }}>
                  <span style={{
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    background: 'var(--navy-900)',
                    color: '#ffffff',
                    fontSize: '0.75rem',
                    fontWeight: 900,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>2</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 900, color: 'var(--navy-950)' }}>
                    Paste on Checkout Portal:
                  </span>
                </div>
                <ul style={{ margin: 0, paddingLeft: '1.15rem', fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                  <li>Tap <strong>Proceed to Payment</strong> below to open the deposit portal.</li>
                  <li>Paste this address when the system asks for the address to complete your deposit.</li>
                </ul>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: 'auto' }}>
                <a
                  href={boltPaymentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary-orange"
                  style={{
                    width: '100%',
                    padding: '0.85rem',
                    fontSize: '0.95rem',
                    fontWeight: 900,
                    borderRadius: '12px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    boxShadow: '0 4px 15px rgba(249, 115, 22, 0.35)',
                    textDecoration: 'none'
                  }}
                >
                  Proceed to Payment <ExternalLink size={16} />
                </a>

                <button
                  type="button"
                  onClick={() => { setActiveView('select'); setSelectedMethod(null); }}
                  style={{
                    background: 'transparent',
                    color: 'var(--text-muted)',
                    border: 'none',
                    padding: '0.4rem',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    textAlign: 'center'
                  }}
                >
                  ← Choose Different Method or Amount
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem', marginTop: '0.85rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                <span className="spinner-border spinner-border-sm" style={{ width: '12px', height: '12px' }}></span>
                Listening for deposit confirmation...
              </div>
            </div>

          ) : activeView === 'cashapp' && boltPaymentUrl ? (
            /* 2. CASH APP ONLY: Lightning Deep-Linking & Instant Invoice */
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
              <div style={{ textAlign: 'center', marginBottom: '1.15rem' }}>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  background: '#f0fdf4',
                  color: '#16a34a',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  padding: '0.25rem 0.75rem',
                  borderRadius: '999px',
                  border: '1px solid #bbf7d0',
                  marginBottom: '0.5rem'
                }}>
                  <Zap size={14} /> Bitcoin Lightning Enabled
                </div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--navy-950)', margin: '0 0 0.2rem' }}>
                  Top-Up with Cash App
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                  Deposit Amount: <strong style={{ color: '#16a34a' }}>${parseFloat(depositAmount || 0).toFixed(2)}</strong>
                </p>
              </div>

              {/* Instructions */}
              <div style={{
                background: '#ffffff',
                border: '1.5px solid #e2e8f0',
                borderRadius: '14px',
                padding: '1.15rem',
                marginBottom: '1rem',
                boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
              }}>
                <ul style={{ margin: 0, paddingLeft: '1.15rem', fontSize: '0.825rem', color: 'var(--navy-900)', lineHeight: 1.65 }}>
                  <li>Tap <strong>Launch Cash App ⚡</strong> below to open Cash App via instant Bitcoin Lightning.</li>
                  <li>Confirm the transfer in Cash App to top up your Studio Wallet immediately.</li>
                </ul>
              </div>

              {/* Lightning Invoice (Copy backup) */}
              {lightningInvoice && (
                <div style={{
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  borderRadius: '10px',
                  padding: '0.65rem 0.85rem',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.5rem'
                }}>
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Lightning Invoice</div>
                    <code style={{ fontFamily: 'monospace', fontSize: '0.75rem', fontWeight: 800, color: 'var(--navy-900)', wordBreak: 'break-all', lineHeight: 1.2 }}>
                      {lightningInvoice.slice(0, 28)}...
                    </code>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(lightningInvoice, 'Lightning Invoice')}
                    style={{
                      background: hasCopied ? '#16a34a' : '#0f172a',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '0.45rem 0.75rem',
                      fontSize: '0.75rem',
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
                    background: 'transparent',
                    color: 'var(--text-muted)',
                    border: 'none',
                    padding: '0.4rem',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    textAlign: 'center'
                  }}
                >
                  ← Choose Different Method or Amount
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem', marginTop: '0.85rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                <span className="spinner-border spinner-border-sm" style={{ width: '12px', height: '12px' }}></span>
                Listening for Cash App Lightning deposit...
              </div>
            </div>

          ) : activeView === 'paypal' && boltPaymentUrl ? (
            /* 3. PAYPAL ONLY: PYUSD / Crypto Instructions Modal */
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
              <div style={{ textAlign: 'center', marginBottom: '1.15rem' }}>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  background: '#eff6ff',
                  color: '#1d4ed8',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  padding: '0.25rem 0.75rem',
                  borderRadius: '999px',
                  border: '1px solid #bfdbfe',
                  marginBottom: '0.5rem'
                }}>
                  <Coins size={14} /> PayPal PYUSD Gateway
                </div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--navy-950)', margin: '0 0 0.2rem' }}>
                  Top-Up with PayPal PYUSD
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                  Deposit Amount: <strong style={{ color: '#003087' }}>${parseFloat(depositAmount || 0).toFixed(2)}</strong>
                </p>
              </div>

              {/* Step 1 */}
              <div style={{
                background: '#ffffff',
                border: '1.5px solid #e2e8f0',
                borderRadius: '14px',
                padding: '1rem',
                marginBottom: '0.85rem',
                boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.5rem' }}>
                  <span style={{
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    background: '#003087',
                    color: '#ffffff',
                    fontSize: '0.75rem',
                    fontWeight: 900,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>1</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 900, color: 'var(--navy-950)' }}>
                    Copy Receiving Address:
                  </span>
                </div>

                <div style={{
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  borderRadius: '10px',
                  padding: '0.65rem 0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.5rem'
                }}>
                  <code style={{
                    fontFamily: 'monospace',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    color: 'var(--navy-900)',
                    wordBreak: 'break-all',
                    lineHeight: 1.3
                  }}>
                    {solanaAddress || 'PYUSD address ready'}
                  </code>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(solanaAddress || boltPaymentUrl, 'PYUSD Address')}
                    style={{
                      background: hasCopied ? '#16a34a' : '#003087',
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
                    {hasCopied ? <><Check size={13} /> Copied!</> : <><Copy size={13} /> Copy Address</>}
                  </button>
                </div>
              </div>

              {/* Step 2 */}
              <div style={{
                background: '#ffffff',
                border: '1.5px solid #e2e8f0',
                borderRadius: '14px',
                padding: '1rem',
                marginBottom: '1rem',
                boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.5rem' }}>
                  <span style={{
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    background: 'var(--navy-900)',
                    color: '#ffffff',
                    fontSize: '0.75rem',
                    fontWeight: 900,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>2</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 900, color: 'var(--navy-950)' }}>
                    Send from PayPal App:
                  </span>
                </div>
                <ul style={{ margin: 0, paddingLeft: '1.15rem', fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                  <li>Open your <strong>PayPal App</strong> and navigate to <strong>Crypto</strong>.</li>
                  <li>Select <strong>PYUSD</strong> (or Solana), tap <strong>Send</strong>, and paste this address.</li>
                </ul>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: 'auto' }}>
                <a
                  href={boltPaymentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    width: '100%',
                    padding: '0.85rem',
                    fontSize: '0.95rem',
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
                    background: 'transparent',
                    color: 'var(--text-muted)',
                    border: 'none',
                    padding: '0.4rem',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    textAlign: 'center'
                  }}
                >
                  ← Choose Different Method or Amount
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem', marginTop: '0.85rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                <span className="spinner-border spinner-border-sm" style={{ width: '12px', height: '12px' }}></span>
                Awaiting PayPal PYUSD transfer confirmation...
              </div>
            </div>

          ) : activeView === 'browser_waiting' && boltPaymentUrl ? (
            /* 4. APPLE PAY & GOOGLE PAY: Direct User-Initiated Launch View */
            <div style={{ padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column', flex: 1, alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                background: selectedMethod === 'apple_pay' ? '#f1f5f9' : '#eff6ff',
                color: selectedMethod === 'apple_pay' ? '#0f172a' : '#2563eb',
                fontSize: '0.75rem',
                fontWeight: 800,
                padding: '0.25rem 0.75rem',
                borderRadius: '999px',
                border: '1px solid #cbd5e1',
                marginBottom: '0.85rem'
              }}>
                {selectedMethod === 'apple_pay' ? '🍎 Apple Pay Ready' : '🌐 Google Pay Ready'}
              </div>

              <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--navy-950)', margin: '0 0 0.35rem' }}>
                {selectedMethod === 'apple_pay' ? 'Deposit with Apple Pay' : 'Deposit with Google Pay'}
              </h3>
              
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0 0 1.5rem', maxWidth: '320px' }}>
                Total: <strong style={{ color: 'var(--orange-600)' }}>${parseFloat(depositAmount || 0).toFixed(2)}</strong>. Tap the button below to authorize deposit.
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
                    background: selectedMethod === 'apple_pay' ? '#000000' : '#ffffff',
                    color: selectedMethod === 'apple_pay' ? '#ffffff' : '#0f172a',
                    border: selectedMethod === 'apple_pay' ? 'none' : '2px solid #cbd5e1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    boxShadow: selectedMethod === 'apple_pay' ? '0 4px 15px rgba(0, 0, 0, 0.3)' : '0 4px 15px rgba(0, 0, 0, 0.05)',
                    textDecoration: 'none'
                  }}
                >
                  {selectedMethod === 'apple_pay' ? (
                    <>Open Apple Pay Deposit <ExternalLink size={16} /></>
                  ) : (
                    <>Open Google Pay Deposit <ExternalLink size={16} /></>
                  )}
                </a>

                <button
                  type="button"
                  onClick={() => { setActiveView('select'); setSelectedMethod(null); }}
                  style={{
                    background: 'transparent',
                    color: 'var(--text-muted)',
                    border: 'none',
                    padding: '0.4rem',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    textAlign: 'center'
                  }}
                >
                  ← Choose Different Method or Amount
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem', marginTop: '1.25rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                <span className="spinner-border spinner-border-sm" style={{ width: '12px', height: '12px' }}></span>
                Listening for deposit confirmation...
              </div>
            </div>

          ) : (
            /* 5. AMOUNT & METHOD SELECTION VIEW */
            <div style={{ padding: '1.5rem', overflowY: 'auto', flex: '1 1 auto', minHeight: 0, WebkitOverflowScrolling: 'touch' }}>
              
              {/* Amount Selection Card */}
              <div style={{ background: '#ffffff', border: '1.5px solid #e2e8f0', borderRadius: '16px', padding: '1.25rem', textAlign: 'center', marginBottom: '1.25rem', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>SELECT TOP-UP AMOUNT</div>
                
                {/* Preset Chips */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.4rem', margin: '0.75rem 0' }}>
                  {presets.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setDepositAmount(preset.toString())}
                      style={{
                        padding: '0.55rem 0.2rem',
                        borderRadius: '10px',
                        border: `1.5px solid ${depositAmount === preset.toString() ? 'var(--orange-500)' : '#e2e8f0'}`,
                        background: depositAmount === preset.toString() ? 'rgba(249, 115, 22, 0.08)' : '#f8fafc',
                        color: depositAmount === preset.toString() ? 'var(--orange-600)' : 'var(--navy-900)',
                        fontWeight: 900,
                        fontSize: '0.88rem',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      ${preset}
                    </button>
                  ))}
                </div>

                {/* Custom Amount Field */}
                <div style={{ position: 'relative', marginTop: '0.5rem' }}>
                  <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', fontWeight: 900, color: 'var(--orange-600)', fontSize: '1.1rem' }}>$</span>
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
                      border: '1.5px solid #cbd5e1',
                      fontSize: '1.15rem',
                      fontWeight: 900,
                      color: 'var(--navy-950)',
                      outline: 'none',
                      textAlign: 'center'
                    }}
                  />
                </div>
              </div>
              
              <p style={{ color: 'var(--navy-900)', fontSize: '0.88rem', fontWeight: 800, marginBottom: '0.85rem', textAlign: 'center' }}>
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
                      background: '#ffffff',
                      border: '1.5px solid #e2e8f0',
                      borderRadius: '14px',
                      padding: '0.85rem 1.15rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.85rem',
                      cursor: isInitializing ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s ease',
                      opacity: isInitializing && selectedMethod !== method.id ? 0.5 : 1,
                      boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                      textAlign: 'left'
                    }}
                    onMouseOver={(e) => {
                      if (!isInitializing) {
                        e.currentTarget.style.background = '#fff7ed';
                        e.currentTarget.style.borderColor = 'var(--orange-500)';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                      }
                    }}
                    onMouseOut={(e) => {
                      if (!isInitializing) {
                        e.currentTarget.style.background = '#ffffff';
                        e.currentTarget.style.borderColor = '#e2e8f0';
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
                            background: '#f1f5f9',
                            color: 'var(--navy-700)',
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
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, marginTop: '0.15rem' }}>
                        {method.subtext}
                      </div>
                    </div>

                    {isInitializing && selectedMethod === method.id && (
                      <Loader2 size={18} style={{ animation: 'spin 1s linear infinite', color: 'var(--orange-500)', marginLeft: 'auto' }} />
                    )}
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', marginTop: '1.25rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                <Lock size={12} /> 256-Bit SSL Encrypted Instant Deposit Gateway
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
};
