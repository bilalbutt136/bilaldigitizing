'use client';

import React, { useState, useEffect } from 'react';
import { useAppState } from '../../src/context/StateContext';
import { AdminDashboard } from '../../src/components/admin/AdminDashboard';
import { getAdminMfaStatus } from '../../src/services/adminMfaService';
import { useRouter } from 'next/navigation';

const ADMIN_ACTIVITY_KEY = 'bdigi_admin_last_activity';

function parseAdminIdleTimeout(value) {
  const raw = String(value || '30m').trim().toLowerCase();
  const match = raw.match(/^(\d+)(m|h|d)$/);
  if (!match) return 30 * 60 * 1000;

  const amount = Math.max(1, Number(match[1]));
  const multiplier = match[2] === 'd'
    ? 24 * 60 * 60 * 1000
    : (match[2] === 'h' ? 60 * 60 * 1000 : 60 * 1000);

  return amount * multiplier;
}

export function AdminPortalClient() {
  const [isMounted, setIsMounted] = useState(false);
  const [mfaVerified, setMfaVerified] = useState(false);
  const [isCheckingMfa, setIsCheckingMfa] = useState(true);
  const {
    currentView,
    setCurrentView,
    isAuthenticated,
    isAuthInitialized,
    authUser,
    logout,
    siteSettings = {}
  } = useAppState();
  const router = useRouter();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted || !isAuthInitialized) return;

    const isMasterAdmin = isAuthenticated && authUser?.role === 'admin';

    if (!isMasterAdmin) {
      setMfaVerified(false);
      setIsCheckingMfa(false);
      if (isAuthenticated) {
        router.replace('/client-portal');
      } else {
        router.replace('/secure-admin-login');
      }
      return;
    }

    let active = true;
    setIsCheckingMfa(true);

    getAdminMfaStatus()
      .then(status => {
        if (!active) return;
        if (!status.success || status.currentLevel !== 'aal2') {
          setMfaVerified(false);
          router.replace('/secure-admin-login?mfa=required&redirect=/admin-portal');
          return;
        }

        setMfaVerified(true);
        if (currentView !== 'admin') setCurrentView('admin');
      })
      .finally(() => {
        if (active) setIsCheckingMfa(false);
      });

    return () => {
      active = false;
    };
  }, [isMounted, isAuthenticated, isAuthInitialized, authUser?.role, currentView, setCurrentView, router]);

  useEffect(() => {
    if (!isMounted || !mfaVerified || authUser?.role !== 'admin') return;

    const timeoutMs = parseAdminIdleTimeout(siteSettings?.sessionTimeout || '30m');
    let lastActivity = Date.now();
    let expiring = false;

    try {
      const stored = Number(sessionStorage.getItem(ADMIN_ACTIVITY_KEY) || 0);
      if (Number.isFinite(stored) && stored > 0) lastActivity = stored;
      else sessionStorage.setItem(ADMIN_ACTIVITY_KEY, String(lastActivity));
    } catch {}

    const expireSession = async () => {
      if (expiring) return;
      expiring = true;
      try {
        sessionStorage.removeItem(ADMIN_ACTIVITY_KEY);
      } catch {}
      await logout();
      router.replace('/secure-admin-login?reason=idle');
    };

    const checkIdle = () => {
      if (Date.now() - lastActivity >= timeoutMs) {
        expireSession();
        return true;
      }
      return false;
    };

    const recordActivity = () => {
      if (checkIdle()) return;
      lastActivity = Date.now();
      try {
        sessionStorage.setItem(ADMIN_ACTIVITY_KEY, String(lastActivity));
      } catch {}
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') checkIdle();
    };

    const intervalId = window.setInterval(checkIdle, 30_000);
    window.addEventListener('pointerdown', recordActivity, { passive: true });
    window.addEventListener('keydown', recordActivity);
    window.addEventListener('touchstart', recordActivity, { passive: true });
    window.addEventListener('focus', checkIdle);
    document.addEventListener('visibilitychange', handleVisibility);

    checkIdle();

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('pointerdown', recordActivity);
      window.removeEventListener('keydown', recordActivity);
      window.removeEventListener('touchstart', recordActivity);
      window.removeEventListener('focus', checkIdle);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [isMounted, mfaVerified, authUser?.role, siteSettings?.sessionTimeout, logout, router]);

  if (!isMounted || (!isAuthInitialized && !authUser) || isCheckingMfa) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a', color: '#ffffff' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ margin: '0 auto 1rem', width: '36px', height: '36px', border: '3px solid rgba(255,255,255,0.2)', borderTopColor: 'var(--orange-500)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <div style={{ fontSize: '0.9rem', color: '#94a3b8', fontWeight: 600 }}>Verifying Administrator Security...</div>
        </div>
      </div>
    );
  }

  const isMasterAdmin = isAuthenticated && authUser?.role === 'admin';
  if (!isMasterAdmin || !mfaVerified) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a', color: '#ffffff' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ margin: '0 auto 1rem', width: '36px', height: '36px', border: '3px solid rgba(255,255,255,0.2)', borderTopColor: 'var(--orange-500)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <div style={{ fontSize: '0.9rem', color: '#94a3b8', fontWeight: 600 }}>Redirecting to secure verification...</div>
        </div>
      </div>
    );
  }

  return <AdminDashboard />;
}
