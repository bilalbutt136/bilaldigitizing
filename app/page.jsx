'use client';

import React, { useEffect } from 'react';
import { useAppState } from '../src/context/StateContext';
import { HeroSection } from '../src/components/public/HeroSection';
import { TrustStatsBar } from '../src/components/public/TrustStatsBar';
import { WhyChooseUs } from '../src/components/public/WhyChooseUs';
import { PortfolioPreview } from '../src/components/public/PortfolioPreview';
import { TestimonialsFAQ } from '../src/components/public/TestimonialsFAQ';
import { PricingCalculator } from '../src/components/public/PricingCalculator';
import { FinalCTA } from '../src/components/public/FinalCTA';
import { EmbroideryDigitizingPage } from '../src/components/public/EmbroideryDigitizingPage';
import { VectorArtPage } from '../src/components/public/VectorArtPage';
import { CustomPatchesSection } from '../src/components/public/CustomPatchesSection';

export default function HomePage() {
  const { setCurrentView, activeHomeServiceTab } = useAppState();

  useEffect(() => {
    setCurrentView('public');
  }, [setCurrentView]);

  return (
    <>
      <HeroSection />
      
      {activeHomeServiceTab === 'embroidery' ? (
        <EmbroideryDigitizingPage hideHero={true} />
      ) : activeHomeServiceTab === 'vector' ? (
        <VectorArtPage hideHero={true} />
      ) : (activeHomeServiceTab === 'patch' || activeHomeServiceTab === 'patches') ? (
        <CustomPatchesSection hideHero={true} />
      ) : (
        <>
          <TrustStatsBar />
          <WhyChooseUs />
          <PortfolioPreview />
          <PricingCalculator />
          <TestimonialsFAQ />
          <FinalCTA />
        </>
      )}
    </>
  );
}
