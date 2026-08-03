'use client';

import React, { useEffect } from 'react';
import { useAppState } from '../../src/context/StateContext';
import { CustomerDashboard } from '../../src/components/customer/CustomerDashboard';

export function ClientPortalClient() {
  const { setCurrentView, isAuthenticated, isAuthInitialized, setIsAuthModalOpen, setAuthModalMode } = useAppState();

  useEffect(() => {
    if (!isAuthInitialized) return;
    
    if (!isAuthenticated) {
      setAuthModalMode('login');
      setIsAuthModalOpen(true);
      setCurrentView('public');
    } else {
      setCurrentView('customer');
    }
  }, [isAuthenticated, isAuthInitialized, setCurrentView, setIsAuthModalOpen, setAuthModalMode]);

  return <CustomerDashboard />;
}
