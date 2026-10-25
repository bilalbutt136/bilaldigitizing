'use client';

import React from 'react';
import { ArrowRight, BadgePercent, CheckCircle2 } from 'lucide-react';
import { DEFAULT_MOBILE_OFFER_BANNER, getActiveMobileOffer } from '../../utils/mobileOffer';

export default function MobileWelcomeOffer({ siteSettings, isDark, isAuthenticated, onExplore, onSignup }) {
  const offer = getActiveMobileOffer(siteSettings);
  if (!offer) return null;

  const config = { ...DEFAULT_MOBILE_OFFER_BANNER, ...(siteSettings?.mobileOfferBanner || {}) };

  return (
    <section aria-label="Current studio promotion" style={{
      borderRadius: '18px', padding: '1rem', overflow: 'hidden', position: 'relative',
      background: 'linear-gradient(118deg, #0b1932 0%, #123b54 65%, #075e5a 100%)',
      color: '#ffffff', border: '1px solid rgba(52,211,153,0.25)',
      boxShadow: isDark ? 'none' : '0 10px 24px rgba(15, 35, 64, 0.12)'
    }}>
      <div aria-hidden="true" style={{
        position: 'absolute', right: '-35px', top: '-70px', width: '180px',
        height: '180px', borderRadius: '50%', background: 'rgba(110,231,183,0.08)',
        pointerEvents: 'none'
      }} />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
          fontSize: '0.66rem', fontWeight: 900, letterSpacing: '0.12em',
          color: '#a7f3d0', textTransform: 'uppercase'
        }}>
          <BadgePercent size={14} /> {config.eyebrow}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.8rem', marginTop: '0.55rem' }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <h2 style={{ fontSize: 'clamp(1.03rem, 4.5vw, 1.3rem)', fontWeight: 900, margin: 0, lineHeight: 1.25, letterSpacing: '-0.025em' }}>
              {config.headline}
            </h2>
            <p style={{ color: '#cbd5e1', fontSize: '0.77rem', lineHeight: 1.45, margin: '0.4rem 0 0' }}>
              {config.description}
            </p>
          </div>
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            background: '#ecfdf5', color: '#065f46',
            padding: '0.58rem 0.65rem', borderRadius: '13px', minWidth: '82px',
            flexShrink: 0
          }}>
            <span style={{ fontSize: '0.62rem', fontWeight: 900, letterSpacing: '0.05em' }}>UP TO</span>
            <span style={{ fontSize: '1.62rem', fontWeight: 950, lineHeight: 1.15 }}>{offer.percent}%</span>
            <span style={{ fontSize: '0.62rem', fontWeight: 900, letterSpacing: '0.05em' }}>OFF</span>
          </div>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.45rem',
          color: '#d1fae5', fontSize: '0.7rem', marginTop: '0.7rem', fontWeight: 650
        }}>
          <CheckCircle2 size={13} /> Available on eligible studio services
        </div>
        <button type="button" onClick={onExplore} style={{
          width: '100%', minHeight: '44px', marginTop: '0.78rem',
          border: 'none', borderRadius: '11px', cursor: 'pointer',
          background: '#ffffff', color: '#0f2740', fontWeight: 900, fontSize: '0.83rem',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem'
        }}>
          {config.ctaText} <ArrowRight size={16} />
        </button>
        {!isAuthenticated && (
          <button type="button" onClick={onSignup} style={{
            width: '100%', marginTop: '0.52rem', background: 'transparent',
            border: 'none', color: '#d1fae5', padding: '0.25rem',
            fontSize: '0.75rem', fontWeight: 750, cursor: 'pointer'
          }}>
            New to BDigitizing? Create an account
          </button>
        )}
      </div>
    </section>
  );
}
