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
      <body>
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
