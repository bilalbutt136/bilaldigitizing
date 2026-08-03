import '../src/index.css';
import './globals.css';
import { Suspense } from 'react';
import { StateProvider } from '../src/context/StateContext';
import { HeaderNav } from '../src/components/HeaderNav';
import { Footer } from '../src/components/public/Footer';
import { AuthModal } from '../src/components/auth/AuthModal';
import { OrderWizardModal } from '../src/components/customer/OrderWizardModal';
import { StoreOrderModal } from '../src/components/customer/StoreOrderModal';
import { OrderTrackerDrawer } from '../src/components/customer/OrderTrackerDrawer';
import { DepositModal } from '../src/components/customer/DepositModal';
import { ClientLiveChatWidget } from '../src/components/customer/ClientLiveChatWidget';
import ToastContainer from './ToastContainer';

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://bdigitizing.pro'),
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
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body suppressHydrationWarning style={{ fontFamily: "'Inter', 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
        <StateProvider>
          <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <HeaderNav />
            <main style={{ flex: 1 }}>
              <Suspense fallback={<div style={{ padding: '4rem', textAlign: 'center', color: '#94a3b8' }}>Loading Studio Content...</div>}>
                {children}
              </Suspense>
            </main>
            <Footer />

            {/* Global Interactive Modals & Drawers */}
            <AuthModal />
            <OrderWizardModal />
            <StoreOrderModal />
            <OrderTrackerDrawer />
            <DepositModal />
            <ClientLiveChatWidget />
            <ToastContainer />
          </div>
        </StateProvider>
      </body>
    </html>
  );
}
