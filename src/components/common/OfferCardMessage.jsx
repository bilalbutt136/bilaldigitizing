'use client';

import React, { useState } from 'react';
import { 
  Zap, 
  Clock, 
  RotateCcw, 
  DollarSign, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  ArrowRight,
  ShieldCheck,
  Loader2
} from 'lucide-react';

export default function OfferCardMessage({
  offer,
  isCustomerView = false,
  onOfferAccepted = () => {},
  onOfferDeclined = () => {},
  showToast = () => {}
}) {
  const [isProcessing, setIsProcessing] = useState(false);

  if (!offer) return null;

  const {
    id,
    title = 'Custom Digitizing Offer',
    description = '',
    service_type = 'Embroidery Digitizing',
    price = 0,
    final_price = 0,
    delivery_time_text = '1 Day',
    revisions_allowed = '2',
    status = 'pending',
    expires_at
  } = offer;

  const displayPrice = parseFloat(final_price || price || 0).toFixed(2);
  const isExpired = status === 'expired' || (expires_at && new Date(expires_at).getTime() < Date.now() && status === 'pending');
  const currentStatus = isExpired ? 'expired' : status;

  const handleAcceptOffer = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      const res = await fetch('/api/offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'acceptOffer',
          payload: { offerId: id, offer }
        })
      });
      const data = await res.json();
      if (data?.error) {
        showToast(data.error, 'error');
      } else {
        showToast('Custom offer accepted! Order created successfully.', 'success');
        if (data?.checkoutUrl) {
          window.location.href = data.checkoutUrl;
        } else {
          onOfferAccepted(data.offer || { ...offer, status: 'accepted' });
        }
      }
    } catch (err) {
      showToast('Failed to accept offer. Please try again.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeclineOffer = async () => {
    if (isProcessing) return;
    if (!confirm('Are you sure you want to decline this custom offer?')) return;
    setIsProcessing(true);
    try {
      const res = await fetch('/api/offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'declineOffer',
          payload: { offerId: id }
        })
      });
      const data = await res.json();
      if (data?.error) {
        showToast(data.error, 'error');
      } else {
        showToast('Custom offer declined.', 'info');
        onOfferDeclined({ ...offer, status: 'declined' });
      }
    } catch (err) {
      showToast('Failed to update offer status.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div style={{
      background: '#ffffff',
      border: '1.5px solid #e2e8f0',
      borderRadius: '14px',
      padding: '1.25rem',
      maxWidth: '460px',
      width: '100%',
      boxShadow: '0 4px 16px rgba(15, 23, 42, 0.08)',
      margin: '0.5rem 0',
      fontFamily: 'inherit',
      textAlign: 'left'
    }}>
      {/* CARD HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          <span style={{
            background: 'linear-gradient(135deg, #ea580c, #f97316)',
            color: '#ffffff',
            fontSize: '0.68rem',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            padding: '0.2rem 0.6rem',
            borderRadius: '20px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.3rem'
          }}>
            <Zap size={11} /> CUSTOM OFFER
          </span>
          <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>
            {service_type}
          </span>
        </div>

        {/* STATUS PILL */}
        <div>
          {(currentStatus === 'pending' || currentStatus === 'sent' || currentStatus === 'viewed') && (
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#ea580c', background: '#fff7ed', padding: '0.2rem 0.55rem', borderRadius: '12px', border: '1px solid #ffedd5' }}>
              Pending Review
            </span>
          )}
          {(currentStatus === 'accepted' || currentStatus === 'paid') && (
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#16a34a', background: '#f0fdf4', padding: '0.2rem 0.55rem', borderRadius: '12px', border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <CheckCircle2 size={12} /> Accepted & Paid
            </span>
          )}
          {currentStatus === 'declined' && (
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', background: '#f1f5f9', padding: '0.2rem 0.55rem', borderRadius: '12px' }}>
              Declined
            </span>
          )}
          {currentStatus === 'expired' && (
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#dc2626', background: '#fef2f2', padding: '0.2rem 0.55rem', borderRadius: '12px', border: '1px solid #fecaca' }}>
              Expired
            </span>
          )}
        </div>
      </div>

      {/* OFFER TITLE & DESCRIPTION */}
      <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.4rem 0', lineHeight: 1.3 }}>
        {title}
      </h4>
      {description && (
        <p style={{ fontSize: '0.82rem', color: '#475569', margin: '0 0 0.9rem 0', lineHeight: 1.5, whiteSpace: 'pre-line' }}>
          {description}
        </p>
      )}

      {/* SPECIFICATIONS GRID */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '0.5rem',
        background: '#f8fafc',
        borderRadius: '10px',
        padding: '0.65rem 0.75rem',
        border: '1px solid #f1f5f9',
        marginBottom: '0.9rem'
      }}>
        <div>
          <span style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>
            Price
          </span>
          <span style={{ fontSize: '1.15rem', fontWeight: 900, color: '#0f172a', display: 'flex', alignItems: 'center' }}>
            ${displayPrice}
          </span>
        </div>

        <div>
          <span style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>
            Delivery
          </span>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.15rem' }}>
            <Clock size={13} color="#ea580c" /> {delivery_time_text}
          </span>
        </div>

        <div>
          <span style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>
            Revisions
          </span>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.15rem' }}>
            <RotateCcw size={13} color="#ea580c" /> {revisions_allowed}
          </span>
        </div>
      </div>

      {/* ACTION CONTROLS */}
      {isCustomerView && (currentStatus === 'pending' || currentStatus === 'sent' || currentStatus === 'viewed') && (
        <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center' }}>
          <button
            type="button"
            onClick={handleAcceptOffer}
            disabled={isProcessing}
            style={{
              flex: 1,
              background: '#16a34a',
              color: '#ffffff',
              border: 'none',
              padding: '0.65rem 1rem',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: 800,
              cursor: isProcessing ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              boxShadow: '0 2px 8px rgba(22, 163, 74, 0.25)',
              transition: 'all 0.15s ease'
            }}
          >
            {isProcessing ? <Loader2 size={16} className="spin-icon" /> : <ShieldCheck size={16} />}
            Accept & Pay Now (${displayPrice})
          </button>

          <button
            type="button"
            onClick={handleDeclineOffer}
            disabled={isProcessing}
            style={{
              background: 'transparent',
              color: '#64748b',
              border: '1px solid #cbd5e1',
              padding: '0.65rem 0.85rem',
              borderRadius: '8px',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: isProcessing ? 'wait' : 'pointer'
            }}
          >
            Decline
          </button>
        </div>
      )}

      {/* ADMIN STATUS INDICATOR */}
      {!isCustomerView && (
        <div style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          {(currentStatus === 'pending' || currentStatus === 'sent' || currentStatus === 'viewed') && (
            <span>Sent to client • Awaiting client acceptance</span>
          )}
          {(currentStatus === 'accepted' || currentStatus === 'paid') && (
            <span style={{ color: '#16a34a', fontWeight: 700 }}>✓ Client accepted offer • In production pipeline</span>
          )}
          {currentStatus === 'declined' && (
            <span style={{ color: '#94a3b8' }}>Client declined this offer</span>
          )}
          {currentStatus === 'expired' && (
            <span style={{ color: '#dc2626' }}>Offer has expired</span>
          )}
        </div>
      )}
    </div>
  );
}
