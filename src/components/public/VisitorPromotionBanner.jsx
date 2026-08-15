'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, Tag, ArrowRight, X, Gift, Check } from 'lucide-react';
import { useAppState } from '../../context/StateContext';

export const VisitorPromotionBanner = () => {
  const { siteSettings, openOrderWizard, protectedNavigate, isAuthenticated } = useAppState();
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(true);
  const [copied, setCopied] = useState(false);

  const banner = siteSettings?.promotionalBanner;

  useEffect(() => {
    if (banner?.title && banner?.enabled) {
      const dismissKey = 'visitor_promo_dismissed_' + encodeURIComponent(banner.title);
      const dismissed = sessionStorage.getItem(dismissKey);
      if (dismissed !== 'true') {
        const timer = setTimeout(() => {
          setIsDismissed(false);
          setIsVisible(true);
        }, 1500);
        return () => clearTimeout(timer);
      }
    }
  }, [banner?.enabled, banner?.title]);

  if (isDismissed || !isVisible || !banner?.enabled || !banner?.title) {
    return null;
  }

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(() => setIsDismissed(true), 300);
    if (banner?.title) {
      const dismissKey = 'visitor_promo_dismissed_' + encodeURIComponent(banner.title);
      sessionStorage.setItem(dismissKey, 'true');
    }
  };

  const handleClaim = () => {
    const promoCode = banner.promoCode || 'WELCOME20';
    if (openOrderWizard) {
      openOrderWizard({ promoCode });
    } else {
      protectedNavigate('customer', true, { promoCode });
    }
    handleDismiss();
  };

  const handleCopyCode = (e) => {
    e.stopPropagation();
    if (!banner.promoCode) return;
    try {
      navigator.clipboard.writeText(banner.promoCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 1000,
        maxWidth: '360px',
        width: 'calc(100% - 48px)',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
        border: '1.5px solid rgba(249, 115, 22, 0.4)',
        borderRadius: '18px',
        padding: '1.25rem',
        boxShadow: '0 20px 45px rgba(0, 0, 0, 0.45)',
        color: '#ffffff',
        animation: 'slideUpBounce 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        backdropFilter: 'blur(12px)'
      }}
    >
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes slideUpBounce {
          0% { opacity: 0; transform: translateY(30px) scale(0.95); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}} />

      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.6rem' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.35rem',
          background: 'rgba(249, 115, 22, 0.2)',
          border: '1px solid rgba(249, 115, 22, 0.4)',
          color: 'var(--orange-400)',
          padding: '0.2rem 0.55rem',
          borderRadius: '9999px',
          fontSize: '0.72rem',
          fontWeight: 900,
          textTransform: 'uppercase',
          letterSpacing: '0.04em'
        }}>
          <Gift size={12} />
          <span>Special Offer</span>
        </div>

        <button
          type="button"
          onClick={handleDismiss}
          style={{
            background: 'rgba(255,255,255,0.1)',
            border: 'none',
            borderRadius: '50%',
            width: '24px',
            height: '24px',
            color: '#94a3b8',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <X size={14} />
        </button>
      </div>

      {/* Title & Description */}
      <h4 style={{ fontSize: '1rem', fontWeight: 900, color: '#ffffff', margin: '0 0 0.35rem', lineHeight: 1.25 }}>
        {banner.title}
      </h4>

      {banner.description && (
        <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '0 0 0.85rem', lineHeight: 1.45 }}>
          {banner.description}
        </p>
      )}

      {/* Code Badge & Action Button */}
      <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
        {banner.promoCode && (
          <button
            type="button"
            onClick={handleCopyCode}
            style={{
              background: 'rgba(0,0,0,0.4)',
              border: '1px dashed rgba(255,255,255,0.4)',
              color: '#ffffff',
              padding: '0.45rem 0.65rem',
              borderRadius: '8px',
              fontSize: '0.75rem',
              fontWeight: 900,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem',
              fontFamily: 'monospace'
            }}
            title="Click to copy"
          >
            <Tag size={12} />
            <span>{banner.promoCode}</span>
            <span style={{ fontSize: '0.68rem', color: copied ? '#86efac' : 'rgba(255,255,255,0.7)', fontWeight: 800 }}>
              {copied ? '✓' : 'Copy'}
            </span>
          </button>
        )}

        <button
          type="button"
          onClick={handleClaim}
          className="btn btn-primary-orange"
          style={{
            flex: 1,
            padding: '0.5rem 0.85rem',
            fontSize: '0.8rem',
            fontWeight: 900,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.35rem',
            borderRadius: '8px'
          }}
        >
          <span>{banner.ctaText || 'Claim Offer'}</span>
          <ArrowRight size={13} />
        </button>
      </div>

    </div>
  );
};

export default VisitorPromotionBanner;
