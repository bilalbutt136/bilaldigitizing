'use client';

import React, { useEffect } from 'react';
import { useAppState } from '../../src/context/StateContext';
import { CustomPatchesSection } from '../../src/components/public/CustomPatchesSection';

export function CustomPatchesClient() {
  const { currentView, setCurrentView } = useAppState();

  useEffect(() => {
    if (currentView !== 'public') {
      setCurrentView('public');
    }
  }, [currentView, setCurrentView]);

  return <CustomPatchesSection />;
}
