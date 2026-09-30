'use client';

import React, { useMemo, useState } from 'react';
import { CheckCircle2, MessageSquare, ShieldCheck, Star, X } from 'lucide-react';
import { useModalBackNavigation } from '../../hooks/useModalBackNavigation';
import { submitOrderReview } from '../../services/reviewService';

function buildDefaultDisplayName(order) {
  const raw = String(order?.clientName || order?.client_name || '').trim();
  if (!raw) return 'Verified Customer';

  const parts = raw.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1].charAt(0).toUpperCase()}.`;
}

export function CustomerReviewModal({ order, onClose, onSubmitted }) {
  const [rating, setRating] = useState(5);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [displayName, setDisplayName] = useState(() => buildDefaultDisplayName(order));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedReview, setSubmittedReview] = useState(null);
  const [error, setError] = useState('');

  const { handleSafeClose } = useModalBackNavigation({
    isOpen: true,
    onClose,
    modalId: 'customer_order_review'
  });

  const activeRating = hoveredRating || rating;
  const orderLabel = useMemo(() => {
    const id = String(order?.id || '').replace(/^#+/, '');
    return id ? `Order #${id}` : 'Your order';
  }, [order?.id]);

  const ratingLabel = {
    1: 'Needs improvement',
    2: 'Could be better',
    3: 'Good',
    4: 'Great',
    5: 'Excellent'
  }[rating];

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    const comment = reviewText.trim();
    if (comment.length < 3) {
      setError('Please add a short comment about your delivery.');
      return;
    }

    setIsSubmitting(true);
    try {
      const data = await submitOrderReview({
        orderId: order?.id,
        rating,
        reviewText: comment,
        displayName: displayName.trim()
      });

      setSubmittedReview(data.review || null);
      if (typeof onSubmitted === 'function') {
        onSubmitted(data.review || null);
      }
    } catch (submitError) {
      setError(submitError?.message || 'Could not save your feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submittedReview) {
    return (
      <div
        className="customer-review-modal-overlay"
        onClick={handleSafeClose}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1000100,
          background: 'rgba(15, 23, 42, 0.62)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}
      >
        <div
          onClick={(event) => event.stopPropagation()}
          style={{
            width: '100%',
            maxWidth: '460px',
            background: 'var(--bg-card, #ffffff)',
            border: '1px solid var(--border-color, #e2e8f0)',
            borderRadius: '20px',
            boxShadow: '0 24px 70px rgba(15, 23, 42, 0.25)',
            padding: '2rem',
            textAlign: 'center'
          }}
        >
          <div style={{
            width: '58px',
            height: '58px',
            borderRadius: '18px',
            background: '#ecfdf5',
            color: '#059669',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem'
          }}>
            <CheckCircle2 size={30} />
          </div>
          <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 900, color: 'var(--text-main, #0f172a)' }}>
            Thank you for your feedback
          </h3>
          <p style={{ margin: '0.55rem auto 1.35rem', maxWidth: '360px', fontSize: '0.86rem', lineHeight: 1.55, color: 'var(--text-muted, #64748b)' }}>
            Your review was sent to the studio. It will only appear on the website if an admin approves it for publication.
          </p>
          <button
            type="button"
            onClick={handleSafeClose}
            className="btn btn-primary-orange"
            style={{ width: '100%', justifyContent: 'center', fontWeight: 900 }}
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="customer-review-modal-overlay"
      onClick={handleSafeClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000100,
        background: 'rgba(15, 23, 42, 0.62)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'max(0.75rem, env(safe-area-inset-top, 0.75rem)) 0.75rem max(0.75rem, env(safe-area-inset-bottom, 0.75rem))'
      }}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '520px',
          maxHeight: 'calc(100dvh - 1.5rem)',
          overflowY: 'auto',
          background: 'var(--bg-card, #ffffff)',
          border: '1px solid var(--border-color, #e2e8f0)',
          borderRadius: '20px',
          boxShadow: '0 24px 70px rgba(15, 23, 42, 0.28)'
        }}
      >
        <div style={{
          padding: '1rem 1rem 0.9rem',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '0.75rem',
          borderBottom: '1px solid var(--border-color, #e2e8f0)'
        }}>
          <div style={{ display: 'flex', gap: '0.75rem', minWidth: 0 }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: '#fff7ed',
              color: '#ea580c',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <MessageSquare size={19} />
            </div>
            <div style={{ minWidth: 0 }}>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 900, color: 'var(--text-main, #0f172a)' }}>
                How was your delivery?
              </h3>
              <div style={{ marginTop: '0.15rem', fontSize: '0.74rem', color: 'var(--text-muted, #64748b)' }}>
                {orderLabel} • Optional — you can leave this later
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSafeClose}
            aria-label="Close feedback"
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '10px',
              border: '1px solid var(--border-color, #e2e8f0)',
              background: 'var(--bg-surface, #ffffff)',
              color: 'var(--text-muted, #64748b)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0
            }}
          >
            <X size={17} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '1rem' }}>
          <div style={{
            border: '1px solid var(--border-color, #e2e8f0)',
            borderRadius: '14px',
            padding: '1rem',
            background: 'var(--bg-surface, #ffffff)'
          }}>
            <div style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-main, #0f172a)', marginBottom: '0.7rem' }}>
              Overall experience
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.32rem', flexWrap: 'wrap' }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  aria-label={`${star} star${star === 1 ? '' : 's'}`}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    padding: '0.15rem',
                    cursor: 'pointer',
                    display: 'inline-flex'
                  }}
                >
                  <Star
                    size={30}
                    fill={star <= activeRating ? '#f59e0b' : 'transparent'}
                    style={{ color: star <= activeRating ? '#f59e0b' : '#cbd5e1' }}
                    strokeWidth={1.8}
                  />
                </button>
              ))}
              <span style={{ marginLeft: '0.35rem', fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-main, #0f172a)' }}>
                {ratingLabel}
              </span>
            </div>
          </div>

          <label style={{ display: 'block', marginTop: '0.9rem' }}>
            <span style={{ display: 'block', fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-main, #0f172a)', marginBottom: '0.4rem' }}>
              Your feedback
            </span>
            <textarea
              value={reviewText}
              onChange={(event) => setReviewText(event.target.value.slice(0, 1600))}
              placeholder="Tell us what went well or what we can improve."
              rows={5}
              style={{
                width: '100%',
                resize: 'vertical',
                boxSizing: 'border-box',
                border: '1px solid var(--border-color, #cbd5e1)',
                borderRadius: '12px',
                padding: '0.8rem 0.9rem',
                fontSize: '0.86rem',
                lineHeight: 1.5,
                color: 'var(--text-main, #0f172a)',
                background: 'var(--bg-surface, #ffffff)',
                outline: 'none'
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', marginTop: '0.28rem', fontSize: '0.68rem', color: 'var(--text-muted, #64748b)' }}>
              <span>A short, honest note is perfect.</span>
              <span>{reviewText.length}/1600</span>
            </div>
          </label>

          <label style={{ display: 'block', marginTop: '0.85rem' }}>
            <span style={{ display: 'block', fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-main, #0f172a)', marginBottom: '0.4rem' }}>
              Name shown if published
            </span>
            <input
              type="text"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value.slice(0, 80))}
              placeholder="Verified Customer"
              style={{
                width: '100%',
                boxSizing: 'border-box',
                border: '1px solid var(--border-color, #cbd5e1)',
                borderRadius: '12px',
                padding: '0.72rem 0.85rem',
                fontSize: '0.84rem',
                color: 'var(--text-main, #0f172a)',
                background: 'var(--bg-surface, #ffffff)',
                outline: 'none'
              }}
            />
          </label>

          <div style={{
            marginTop: '0.9rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.55rem',
            padding: '0.7rem 0.8rem',
            borderRadius: '10px',
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            color: '#475569',
            fontSize: '0.72rem',
            lineHeight: 1.45
          }}>
            <ShieldCheck size={15} style={{ color: '#059669', flexShrink: 0, marginTop: '1px' }} />
            <span>
              Nothing is published automatically. Your feedback goes to the admin review queue first.
            </span>
          </div>

          {error && (
            <div style={{
              marginTop: '0.75rem',
              padding: '0.65rem 0.75rem',
              borderRadius: '10px',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#b91c1c',
              fontSize: '0.76rem',
              fontWeight: 700
            }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.6rem', marginTop: '1rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={handleSafeClose}
              className="btn btn-outline"
              style={{ flex: '1 1 140px', justifyContent: 'center', fontWeight: 800 }}
              disabled={isSubmitting}
            >
              Maybe later
            </button>
            <button
              type="submit"
              className="btn btn-primary-orange"
              style={{ flex: '1 1 190px', justifyContent: 'center', fontWeight: 900 }}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Sending…' : 'Submit feedback'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CustomerReviewModal;
