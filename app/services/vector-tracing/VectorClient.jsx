'use client';

import React, { useEffect } from 'react';
import { useAppState } from '../../../src/context/StateContext';
import { VectorArtPage } from '../../../src/components/public/VectorArtPage';

export function VectorClient() {
  const { currentView, setCurrentView } = useAppState();

  useEffect(() => {
    if (currentView !== 'public') {
      setCurrentView('public');
    }
  }, [currentView, setCurrentView]);

  return <VectorArtPage />;
}
