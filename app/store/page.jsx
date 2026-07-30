'use client';

import React, { useEffect } from 'react';
import { useAppState } from '../../src/context/StateContext';
import { StorePage } from '../../src/components/public/StorePage';

export default function StoreRoute() {
  const { setCurrentView } = useAppState();

  useEffect(() => {
    setCurrentView('public');
  }, [setCurrentView]);

  return <StorePage />;
}
