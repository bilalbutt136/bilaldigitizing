'use client';

import React, { useEffect } from 'react';
import { useAppState } from '../../src/context/StateContext';
import { CustomPatchesSection } from '../../src/components/public/CustomPatchesSection';

export function CustomPatchesClient() {
  const { setCurrentView } = useAppState();

  useEffect(() => {
    setCurrentView('public');
  }, [setCurrentView]);

  return <CustomPatchesSection />;
}
