'use client';

import React, { useEffect } from 'react';
import { useAppState } from '../../../src/context/StateContext';
import { EmbroideryDigitizingPage } from '../../../src/components/public/EmbroideryDigitizingPage';

export function EmbroideryClient() {
  const { currentView, setCurrentView } = useAppState();

  useEffect(() => {
    if (currentView !== 'public') {
      setCurrentView('public');
    }
  }, [currentView, setCurrentView]);

  return <EmbroideryDigitizingPage />;
}
