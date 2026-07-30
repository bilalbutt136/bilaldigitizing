'use client';

import React, { useEffect } from 'react';
import { useAppState } from '../../src/context/StateContext';
import HomePage from '../page';

export default function SignupRoute() {
  const { setIsAuthModalOpen, setAuthModalMode, setCurrentView } = useAppState();

  useEffect(() => {
    setCurrentView('public');
    setAuthModalMode('signup');
    setIsAuthModalOpen(true);
  }, [setCurrentView, setIsAuthModalOpen, setAuthModalMode]);

  return <HomePage />;
}
