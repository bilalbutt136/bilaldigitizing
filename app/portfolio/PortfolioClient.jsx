'use client';

import React, { useEffect } from 'react';
import { useAppState } from '../../src/context/StateContext';
import { PortfolioPage } from '../../src/components/public/PortfolioPage';

export function PortfolioClient() {
  const { currentView, setCurrentView } = useAppState();

  useEffect(() => {
    if (currentView !== 'public') {
      setCurrentView('public');
    }
  }, [currentView, setCurrentView]);

  return <PortfolioPage />;
}
