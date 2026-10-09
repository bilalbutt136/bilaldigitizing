'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { StreamlinedOrderFlow } from '../../src/components/customer/StreamlinedOrderFlow';
import {
  ShieldCheck,
  Zap,
  CheckCircle2,
  HelpCircle,
  MessageCircle,
  FileCheck
} from 'lucide-react';

function OrderContent() {
  const searchParams = useSearchParams();
  const rawService = searchParams.get('service') || searchParams.get('type') || null;
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
            Commercial Embroidery Digitizing & <span style={{ color: '#ea580c' }}>Custom Patches</span>
          </h1>

          <p style={{
            fontSize: '0.88rem',
            color: 'var(--color-text-muted, #64748b)',
            maxWidth: '560px',
            margin: '0 auto 0.75rem',
            lineHeight: 1.45
          }}>
            Upload design, select options, and get production stitch files in 4–12 hours.
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
              <Zap size={13} style={{ color: '#ea580c' }} /> 4–12h Delivery
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

        {/* ORDER FAQS & CONFIDENCE ACCORDION */}
        <div style={{
          marginTop: '3.5rem',
          background: 'var(--color-surface, #ffffff)',
          border: '1.5px solid var(--color-border, #e2e8f0)',
          borderRadius: '20px',
          padding: '2rem clamp(1.25rem, 3vw, 2.5rem)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.5rem' }}>
            <HelpCircle size={22} style={{ color: '#ea580c' }} />
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: 'var(--color-text-primary, #0f172a)' }}>
              Frequently Asked Questions
            </h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', fontSize: '0.88rem' }}>
            <div>
              <h4 style={{ margin: '0 0 0.35rem', fontWeight: 800, color: 'var(--color-text-primary, #0f172a)' }}>
                What machine file formats will I receive?
              </h4>
              <p style={{ margin: 0, color: 'var(--color-text-muted, #64748b)', lineHeight: 1.55 }}>
                We deliver Tajima (.DST), Wilcom (.EMB), Brother (.PES), Barudan (.DAT), Melco (.EXP), Janome (.JEF), plus PDF stitch run-sheets with dimensions, stitch count, and thread sequence.
              </p>
            </div>

            <div>
              <h4 style={{ margin: '0 0 0.35rem', fontWeight: 800, color: 'var(--color-text-primary, #0f172a)' }}>
                What if the file doesn't stitch out properly?
              </h4>
              <p style={{ margin: 0, color: 'var(--color-text-muted, #64748b)', lineHeight: 1.55 }}>
                All orders include free unlimited revisions! If you experience thread breaks or need sizing adjustments for your specific fabric or machine, we adjust and re-deliver at zero extra charge.
              </p>
            </div>

            <div>
              <h4 style={{ margin: '0 0 0.35rem', fontWeight: 800, color: 'var(--color-text-primary, #0f172a)' }}>
                How does Custom Patch manufacturing work?
              </h4>
              <p style={{ margin: 0, color: 'var(--color-text-muted, #64748b)', lineHeight: 1.55 }}>
                Our minimum order is 50 pieces. We provide a 100% free digital proof within 12 hours. Once approved, we manufacture your physical patches with Velcro, Iron-On, or Sew-On backing and ship directly to your door.
              </p>
            </div>

            <div>
              <h4 style={{ margin: '0 0 0.35rem', fontWeight: 800, color: 'var(--color-text-primary, #0f172a)' }}>
                Do I need to create an account before ordering?
              </h4>
              <p style={{ margin: 0, color: 'var(--color-text-muted, #64748b)', lineHeight: 1.55 }}>
                No! You can order seamlessly as a guest. All machine files, status updates, and digital proofs will be emailed directly to you, and you can track your order anytime on the site.
              </p>
            </div>
          </div>

          {/* NEED HELP STRIP */}
          <div style={{
            marginTop: '2rem',
            paddingTop: '1.25rem',
            borderTop: '1px solid var(--color-border, #e2e8f0)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
            fontSize: '0.84rem'
          }}>
            <span style={{ color: 'var(--color-text-muted, #64748b)' }}>
              Need urgent help or have a custom project inquiry?
            </span>
            <a
              href="https://wa.me/923287661555?text=Hello%20BDigitizing,%20I%20have%20a%20question%20about%20placing%20an%20embroidery%20order"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                color: '#059669',
                fontWeight: 800,
                textDecoration: 'none'
              }}
            >
              <MessageCircle size={16} /> Chat with a Master Digitizer on WhatsApp →
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}

export default function OrderPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '36px', height: '36px', border: '3px solid rgba(234, 88, 12, 0.2)', borderTopColor: '#ea580c', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    }>
      <OrderContent />
    </Suspense>
  );
}
