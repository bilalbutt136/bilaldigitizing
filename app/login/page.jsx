'use client';

import React, { useEffect } from 'react';
import { useAppState } from '../../src/context/StateContext';
import { useRouter } from 'next/navigation';
import HomePage from '../page';

export default function LoginRoute() {
  const { setIsAuthModalOpen, setAuthModalMode, setCurrentView, isAuthenticated, authUser, isAuthInitialized } = useAppState();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthInitialized) return;

    if (isAuthenticated) {
      if (authUser?.role === 'admin') {
        router.replace('/admin-portal');
      } else {
        router.replace('/client-portal');
      }
      return;
    }

    setCurrentView('public');
    setAuthModalMode('login');
    setIsAuthModalOpen(true);
  }, [isAuthenticated, authUser, isAuthInitialized, setCurrentView, setIsAuthModalOpen, setAuthModalMode, router]);

  return <HomePage />;
}
