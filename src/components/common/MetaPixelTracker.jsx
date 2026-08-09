'use client';

import React, { useEffect, useState } from 'react';
import Script from 'next/script';
import { useLocation } from '../../utils/navigation';
import { useAppState } from '../../context/StateContext';

export const MetaPixelTracker = () => {
  const { siteSettings, authUser } = useAppState();
  const location = useLocation();
  const pathname = location?.pathname || '';
  
  // Extract pixel ID from settings. Default to empty if not configured.
  const pixelId = siteSettings?.metaPixelId || '';
  const [initialized, setInitialized] = useState(false);

  // Trigger PageView on route change if pixel is initialized
  useEffect(() => {
    if (initialized && pixelId && typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'PageView');
      
      // Also log the event to our Supabase database for the Activity Log
      import('../../services/supabaseService').then(({ logTrackingEventToSupabase }) => {
        const role = authUser?.role === 'admin' || authUser?.email === 'shahidbutt59191@gmail.com' ? 'Platform Admin' : 
                     (authUser ? 'Authenticated User' : 'Guest Visitor');
        
        logTrackingEventToSupabase({
          eventName: 'PageView',
          userRole: role,
          source: 'Visitor browser',
          trafficSource: window.location.hostname || 'Direct',
          value: '—',
          pagePath: pathname
        });
      });
    }
  }, [pathname, initialized, pixelId, authUser]);

  if (!pixelId) return null;

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
            fbq('init', '${pixelId}');
            fbq('track', 'PageView');
          `,
        }}
        onLoad={() => setInitialized(true)}
      />
      <noscript>
        <img 
          height="1" 
          width="1" 
          style={{ display: 'none' }}
          src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  );
};

// Utility function to track custom events manually from any component
export const trackMetaEvent = (eventName, data = {}) => {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', eventName, data);
    
    import('../../services/supabaseService').then(({ logTrackingEventToSupabase }) => {
      // In standalone calls we might not have authUser easily available, default to Visitor or rely on context
      logTrackingEventToSupabase({
        eventName: eventName,
        userRole: 'Platform Admin', // Usually admins trigger manual events like purchases in admin panel test
        source: 'Visitor browser',
        trafficSource: window.location.hostname || 'Direct',
        value: data?.value || '—',
        pagePath: window.location.pathname || '/'
      });
    });
  }
};
