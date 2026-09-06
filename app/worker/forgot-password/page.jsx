'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { supabaseClient } from '../../../src/lib/supabaseClient';
import { Scissors, Mail, ArrowRight, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';

export default function WorkerForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleResetRequest = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setErrorMessage('');

    const cleanEmail = (email || '').toLowerCase().trim();
    if (!cleanEmail) {
      setErrorMessage('Please enter your digitizer account email address.');
      return;
    }

    setIsLoading(true);

    try {
      if (!supabaseClient) {
        throw new Error('Database connection unavailable.');
      }

      const origin = typeof window !== 'undefined' ? window.location.origin : 'https://bilaldigitizing.vercel.app';
      const redirectToUrl = `${origin}/auth/callback?next=/worker/reset-password`;

      const { error } = await supabaseClient.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: redirectToUrl
      });

      if (error) {
        throw error;
      }

      setIsSuccess(true);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to send password reset email.');
    } finally {
      setIsLoading(false);
    }
  };

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

          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.4rem', letterSpacing: '-0.02em' }}>
            Reset Workstation Password
          </h2>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
            Enter your registered digitizer email address and we will send you a secure recovery link
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
              color: '#86efac',
              fontSize: '0.9rem',
              lineHeight: 1.5
            }}>
              <CheckCircle2 size={32} style={{ color: '#22c55e', margin: '0 auto 0.65rem' }} />
              <strong style={{ color: '#ffffff', display: 'block', fontSize: '1rem', marginBottom: '0.35rem' }}>
                Reset Link Dispatched!
              </strong>
              We have dispatched a secure password recovery link to <strong style={{ color: '#ffffff' }}>{email}</strong>. Please check your inbox and spam folders.
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
              <ArrowLeft size={16} /> Return to Digitizer Login
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

            <form onSubmit={handleResetRequest}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '0.4rem' }}>
                  Registered Email Address
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setErrorMessage(''); }}
                    placeholder="digitizer@bdigitizing.pro"
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
                {isLoading ? 'Dispatching Reset Link...' : <>Send Recovery Link <ArrowRight size={18} /></>}
              </button>
            </form>

            <div style={{ marginTop: '1.75rem', paddingTop: '1.25rem', borderTop: '1px solid #334155', textAlign: 'center' }}>
              <Link
                href="/worker-login"
                style={{
                  color: '#94a3b8',
                  fontSize: '0.85rem',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
              >
                <ArrowLeft size={14} /> Back to Sign In
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
