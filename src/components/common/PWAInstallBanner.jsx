'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Download, X, Sparkles, Smartphone, Share, PlusSquare, MoreVertical, CheckCircle2 } from 'lucide-react';
import { useAppState } from '../../context/StateContext';

const AUTO_DISMISS_SECONDS = 10;

export const PWAInstallBanner = () => {
  const { setMobileMode } = useAppState();
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  const [showAndroidInstructions, setShowAndroidInstructions] = useState(false);
  const [isAppInstalled, setIsAppInstalled] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const dismissTimerRef = useRef(null);

  useEffect(() => {
    // 1. Check if already running in standalone PWA / Mobile App mode
    const isApp = window.matchMedia('(display-mode: standalone)').matches || 
                  window.navigator.standalone === true ||
                  (document.referrer && document.referrer.includes('android-app://'));
    setIsStandalone(isApp);
    if (isApp) return;

    // 2. Check if user already installed app
    if (typeof navigator !== 'undefined' && 'getInstalledRelatedApps' in navigator) {
      navigator.getInstalledRelatedApps().then(apps => {
        if (Array.isArray(apps) && apps.length > 0) {
          setIsAppInstalled(true);
        }
      }).catch(() => {});
    }
    if (typeof localStorage !== 'undefined' && localStorage.getItem('bdigi_pwa_installed') === 'true') {
      setIsAppInstalled(true);
    }

    const handleAppInstalled = () => {
      setIsAppInstalled(true);
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('bdigi_pwa_installed', 'true');
      }
      setShowBanner(false);
      clearTimeout(dismissTimerRef.current);
    };
    window.addEventListener('appinstalled', handleAppInstalled);

    // 3. Check session and local storage dismissal
    const sessionDismissed = typeof sessionStorage !== 'undefined' && sessionStorage.getItem('bdigi_pwa_dismissed') === 'true';
    const dismissedUntil = typeof localStorage !== 'undefined' ? localStorage.getItem('bdigi_pwa_dismissed_until') : null;
    const isDismissed = sessionDismissed || (dismissedUntil && Number(dismissedUntil) > Date.now());

    // 4. Detect platform
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    const isAndroidDevice = /android/.test(userAgent);
    const isMobileViewport = typeof window !== 'undefined' && (window.innerWidth <= 820 || /mobile|android|iphone|ipad|ipod/.test(userAgent));
    
    setIsIOS(isIOSDevice);
    setIsAndroid(isAndroidDevice);

    // 5. Capture beforeinstallprompt event for Android / Chrome / Edge
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (typeof window !== 'undefined') {
        window.deferredPWAInstallPrompt = e;
      }
      if (!isDismissed && !isApp) {
        setTimeout(() => {
          setShowBanner(true);
        }, 2200);
      }
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // 6. If on mobile browser (Chrome/Safari) and not dismissed, show prompt after a smooth delay
    if (isMobileViewport && !isDismissed && !isApp) {
      const showTimer = setTimeout(() => {
        setShowBanner(true);
      }, 2600);

      return () => {
        clearTimeout(showTimer);
        clearTimeout(dismissTimerRef.current);
        window.removeEventListener('appinstalled', handleAppInstalled);
        window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      };
    }

    // 7. Manual trigger listener from profile / header menus
    const handleManualTrigger = () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
      } else if (isIOSDevice) {
        setShowIOSInstructions(true);
      } else if (isAndroidDevice) {
        setShowAndroidInstructions(true);
      } else {
        setShowBanner(true);
      }
    };
    window.addEventListener('bdigi_trigger_pwa_install', handleManualTrigger);

    return () => {
      clearTimeout(dismissTimerRef.current);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('bdigi_trigger_pwa_install', handleManualTrigger);
    };
  }, []);

  // Auto-dismiss countdown effect: automatically closes the popup after 10 seconds if not hovered/interacted
  useEffect(() => {
    if (!showBanner || isPaused) return;

    dismissTimerRef.current = setTimeout(() => {
      handleDismiss();
    }, AUTO_DISMISS_SECONDS * 1000);

    return () => {
      clearTimeout(dismissTimerRef.current);
    };
  }, [showBanner, isPaused]);

  const handleDismiss = () => {
    setShowBanner(false);
    clearTimeout(dismissTimerRef.current);
    
    // Save in sessionStorage so user is not prompted again during this session
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('bdigi_pwa_dismissed', 'true');
    }
    // Set a 24-hour cap in localStorage
    if (typeof localStorage !== 'undefined') {
      const oneDayMs = 24 * 60 * 60 * 1000;
      localStorage.setItem('bdigi_pwa_dismissed_until', String(Date.now() + oneDayMs));
    }
  };

  const handleInstallClick = async () => {
    clearTimeout(dismissTimerRef.current);

    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsAppInstalled(true);
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('bdigi_pwa_installed', 'true');
        }
        setShowBanner(false);
      }
      setDeferredPrompt(null);
    } else if (isIOS) {
      setShowIOSInstructions(true);
      setShowBanner(false);
    } else if (isAndroid) {
      setShowAndroidInstructions(true);
      setShowBanner(false);
    } else {
      handleDismiss();
    }
  };

  const handleOpenApp = () => {
    window.location.href = '/?app=true';
  };

  if (isStandalone || !showBanner) return null;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes bdigiPopupSlideUp {
          from {
            opacity: 0;
            transform: translate3d(0, 30px, 0) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translate3d(0, 0, 0) scale(1);
          }
        }
        @keyframes bdigiProgressBar {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
        .bdigi-install-popup-progress {
          animation: bdigiProgressBar ${AUTO_DISMISS_SECONDS}s linear forwards;
        }
        .bdigi-install-popup-progress.paused {
          animation-play-state: paused;
        }
      `}} />

      {/* Floating Mobile App Installation Popup */}
      <div 
        role="alert"
        aria-live="polite"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
        style={{
          position: 'fixed',
          bottom: '75px',
          left: '0.85rem',
          right: '0.85rem',
          maxWidth: '430px',
          margin: '0 auto',
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.98) 0%, rgba(30, 41, 59, 0.98) 100%)',
          color: '#ffffff',
          borderRadius: '18px',
          padding: '0.85rem 1rem 0.95rem',
          boxShadow: '0 16px 40px rgba(0, 0, 0, 0.45), 0 0 0 1.5px rgba(249, 115, 22, 0.35)',
          backdropFilter: 'blur(16px)',
          zIndex: 99999,
          display: 'flex',
          flexDirection: 'column',
          gap: '0.65rem',
          animation: 'bdigiPopupSlideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
          overflow: 'hidden'
        }}
      >
        {/* Top Content Row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.65rem' }}>
          
          {/* App Icon & Details */}
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
              fontSize: '1.15rem',
              flexShrink: 0,
              boxShadow: '0 4px 14px rgba(249, 115, 22, 0.45)'
            }}>
              B
            </div>

            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <h4 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 800, color: '#ffffff', whiteSpace: 'nowrap' }}>
                  {isAppInstalled ? 'BDigitizing App' : 'Get the BDigitizing App'}
                </h4>
                <span style={{ fontSize: '0.62rem', background: '#ea580c', color: '#ffffff', fontWeight: 900, padding: '0.1rem 0.4rem', borderRadius: '9999px', letterSpacing: '0.04em' }}>
                  {isAppInstalled ? 'INSTALLED' : 'FREE'}
                </span>
              </div>
              <p style={{ margin: '0.15rem 0 0', fontSize: '0.72rem', color: '#94a3b8', lineHeight: 1.25, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                Fast 1-tap ordering, push notifications & tracking
              </p>
            </div>
          </div>

          {/* Action Button & Cross Close Button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexShrink: 0 }}>
            {isAppInstalled ? (
              <button
                type="button"
                onClick={handleOpenApp}
                style={{
                  background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '0.45rem 0.85rem',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  boxShadow: '0 4px 12px rgba(249, 115, 22, 0.35)',
                  whiteSpace: 'nowrap'
                }}
              >
                <Smartphone size={13} />
                <span>Open App</span>
              </button>
            ) : (
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
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  boxShadow: '0 4px 12px rgba(249, 115, 22, 0.35)',
                  whiteSpace: 'nowrap'
                }}
              >
                <Download size={13} />
                <span>Install App</span>
              </button>
            )}

            {/* Cross Button (Immediate Removal) */}
            <button
              type="button"
              onClick={handleDismiss}
              style={{
                background: 'rgba(255, 255, 255, 0.12)',
                border: 'none',
                color: '#cbd5e1',
                borderRadius: '50%',
                width: '30px',
                height: '30px',
                minWidth: '30px',
                minHeight: '30px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'background 0.2s, color 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)';
                e.currentTarget.style.color = '#ffffff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
                e.currentTarget.style.color = '#cbd5e1';
              }}
              aria-label="Close install popup"
              title="Close"
            >
              <X size={15} />
            </button>
          </div>

        </div>

        {/* Bottom Auto-Dismiss Progress Indicator */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '2.5px',
          background: 'rgba(255, 255, 255, 0.08)',
          overflow: 'hidden'
        }}>
          <div 
            className={`bdigi-install-popup-progress ${isPaused ? 'paused' : ''}`}
            style={{
              height: '100%',
              background: 'linear-gradient(90deg, #f97316, #ea580c)'
            }} 
          />
        </div>
      </div>

      {/* iOS Safari Add to Home Screen Instructions Modal */}
      {showIOSInstructions && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(6px)',
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
              position: 'relative',
              animation: 'bdigiPopupSlideUp 0.3s ease-out'
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
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#64748b'
              }}
              aria-label="Close"
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
                <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#fff7ed', color: '#ea580c', fontWeight: 800, fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>1</span>
                <span style={{ fontSize: '0.82rem', color: '#1e293b' }}>Tap the <strong>Share</strong> button <Share size={14} style={{ display: 'inline', verticalAlign: 'middle', margin: '0 2px' }} /> in Safari</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#fff7ed', color: '#ea580c', fontWeight: 800, fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>2</span>
                <span style={{ fontSize: '0.82rem', color: '#1e293b' }}>Scroll down and tap <strong>Add to Home Screen</strong> <PlusSquare size={14} style={{ display: 'inline', verticalAlign: 'middle', margin: '0 2px' }} /></span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#fff7ed', color: '#ea580c', fontWeight: 800, fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>3</span>
                <span style={{ fontSize: '0.82rem', color: '#1e293b' }}>Tap <strong>Add</strong> at the top right to install</span>
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

      {/* Android Chrome Manual Instructions Modal (Fallback if beforeinstallprompt was suppressed) */}
      {showAndroidInstructions && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(6px)',
            zIndex: 100000,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            padding: '1rem'
          }}
          onClick={() => setShowAndroidInstructions(false)}
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
              position: 'relative',
              animation: 'bdigiPopupSlideUp 0.3s ease-out'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowAndroidInstructions(false)}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: '#f1f5f9',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#64748b'
              }}
              aria-label="Close"
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
              Install BDigitizing on Android
            </h3>
            <p style={{ margin: '0 0 1.25rem', fontSize: '0.85rem', color: '#64748b', lineHeight: 1.4 }}>
              Fast 1-tap ordering, push notifications & instant file tracking.
            </p>

            <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '1rem', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#fff7ed', color: '#ea580c', fontWeight: 800, fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>1</span>
                <span style={{ fontSize: '0.82rem', color: '#1e293b' }}>Tap the Chrome menu <MoreVertical size={14} style={{ display: 'inline', verticalAlign: 'middle', margin: '0 2px' }} /> (three dots at top right)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#fff7ed', color: '#ea580c', fontWeight: 800, fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>2</span>
                <span style={{ fontSize: '0.82rem', color: '#1e293b' }}>Select <strong>Install app</strong> or <strong>Add to Home screen</strong></span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#fff7ed', color: '#ea580c', fontWeight: 800, fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>3</span>
                <span style={{ fontSize: '0.82rem', color: '#1e293b' }}>Tap <strong>Install</strong> to add BDigitizing to your phone</span>
              </div>
            </div>

            <button
              onClick={() => setShowAndroidInstructions(false)}
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
