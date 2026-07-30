'use client';

import React, { useEffect } from 'react';
import { useAppState } from '../src/context/StateContext';
import { HeroSection } from '../src/components/public/HeroSection';
import { CustomerSewOutsSection } from '../src/components/public/CustomerSewOutsSection';
import { WhyChooseUs } from '../src/components/public/WhyChooseUs';
import { TestimonialsFAQ } from '../src/components/public/TestimonialsFAQ';

export default function HomePage() {
  const { setCurrentView } = useAppState();

  useEffect(() => {
    setCurrentView('public');
  }, [setCurrentView]);

  return (
    <>
      <HeroSection />
      <CustomerSewOutsSection />
      <WhyChooseUs />
      <TestimonialsFAQ />
    </>
  );
}
