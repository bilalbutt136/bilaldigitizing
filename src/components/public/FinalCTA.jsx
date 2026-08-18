'use client';

import React from 'react';
import { useNavigate } from '../../utils/navigation';
import { useAppState } from '../../context/StateContext';
import { Upload, ArrowRight, Shield, Globe, Zap, CheckCircle2, Sparkles } from 'lucide-react';

export const FinalCTA = () => {
  const navigate = useNavigate();
  const { activeHomeServiceTab, openOrderWizard, protectedNavigate, homePageConfig = {} } = useAppState();
  
  const dbSettings = homePageConfig?.settings || {};

  const handleCtaClick = () => {
    if (openOrderWizard) {
      const currentKey = activeHomeServiceTab === 'patches' ? 'patch' : (activeHomeServiceTab || 'embroidery');
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
    } else if (activeHomeServiceTab === 'patch' || activeHomeServiceTab === 'patches') {
      return {
        title: dbSettings.cta_patch_title || 'Transform Your Designs Into Premium Custom Patches',
        desc: dbSettings.cta_patch_desc || 'High-density embroidered, woven, and PVC patches delivered to your door. Get a free digital proof and fast worldwide shipping.',
        btnText: dbSettings.cta_patch_btn || 'Order Custom Patches'
      };
    }
    return {
      title: dbSettings.cta_emb_title || 'Transform Your Designs Into Production-Ready Masterpieces',
      desc: dbSettings.cta_emb_desc || 'Precision embroidery digitizing with zero thread breaks. Get machine-ready stitch files engineered for your specific fabric and equipment.',
      btnText: dbSettings.cta_emb_btn || 'Start Digitizing Now'
    };
  };

  const content = getDynamicContent();
  const ctaBadge = dbSettings.cta_badge || 'Ready to Get Started?';
  const ctaSecondaryBtn = dbSettings.cta_secondary_btn || 'View Pricing & Packages';
  const badge1 = dbSettings.cta_trust_badge_1 || 'Secure Payments';
  const badge2 = dbSettings.cta_trust_badge_2 || 'Worldwide Delivery';
  const badge3 = dbSettings.cta_trust_badge_3 || '4-Hour Express';
  const badge4 = dbSettings.cta_trust_badge_4 || '100% Satisfaction';

  return (
    <section style={{
      width: '100%',
      backgroundColor: 'var(--navy-950, #0f172a)',
      position: 'relative',
      padding: '6rem 0',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      borderTop: '1px solid rgba(255, 255, 255, 0.08)'
    }}>
      {/* Background Radial Glow */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '800px',
        height: '800px',
        background: 'radial-gradient(circle, rgba(249, 115, 22, 0.12) 0%, rgba(15, 23, 42, 0) 70%)',
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
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.4rem',
          backgroundColor: 'rgba(249, 115, 22, 0.15)',
          border: '1px solid rgba(249, 115, 22, 0.35)',
          color: 'var(--orange-400)',
          padding: '0.35rem 0.95rem',
          borderRadius: '9999px',
          fontSize: '0.85rem',
          fontWeight: '800',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          marginBottom: '1.5rem',
        }}>
          <Sparkles size={15} /> {ctaBadge}
        </div>
        
        <h2 style={{
          color: '#ffffff',
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
          color: '#94a3b8',
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
            className="btn btn-primary-orange btn-lg"
            onClick={handleCtaClick}
            style={{
              padding: '0.95rem 2.25rem',
              fontSize: '1.05rem',
              fontWeight: 800
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
              color: '#ffffff',
              borderColor: 'rgba(255, 255, 255, 0.25)',
              padding: '0.95rem 2rem',
              fontSize: '1.05rem',
              fontWeight: 700
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
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          paddingTop: '2.25rem',
          width: '100%',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#cbd5e1', fontSize: '0.85rem', fontWeight: '600' }}>
            <Shield size={18} style={{ color: 'var(--orange-400)', flexShrink: 0 }} />
            <span>{badge1}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#cbd5e1', fontSize: '0.85rem', fontWeight: '600' }}>
            <Globe size={18} style={{ color: 'var(--orange-400)', flexShrink: 0 }} />
            <span>{badge2}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#cbd5e1', fontSize: '0.85rem', fontWeight: '600' }}>
            <Zap size={18} style={{ color: 'var(--orange-400)', flexShrink: 0 }} />
            <span>{badge3}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#cbd5e1', fontSize: '0.85rem', fontWeight: '600' }}>
            <CheckCircle2 size={18} style={{ color: '#10b981', flexShrink: 0 }} />
            <span>{badge4}</span>
          </div>
        </div>
      </div>
    </section>
  );
};

