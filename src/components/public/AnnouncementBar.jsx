'use client';
import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useAppState } from '../../context/StateContext';

export const AnnouncementBar = () => {
  const { siteSettings } = useAppState();
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(true);

  useEffect(() => {
    const dismissed = sessionStorage.getItem('announcementDismissed');
    setIsDismissed(dismissed === 'true');
    setIsVisible(true);
  }, []);

  if (!isVisible || isDismissed || !siteSettings?.announcement?.enabled) {
    return null;
  }

  const announcement = siteSettings.announcement;

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem('announcementDismissed', 'true');
  };

  return (
    <div style={{
      background: announcement.bgColor || 'var(--orange-500)',
      color: announcement.textColor || '#ffffff',
      padding: '0.55rem 1rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      zIndex: 50,
      fontSize: '0.875rem',
      fontWeight: 500,
      letterSpacing: '0.01em',
      transition: 'all 0.3s ease'
    }}>
      <div style={{ textAlign: 'center', paddingRight: '2rem', flex: 1 }}>
        {announcement.text}{' '}
        {announcement.linkUrl && (
          <a
            href={announcement.linkUrl}
            style={{
              color: 'inherit',
              textDecoration: 'underline',
              fontWeight: 700,
              marginLeft: '0.5rem',
              transition: 'opacity 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.85'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
          >
            {announcement.linkText || 'Learn More'}
          </a>
        )}
      </div>
      <button
        onClick={handleDismiss}
        style={{
          position: 'absolute',
          right: '1rem',
          padding: '0.25rem',
          background: 'rgba(255,255,255,0.15)',
          border: 'none',
          borderRadius: '50%',
          color: 'inherit',
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
        <X size={16} />
      </button>
    </div>
  );
};
