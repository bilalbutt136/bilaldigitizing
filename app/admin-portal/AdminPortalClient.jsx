'use client';

import React, { useEffect } from 'react';
import { useAppState } from '../../src/context/StateContext';
import { AdminDashboard } from '../../src/components/admin/AdminDashboard';
import { useRouter } from 'next/navigation';

export function AdminPortalClient() {
  const { setCurrentView, isAuthenticated, isAuthInitialized, authUser } = useAppState();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthInitialized) return;

    const isMasterAdmin = isAuthenticated && authUser?.role === 'admin';

    if (!isMasterAdmin) {
      if (isAuthenticated) {
        router.replace('/client-portal');
      } else {
        router.replace('/secure-admin-login');
      }
    } else {
      setCurrentView('admin');
    }
  }, [isAuthenticated, isAuthInitialized, authUser, setCurrentView, router]);

  if (!isAuthInitialized && !authUser) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a', color: '#ffffff' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ margin: '0 auto 1rem', width: '36px', height: '36px', border: '3px solid rgba(255,255,255,0.2)', borderTopColor: 'var(--orange-500)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <div style={{ fontSize: '0.9rem', color: '#94a3b8', fontWeight: 600 }}>Verifying Administrator Session...</div>
        </div>
      </div>
    );
  }

  return <AdminDashboard />;
}
