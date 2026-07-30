'use client';

import React, { useEffect } from 'react';
import { useAppState } from '../../../src/context/StateContext';
import { VectorArtPage } from '../../../src/components/public/VectorArtPage';

export default function VectorTracingPage() {
  const { setCurrentView } = useAppState();

  useEffect(() => {
    setCurrentView('public');
  }, [setCurrentView]);

  return <VectorArtPage />;
}
