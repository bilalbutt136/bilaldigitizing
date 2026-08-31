'use client';

import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook to track Visual Viewport changes (iOS Safari & Android Chrome virtual keyboard events).
 * Ensures chat input bars and scroll containers smoothly resize without double-scrolling or clipping.
 */
export function useVisualViewport() {
  const [viewportHeight, setViewportHeight] = useState(typeof window !== 'undefined' ? window.innerHeight : 0);
  const [keyboardOffset, setKeyboardOffset] = useState(0);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      if (!window.visualViewport) {
        setViewportHeight(window.innerHeight);
        return;
      }

      const vv = window.visualViewport;
      setViewportHeight(vv.height);

      // Keyboard offset is difference between outer window height and visual viewport height
      const offset = Math.max(0, window.innerHeight - vv.height - (vv.offsetTop || 0));
      setKeyboardOffset(offset);
      const isKeyboardActive = offset > 40;
      setIsKeyboardOpen(isKeyboardActive);

      if (isKeyboardActive) {
        document.body.classList.add('chat-keyboard-active');
      } else {
        document.body.classList.remove('chat-keyboard-active');
      }
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize);
      window.visualViewport.addEventListener('scroll', handleResize);
    } else {
      window.addEventListener('resize', handleResize);
    }

    handleResize();

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleResize);
        window.visualViewport.removeEventListener('scroll', handleResize);
      } else {
        window.removeEventListener('resize', handleResize);
      }
      document.body.classList.remove('chat-keyboard-active');
    };
  }, []);

  return {
    viewportHeight,
    keyboardOffset,
    isKeyboardOpen
  };
}
