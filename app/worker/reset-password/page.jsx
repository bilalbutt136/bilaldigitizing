'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabaseClient } from '../../../src/lib/supabaseClient';
import { Scissors, Lock, CheckCircle2, AlertCircle, ArrowRight, Clock, RefreshCw } from 'lucide-react';

export default function WorkerResetPasswordPage() {
  const router = useRouter();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Session verification states
  const [isVerifyingSession, setIsVerifyingSession] = useState(true);
  const [hasValidSession, setHasValidSession] = useState(false);
  const [sessionExpiredError, setSessionExpiredError] = useState('');

  const authCredentialsRef = useRef({
    code: null,
    tokenHash: null,
    accessToken: null
  });

  useEffect(() => {
    let isMounted = true;
    let timeoutId = null;

    async function initializeRecoverySession() {
      try {
        if (typeof window === 'undefined') return;

        const url = new URL(window.location.href);
        const searchParams = url.searchParams;

        const errorDesc = searchParams.get('error_description') || searchParams.get('error');
        if (errorDesc) {
          if (isMounted) {
            setSessionExpiredError(errorDesc);
            setIsVerifyingSession(false);
          }
          return;
        }

        const code = searchParams.get('code');
        const tokenHash = searchParams.get('token_hash');
        const hash = window.location.hash || '';

        let accessToken = null;
        let refreshToken = null;

        if (hash && hash.includes('access_token=')) {
          const hashParams = new URLSearchParams(hash.replace(/^#/, ''));
          accessToken = hashParams.get('access_token');
          refreshToken = hashParams.get('refresh_token');
        }

        authCredentialsRef.current = { code, tokenHash, accessToken };

        if (!supabaseClient) {
          if (isMounted) {
            setSessionExpiredError('Database connection unavailable.');
            setIsVerifyingSession(false);
          }
          return;
        }

        // 1. If PKCE code exists in search params, exchange it immediately
        if (code) {
          try {
            const { data, error } = await supabaseClient.auth.exchangeCodeForSession(code);
            if (!error && data?.session) {
              if (isMounted) {
                setHasValidSession(true);
                setIsVerifyingSession(false);
              }
              return;
            }
          } catch (codeErr) {
            console.warn('PKCE exchange error notice:', codeErr?.message);
          }
        }

        // 2. If token_hash exists (OTP flow)
        if (tokenHash) {
          try {
            const { data, error } = await supabaseClient.auth.verifyOtp({
              token_hash: tokenHash,
              type: 'recovery'
            });
            if (!error && data?.session) {
              if (isMounted) {
                setHasValidSession(true);
                setIsVerifyingSession(false);
              }
              return;
            }
          } catch (otpErr) {
            console.warn('OTP verification error notice:', otpErr?.message);
          }
        }

        // 3. If hash parameters contained bearer tokens
        if (accessToken && refreshToken) {
          try {
            const { data, error } = await supabaseClient.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken
            });
            if (!error && data?.session) {
              if (isMounted) {
                setHasValidSession(true);
                setIsVerifyingSession(false);
              }
              return;
            }
          } catch (hashErr) {
            console.warn('Hash session set error notice:', hashErr?.message);
          }
        }

        // 4. Check existing session in storage/cookies
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (session) {
          if (isMounted) {
            setHasValidSession(true);
            setIsVerifyingSession(false);
          }
          return;
        }

        // 5. Allow up to 1.5 seconds for background Supabase auth state change event
        const { data: { subscription } } = supabaseClient.auth.onAuthStateChange((event, s) => {
          if ((event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN' || s) && isMounted) {
            setHasValidSession(true);
            setIsVerifyingSession(false);
            if (timeoutId) clearTimeout(timeoutId);
          }
        });

        timeoutId = setTimeout(() => {
          if (isMounted) {
            supabaseClient.auth.getSession().then(({ data: { session: finalSession } }) => {
              if (finalSession) {
                setHasValidSession(true);
                setIsVerifyingSession(false);
              } else {
                setHasValidSession(false);
                setIsVerifyingSession(false);
              }
            });
          }
        }, 1500);

        return () => {
          subscription?.unsubscribe();
          if (timeoutId) clearTimeout(timeoutId);
        };
      } catch (initErr) {
        console.warn('Session init error notice:', initErr?.message);
        if (isMounted) {
          setIsVerifyingSession(false);
        }
      }
    }

    initializeRecoverySession();

    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  const handleUpdatePassword = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setErrorMessage('');

    if (!password || password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setIsLoading(true);

    try {
      let updateSucceeded = false;

      // Strategy 1: Client-side Supabase updateUser
      if (supabaseClient) {
        try {
          const { error } = await supabaseClient.auth.updateUser({
            password: password
          });

          if (!error) {
            updateSucceeded = true;
          }
        } catch (clientErr) {
          console.warn('Client updateUser attempt notice:', clientErr?.message);
        }
      }

      // Strategy 2: Server API route fallback
      if (!updateSucceeded) {
        const { code, tokenHash, accessToken } = authCredentialsRef.current;
        const res = await fetch('/api/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            password,
            code,
            tokenHash,
            accessToken
          })
        });

        const data = await res.json();
        if (res.ok && data.success) {
          updateSucceeded = true;
        } else {
          throw new Error(data.error || 'Password update failed.');
        }
      }

      if (updateSucceeded) {
        setIsSuccess(true);
        setTimeout(() => {
          router.replace('/worker-login');
        }, 2200);
      }
    } catch (err) {
      const msg = err.message || '';
      if (msg.toLowerCase().includes('session missing') || msg.toLowerCase().includes('auth session')) {
        setErrorMessage('Your password reset session expired. Please request a fresh reset link below.');
        setHasValidSession(false);
      } else {
        setErrorMessage(msg || 'Failed to update workstation password.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // State 1: Verifying recovery session
  if (isVerifyingSession) {
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
          borderRadius: '16px',
          textAlign: 'center'
        }}>
          <div style={{
            margin: '0 auto 1.25rem',
            width: '40px',
            height: '40px',
            border: '3px solid rgba(249, 115, 22, 0.2)',
            borderTopColor: '#f97316',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite'
          }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.4rem' }}>
            Verifying Reset Link
          </h3>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: 0 }}>
            Establishing secure workstation credentials...
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

  // State 2: Expired or missing session link
  if (!hasValidSession && !isSuccess) {
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
          border: '1px solid #1f293d',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
          borderRadius: '16px',
          textAlign: 'center'
        }}>
          <div style={{
            background: 'rgba(239, 68, 68, 0.12)',
            color: '#f87171',
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1.25rem',
            boxShadow: '0 8px 24px rgba(239, 68, 68, 0.2)'
          }}>
            <Clock size={32} />
          </div>

          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.5rem' }}>
            Reset Link Expired or Used
          </h2>

          <p style={{ fontSize: '0.875rem', color: '#cbd5e1', lineHeight: 1.6, marginBottom: '1.5rem' }}>
            {sessionExpiredError || 'This password reset link has already been used or has expired for your security. Please request a fresh reset link.'}
          </p>

          <Link
            href="/worker/forgot-password"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              width: '100%',
              padding: '0.85rem',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
              color: '#ffffff',
              fontWeight: 800,
              fontSize: '0.95rem',
              textDecoration: 'none',
              boxShadow: '0 4px 14px rgba(249, 115, 22, 0.35)',
              boxSizing: 'border-box',
              marginBottom: '1rem'
            }}
          >
            <RefreshCw size={17} /> Request New Reset Link
          </Link>

          <Link
            href="/worker-login"
            style={{
              fontSize: '0.85rem',
              color: '#94a3b8',
              textDecoration: 'none',
              fontWeight: 600
            }}
          >
            Return to Workstation Login
          </Link>
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

          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.4rem', letterSpacing: '-0.02em' }}>
            Set New Password
          </h2>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
            Enter your new secure password to restore access to your task workstation
          </p>
        </div>

        {isSuccess ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              background: 'rgba(34, 197, 94, 0.12)',
              border: '1px solid rgba(34, 197, 94, 0.3)',
              borderRadius: '12px',
              padding: '1.25rem',
              marginBottom: '1.5rem',
              color: '#86efac'
            }}>
              <CheckCircle2 size={36} style={{ color: '#22c55e', margin: '0 auto 0.65rem' }} />
              <strong style={{ color: '#ffffff', display: 'block', fontSize: '1.05rem', marginBottom: '0.35rem' }}>
                Password Updated!
              </strong>
              Your workstation credentials have been securely updated. Redirecting to login...
            </div>

            <Link
              href="/worker-login"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                color: '#f97316',
                fontWeight: 700,
                fontSize: '0.9rem',
                textDecoration: 'none'
              }}
            >
              Sign In Now <ArrowRight size={16} />
            </Link>
          </div>
        ) : (
          <>
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

            <form onSubmit={handleUpdatePassword}>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '0.4rem' }}>
                  New Password
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
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

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '0.4rem' }}>
                  Confirm New Password
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
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
                {isLoading ? 'Updating Password...' : <>Save New Password <ArrowRight size={18} /></>}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
