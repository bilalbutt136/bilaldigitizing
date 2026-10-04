'use client';

import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useAppState } from '../../context/StateContext';
import { usePathname } from 'next/navigation';
import { AnnouncementBar } from '../public/AnnouncementBar';
import { HeaderNav } from '../HeaderNav';
import { Footer } from '../public/Footer';
import ToastContainer from '../../../app/ToastContainer';
import { MetaPixelTracker } from '../common/MetaPixelTracker';
import { PWAInstallBanner } from '../common/PWAInstallBanner';
import { PWARegistrar } from '../common/PWARegistrar';
import { WhatsAppMessagePopup } from '../common/WhatsAppMessagePopup';
import { DynamicFavicon } from './DynamicFavicon';
import { HardwareBackHandler } from '../common/HardwareBackHandler';

const AuthModal = dynamic(() => import('../auth/AuthModal').then(mod => mod.AuthModal), { ssr: false });
const OrderWizardModal = dynamic(() => import('../customer/OrderWizardModal').then(mod => mod.OrderWizardModal), { ssr: false });
const StoreOrderModal = dynamic(() => import('../customer/StoreOrderModal').then(mod => mod.StoreOrderModal), { ssr: false });
const CheckoutModal = dynamic(() => import('../customer/CheckoutModal').then(mod => mod.CheckoutModal), { ssr: false });
const OrderTrackerDrawer = dynamic(() => import('../customer/OrderTrackerDrawer').then(mod => mod.OrderTrackerDrawer), { ssr: false });
const DepositModal = dynamic(() => import('../customer/DepositModal').then(mod => mod.DepositModal), { ssr: false });
const GlobalUploadModal = dynamic(() => import('../common/GlobalUploadModal'), { ssr: false });

export const ClientLayoutShell = ({ children }) => {
  const { mobileMode } = useAppState();
  const pathname = usePathname() || '';
  const isAppMode = mobileMode === 'app';
  const isDedicatedAuthRoute = ['/login', '/signup', '/reset-password', '/secure-admin-login', '/auth-unavailable'].includes(pathname);
  const isPortalRoute = pathname.startsWith('/client-portal') || pathname.startsWith('/admin-portal') || pathname === '/client' || pathname === '/admin';
  const isCompactShell = isDedicatedAuthRoute || isPortalRoute;
  const isWorkerPortal = pathname.startsWith('/portal') || pathname.startsWith('/worker');
  const shouldMountCommerceUi = !isDedicatedAuthRoute;

  // Complete stealth mode isolation for Worker Portal
  if (isWorkerPortal) {
    return (
      <div className="stealth-worker-portal min-h-screen bg-slate-950 text-slate-100 font-sans antialiased">
        <DynamicFavicon />
        <HardwareBackHandler />
        <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
          {children}
        </main>
        <ToastContainer />
      </div>
    );
  }

  return (
    <div className={isCompactShell ? 'site-shell auth-route-shell' : 'site-shell'} style={{ minHeight: '100svh', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
      <DynamicFavicon />

      <div className="website-header-zone">
        {!isCompactShell && <AnnouncementBar />}
        <Suspense fallback={<header style={{ minHeight: '63px', background: '#ffffff' }} />}>
          <HeaderNav />
        </Suspense>
      </div>

      <main className="website-main-zone" style={{ flex: 1, minWidth: 0 }}>
        {children}
      </main>

      {!isCompactShell && (
        <div className="website-footer-zone">
          <Footer />
        </div>
      )}

      {shouldMountCommerceUi && (
        <>
          <OrderWizardModal />
          <StoreOrderModal />
          <OrderTrackerDrawer />
          <DepositModal />
          <CheckoutModal />
          <GlobalUploadModal />
        </>
      )}
      {!isDedicatedAuthRoute && <AuthModal />}
      <HardwareBackHandler />
      <ToastContainer />
      <MetaPixelTracker />

      {!isAppMode && !isCompactShell && <PWAInstallBanner />}
      <PWARegistrar />
      {!isAppMode && <WhatsAppMessagePopup />}
    </div>
  );
};
