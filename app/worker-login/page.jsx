'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppState } from '../../src/context/StateContext';
import { supabaseClient } from '../../src/lib/supabaseClient';
import { Scissors, Lock, Mail, ArrowRight, Home, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function WorkerLoginPage() {
  const router = useRouter();
  const { login, showToast } = useAppState();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setErrorMessage('');

    const cleanEmail = (email || '').toLowerCase().trim();
    const cleanPass = (password || '').trim();

    if (!cleanEmail || !cleanPass) {
      setErrorMessage('Please enter both your digitizer email and account password.');
      return;
    }

    setIsLoading(true);

    try {
      if (!supabaseClient) {
        throw new Error('Supabase client connection unavailable.');
      }

      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: cleanEmail,
        password: cleanPass
      });

      if (error || !data?.user) {
        setIsLoading(false);
        setErrorMessage(error?.message || 'Invalid email or password combination.');
        return;
      }

      // Verify worker role or admin authorization
      const user = data.user;
      let isWorker = user.user_metadata?.role === 'worker' || user.user_metadata?.role === 'admin';

      if (!isWorker) {
        const { data: workerData } = await supabase
          .from('workers')
          .select('id, status')
          .eq('email', cleanEmail)
          .maybeSingle();

        if (workerData && workerData.status === 'active') {
          isWorker = true;
        }
      }

      // Store auth in local storage for fast client sync
      try {
        const authPayload = {
          id: user.id,
          email: user.email,
          name: user.user_metadata?.full_name || user.user_metadata?.name || cleanEmail.split('@')[0],
          role: isWorker ? 'worker' : 'customer'
        };
        localStorage.setItem('bdigi_auth_user', JSON.stringify(authPayload));
      } catch {}

      setIsLoading(false);
      showToast('Digitizer Station Verified. Welcome!', 'success');
      router.replace('/worker');
    } catch (err) {
      setIsLoading(false);
      setErrorMessage(err.message || 'An unexpected authentication error occurred.');
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
              Worker Email Address
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => { setEmail(e.target.value); setErrorMessage(''); }}
                placeholder="worker@bdigitizing.pro"
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem 0.75rem 2.6rem',
                  borderRadius: '8px',
                  background: '#0f172a',
                  border: '1px solid #334155',
                  color: '#ffffff',
                  fontSize: '0.9rem',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '1.75rem' }}>
            <label style={{ display: 'block', fontSize: '0.825rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '0.4rem' }}>
              Security Password
            </label>
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
                  outline: 'none'
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

        <div style={{ marginTop: '1.75rem', paddingTop: '1.25rem', borderTop: '1px solid #334155', textAlign: 'center' }}>
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
