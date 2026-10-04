'use client';

import React, { useEffect } from 'react';
import { useAppState } from '../../context/StateContext';
import { HeroSection } from './HeroSection';
import { ServicesSection } from './ServicesSection';
import { TrustStatsBar } from './TrustStatsBar';
import { WhyChooseUs } from './WhyChooseUs';
import { PortfolioPreview } from './PortfolioPreview';
import { TestimonialsFAQ } from './TestimonialsFAQ';
import { FinalCTA } from './FinalCTA';
import { BDigitizingMobileApp } from '../mobile/BDigitizingMobileApp';
import { normalizeCategory } from '../../utils/categoryUtils';

export default function HomePageClient({ initialAppMode = false, initialAppTab = 'home' }) {
  const { currentView, setCurrentView, activeHomeServiceTab, mobileMode, isAuthInitialized, isAuthenticated, authUser } = useAppState();
  const activeTab = normalizeCategory(activeHomeServiceTab || 'all');
  // Render mobile app if explicitly launched via ?app=true, PWA standalone, or mobileMode === 'app'. Standard mobile web visitors see website first.
  const shouldRenderApp = Boolean(initialAppMode || mobileMode === 'app');

  const isAdminAccount = Boolean(isAuthInitialized && isAuthenticated && authUser?.role === 'admin');

  useEffect(() => {
    if (isAdminAccount) {
      if (currentView !== 'admin') setCurrentView('admin');
      if (typeof window !== 'undefined') {
        const destination = shouldRenderApp ? '/secure-admin-login?mobile=1' : '/admin-portal';
        if (window.location.pathname !== destination.split('?')[0]) {
          window.location.replace(destination);
        }
      }
      return;
    }

    if (currentView !== 'public') {
      setCurrentView('public');
    }
  }, [isAdminAccount, currentView, setCurrentView, shouldRenderApp]);

  if (shouldRenderApp && isAdminAccount) {
    return (
      <div className="mobile-app-wrapper" style={{ width: '100%', minHeight: '100svh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-background, #ffffff)' }}>
        <div style={{ color: 'var(--text-muted)', fontWeight: 700 }}>Opening secure Admin Portal...</div>
      </div>
    );
  }

  if (shouldRenderApp) {
    return (
      <div className="mobile-app-wrapper" style={{ width: '100%', minHeight: '100svh', background: 'var(--color-background, #ffffff)' }}>
        <BDigitizingMobileApp initialTab={initialAppTab} />
      </div>
    );
  }

  return (
    <div className="website-page-wrapper">
      <HeroSection />
      <ServicesSection />
      {activeTab === 'all' && (
        <>
          <TrustStatsBar />
          <WhyChooseUs />
          <PortfolioPreview />
          <TestimonialsFAQ />
          <FinalCTA />
        </>
      )}
    </div>
  );
}
