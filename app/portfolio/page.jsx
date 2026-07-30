'use client';

import React, { useEffect } from 'react';
import { useAppState } from '../../src/context/StateContext';
import { PortfolioPage } from '../../src/components/public/PortfolioPage';

export default function PortfolioRoute() {
  const { setCurrentView } = useAppState();

  useEffect(() => {
    setCurrentView('public');
  }, [setCurrentView]);

  return <PortfolioPage />;
}
