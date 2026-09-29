'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseClient } from '../../../src/lib/supabaseClient';
import { WorkerDashboard } from '../../../src/components/worker/WorkerDashboard';

export default function WorkerPortalDashboardPage() {
  const router = useRouter();
  const [isVerifying, setIsVerifying] = useState(true);
  const [authorizedWorker, setAuthorizedWorker] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function requestVerifiedWorker(accessToken = null) {
      const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
      const response = await fetch('/api/worker/session', {
        headers,
        cache: 'no-store',
        credentials: 'include'
      });
      const body = await response.json().catch(() => ({}));
      return { response, body };
    }

    async function verifyWorkerSession() {
      try {
        // First prefer the HTTP-only Supabase cookie session.
        let verification = await requestVerifiedWorker();

        // If the browser Supabase session is stored client-side, retry using its
        // signed access token. The server still performs all role/status checks.
        if (!verification.response.ok && supabaseClient) {
          try {
            const { data: sessionData } = await supabaseClient.auth.getSession();
            const accessToken = sessionData?.session?.access_token;
            if (accessToken) {
              verification = await requestVerifiedWorker(accessToken);
            }
          } catch (tokenErr) {
            console.warn('[Worker Portal Token Verification Notice]:', tokenErr?.message);
          }
        }

        const sessionJson = verification.body;
        if (verification.response.ok && sessionJson?.authenticated && sessionJson?.worker) {
          if (isMounted) {
            setAuthorizedWorker(sessionJson.worker);
            setIsVerifying(false);
          }
          return;
        }

        if (['pending', 'suspended', 'rejected'].includes(sessionJson?.status)) {
          try {
            await supabaseClient?.auth?.signOut();
          } catch {}
          try {
            localStorage.removeItem('bdigi_auth_user');
          } catch {}
        }

        if (isMounted) router.replace('/portal/login');
      } catch (err) {
        console.error('Worker session verification error:', err);
        if (isMounted) router.replace('/portal/login');
      }
    }

    verifyWorkerSession();

    return () => {
      isMounted = false;
    };
  }, [router]);

  if (isVerifying || !authorizedWorker) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0a0f1d',
        color: '#f8fafc',
        fontFamily: "'Inter', system-ui, sans-serif"
      }}>
        <div style={{ textAlign: 'center', maxWidth: '380px', padding: '2rem' }}>
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1.5rem',
            boxShadow: '0 8px 24px rgba(249, 115, 22, 0.35)'
          }}>
            <img src="/favicon.png" alt="BDigitizing" style={{ width: '32px', height: '36px', objectFit: 'contain' }} />
          </div>

          <div style={{
            margin: '0 auto 1.25rem',
            width: '32px',
            height: '32px',
            border: '3px solid rgba(249, 115, 22, 0.2)',
            borderTopColor: '#f97316',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite'
          }} />

          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff', margin: '0 0 0.4rem 0' }}>
            Digitizing Task Portal
          </h3>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: 0 }}>
            Verifying workstation security credentials...
          </p>

          <style jsx>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    );
  }

  return <WorkerDashboard worker={authorizedWorker} logoutRoute="/portal/login" />;
}
