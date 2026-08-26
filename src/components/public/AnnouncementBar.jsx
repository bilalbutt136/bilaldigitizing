'use client';

import React, { useState, useEffect } from 'react';
import { X, Flame, Tag, ArrowRight, Check, Clock, Sparkles } from 'lucide-react';
import { useAppState } from '../../context/StateContext';
import { useNavigate } from '../../utils/navigation';

const THEMES = {
  orange: { bg: 'linear-gradient(90deg, #ea580c 0%, #f97316 50%, #ea580c 100%)', text: '#ffffff', badgeBg: 'rgba(255,255,255,0.22)', btnBg: '#ffffff', btnColor: '#ea580c' },
  navy: { bg: 'linear-gradient(90deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)', text: '#ffffff', badgeBg: 'rgba(249, 115, 22, 0.25)', btnBg: '#f97316', btnColor: '#ffffff' },
  emerald: { bg: 'linear-gradient(90deg, #065f46 0%, #059669 50%, #065f46 100%)', text: '#ffffff', badgeBg: 'rgba(255,255,255,0.22)', btnBg: '#ffffff', btnColor: '#065f46' },
  crimson: { bg: 'linear-gradient(90deg, #991b1b 0%, #dc2626 50%, #991b1b 100%)', text: '#ffffff', badgeBg: 'rgba(255,255,255,0.22)', btnBg: '#ffffff', btnColor: '#991b1b' },
  royal: { bg: 'linear-gradient(90deg, #312e81 0%, #4338ca 50%, #312e81 100%)', text: '#ffffff', badgeBg: 'rgba(255,255,255,0.22)', btnBg: '#ffffff', btnColor: '#312e81' }
};

export const AnnouncementBar = () => {
  const { siteSettings, openOrderWizard, protectedNavigate, showToast } = useAppState();
  const navigate = useNavigate();
  const [isDismissed, setIsDismissed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ hours: 14, minutes: 35, seconds: 48 });

  const rawAnnouncement = siteSettings?.announcement;
  const activePromo = Array.isArray(siteSettings?.promotions) 
    ? siteSettings.promotions.find(p => p.status === 'active')
    : null;

  // Dynamically derive announcement details from active promotion if present or use manual config
  const announcement = activePromo ? {
    enabled: rawAnnouncement?.enabled !== false,
    text: `Get ${activePromo.discountPercent}% OFF on All Custom Embroidery Digitizing & Vector Art Orders!`,
    badge: activePromo.name ? activePromo.name.toUpperCase() : (rawAnnouncement?.badge || 'SALE'),
    promoCode: activePromo.promoCode || (rawAnnouncement?.promoCode || `PROMO${activePromo.discountPercent}`),
    linkText: `Claim ${activePromo.discountPercent}% Off`,
    linkUrl: rawAnnouncement?.linkUrl || '/order',
    showCountdown: rawAnnouncement?.showCountdown !== false,
    showCodeBadge: rawAnnouncement?.showCodeBadge !== false,
    theme: (rawAnnouncement?.theme === 'emerald' ? 'orange' : rawAnnouncement?.theme) || 'orange',
    textColor: rawAnnouncement?.textColor || '#ffffff',
    discountValue: activePromo.discountPercent
  } : (rawAnnouncement?.enabled && rawAnnouncement?.text ? {
    ...rawAnnouncement,
    theme: (rawAnnouncement.theme === 'emerald' ? 'orange' : rawAnnouncement.theme) || 'orange'
  } : null);

  // Real-time Countdown Timer calculation & Live promotions listener
  useEffect(() => {
    setMounted(true);
    if (announcement?.text) {
      const dismissKey = 'announcement_dismissed_' + encodeURIComponent(announcement.text);
      setIsDismissed(sessionStorage.getItem(dismissKey) === 'true');
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
        return { hours: 23, minutes: 59, seconds: 59 }; // loop daily
      });
    }, 1000);

    const handlePromoSync = () => {
      setIsDismissed(false); // reset dismiss on new promotion update
    };

    window.addEventListener('bdigi_promotions_sync', handlePromoSync);
    window.addEventListener('site_settings_updated', handlePromoSync);

    let promoBc;
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        promoBc = new BroadcastChannel('bdigi_promotions_sync');
        promoBc.onmessage = () => {
          setIsDismissed(false);
        };
      } catch {}
    }

    return () => {
      clearInterval(timer);
      window.removeEventListener('bdigi_promotions_sync', handlePromoSync);
      window.removeEventListener('site_settings_updated', handlePromoSync);
      if (promoBc) {
        try { promoBc.close(); } catch {}
      }
    };
  }, [announcement?.text, announcement?.enabled, activePromo?.discountPercent, activePromo?.id]);

  if (!mounted || isDismissed || !announcement?.enabled || !announcement?.text) {
    return null;
  }

  const handleDismiss = () => {
    setIsDismissed(true);
    if (announcement?.text) {
      const dismissKey = 'announcement_dismissed_' + encodeURIComponent(announcement.text);
      sessionStorage.setItem(dismissKey, 'true');
    }
  };

  const handleCopyAndApply = (e) => {
    e.stopPropagation();
    const promoCode = announcement?.promoCode || (activePromo ? `SAVE${activePromo.discountPercent}` : 'SAVE15');
    try {
      navigator.clipboard.writeText(promoCode);
      setCopied(true);
      if (showToast) showToast(`Coupon ${promoCode} copied & activated!`, 'success');
      setTimeout(() => setCopied(false), 2400);
    } catch {}

    // Auto trigger order wizard with promo pre-filled
    if (openOrderWizard) {
      openOrderWizard({ promoCode, type: 'all' });
    }
  };

  const handleActionClick = () => {
    const target = announcement?.linkUrl || '/order';
    const promoCode = announcement?.promoCode || (activePromo ? `SAVE${activePromo.discountPercent}` : 'SAVE15');
    if (target.startsWith('#')) {
      const el = document.getElementById(target.substring(1));
      if (el) el.scrollIntoView({ behavior: 'smooth' });
      else navigate(target);
    } else if (target === '/order' || target.includes('orderWizard')) {
      if (openOrderWizard) {
        openOrderWizard({ promoCode, type: 'all' });
      } else {
        protectedNavigate('customer', true, { promoCode, type: 'all' });
      }
    } else {
      navigate(target);
    }
  };

  // Determine dynamic background and text color
  const safeThemeKey = (announcement?.theme === 'emerald' ? 'orange' : announcement?.theme) || 'orange';
  const themeObj = THEMES[safeThemeKey] || THEMES.orange;
  const backgroundStyle = (announcement?.bgColor && announcement.bgColor.length > 3 && !announcement.bgColor.includes('065f46'))
    ? announcement.bgColor
    : themeObj.bg;
  const textStyle = announcement.textColor || themeObj.text || '#ffffff';

  return (
    <aside 
      aria-label="Promotional announcement"
      style={{
        background: backgroundStyle,
        color: textStyle,
        padding: '0.45rem 1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        zIndex: 100,
        fontSize: '0.84rem',
        fontWeight: 600,
        letterSpacing: '0.01em',
        boxShadow: '0 2px 12px rgba(0,0,0,0.18)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.15)',
        transition: 'background 0.3s ease, color 0.3s ease'
      }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.65rem',
        flexWrap: 'wrap',
        textAlign: 'center',
        paddingRight: '2rem',
        maxWidth: '1280px',
        margin: '0 auto'
      }}>
        
        {/* Flash Badge */}
        {announcement.badge && (
          <div style={{
            background: themeObj.badgeBg || 'rgba(255, 255, 255, 0.22)',
            border: '1px solid rgba(255, 255, 255, 0.4)',
            padding: '0.15rem 0.55rem',
            borderRadius: '9999px',
            fontSize: '0.7rem',
            fontWeight: 900,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.25rem',
            letterSpacing: '0.04em',
            textTransform: 'uppercase'
          }}>
            <Flame size={12} style={{ color: '#fef08a' }} />
            <span>{announcement.badge}</span>
          </div>
        )}

        {/* Main Text */}
        <span style={{ fontWeight: 700, lineHeight: 1.3 }}>
          {announcement.text}
        </span>

        {/* Live Urgency Countdown Timer */}
        {announcement.showCountdown && (
          <div style={{
            background: 'rgba(0, 0, 0, 0.3)',
            border: '1px solid rgba(255, 255, 255, 0.25)',
            padding: '0.15rem 0.55rem',
            borderRadius: '6px',
            fontSize: '0.74rem',
            fontWeight: 800,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.3rem',
            color: '#fef08a'
          }}>
            <Clock size={11} />
            <span>Ends in: {String(timeLeft.hours).padStart(2, '0')}h {String(timeLeft.minutes).padStart(2, '0')}m {String(timeLeft.seconds).padStart(2, '0')}s</span>
          </div>
        )}

        {/* 1-Click Copy & Apply Promo Code Badge */}
        {announcement.showCodeBadge && announcement.promoCode && (
          <button
            type="button"
            onClick={handleCopyAndApply}
            style={{
              background: 'rgba(0, 0, 0, 0.35)',
              border: '1px dashed rgba(255, 255, 255, 0.8)',
              color: '#ffffff',
              padding: '0.2rem 0.65rem',
              borderRadius: '6px',
              fontSize: '0.76rem',
              fontWeight: 900,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              transition: 'all 0.18s',
              fontFamily: 'monospace'
            }}
            title="Click to copy & apply coupon code"
          >
            <Tag size={12} style={{ color: '#fbbf24' }} />
            <span>{announcement.promoCode}</span>
            <span style={{ fontSize: '0.68rem', color: copied ? '#86efac' : 'rgba(255,255,255,0.85)', fontWeight: 800, marginLeft: '2px' }}>
              {copied ? '✓ Applied!' : 'Apply'}
            </span>
          </button>
        )}

        {/* Action CTA Button */}
        {announcement.linkText && (
          <button
            type="button"
            onClick={handleActionClick}
            style={{
              background: themeObj.btnBg || '#ffffff',
              color: themeObj.btnColor || '#ea580c',
              border: 'none',
              padding: '0.25rem 0.85rem',
              borderRadius: '9999px',
              fontSize: '0.76rem',
              fontWeight: 900,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem',
              boxShadow: '0 2px 6px rgba(0,0,0,0.18)',
              transition: 'transform 0.15s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.04)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <span>{announcement.linkText}</span>
            <ArrowRight size={12} />
          </button>
        )}

      </div>

      {/* Dismiss X Button */}
      <button
        type="button"
        onClick={handleDismiss}
        style={{
          position: 'absolute',
          right: '0.75rem',
          top: '50%',
          transform: 'translateY(-50%)',
          padding: '0.3rem',
          background: 'rgba(255,255,255,0.15)',
          border: 'none',
          borderRadius: '50%',
          color: '#ffffff',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'background 0.2s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
        aria-label="Dismiss announcement"
      >
        <X size={15} />
      </button>
    </aside>
  );
};

export default AnnouncementBar;
