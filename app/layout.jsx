import '../src/index.css';
import './globals.css';
import { Suspense } from 'react';
import { StateProvider } from '../src/context/StateContext';
import { HeaderNav } from '../src/components/HeaderNav';
import { Footer } from '../src/components/public/Footer';
import { AnnouncementBar } from '../src/components/public/AnnouncementBar';
import { AuthModal } from '../src/components/auth/AuthModal';
import { OrderWizardModal } from '../src/components/customer/OrderWizardModal';
import { StoreOrderModal } from '../src/components/customer/StoreOrderModal';
import { OrderTrackerDrawer } from '../src/components/customer/OrderTrackerDrawer';
import { DepositModal } from '../src/components/customer/DepositModal';
import { CheckoutModal } from '../src/components/customer/CheckoutModal';
import { ClientLiveChatWidget } from '../src/components/customer/ClientLiveChatWidget';
import ToastContainer from './ToastContainer';
import GlobalUploadModal from '../src/components/common/GlobalUploadModal';
import { MetaPixelTracker } from '../src/components/common/MetaPixelTracker';
import { VisitorPromotionBanner } from '../src/components/public/VisitorPromotionBanner';
import { ErrorBoundary } from '../src/components/ErrorBoundary';

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
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/favicon.svg', type: 'image/svg+xml' }
    ],
    shortcut: '/favicon.ico',
    apple: '/favicon.svg',
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
            <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
              <AnnouncementBar />
              <Suspense fallback={<header style={{ minHeight: '60px', background: '#ffffff' }} />}>
                <HeaderNav />
              </Suspense>
              <main style={{ flex: 1 }}>
                <Suspense fallback={
                  <div style={{ padding: '3rem 1.5rem', maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
                    <div style={{ height: '36px', width: '50%', background: '#e2e8f0', borderRadius: '8px' }} />
                    <div style={{ height: '20px', width: '75%', background: '#f1f5f9', borderRadius: '6px' }} />
                  </div>
                }>
                  {children}
                </Suspense>
              </main>
              <Footer />

              {/* Global Interactive Modals & Drawers */}
              <AuthModal />
              <OrderWizardModal />
              <StoreOrderModal />
              <CheckoutModal />
              <OrderTrackerDrawer />
              <DepositModal />
              <ClientLiveChatWidget />
              <ToastContainer />
              <GlobalUploadModal />
              <MetaPixelTracker />
              <VisitorPromotionBanner />
            </div>
          </ErrorBoundary>
        </StateProvider>
      </body>
    </html>
  );
}
