'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabaseClient } from '../../../../src/lib/supabaseClient';
import { 
  Scissors, 
  Lock, 
  Mail, 
  ArrowRight, 
  AlertCircle, 
  Clock, 
  UserPlus, 
  ShieldAlert,
  XCircle
} from 'lucide-react';

export default function PortalLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Status modal state: 'pending' | 'suspended' | 'rejected'
  const [workerStatusState, setWorkerStatusState] = useState(null);
  const [applicantName, setApplicantName] = useState('');

  const handleLogin = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setErrorMessage('');
    setWorkerStatusState(null);

    const cleanIdentifier = (email || '').trim();
    const cleanPass = (password || '').trim();

    if (!cleanIdentifier || !cleanPass) {
      setErrorMessage('Please enter both your username or email address and password.');
      return;
    }

    setIsLoading(true);

    try {
      // 1. Call dedicated worker login API (supports username or email, sets server cookies)
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
          setErrorMessage(data.error || 'Your application is currently under review. You will be notified once approved.');
          return;
        }
        if (data.status === 'suspended') {
          setApplicantName(data.name || cleanIdentifier);
          setWorkerStatusState('suspended');
          setErrorMessage(data.error || 'Your workstation account is currently suspended. Please contact portal administration.');
          return;
        }
        if (data.status === 'rejected') {
          setApplicantName(data.name || cleanIdentifier);
          setWorkerStatusState('rejected');
          setErrorMessage(data.error || 'Your application has been reviewed and was not approved at this time.');
          return;
        }

        setErrorMessage(data.error || 'Invalid username/email or password combination.');
        return;
      }

      // 2. Synchronize session with client-side Supabase if session returned
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

      // 3. Store local worker cache
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

      // 4. Navigate to /portal workstation with clean session state
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
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3rem 1.5rem',
        background: 'linear-gradient(135deg, #090d16 0%, #111827 100%)',
        color: '#f8fafc'
      }}>
        <div style={{
          maxWidth: '480px',
          width: '100%',
          padding: '2.5rem',
          background: '#131c2e',
          border: '1px solid #1f293d',
          borderRadius: '16px',
          textAlign: 'center',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
            color: '#ffffff',
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1.25rem',
            boxShadow: '0 8px 24px rgba(245, 158, 11, 0.3)'
          }}>
            <Clock size={32} />
          </div>

          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.5rem' }}>
            Application Under Review
          </h2>

          <p style={{ fontSize: '0.9rem', color: '#cbd5e1', lineHeight: 1.6, marginBottom: '1.5rem' }}>
            Hello <strong>{applicantName || 'Digitizer'}</strong>! Your application is currently <strong>under review</strong>.
          </p>

          <div style={{
            background: '#090e1a',
            border: '1px solid #1f293d',
            borderRadius: '10px',
            padding: '1.15rem',
            marginBottom: '1.75rem',
            fontSize: '0.85rem',
            color: '#fbbf24',
            textAlign: 'center',
            lineHeight: 1.6,
            fontWeight: 600
          }}>
            Your application is currently under review. You will be notified once approved.
          </div>

          <button
            onClick={() => setWorkerStatusState(null)}
            style={{
              width: '100%',
              padding: '0.8rem',
              borderRadius: '8px',
              background: '#1f293d',
              color: '#ffffff',
              border: '1px solid #334155',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer'
            }}
          >
            Back to Sign In
          </button>
        </div>
      </div>
    );
  }

  // Render "Account Suspended" Status Screen
  if (workerStatusState === 'suspended') {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3rem 1.5rem',
        background: 'linear-gradient(135deg, #090d16 0%, #111827 100%)',
        color: '#f8fafc'
      }}>
        <div style={{
          maxWidth: '460px',
          width: '100%',
          padding: '2.5rem',
          background: '#131c2e',
          border: '1px solid #dc2626',
          borderRadius: '16px',
          textAlign: 'center'
        }}>
          <div style={{
            background: 'rgba(220, 38, 38, 0.15)',
            color: '#ef4444',
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1rem'
          }}>
            <ShieldAlert size={30} />
          </div>

          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fca5a5', marginBottom: '0.5rem' }}>
            Account Suspended
          </h2>

          <p style={{ fontSize: '0.875rem', color: '#cbd5e1', lineHeight: 1.6, marginBottom: '1.5rem' }}>
            Your workstation account is currently suspended. Please contact portal administration.
          </p>

          <button
            onClick={() => setWorkerStatusState(null)}
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              background: '#1f293d',
              color: '#ffffff',
              border: 'none',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Back to Sign In
          </button>
        </div>
      </div>
    );
  }

  // Render "Account Rejected" Status Screen
  if (workerStatusState === 'rejected') {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3rem 1.5rem',
        background: 'linear-gradient(135deg, #090d16 0%, #111827 100%)',
        color: '#f8fafc'
      }}>
        <div style={{
          maxWidth: '460px',
          width: '100%',
          padding: '2.5rem',
          background: '#131c2e',
          border: '1px solid #dc2626',
          borderRadius: '16px',
          textAlign: 'center'
        }}>
          <div style={{
            background: 'rgba(220, 38, 38, 0.15)',
            color: '#ef4444',
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1rem'
          }}>
            <XCircle size={30} />
          </div>

          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fca5a5', marginBottom: '0.5rem' }}>
            Application Not Approved
          </h2>

          <p style={{ fontSize: '0.875rem', color: '#cbd5e1', lineHeight: 1.6, marginBottom: '1.5rem' }}>
            Your application has been reviewed and was not approved at this time.
          </p>

          <button
            onClick={() => setWorkerStatusState(null)}
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              background: '#1f293d',
              color: '#ffffff',
              border: 'none',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Back to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '3rem 1.5rem',
      background: 'linear-gradient(135deg, #090d16 0%, #111827 100%)',
      color: '#f8fafc'
    }}>
      <div style={{
        maxWidth: '440px',
        width: '100%',
        padding: '2.5rem',
        background: '#131c2e',
        border: '1px solid #1f293d',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
        borderRadius: '16px'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            background: 'linear-gradient(135deg, #f97316, #ea580c)',
            color: '#ffffff',
            width: '58px',
            height: '58px',
            borderRadius: '14px',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1rem',
            boxShadow: '0 8px 24px rgba(249, 115, 22, 0.35)'
          }}>
            <Scissors size={28} />
          </div>

          <h2 style={{ fontSize: '1.55rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.4rem', letterSpacing: '-0.02em' }}>
            Digitizing Task Portal
          </h2>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
            Workstation Authentication Desk
          </p>
        </div>

        {errorMessage && (
          <div style={{
            background: errorMessage.includes('under review') ? 'rgba(245, 158, 11, 0.12)' : 'rgba(239, 68, 68, 0.12)',
            border: errorMessage.includes('under review') ? '1px solid rgba(245, 158, 11, 0.35)' : '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '8px',
            padding: '0.85rem 1rem',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            color: errorMessage.includes('under review') ? '#fcd34d' : '#fca5a5',
            fontSize: '0.85rem',
            fontWeight: 600
          }}>
            {errorMessage.includes('under review') ? (
              <Clock size={18} style={{ color: '#f59e0b', flexShrink: 0 }} />
            ) : (
              <AlertCircle size={18} style={{ color: '#ef4444', flexShrink: 0 }} />
            )}
            <div>{errorMessage}</div>
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '0.4rem' }}>
              Username or Email Address
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
                  background: '#090e1a',
                  border: '1px solid #1f293d',
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
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: '#cbd5e1' }}>
                Account Password
              </label>
              <Link
                href="/portal/forgot-password"
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
                  background: '#090e1a',
                  border: '1px solid #1f293d',
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
            {isLoading ? 'Authenticating...' : <>Enter Workstation <ArrowRight size={18} /></>}
          </button>
        </form>

        {/* Onboarding Register Link */}
        <div style={{
          marginTop: '1.5rem',
          padding: '1rem',
          background: 'rgba(9, 14, 26, 0.6)',
          border: '1px solid #1f293d',
          borderRadius: '10px',
          textAlign: 'center'
        }}>
          <span style={{ fontSize: '0.825rem', color: '#94a3b8', display: 'block', marginBottom: '0.4rem' }}>
            New to the Task Portal?
          </span>
          <Link
            href="/portal/register"
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
            <UserPlus size={15} /> Apply for Workstation Access
          </Link>
        </div>
      </div>
    </div>
  );
}
