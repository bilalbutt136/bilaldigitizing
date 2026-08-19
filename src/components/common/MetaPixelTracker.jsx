'use client';

import React, { useEffect, useRef } from 'react';
import Script from 'next/script';
import { useLocation } from '../../utils/navigation';
import { useAppState } from '../../context/StateContext';

// Helper to ensure window.fbq stub exists immediately for zero-loss queueing
const ensureFbqStub = () => {
  if (typeof window === 'undefined') return;
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
};

export const MetaPixelTracker = () => {
  const { siteSettings, authUser } = useAppState();
  const location = useLocation();
  const pathname = location?.pathname || '';
  const prevPathRef = useRef('');

  // Extract pixel ID from settings, localStorage, or environment variable
  const activePixelId = (
    siteSettings?.metaPixelId ||
    (typeof window !== 'undefined' ? localStorage.getItem('meta_pixel_id') : '') ||
    process.env.NEXT_PUBLIC_META_PIXEL_ID ||
    ''
  ).trim();

  // 1. Immediately ensure queue stub is alive
  useEffect(() => {
    ensureFbqStub();
  }, []);

  // 2. Initialize pixel when ID becomes available
  useEffect(() => {
    if (activePixelId && typeof window !== 'undefined') {
      ensureFbqStub();
      if (window._fbq_initialized_id !== activePixelId) {
        window.fbq('init', activePixelId);
        window._fbq_initialized_id = activePixelId;
        try {
          localStorage.setItem('meta_pixel_id', activePixelId);
        } catch {}
      }
    }
  }, [activePixelId]);

  // 3. Automatic PageView & ViewContent on Route Change
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (prevPathRef.current === pathname) return; // Prevent duplicate triggers on same page
    prevPathRef.current = pathname;

    ensureFbqStub();

    const role = authUser?.role === 'admin' ? 'Platform Admin' :
                 (authUser ? 'Authenticated User' : 'Guest Visitor');

    // Always fire PageView on route navigation
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

  if (!activePixelId) return null;

  return (
    <>
      <Script
        id="fb-pixel"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${activePixelId}');
          `,
        }}
      />
      <noscript>
        <img 
          height="1" 
          width="1" 
          style={{ display: 'none' }}
          src={`https://www.facebook.com/tr?id=${activePixelId}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  );
};

// Standard and Custom Meta Pixel Event Dispatcher for the entire application
export const trackMetaEvent = (eventName, data = {}, customUserRole = null) => {
  if (typeof window === 'undefined') return;

  ensureFbqStub();

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
    let role = customUserRole;
    if (!role) {
      try {
        const storedUser = localStorage.getItem('auth_user') || localStorage.getItem('supabase.auth.token');
        if (storedUser && (storedUser.includes('"role":"admin"') || storedUser.includes('"admin"'))) {
          role = 'Platform Admin';
        } else if (storedUser) {
          role = 'Authenticated User';
        } else {
          role = 'Guest Visitor';
        }
      } catch {
        role = 'Guest Visitor';
      }
    }

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
