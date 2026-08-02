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
  title: 'B Digitizing & Vector Studio | Custom Embroidery & Vector Art',
  description: 'Commercial Machine Embroidery Digitizing, Vector Art Tracing, & Custom Physical Patches with 4-8 Hour Turnaround.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body style={{ fontFamily: "'Inter', 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
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
