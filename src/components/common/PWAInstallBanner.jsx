'use client';

import React, { useState, useEffect } from 'react';
import { Download, X, Sparkles, Smartphone, Share, PlusSquare } from 'lucide-react';

export const PWAInstallBanner = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  useEffect(() => {
    // Check if already in standalone PWA mode
    const isApp = window.matchMedia('(display-mode: standalone)').matches || 
                  window.navigator.standalone === true;
    setIsStandalone(isApp);
    if (isApp) return;

    // Check if user dismissed prompt recently (14-day frequency cap)
    const dismissedUntil = localStorage.getItem('bdigi_pwa_dismissed_until');
    if (dismissedUntil && Number(dismissedUntil) > Date.now()) {
      return;
    }

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);

    // Capture beforeinstallprompt event for Android / Chrome / Edge
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Wait 3 seconds before showing banner to ensure smooth initial load
      setTimeout(() => {
        setShowBanner(true);
      }, 3000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // On iOS Safari, show prompt after 4 seconds on mobile devices if not standalone
    if (isIOSDevice && !isApp) {
      const isMobileSafari = /safari/.test(userAgent) && !/crios|fxios|edgios/.test(userAgent);
      if (isMobileSafari) {
        const iosTimer = setTimeout(() => {
          setShowBanner(true);
        }, 4000);
        return () => clearTimeout(iosTimer);
      }
    }

    // Allow manual triggers from profile / settings
    const handleManualTrigger = () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
      } else if (isIOSDevice) {
        setShowIOSInstructions(true);
        setShowBanner(true);
      } else {
        setShowBanner(true);
      }
    };
    window.addEventListener('bdigi_trigger_pwa_install', handleManualTrigger);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('bdigi_trigger_pwa_install', handleManualTrigger);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowBanner(false);
      }
      setDeferredPrompt(null);
    } else if (isIOS) {
      setShowIOSInstructions(true);
    } else {
      setShowBanner(false);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    // Dismiss for 14 days
    const fourteenDaysMs = 14 * 24 * 60 * 60 * 1000;
    localStorage.setItem('bdigi_pwa_dismissed_until', String(Date.now() + fourteenDaysMs));
  };

  if (isStandalone || !showBanner) return null;

  return (
    <>
      {/* Smart Mobile Install Banner */}
      <div 
        style={{
          position: 'fixed',
          bottom: '80px',
          left: '1rem',
          right: '1rem',
          maxWidth: '480px',
          margin: '0 auto',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          color: '#ffffff',
          borderRadius: '16px',
          padding: '0.85rem 1rem',
          boxShadow: '0 12px 32px rgba(0, 0, 0, 0.35), 0 0 0 1.5px rgba(255, 255, 255, 0.12)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.75rem',
          animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            fontWeight: 900,
            fontSize: '1.1rem',
            flexShrink: 0,
            boxShadow: '0 4px 12px rgba(249, 115, 22, 0.4)'
          }}>
            B
          </div>

          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <h5 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 800, color: '#ffffff', whiteSpace: 'nowrap' }}>
                Get the BDigitizing App
              </h5>
              <Sparkles size={13} style={{ color: '#fbbf24' }} />
            </div>
            <p style={{ margin: '0.1rem 0 0', fontSize: '0.72rem', color: '#94a3b8', lineHeight: 1.25, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              Fast ordering, live chat & instant file tracking.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
          <button
            type="button"
            onClick={handleInstallClick}
            style={{
              background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '10px',
              padding: '0.45rem 0.85rem',
              fontSize: '0.78rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem',
              boxShadow: '0 4px 10px rgba(249, 115, 22, 0.35)',
              whiteSpace: 'nowrap'
            }}
          >
            <Download size={13} />
            <span>Install App</span>
          </button>

          <button
            type="button"
            onClick={handleDismiss}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              color: '#94a3b8',
              borderRadius: '50%',
              width: '26px',
              height: '26px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
            aria-label="Dismiss install banner"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* iOS Safari Add to Home Screen Instructions Modal */}
      {showIOSInstructions && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)',
            zIndex: 100000,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            padding: '1rem'
          }}
          onClick={() => setShowIOSInstructions(false)}
        >
          <div 
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              padding: '1.5rem',
              maxWidth: '440px',
              width: '100%',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
              textAlign: 'center',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowIOSInstructions(false)}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: '#f1f5f9',
                border: 'none',
                borderRadius: '50%',
                width: '30px',
                height: '30px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#64748b'
              }}
            >
              <X size={16} />
            </button>

            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem',
              fontWeight: 900,
              fontSize: '1.5rem',
              boxShadow: '0 8px 20px rgba(249, 115, 22, 0.35)'
            }}>
              B
            </div>

            <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.15rem', fontWeight: 900, color: '#0f172a' }}>
              Install BDigitizing on iPhone
            </h3>
            <p style={{ margin: '0 0 1.25rem', fontSize: '0.85rem', color: '#64748b', lineHeight: 1.4 }}>
              Install for 1-tap ordering, instant digitizer chat, and fast file downloads.
            </p>

            <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '1rem', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#ffedd5', color: '#ea580c', fontWeight: 800, fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>1</span>
                <span style={{ fontSize: '0.82rem', color: '#1e293b' }}>Tap the <strong>Share</strong> button <Share size={14} style={{ display: 'inline', verticalAlign: 'middle', margin: '0 2px' }} /> in Safari</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#ffedd5', color: '#ea580c', fontWeight: 800, fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>2</span>
                <span style={{ fontSize: '0.82rem', color: '#1e293b' }}>Scroll down and tap <strong>Add to Home Screen</strong> <PlusSquare size={14} style={{ display: 'inline', verticalAlign: 'middle', margin: '0 2px' }} /></span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#ffedd5', color: '#ea580c', fontWeight: 800, fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>3</span>
                <span style={{ fontSize: '0.82rem', color: '#1e293b' }}>Tap <strong>Add</strong> at top right to complete installation</span>
              </div>
            </div>

            <button
              onClick={() => setShowIOSInstructions(false)}
              className="btn btn-primary-orange"
              style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', fontWeight: 800 }}
            >
              Got It!
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default PWAInstallBanner;
