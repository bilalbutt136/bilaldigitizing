'use client';

import React, { useEffect } from 'react';
import { useAppState } from '../../src/context/StateContext';
import { AdminDashboard } from '../../src/components/admin/AdminDashboard';
import { useRouter } from 'next/navigation';

export default function AdminPortalRoute() {
  const { setCurrentView, isAuthenticated, authUser, siteSettings } = useAppState();
  const router = useRouter();

  useEffect(() => {
    const configuredAdmin = (siteSettings?.adminEmail || 'shahidbutt59191@gmail.com').toLowerCase().trim();
    const isMasterAdmin = isAuthenticated && (
      authUser?.email?.toLowerCase().trim() === configuredAdmin ||
      authUser?.email?.toLowerCase().trim() === 'shahidbutt59191@gmail.com'
    );

    if (!isMasterAdmin) {
      if (isAuthenticated) {
        router.replace('/client-portal');
      } else {
        router.replace('/secure-admin-login');
      }
    } else {
      setCurrentView('admin');
    }
  }, [isAuthenticated, authUser, siteSettings, setCurrentView, router]);

  return <AdminDashboard />;
}
