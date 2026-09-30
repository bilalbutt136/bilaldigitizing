'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Clock3,
  Eye,
  EyeOff,
  RefreshCw,
  ShieldCheck,
  Star
} from 'lucide-react';

const STATUS_META = {
  pending: {
    label: 'Pending review',
    color: '#b45309',
    background: '#fffbeb',
    border: '#fde68a'
  },
  published: {
    label: 'Published',
    color: '#047857',
    background: '#ecfdf5',
    border: '#a7f3d0'
  },
  hidden: {
    label: 'Private',
    color: '#475569',
    background: '#f8fafc',
    border: '#cbd5e1'
  }
};

function formatDate(value) {
  if (!value) return '';
  try {
    return new Date(value).toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  } catch {
    return '';
  }
}

function StarRating({ rating = 5 }) {
  const safeRating = Math.max(1, Math.min(5, Number(rating) || 5));
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '2px', color: '#f59e0b' }} aria-label={`${safeRating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={16}
          fill={star <= safeRating ? 'currentColor' : 'transparent'}
          strokeWidth={1.8}
        />
      ))}
    </div>
  );
}

export function CustomerReviewsManager({ showToast }) {
  const [reviews, setReviews] = useState([]);
  const [counts, setCounts] = useState({ total: 0, pending: 0, published: 0, hidden: 0 });
  const [activeFilter, setActiveFilter] = useState('pending');
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState('');

  const loadReviews = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch('/api/reviews?scope=admin', { cache: 'no-store' });
      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data?.success) {
        throw new Error(data?.error || 'Could not load customer reviews.');
      }

      setReviews(Array.isArray(data.reviews) ? data.reviews : []);
      setCounts(data.counts || { total: 0, pending: 0, published: 0, hidden: 0 });
    } catch (loadError) {
      setError(loadError?.message || 'Could not load customer reviews.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  const filteredReviews = useMemo(() => {
    if (activeFilter === 'all') return reviews;
    return reviews.filter((review) => (review.moderation_status || 'pending') === activeFilter);
  }, [reviews, activeFilter]);

  const moderateReview = async (reviewId, action) => {
    setUpdatingId(reviewId);
    setError('');

    try {
      const response = await fetch('/api/reviews', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewId, action })
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data?.success) {
        throw new Error(data?.error || 'Could not update this review.');
      }

      await loadReviews();
      window.dispatchEvent(new CustomEvent('bdigi_reviews_updated'));

      if (typeof showToast === 'function') {
        showToast(
          action === 'publish'
            ? 'Review published to the website.'
            : 'Review kept private and removed from the public website.',
          'success'
        );
      }
    } catch (updateError) {
      const message = updateError?.message || 'Could not update this review.';
      setError(message);
      if (typeof showToast === 'function') showToast(message, 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const filterItems = [
    { id: 'pending', label: 'Pending', count: counts.pending || 0 },
    { id: 'published', label: 'Published', count: counts.published || 0 },
    { id: 'hidden', label: 'Private', count: counts.hidden || 0 },
    { id: 'all', label: 'All', count: counts.total || 0 }
  ];

  return (
    <section style={{ maxWidth: '1180px', margin: '0 auto' }}>
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: '1rem',
        flexWrap: 'wrap',
        marginBottom: '1rem'
      }}>
        <div>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.3rem 0.65rem',
            borderRadius: '999px',
            background: '#fff7ed',
            color: '#c2410c',
            fontSize: '0.72rem',
            fontWeight: 900,
            marginBottom: '0.55rem'
          }}>
            <ShieldCheck size={14} />
            Verified order feedback
          </div>
          <h2 style={{
            margin: 0,
            fontSize: 'clamp(1.35rem, 2.5vw, 1.8rem)',
            fontWeight: 900,
            color: 'var(--text-main, #0f172a)'
          }}>
            Customer Reviews
          </h2>
          <p style={{
            margin: '0.35rem 0 0',
            color: 'var(--text-muted, #64748b)',
            fontSize: '0.84rem',
            lineHeight: 1.5,
            maxWidth: '680px'
          }}>
            Reviews are private by default. Publish only the feedback you want displayed on the public website.
          </p>
        </div>

        <button
          type="button"
          onClick={loadReviews}
          className="btn btn-outline btn-sm"
          disabled={isLoading}
          style={{ fontWeight: 800, gap: '0.35rem' }}
        >
          <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '0.7rem',
        marginBottom: '1rem'
      }}>
        {[
          ['Pending review', counts.pending || 0, '#b45309', '#fffbeb'],
          ['Published live', counts.published || 0, '#047857', '#ecfdf5'],
          ['Kept private', counts.hidden || 0, '#475569', '#f8fafc'],
          ['Total reviews', counts.total || 0, '#1d4ed8', '#eff6ff']
        ].map(([label, value, color, background]) => (
          <div
            key={label}
            style={{
              background,
              border: '1px solid var(--border-color, #e2e8f0)',
              borderRadius: '13px',
              padding: '0.85rem 0.95rem'
            }}
          >
            <div style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--text-muted, #64748b)', textTransform: 'uppercase' }}>
              {label}
            </div>
            <div style={{ marginTop: '0.2rem', fontSize: '1.35rem', fontWeight: 900, color }}>
              {value}
            </div>
          </div>
        ))}
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.4rem',
        flexWrap: 'wrap',
        marginBottom: '1rem'
      }}>
        {filterItems.map((item) => {
          const active = activeFilter === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveFilter(item.id)}
              className="btn btn-sm"
              style={{
                border: active ? '1px solid #ea580c' : '1px solid var(--border-color, #e2e8f0)',
                background: active ? '#fff7ed' : 'var(--bg-card, #ffffff)',
                color: active ? '#c2410c' : 'var(--text-main, #334155)',
                fontWeight: 850,
                borderRadius: '9px'
              }}
            >
              {item.label}
              <span style={{
                marginLeft: '0.25rem',
                minWidth: '20px',
                height: '20px',
                borderRadius: '999px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 5px',
                background: active ? '#fed7aa' : 'var(--bg-subtle, #f1f5f9)',
                fontSize: '0.65rem'
              }}>
                {item.count}
              </span>
            </button>
          );
        })}
      </div>

      {error && (
        <div style={{
          marginBottom: '1rem',
          padding: '0.8rem 0.9rem',
          borderRadius: '11px',
          border: '1px solid #fecaca',
          background: '#fef2f2',
          color: '#b91c1c',
          fontSize: '0.8rem',
          fontWeight: 700
        }}>
          {error}
        </div>
      )}

      {isLoading ? (
        <div style={{
          padding: '3rem 1rem',
          textAlign: 'center',
          color: 'var(--text-muted, #64748b)',
          border: '1px solid var(--border-color, #e2e8f0)',
          borderRadius: '14px',
          background: 'var(--bg-card, #ffffff)'
        }}>
          Loading customer reviews…
        </div>
      ) : filteredReviews.length === 0 ? (
        <div style={{
          padding: '3rem 1rem',
          textAlign: 'center',
          border: '1px dashed var(--border-color, #cbd5e1)',
          borderRadius: '14px',
          background: 'var(--bg-card, #ffffff)'
        }}>
          <div style={{
            width: '46px',
            height: '46px',
            margin: '0 auto 0.7rem',
            borderRadius: '14px',
            background: '#f8fafc',
            color: '#64748b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Star size={22} />
          </div>
          <div style={{ fontWeight: 900, color: 'var(--text-main, #0f172a)' }}>
            No reviews in this section
          </div>
          <div style={{ marginTop: '0.25rem', fontSize: '0.78rem', color: 'var(--text-muted, #64748b)' }}>
            New customer feedback will appear here after an approved delivery.
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '0.8rem' }}>
          {filteredReviews.map((review) => {
            const status = review.moderation_status || 'pending';
            const meta = STATUS_META[status] || STATUS_META.pending;
            const isUpdating = updatingId === review.id;

            return (
              <article
                key={review.id}
                style={{
                  background: 'var(--bg-card, #ffffff)',
                  border: '1px solid var(--border-color, #e2e8f0)',
                  borderRadius: '15px',
                  padding: '1rem',
                  boxShadow: 'var(--shadow-sm, 0 1px 2px rgba(15,23,42,0.06))'
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: '0.8rem',
                  flexWrap: 'wrap'
                }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', flexWrap: 'wrap' }}>
                      <strong style={{ color: 'var(--text-main, #0f172a)', fontSize: '0.92rem' }}>
                        {review.display_name || review.customer_name || 'Verified Customer'}
                      </strong>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem',
                        padding: '0.22rem 0.5rem',
                        borderRadius: '999px',
                        border: `1px solid ${meta.border}`,
                        background: meta.background,
                        color: meta.color,
                        fontSize: '0.67rem',
                        fontWeight: 900
                      }}>
                        {status === 'pending' ? <Clock3 size={11} /> : status === 'published' ? <Eye size={11} /> : <EyeOff size={11} />}
                        {meta.label}
                      </span>
                    </div>

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.6rem',
                      flexWrap: 'wrap',
                      marginTop: '0.35rem',
                      color: 'var(--text-muted, #64748b)',
                      fontSize: '0.72rem'
                    }}>
                      <StarRating rating={review.rating} />
                      <span>Order #{String(review.order_id || '').replace(/^#+/, '')}</span>
                      <span>{review.service_category || 'Service'}</span>
                      <span>{formatDate(review.submitted_at)}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
                    {status !== 'published' && (
                      <button
                        type="button"
                        onClick={() => moderateReview(review.id, 'publish')}
                        disabled={isUpdating}
                        className="btn btn-sm"
                        style={{
                          background: '#059669',
                          color: '#ffffff',
                          border: 'none',
                          fontWeight: 850,
                          gap: '0.3rem'
                        }}
                      >
                        <Eye size={13} />
                        Publish to website
                      </button>
                    )}

                    {status !== 'hidden' && (
                      <button
                        type="button"
                        onClick={() => moderateReview(review.id, 'hide')}
                        disabled={isUpdating}
                        className="btn btn-outline btn-sm"
                        style={{ fontWeight: 800, gap: '0.3rem' }}
                      >
                        <EyeOff size={13} />
                        {status === 'published' ? 'Unpublish' : 'Keep private'}
                      </button>
                    )}
                  </div>
                </div>

                <div style={{
                  marginTop: '0.9rem',
                  padding: '0.85rem 0.9rem',
                  borderRadius: '11px',
                  background: 'var(--bg-subtle, #f8fafc)',
                  border: '1px solid var(--border-color, #e2e8f0)',
                  color: 'var(--text-main, #334155)',
                  fontSize: '0.84rem',
                  lineHeight: 1.55,
                  whiteSpace: 'pre-wrap',
                  overflowWrap: 'anywhere'
                }}>
                  “{review.review_text}”
                </div>

                {(review.order_title || review.customer_email) && (
                  <div style={{
                    marginTop: '0.7rem',
                    display: 'flex',
                    gap: '0.75rem',
                    flexWrap: 'wrap',
                    color: 'var(--text-muted, #64748b)',
                    fontSize: '0.7rem'
                  }}>
                    {review.order_title && <span><strong>Order:</strong> {review.order_title}</span>}
                    {review.customer_email && <span><strong>Account:</strong> {review.customer_email}</span>}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default CustomerReviewsManager;
