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
  Ban, 
  X 
} from 'lucide-react';
import { acceptCustomOffer, declineCustomOffer, cancelCustomOffer } from '../../services/supabaseService';
import { useAppState } from '../../context/StateContext';

/**
 * Custom Offer Card Message rendered inside Chat Feeds
 * Directly launches the application's global CheckoutModal (Cash App Pay, Apple Pay, Google Pay, PayPal, Card, Studio Wallet).
 */
export default function OfferCardMessage({
  offer,
  messageId,
  isAdmin = false,
  onOrderClick = () => {},
  showToast: propShowToast = null
}) {
  const { 
    showToast: contextShowToast, 
    setCheckoutSession, 
    setIsCheckoutModalOpen,
    authUser,
    currentUser 
  } = useAppState() || {};
  const showToast = propShowToast || contextShowToast || (() => {});

  const [isDeclining, setIsDeclining] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [localStatus, setLocalStatus] = useState(offer?.status || 'sent');
  const [isAccepting, setIsAccepting] = useState(false);

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

  const isPaid = currentStatus === 'paid' || offer.payment_status === 'paid' || offer.status === 'paid';
  const isAcceptedUnpaid = (currentStatus === 'accepted' || offer.status === 'accepted') && !isPaid;
  const isPending = !isPaid && !isAcceptedUnpaid && !['declined', 'rejected', 'expired', 'cancelled', 'withdrawn'].includes(currentStatus);

  const getServiceIcon = (svc) => {
    const s = (svc || '').toLowerCase();
    if (s.includes('vector')) return <Layers size={14} className="text-cyan-400" />;
    if (s.includes('patch')) return <ShieldCheck size={14} className="text-amber-400" />;
    return <Scissors size={14} className="text-emerald-400" />;
  };

  const getStatusBadge = () => {
    if (isPaid) {
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
          <CheckCircle2 size={12} /> Paid & In Production
        </span>
      );
    }

    if (isAcceptedUnpaid) {
      return (
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          fontSize: '0.72rem',
          fontWeight: 800,
          padding: '3px 10px',
          borderRadius: '999px',
          background: 'rgba(245, 158, 11, 0.18)',
          border: '1px solid rgba(245, 158, 11, 0.5)',
          color: '#fbbf24'
        }}>
          <Clock size={12} /> Accepted • Payment Pending
        </span>
      );
    }

    switch (currentStatus) {
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

  const handleAcceptOffer = async () => {
    if (isPaid || isAccepting) return;
    const targetOfferId = offer.id || offer.offer_id || messageId;

    // If offer is already accepted and just needs payment, open checkout immediately
    if (isAcceptedUnpaid && (offer.order_id || targetOfferId)) {
      if (setCheckoutSession && setIsCheckoutModalOpen) {
        setCheckoutSession({
          amount: price,
          price: price,
          totalPrice: price,
          offerId: targetOfferId,
          id: offer.order_id || targetOfferId,
          orderId: offer.order_id || null,
          title: offer.title || 'Custom Design Order',
          orderTitle: offer.title || 'Custom Design Order',
          clientEmail: offer.client_email || authUser?.email || currentUser?.email,
          serviceType: offer.service_type || 'Embroidery Digitizing',
          conversationId: offer.conversation_id || offer.thread_id,
          isCustomOffer: true,
          offerData: offer
        });
        setIsCheckoutModalOpen(true);
      } else {
        showToast('Opening payment checkout...', 'info');
      }
      return;
    }

    // Otherwise accept offer first, creating pending order, then open checkout
    setIsAccepting(true);
    try {
      const res = await acceptCustomOffer(targetOfferId, offer);
      if (res?.error) {
        showToast(res.error, 'error');
      } else {
        const createdOrder = res?.order;
        setLocalStatus('accepted');
        showToast('Offer accepted! Opening payment checkout...', 'success');
        if (setCheckoutSession && setIsCheckoutModalOpen) {
          setCheckoutSession({
            amount: price,
            price: price,
            totalPrice: price,
            offerId: targetOfferId,
            id: createdOrder?.id || offer.order_id || targetOfferId,
            orderId: createdOrder?.id || offer.order_id || null,
            title: offer.title || 'Custom Design Order',
            orderTitle: offer.title || 'Custom Design Order',
            clientEmail: offer.client_email || authUser?.email || currentUser?.email,
            serviceType: offer.service_type || 'Embroidery Digitizing',
            conversationId: offer.conversation_id || offer.thread_id,
            isCustomOffer: true,
            offerData: res?.offer || offer
          });
          setIsCheckoutModalOpen(true);
        }
      }
    } catch {
      showToast('Failed to accept offer. Please try again.', 'error');
    } finally {
      setIsAccepting(false);
    }
  };

  const handleDecline = async () => {
    if (isDeclining || !isPending) return;
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

        {/* Paid Offer State */}
        {isPaid && (
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
              <span>✓ Paid & In Production • ${price.toFixed(2)}</span>
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

        {/* Accepted But Payment Pending State */}
        {isAcceptedUnpaid && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '0.65rem 1rem',
              borderRadius: '10px',
              background: 'rgba(245, 158, 11, 0.12)',
              border: '1.5px solid rgba(245, 158, 11, 0.35)',
              color: '#fbbf24',
              fontWeight: 800,
              fontSize: '0.85rem'
            }}>
              <Clock size={16} />
              <span>Offer Accepted • Payment Pending</span>
            </div>

            {offer.order_id && (
              <div style={{
                padding: '0.5rem 0.75rem',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                  Linked Order: <strong style={{ color: '#f8fafc' }}>#{offer.order_id}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => onOrderClick(offer.order_id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#60a5fa',
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

            {!isAdmin && (
              <button
                type="button"
                onClick={handleAcceptOffer}
                disabled={isAccepting}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                  border: 'none',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '0.88rem',
                  cursor: isAccepting ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
                  transition: 'all 0.15s ease'
                }}
              >
                {isAccepting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                <span>Complete Payment • ${price.toFixed(2)}</span>
              </button>
            )}
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

        {/* Action Controls for Customer (Active Offer) */}
        {isPending && !isAdmin && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {/* Primary Action: Accept & Open Payment Method Checkout */}
            <button
              type="button"
              onClick={handleAcceptOffer}
              disabled={isDeclining || isAccepting}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                border: 'none',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '0.88rem',
                cursor: (isDeclining || isAccepting) ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
                transition: 'transform 0.15s ease, opacity 0.15s ease'
              }}
            >
              {isAccepting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
              <span>{isAccepting ? 'Accepting Offer...' : `Accept Offer • $${price.toFixed(2)}`}</span>
            </button>

            {/* Secondary Action Row: Reject & Details */}
            <div style={{ display: 'flex', gap: '0.45rem' }}>
              <button
                type="button"
                onClick={handleDecline}
                disabled={isDeclining}
                style={{
                  flex: 1,
                  padding: '0.55rem',
                  borderRadius: '8px',
                  background: 'rgba(244, 63, 94, 0.12)',
                  border: '1.5px solid rgba(244, 63, 94, 0.35)',
                  color: '#fb7185',
                  fontWeight: 800,
                  fontSize: '0.78rem',
                  cursor: isDeclining ? 'not-allowed' : 'pointer',
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
                <X size={18} />
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
