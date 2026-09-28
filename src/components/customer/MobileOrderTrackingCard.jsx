'use client';

import React from 'react';
import {
  CheckCircle2,
  ChevronRight,
  Circle,
  CreditCard,
  Download,
  MoreVertical,
  PackageCheck,
  RefreshCw
} from 'lucide-react';
import { formatOrderId } from '../../utils/formatters';

import { getMobileOrderTrackingState } from '../../utils/orderTracking';

const TONES = {
  payment: { bg: '#fff7ed', border: '#fdba74', text: '#c2410c', fill: '#ea580c' },
  warning: { bg: '#fffbeb', border: '#fde68a', text: '#b45309', fill: '#f59e0b' },
  success: { bg: '#ecfdf5', border: '#86efac', text: '#047857', fill: '#10b981' },
  info: { bg: '#eff6ff', border: '#bfdbfe', text: '#1d4ed8', fill: '#2563eb' },
  danger: { bg: '#fef2f2', border: '#fecaca', text: '#b91c1c', fill: '#ef4444' },
  neutral: { bg: '#f8fafc', border: '#e2e8f0', text: '#475569', fill: '#64748b' }
};

const STEPS = [
  { id: 1, label: 'Received' },
  { id: 2, label: 'Production' },
  { id: 3, label: 'QC' },
  { id: 4, label: 'Ready' }
];

export default function MobileOrderTrackingCard({
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
  const service = order?.serviceCategory || order?.service_category || (
    String(order?.type || '').toLowerCase().includes('vector')
      ? 'Vector Art'
      : String(order?.type || '').toLowerCase().includes('patch')
        ? 'Custom Patches'
        : 'Embroidery Digitizing'
  );
  const updatedAt = order?.updated_at || order?.delivered_at || order?.created_at || order?.createdAt;
  const updatedLabel = updatedAt
    ? new Date(updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : 'Recent';

  const surface = isDark ? 'var(--color-surface, #111827)' : '#ffffff';
  const border = isDark ? 'var(--color-border, #334155)' : '#e2e8f0';
  const text = isDark ? 'var(--color-text-primary, #f8fafc)' : '#0f172a';
  const muted = isDark ? 'var(--color-text-secondary, #94a3b8)' : '#64748b';
  const trackBg = isDark ? '#1e293b' : '#e2e8f0';

  return (
    <article
      className="mobile-order-tracking-card"
      style={{
        width: '100%',
        minWidth: 0,
        boxSizing: 'border-box',
        background: surface,
        border: `1px solid ${tracking.tone === 'neutral' ? border : tone.border}`,
        borderRadius: '16px',
        padding: '0.9rem',
        boxShadow: isDark ? '0 4px 16px rgba(0,0,0,0.18)' : '0 4px 16px rgba(15,23,42,0.06)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.72rem',
        overflow: 'hidden'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.65rem', minWidth: 0 }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
            <span style={{
              fontSize: '0.66rem',
              fontWeight: 900,
              color: '#ea580c',
              background: isDark ? 'rgba(234,88,12,0.14)' : '#fff7ed',
              padding: '0.12rem 0.42rem',
              borderRadius: '6px'
            }}>
              {formatOrderId(order?.id)}
            </span>
            <span style={{ fontSize: '0.68rem', fontWeight: 700, color: muted }}>
              {service}
            </span>
          </div>
          <h3 style={{
            margin: '0.28rem 0 0',
            fontSize: '0.95rem',
            lineHeight: 1.25,
            fontWeight: 900,
            color: text,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {title}
          </h3>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.25rem', flexShrink: 0 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.95rem', fontWeight: 900, color: text }}>
              ${Number.isFinite(price) ? price.toFixed(2) : '0.00'}
            </div>
            <div style={{ fontSize: '0.61rem', color: muted, marginTop: '0.08rem' }}>
              Updated {updatedLabel}
            </div>
          </div>
          {onMore ? (
            <button
              type="button"
              aria-label="More order actions"
              onClick={(event) => {
                event.stopPropagation();
                onMore(order);
              }}
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '8px',
                border: 'none',
                background: 'transparent',
                color: muted,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                padding: 0
              }}
            >
              <MoreVertical size={17} />
            </button>
          ) : null}
        </div>
      </div>

      <div
        style={{
          background: isDark
            ? tracking.tone === 'neutral' ? 'var(--color-subtle, #1e293b)' : 'rgba(255,255,255,0.04)'
            : tone.bg,
          border: `1px solid ${isDark && tracking.tone === 'neutral' ? border : tone.border}`,
          borderRadius: '12px',
          padding: '0.65rem 0.72rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.6rem' }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 900, color: isDark ? (tracking.tone === 'neutral' ? text : tone.fill) : tone.text }}>
              {tracking.label}
            </div>
            <div style={{ fontSize: '0.66rem', color: muted, lineHeight: 1.35, marginTop: '0.08rem' }}>
              {tracking.helper}
            </div>
          </div>
          <span style={{ fontSize: '0.72rem', fontWeight: 900, color: isDark ? tone.fill : tone.text, flexShrink: 0 }}>
            {tracking.progress}%
          </span>
        </div>

        <div style={{ height: '6px', background: trackBg, borderRadius: '999px', overflow: 'hidden', marginTop: '0.55rem' }}>
          <div style={{
            width: `${tracking.progress}%`,
            height: '100%',
            borderRadius: '999px',
            background: tone.fill,
            transition: 'width 180ms ease'
          }} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '0.2rem', marginTop: '0.5rem' }}>
          {STEPS.map(step => {
            const complete = tracking.stage >= step.id;
            const current = tracking.stage === step.id && !tracking.ready;
            return (
              <div key={step.id} style={{ minWidth: 0, textAlign: 'center' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.16rem' }}>
                  {complete
                    ? <CheckCircle2 size={13} style={{ color: tone.fill }} />
                    : current
                      ? <RefreshCw size={13} style={{ color: tone.fill }} />
                      : <Circle size={12} style={{ color: isDark ? '#475569' : '#cbd5e1' }} />}
                </div>
                <div style={{
                  fontSize: '0.54rem',
                  fontWeight: complete || current ? 800 : 600,
                  color: complete || current ? (isDark ? '#e2e8f0' : '#334155') : muted,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {step.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: tracking.unpaid && onPay ? 'minmax(0, 1fr) minmax(0, 1fr)' : '1fr',
        gap: '0.5rem'
      }}>
        {tracking.unpaid && onPay ? (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onPay(order);
            }}
            style={{
              minHeight: '42px',
              border: 'none',
              borderRadius: '10px',
              background: '#ea580c',
              color: '#ffffff',
              fontSize: '0.75rem',
              fontWeight: 900,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.32rem',
              cursor: 'pointer'
            }}
          >
            <CreditCard size={15} /> Pay now
          </button>
        ) : null}

        <button
          type="button"
          onClick={() => onOpen?.(order)}
          style={{
            minHeight: '42px',
            borderRadius: '10px',
            border: `1px solid ${tracking.ready ? '#86efac' : border}`,
            background: tracking.ready
              ? (isDark ? 'rgba(16,185,129,0.12)' : '#ecfdf5')
              : (isDark ? 'var(--color-subtle, #1e293b)' : '#f8fafc'),
            color: tracking.ready ? (isDark ? '#34d399' : '#047857') : text,
            fontSize: '0.75rem',
            fontWeight: 900,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.32rem',
            cursor: 'pointer'
          }}
        >
          {tracking.ready ? (
            <>
              {tracking.status === 'completed' ? <PackageCheck size={15} /> : <Download size={15} />}
              Files & details
            </>
          ) : (
            <>
              Open tracker <ChevronRight size={15} />
            </>
          )}
        </button>
      </div>
    </article>
  );
}
