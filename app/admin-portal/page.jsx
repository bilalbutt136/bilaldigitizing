'use client';

import React, { useEffect } from 'react';
import { useAppState } from '../../src/context/StateContext';
import { AdminDashboard } from '../../src/components/admin/AdminDashboard';
import { useRouter } from 'next/navigation';

export default function AdminPortalRoute() {
  const { setCurrentView, isAuthenticated, authUser } = useAppState();
  const router = useRouter();

  useEffect(() => {
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
  }, [isAuthenticated, authUser, setCurrentView, router]);

  return <AdminDashboard />;
}
