'use client';

import React, { useState, useEffect } from 'react';
import { X, Flame, Tag, ArrowRight, Check } from 'lucide-react';
import { useAppState } from '../../context/StateContext';
import { useNavigate } from '../../utils/navigation';

const THEMES = {
  orange: { bg: 'linear-gradient(90deg, #ea580c 0%, #f97316 50%, #ea580c 100%)', text: '#ffffff' },
  navy: { bg: 'linear-gradient(90deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)', text: '#ffffff' },
  emerald: { bg: 'linear-gradient(90deg, #065f46 0%, #059669 50%, #065f46 100%)', text: '#ffffff' },
  crimson: { bg: 'linear-gradient(90deg, #991b1b 0%, #dc2626 50%, #991b1b 100%)', text: '#ffffff' }
};

export const AnnouncementBar = () => {
  const { siteSettings, openOrderWizard, protectedNavigate } = useAppState();
  const navigate = useNavigate();
  const [isDismissed, setIsDismissed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);

  const announcement = siteSettings?.announcement;

  useEffect(() => {
    setMounted(true);
    if (announcement?.text) {
      const dismissKey = 'announcement_dismissed_' + encodeURIComponent(announcement.text);
      setIsDismissed(sessionStorage.getItem(dismissKey) === 'true');
    }
  }, [announcement?.text, announcement?.enabled]);

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

  const handleCopyCode = (e) => {
    e.stopPropagation();
    if (!announcement.promoCode) return;
    try {
      navigator.clipboard.writeText(announcement.promoCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {}
  };

  const handleActionClick = () => {
    const target = announcement.linkUrl || '/order';
    const promoCode = announcement.promoCode || 'SAVE20';
    if (target.startsWith('#')) {
      const el = document.getElementById(target.substring(1));
      if (el) el.scrollIntoView({ behavior: 'smooth' });
      else navigate(target);
    } else if (target === '/order' || target.includes('orderWizard')) {
      if (openOrderWizard) {
        openOrderWizard({ promoCode });
      } else {
        protectedNavigate('customer', true, { promoCode });
      }
    } else {
      navigate(target);
    }
  };

  // Determine dynamic background and text color
  const backgroundStyle = announcement.bgColor && announcement.bgColor.length > 3
    ? announcement.bgColor
    : (THEMES[announcement.theme]?.bg || THEMES.orange.bg);
  const textStyle = announcement.textColor || THEMES[announcement.theme]?.text || '#ffffff';

  return (
    <aside 
      aria-label="Promotional announcement"
      style={{
        background: backgroundStyle,
        color: textStyle,
        padding: '0.5rem 1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        zIndex: 100,
        fontSize: '0.85rem',
        fontWeight: 600,
        letterSpacing: '0.01em',
        boxShadow: '0 2px 10px rgba(0,0,0,0.15)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.15)',
        transition: 'background 0.3s ease, color 0.3s ease'
      }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.75rem',
        flexWrap: 'wrap',
        textAlign: 'center',
        paddingRight: '2rem',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        
        {/* Flash Badge */}
        {announcement.badge && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.22)',
            border: '1px solid rgba(255, 255, 255, 0.35)',
            padding: '0.2rem 0.6rem',
            borderRadius: '9999px',
            fontSize: '0.72rem',
            fontWeight: 900,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.3rem',
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

        {/* 1-Click Copy Promo Code Badge */}
        {announcement.showCodeBadge && announcement.promoCode && (
          <button
            type="button"
            onClick={handleCopyCode}
            style={{
              background: 'rgba(0, 0, 0, 0.3)',
              border: '1px dashed rgba(255, 255, 255, 0.7)',
              color: '#ffffff',
              padding: '0.2rem 0.65rem',
              borderRadius: '6px',
              fontSize: '0.78rem',
              fontWeight: 900,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              transition: 'all 0.2s',
              fontFamily: 'monospace'
            }}
            title="Click to copy coupon code"
          >
            <Tag size={12} />
            <span>{announcement.promoCode}</span>
            <span style={{ fontSize: '0.7rem', color: copied ? '#86efac' : 'rgba(255,255,255,0.85)', fontWeight: 800, marginLeft: '2px' }}>
              {copied ? '✓ Copied!' : 'Copy'}
            </span>
          </button>
        )}

        {/* Action Button */}
        {announcement.linkText && (
          <button
            type="button"
            onClick={handleActionClick}
            style={{
              background: '#ffffff',
              color: '#0f172a',
              border: 'none',
              padding: '0.25rem 0.8rem',
              borderRadius: '9999px',
              fontSize: '0.75rem',
              fontWeight: 900,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem',
              boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
              transition: 'transform 0.2s'
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
