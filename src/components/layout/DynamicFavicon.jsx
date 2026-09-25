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
    const targetUrl = faviconUrl || '/favicon.ico';
    const apply = () => {
      // Remove all previous icon links completely to bypass Chrome/Safari icon caching
      const existing = document.querySelectorAll(
        'link[rel="icon"], link[rel="shortcut icon"], link[rel="alternate icon"], link[rel="apple-touch-icon"]'
      );
      existing.forEach((el) => {
        try { el.parentNode?.removeChild(el); } catch {}
      });

      const cacheBustUrl = targetUrl + (targetUrl.includes('?') ? '&' : '?') + 't=' + (faviconUrl ? encodeURIComponent(faviconUrl.slice(-10)) : 'v4');

      // Create fresh link tags
      const link1 = document.createElement('link');
      link1.rel = 'icon';
      link1.href = cacheBustUrl;

      const link2 = document.createElement('link');
      link2.rel = 'shortcut icon';
      link2.href = cacheBustUrl;

      const link3 = document.createElement('link');
      link3.rel = 'apple-touch-icon';
      link3.href = cacheBustUrl;

      document.head.appendChild(link1);
      document.head.appendChild(link2);
      document.head.appendChild(link3);
    };

    apply();
  }, [faviconUrl]);

  // This component renders nothing — it's a pure side-effect hook
  return null;
};
