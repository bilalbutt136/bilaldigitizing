/* oxlint-disable react/only-export-components -- Next.js App Router layouts export metadata helpers alongside the component */
import '../src/index.css';
import './globals.css';
import { Inter, Plus_Jakarta_Sans } from 'next/font/google';
import { Suspense as _Suspense } from 'react';
import { StateProvider } from '../src/context/StateContext';
import { ErrorBoundary } from '../src/components/ErrorBoundary';
import { ClientLayoutShell } from '../src/components/layout/ClientLayoutShell';
import { fetchPublicCatalogServer } from '../src/lib/catalog/serverCatalog';
import { getSiteBranding, brandingToSiteSettings } from '../src/lib/branding/serverBranding';

const interFont = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'optional',
  adjustFontFallback: true
});

const headingFont = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-plus-jakarta',
  display: 'optional',
  adjustFontFallback: true
});

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

export async function generateMetadata() {
  const branding = await getSiteBranding();
  const faviconUrl = branding.favicon_url || '/favicon.png';
  const appIconUrl = branding.app_icon_url || '/icon-512x512.png';
  const ogImageUrl = branding.og_image_url || appIconUrl;

  return {
    metadataBase: getMetadataBase(),
    manifest: '/manifest.webmanifest',
    icons: {
      icon: [{ url: faviconUrl }],
      shortcut: faviconUrl,
      apple: [{ url: appIconUrl }]
    },
    appleWebApp: {
      capable: true,
      statusBarStyle: 'black-translucent',
      title: 'BDigitizing'
    },
    title: {
      default: 'Embroidery Digitizing Services | BDigitizing',
      template: '%s | BDigitizing Studio'
    },
    description: 'Professional embroidery digitizing for commercial shops with production-ready DST, PES and EMB files, vector art conversion, and custom patch manufacturing.',
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
      title: 'Embroidery Digitizing Services | BDigitizing',
      description: 'Professional embroidery digitizing for commercial shops with production-ready DST, PES and EMB files, vector art conversion, and custom patch manufacturing.',
      url: '/',
      siteName: 'BDigitizing Studio',
      locale: 'en_US',
      type: 'website',
      images: [{ url: ogImageUrl, alt: 'BDigitizing Studio' }]
    },
    twitter: {
      card: 'summary_large_image',
      title: 'BDigitizing | Premier Machine Embroidery Digitizing & Vector Art Lab',
      description: 'Professional embroidery digitizing for commercial shops with production-ready DST, PES and EMB files, vector art conversion, and custom patch manufacturing.',
      images: [ogImageUrl]
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
}

export async function generateViewport() {
  const branding = await getSiteBranding();

  return {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
    viewportFit: 'cover',
    interactiveWidget: 'resizes-content',
    themeColor: branding.theme_color || '#ffffff'
  };
}

export default async function RootLayout({ children }) {
  const [initialCatalog, branding] = await Promise.all([
    fetchPublicCatalogServer(),
    getSiteBranding()
  ]);

  const brandingSettings = brandingToSiteSettings(branding);
  const catalogWithBranding = {
    ...(initialCatalog || {}),
    siteSettings: {
      ...(initialCatalog?.siteSettings || {}),
      ...brandingSettings
    }
  };

  const organizationLogoUrl = new URL(
    branding.header_logo_url || '/logo.png',
    getMetadataBase()
  ).toString();

  const metaPixelId = String(
    catalogWithBranding?.siteSettings?.metaPixelId ||
    process.env.NEXT_PUBLIC_META_PIXEL_ID ||
    ''
  ).trim();

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var savedTheme = localStorage.getItem('bdigi_theme') || 'light';
                  var root = document.documentElement;
                  root.setAttribute('data-theme', savedTheme === 'dark' ? 'dark' : 'light');
                  root.setAttribute('data-theme-preset', 'studio-orange');
                  root.style.colorScheme = savedTheme === 'dark' ? 'dark' : 'light';
                  if (savedTheme === 'dark') {
                    root.classList.add('dark', 'dark-mode');
                  } else {
                    root.classList.remove('dark', 'dark-mode');
                  }
                } catch(e) {}
              })();
            `
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "BDigitizing Studio",
              "url": process.env.NEXT_PUBLIC_SITE_URL || "https://bdigitizing.com",
              "logo": organizationLogoUrl,
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
                                     window.navigator.standalone === true;
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
                  var pId = ${JSON.stringify(metaPixelId)} || (typeof localStorage !== 'undefined' ? localStorage.getItem('meta_pixel_id') : '');
                  if (pId && !window.fbq) {
                    !function(f,b,e,v,n,t,s)
                    {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                    n.queue=[];t=b.createElement(e);t.async=!0;t.id='facebook-jssdk-pixel';
                    t.src=v;s=b.getElementsByTagName(e)[0];
                    s.parentNode.insertBefore(t,s)}(window, document,'script',
                    'https://connect.facebook.net/en_US/fbevents.js');
                    fbq('init', pId);
                    window._fbq_active_pixel_id = pId;
                  }
                } catch(e) {}
              })();
            `
          }}
        />
        {metaPixelId && (
          <noscript>
            <img
              height="1"
              width="1"
              style={{ display: 'none' }}
              src={`https://www.facebook.com/tr?id=${metaPixelId}&ev=PageView&noscript=1`}
              alt=""
            />
          </noscript>
        )}
        <script src="https://accounts.google.com/gsi/client" async defer></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof window !== 'undefined') {
                window.addEventListener('beforeinstallprompt', function(e) {
                  e.preventDefault();
                  window.deferredPWAInstallPrompt = e;
                });
                window.addEventListener('appinstalled', function() {
                  try {
                    localStorage.setItem('bdigi_pwa_installed', 'true');
                  } catch(e) {}
                });
              }
            `
          }}
        />
      </head>
      <body
        suppressHydrationWarning
        className={`${interFont.variable} ${headingFont.variable} font-sans antialiased text-slate-900 bg-slate-50 dark:bg-slate-950 dark:text-slate-100`}
      >
        <StateProvider initialCatalog={catalogWithBranding}>
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
