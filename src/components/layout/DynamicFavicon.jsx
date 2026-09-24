'use client';

import { useEffect } from 'react';
import { useAppState } from '../../context/StateContext';

/**
 * DynamicFavicon
 * Reads siteSettings.faviconUrl from Supabase (via StateContext) and live-patches
 * every <link rel="icon"> / <link rel="shortcut icon"> element in the DOM.
 * This overrides the static /favicon.svg injected by the server-rendered layout.jsx
 * so the admin-uploaded favicon appears correctly after every page load / navigation.
 */
export const DynamicFavicon = () => {
  const { siteSettings } = useAppState();
  const faviconUrl = siteSettings?.faviconUrl;

  useEffect(() => {
    if (!faviconUrl) return;

    const apply = () => {
      const url = faviconUrl + (faviconUrl.includes('?') ? '&' : '?') + 'v=' + encodeURIComponent(faviconUrl.slice(-8));

      // Update every existing icon link in the head
      const existing = document.querySelectorAll(
        'link[rel="icon"], link[rel="shortcut icon"], link[rel="alternate icon"]'
      );
      existing.forEach((el) => {
        el.setAttribute('href', url);
        el.removeAttribute('type'); // remove svg/png type so browser re-evaluates
      });

      // If no icon link exists yet, create one
      if (existing.length === 0) {
        const link = document.createElement('link');
        link.rel = 'icon';
        link.href = url;
        document.head.appendChild(link);
      }
    };

    // Apply immediately and once DOM is guaranteed ready
    apply();
  }, [faviconUrl]);

  // This component renders nothing — it's a pure side-effect hook
  return null;
};
