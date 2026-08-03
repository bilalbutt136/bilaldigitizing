'use client';

import React, { useState } from 'react';
import { useAppState } from '../../context/StateContext';
import { 
  X, 
  Wallet, 
  ShieldCheck, 
  Zap, 
  ExternalLink,
  CheckCircle2,
  Lock
} from 'lucide-react';

export const DepositModal = () => {
  const { 
    isDepositModalOpen, 
    setIsDepositModalOpen, 
    walletBalance, 
    depositFunds,
    authUser
  } = useAppState();

  const [depositAmount, setDepositAmount] = useState('100');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isDepositModalOpen) return null;

  const presets = [25, 50, 100, 250, 500];

  const handleSubmitDeposit = (e) => {
    e.preventDefault();
    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid deposit amount.');
      return;
    }

    setIsProcessing(true);

    const redirectUrl = `${window.location.origin}/client-portal?bolt_status=success&amount=${amount}`;
    const boltGatewayUrl = `https://www.boltpayouts.xyz/pay/boltpayouts?amount=${amount}&currency=USD&email=${encodeURIComponent(authUser?.email || 'client@bilaldigitizing.pro')}&return_url=${encodeURIComponent(redirectUrl)}`;

    // Launch BoltPayouts secure checkout interface immediately
    try {
      window.open(boltGatewayUrl, '_blank');
    } catch {
      window.location.href = boltGatewayUrl;
    }

    // Automatically update balance & credit wallet upon payment launch
    setTimeout(() => {
      depositFunds(amount);
      setIsProcessing(false);
      setIsDepositModalOpen(false);
    }, 1000);
  };

  return (
    <div className="modal-overlay" onClick={() => setIsDepositModalOpen(false)}>
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '520px', padding: '0', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}
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
            onClick={() => setIsDepositModalOpen(false)}
            style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
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

            <div style={{ fontSize: '0.78rem', color: '#94a3b8', lineHeight: '1.4' }}>
              https://www.boltpayouts.xyz/pay/boltpayouts
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.75rem', fontSize: '0.75rem', color: '#cbd5e1' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Lock size={12} style={{ color: 'var(--orange-400)' }} /> 256-Bit SSL</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><ShieldCheck size={12} style={{ color: 'var(--green-400)' }} /> Instant Credit</span>
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
              'Connecting to BoltPayouts...'
            ) : (
              <>
                Proceed to BoltPayouts (${parseFloat(depositAmount || 0).toFixed(2)}) <ExternalLink size={18} />
              </>
            )}
          </button>
        </form>

      </div>
    </div>
  );
};
