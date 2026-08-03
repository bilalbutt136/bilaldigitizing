'use client';

import React, { useEffect } from 'react';
import { useAppState } from '../../src/context/StateContext';
import { CustomerDashboard } from '../../src/components/customer/CustomerDashboard';

export function ClientPortalClient() {
  const { setCurrentView, isAuthenticated, setIsAuthModalOpen, setAuthModalMode } = useAppState();

  useEffect(() => {
    if (!isAuthenticated) {
      setAuthModalMode('login');
      setIsAuthModalOpen(true);
      setCurrentView('public');
    } else {
      setCurrentView('customer');
    }
  }, [isAuthenticated, setCurrentView, setIsAuthModalOpen, setAuthModalMode]);

  return <CustomerDashboard />;
}
