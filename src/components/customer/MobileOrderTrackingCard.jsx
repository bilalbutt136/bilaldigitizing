'use client';

import React from 'react';
import {
  CheckCircle2,
  ChevronRight,
  CreditCard,
  Download,
  MoreVertical,
  PackageCheck
} from 'lucide-react';
import { formatOrderId } from '../../utils/formatters';
import { getMobileOrderTrackingState } from '../../utils/orderTracking';

const TONES = {
  payment: { bg: '#fff7ed', soft: '#ffedd5', text: '#c2410c', fill: '#ea580c' },
  warning: { bg: '#fffbeb', soft: '#fef3c7', text: '#a16207', fill: '#d97706' },
  success: { bg: '#f0fdf4', soft: '#dcfce7', text: '#047857', fill: '#10b981' },
  info: { bg: '#eff6ff', soft: '#dbeafe', text: '#1d4ed8', fill: '#2563eb' },
  danger: { bg: '#fef2f2', soft: '#fee2e2', text: '#b91c1c', fill: '#ef4444' },
  neutral: { bg: '#f8fafc', soft: '#e2e8f0', text: '#475569', fill: '#64748b' }
};

const STEPS = [
  { id: 1, label: 'Received' },
  { id: 2, label: 'Production' },
  { id: 3, label: 'QC' },
  { id: 4, label: 'Ready' }
];

function resolveService(order) {
  const explicit = order?.serviceCategory || order?.service_category;
  if (explicit) return explicit;

  const type = String(order?.type || '').toLowerCase();
  if (type.includes('vector')) return 'Vector Art';
  if (type.includes('patch')) return 'Custom Patches';
  return 'Embroidery Digitizing';
}

function MobileOrderTrackingCard({
  order,
  isDark = false,
  onOpen,
  onPay,
  onMore
}) {
  const tracking = getMobileOrderTrackingState(order);
  const tone = TONES[tracking.tone] || TONES.neutral;
  const title = order?.title || order?.orderTitle || 'Studio Order';
  const price = Number(order?.totalPrice ?? order?.price ?? order?.cost ?? 0);
  const service = resolveService(order);
  const updatedAt = order?.updated_at || order?.delivered_at || order?.created_at || order?.createdAt;
  const updatedLabel = updatedAt
    ? new Date(updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : 'Recent';

  const cardStyle = {
    '--order-accent': tone.fill,
    '--order-accent-soft': isDark ? 'rgba(255,255,255,0.05)' : tone.bg,
    '--order-accent-muted': isDark ? 'rgba(255,255,255,0.08)' : tone.soft,
    '--order-accent-text': isDark ? tone.fill : tone.text
  };

  return (
    <article
      className={'mobile-order-tracking-card' + (isDark ? ' is-dark' : '')}
      style={cardStyle}
    >
      <div className="mobile-order-card-topline">
        <div className="mobile-order-card-meta">
          <span className="mobile-order-id">{formatOrderId(order?.id)}</span>
          <span className="mobile-order-service">{service}</span>
        </div>

        <div className="mobile-order-card-price-block">
          <strong>{'$' + (Number.isFinite(price) ? price.toFixed(2) : '0.00')}</strong>
          <span>Updated {updatedLabel}</span>
        </div>
      </div>

      <div className="mobile-order-card-title-row">
        <h3>{title}</h3>
        {onMore ? (
          <button
            type="button"
            className="mobile-order-card-more"
            aria-label="More order actions"
            onClick={(event) => {
              event.stopPropagation();
              onMore(order);
            }}
          >
            <MoreVertical size={18} />
          </button>
        ) : null}
      </div>

      <section className="mobile-order-status-panel" aria-label={'Order status: ' + tracking.label}>
        <div className="mobile-order-status-heading">
          <div>
            <span className="mobile-order-status-label">{tracking.label}</span>
            <p>{tracking.helper}</p>
          </div>
          <strong>{tracking.progress}%</strong>
        </div>

        <div className="mobile-order-progress-track" aria-hidden="true">
          <div
            className="mobile-order-progress-fill"
            style={{ width: Math.max(0, Math.min(100, tracking.progress)) + '%' }}
          />
        </div>

        <div className="mobile-order-steps" aria-hidden="true">
          {STEPS.map(step => {
            const complete = tracking.stage >= step.id;
            return (
              <span
                key={step.id}
                className={complete ? 'is-complete' : ''}
              >
                {complete && <CheckCircle2 size={11} />}
                {step.label}
              </span>
            );
          })}
        </div>
      </section>

      <div className="mobile-order-actions">
        {tracking.unpaid && onPay ? (
          <button
            type="button"
            className="mobile-order-primary-action is-payment"
            onClick={(event) => {
              event.stopPropagation();
              onPay(order);
            }}
          >
            <CreditCard size={16} />
            Pay order
          </button>
        ) : null}

        <button
          type="button"
          className={'mobile-order-secondary-action' + (tracking.ready ? ' is-ready' : '')}
          onClick={() => onOpen?.(order)}
        >
          {tracking.ready ? (
            <>
              {tracking.status === 'completed' ? <PackageCheck size={16} /> : <Download size={16} />}
              View files
            </>
          ) : (
            <>
              Track order
              <ChevronRight size={16} />
            </>
          )}
        </button>
      </div>
    </article>
  );
}

export default React.memo(MobileOrderTrackingCard);
