'use client';

import React, { useEffect, useRef } from 'react';
import { useLocation } from '../../utils/navigation';
import { useAppState } from '../../context/StateContext';

// Direct, bulletproof DOM injector for Meta Pixel to guarantee instant detection by Meta Pixel Helper
export const injectMetaPixel = (pixelId) => {
  if (typeof window === 'undefined') return;
  const cleanId = String(pixelId || '').trim();
  if (!cleanId) return;

  // 1. Initialize official fbq queue stub
  if (!window.fbq) {
    const n = function() {
      if (n.callMethod) {
        n.callMethod.apply(n, arguments);
      } else {
        n.queue.push(arguments);
      }
    };
    if (!window._fbq) window._fbq = n;
    n.push = n;
    n.loaded = true;
    n.version = '2.0';
    n.queue = [];
    window.fbq = n;
  }

  // 2. Ensure official https://connect.facebook.net/en_US/fbevents.js script is in document.head
  let scriptEl = document.getElementById('facebook-jssdk-pixel');
  if (!scriptEl) {
    scriptEl = document.createElement('script');
    scriptEl.id = 'facebook-jssdk-pixel';
    scriptEl.async = true;
    scriptEl.src = 'https://connect.facebook.net/en_US/fbevents.js';
    const firstScript = document.getElementsByTagName('script')[0];
    if (firstScript && firstScript.parentNode) {
      firstScript.parentNode.insertBefore(scriptEl, firstScript);
    } else {
      document.head.appendChild(scriptEl);
    }
  }

  // 3. Initialize the Pixel ID and track PageView
  if (window._fbq_active_pixel_id !== cleanId) {
    window.fbq('init', cleanId);
    window.fbq('track', 'PageView');
    window._fbq_active_pixel_id = cleanId;
    try {
      localStorage.setItem('meta_pixel_id', cleanId);
    } catch {}
  }
};

// Helper to resolve accurate user identity (e.g. "Haji Ramzan (haji.ramzan@gmail.com)" or "Platform Admin")
export const resolveUserIdentity = (userObj = null, customRole = null) => {
  if (customRole) return customRole;

  if (userObj && typeof userObj === 'object') {
    if (userObj.role === 'admin') {
      return userObj.email ? `Platform Admin (${userObj.email})` : 'Platform Admin';
    }
    const name = userObj.name || userObj.fullName || userObj.user_metadata?.full_name || 'Customer';
    if (userObj.email) {
      return `${name} (${userObj.email})`;
    }
    return name;
  }

  // Check localStorage for logged-in user details
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('auth_user') || localStorage.getItem('bdigi_auth_user');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === 'object') {
          if (parsed.role === 'admin') {
            return parsed.email ? `Platform Admin (${parsed.email})` : 'Platform Admin';
          }
          const name = parsed.name || parsed.fullName || 'Customer';
          if (parsed.email) {
            return `${name} (${parsed.email})`;
          }
          return name;
        }
      }
    } catch {}
  }

  return 'Guest Visitor';
};

export const MetaPixelTracker = () => {
  const { siteSettings, authUser } = useAppState();
  const location = useLocation();
  const pathname = location?.pathname || '';
  const prevPathRef = useRef('');

  // Extract pixel ID with multiple robust fallbacks
  const activePixelId = (
    siteSettings?.metaPixelId ||
    (typeof window !== 'undefined' ? localStorage.getItem('meta_pixel_id') : '') ||
    process.env.NEXT_PUBLIC_META_PIXEL_ID ||
    ''
  ).trim();

  // 1. Immediately inject and initialize when ID is available
  useEffect(() => {
    if (activePixelId) {
      injectMetaPixel(activePixelId);
    }
  }, [activePixelId]);

  // 2. Track route changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (prevPathRef.current === pathname) return;
    prevPathRef.current = pathname;

    if (activePixelId) {
      injectMetaPixel(activePixelId);
    }

    if (window.fbq) {
      window.fbq('track', 'PageView', {
        page_path: pathname,
        page_title: typeof document !== 'undefined' ? document.title : ''
      });
    }

    // Auto-detect high-intent content pages for ViewContent event
    let viewContentData = null;
    if (pathname.includes('/services/embroidery-digitizing')) {
      viewContentData = { content_name: 'Embroidery Digitizing', content_category: 'Embroidery Digitizing Service', content_type: 'service', value: 10.00, currency: 'USD' };
    } else if (pathname.includes('/services/vector-tracing')) {
      viewContentData = { content_name: 'Vector Art Tracing', content_category: 'Vector Art Service', content_type: 'service', value: 8.00, currency: 'USD' };
    } else if (pathname.includes('/custom-patches')) {
      viewContentData = { content_name: 'Custom Patches', content_category: 'Physical Patches Service', content_type: 'product', value: 150.00, currency: 'USD' };
    } else if (pathname.includes('/pricing')) {
      viewContentData = { content_name: 'Commercial Pricing Table', content_category: 'Pricing', content_type: 'service' };
    } else if (pathname.includes('/portfolio')) {
      viewContentData = { content_name: 'Production Showcase Portfolio', content_category: 'Portfolio', content_type: 'gallery' };
    }

    if (viewContentData && window.fbq) {
      window.fbq('track', 'ViewContent', viewContentData);
    }

    // Log to Supabase Tracking Events Table
    import('../../services/supabaseService').then(({ logTrackingEventToSupabase }) => {
      const role = resolveUserIdentity(authUser);
      logTrackingEventToSupabase({
        eventName: viewContentData ? 'ViewContent' : 'PageView',
        userRole: role,
        source: 'Visitor browser',
        trafficSource: window.location.hostname || 'Direct',
        value: viewContentData?.value ? `$${viewContentData.value}` : '—',
        pagePath: pathname
      });
    }).catch(() => {});
  }, [pathname, activePixelId, authUser]);

  return null;
};

// Standard and Custom Meta Pixel Event Dispatcher for the entire application
export const trackMetaEvent = (eventName, data = {}, customUserRole = null) => {
  if (typeof window === 'undefined') return;

  const currentId = (
    (typeof window !== 'undefined' ? localStorage.getItem('meta_pixel_id') : '') ||
    process.env.NEXT_PUBLIC_META_PIXEL_ID ||
    ''
  ).trim();

  if (currentId) {
    injectMetaPixel(currentId);
  }

  const standardEvents = [
    'PageView',
    'ViewContent',
    'Search',
    'AddToCart',
    'AddToWishlist',
    'InitiateCheckout',
    'AddPaymentInfo',
    'Purchase',
    'Lead',
    'CompleteRegistration',
    'Contact',
    'CustomizeProduct',
    'Donate',
    'FindLocation',
    'Schedule',
    'StartTrial',
    'SubmitApplication',
    'Subscribe'
  ];

  const isStandard = standardEvents.includes(eventName);

  if (window.fbq) {
    if (isStandard) {
      window.fbq('track', eventName, data);
    } else {
      window.fbq('trackCustom', eventName, data);
    }
  }

  // Persist to Supabase tracking_events table for Admin Analytics
  import('../../services/supabaseService').then(({ logTrackingEventToSupabase }) => {
    const role = resolveUserIdentity(null, customUserRole);
    const valueStr = data?.value !== undefined ? (typeof data.value === 'number' ? `$${data.value.toFixed(2)}` : String(data.value)) : '—';

    logTrackingEventToSupabase({
      eventName: eventName,
      userRole: role,
      source: 'Visitor browser',
      trafficSource: window.location.hostname || 'Direct',
      value: valueStr,
      pagePath: window.location.pathname || '/'
    });
  }).catch(() => {});
};
