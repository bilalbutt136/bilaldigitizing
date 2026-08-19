'use client';

import React, { useState, useEffect } from 'react';
import { useAppState } from '../../src/context/StateContext';
import { CustomerDashboard } from '../../src/components/customer/CustomerDashboard';
import { BDigitizingMobileApp } from '../../src/components/mobile/BDigitizingMobileApp';

export function ClientPortalClient() {
  const [isMounted, setIsMounted] = useState(false);
  const { setCurrentView, isAuthenticated, isAuthInitialized, setIsAuthModalOpen, setAuthModalMode, mobileMode } = useAppState();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted || !isAuthInitialized) return;
    
    if (!isAuthenticated) {
      setAuthModalMode('login');
      setIsAuthModalOpen(true);
      setCurrentView('public');
    } else {
      setCurrentView('customer');
    }
  }, [isMounted, isAuthenticated, isAuthInitialized, setCurrentView, setIsAuthModalOpen, setAuthModalMode]);

  if (!isMounted || (!isAuthInitialized && !isAuthenticated)) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ margin: '0 auto 1rem', width: '36px', height: '36px', border: '3px solid #e2e8f0', borderTopColor: 'var(--orange-500)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <div style={{ fontSize: '0.9rem', color: 'var(--navy-800)', fontWeight: 600 }}>Loading Studio App...</div>
        </div>
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

  return (
    <div className="customer-portal-desktop-wrapper">
      <CustomerDashboard />
    </div>
  );
}
