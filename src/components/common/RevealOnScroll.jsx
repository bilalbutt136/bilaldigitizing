'use client';

import { useEffect } from 'react';

/**
 * Global scroll-reveal driver.
 * Observes every element with `.reveal` and adds `.reveal-visible`
 * once it enters the viewport. Also watches for newly mounted
 * `.reveal` elements after client-side navigation. Mount once per layout.
 */
export const RevealOnScroll = () => {
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

    let observer;
    const seen = new WeakSet();

    const observeNew = () => {
      document.querySelectorAll('.reveal:not(.reveal-visible)').forEach((el) => {
        if (!seen.has(el)) {
          seen.add(el);
          observer.observe(el);
        }
      });
    };

    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('reveal-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    observeNew();

    const mutationObserver = new MutationObserver(observeNew);
    mutationObserver.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      mutationObserver.disconnect();
    };
  }, []);

  return null;
};
