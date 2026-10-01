'use client';

import { useEffect } from 'react';
import { useAppState } from '../../context/StateContext';

/**
 * DynamicFavicon
 * Reads siteSettings.faviconUrl from Supabase (via StateContext) and live-patches
 * the href of existing <link rel="icon"> elements in place WITHOUT removing DOM nodes.
 * This prevents breaking Next.js / React 19 head reconciliation during route transitions.
 */
export const DynamicFavicon = () => {
  const { siteSettings } = useAppState();
  const faviconUrl = siteSettings?.faviconUrl;

  useEffect(() => {
    if (!faviconUrl) return;

    try {
      const cacheBustUrl = faviconUrl + (faviconUrl.includes('?') ? '&' : '?') + 't=' + encodeURIComponent(faviconUrl.slice(-10));

      const existingIcons = document.querySelectorAll(
        'link[rel="icon"], link[rel="shortcut icon"], link[rel="alternate icon"]'
      );

      if (existingIcons.length > 0) {
        existingIcons.forEach((link) => {
          link.href = cacheBustUrl;
        });
      } else {
        const link = document.createElement('link');
        link.rel = 'icon';
        link.href = cacheBustUrl;
        document.head.appendChild(link);
      }
    } catch {}
  }, [faviconUrl]);

  // This component renders nothing — it's a pure side-effect hook
  return null;
};
