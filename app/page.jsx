'use client';

import React, { useEffect } from 'react';
import { useAppState } from '../src/context/StateContext';
import { HeroSection } from '../src/components/public/HeroSection';
import { ServicesSection } from '../src/components/public/ServicesSection';
import { TrustStatsBar } from '../src/components/public/TrustStatsBar';
import { WhyChooseUs } from '../src/components/public/WhyChooseUs';
import { PortfolioPreview } from '../src/components/public/PortfolioPreview';
import { TestimonialsFAQ } from '../src/components/public/TestimonialsFAQ';
import { FinalCTA } from '../src/components/public/FinalCTA';
import { BDigitizingMobileApp } from '../src/components/mobile/BDigitizingMobileApp';
import { normalizeCategory } from '../src/utils/categoryUtils';

export default function HomePage() {
  const { currentView, setCurrentView, activeHomeServiceTab, mobileMode } = useAppState();
  const activeTab = normalizeCategory(activeHomeServiceTab || 'all');

  useEffect(() => {
    if (currentView !== 'public') {
      setCurrentView('public');
    }
  }, [currentView, setCurrentView]);

  // If in Standalone App mode (or user toggled App Mode), render the 5-tab Fiverr-style mobile app
  if (mobileMode === 'app') {
    return (
      <div className="mobile-app-wrapper" style={{ width: '100%', minHeight: '100vh', background: '#ffffff' }}>
        <BDigitizingMobileApp />
      </div>
    );
  }

  // Otherwise, render full responsive website for desktop and mobile browsers
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
