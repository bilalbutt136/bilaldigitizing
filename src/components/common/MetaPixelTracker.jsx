'use client';

import React, { useEffect, useRef } from 'react';
import { useLocation } from '../../utils/navigation';
import { useAppState } from '../../context/StateContext';
import { getVisitorTelemetry, generateUUID, resolveUserIdentity } from '../../utils/visitorTracker';
import { dedupeRouteTransition } from '../../utils/throttleDebounce.js';
import { extractMetaPixelId } from '../../utils/pixelUtils.js';

/**
 * Direct DOM injector for custom header tracking scripts (e.g. noscript tags or extra analytics)
 */
export const injectCustomHeaderScript = (scriptContent) => {
  if (typeof window === 'undefined' || !scriptContent) return;
  const trimmed = String(scriptContent).trim();
  if (!trimmed) return;

  const existingEl = document.getElementById('bdigi-custom-header-script');
  if (existingEl) {
    if (existingEl.getAttribute('data-content-hash') === String(trimmed.length)) {
      return;
    }
    existingEl.remove();
  }

  const container = document.createElement('div');
  container.id = 'bdigi-custom-header-script';
  container.setAttribute('data-content-hash', String(trimmed.length));
  container.style.display = 'none';
  container.innerHTML = trimmed;

  const scripts = container.querySelectorAll('script');
  scripts.forEach((oldScript) => {
    const newScript = document.createElement('script');
    Array.from(oldScript.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value));
    newScript.appendChild(document.createTextNode(oldScript.innerHTML));
    oldScript.parentNode.replaceChild(newScript, oldScript);
  });

  document.head.appendChild(container);
};

/**
 * Direct DOM injector for official Meta Pixel to guarantee instant detection by Meta Pixel Helper
 */
export const injectMetaPixel = (pixelId, advancedMatching = null) => {
  if (typeof window === 'undefined') return;
  const cleanId = extractMetaPixelId(pixelId) || String(pixelId || '').trim();
  if (!cleanId || !/^\d{9,20}$/.test(cleanId)) return;

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
  let scriptEl = document.getElementById('facebook-jssdk-pixel') ||
    document.querySelector('script[src*="connect.facebook.net/en_US/fbevents.js"]');
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

  // 3. Initialize the Pixel ID with Advanced Matching.
  // Route tracking below emits exactly one PageView per initial load/navigation.
  const matchPayload = (advancedMatching && typeof advancedMatching === 'object') ? advancedMatching : {};
  if (window._fbq_active_pixel_id !== cleanId) {
    if (Object.keys(matchPayload).length > 0) {
      window.fbq('init', cleanId, matchPayload);
    } else {
      window.fbq('init', cleanId);
    }
    window._fbq_active_pixel_id = cleanId;
    try {
      localStorage.setItem('meta_pixel_id', cleanId);
    } catch {}
  }
};

export { resolveUserIdentity };

/**
 * Builds Meta Advanced Matching data from user object
 */
const buildAdvancedMatchingData = (user) => {
  if (!user || typeof user !== 'object') return {};
  const data = {};
  if (user.email) data.em = String(user.email).trim().toLowerCase();
  if (user.phone) data.ph = String(user.phone).replace(/\D/g, '');
  if (user.name || user.fullName) {
    const parts = String(user.name || user.fullName).trim().split(' ');
    data.fn = parts[0] ? parts[0].toLowerCase() : '';
    data.ln = parts.slice(1).join(' ') ? parts.slice(1).join(' ').toLowerCase() : '';
  }
  if (user.id) data.external_id = String(user.id);
  return data;
};

export const MetaPixelTracker = () => {
  const { siteSettings, authUser } = useAppState();
  const location = useLocation();
  const pathname = location?.pathname || '';
  const prevPathRef = useRef('');

  // Extract pixel ID with multiple robust fallbacks and smart extraction
  const rawPixelId = (
    siteSettings?.metaPixelId ||
    (typeof window !== 'undefined' ? localStorage.getItem('meta_pixel_id') : '') ||
    process.env.NEXT_PUBLIC_META_PIXEL_ID ||
    ''
  );
  const activePixelId = extractMetaPixelId(rawPixelId) || String(rawPixelId || '').trim();

  // 0. Inject custom header tracking script if configured
  useEffect(() => {
    if (siteSettings?.customHeaderScript) {
      injectCustomHeaderScript(siteSettings.customHeaderScript);
    }
  }, [siteSettings?.customHeaderScript]);

  // 1. Immediately inject and initialize when ID is available
  useEffect(() => {
    if (activePixelId) {
      const matchData = buildAdvancedMatchingData(authUser);
      injectMetaPixel(activePixelId, matchData);
    }
  }, [activePixelId, authUser]);

  // 2. Track route changes with full visitor telemetry
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (prevPathRef.current === pathname) return;
    if (!dedupeRouteTransition(`meta_pixel_nav:${pathname}`, 5000)) return;
    prevPathRef.current = pathname;

    // Do not log page views or conversion telemetry on 404 error routes
    if (pathname.includes('404') || (typeof document !== 'undefined' && document.title.includes('404'))) return;
    if (pathname.startsWith('/legal/') || pathname === '/about' || pathname === '/locations' || pathname === '/glossary') return;

    const matchData = buildAdvancedMatchingData(authUser);
    if (activePixelId) {
      injectMetaPixel(activePixelId, matchData);
    }

    // Capture complete technical, attribution, device, and session details
    const telemetry = getVisitorTelemetry(authUser);
    const eventId = generateUUID();

    // Fire PageView to Meta Pixel with rich event metadata
    if (activePixelId && window.fbq) {
      window.fbq('track', 'PageView', {
        page_title: telemetry.pageTitle,
        page_path: telemetry.pagePath,
        page_location: telemetry.pageUrl,
        referrer: telemetry.referrer || 'Direct',
        traffic_source: telemetry.trafficSource,
        traffic_channel: telemetry.trafficChannel,
        device: telemetry.deviceType,
        os: telemetry.os,
        browser: telemetry.browser,
        utm_source: telemetry.utmSource,
        utm_medium: telemetry.utmMedium,
        utm_campaign: telemetry.utmCampaign,
        utm_term: telemetry.utmTerm,
        utm_content: telemetry.utmContent,
        fbclid: telemetry.fbclid,
        screen: telemetry.screenResolution,
        visitor_id: telemetry.visitorId,
        session_id: telemetry.sessionId,
        visit_count: telemetry.visitCount
      }, { eventID: eventId });
    }

    // Auto-detect high-intent content pages for standard ViewContent event
    let viewContentData = null;
    let standardEventName = null;

    if (pathname.includes('/services/embroidery-digitizing')) {
      standardEventName = 'ViewContent';
      viewContentData = { 
        content_name: 'Embroidery Digitizing', 
        content_category: 'Embroidery Digitizing Services', 
        content_type: 'service', 
        value: 10.00, 
        currency: 'USD' 
      };
    } else if (pathname.includes('/services/vector-tracing')) {
      standardEventName = 'ViewContent';
      viewContentData = { 
        content_name: 'Vector Art Tracing', 
        content_category: 'Vector Art Services', 
        content_type: 'service', 
        value: 8.00, 
        currency: 'USD' 
      };
    } else if (pathname.includes('/custom-patches')) {
      standardEventName = 'ViewContent';
      viewContentData = { 
        content_name: 'Custom Physical Patches', 
        content_category: 'Physical Manufactured Emblems', 
        content_type: 'product', 
        value: 150.00, 
        currency: 'USD' 
      };
    } else if (pathname.includes('/pricing')) {
      standardEventName = 'ViewContent';
      viewContentData = { 
        content_name: 'Commercial Pricing Packages', 
        content_category: 'Pricing', 
        content_type: 'service' 
      };
    } else if (pathname.includes('/portfolio')) {
      standardEventName = 'ViewContent';
      viewContentData = { 
        content_name: 'Production Showcase Portfolio', 
        content_category: 'Portfolio', 
        content_type: 'gallery' 
      };
    } else if (pathname.includes('/blogs')) {
      standardEventName = 'ViewContent';
      viewContentData = { 
        content_name: 'Embroidery & Vector Knowledgebase', 
        content_category: 'Articles', 
        content_type: 'article' 
      };
    } else if (pathname === '/order' || pathname.includes('/order?')) {
      standardEventName = 'InitiateCheckout';
      viewContentData = { 
        content_name: 'Order Configuration Wizard', 
        content_category: 'Studio Checkout', 
        content_type: 'order' 
      };
    } else if (typeof window !== 'undefined' && (window.location.search.includes('payment=success') || pathname.includes('payment=success'))) {
      standardEventName = 'Purchase';
      const searchParams = new URLSearchParams(window.location.search);
      const paidOrderId = searchParams.get('orderId') || '';
      viewContentData = { 
        content_name: 'Studio Completed Payment', 
        content_category: 'Order Payment', 
        content_type: 'product',
        order_id: paidOrderId || undefined,
        currency: 'USD' 
      };
    }

    if (viewContentData && window.fbq) {
      window.fbq('track', standardEventName, {
        ...viewContentData,
        page_title: telemetry.pageTitle,
        page_path: telemetry.pagePath,
        traffic_source: telemetry.trafficSource,
        device: telemetry.deviceType,
        os: telemetry.os,
        browser: telemetry.browser,
        visitor_id: telemetry.visitorId,
        session_id: telemetry.sessionId
      }, { eventID: `${eventId}_view` });
    }

    // Persist full telemetry to Supabase tracking_events table
    import('../../services/supabaseService').then(({ logTrackingEventToSupabase }) => {
      logTrackingEventToSupabase({
        eventName: standardEventName || 'PageView',
        userRole: telemetry.userRole,
        source: `${telemetry.browser} on ${telemetry.os} (${telemetry.deviceType})`,
        trafficSource: telemetry.trafficSource,
        value: viewContentData?.value ? `$${viewContentData.value.toFixed(2)}` : '—',
        pagePath: telemetry.pagePath,
        eventId: eventId,
        details: {
          ...telemetry,
          eventData: viewContentData || null,
          metaPixelActive: Boolean(activePixelId && window.fbq),
          metaPixelId: activePixelId || null
        }
      });
    }).catch(() => {});
  }, [pathname, activePixelId, authUser]);

  return null;
};

/**
 * Standard and Custom Meta Pixel Event Dispatcher for the entire application
 * Used by checkout, registration, contact forms, and custom offers
 */
export const trackMetaEvent = (eventName, data = {}, customUserRole = null) => {
  if (typeof window === 'undefined') return;

  const rawCurrentId = (
    (typeof window !== 'undefined' ? localStorage.getItem('meta_pixel_id') : '') ||
    process.env.NEXT_PUBLIC_META_PIXEL_ID ||
    ''
  );
  const currentId = extractMetaPixelId(rawCurrentId) || String(rawCurrentId || '').trim();

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
  const telemetry = getVisitorTelemetry(null, customUserRole);
  const eventId = generateUUID();

  const fullEventData = {
    ...data,
    page_title: telemetry.pageTitle,
    page_path: telemetry.pagePath,
    traffic_source: telemetry.trafficSource,
    device: telemetry.deviceType,
    os: telemetry.os,
    browser: telemetry.browser,
    utm_source: telemetry.utmSource,
    utm_campaign: telemetry.utmCampaign,
    fbclid: telemetry.fbclid,
    visitor_id: telemetry.visitorId,
    session_id: telemetry.sessionId
  };

  if (window.fbq) {
    if (isStandard) {
      window.fbq('track', eventName, fullEventData, { eventID: eventId });
    } else {
      window.fbq('trackCustom', eventName, fullEventData, { eventID: eventId });
    }
  }

  // Persist to Supabase tracking_events table with complete metadata
  import('../../services/supabaseService').then(({ logTrackingEventToSupabase }) => {
    const role = telemetry.userRole;
    const valueStr = data?.value !== undefined 
      ? (typeof data.value === 'number' ? `$${data.value.toFixed(2)}` : String(data.value)) 
      : '—';

    logTrackingEventToSupabase({
      eventName: eventName,
      userRole: role,
      source: `${telemetry.browser} on ${telemetry.os} (${telemetry.deviceType})`,
      trafficSource: telemetry.trafficSource,
      value: valueStr,
      pagePath: window.location.pathname || '/',
      eventId: eventId,
      details: {
        ...telemetry,
        customEventData: data,
        metaPixelActive: Boolean(currentId && window.fbq),
        metaPixelId: currentId || null
      }
    });
  }).catch(() => {});
};
