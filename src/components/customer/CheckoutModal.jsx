'use client';

import React, { useState, useEffect } from 'react';
import { useAppState } from '../../context/StateContext';
import { X, CheckCircle, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase/client';

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
    setWalletBalance
  } = useAppState();

  const [isPaid, setIsPaid] = useState(false);
  const [isIframeLoaded, setIsIframeLoaded] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [isInitializing, setIsInitializing] = useState(false);

  const paymentMethods = [
    { id: 'studio_wallet', name: `Studio Wallet ($${(walletBalance || 0).toFixed(2)})`, icon: '👛' },
    { id: 'card', name: 'Credit / Debit Card', icon: '💳' },
    { id: 'dollarpay_apple_pay', name: 'Apple Pay', icon: '🍎' },
    { id: 'dollarpay_google_pay', name: 'Google Pay', icon: '🤖' },
    { id: 'dollarpay_paypal', name: 'PayPal', icon: '🔵' },
    { id: 'dollarpay_cashapp', name: 'Cash App', icon: '💲' },
  ];

  const handleSelectMethod = async (methodId) => {
    // Handle Studio Wallet payment directly
    if (methodId === 'studio_wallet') {
      const amount = parseFloat(checkoutSession?.amount || 0);
      if (walletBalance < amount) {
        showToast(`Insufficient wallet balance. You need $${(amount - walletBalance).toFixed(2)} more.`, 'error');
        return;
      }
      setSelectedMethod(methodId);
      setIsInitializing(true);
      try {
        const success = await deductWalletBalance(amount, checkoutSession?.orderId);
        if (success) {
          setIsPaid(true);
          showToast('Payment successful! Funds deducted from your Studio Wallet.', 'success');
          // Note: Order status is securely updated on the backend by the wallet API
        } else {
          showToast('Wallet payment failed. Please try another method.', 'error');
          setSelectedMethod(null);
        }
      } catch (err) {
        showToast('Wallet payment error: ' + (err.message || 'Unknown error'), 'error');
        setSelectedMethod(null);
      } finally {
        setIsInitializing(false);
      }
      return;
    }

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
        throw new Error(data.error || 'Failed to initialize payment');
      }
    } catch (err) {
       console.error("Payment setup error:", err);
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
          if (data.success && data.status === 'paid') {
            setIsPaid(true);
            showToast('Payment successful!', 'success');
            // Note: Order status is securely updated on the backend by the webhook
          }
        } catch (err) {
          console.error("Polling error:", err);
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
    }, 300); // Give time for animation to finish
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
        background: '#0f172a',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '24px',
        width: '100%',
        maxWidth: '520px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        animation: 'scaleUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards'
      }}>
        
        {/* Header */}
        <div style={{ 
          padding: '1.25rem 1.5rem', 
          borderBottom: '1px solid rgba(255,255,255,0.05)', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          background: 'rgba(255,255,255,0.02)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ 
              width: '32px', height: '32px', borderRadius: '50%', 
              background: isPaid ? 'rgba(16, 185, 129, 0.15)' : 'rgba(56, 189, 248, 0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: isPaid ? '#10b981' : '#38bdf8'
            }}>
              {isPaid ? <CheckCircle size={18} /> : <Loader2 size={18} style={{ animation: (isInitializing || (!isIframeLoaded && checkoutSession.url)) ? 'spin 2s linear infinite' : 'none' }} />}
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#fff' }}>
                {isPaid ? 'Payment Successful' : 'Secure Checkout'}
              </h3>
              <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8' }}>
                {isPaid ? 'Your order is now being processed.' : 'Complete your payment via BoltPayouts'}
              </p>
            </div>
          </div>

          <button 
            onClick={handleClose}
            style={{ 
              background: 'rgba(255, 255, 255, 0.05)', border: 'none', color: '#cbd5e1', 
              width: '32px', height: '32px', borderRadius: '50%', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', 
              cursor: 'pointer', transition: 'all 0.2s ease' 
            }}
            onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#fff'; }}
            onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#cbd5e1'; }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div style={{ position: 'relative', width: '100%', minHeight: '480px', display: 'flex', flexDirection: 'column' }}>
          
          {isPaid ? (
            <div style={{ 
              flex: 1, display: 'flex', flexDirection: 'column', 
              alignItems: 'center', justifyContent: 'center', padding: '3rem 2rem', textAlign: 'center' 
            }}>
              <CheckCircle size={64} style={{ color: '#10b981', marginBottom: '1.5rem' }} />
              <h2 style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>Thank You!</h2>
              <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '2rem', maxWidth: '300px' }}>
                We've received your payment. Your order has been marked as paid and sent to our digitizing team.
              </p>
              <button 
                onClick={handleClose}
                style={{ 
                  background: 'var(--orange-500)', color: '#fff', border: 'none', 
                  padding: '0.75rem 2rem', borderRadius: '999px', fontSize: '0.9rem', 
                  fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(255, 122, 0, 0.3)' 
                }}
              >
                Return to Dashboard
              </button>
            </div>
          ) : !checkoutSession.url ? (
            <div style={{ padding: '2rem' }}>
              <h4 style={{ color: '#fff', margin: '0 0 1.5rem 0', fontSize: '1.1rem', textAlign: 'center' }}>
                Total to Pay: <span style={{ color: 'var(--orange-400)', fontWeight: 900 }}>${checkoutSession.amount?.toFixed(2)}</span>
              </h4>
              <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '1.25rem', textAlign: 'center' }}>Select a payment method to continue</p>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.75rem' }}>
                {paymentMethods.map(method => (
                  <button
                    key={method.id}
                    onClick={() => handleSelectMethod(method.id)}
                    disabled={isInitializing}
                    style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '12px',
                      padding: '1rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      cursor: isInitializing ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s ease',
                      opacity: isInitializing && selectedMethod !== method.id ? 0.5 : 1
                    }}
                    onMouseOver={(e) => {
                      if (!isInitializing) {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                      }
                    }}
                    onMouseOut={(e) => {
                      if (!isInitializing) {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                      }
                    }}
                  >
                    <span style={{ fontSize: '1.5rem' }}>{method.icon}</span>
                    <span style={{ color: '#fff', fontWeight: 600, fontSize: '1rem' }}>{method.name}</span>
                    {isInitializing && selectedMethod === method.id && (
                      <Loader2 size={18} style={{ animation: 'spin 1s linear infinite', color: '#fff', marginLeft: 'auto' }} />
                    )}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {['card', 'dollarpay_apple_pay', 'dollarpay_google_pay'].includes(selectedMethod) ? (
                <div style={{ padding: '3rem 2rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, justifyContent: 'center' }}>
                  <Loader2 size={48} style={{ color: 'var(--orange-400)', animation: 'spin 2s linear infinite', marginBottom: '1.5rem' }} />
                  <h3 style={{ color: '#fff', fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem' }}>Complete Payment in New Tab</h3>
                  <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '2rem', maxWidth: '300px', lineHeight: 1.5 }}>
                    We opened a secure checkout page in a new window. Please complete your payment there, and this window will automatically update once confirmed.
                  </p>
                  <button 
                    onClick={() => window.open(checkoutSession.url, '_blank')} 
                    style={{ background: 'rgba(255,255,255,0.05)', color: '#cbd5e1', border: '1px solid rgba(255,255,255,0.15)', padding: '0.65rem 1.25rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, transition: 'all 0.2s ease' }}
                    onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#fff'; }}
                    onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#cbd5e1'; }}
                  >
                    Re-open Checkout Tab
                  </button>
                </div>
              ) : (
                <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <h3 style={{ color: '#fff', fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.25rem', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '1.5rem' }}>🧾</span> Invoice & Receipt
                  </h3>
                  
                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '1.5rem', marginBottom: '1.5rem', boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.2)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', alignItems: 'center' }}>
                      <span style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: 600 }}>Invoice ID:</span>
                      <span style={{ color: '#fff', fontSize: '0.85rem', fontWeight: 800, background: 'rgba(255,255,255,0.05)', padding: '0.2rem 0.5rem', borderRadius: '6px' }}>
                        #{checkoutSession.invoiceId || 'PENDING'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', alignItems: 'center' }}>
                      <span style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: 600 }}>Payment Method:</span>
                      <span style={{ color: '#fff', fontSize: '0.85rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        {paymentMethods.find(m => m.id === selectedMethod)?.icon} {paymentMethods.find(m => m.id === selectedMethod)?.name || 'Digital Wallet'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', alignItems: 'center' }}>
                      <span style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: 600 }}>Payment Status:</span>
                      <span style={{ color: '#f59e0b', fontSize: '0.75rem', fontWeight: 800, background: 'rgba(245, 158, 11, 0.15)', padding: '0.25rem 0.6rem', borderRadius: '999px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Unpaid
                      </span>
                    </div>
                    
                    <div style={{ height: '1px', background: 'rgba(255,255,255,0.08)', margin: '1.25rem 0' }} />
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 800 }}>Total Amount:</span>
                      <span style={{ color: 'var(--orange-400)', fontSize: '1.4rem', fontWeight: 900 }}>
                        ${checkoutSession.amount?.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  
                  <div style={{ marginTop: 'auto' }}>
                    <button 
                      onClick={() => window.open(checkoutSession.url, '_blank')}
                      style={{ background: 'var(--orange-500)', color: '#fff', border: 'none', padding: '1rem', borderRadius: '12px', fontSize: '1rem', fontWeight: 800, cursor: 'pointer', boxShadow: '0 8px 20px -6px rgba(255,122,0,0.5)', width: '100%', transition: 'all 0.2s ease', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
                      onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                      onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                      Pay Invoice Now 
                    </button>
                    <p style={{ color: '#64748b', fontSize: '0.75rem', textAlign: 'center', marginTop: '1rem', marginBottom: 0 }}>
                      Clicking the button above will open the secure checkout portal in a new tab.
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
