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
    setCurrentView
  } = useAppState();

  // Once backend auth resolves, strictly enforce authenticated backend session (Rule 3: Auth Enforcement)
  const isUserLoggedIn = isAuthInitialized
    ? Boolean(isAuthenticated && authUser?.email)
    : Boolean(isAuthenticated || authUser?.email);

  useEffect(() => {
    if (!isAuthInitialized) return;

    if (!isUserLoggedIn) {
      if (currentView !== 'public') setCurrentView('public');
      navigate('/login?redirect=/client-portal', { replace: true });
    } else {
      if (currentView !== 'customer') setCurrentView('customer');
      if (typeof document !== 'undefined') {
        document.cookie = 'bdigi_auth=true; path=/; max-age=31536000; SameSite=Lax';
      }
    }
  }, [isAuthInitialized, isUserLoggedIn, currentView, setCurrentView, navigate]);

  if (!isAuthInitialized || !isUserLoggedIn) {
    return (
      <div style={{
        minHeight: '60vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem'
      }}>
        <div style={{
          width: '36px',
          height: '36px',
          border: '3px solid #e2e8f0',
          borderTopColor: 'var(--color-primary, #ea580c)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }} />
      </div>
    );
  }

  if (mobileMode === 'app') {
    return (
      <div className="mobile-app-wrapper" style={{ width: '100%', minHeight: '100vh', background: '#ffffff' }}>
        <BDigitizingMobileApp />
      </div>
    );
  }

  return <CustomerDashboard />;
}
