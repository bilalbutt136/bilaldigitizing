import '../src/index.css';
import './globals.css';
import { Suspense } from 'react';
import { StateProvider } from '../src/context/StateContext';
import { ErrorBoundary } from '../src/components/ErrorBoundary';
import { ClientLayoutShell } from '../src/components/layout/ClientLayoutShell';

const getMetadataBase = () => {
  const envUrl = (process.env.NEXT_PUBLIC_SITE_URL || '').trim();
  if (envUrl) {
    try {
      const valid = envUrl.startsWith('http://') || envUrl.startsWith('https://') ? envUrl : `https://${envUrl}`;
      return new URL(valid);
    } catch {}
  }
  return new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://bdigitizing.com');
};

export const metadata = {
  metadataBase: getMetadataBase(),
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon.svg', type: 'image/svg+xml' }
    ],
    shortcut: '/favicon.ico',
    apple: '/favicon.svg',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'BDigitizing'
  },
  title: {
    default: 'BDigitizing | Premier Machine Embroidery Digitizing & Vector Art Lab',
    template: '%s | BDigitizing Studio'
  },
  description: 'Commercial Machine Embroidery Digitizing, Vector Art Tracing, & Custom Physical Patches with 4-8 Hour Express Turnaround.',
  keywords: [
    'Embroidery Digitizing',
    'Machine Embroidery Files',
    'DST Format',
    'PES Format',
    'Wilcom EMB Source',
    'Vector Art Tracing',
    'Raster to Vector',
    'Custom Patches',
    '3D Puff Embroidery',
    'Cap Embroidery'
  ],
  authors: [{ name: 'BDigitizing Studio', url: '/' }],
  creator: 'BDigitizing Studio',
  publisher: 'BDigitizing Studio',
  formatDetection: {
    email: false,
    address: false,
    telephone: false
  },
  openGraph: {
    title: 'BDigitizing | Premier Machine Embroidery Digitizing & Vector Art Lab',
    description: 'Commercial Machine Embroidery Digitizing, Vector Art Tracing, & Custom Physical Patches with 4-8 Hour Express Turnaround.',
    url: '/',
    siteName: 'BDigitizing Studio',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: '/icon.svg',
        width: 512,
        height: 512,
        alt: 'BDigitizing Studio Logo',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BDigitizing | Premier Machine Embroidery Digitizing & Vector Art Lab',
    description: 'Commercial Machine Embroidery Digitizing, Vector Art Tracing, & Custom Physical Patches with 4-8 Hour Express Turnaround.',
    images: ['/icon.svg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1
    }
  }
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
  interactiveWidget: 'resizes-content',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0e17' }
  ]
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, interactive-widget=resizes-content" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="alternate icon" href="/favicon.ico" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "BDigitizing Studio",
              "url": process.env.NEXT_PUBLIC_SITE_URL || "https://bdigitizing.com",
              "logo": `${process.env.NEXT_PUBLIC_SITE_URL || 'https://bdigitizing.com'}/logo.png`,
              "description": "Premium Commercial Machine Embroidery Digitizing, Vector Art Tracing, & Custom Physical Patches.",
              "contactPoint": {
                "@type": "ContactPoint",
                "telephone": process.env.NEXT_PUBLIC_BUSINESS_PHONE || "+1 (347) 915-4498",
                "contactType": "Customer Service",
                "areaServed": ["US", "GB", "CA", "AU"],
                "availableLanguage": "English"
              }
            })
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                                     window.navigator.standalone === true || 
                                     (document.referrer && document.referrer.indexOf('android-app://') !== -1);
                  var params = new URLSearchParams(window.location.search);
                  var urlApp = params.get('app') === 'true' || params.get('mode') === 'app';
                  var urlWeb = params.get('web') === 'true' || params.get('mode') === 'web';
                  
                  // Only standalone/installed app or explicit app URL opens app mode. Mobile browsers show the responsive website.
                  if (!urlWeb && (isStandalone || urlApp)) {
                    document.documentElement.classList.add('mobile-app-active');
                    document.documentElement.setAttribute('data-mobile-mode', 'app');
                  } else {
                    document.documentElement.classList.remove('mobile-app-active');
                    document.documentElement.removeAttribute('data-mobile-mode');
                  }
                } catch(e) {}
              })();
            `
          }}
        />
        {/* Meta Pixel Instant Head Script */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var pId = "${process.env.NEXT_PUBLIC_META_PIXEL_ID || ''}" || (typeof localStorage !== 'undefined' ? localStorage.getItem('meta_pixel_id') : '');
                  if (pId && !window.fbq) {
                    !function(f,b,e,v,n,t,s)
                    {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                    n.queue=[];t=b.createElement(e);t.async=!0;
                    t.src=v;s=b.getElementsByTagName(e)[0];
                    s.parentNode.insertBefore(t,s)}(window, document,'script',
                    'https://connect.facebook.net/en_US/fbevents.js');
                    fbq('init', pId);
                    fbq('track', 'PageView');
                  }
                } catch(e) {}
              })();
            `
          }}
        />
        {process.env.NEXT_PUBLIC_META_PIXEL_ID && (
          <noscript>
            <img
              height="1"
              width="1"
              style={{ display: 'none' }}
              src={`https://www.facebook.com/tr?id=${process.env.NEXT_PUBLIC_META_PIXEL_ID}&ev=PageView&noscript=1`}
              alt=""
            />
          </noscript>
        )}
        <script src="https://accounts.google.com/gsi/client" async defer></script>
      </head>
      <body 
        suppressHydrationWarning 
        className="font-sans antialiased text-slate-900 bg-slate-50 dark:bg-slate-950 dark:text-slate-100" 
        style={{ fontFamily: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}
      >
        <StateProvider>
          <ErrorBoundary>
            <ClientLayoutShell>
              {children}
            </ClientLayoutShell>
          </ErrorBoundary>
        </StateProvider>
      </body>
    </html>
  );
}
