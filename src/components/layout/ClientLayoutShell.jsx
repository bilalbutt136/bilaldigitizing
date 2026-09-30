'use client';

import React, { Suspense } from 'react';
import { useAppState } from '../../context/StateContext';
import { usePathname } from 'next/navigation';
import { AnnouncementBar } from '../public/AnnouncementBar';
import { HeaderNav } from '../HeaderNav';
import { Footer } from '../public/Footer';
import { AuthModal } from '../auth/AuthModal';
import { OrderWizardModal } from '../customer/OrderWizardModal';
import { StoreOrderModal } from '../customer/StoreOrderModal';
import { CheckoutModal } from '../customer/CheckoutModal';
import { OrderTrackerDrawer } from '../customer/OrderTrackerDrawer';
import { DepositModal } from '../customer/DepositModal';
import ToastContainer from '../../../app/ToastContainer';
import GlobalUploadModal from '../common/GlobalUploadModal';
import { MetaPixelTracker } from '../common/MetaPixelTracker';
import { PWAInstallBanner } from '../common/PWAInstallBanner';
import { PWARegistrar } from '../common/PWARegistrar';
import { WhatsAppMessagePopup } from '../common/WhatsAppMessagePopup';
import { DynamicFavicon } from './DynamicFavicon';

export const ClientLayoutShell = ({ children }) => {
  const { mobileMode } = useAppState();
  const pathname = usePathname() || '';
  const isAppMode = mobileMode === 'app';
  const isDedicatedAuthRoute = ['/login', '/signup', '/reset-password', '/secure-admin-login', '/auth-unavailable'].includes(pathname);
  const isPortalRoute = pathname.startsWith('/client-portal') || pathname.startsWith('/admin-portal') || pathname === '/client' || pathname === '/admin';
  const isCompactShell = isDedicatedAuthRoute || isPortalRoute;
  const isWorkerPortal = pathname.startsWith('/portal') || pathname.startsWith('/worker');

  // Complete stealth mode isolation for Worker Portal
  if (isWorkerPortal) {
    return (
      <div className="stealth-worker-portal min-h-screen bg-slate-950 text-slate-100 font-sans antialiased">
        <DynamicFavicon />
        <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
          {children}
        </main>
        <ToastContainer />
      </div>
    );
  }

  return (
    <div className={isCompactShell ? 'site-shell auth-route-shell' : 'site-shell'} style={{ minHeight: '100svh', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
      {/* Dynamic favicon — overrides static server-rendered icon link on every page load */}
      <DynamicFavicon />

      {/* Website Top Header (Hidden in Standalone 5-Tab App Mode) */}
      <div className="website-header-zone">
        {!isCompactShell && <AnnouncementBar />}
        <Suspense fallback={<header style={{ minHeight: '63px', background: '#ffffff' }} />}>
          <HeaderNav />
        </Suspense>
      </div>

      {/* Main Content Area */}
      <main className="website-main-zone" style={{ flex: 1, minWidth: 0 }}>
        {children}
      </main>

      {/* Website Footer & Desktop Widgets (Hidden in Standalone 5-Tab App Mode) */}
      {!isCompactShell && (
        <div className="website-footer-zone">
          <Footer />
        </div>
      )}

      {/* Global Interactive Modals & System Services */}
      <OrderWizardModal />
      <StoreOrderModal />
      <OrderTrackerDrawer />
      <DepositModal />
      <CheckoutModal />
      {!isDedicatedAuthRoute && <AuthModal />}
      <GlobalUploadModal />
      <ToastContainer />
      <MetaPixelTracker />
      
      {/* PWA Prompt Banner (Visible on mobile website to offer App installation or launch) */}
      {!isAppMode && !isCompactShell && <PWAInstallBanner />}
      <PWARegistrar />
      {!isAppMode && <WhatsAppMessagePopup />}
    </div>
  );
};
