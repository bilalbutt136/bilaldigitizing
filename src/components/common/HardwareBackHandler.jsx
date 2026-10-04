'use client';

import { useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAppState } from '../../context/StateContext';
import { hasActiveModals, popTopModal, isModalBackConsumed } from '../../utils/modalHistoryManager';

/**
 * Global Mobile Hardware & Gesture Back Button Navigation Handler
 * 
 * Works seamlessly across:
 * - Native Android wrappers (Capacitor / Cordova @capacitor/app backButton)
 * - Progressive Web Apps (PWA standalone mode / TWA)
 * - Mobile web browsers (Android Chrome, Samsung Internet, mobile Safari)
 *
 * Implements standard native 3-tier back navigation:
 * 1. Step A (Overlays First): Closes active modals, drawers, menus, or lightboxes first.
 * 2. Step B (In-app History): Navigates inner screens / tabs back to parent (e.g. router.back() or sub-tab -> home).
 * 3. Step C (Exit Confirmation): On root screen ('/'), intercepts exit and displays
 *    a native "Press back again to exit" toast within a 2-second window.
 */
export function HardwareBackHandler() {
  const router = useRouter();
  const pathname = usePathname() || '/';
  const { mobileTab, setMobileTab, mobileMode, showToast } = useAppState();

  const lastExitPressRef = useRef(0);
  const isNavigatingRef = useRef(false);

  // Keep references to latest states to avoid stale closures in event listeners
  const stateRef = useRef({
    pathname,
    mobileTab,
    mobileMode,
    setMobileTab,
    showToast
  });

  useEffect(() => {
    stateRef.current = {
      pathname,
      mobileTab,
      mobileMode,
      setMobileTab,
      showToast
    };
  }, [pathname, mobileTab, mobileMode, setMobileTab, showToast]);

  // 1. Prime the browser history stack on root screen for PWA / Mobile Web
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const isRoot = (pathname === '/' || pathname === '');
    if (isRoot) {
      try {
        const currentState = window.history.state || {};
        if (!currentState._bdigi_anchor) {
          window.history.pushState(
            { ...currentState, _bdigi_anchor: true, path: '/' },
            '',
            window.location.href
          );
        }
      } catch {}
    }
  }, [pathname]);

  // 2. Main hardware back button decision engine
  const handleBackAction = (canGoBackFromNative = false) => {
    const {
      pathname: currentPath,
      mobileTab: currentTab,
      mobileMode: currentMode,
      setMobileTab: updateMobileTab,
      showToast: triggerToast
    } = stateRef.current;

    // Step A: Overlays First
    // If any modal, lightbox, or drawer is in the active stack, close it first
    if (hasActiveModals()) {
      const popped = popTopModal();
      if (popped) return true; // Consumed by modal
    }

    // Check if an open DOM overlay / mobile navigation menu exists
    const openMobileMenu = document.querySelector('[data-mobile-menu-open="true"], .mobile-nav-active');
    if (openMobileMenu) {
      window.dispatchEvent(new CustomEvent('bdigi_close_menu'));
      return true;
    }

    // Step B (Sub-tabs): If in mobile app mode and on an inner tab, navigate back to 'home'
    if (currentMode === 'app' && currentTab && currentTab !== 'home') {
      if (typeof updateMobileTab === 'function') {
        updateMobileTab('home');
      }
      return true;
    }

    const isRootScreen = (currentPath === '/' || currentPath === '');

    // Step B (In-app Routes): If on an inner page (/portfolio, /pricing, /orders, etc.)
    if (!isRootScreen) {
      if (isNavigatingRef.current) return true;
      isNavigatingRef.current = true;
      setTimeout(() => { isNavigatingRef.current = false; }, 400);

      if (typeof window !== 'undefined' && (canGoBackFromNative || window.history.length > 1)) {
        try {
          router.back();
        } catch {
          router.push('/');
        }
      } else {
        router.push('/');
      }
      return true;
    }

    // Step C: Root screen exit confirmation ("Press back again to exit")
    const now = Date.now();
    const isWithinDoublePressWindow = lastExitPressRef.current > 0 && (now - lastExitPressRef.current < 2000);

    if (isWithinDoublePressWindow) {
      // Second press within 2000ms: Allow exit
      lastExitPressRef.current = 0;
      if (window.Capacitor?.Plugins?.App?.exitApp) {
        try {
          window.Capacitor.Plugins.App.exitApp();
        } catch {}
      }
      return false; // Not consumed: allow default browser/app exit
    }

    // First press: Show confirmation toast and re-prime history
    lastExitPressRef.current = now;
    if (typeof triggerToast === 'function') {
      triggerToast('Press back again to exit', 'info');
    }

    // Re-prime the root anchor state in browser / PWA history so tab doesn't close
    if (typeof window !== 'undefined') {
      try {
        const currentState = window.history.state || {};
        window.history.pushState(
          { ...currentState, _bdigi_anchor: true, path: '/' },
          '',
          window.location.href
        );
      } catch {}
    }

    return true; // Consumed
  };

  // 3. Listener for Native Capacitor Android Hardware Back Button
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let removeListenerFn = null;
    const capacitorApp = window.Capacitor?.Plugins?.App;

    if (capacitorApp?.addListener) {
      capacitorApp.addListener('backButton', ({ canGoBack }) => {
        handleBackAction(canGoBack);
      }).then(handle => {
        if (handle && typeof handle.remove === 'function') {
          removeListenerFn = () => handle.remove();
        }
      }).catch(err => {
        console.warn('[HardwareBackHandler] Capacitor backButton listener error:', err);
      });
    }

    return () => {
      if (removeListenerFn) {
        try { removeListenerFn(); } catch {}
      }
    };
  }, []);

  // 4. Listener for Mobile Browser / PWA PopState (Hardware Back & Swipe Gestures)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handlePopState = (_e) => {
      // If modalHistoryManager already consumed this popstate, ignore
      if (isModalBackConsumed()) {
        return;
      }

      const consumed = handleBackAction(false);
      if (consumed) {
        // Event was handled (overlay closed, tab navigated, or exit prevented)
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  return null;
}

export default HardwareBackHandler;
