'use client';

import { useEffect, useRef, useCallback } from 'react';
import { pushModal, dismissModal } from '../utils/modalHistoryManager';

/**
 * Hook to automatically integrate any React modal or drawer with
 * mobile hardware back navigation and history synchronization.
 *
 * @param {Object} options
 * @param {boolean} options.isOpen - Whether the modal is currently open
 * @param {() => void} options.onClose - Callback to close the modal
 * @param {string} options.modalId - Unique string identifier for this modal instance
 * @returns {{ handleSafeClose: () => void }}
 */
export function useModalBackNavigation({ isOpen, onClose, modalId }) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const isRegisteredRef = useRef(false);

  useEffect(() => {
    if (!isOpen) return;

    // Check if back navigation is needed (mobile device or standalone app or test env)
    // On wide desktop screens where users don't have mobile back buttons, we do NOT manipulate
    // window.history, leaving Next.js App Router internal navigation untouched.
    const isDesktopWeb = typeof window !== 'undefined' && 
      typeof window.innerWidth === 'number' &&
      window.innerWidth > 768 && 
      !window.matchMedia?.('(display-mode: standalone)')?.matches &&
      !window.navigator?.standalone &&
      !new URLSearchParams(window.location?.search || '').get('app') &&
      !document.documentElement?.classList?.contains('mobile-app-active');

    if (isDesktopWeb) {
      return;
    }

    isRegisteredRef.current = true;
    pushModal(modalId, () => {
      isRegisteredRef.current = false;
      if (typeof onCloseRef.current === 'function') {
        onCloseRef.current();
      }
    });

    return () => {
      if (isRegisteredRef.current) {
        isRegisteredRef.current = false;
        dismissModal(modalId);
      }
    };
  }, [isOpen, modalId]);

  // Safe programmatic close function to pass to on-screen "X" or Back buttons
  const handleSafeClose = useCallback(() => {
    if (isRegisteredRef.current) {
      isRegisteredRef.current = false;
      dismissModal(modalId);
    }
    if (typeof onCloseRef.current === 'function') {
      onCloseRef.current();
    }
  }, [modalId]);

  return { handleSafeClose };
}

export default useModalBackNavigation;
