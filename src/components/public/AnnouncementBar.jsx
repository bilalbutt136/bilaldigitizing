'use client';

import React, { useState, useEffect } from 'react';
import { X, Flame, Tag, ArrowRight, Check as _Check, Clock, Sparkles as _Sparkles } from 'lucide-react';
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

  const serviceRates = activePromo?.serviceDiscounts || siteSettings?.service_discounts || siteSettings?.serviceDiscounts;
  const isGranular = Boolean(serviceRates && (serviceRates.embroidery !== undefined || serviceRates.vector !== undefined || serviceRates.patch !== undefined));
  const embRate = serviceRates?.embroidery ?? activePromo?.discountPercent ?? 20;
  const vecRate = serviceRates?.vector ?? activePromo?.discountPercent ?? 10;
  const pchRate = serviceRates?.patch ?? activePromo?.discountPercent ?? 5;
  const maxRate = Math.max(embRate, vecRate, pchRate);

  const dynamicText = isGranular
    ? `🧵 ${embRate}% OFF Digitizing • 🎨 ${vecRate}% OFF Vector • 🛡️ ${pchRate}% OFF Patches | Limited Time!`
    : (activePromo ? `Get up to ${activePromo.discountPercent}% OFF on All Custom Digitizing & Vector Orders!` : rawAnnouncement?.text);

  // Dynamically derive announcement details from active promotion if present or use manual config
  const announcement = (activePromo || isGranular) ? {
    enabled: rawAnnouncement?.enabled !== false,
    text: dynamicText,
    badge: activePromo?.name ? activePromo.name.toUpperCase() : (isGranular ? 'LIVE PROMO' : (rawAnnouncement?.badge || 'SALE')),
    promoCode: activePromo?.promoCode || (rawAnnouncement?.promoCode || `SAVE${maxRate}`),
    linkText: `Claim Discount (Up to ${maxRate}% Off)`,
    linkUrl: rawAnnouncement?.linkUrl || '/order',
    showCountdown: rawAnnouncement?.showCountdown !== false,
    showCodeBadge: rawAnnouncement?.showCodeBadge !== false,
    theme: (rawAnnouncement?.theme === 'emerald' ? 'orange' : rawAnnouncement?.theme) || 'orange',
    textColor: rawAnnouncement?.textColor || '#ffffff',
    discountValue: maxRate
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

  const handleDismiss = (e) => {
    if (e) e.stopPropagation();
    setIsDismissed(true);
    if (announcement?.text) {
      const dismissKey = 'announcement_dismissed_' + encodeURIComponent(announcement.text);
      sessionStorage.setItem(dismissKey, 'true');
    }
  };

  const handleCopyAndApply = (e) => {
    if (e) e.stopPropagation();
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

  const handleActionClick = (e) => {
    if (e) e.stopPropagation();
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

  const handleStripClick = (e) => {
    // If the click originated from an explicit button, do not double-trigger
    if (e.target.closest('button')) return;
    handleActionClick();
  };

  // Determine dynamic background and text color
  const safeThemeKey = (announcement?.theme === 'emerald' ? 'orange' : announcement?.theme) || 'orange';
  const themeObj = THEMES[safeThemeKey] || THEMES.orange;
  const backgroundStyle = (announcement?.bgColor && announcement.bgColor.length > 3 && !announcement.bgColor.includes('065f46'))
    ? announcement.bgColor
    : themeObj.bg;
  const textStyle = announcement.textColor || themeObj.text || '#ffffff';

  // Renders one promotional unit block for the continuous marquee strip
  const renderPromotionBlock = (keyPrefix) => (
    <div
      key={keyPrefix}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.65rem',
        padding: '0 1.25rem',
        whiteSpace: 'nowrap',
        flexShrink: 0
      }}
    >
      {/* Flash Badge */}
      {announcement.badge && (
        <div style={{
          background: themeObj.badgeBg || 'rgba(255, 255, 255, 0.22)',
          border: '1px solid rgba(255, 255, 255, 0.4)',
          padding: '0.12rem 0.5rem',
          borderRadius: '9999px',
          fontSize: '0.68rem',
          fontWeight: 900,
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.25rem',
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          flexShrink: 0
        }}>
          <Flame size={12} style={{ color: '#fef08a' }} />
          <span>{announcement.badge}</span>
        </div>
      )}

      {/* Main Text */}
      <span style={{ fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0, fontSize: '0.82rem' }}>
        {announcement.text}
      </span>

      {/* Live Urgency Countdown Timer */}
      {announcement.showCountdown && (
        <div style={{
          background: 'rgba(0, 0, 0, 0.3)',
          border: '1px solid rgba(255, 255, 255, 0.25)',
          padding: '0.12rem 0.5rem',
          borderRadius: '6px',
          fontSize: '0.72rem',
          fontWeight: 800,
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.3rem',
          color: '#fef08a',
          whiteSpace: 'nowrap',
          flexShrink: 0
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
            padding: '0.15rem 0.55rem',
            borderRadius: '6px',
            fontSize: '0.74rem',
            fontWeight: 900,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.3rem',
            transition: 'all 0.18s',
            fontFamily: 'monospace',
            whiteSpace: 'nowrap',
            flexShrink: 0
          }}
          title="Click to copy & apply coupon code"
        >
          <Tag size={11} style={{ color: '#fbbf24' }} />
          <span>{announcement.promoCode}</span>
          <span style={{ fontSize: '0.66rem', color: copied ? '#86efac' : 'rgba(255,255,255,0.85)', fontWeight: 800, marginLeft: '2px' }}>
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
            padding: '0.2rem 0.75rem',
            borderRadius: '9999px',
            fontSize: '0.74rem',
            fontWeight: 900,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.25rem',
            boxShadow: '0 2px 6px rgba(0,0,0,0.18)',
            whiteSpace: 'nowrap',
            flexShrink: 0,
            transition: 'transform 0.15s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.04)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <span>{announcement.linkText}</span>
          <ArrowRight size={11} />
        </button>
      )}

      {/* Elegant Separator */}
      <span style={{ opacity: 0.45, fontSize: '0.85rem', margin: '0 0.35rem', flexShrink: 0 }}>✦</span>
    </div>
  );

  return (
    <aside
      aria-label="Promotional announcement"
      style={{
        background: backgroundStyle,
        color: textStyle,
        height: '38px',
        minHeight: '38px',
        maxHeight: '38px',
        position: 'relative',
        zIndex: 100,
        fontSize: '0.82rem',
        fontWeight: 600,
        letterSpacing: '0.01em',
        boxShadow: '0 2px 10px rgba(0,0,0,0.18)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.15)',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        userSelect: 'none',
        cursor: 'pointer',
        transition: 'background 0.3s ease, color 0.3s ease'
      }}
      onClick={handleStripClick}
    >
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes bdigiAnnouncementMarquee {
          0% {
            transform: translate3d(0, 0, 0);
          }
          100% {
            transform: translate3d(-50%, 0, 0);
          }
        }
        .bdigi-announcement-strip {
          display: inline-flex;
          align-items: center;
          white-space: nowrap;
          width: max-content;
          animation: bdigiAnnouncementMarquee 38s linear infinite;
          will-change: transform;
        }
        .bdigi-announcement-strip:hover,
        .bdigi-announcement-strip:active {
          animation-play-state: paused;
        }
        @media (max-width: 768px) {
          .bdigi-announcement-strip {
            animation-duration: 26s;
          }
        }
      `}} />

      {/* Left Edge Subtle Fade Gradient */}
      <div style={{
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: '28px',
        background: `linear-gradient(to right, ${safeThemeKey === 'orange' ? '#ea580c' : '#0f172a'}, transparent)`,
        zIndex: 15,
        pointerEvents: 'none'
      }} />

      {/* Continuous Single-Line Running Ticker Strip */}
      <div className="bdigi-announcement-strip">
        {/* Set 1 */}
        <div style={{ display: 'inline-flex', alignItems: 'center', flexShrink: 0 }}>
          {renderPromotionBlock('set1-a')}
          {renderPromotionBlock('set1-b')}
        </div>
        {/* Set 2 (Identical Clone to ensure completely seamless infinite loop) */}
        <div style={{ display: 'inline-flex', alignItems: 'center', flexShrink: 0 }}>
          {renderPromotionBlock('set2-a')}
          {renderPromotionBlock('set2-b')}
        </div>
      </div>

      {/* Right Edge Fade Gradient & Dismiss X Button */}
      <div style={{
        position: 'absolute',
        right: 0,
        top: 0,
        bottom: 0,
        width: '56px',
        background: `linear-gradient(to left, ${safeThemeKey === 'orange' ? '#ea580c' : '#0f172a'} 70%, transparent)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        paddingRight: '0.65rem',
        zIndex: 20,
        pointerEvents: 'none'
      }}>
        <button
          type="button"
          onClick={handleDismiss}
          style={{
            pointerEvents: 'auto',
            padding: '0.28rem',
            background: 'rgba(0, 0, 0, 0.25)',
            border: 'none',
            borderRadius: '50%',
            color: '#ffffff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.2s',
            backdropFilter: 'blur(4px)'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0, 0, 0, 0.45)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(0, 0, 0, 0.25)'}
          aria-label="Dismiss announcement"
          title="Dismiss announcement"
        >
          <X size={14} />
        </button>
      </div>
    </aside>
  );
};

export default AnnouncementBar;
