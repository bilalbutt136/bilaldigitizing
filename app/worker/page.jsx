'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppState } from '../../src/context/StateContext';
import { WorkerDashboard } from '../../src/components/worker/WorkerDashboard';

export default function WorkerPortalPage() {
  const { authUser, isAuthenticated, isAuthInitialized } = useAppState();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (!isAuthInitialized) return;

    if (!isAuthenticated) {
      router.replace('/worker-login');
      return;
    }

    const isWorker = 
      authUser?.role === 'worker' || 
      authUser?.role === 'admin' || 
      (authUser?.worker_status || '').toLowerCase() === 'active' ||
      (authUser?.status || '').toLowerCase() === 'active';
    if (!isWorker) {
      router.replace('/client-portal');
    } else {
      setIsAuthorized(true);
    }
  }, [isAuthenticated, isAuthInitialized, authUser, router]);

  if (!isAuthInitialized || !isAuthorized) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a', color: '#ffffff' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ margin: '0 auto 1rem', width: '36px', height: '36px', border: '3px solid rgba(255,255,255,0.2)', borderTopColor: '#f97316', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <p style={{ fontSize: '0.9rem', color: '#94a3b8', fontWeight: 600 }}>Verifying Worker Station Session...</p>
        </div>
      </div>
    );
  }

  return <WorkerDashboard worker={authUser} />;
}
