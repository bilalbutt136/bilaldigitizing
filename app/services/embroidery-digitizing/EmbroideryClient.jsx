'use client';

import React, { useEffect } from 'react';
import { useAppState } from '../../../src/context/StateContext';
import { EmbroideryDigitizingPage } from '../../../src/components/public/EmbroideryDigitizingPage';

export function EmbroideryClient() {
  const { setCurrentView } = useAppState();

  useEffect(() => {
    setCurrentView('public');
  }, [setCurrentView]);

  return <EmbroideryDigitizingPage />;
}
