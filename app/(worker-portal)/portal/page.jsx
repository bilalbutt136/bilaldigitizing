'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseClient } from '../../../src/lib/supabaseClient';
import { WorkerDashboard } from '../../../src/components/worker/WorkerDashboard';
import { Scissors } from 'lucide-react';

export default function WorkerPortalDashboardPage() {
  const router = useRouter();
  const [isVerifying, setIsVerifying] = useState(true);
  const [authorizedWorker, setAuthorizedWorker] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function verifyWorkerSession() {
      try {
        // 1. Try server-verified session via /api/worker/session (validates cookies securely)
        try {
          const sessionRes = await fetch('/api/worker/session');
          if (sessionRes.ok) {
            const sessionJson = await sessionRes.json();
            if (sessionJson?.authenticated && sessionJson?.worker) {
              if (isMounted) {
                setAuthorizedWorker(sessionJson.worker);
                setIsVerifying(false);
              }
              return;
            } else if (sessionJson?.status === 'pending' || sessionJson?.status === 'suspended' || sessionJson?.status === 'rejected') {
              if (isMounted) {
                router.replace('/portal/login');
              }
              return;
            }
          }
        } catch (apiErr) {
          console.warn('[Server Worker Session Fetch Notice]:', apiErr?.message);
        }

        // 2. Client-side Supabase verification fallback
        if (!supabaseClient) {
          throw new Error('Database client unavailable');
        }

        let user = null;
        const { data: sessionData } = await supabaseClient.auth.getSession();
        if (sessionData?.session?.user) {
          user = sessionData.session.user;
        } else {
          const { data: authData } = await supabaseClient.auth.getUser();
          user = authData?.user;
        }

        if (!user) {
          if (isMounted) {
            router.replace('/portal/login');
          }
          return;
        }

        const userEmail = (user.email || '').toLowerCase().trim();

        // 3. Admin user bypass
        const isAdmin = user.user_metadata?.role === 'admin' || user.app_metadata?.role === 'admin';
        if (isAdmin) {
          if (isMounted) {
            setAuthorizedWorker({
              id: user.id,
              name: user.user_metadata?.full_name || user.user_metadata?.name || 'Studio Administrator',
              email: userEmail,
              specialty: 'Studio Management',
              role: 'admin',
              status: 'Active'
            });
            setIsVerifying(false);
          }
          return;
        }

        // 4. Query status from worker_profiles & workers
        let workerProfile = null;
        try {
          const { data: profile } = await supabaseClient
            .from('worker_profiles')
            .select('*')
            .or(`id.eq.${user.id},email.eq.${userEmail}`)
            .maybeSingle();

          if (profile) workerProfile = profile;
        } catch (dbErr) {
          console.warn('Worker profile fetch notice:', dbErr?.message);
        }

        if (!workerProfile) {
          try {
            const { data: workerRow } = await supabaseClient
              .from('workers')
              .select('*')
              .or(`id.eq.${user.id},email.eq.${userEmail}`)
              .maybeSingle();

            if (workerRow) workerProfile = workerRow;
          } catch {}
        }

        const rawStatus = workerProfile?.status || user.user_metadata?.worker_status || user.user_metadata?.status || 'pending';
        const normalizedStatus = (rawStatus || '').toLowerCase();

        // 5. Enforce Status Rules
        if (normalizedStatus === 'pending' || normalizedStatus === 'suspended' || normalizedStatus === 'rejected') {
          await supabaseClient.auth.signOut();
          try { localStorage.removeItem('bdigi_auth_user'); } catch {}
          if (isMounted) {
            router.replace('/portal/login');
          }
          return;
        }

        // 6. Active Worker -> Grant Workstation Access
        if (isMounted) {
          setAuthorizedWorker({
            id: workerProfile?.id || user.id,
            name: workerProfile?.name || user.user_metadata?.full_name || user.user_metadata?.name || userEmail.split('@')[0],
            email: userEmail,
            phone: workerProfile?.phone || user.user_metadata?.phone,
            specialty: workerProfile?.primary_software || workerProfile?.specialty || 'Embroidery Digitizer',
            status: workerProfile?.status || 'Active',
            role: 'worker'
          });
          setIsVerifying(false);
        }
      } catch (err) {
        console.error('Session verification error:', err);
        if (isMounted) {
          router.replace('/portal/login');
        }
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
            <Scissors size={30} color="#ffffff" />
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
