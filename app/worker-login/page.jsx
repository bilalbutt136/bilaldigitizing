'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppState } from '../../src/context/StateContext';
import { supabaseClient } from '../../src/lib/supabaseClient';
import { 
  Scissors, 
  Lock, 
  Mail, 
  ArrowRight, 
  Home, 
  AlertCircle, 
  Clock, 
  CheckCircle2, 
  UserPlus, 
  ShieldAlert 
} from 'lucide-react';

export default function WorkerLoginPage() {
  const router = useRouter();
  const { showToast } = useAppState();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Pending review & account status screens
  const [workerStatusState, setWorkerStatusState] = useState(null); // 'pending' | 'suspended' | 'rejected'
  const [applicantName, setApplicantName] = useState('');

  const handleLogin = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setErrorMessage('');
    setWorkerStatusState(null);

    const cleanIdentifier = (email || '').trim();
    const cleanPass = (password || '').trim();

    if (!cleanIdentifier || !cleanPass) {
      setErrorMessage('Please enter both your digitizer username/email and account password.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/worker/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: cleanIdentifier,
          password: cleanPass
        })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setIsLoading(false);
        if (data.status === 'pending') {
          setApplicantName(data.name || cleanIdentifier);
          setWorkerStatusState('pending');
          return;
        }
        if (data.status === 'suspended') {
          setApplicantName(data.name || cleanIdentifier);
          setWorkerStatusState('suspended');
          return;
        }
        if (data.status === 'rejected') {
          setApplicantName(data.name || cleanIdentifier);
          setWorkerStatusState('rejected');
          return;
        }

        setErrorMessage(data.error || 'Invalid username/email or password combination.');
        return;
      }

      if (data.session && supabaseClient) {
        try {
          await supabaseClient.auth.setSession({
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token
          });
        } catch (setErr) {
          console.warn('[Client Auth SetSession Notice]:', setErr?.message);
        }
      }

      try {
        const authPayload = {
          id: data.workerProfile?.id || data.user?.id,
          email: data.workerProfile?.email || data.user?.email,
          name: data.workerProfile?.name || cleanIdentifier,
          role: data.isAdmin ? 'admin' : 'worker',
          status: data.workerProfile?.status || 'Active'
        };
        localStorage.setItem('bdigi_auth_user', JSON.stringify(authPayload));
      } catch {}

      showToast(`Welcome to your workstation, ${data.workerProfile?.name || cleanIdentifier}!`, 'success');
      window.location.href = '/portal';
    } catch (err) {
      setIsLoading(false);
      setErrorMessage(err.message || 'An unexpected authentication error occurred.');
    }
  };

  // Render "Application Under Review" Status Screen
  if (workerStatusState === 'pending') {
    return (
      <div style={{
        minHeight: 'calc(100vh - 120px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3rem 1.5rem',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        color: '#f8fafc'
      }}>
        <div style={{
          maxWidth: '480px',
          width: '100%',
          padding: '2.5rem',
          background: '#1e293b',
          border: '1px solid #334155',
          borderRadius: '18px',
          textAlign: 'center',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
            color: '#ffffff',
            width: '68px',
            height: '68px',
            borderRadius: '50%',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1.25rem',
            boxShadow: '0 8px 24px rgba(245, 158, 11, 0.3)'
          }}>
            <Clock size={36} />
          </div>

          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.5rem' }}>
            Application Under Review
          </h2>

          <p style={{ fontSize: '0.9rem', color: '#cbd5e1', lineHeight: 1.6, marginBottom: '1.5rem' }}>
            Hello <strong>{applicantName || 'Digitizer'}</strong>! Your account has been created, but your application is currently <strong>Pending Admin Approval</strong>.
          </p>

          <div style={{
            background: '#0f172a',
            border: '1px solid #334155',
            borderRadius: '10px',
            padding: '1rem',
            marginBottom: '1.75rem',
            fontSize: '0.825rem',
            color: '#94a3b8',
            textAlign: 'left',
            lineHeight: 1.6
          }}>
            Our head digitizer inspects sample stitch files for underlay quality, pull compensation, and tie-offs. Once verified, access to the production queue will be activated immediately.
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            <button
              onClick={() => setWorkerStatusState(null)}
              style={{
                width: '100%',
                padding: '0.8rem',
                borderRadius: '8px',
                background: '#334155',
                color: '#ffffff',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: 'pointer'
              }}
            >
              Back to Login
            </button>

            <Link
              href="/"
              style={{ color: '#94a3b8', fontSize: '0.825rem', textDecoration: 'none', padding: '0.4rem' }}
            >
              Return to Website
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Render "Account Suspended" Status Screen
  if (workerStatusState === 'suspended') {
    return (
      <div style={{
        minHeight: 'calc(100vh - 120px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3rem 1.5rem',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        color: '#f8fafc'
      }}>
        <div style={{
          maxWidth: '460px',
          width: '100%',
          padding: '2.5rem',
          background: '#1e293b',
          border: '1px solid #dc2626',
          borderRadius: '18px',
          textAlign: 'center'
        }}>
          <div style={{
            background: 'rgba(220, 38, 38, 0.15)',
            color: '#ef4444',
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1rem'
          }}>
            <ShieldAlert size={34} />
          </div>

          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fca5a5', marginBottom: '0.5rem' }}>
            Account Suspended
          </h2>

          <p style={{ fontSize: '0.875rem', color: '#cbd5e1', lineHeight: 1.6, marginBottom: '1.5rem' }}>
            Your digitizer workstation access has been temporarily suspended by an administrator. Please contact the studio management for assistance.
          </p>

          <button
            onClick={() => setWorkerStatusState(null)}
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              background: '#334155',
              color: '#ffffff',
              border: 'none',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: 'calc(100vh - 120px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '3rem 1.5rem',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      color: '#f8fafc'
    }}>
      <div style={{
        maxWidth: '440px',
        width: '100%',
        padding: '2.5rem',
        background: '#1e293b',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        borderRadius: '16px'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            background: 'linear-gradient(135deg, #f97316, #ea580c)',
            color: '#ffffff',
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1rem',
            boxShadow: '0 8px 24px rgba(249, 115, 22, 0.35)'
          }}>
            <Scissors size={32} />
          </div>

          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.4rem', letterSpacing: '-0.02em' }}>
            Digitizer Workstation
          </h2>
          <p style={{ fontSize: '0.875rem', color: '#94a3b8' }}>
            Sign in to access assigned embroidery digitizing tasks and upload production files
          </p>
        </div>

        {errorMessage && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '8px',
            padding: '0.85rem 1rem',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            color: '#fca5a5',
            fontSize: '0.85rem',
            fontWeight: 600
          }}>
            <AlertCircle size={18} style={{ color: '#ef4444', flexShrink: 0 }} />
            <div>{errorMessage}</div>
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '0.4rem' }}>
              Digitizer Username or Email
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
              <input
                type="text"
                required
                value={email}
                onChange={(e) => { setEmail(e.target.value); setErrorMessage(''); }}
                placeholder="e.g. Bilal or digitizer@example.com"
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem 0.75rem 2.6rem',
                  borderRadius: '8px',
                  background: '#0f172a',
                  border: '1px solid #334155',
                  color: '#ffffff',
                  fontSize: '0.9rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <label style={{ fontSize: '0.825rem', fontWeight: 700, color: '#cbd5e1' }}>
                Security Password
              </label>
              <Link
                href="/worker/forgot-password"
                style={{ fontSize: '0.78rem', color: '#f97316', textDecoration: 'none', fontWeight: 600 }}
              >
                Forgot Password?
              </Link>
            </div>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => { setPassword(e.target.value); setErrorMessage(''); }}
                placeholder="••••••••••••"
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem 0.75rem 2.6rem',
                  borderRadius: '8px',
                  background: '#0f172a',
                  border: '1px solid #334155',
                  color: '#ffffff',
                  fontSize: '0.9rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '0.85rem',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
              color: '#ffffff',
              fontWeight: 800,
              fontSize: '0.95rem',
              border: 'none',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              boxShadow: '0 4px 12px rgba(249, 115, 22, 0.3)',
              transition: 'all 0.15s ease'
            }}
          >
            {isLoading ? 'Authenticating Workstation...' : <>Enter Workstation <ArrowRight size={18} /></>}
          </button>
        </form>

        {/* Onboarding Register Link */}
        <div style={{
          marginTop: '1.5rem',
          padding: '1rem',
          background: 'rgba(15, 23, 42, 0.6)',
          border: '1px solid #334155',
          borderRadius: '10px',
          textAlign: 'center'
        }}>
          <span style={{ fontSize: '0.825rem', color: '#94a3b8', display: 'block', marginBottom: '0.4rem' }}>
            New Embroidery Digitizer?
          </span>
          <Link
            href="/worker/register"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              color: '#f97316',
              fontWeight: 800,
              fontSize: '0.875rem',
              textDecoration: 'none'
            }}
          >
            <UserPlus size={15} /> Apply to Join Our Production Team
          </Link>
        </div>

        <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid #334155', textAlign: 'center' }}>
          <button
            type="button"
            onClick={() => router.push('/')}
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}
          >
            <Home size={14} /> Back to Studio Home
          </button>
        </div>
      </div>
    </div>
  );
}
