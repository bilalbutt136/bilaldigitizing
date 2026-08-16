'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, Tag, ArrowRight, X, Gift, Check } from 'lucide-react';
import { useAppState } from '../../context/StateContext';
import { usePathname } from 'next/navigation';

export const VisitorPromotionBanner = () => {
  const { siteSettings, openOrderWizard, protectedNavigate, isAuthenticated, currentView, authUser } = useAppState();
  const pathname = usePathname() || '';
  
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(true);
  const [copied, setCopied] = useState(false);

  const banner = siteSettings?.promotionalBanner;

  // Strict check: Never show promotional welcome banner on Admin routes or to Admin users
  const isAdminRoute = 
    pathname.startsWith('/admin') || 
    pathname.startsWith('/secure-admin-login') ||
    pathname.includes('/admin');
  const isAdminUser = 
    authUser?.role === 'admin' || 
    currentView === 'admin' || 
    (typeof window !== 'undefined' && (window.location.pathname.includes('admin') || window.location.pathname.includes('secure-admin-login')));

  useEffect(() => {
    if (isAdminRoute || isAdminUser) {
      setIsVisible(false);
      setIsDismissed(true);
      return;
    }

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
  }, [banner?.enabled, banner?.title, isAdminRoute, isAdminUser]);

  if (isAdminRoute || isAdminUser || isDismissed || !isVisible || !banner?.enabled || !banner?.title) {
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
      
      {banner.message && (
        <p style={{
          margin: '0 0 0.85rem 0',
          fontSize: '0.82rem',
          color: '#cbd5e1',
          lineHeight: 1.45
        }}>
          {banner.message}
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
          {banner.buttonText || 'Claim Offer'} <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
};

export default VisitorPromotionBanner;
