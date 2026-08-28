'use client';

import React, { useEffect } from 'react';
import { useAppState } from '../../src/context/StateContext';
import { CustomerDashboard } from '../../src/components/customer/CustomerDashboard';
import { BDigitizingMobileApp } from '../../src/components/mobile/BDigitizingMobileApp';
import { useNavigate } from '../../src/utils/navigation';

export function ClientPortalClient() {
  const navigate = useNavigate();
  const { 
    isAuthenticated, 
    isAuthInitialized, 
    authUser, 
    mobileMode, 
    currentView,
    setCurrentView,
    setIsAuthModalOpen,
    setAuthModalMode
  } = useAppState();

  useEffect(() => {
    if (!isAuthInitialized) return;

    let isUserLoggedIn = isAuthenticated || !!authUser;
    if (!isUserLoggedIn && typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('bdigi_auth_user');
        if (saved && JSON.parse(saved)?.email) {
          isUserLoggedIn = true;
        }
      } catch {}
    }

    if (!isUserLoggedIn) {
      setAuthModalMode('login');
      setIsAuthModalOpen(true);
      if (currentView !== 'public') setCurrentView('public');
      navigate('/');
    } else {
      if (currentView !== 'customer') setCurrentView('customer');
    }
  }, [isAuthInitialized, isAuthenticated, authUser, currentView, setCurrentView, setIsAuthModalOpen, setAuthModalMode, navigate]);

  if (mobileMode === 'app') {
    return (
      <div className="mobile-app-wrapper" style={{ width: '100%', minHeight: '100vh', background: '#ffffff' }}>
        <BDigitizingMobileApp />
      </div>
    );
  }

  return <CustomerDashboard />;
}
