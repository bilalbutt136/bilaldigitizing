'use client';

import React from 'react';
import { useNavigate } from '../../utils/navigation';
import { useAppState } from '../../context/StateContext';
import { Upload, ArrowRight, Shield, Globe, Zap, CheckCircle2 as _CheckCircle2, Sparkles, Lock } from 'lucide-react';

export const FinalCTA = () => {
  const navigate = useNavigate();
  const { activeHomeServiceTab, openOrderWizard, protectedNavigate, homePageConfig = {} } = useAppState();

  const dbSettings = homePageConfig?.settings || {};

  const handleCtaClick = () => {
    if (openOrderWizard) {
      const currentKey = activeHomeServiceTab === 'patches' ? 'patch' : (activeHomeServiceTab === 'vector' ? 'vector' : (activeHomeServiceTab === 'embroidery' ? 'embroidery' : 'all'));
      openOrderWizard({ type: currentKey });
    } else {
      protectedNavigate('customer', true);
    }
  };

  const getDynamicContent = () => {
    if (activeHomeServiceTab === 'vector') {
      return {
        title: dbSettings.cta_vector_title || 'Transform Your Designs Into Resolution-Independent Vector Art',
        desc: dbSettings.cta_vector_desc || 'Precision node tracing and Pantone spot color separation. Get clean, scalable vector files ready for high-quality printing.',
        btnText: dbSettings.cta_vector_btn || 'Start Vector Conversion'
      };
    }
    return {
      title: dbSettings.cta_title || dbSettings.cta_all_title || 'Ready to Elevate Your Embroidery & Custom Patches?',
      desc: dbSettings.cta_desc || dbSettings.cta_all_desc || 'Upload your artwork for fast digitizing, vector art conversions, or custom physical patches with zero thread breaks and free revisions.',
      btnText: dbSettings.cta_btn || dbSettings.cta_all_btn || 'Upload Artwork & Start Order'
    };
  };

  const content = getDynamicContent();
  const ctaBadge = dbSettings.cta_badge || 'READY TO GET STARTED?';
  const ctaSecondaryBtn = dbSettings.cta_secondary_btn || 'View Pricing & Packages';
  const badge1 = dbSettings.cta_trust_badge_1 || 'Secure Payments';
  const badge2 = dbSettings.cta_trust_badge_2 || 'Worldwide Delivery';
  const badge3 = dbSettings.cta_trust_badge_3 || 'Fast Turnaround';
  const badge4 = dbSettings.cta_trust_badge_4 || 'Free Minor Revisions';

  return (
    <section className="theme-final-cta-section" style={{
      width: '100%',
      backgroundColor: 'var(--cta-bg)',
      position: 'relative',
      padding: '6rem 0',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      {/* Background Radial Glow */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '800px',
        height: '800px',
        background: 'radial-gradient(circle, rgba(37, 99, 235, 0.12) 0%, rgba(15, 23, 42, 0) 70%)',
        pointerEvents: 'none',
        zIndex: 0,
      }} />

      <div className="container" style={{
        position: 'relative',
        zIndex: 1,
        maxWidth: '840px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
      }}>
        <div className="badge-pill-glow" style={{ marginBottom: '1.5rem' }}>
          <Sparkles size={15} style={{ color: '#2563eb' }} />
          <span>{ctaBadge}</span>
        </div>

        <h2 style={{
          color: 'var(--cta-title)',
          fontFamily: 'var(--font-heading)',
          fontSize: 'clamp(2.1rem, 4vw, 3.25rem)',
          fontWeight: '900',
          lineHeight: '1.15',
          marginBottom: '1.25rem',
          letterSpacing: '-0.025em'
        }}>
          {content.title}
        </h2>

        <p style={{
          color: 'var(--cta-desc)',
          fontSize: '1.125rem',
          lineHeight: '1.65',
          marginBottom: '2.5rem',
          maxWidth: '680px',
        }}>
          {content.desc}
        </p>

        <div className="hero-cta-buttons-row" style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1rem',
          justifyContent: 'center',
          marginBottom: '3.5rem',
          width: '100%'
        }}>
          <button
            type="button"
            className="btn btn-lg"
            onClick={handleCtaClick}
            style={{
              background: '#2563eb',
              borderColor: '#2563eb',
              color: '#ffffff',
              padding: '0.95rem 2.25rem',
              fontSize: '1.05rem',
              fontWeight: 800,
              borderRadius: '12px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)'
            }}
          >
            <Upload size={18} />
            {content.btnText}
          </button>

          <button
            type="button"
            className="btn btn-outline btn-lg"
            onClick={() => navigate('/pricing')}
            style={{
              color: '#2563eb',
              background: 'rgba(37, 99, 235, 0.08)',
              borderColor: 'rgba(37, 99, 235, 0.25)',
              padding: '0.95rem 2rem',
              fontSize: '1.05rem',
              fontWeight: 700,
              borderRadius: '12px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            {ctaSecondaryBtn}
            <ArrowRight size={18} />
          </button>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 150px), 1fr))',
          justifyItems: 'center',
          gap: '1rem',
          borderTop: '1px solid var(--border-color)',
          paddingTop: '2.25rem',
          width: '100%',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--cta-desc)', fontSize: '0.85rem', fontWeight: '600' }}>
            <Shield size={18} style={{ color: '#2563eb', flexShrink: 0 }} />
            <span>{badge1}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--cta-desc)', fontSize: '0.85rem', fontWeight: '600' }}>
            <Globe size={18} style={{ color: '#2563eb', flexShrink: 0 }} />
            <span>{badge2}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--cta-desc)', fontSize: '0.85rem', fontWeight: '600' }}>
            <Lock size={18} style={{ color: '#2563eb', flexShrink: 0 }} />
            <span>{badge3}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--cta-desc)', fontSize: '0.85rem', fontWeight: '600' }}>
            <Zap size={18} style={{ color: '#2563eb', flexShrink: 0 }} />
            <span>{badge4}</span>
          </div>
        </div>
      </div>
    </section>
  );
};
