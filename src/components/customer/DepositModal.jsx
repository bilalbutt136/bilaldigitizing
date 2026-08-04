'use client';

import React, { useState, useEffect } from 'react';
import { useAppState } from '../../context/StateContext';
import { 
  X, 
  Wallet, 
  ShieldCheck, 
  Zap, 
  ExternalLink,
  CheckCircle2,
  Lock,
  CreditCard,
  Bitcoin
} from 'lucide-react';

export const DepositModal = () => {
  const { 
    isDepositModalOpen, 
    setIsDepositModalOpen, 
    walletBalance, 
    setWalletBalance,
    authUser,
    showToast
  } = useAppState();

  const [depositAmount, setDepositAmount] = useState('100');
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [isProcessing, setIsProcessing] = useState(false);
  const [boltPaymentUrl, setBoltPaymentUrl] = useState(null);
  const [invoiceId, setInvoiceId] = useState(null);
  const [isPaid, setIsPaid] = useState(false);

  // Poll for payment status
  useEffect(() => {
    let intervalId;
    if (invoiceId && !isPaid) {
      intervalId = setInterval(async () => {
        try {
          const res = await fetch(`/api/boltpayouts/status?invoiceId=${invoiceId}`);
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
      const res = await fetch('/api/boltpayouts/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
    <div className="modal-overlay" onClick={handleClose}>
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '520px', padding: '0', borderRadius: 'var(--radius-lg)', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}
      >
        
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, var(--navy-950), var(--navy-900))',
          color: '#ffffff',
          padding: '1.5rem 1.75rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              background: 'var(--orange-500)',
              color: '#ffffff',
              padding: '0.5rem',
              borderRadius: 'var(--radius-sm)',
              display: 'flex'
            }}>
              <Wallet size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', color: '#ffffff', fontWeight: 800, margin: 0 }}>
                Direct Studio Wallet Top-Up
              </h3>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.1rem' }}>
                Powered by BoltPayouts Payment Gateway
              </div>
            </div>
          </div>

          <button 
            onClick={handleClose}
            style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Dynamic Body */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
        {isPaid ? (
          <div style={{ padding: '3rem 2rem', textAlign: 'center' }}>
            <CheckCircle2 size={64} style={{ color: 'var(--green-500)', margin: '0 auto 1rem' }} />
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--navy-900)' }}>Payment Successful!</h3>
            <p style={{ color: 'var(--text-muted)' }}>Your wallet has been credited securely.</p>
          </div>
        ) : boltPaymentUrl ? (
          <div style={{ padding: '0' }}>
            {/* Seamless Iframe Flow */}
            <div style={{ background: '#f8fafc', padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--navy-700)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Lock size={14} style={{ color: 'var(--green-600)' }}/> Secure Checkout via BoltPayouts
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Awaiting Payment...</span>
            </div>
            <iframe 
              src={boltPaymentUrl} 
              style={{ width: '100%', height: '500px', border: 'none' }}
              title="BoltPayouts Checkout"
              allow="payment"
            />
          </div>
        ) : (
          <form onSubmit={handleSubmitDeposit} style={{ padding: '1.75rem' }}>
            
            {/* Current Available Balance Display */}
            <div style={{
              background: '#fff7ed',
              border: '1.5px solid #fed7aa',
              borderRadius: 'var(--radius-md)',
              padding: '1rem 1.25rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.5rem'
            }}>
              <div>
                <div style={{ fontSize: '0.78rem', color: 'var(--orange-700)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                  Current Wallet Credit
                </div>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--navy-950)' }}>
                  ${walletBalance.toFixed(2)}
                </div>
              </div>
              <span style={{
                background: '#ecfdf5',
                color: 'var(--green-700)',
                fontSize: '0.75rem',
                fontWeight: 800,
                padding: '0.35rem 0.75rem',
                borderRadius: '9999px',
                border: '1px solid #a7f3d0',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}>
                <CheckCircle2 size={13} /> Active Account
              </span>
            </div>

            {/* Preset Selection */}
            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label style={{ fontWeight: 700, color: 'var(--navy-900)' }}>Select Deposit Amount ($USD)</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem', marginTop: '0.35rem' }}>
                {presets.map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setDepositAmount(val.toString())}
                    style={{
                      padding: '0.65rem 0.3rem',
                      borderRadius: 'var(--radius-sm)',
                      border: `2px solid ${depositAmount === val.toString() ? 'var(--orange-500)' : 'var(--border-color)'}`,
                      background: depositAmount === val.toString() ? '#fff7ed' : '#ffffff',
                      color: depositAmount === val.toString() ? 'var(--orange-600)' : 'var(--navy-800)',
                      fontWeight: 800,
                      fontSize: '0.9rem',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    +${val}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Amount Input */}
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label style={{ fontWeight: 700, color: 'var(--navy-900)' }}>Or Enter Custom Deposit Amount</label>
              <div style={{ position: 'relative', marginTop: '0.35rem' }}>
                <span style={{
                  position: 'absolute',
                  left: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--navy-700)',
                  fontWeight: 800,
                  fontSize: '1.1rem'
                }}>
                  $
                </span>
                <input 
                  type="number"
                  step="5"
                  min="10"
                  max="5000"
                  className="form-control"
                  style={{ paddingLeft: '2.25rem', fontWeight: 800, fontSize: '1.15rem', color: 'var(--navy-950)' }}
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                />
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label style={{ fontWeight: 700, color: 'var(--navy-900)' }}>Select Payment Method</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '0.35rem' }}>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  style={{
                    padding: '0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    border: `2px solid ${paymentMethod === 'card' ? 'var(--navy-900)' : 'var(--border-color)'}`,
                    background: paymentMethod === 'card' ? 'var(--navy-50)' : '#ffffff',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    color: 'var(--navy-900)'
                  }}
                >
                  <CreditCard size={18} /> Card / Apple Pay
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('crypto')}
                  style={{
                    padding: '0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    border: `2px solid ${paymentMethod === 'crypto' ? 'var(--navy-900)' : 'var(--border-color)'}`,
                    background: paymentMethod === 'crypto' ? 'var(--navy-50)' : '#ffffff',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    color: 'var(--navy-900)'
                  }}
                >
                  <Bitcoin size={18} /> Crypto (Lightning/Solana)
                </button>
              </div>
            </div>

            {/* Streamlined Payment Gateway Banner - Featuring BoltPayouts Directly */}
            <div style={{
              background: 'var(--navy-950)',
              color: '#ffffff',
              borderRadius: 'var(--radius-md)',
              padding: '1.15rem 1.25rem',
              marginBottom: '1.5rem',
              border: '1px solid var(--navy-800)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <div style={{ background: 'var(--orange-500)', color: '#ffffff', padding: '0.4rem', borderRadius: '6px', display: 'flex' }}>
                    <Zap size={18} />
                  </div>
                  <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#ffffff' }}>
                    BoltPayouts Payment Gateway
                  </div>
                </div>
                <span style={{ fontSize: '0.7rem', background: '#10b981', color: '#ffffff', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 800 }}>
                  Direct Checkout
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.75rem', fontSize: '0.75rem', color: '#cbd5e1' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Lock size={12} style={{ color: 'var(--orange-400)' }} /> 256-Bit SSL</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><ShieldCheck size={12} style={{ color: 'var(--green-400)' }} /> Instant Credit via Webhook</span>
              </div>
            </div>

            {/* Direct Action Submit */}
            <button 
              type="submit" 
              className="btn btn-primary-orange btn-lg"
              disabled={isProcessing}
              style={{ width: '100%', justifyContent: 'center', padding: '0.9rem 1.5rem', fontSize: '1rem', fontWeight: 800 }}
            >
              {isProcessing ? (
                'Connecting securely to BoltPayouts...'
              ) : (
                <>
                  Proceed to Checkout (${parseFloat(depositAmount || 0).toFixed(2)}) <ExternalLink size={18} />
                </>
              )}
            </button>
          </form>
        )}
        </div>
      </div>
    </div>
  );
};
