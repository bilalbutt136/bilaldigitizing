'use client';

import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Clock, 
  RotateCcw, 
  CheckCircle2, 
  XCircle, 
  Eye, 
  ChevronRight, 
  Scissors, 
  Layers, 
  ShieldCheck, 
  Loader2, 
  DollarSign, 
  Ban, 
  CreditCard, 
  Wallet, 
  Smartphone, 
  Globe, 
  Zap, 
  X 
} from 'lucide-react';
import { acceptCustomOffer, declineCustomOffer, cancelCustomOffer, createOfferCheckoutSession } from '../../services/supabaseService';
import { playNotificationSound } from '../../utils/audioNotification';
import { useAppState } from '../../context/StateContext';

/**
 * Custom Offer Card Message rendered inside Chat Feeds
 * Supports Customer & Admin views with payment method modal (BoltPayouts & Studio Wallet).
 */
export default function OfferCardMessage({
  offer,
  messageId,
  isMe = false,
  isAdmin = false,
  onOrderClick = () => {},
  showToast: propShowToast = null
}) {
  const { showToast: contextShowToast, walletBalance = 0 } = useAppState() || {};
  const showToast = propShowToast || contextShowToast || (() => {});

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState('card');
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  const [isDeclining, setIsDeclining] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [localStatus, setLocalStatus] = useState(offer?.status || 'sent');

  useEffect(() => {
    if (offer?.status) {
      setLocalStatus(offer.status);
    }
  }, [offer?.status]);

  // Realtime & cross-tab offer status listener
  useEffect(() => {
    const handleStatusEvent = (e) => {
      const { offerId, status: newStatus } = e.detail || {};
      const myOfferId = offer?.id || offer?.offer_id;
      if (offerId && (offerId === myOfferId || offerId === messageId)) {
        if (newStatus) {
          setLocalStatus(newStatus);
        }
      }
    };
    window.addEventListener('bdigi_offer_status_change', handleStatusEvent);
    return () => window.removeEventListener('bdigi_offer_status_change', handleStatusEvent);
  }, [offer?.id, offer?.offer_id, messageId]);

  if (!offer) return null;

  const status = localStatus || offer.status || 'sent';
  const isExpired = (status === 'sent' || status === 'viewed' || status === 'pending') && offer.expires_at && new Date(offer.expires_at).getTime() < Date.now();
  const currentStatus = isExpired ? 'expired' : status;

  const price = parseFloat(offer.final_price ?? offer.price ?? 0);
  const originalPrice = parseFloat(offer.price ?? 0);
  const hasDiscount = parseFloat(offer.discount_amount || 0) > 0 && originalPrice > price;

  const getServiceIcon = (svc) => {
    const s = (svc || '').toLowerCase();
    if (s.includes('vector')) return <Layers size={14} className="text-cyan-400" />;
    if (s.includes('patch')) return <ShieldCheck size={14} className="text-amber-400" />;
    return <Scissors size={14} className="text-emerald-400" />;
  };

  const getStatusBadge = () => {
    switch (currentStatus) {
      case 'paid':
      case 'accepted':
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '0.72rem',
            fontWeight: 800,
            padding: '3px 10px',
            borderRadius: '999px',
            background: 'rgba(16, 185, 129, 0.2)',
            border: '1px solid rgba(16, 185, 129, 0.5)',
            color: '#34d399'
          }}>
            <CheckCircle2 size={12} /> {currentStatus === 'paid' ? 'Paid & In Production' : 'Completed / Accepted'}
          </span>
        );
      case 'declined':
      case 'rejected':
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '0.72rem',
            fontWeight: 800,
            padding: '3px 10px',
            borderRadius: '999px',
            background: 'rgba(244, 63, 94, 0.15)',
            border: '1px solid rgba(244, 63, 94, 0.4)',
            color: '#f43f5e'
          }}>
            <XCircle size={12} /> Rejected
          </span>
        );
      case 'expired':
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '0.72rem',
            fontWeight: 800,
            padding: '3px 10px',
            borderRadius: '999px',
            background: 'rgba(245, 158, 11, 0.15)',
            border: '1px solid rgba(245, 158, 11, 0.4)',
            color: '#f59e0b'
          }}>
            <Clock size={12} /> Expired
          </span>
        );
      case 'cancelled':
      case 'withdrawn':
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '0.72rem',
            fontWeight: 800,
            padding: '3px 10px',
            borderRadius: '999px',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            color: '#f87171'
          }}>
            <Ban size={12} /> Withdrawn
          </span>
        );
      default:
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '0.72rem',
            fontWeight: 800,
            padding: '3px 10px',
            borderRadius: '999px',
            background: 'rgba(59, 130, 246, 0.15)',
            border: '1px solid rgba(59, 130, 246, 0.4)',
            color: '#60a5fa'
          }}>
            <Sparkles size={12} /> Active Offer
          </span>
        );
    }
  };

  const isPending = !['paid', 'accepted', 'declined', 'rejected', 'expired', 'cancelled', 'withdrawn'].includes(currentStatus);

  const paymentMethods = [
    {
      id: 'card',
      name: 'Credit / Debit Card',
      desc: 'Visa, Mastercard, Amex, Discover',
      icon: <CreditCard size={18} className="text-sky-400" />,
      badge: 'POPULAR'
    },
    {
      id: 'apple_pay',
      name: 'Apple Pay',
      desc: 'Touch ID / Face ID 1-Click',
      icon: <Smartphone size={18} className="text-indigo-400" />,
      badge: 'FAST'
    },
    {
      id: 'google_pay',
      name: 'Google Pay',
      desc: 'Google Wallet & Saved Cards',
      icon: <Globe size={18} className="text-emerald-400" />,
      badge: 'FAST'
    },
    {
      id: 'paypal',
      name: 'PayPal / PYUSD',
      desc: 'PayPal Balance & PYUSD Stablecoin',
      icon: <DollarSign size={18} className="text-blue-400" />,
      badge: 'CRYPTO'
    },
    {
      id: 'cashapp',
      name: 'Cash App Pay',
      desc: 'Bitcoin Lightning ⚡ Instant',
      icon: <Zap size={18} className="text-amber-400" />,
      badge: 'LIGHTNING'
    },
    {
      id: 'studio_wallet',
      name: 'Studio Wallet Credit',
      desc: `Available Balance: $${(walletBalance || 0).toFixed(2)}`,
      icon: <Wallet size={18} className="text-violet-400" />,
      badge: walletBalance >= price ? 'INSTANT' : 'INSUFFICIENT',
      disabled: walletBalance < price
    }
  ];

  const handleConfirmPayment = async () => {
    if (isCheckingOut || isAccepting || !isPending) return;
    const targetOfferId = offer.id || offer.offer_id || messageId;

    if (selectedMethod === 'studio_wallet') {
      if (walletBalance < price) {
        showToast(`Insufficient wallet balance ($${walletBalance.toFixed(2)}). Please choose another payment method.`, 'error');
        return;
      }
      setIsAccepting(true);
      try {
        const res = await acceptCustomOffer(targetOfferId, offer);
        if (res.error) {
          showToast(res.error, 'error');
        } else {
          setLocalStatus('accepted');
          setIsPaymentModalOpen(false);
          showToast('✓ Offer accepted! Order created and sent to production.', 'success');
          try { playNotificationSound('success'); } catch {}
        }
      } catch {
        showToast('Failed to accept offer. Please try again.', 'error');
      } finally {
        setIsAccepting(false);
      }
    } else {
      setIsCheckingOut(true);
      try {
        const res = await createOfferCheckoutSession(targetOfferId, {
          amount: price,
          method: selectedMethod,
          clientEmail: offer.client_email,
          conversationId: offer.conversation_id || offer.thread_id,
          title: offer.title
        });

        const checkoutUrl = res?.paymentUrl || res?.url || res?.checkoutUrl || res?.invoice?.payment_url;
        if (checkoutUrl) {
          window.location.href = checkoutUrl;
        } else if (res?.error) {
          showToast(res.error, 'error');
        } else {
          showToast('Payment checkout initiated.', 'info');
        }
      } catch {
        showToast('Payment gateway temporarily unavailable. Please try again.', 'error');
      } finally {
        setIsCheckingOut(false);
      }
    }
  };

  const handleDecline = async () => {
    if (isDeclining || isCheckingOut || isAccepting || !isPending) return;
    setIsDeclining(true);
    try {
      const targetOfferId = offer.id || offer.offer_id || messageId;
      const res = await declineCustomOffer(targetOfferId, offer);
      if (res.error) {
        showToast(res.error, 'error');
      } else {
        setLocalStatus('declined');
        showToast('Offer declined.', 'info');
      }
    } catch {
      showToast('Failed to decline offer.', 'error');
    } finally {
      setIsDeclining(false);
    }
  };

  const handleCancel = async () => {
    if (isCancelling || !isPending) return;
    setIsCancelling(true);
    try {
      const targetOfferId = offer.id || offer.offer_id || messageId;
      const res = await cancelCustomOffer(targetOfferId, offer);
      if (res.error) {
        showToast(res.error, 'error');
      } else {
        setLocalStatus('cancelled');
        showToast('Offer withdrawn.', 'info');
      }
    } catch {
      showToast('Failed to cancel offer.', 'error');
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div style={{
      width: '100%',
      maxWidth: '390px',
      borderRadius: '16px',
      background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.98), rgba(30, 41, 59, 0.98))',
      border: isPending ? '1.5px solid rgba(99, 102, 241, 0.45)' : '1px solid rgba(255, 255, 255, 0.1)',
      boxShadow: isPending ? '0 10px 30px rgba(99, 102, 241, 0.18)' : '0 4px 14px rgba(0, 0, 0, 0.3)',
      overflow: 'hidden',
      color: '#f8fafc',
      fontFamily: 'inherit',
      transition: 'all 0.2s ease'
    }}>
      {/* Top Header Banner */}
      <div style={{
        padding: '0.65rem 0.9rem',
        background: 'linear-gradient(90deg, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.9))',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {getServiceIcon(offer.service_type)}
          <span style={{ fontSize: '0.74rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#cbd5e1' }}>
            {offer.service_type || 'Custom Offer'}
          </span>
        </div>
        {getStatusBadge()}
      </div>

      {/* Main Offer Body */}
      <div style={{ padding: '0.9rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {/* Title and Price */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
          <h4 style={{
            margin: 0,
            fontSize: '0.96rem',
            fontWeight: 800,
            color: '#ffffff',
            lineHeight: 1.3,
            flex: 1
          }}>
            {offer.title || 'Custom Design Order'}
          </h4>
          <div style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
            <div style={{
              fontSize: '1.25rem',
              fontWeight: 900,
              color: '#34d399',
              lineHeight: 1
            }}>
              ${price.toFixed(2)}
            </div>
            {hasDiscount && (
              <span style={{
                fontSize: '0.72rem',
                color: '#94a3b8',
                textDecoration: 'line-through',
                fontWeight: 600
              }}>
                ${originalPrice.toFixed(2)}
              </span>
            )}
          </div>
        </div>

        {/* Deliverables Description */}
        <p style={{
          margin: 0,
          fontSize: '0.8rem',
          color: '#cbd5e1',
          lineHeight: 1.45,
          background: 'rgba(0, 0, 0, 0.25)',
          padding: '0.55rem 0.7rem',
          borderRadius: '8px',
          border: '1px solid rgba(255, 255, 255, 0.05)'
        }}>
          {offer.description || 'Production-ready embroidery or vector artwork files crafted to exact technical specifications.'}
        </p>

        {/* Specifications Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '6px',
          padding: '0.5rem 0.65rem',
          background: 'rgba(255, 255, 255, 0.03)',
          borderRadius: '8px',
          border: '1px solid rgba(255, 255, 255, 0.05)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: '#94a3b8' }}>
            <Clock size={13} className="text-sky-400" />
            <span>Delivery: <strong style={{ color: '#f1f5f9' }}>{offer.delivery_time_text || '1 Day'}</strong></span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: '#94a3b8' }}>
            <RotateCcw size={13} className="text-emerald-400" />
            <span>Revisions: <strong style={{ color: '#f1f5f9' }}>{offer.revisions_allowed || '2'}</strong></span>
          </div>
        </div>

        {/* Accepted / Paid Offer State */}
        {(currentStatus === 'accepted' || currentStatus === 'paid') && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '0.75rem 1rem',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.18) 0%, rgba(5, 150, 105, 0.25) 100%)',
              border: '1.5px solid rgba(16, 185, 129, 0.45)',
              color: '#34d399',
              fontWeight: 800,
              fontSize: '0.9rem',
              boxShadow: '0 4px 14px rgba(16, 185, 129, 0.15)'
            }}>
              <CheckCircle2 size={18} className="text-emerald-400" />
              <span>✓ {currentStatus === 'paid' ? 'Paid & In Production' : 'Offer Accepted'} • ${price.toFixed(2)}</span>
            </div>

            {offer.order_id && (
              <div style={{
                padding: '0.55rem 0.85rem',
                borderRadius: '8px',
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ fontSize: '0.75rem', color: '#a7f3d0' }}>
                  Linked Order: <strong>#{offer.order_id}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => onOrderClick(offer.order_id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#34d399',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    cursor: 'pointer'
                  }}
                >
                  View Order <ChevronRight size={13} />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Action Controls for Customer (Active Offer) */}
        {isPending && !isAdmin && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {/* Primary Action: Open Payment Method Modal */}
            <button
              type="button"
              onClick={() => setIsPaymentModalOpen(true)}
              disabled={isCheckingOut || isAccepting || isDeclining}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                border: 'none',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '0.88rem',
                cursor: (isCheckingOut || isAccepting || isDeclining) ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
                transition: 'transform 0.15s ease, opacity 0.15s ease'
              }}
            >
              <CheckCircle2 size={16} />
              <span>Accept Offer • ${price.toFixed(2)}</span>
            </button>

            {/* Secondary Action Row: Reject & Details */}
            <div style={{ display: 'flex', gap: '0.45rem' }}>
              <button
                type="button"
                onClick={handleDecline}
                disabled={isCheckingOut || isAccepting || isDeclining}
                style={{
                  flex: 1,
                  padding: '0.55rem',
                  borderRadius: '8px',
                  background: 'rgba(244, 63, 94, 0.12)',
                  border: '1.5px solid rgba(244, 63, 94, 0.35)',
                  color: '#fb7185',
                  fontWeight: 800,
                  fontSize: '0.78rem',
                  cursor: (isCheckingOut || isAccepting || isDeclining) ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  transition: 'all 0.15s ease'
                }}
              >
                {isDeclining ? <Loader2 size={13} className="animate-spin" /> : <XCircle size={13} />}
                Reject
              </button>

              <button
                type="button"
                onClick={() => setIsDetailsOpen(true)}
                style={{
                  flex: 1,
                  padding: '0.55rem 0.65rem',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#cbd5e1',
                  fontWeight: 700,
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  transition: 'all 0.15s ease'
                }}
              >
                <Eye size={13} />
                Details
              </button>
            </div>
          </div>
        )}

        {/* Declined / Rejected State Banner */}
        {(currentStatus === 'declined' || currentStatus === 'rejected') && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            padding: '0.65rem 1rem',
            borderRadius: '10px',
            background: 'rgba(244, 63, 94, 0.12)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            color: '#fb7185',
            fontWeight: 700,
            fontSize: '0.82rem'
          }}>
            <XCircle size={15} />
            <span>Offer Rejected</span>
          </div>
        )}

        {/* Cancelled / Withdrawn State Banner */}
        {(currentStatus === 'cancelled' || currentStatus === 'withdrawn') && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            padding: '0.65rem 1rem',
            borderRadius: '10px',
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#f87171',
            fontWeight: 700,
            fontSize: '0.82rem'
          }}>
            <Ban size={15} />
            <span>Offer Withdrawn by Studio</span>
          </div>
        )}

        {/* Expired State Banner */}
        {currentStatus === 'expired' && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            padding: '0.65rem 1rem',
            borderRadius: '10px',
            background: 'rgba(245, 158, 11, 0.12)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            color: '#fbbf24',
            fontWeight: 700,
            fontSize: '0.82rem'
          }}>
            <Clock size={15} />
            <span>Offer Expired</span>
          </div>
        )}

        {/* Admin Controls (Prominent Withdraw Offer) */}
        {isAdmin && isPending && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', marginTop: '0.2rem' }}>
            <button
              type="button"
              onClick={handleCancel}
              disabled={isCancelling}
              style={{
                width: '100%',
                padding: '0.65rem 1rem',
                borderRadius: '8px',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1.5px solid rgba(239, 68, 68, 0.45)',
                color: '#f87171',
                fontWeight: 800,
                fontSize: '0.82rem',
                cursor: isCancelling ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'all 0.15s ease'
              }}
            >
              {isCancelling ? <Loader2 size={14} className="animate-spin" /> : <Ban size={14} />}
              {isCancelling ? 'Withdrawing Offer...' : 'Withdraw Offer'}
            </button>
            <div style={{ textAlign: 'center', fontSize: '0.7rem', color: '#94a3b8' }}>
              Awaiting client response • You can withdraw before acceptance
            </div>
          </div>
        )}
      </div>

      {/* Payment Method Selection Modal (Customer) */}
      {isPaymentModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(8px)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '520px',
            maxHeight: '92vh',
            overflowY: 'auto',
            background: '#0b1329',
            border: '1.5px solid rgba(99, 102, 241, 0.35)',
            borderRadius: '20px',
            padding: '1.5rem',
            color: '#f8fafc',
            boxShadow: '0 25px 60px rgba(0,0,0,0.85)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.1rem'
          }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '0.85rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#ffffff' }}>Accept Offer & Pay</h3>
                <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Select payment method to activate your order</span>
              </div>
              <button
                type="button"
                onClick={() => setIsPaymentModalOpen(false)}
                disabled={isCheckingOut || isAccepting}
                style={{ background: 'rgba(255, 255, 255, 0.08)', border: 'none', borderRadius: '8px', color: '#cbd5e1', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Offer Summary Box */}
            <div style={{
              padding: '0.85rem 1rem',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7), rgba(15, 23, 42, 0.9))',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <strong style={{ fontSize: '0.92rem', color: '#ffffff', display: 'block' }}>{offer.title}</strong>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{offer.service_type} • Turnaround: {offer.delivery_time_text || '1 Day'}</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block' }}>Total Due</span>
                <strong style={{ fontSize: '1.35rem', fontWeight: 900, color: '#34d399' }}>${price.toFixed(2)}</strong>
              </div>
            </div>

            {/* Payment Method Options */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.5rem' }}>
                Choose Payment Method
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {paymentMethods.map((pm) => {
                  const isSelected = selectedMethod === pm.id;
                  return (
                    <div
                      key={pm.id}
                      onClick={() => {
                        if (!pm.disabled && !isCheckingOut && !isAccepting) {
                          setSelectedMethod(pm.id);
                        }
                      }}
                      style={{
                        padding: '0.75rem 1rem',
                        borderRadius: '12px',
                        background: isSelected ? 'rgba(99, 102, 241, 0.18)' : 'rgba(255, 255, 255, 0.03)',
                        border: isSelected ? '1.5px solid #6366f1' : '1px solid rgba(255, 255, 255, 0.08)',
                        cursor: pm.disabled ? 'not-allowed' : 'pointer',
                        opacity: pm.disabled ? 0.5 : 1,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '34px',
                          height: '34px',
                          borderRadius: '8px',
                          background: isSelected ? 'rgba(99, 102, 241, 0.3)' : 'rgba(255, 255, 255, 0.06)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          {pm.icon}
                        </div>
                        <div>
                          <strong style={{ fontSize: '0.85rem', color: isSelected ? '#ffffff' : '#e2e8f0', display: 'block' }}>
                            {pm.name}
                          </strong>
                          <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                            {pm.desc}
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {pm.badge && (
                          <span style={{
                            fontSize: '0.62rem',
                            fontWeight: 800,
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: isSelected ? '#6366f1' : (pm.badge === 'INSUFFICIENT' ? 'rgba(244, 63, 94, 0.2)' : 'rgba(255, 255, 255, 0.1)'),
                            color: pm.badge === 'INSUFFICIENT' ? '#f43f5e' : '#ffffff'
                          }}>
                            {pm.badge}
                          </span>
                        )}
                        <div style={{
                          width: '16px',
                          height: '16px',
                          borderRadius: '50%',
                          border: isSelected ? '5px solid #6366f1' : '2px solid #64748b',
                          background: isSelected ? '#ffffff' : 'transparent'
                        }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setIsPaymentModalOpen(false)}
                disabled={isCheckingOut || isAccepting}
                style={{
                  padding: '0.7rem 1.25rem',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#cbd5e1',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmPayment}
                disabled={isCheckingOut || isAccepting}
                style={{
                  flex: 1,
                  padding: '0.75rem 1.5rem',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #4f46e5, #6366f1)',
                  border: 'none',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '0.9rem',
                  cursor: (isCheckingOut || isAccepting) ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 16px rgba(99, 102, 241, 0.4)',
                  transition: 'all 0.15s ease'
                }}
              >
                {(isCheckingOut || isAccepting) ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>{selectedMethod === 'studio_wallet' ? 'Placing Order...' : 'Opening Payment Gateway...'}</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} />
                    <span>Pay ${price.toFixed(2)} & Place Order</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Offer Details Modal */}
      {isDetailsOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(6px)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '480px',
            background: '#0f172a',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '16px',
            padding: '1.5rem',
            color: '#f8fafc',
            boxShadow: '0 20px 40px rgba(0,0,0,0.6)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#ffffff' }}>Offer Specifications</h3>
              <button
                type="button"
                onClick={() => setIsDetailsOpen(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1.2rem' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem' }}>
              <p style={{ margin: 0 }}><strong>Service:</strong> {offer.service_type}</p>
              <p style={{ margin: 0 }}><strong>Title:</strong> {offer.title}</p>
              <p style={{ margin: 0 }}><strong>Deliverables:</strong> {offer.description}</p>
              <p style={{ margin: 0 }}><strong>Price:</strong> ${price.toFixed(2)}</p>
              <p style={{ margin: 0 }}><strong>Turnaround:</strong> {offer.delivery_time_text}</p>
              <p style={{ margin: 0 }}><strong>Revisions:</strong> {offer.revisions_allowed}</p>
              <p style={{ margin: 0 }}><strong>Requirements Required:</strong> {offer.requires_requirements ? 'Yes (Submit artwork files)' : 'No'}</p>
            </div>

            <div style={{ marginTop: '1.5rem', textAlign: 'right' }}>
              <button
                type="button"
                onClick={() => setIsDetailsOpen(false)}
                style={{
                  padding: '0.5rem 1.25rem',
                  borderRadius: '8px',
                  background: '#334155',
                  color: '#ffffff',
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
