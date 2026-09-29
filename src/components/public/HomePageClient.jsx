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
  const { currentView, setCurrentView, activeHomeServiceTab, mobileMode } = useAppState();
  const activeTab = normalizeCategory(activeHomeServiceTab || 'all');
  const shouldRenderApp = initialAppMode || mobileMode === 'app';

  useEffect(() => {
    if (currentView !== 'public') {
      setCurrentView('public');
    }
  }, [currentView, setCurrentView]);

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
