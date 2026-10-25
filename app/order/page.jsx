import React from 'react';
import { StreamlinedOrderFlow } from '../../src/components/customer/StreamlinedOrderFlow';
import {
  ShieldCheck,
  Zap,
  CheckCircle2,
  FileCheck
} from 'lucide-react';

export default async function OrderPage({ searchParams }) {
  const params = await searchParams;
  const rawService = params?.service || params?.type || null;
  const service = rawService
    ? (rawService === 'vector-art' ? 'vector' : (rawService === 'patches' ? 'patch' : rawService))
    : null;

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-main, #f8fafc)',
      padding: 'clamp(1rem, 2vw, 2rem) clamp(0.75rem, 2vw, 1.5rem) 4rem',
      color: 'var(--color-text-primary, #0f172a)'
    }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>

        {/* COMPACT CLEAN HEADER */}
        <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
          <h1 style={{
            fontSize: 'clamp(1.4rem, 2.5vw, 1.9rem)',
            fontFamily: 'var(--font-heading)',
            fontWeight: 900,
            lineHeight: 1.2,
            margin: '0 0 0.35rem',
            color: 'var(--color-text-primary, #0f172a)'
          }}>
            Embroidery, Vector Art & <span style={{ color: 'var(--color-primary)' }}>Custom Patches</span>
          </h1>

          <p style={{
            fontSize: '0.88rem',
            color: 'var(--color-text-muted, #64748b)',
            maxWidth: '560px',
            margin: '0 auto 0.75rem',
            lineHeight: 1.45
          }}>
            Choose a service and package, upload artwork, and review the exact quote before checkout. Production times vary by package.
          </p>

          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.85rem',
            fontSize: '0.74rem',
            fontWeight: 700,
            color: 'var(--color-text-secondary, #475569)'
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Zap size={13} style={{ color: 'var(--color-primary)' }} /> Package-Based Turnaround
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <CheckCircle2 size={13} style={{ color: '#059669' }} /> 100% Hand Pathing
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <ShieldCheck size={13} style={{ color: '#0284c7' }} /> Free Revisions
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <FileCheck size={13} style={{ color: '#7c3aed' }} /> Tajima .DST, Wilcom .EMB, Brother .PES
            </span>
          </div>
        </div>

        {/* EMBEDDED STREAMLINED ORDER FLOW */}
        <StreamlinedOrderFlow initialService={service} />

      </div>
    </div>
  );
}
