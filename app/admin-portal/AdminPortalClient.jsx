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

  return <AdminDashboard />;
}
