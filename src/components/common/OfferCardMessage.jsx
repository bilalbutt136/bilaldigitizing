'use client';

import React, { useState } from 'react';
import { 
  Zap, 
  Clock, 
  RotateCcw, 
  CheckCircle2, 
  ShieldCheck,
  Loader2,
  CreditCard,
  ExternalLink
} from 'lucide-react';
import { useAppState } from '../../context/StateContext';

export default function OfferCardMessage({
  offer,
  isCustomerView = false,
  onOfferAccepted = () => {},
  onOfferDeclined = () => {},
  showToast = () => {}
}) {
  const [isProcessing, setIsProcessing] = useState(false);

  const {
    setIsCheckoutModalOpen,
    setCheckoutSession,
    authUser,
    currentUser,
    refreshOrders,
    setActiveCustomerTab,
    setActiveAdminTab
  } = useAppState();

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
    payment_status = 'pending',
    expires_at
  } = offer;

  const orderId = offer.order_id || offer.orderId || offer.orderID || null;
  const displayPrice = parseFloat(final_price || price || 0).toFixed(2);
  const displayPriceNum = parseFloat(displayPrice);

  const isExpired = status === 'expired' || (expires_at && new Date(expires_at).getTime() < Date.now() && status === 'pending');
  const currentStatus = isExpired ? 'expired' : status;
  const currentPaymentStatus = String(payment_status || offer.paymentStatus || '').toLowerCase();

  const isPaid = currentStatus === 'paid' || currentPaymentStatus === 'paid';
  const isAcceptedUnpaid = (currentStatus === 'accepted' || status === 'accepted') && !isPaid;
  const isPending = (currentStatus === 'pending' || currentStatus === 'sent' || currentStatus === 'viewed') && !isPaid && !isAcceptedUnpaid;
  const isDeclined = currentStatus === 'declined';

  // Helper to launch universal checkout modal for this offer & order
  const openCheckoutForOffer = (activeOffer, targetOrderId = null) => {
    const cleanOrderId = targetOrderId || activeOffer?.order_id || activeOffer?.orderId || orderId;
    const priceNum = parseFloat(activeOffer?.final_price || activeOffer?.price || displayPriceNum);
    const clientEmail = (activeOffer?.client_email || authUser?.email || currentUser?.email || '').toLowerCase().trim();

    if (setCheckoutSession && setIsCheckoutModalOpen) {
      setCheckoutSession({
        amount: priceNum,
        price: priceNum,
        totalPrice: priceNum,
        orderId: cleanOrderId,
        offerId: activeOffer?.id || id,
        conversationId: activeOffer?.conversation_id || activeOffer?.thread_id || offer.conversation_id,
        title: activeOffer?.title || title,
        clientEmail: clientEmail,
        serviceType: activeOffer?.service_type || service_type
      });
      setIsCheckoutModalOpen(true);
    }
  };

  // Helper to navigate to orders and view the linked order
  const handleViewOrder = (targetId) => {
    if (!targetId) return;
    const cleanId = String(targetId).replace(/^#+/, '');
    if (isCustomerView) {
      if (setActiveCustomerTab) setActiveCustomerTab('orders');
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('bdigi_switch_tab', { detail: { tab: 'orders', orderId: cleanId, trackOrder: cleanId } }));
      }
    } else {
      if (setActiveAdminTab) setActiveAdminTab('orders');
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('bdigi_switch_admin_tab', { detail: { tab: 'orders', orderId: cleanId, trackOrder: cleanId } }));
        window.dispatchEvent(new CustomEvent('bdigi_switch_tab', { detail: { tab: 'orders', orderId: cleanId, trackOrder: cleanId } }));
      }
    }
  };

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
        const resultingOrderId = data.orderId || data.order?.id || data.offer?.order_id || orderId;
        const updatedOffer = data.offer || { 
          ...offer, 
          status: 'accepted', 
          order_id: resultingOrderId,
          payment_status: 'pending' 
        };
        
        onOfferAccepted(updatedOffer);
        showToast(`✓ Offer accepted! Order #${resultingOrderId || ''} created. Please complete payment to start production.`, 'success');

        if (data?.checkoutUrl) {
          window.location.href = data.checkoutUrl;
        } else {
          openCheckoutForOffer(updatedOffer, resultingOrderId);
        }

        if (refreshOrders) {
          refreshOrders().catch(() => {});
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
      border: isPaid ? '1.5px solid #86efac' : isAcceptedUnpaid ? '1.5px solid #fde68a' : '1.5px solid #e2e8f0',
      borderRadius: '14px',
      padding: '1.25rem',
      maxWidth: '460px',
      width: '100%',
      boxShadow: isPaid ? '0 4px 16px rgba(22, 163, 74, 0.08)' : isAcceptedUnpaid ? '0 4px 16px rgba(217, 119, 6, 0.08)' : '0 4px 16px rgba(15, 23, 42, 0.08)',
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
          {isPending && (
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#ea580c', background: '#fff7ed', padding: '0.2rem 0.55rem', borderRadius: '12px', border: '1px solid #ffedd5' }}>
              Pending Review
            </span>
          )}
          {isAcceptedUnpaid && (
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#b45309', background: '#fef3c7', padding: '0.2rem 0.55rem', borderRadius: '12px', border: '1px solid #fde68a', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Clock size={12} /> Awaiting Payment
            </span>
          )}
          {isPaid && (
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#16a34a', background: '#f0fdf4', padding: '0.2rem 0.55rem', borderRadius: '12px', border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <CheckCircle2 size={12} /> Paid & In Production
            </span>
          )}
          {isDeclined && (
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', background: '#f1f5f9', padding: '0.2rem 0.55rem', borderRadius: '12px' }}>
              Declined
            </span>
          )}
          {isExpired && (
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

      {/* ACTION CONTROLS: CUSTOMER VIEW */}
      {isCustomerView && (
        <>
          {/* 1. PENDING STATE: Accept & Pay / Decline */}
          {isPending && (
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

          {/* 2. ACCEPTED BUT UNPAID STATE: Complete Payment / View Order */}
          {isAcceptedUnpaid && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ fontSize: '0.78rem', color: '#b45309', background: '#fffbeb', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #fef3c7', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Clock size={14} />
                <span>
                  Order <strong>#{orderId || 'Custom'}</strong> created. Please complete payment to send into production.
                </span>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => openCheckoutForOffer(offer, orderId)}
                  style={{
                    flex: 1,
                    background: 'linear-gradient(135deg, #ea580c, #f97316)',
                    color: '#ffffff',
                    border: 'none',
                    padding: '0.65rem 1rem',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem',
                    boxShadow: '0 2px 8px rgba(234, 88, 12, 0.25)'
                  }}
                >
                  <CreditCard size={16} />
                  Complete Payment (${displayPrice})
                </button>

                {orderId && (
                  <button
                    type="button"
                    onClick={() => handleViewOrder(orderId)}
                    style={{
                      background: '#f8fafc',
                      color: '#475569',
                      border: '1px solid #cbd5e1',
                      padding: '0.65rem 0.85rem',
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem'
                    }}
                  >
                    <ExternalLink size={14} /> Order
                  </button>
                )}
              </div>
            </div>
          )}

          {/* 3. PAID & IN PRODUCTION STATE: View Order */}
          {isPaid && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ fontSize: '0.78rem', color: '#15803d', background: '#f0fdf4', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <CheckCircle2 size={14} />
                <span>
                  Payment verified (${displayPrice}). Order <strong>#{orderId || 'Active'}</strong> is in active production!
                </span>
              </div>
              {orderId && (
                <button
                  type="button"
                  onClick={() => handleViewOrder(orderId)}
                  style={{
                    width: '100%',
                    background: '#f8fafc',
                    color: '#0f172a',
                    border: '1.5px solid #cbd5e1',
                    padding: '0.55rem 0.85rem',
                    borderRadius: '8px',
                    fontSize: '0.82rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem'
                  }}
                >
                  <ExternalLink size={14} /> View Live Order #{orderId}
                </button>
              )}
            </div>
          )}
        </>
      )}

      {/* ACTION CONTROLS: ADMIN VIEW */}
      {!isCustomerView && (
        <div style={{ paddingTop: '0.2rem' }}>
          {isPending && (
            <div style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Clock size={13} />
              <span>Sent to client • Awaiting client acceptance & payment</span>
            </div>
          )}

          {isAcceptedUnpaid && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fffbeb', padding: '0.45rem 0.65rem', borderRadius: '8px', border: '1px solid #fde68a' }}>
              <span style={{ fontSize: '0.75rem', color: '#b45309', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Clock size={13} /> Client accepted • Awaiting payment (${displayPrice})
              </span>
              {orderId && (
                <button
                  type="button"
                  onClick={() => handleViewOrder(orderId)}
                  style={{
                    background: '#ffffff',
                    color: '#b45309',
                    border: '1px solid #fde68a',
                    padding: '0.25rem 0.55rem',
                    borderRadius: '6px',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}
                >
                  <ExternalLink size={12} /> #{orderId}
                </button>
              )}
            </div>
          )}

          {isPaid && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f0fdf4', padding: '0.45rem 0.65rem', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
              <span style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <CheckCircle2 size={13} /> ✓ Paid & In Production
              </span>
              {orderId && (
                <button
                  type="button"
                  onClick={() => handleViewOrder(orderId)}
                  style={{
                    background: '#ffffff',
                    color: '#16a34a',
                    border: '1px solid #bbf7d0',
                    padding: '0.25rem 0.55rem',
                    borderRadius: '6px',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}
                >
                  <ExternalLink size={12} /> Manage #{orderId}
                </button>
              )}
            </div>
          )}

          {isDeclined && (
            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Client declined this offer</span>
          )}

          {isExpired && (
            <span style={{ fontSize: '0.75rem', color: '#dc2626' }}>Offer has expired</span>
          )}
        </div>
      )}
    </div>
  );
}
