'use client';

import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Clock, 
  RotateCcw, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Eye, 
  ChevronRight, 
  Scissors, 
  Layers, 
  ShieldCheck, 
  FileText,
  Loader2,
  ExternalLink,
  DollarSign,
  Ban,
  Check,
  CreditCard
} from 'lucide-react';
import { acceptCustomOffer, declineCustomOffer, cancelCustomOffer, createOfferCheckoutSession } from '../../services/supabaseService';
import { playNotificationSound } from '../../utils/audioNotification';
import { useAppState } from '../../context/StateContext';

/**
 * Custom Offer Card Message rendered inside Chat Feeds
 * Supports Customer & Admin views with persistent database state synchronization and Stripe Card Checkout.
 */
export default function OfferCardMessage({
  offer,
  messageId,
  isMe = false,
  isAdmin = false,
  onOrderClick = () => {},
  showToast: propShowToast = null
}) {
  const { showToast: contextShowToast } = useAppState() || {};
  const showToast = propShowToast || contextShowToast || (() => {});

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
            <CheckCircle2 size={12} /> {currentStatus === 'paid' ? 'Paid (In Production)' : 'Completed / Accepted'}
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

  const handleStripeCheckout = async () => {
    if (isCheckingOut || isAccepting || !isPending) return;
    setIsCheckingOut(true);
    try {
      const targetOfferId = offer.id || offer.offer_id || messageId;
      const res = await createOfferCheckoutSession(targetOfferId, {
        amount: price,
        clientEmail: offer.client_email,
        conversationId: offer.conversation_id || offer.thread_id,
        title: offer.title
      });

      if (res.url) {
        window.location.href = res.url;
      } else {
        showToast(res.error || 'Failed to initiate card checkout session', 'error');
      }
    } catch {
      showToast('Stripe checkout service temporarily unavailable', 'error');
    } finally {
      setIsCheckingOut(false);
    }
  };

  const handleDirectAccept = async () => {
    if (isAccepting || isCheckingOut || !isPending) return;
    setIsAccepting(true);
    try {
      const targetOfferId = offer.id || offer.offer_id || messageId;
      const res = await acceptCustomOffer(targetOfferId, offer);
      if (res.error) {
        showToast(res.error, 'error');
      } else {
        setLocalStatus('accepted');
        showToast('✓ Offer accepted! Production order created.', 'success');
        try { playNotificationSound('success'); } catch {}
      }
    } catch {
      showToast('Failed to accept offer. Please try again.', 'error');
    } finally {
      setIsAccepting(false);
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
      border: currentStatus === 'accepted'
        ? '1.5px solid rgba(16, 185, 129, 0.5)'
        : '1px solid rgba(255, 255, 255, 0.12)',
      boxShadow: currentStatus === 'accepted' 
        ? '0 8px 30px rgba(16, 185, 129, 0.15)' 
        : '0 8px 30px rgba(0, 0, 0, 0.4)',
      overflow: 'hidden',
      margin: '0.4rem 0',
      color: '#f8fafc',
      fontFamily: 'inherit',
      textAlign: 'left'
    }}>
      {/* Top Header Banner */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.75rem 1rem',
        background: currentStatus === 'accepted' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(0, 0, 0, 0.25)',
        borderBottom: currentStatus === 'accepted' ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(255, 255, 255, 0.08)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {getServiceIcon(offer.service_type)}
          <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#cbd5e1' }}>
            {offer.service_type || 'Custom Offer'}
          </span>
        </div>
        {getStatusBadge()}
      </div>

      {/* Main Offer Body */}
      <div style={{ padding: '1rem' }}>
        {/* Title & Price Row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '0.6rem' }}>
          <h4 style={{
            fontSize: '1rem',
            fontWeight: 800,
            color: '#ffffff',
            margin: 0,
            lineHeight: 1.3
          }}>
            {offer.title}
          </h4>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            {hasDiscount && (
              <span style={{ fontSize: '0.75rem', textDecoration: 'line-through', color: '#94a3b8', display: 'block' }}>
                ${originalPrice.toFixed(2)}
              </span>
            )}
            <span style={{
              fontSize: '1.25rem',
              fontWeight: 900,
              color: '#34d399',
              letterSpacing: '-0.02em'
            }}>
              ${price.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Description Snippet */}
        <p style={{
          fontSize: '0.82rem',
          color: '#cbd5e1',
          lineHeight: 1.45,
          margin: '0 0 0.85rem 0',
          whiteSpace: 'pre-wrap'
        }}>
          {offer.description}
        </p>

        {/* Specs Grid (Delivery, Revisions, Requirements) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '0.5rem',
          background: 'rgba(0, 0, 0, 0.2)',
          padding: '0.6rem 0.75rem',
          borderRadius: '10px',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          marginBottom: '0.85rem'
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

        {/* Accepted / Paid Offer State (Clean Green Banner + Price + Linked Order) */}
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
              <span>✓ {currentStatus === 'paid' ? 'Paid via Stripe' : 'Offer Accepted'} • ${price.toFixed(2)}</span>
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
            {/* Primary Action: Stripe Card Checkout */}
            <button
              type="button"
              onClick={handleStripeCheckout}
              disabled={isCheckingOut || isAccepting || isDeclining}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                border: 'none',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '0.88rem',
                cursor: (isCheckingOut || isAccepting || isDeclining) ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)',
                transition: 'transform 0.15s ease, opacity 0.15s ease'
              }}
            >
              {isCheckingOut ? <Loader2 size={16} className="animate-spin" /> : <CreditCard size={16} />}
              {isCheckingOut ? 'Opening Stripe Checkout...' : `💳 Pay with Card • $${price.toFixed(2)}`}
            </button>

            {/* Secondary Action Row: Instant Accept & Details */}
            <div style={{ display: 'flex', gap: '0.45rem' }}>
              <button
                type="button"
                onClick={handleDirectAccept}
                disabled={isCheckingOut || isAccepting || isDeclining}
                style={{
                  flex: 1.2,
                  padding: '0.55rem',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                  border: 'none',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '0.78rem',
                  cursor: (isCheckingOut || isAccepting || isDeclining) ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  boxShadow: '0 2px 8px rgba(16, 185, 129, 0.25)',
                  transition: 'all 0.15s ease'
                }}
              >
                {isAccepting ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
                {isAccepting ? 'Accepting...' : '✓ Instant Accept'}
              </button>

              <button
                type="button"
                onClick={handleDecline}
                disabled={isCheckingOut || isAccepting || isDeclining}
                style={{
                  flex: 0.8,
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
                {isDeclining ? 'Rejecting...' : 'Reject'}
              </button>

              <button
                type="button"
                onClick={() => setIsDetailsOpen(true)}
                style={{
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
          zIndex: 9999,
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
