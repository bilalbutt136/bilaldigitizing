'use client';

import React, { useEffect } from 'react';
import { useAppState } from '../src/context/StateContext';
import { HeroSection } from '../src/components/public/HeroSection';
import { TrustStatsBar } from '../src/components/public/TrustStatsBar';
import { WhyChooseUs } from '../src/components/public/WhyChooseUs';
import { PortfolioPreview } from '../src/components/public/PortfolioPreview';
import { TestimonialsFAQ } from '../src/components/public/TestimonialsFAQ';
import { FinalCTA } from '../src/components/public/FinalCTA';

export default function HomePage() {
  const { setCurrentView } = useAppState();

  useEffect(() => {
    setCurrentView('public');
  }, [setCurrentView]);

  return (
    <>
      <HeroSection />
      <TrustStatsBar />
      <WhyChooseUs />
      <PortfolioPreview />
      <TestimonialsFAQ />
      <FinalCTA />
    </>
  );
}
