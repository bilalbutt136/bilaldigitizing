'use client';

import React from 'react';
import { ArrowUpRight, Crown } from 'lucide-react';
import { DEFAULT_MOBILE_OFFER_BANNER, getActiveMobileOffer } from '../../utils/mobileOffer';
import { useLivePromotion } from '../../hooks/useLivePromotion';

// The same compact VIP strip is used on mobile web and in the mobile app.
// Never show a percentage unless there is a real, active admin promotion.
export default function MobileWelcomeOffer({ siteSettings, isDark, onExplore, href }) {
  const live = useLivePromotion();
  const currentSettings = live.error ? siteSettings : live.settings;
  const offer = getActiveMobileOffer(currentSettings);
  if (!offer) return null;

  const config = { ...DEFAULT_MOBILE_OFFER_BANNER, ...(currentSettings?.mobileOfferBanner || {}) };
  const ClaimElement = href ? 'a' : 'button';
  const description = /\d+(?:\.\d+)?%/.test(config.description) && !config.description.includes(`${offer.percent}%`)
    ? `Up to ${offer.percent}% off eligible studio services.`
    : config.description;

  return (
    <>
    <section
      aria-label="Current VIP studio offer"
      className="bdigi-vip-mobile-offer"
      style={{
        boxSizing: 'border-box',
        width: '100%',
        marginTop: href ? '0.8rem' : 0,
        borderRadius: '13px',
        padding: '0.68rem 0.75rem',
        background: 'linear-gradient(112deg, #111b31 0%, #223054 62%, #0c5147 100%)',
        border: '1px solid rgba(214,181,107,0.4)',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '0.6rem',
        boxShadow: isDark ? 'none' : '0 5px 14px rgba(15,23,42,0.12)',
        overflow: 'hidden'
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.3rem',
          color: '#f5d992', fontSize: '0.62rem', fontWeight: 900,
          letterSpacing: '0.09em', textTransform: 'uppercase', lineHeight: 1.2
        }}>
          <Crown size={13} aria-hidden="true" style={{ flexShrink: 0 }} />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{config.eyebrow}</span>
        </div>
        <h2 style={{
          margin: '0.35rem 0 0', fontSize: 'clamp(0.86rem, 3.6vw, 1.02rem)',
          fontWeight: 900, lineHeight: 1.2,
          letterSpacing: '-0.015em',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          {config.headline}
        </h2>
        <p style={{
          margin: '0.24rem 0 0', fontSize: '0.67rem',
          lineHeight: 1.25, color: '#cbd5e1',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
        }}>
          {description}
        </p>
      </div>
      <ClaimElement
        {...(href ? { href } : { type: 'button', onClick: onExplore })}
        aria-label={`Claim VIP offer: up to ${offer.percent}% off eligible studio services`}
        style={{
          flex: '0 0 auto',
          width: '105px',
          minHeight: '61px',
          padding: '0.34rem 0.3rem',
          background: 'linear-gradient(155deg, #fff7df 0%, #f4d88e 100%)',
          color: '#182439',
          border: '1px solid #e5c370',
          borderRadius: '10px',
          cursor: 'pointer',
          textDecoration: 'none',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.12rem',
          boxShadow: '0 2px 9px rgba(0,0,0,0.16)'
        }}
      >
        <span style={{ fontSize: '0.58rem', fontWeight: 850, letterSpacing: '0.07em', lineHeight: 1 }}>
          UP TO
        </span>
        <span style={{ fontSize: '1.28rem', lineHeight: 1, fontWeight: 950, letterSpacing: '-0.035em', whiteSpace: 'nowrap' }}>
          {offer.percent}% OFF
        </span>
        <span style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: '0.15rem', fontWeight: 900, fontSize: '0.63rem',
          maxWidth: '100%', whiteSpace: 'nowrap', overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{config.ctaText}</span>
          <ArrowUpRight size={12} style={{ flexShrink: 0 }} />
        </span>
      </ClaimElement>
    </section>
    {href && (
      <section className="bdigi-vip-desktop-offer" aria-label="Current VIP studio offer">
        <div className="bdigi-vip-desktop-identity">
          <Crown size={15} aria-hidden="true" />
          <span>{config.eyebrow}</span>
        </div>
        <div className="bdigi-vip-desktop-details">
          <strong className="bdigi-vip-desktop-title">{config.headline}</strong>
          <span className="bdigi-vip-desktop-description">{description}</span>
        </div>
        <span className="bdigi-vip-desktop-discount" aria-label={`Up to ${offer.percent} percent off`}>
          <span>UP TO</span>
          <strong>{offer.percent}% OFF</strong>
        </span>
        <a className="bdigi-vip-desktop-claim" href={href} aria-label={`Claim VIP offer: up to ${offer.percent}% off eligible services`}>
          {config.ctaText}
          <ArrowUpRight size={15} aria-hidden="true" />
        </a>
      </section>
    )}
    </>
  );
}
