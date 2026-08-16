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

  if (!isAuthInitialized && !isAuthenticated) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ margin: '0 auto 1rem', width: '36px', height: '36px', border: '3px solid #e2e8f0', borderTopColor: 'var(--orange-500)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <div style={{ fontSize: '0.9rem', color: 'var(--navy-800)', fontWeight: 600 }}>Loading Client Dashboard...</div>
        </div>
      </div>
    );
  }

  return <CustomerDashboard />;
}
