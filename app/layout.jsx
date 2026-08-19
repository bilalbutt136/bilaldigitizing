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
  return new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://bilaldigitizing.vercel.app');
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
    default: 'B Digitizing & Vector Studio | Custom Embroidery & Vector Art',
    template: '%s | B Digitizing Studio'
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
  authors: [{ name: 'B Digitizing Studio', url: 'https://bdigitizing.pro' }],
  creator: 'B Digitizing Studio',
  publisher: 'B Digitizing Studio',
  formatDetection: {
    email: false,
    address: false,
    telephone: false
  },
  openGraph: {
    title: 'B Digitizing & Vector Studio | Custom Embroidery & Vector Art',
    description: 'Commercial Machine Embroidery Digitizing, Vector Art Tracing, & Custom Physical Patches with 4-8 Hour Express Turnaround.',
    url: 'https://bdigitizing.pro',
    siteName: 'B Digitizing Studio',
    locale: 'en_US',
    type: 'website'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'B Digitizing & Vector Studio | Custom Embroidery & Vector Art',
    description: 'Commercial Machine Embroidery Digitizing, Vector Art Tracing, & Custom Physical Patches with 4-8 Hour Express Turnaround.'
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

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
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
              "name": "B Digitizing Studio",
              "url": process.env.NEXT_PUBLIC_SITE_URL || "https://bilaldigitizing.vercel.app",
              "logo": `${process.env.NEXT_PUBLIC_SITE_URL || 'https://bilaldigitizing.vercel.app'}/logo.png`,
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
      </head>
      <body suppressHydrationWarning style={{ fontFamily: "'Inter', 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
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
