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
  const { setCurrentView, activeHomeServiceTab } = useAppState();
  const activeTab = normalizeCategory(activeHomeServiceTab || 'all');

  useEffect(() => {
    setCurrentView('public');
  }, [setCurrentView]);

  return (
    <>
      {/* 1. NATIVE MOBILE APP EXPERIENCE (Never loads full bulky website on mobile) */}
      <div className="mobile-app-wrapper">
        <BDigitizingMobileApp />
      </div>

      {/* 2. DESKTOP WORKSPACE / MARKETING VIEW */}
      <div className="desktop-website-wrapper">
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
    </>
  );
}
