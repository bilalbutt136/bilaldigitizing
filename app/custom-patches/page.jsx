'use client';

import React, { useEffect } from 'react';
import { useAppState } from '../../src/context/StateContext';
import { CustomPatchesSection } from '../../src/components/public/CustomPatchesSection';

export default function CustomPatchesRoute() {
  const { setCurrentView } = useAppState();

  useEffect(() => {
    setCurrentView('public');
  }, [setCurrentView]);

  return <CustomPatchesSection />;
}
