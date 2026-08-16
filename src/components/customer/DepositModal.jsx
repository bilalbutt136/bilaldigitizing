'use client';

import React, { useState, useEffect } from 'react';
import { useAppState } from '../../context/StateContext';
import { getAuthHeaders } from '../../services/supabaseService';
import { 
  X, 
  Wallet, 
  ShieldCheck, 
  Zap, 
  ExternalLink, 
  CheckCircle2, 
  Lock, 
  CreditCard, 
  Bitcoin,
  Building2
} from 'lucide-react';

export const DepositModal = () => {
  const { 
    isDepositModalOpen, 
    setIsDepositModalOpen, 
    setWalletBalance,
    showToast
  } = useAppState();

  const [depositAmount, setDepositAmount] = useState('100');
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [boltPaymentUrl, setBoltPaymentUrl] = useState(null);
  const [invoiceId, setInvoiceId] = useState(null);
  const [isPaid, setIsPaid] = useState(false);

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

  // Poll for payment status
  useEffect(() => {
    let intervalId;
    if (invoiceId && !isPaid) {
      intervalId = setInterval(async () => {
        try {
          const headers = await getAuthHeaders();
          const res = await fetch(`/api/boltpayouts/status?invoiceId=${invoiceId}`, { headers });
          const data = await res.json();
          if (data.success && (data.status === 'paid' || data.status === 'completed')) {
            setIsPaid(true);
            setWalletBalance(prev => prev + parseFloat(data.amount));
            showToast(`Successfully deposited $${parseFloat(data.amount).toFixed(2)} to your wallet!`, 'success');
            clearInterval(intervalId);
            setTimeout(() => {
              handleClose();
            }, 3000); // close modal after 3 seconds
          }
        } catch (e) {
          console.error("Polling error:", e);
        }
      }, 3000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [invoiceId, isPaid]);

  if (!isDepositModalOpen) return null;

  const presets = [25, 50, 100, 250, 500];

  const handleClose = () => {
    setBoltPaymentUrl(null);
    setInvoiceId(null);
    setIsPaid(false);
    setIsProcessing(false);
    setIsDepositModalOpen(false);
  };

  const handleSubmitDeposit = async (e) => {
    e.preventDefault();
    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid deposit amount.');
      return;
    }

    setIsProcessing(true);

    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/boltpayouts/create', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          amount: amount,
          method: paymentMethod
        })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Payment gateway failed');
      }

      setInvoiceId(data.invoice.id);
      setBoltPaymentUrl(data.paymentUrl);
      
    } catch (err) {
      alert(`Error initializing payment: ${err.message}`);
      setIsProcessing(false);
    }
  };

  return (
    <div 
      className="modal-overlay" 
      onClick={handleClose}
      style={{ zIndex: 99999, background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(8px)' }}
    >
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '520px', padding: '0', borderRadius: 'var(--radius-lg)', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}
      >
        
        {/* Modal Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          background: 'var(--navy-950)',
          color: '#ffffff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid rgba(255,255,255,0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <Wallet size={20} style={{ color: 'var(--orange-500)' }} />
            <div>
              <h3 style={{ fontSize: '1.15rem', color: '#ffffff', margin: 0, fontWeight: 800 }}>
                Studio Wallet Top-Up
              </h3>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                Instant deposit for seamless one-click order dispatch
              </div>
            </div>
          </div>

          <button 
            onClick={handleClose}
            style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '1.5rem', overflowY: 'auto' }}>
          
          {isPaid ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
              <CheckCircle2 size={64} style={{ color: '#16a34a', margin: '0 auto 1rem' }} />
              <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--navy-900)', marginBottom: '0.5rem' }}>
                Deposit Successful!
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                Your studio wallet has been credited with <strong>${parseFloat(depositAmount).toFixed(2)}</strong>. You can now place instant orders without checkout delay.
              </p>
              <button 
                onClick={handleClose} 
                className="btn btn-primary-orange"
                style={{ width: '100%', padding: '0.75rem', fontWeight: 800 }}
              >
                Done
              </button>
            </div>
          ) : boltPaymentUrl ? (
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
              <div style={{
                background: 'rgba(249, 115, 22, 0.1)',
                border: '1px solid rgba(249, 115, 22, 0.3)',
                borderRadius: 'var(--radius-md)',
                padding: '1rem',
                marginBottom: '1.5rem'
              }}>
                <Zap size={28} style={{ color: 'var(--orange-500)', margin: '0 auto 0.5rem' }} />
                <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--navy-900)', marginBottom: '0.25rem' }}>
                  Complete Your Payment
                </h4>
                <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', margin: 0 }}>
                  Please complete the payment in the secure window. Your balance will update automatically upon confirmation.
                </p>
              </div>

              <a 
                href={boltPaymentUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="btn btn-primary-orange"
                style={{
                  width: '100%',
                  padding: '0.85rem',
                  fontSize: '1rem',
                  fontWeight: 800,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  marginBottom: '1rem',
                  textDecoration: 'none'
                }}
              >
                Open Secure Payment Portal <ExternalLink size={16} />
              </a>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" style={{ width: '14px', height: '14px' }}></span>
                Waiting for payment confirmation...
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmitDeposit}>
              {/* Presets */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 800, color: 'var(--navy-900)', marginBottom: '0.5rem' }}>
                  Select Top-Up Amount (USD)
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.4rem', marginBottom: '0.75rem' }}>
                  {presets.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setDepositAmount(preset.toString())}
                      style={{
                        padding: '0.6rem 0.25rem',
                        borderRadius: 'var(--radius-sm)',
                        border: `1.5px solid ${depositAmount === preset.toString() ? 'var(--orange-500)' : 'var(--border-color)'}`,
                        background: depositAmount === preset.toString() ? 'rgba(249, 115, 22, 0.08)' : '#ffffff',
                        color: depositAmount === preset.toString() ? 'var(--orange-600)' : 'var(--navy-900)',
                        fontWeight: 800,
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      ${preset}
                    </button>
                  ))}
                </div>

                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', fontWeight: 800, color: 'var(--text-muted)' }}>$</span>
                  <input
                    type="number"
                    min="5"
                    step="1"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    placeholder="Custom amount..."
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem 0.75rem 2rem',
                      borderRadius: 'var(--radius-sm)',
                      border: '1.5px solid var(--border-color)',
                      fontSize: '1rem',
                      fontWeight: 800,
                      outline: 'none'
                    }}
                    required
                  />
                </div>
              </div>

              {/* Payment Methods */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 800, color: 'var(--navy-900)', marginBottom: '0.5rem' }}>
                  Payment Method
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  
                  {/* Credit/Debit Card */}
                  <div
                    onClick={() => setPaymentMethod('card')}
                    style={{
                      padding: '0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      border: `1.5px solid ${paymentMethod === 'card' ? 'var(--orange-500)' : 'var(--border-color)'}`,
                      background: paymentMethod === 'card' ? 'rgba(249, 115, 22, 0.05)' : '#ffffff',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.65rem'
                    }}
                  >
                    <CreditCard size={18} style={{ color: paymentMethod === 'card' ? 'var(--orange-500)' : 'var(--text-muted)' }} />
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--navy-900)' }}>Credit / Debit</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Visa, MC, Amex</div>
                    </div>
                  </div>

                  {/* Bank Transfer / All */}
                  <div
                    onClick={() => setPaymentMethod('all')}
                    style={{
                      padding: '0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      border: `1.5px solid ${paymentMethod === 'all' ? 'var(--orange-500)' : 'var(--border-color)'}`,
                      background: paymentMethod === 'all' ? 'rgba(249, 115, 22, 0.05)' : '#ffffff',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.65rem'
                    }}
                  >
                    <Building2 size={18} style={{ color: paymentMethod === 'all' ? 'var(--orange-500)' : 'var(--text-muted)' }} />
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--navy-900)' }}>All Gateways</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Bolt & Local</div>
                    </div>
                  </div>

                  {/* Crypto */}
                  <div
                    onClick={() => setPaymentMethod('crypto')}
                    style={{
                      padding: '0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      border: `1.5px solid ${paymentMethod === 'crypto' ? 'var(--orange-500)' : 'var(--border-color)'}`,
                      background: paymentMethod === 'crypto' ? 'rgba(249, 115, 22, 0.05)' : '#ffffff',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.65rem'
                    }}
                  >
                    <Bitcoin size={18} style={{ color: paymentMethod === 'crypto' ? 'var(--orange-500)' : 'var(--text-muted)' }} />
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--navy-900)' }}>Crypto</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>USDT, BTC, ETH</div>
                    </div>
                  </div>

                  {/* Wire / ACH */}
                  <div
                    onClick={() => setPaymentMethod('wire')}
                    style={{
                      padding: '0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      border: `1.5px solid ${paymentMethod === 'wire' ? 'var(--orange-500)' : 'var(--border-color)'}`,
                      background: paymentMethod === 'wire' ? 'rgba(249, 115, 22, 0.05)' : '#ffffff',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.65rem'
                    }}
                  >
                    <ShieldCheck size={18} style={{ color: paymentMethod === 'wire' ? 'var(--orange-500)' : 'var(--text-muted)' }} />
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--navy-900)' }}>Direct Bank</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>ACH Transfer</div>
                    </div>
                  </div>

                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isProcessing}
                className="btn btn-primary-orange"
                style={{
                  width: '100%',
                  padding: '0.85rem',
                  fontSize: '1rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
              >
                {isProcessing ? 'Connecting Gateway...' : `Proceed to Deposit $${parseFloat(depositAmount || 0).toFixed(2)}`}
              </button>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', marginTop: '0.85rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                <Lock size={12} /> Encrypted 256-bit SSL Secure Checkout
              </div>
            </form>
          )}

        </div>

      </div>
    </div>
  );
};
