'use client';

import React, { Suspense } from 'react';
import { useAppState } from '../../context/StateContext';
import { AnnouncementBar } from '../public/AnnouncementBar';
import { VisitorPromotionBanner } from '../public/VisitorPromotionBanner';
import { HeaderNav } from '../HeaderNav';
import { Footer } from '../public/Footer';
import { ClientLiveChatWidget } from '../customer/ClientLiveChatWidget';
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

export const ClientLayoutShell = ({ children }) => {
  const { mobileMode } = useAppState();
  const isAppMode = mobileMode === 'app';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Website Top Header (Hidden in Standalone 5-Tab App Mode) */}
      {!isAppMode && (
        <div className="website-header-zone">
          <AnnouncementBar />
          <Suspense fallback={<header style={{ minHeight: '60px', background: '#ffffff' }} />}>
            <HeaderNav />
          </Suspense>
        </div>
      )}

      {/* Main Content Area */}
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

      {/* Website Footer & Desktop Widgets (Hidden in Standalone 5-Tab App Mode) */}
      {!isAppMode && (
        <div className="website-footer-zone">
          <Footer />
          <div className="desktop-chat-container">
            <ClientLiveChatWidget />
          </div>
        </div>
      )}

      {/* Global Interactive Modals & System Services */}
      <AuthModal />
      <OrderWizardModal />
      <StoreOrderModal />
      <CheckoutModal />
      <OrderTrackerDrawer />
      <DepositModal />
      <ToastContainer />
      <GlobalUploadModal />
      <MetaPixelTracker />
      <VisitorPromotionBanner />
      
      {/* PWA Prompt Banner (Visible on mobile website to offer App installation or launch) */}
      {!isAppMode && <PWAInstallBanner />}
      <PWARegistrar />
    </div>
  );
};
