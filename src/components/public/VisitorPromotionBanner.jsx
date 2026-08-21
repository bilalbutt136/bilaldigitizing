'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, Tag, ArrowRight, X, Gift, Check } from 'lucide-react';
import { useAppState } from '../../context/StateContext';
import { usePathname } from 'next/navigation';

export const VisitorPromotionBanner = () => {
  const { siteSettings, openOrderWizard, protectedNavigate } = useAppState();
  const pathname = usePathname() || '';
  
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [copied, setCopied] = useState(false);

  const rawBanner = siteSettings?.promotionalBanner;
  const activePromo = Array.isArray(siteSettings?.promotions) 
    ? siteSettings.promotions.find(p => p.status === 'active')
    : null;

  // Active banner data derived from active promotion or custom promotional banner
  const banner = activePromo ? {
    enabled: true,
    title: activePromo.name ? `${activePromo.name} — ${activePromo.discountPercent}% OFF` : `Special ${activePromo.discountPercent}% OFF Offer`,
    description: `Enjoy ${activePromo.discountPercent}% off your order on ${activePromo.servicesIncluded || 'All Studio Services'}. Valid until ${activePromo.endDate || 'this month'}.`,
    promoCode: activePromo.promoCode || `SAVE${activePromo.discountPercent}`,
    ctaText: 'Claim Discount',
    buttonText: 'Claim Discount',
    theme: 'navy'
  } : (rawBanner?.enabled && rawBanner?.title ? rawBanner : null);

  // Hide only when viewing admin portal / management pages
  const isAdminRoute = 
    pathname.startsWith('/admin') || 
    pathname.startsWith('/secure-admin-login') ||
    pathname.startsWith('/admin-portal');

  useEffect(() => {
    if (isAdminRoute) {
      setIsVisible(false);
      return;
    }

    if (banner?.title && banner?.enabled) {
      const dismissKey = 'visitor_promo_dismissed_' + encodeURIComponent(banner.title);
      const dismissed = typeof window !== 'undefined' ? sessionStorage.getItem(dismissKey) : null;
      if (dismissed !== 'true') {
        const timer = setTimeout(() => {
          setIsDismissed(false);
          setIsVisible(true);
        }, 800);
        return () => clearTimeout(timer);
      } else {
        setIsVisible(false);
      }
    } else {
      setIsVisible(false);
    }
  }, [banner?.enabled, banner?.title, isAdminRoute]);

  // Live Multi-tab synchronization for instant pause/start reaction
  useEffect(() => {
    const handleLiveSync = (e) => {
      const updatedSettings = e?.detail || {};
      const livePromo = Array.isArray(updatedSettings?.promotions)
        ? updatedSettings.promotions.find(p => p.status === 'active')
        : null;
      if (livePromo) {
        setIsDismissed(false);
        setIsVisible(true);
      } else if (!updatedSettings?.promotionalBanner?.enabled) {
        setIsVisible(false);
      }
    };

    window.addEventListener('bdigi_promotions_sync', handleLiveSync);
    window.addEventListener('site_settings_updated', handleLiveSync);

    let promoBc;
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        promoBc = new BroadcastChannel('bdigi_promotions_sync');
        promoBc.onmessage = (ev) => {
          if (ev.data) {
            const livePromo = Array.isArray(ev.data.promotions)
              ? ev.data.promotions.find(p => p.status === 'active')
              : null;
            if (livePromo) {
              setIsDismissed(false);
              setIsVisible(true);
            } else if (!ev.data.promotionalBanner?.enabled) {
              setIsVisible(false);
            }
          }
        };
      } catch {}
    }

    return () => {
      window.removeEventListener('bdigi_promotions_sync', handleLiveSync);
      window.removeEventListener('site_settings_updated', handleLiveSync);
      if (promoBc) {
        try { promoBc.close(); } catch {}
      }
    };
  }, []);

  if (isAdminRoute || isDismissed || !isVisible || !banner?.enabled || !banner?.title) {
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
      openOrderWizard({ promoCode, type: 'all' });
    } else {
      protectedNavigate('customer', true, { promoCode, type: 'all' });
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

  const bannerDescription = banner.message || banner.description || '';
  const buttonLabel = banner.buttonText || banner.ctaText || 'Claim Offer';

  return (
    <div
      className="visitor-promo-banner-container"
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 9000,
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
        @media (max-width: 640px) {
          .visitor-promo-banner-container {
            bottom: 84px !important;
            right: 16px !important;
            left: 16px !important;
            width: auto !important;
            max-width: none !important;
            padding: 1rem !important;
          }
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
          letterSpacing: '0.04em',
          textTransform: 'uppercase'
        }}>
          <Gift size={12} /> Special Welcome Offer
        </div>
        
        <button
          onClick={handleDismiss}
          style={{
            background: 'rgba(255, 255, 255, 0.08)',
            border: 'none',
            borderRadius: '50%',
            width: '24px',
            height: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#94a3b8',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
            e.currentTarget.style.color = '#ffffff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
            e.currentTarget.style.color = '#94a3b8';
          }}
          aria-label="Dismiss offer"
        >
          <X size={14} />
        </button>
      </div>

      {/* Title & Body Text */}
      <h4 style={{
        margin: '0 0 0.35rem 0',
        fontSize: '1.05rem',
        fontWeight: 900,
        color: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        gap: '0.4rem',
        lineHeight: 1.3
      }}>
        {banner.title} <Sparkles size={16} style={{ color: 'var(--orange-400)' }} />
      </h4>
      
      {bannerDescription && (
        <p style={{
          margin: '0 0 0.85rem 0',
          fontSize: '0.82rem',
          color: '#cbd5e1',
          lineHeight: 1.45
        }}>
          {bannerDescription}
        </p>
      )}

      {/* Promo Code & Action Box */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        marginTop: '0.65rem'
      }}>
        {banner.promoCode && (
          <button
            onClick={handleCopyCode}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              background: copied ? '#059669' : 'rgba(255, 255, 255, 0.1)',
              border: `1.5px dashed ${copied ? '#34d399' : 'rgba(249, 115, 22, 0.6)'}`,
              borderRadius: '10px',
              padding: '0.55rem 0.75rem',
              color: '#ffffff',
              fontSize: '0.82rem',
              fontWeight: 800,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              fontFamily: 'monospace',
              letterSpacing: '0.05em'
            }}
            title="Click to copy promo code"
          >
            {copied ? (
              <>
                <Check size={14} /> COPIED!
              </>
            ) : (
              <>
                <Tag size={13} style={{ color: 'var(--orange-400)' }} /> {banner.promoCode}
              </>
            )}
          </button>
        )}

        <button
          onClick={handleClaim}
          style={{
            flex: banner.promoCode ? 1.2 : 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.35rem',
            background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
            border: 'none',
            borderRadius: '10px',
            padding: '0.6rem 0.85rem',
            color: '#ffffff',
            fontSize: '0.82rem',
            fontWeight: 900,
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(249, 115, 22, 0.4)',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}
        >
          {buttonLabel} <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
};

export default VisitorPromotionBanner;
