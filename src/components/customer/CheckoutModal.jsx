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
    showToast
  } = useAppState();

  const [isPaid, setIsPaid] = useState(false);
  const [isIframeLoaded, setIsIframeLoaded] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [isInitializing, setIsInitializing] = useState(false);

  const paymentMethods = [
    { id: 'card', name: 'Credit / Debit Card', icon: '💳' },
    { id: 'dollarpay_apple_pay', name: 'Apple Pay', icon: '🍎' },
    { id: 'dollarpay_google_pay', name: 'Google Pay', icon: '🤖' },
    { id: 'dollarpay_paypal', name: 'PayPal', icon: '🔵' },
    { id: 'dollarpay_cashapp', name: 'Cash App', icon: '💲' },
  ];

  const handleSelectMethod = async (methodId) => {
    setSelectedMethod(methodId);
    setIsInitializing(true);
    try {
      const res = await fetch('/api/boltpayouts/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: checkoutSession.amount,
          method: methodId
        })
      });
      const data = await res.json();
      
      if (data.success && data.paymentUrl) {
        setCheckoutSession({
          ...checkoutSession,
          url: data.paymentUrl,
          invoiceId: data.invoice?.id
        });
      } else {
        throw new Error(data.error || 'Failed to initialize payment');
      }
    } catch (err) {
       console.error("Payment setup error:", err);
       alert("Error setting up payment: " + err.message);
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
            
            // Mark order as paid in DB if there is an orderId
            if (checkoutSession.orderId) {
              const { error } = await supabase
                .from('orders')
                .update({ payment_status: 'paid' })
                .eq('id', checkoutSession.orderId);
                
              if (!error && updateOrderStatus) {
                updateOrderStatus(checkoutSession.orderId, 'Pending', 'paid');
              }
            }
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
              {!isIframeLoaded && (
                <div style={{ 
                  position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, 
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  background: '#0f172a', zIndex: 2 
                }}>
                  <Loader2 size={32} style={{ color: 'var(--orange-400)', animation: 'spin 1s linear infinite', marginBottom: '1rem' }} />
                  <span style={{ color: '#cbd5e1', fontSize: '0.85rem', fontWeight: 600 }}>Loading secure payment portal...</span>
                </div>
              )}
              
              <iframe 
                src={checkoutSession.url} 
                onLoad={() => setIsIframeLoaded(true)}
                style={{ 
                  width: '100%', height: '480px', border: 'none', background: '#fff',
                  opacity: isIframeLoaded ? 1 : 0, transition: 'opacity 0.4s ease'
                }}
                title="Secure Checkout"
                allow="payment"
              />
            </>
          )}

        </div>
      </div>
    </div>
  );
};
