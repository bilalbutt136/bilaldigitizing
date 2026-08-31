'use client';

import React, { useState, useEffect } from 'react';
import { useNavigate } from '../../utils/navigation';
import { useAppState } from '../../context/StateContext';
import { 
  Lock, 
  Mail, 
  User, 
  ArrowRight, 
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  ArrowLeft
} from 'lucide-react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { GoogleCustomSignInButton } from './GoogleCustomSignInButton';

const GOOGLE_CLIENT_ID = (process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '421520521310-7appibeh1m7cdd90iid17lsq8thlq2oc.apps.googleusercontent.com').trim();

export const AuthPageView = ({ initialMode = 'login' }) => {
  const navigate = useNavigate();
  const { 
    isAuthenticated, 
    authUser, 
    isAuthInitialized, 
    login, 
    loginWithGoogle, 
    register, 
    requestPasswordReset, 
    updatePassword, 
    showToast 
  } = useAppState();

  const [mode, setMode] = useState(initialMode);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [company, setCompany] = useState('');

  // Forgot password
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSubmitted, setForgotSubmitted] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  // Handle redirect query parameter if present
  const [redirectUrl, setRedirectUrl] = useState('');
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const target = params.get('redirect') || params.get('next');
      if (target && target.startsWith('/') && !target.startsWith('//')) {
        setRedirectUrl(target);
      }
    }
  }, []);

  // Check already authenticated user ONLY after Supabase session check is fully verified
  useEffect(() => {
    if (!isAuthInitialized) return;

    if (isAuthenticated && authUser?.email) {
      if (authUser?.role === 'admin') {
        navigate('/admin-portal');
      } else {
        const dest = redirectUrl || '/client-portal';
        navigate(dest);
      }
    }
  }, [isAuthenticated, authUser, isAuthInitialized, redirectUrl, navigate]);

  const handleLoginSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setErrorMessage('');

    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please enter both your email address and password.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await login(email.trim(), password, 'customer');
      setIsLoading(false);

      if (result && !result.success) {
        setErrorMessage(result.error || 'Invalid email or password. Please try again.');
        showToast(result.error || 'Login failed', 'error');
        return;
      }

      showToast('Signed in successfully!', 'success');
      const dest = redirectUrl || (result?.role === 'admin' ? '/admin-portal' : '/client-portal');
      navigate(dest);
    } catch {
      setIsLoading(false);
      setErrorMessage('An unexpected authentication error occurred. Please try again.');
    }
  };

  const handleSignupSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setErrorMessage('');

    if (!name.trim() || !email.trim() || !password.trim()) {
      setErrorMessage('Please fill in all required registration fields.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please verify your password confirmation.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await register(name.trim(), email.trim(), password, company.trim(), 'customer');
      setIsLoading(false);

      if (result && !result.success) {
        setErrorMessage(result.error || 'Account creation failed. An account with this email may already exist.');
        showToast(result.error || 'Registration failed', 'error');
        return;
      }

      showToast('Account created successfully!', 'success');
      const dest = redirectUrl || '/client-portal';
      navigate(dest);
    } catch {
      setIsLoading(false);
      setErrorMessage('An unexpected registration error occurred. Please try again.');
    }
  };

  const handleGoogleSuccess = async (googleUser) => {
    setIsLoading(true);
    try {
      const res = await loginWithGoogle(googleUser);
      setIsLoading(false);
      if (res?.success) {
        showToast(`Welcome ${res.user?.name || res.user?.email || 'back'}!`, 'success');
        const dest = redirectUrl || (res.user?.role === 'admin' ? '/admin-portal' : '/client-portal');
        navigate(dest);
      } else {
        const errorMsg = typeof res?.error === 'object' ? JSON.stringify(res.error) : res?.error;
        setErrorMessage(errorMsg || 'Google authentication failed.');
        showToast('Google authentication failed', 'error');
      }
    } catch (err) {
      setIsLoading(false);
      setErrorMessage(err?.message || 'Google login error');
    }
  };

  const handleForgotSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!forgotEmail.trim()) {
      setErrorMessage('Please enter your email address.');
      return;
    }

    setIsLoading(true);
    const res = await requestPasswordReset(forgotEmail.trim());
    setIsLoading(false);

    if (res && !res.success) {
      setErrorMessage(res.error || 'Failed to dispatch password reset link.');
      return;
    }

    setForgotSubmitted(true);
  };

  const handleUpdatePasswordSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!newPassword.trim()) {
      setErrorMessage('Please enter a new password.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setErrorMessage('Passwords do not match. Please verify your password confirmation.');
      return;
    }

    setIsLoading(true);
    const res = await updatePassword(newPassword);
    setIsLoading(false);

    if (res && !res.success) {
      setErrorMessage(res.error || 'Failed to update password.');
      return;
    }

    showToast('Password updated successfully! Welcome back.', 'success');
    navigate('/client-portal');
  };

  // 1. Sleek branded loading skeleton while initial session is verifying
  if (!isAuthInitialized) {
    return (
      <div style={{ minHeight: 'calc(100vh - 120px)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-main, #0b1120)', padding: '2rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'linear-gradient(135deg, #ea580c, #f97316)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(234, 88, 12, 0.35)' }}>
            <Sparkles size={24} color="#ffffff" />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-primary, #ffffff)', fontWeight: 700, fontSize: '0.95rem' }}>
            <Loader2 size={18} className="spin-icon" style={{ animation: 'spin 1s linear infinite' }} />
            <span>Verifying session...</span>
          </div>
        </div>
      </div>
    );
  }

  // 2. Standalone Branded Auth Container (Split Design)
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <div style={{
        minHeight: 'calc(100vh - 120px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'clamp(1.5rem, 4vw, 3rem) 1rem',
        background: 'var(--bg-main, #f8fafc)'
      }}>
        
        <div style={{
          maxWidth: '920px',
          width: '100%',
          borderRadius: '24px',
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(15, 23, 42, 0.12)',
          border: '1px solid var(--border-color, #e2e8f0)',
          background: 'var(--color-surface, #ffffff)',
          color: 'var(--color-text-primary, #0f172a)',
          display: 'grid',
          gridTemplateColumns: 'minmax(280px, 380px) 1fr',
          position: 'relative'
        }} className="auth-split-card">

          {/* LEFT PANEL: HERO BRANDING */}
          <div className="auth-split-left-panel" style={{
            background: 'linear-gradient(145deg, #090d16 0%, #0f172a 50%, #1e1b4b 100%)',
            padding: '2.25rem 2rem',
            color: '#ffffff',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative',
            overflow: 'hidden',
            borderRight: '1px solid rgba(255, 255, 255, 0.08)'
          }}>
            <div>
              <button 
                type="button" 
                onClick={() => navigate('/')} 
                style={{ 
                  background: 'rgba(255, 255, 255, 0.1)', 
                  border: '1px solid rgba(255, 255, 255, 0.15)', 
                  color: '#ffffff', 
                  borderRadius: '9999px', 
                  padding: '0.35rem 0.85rem', 
                  fontSize: '0.78rem', 
                  fontWeight: 700, 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '0.4rem', 
                  cursor: 'pointer',
                  marginBottom: '1.25rem',
                  transition: 'background 0.2s'
                }}
              >
                <ArrowLeft size={13} /> Back to Website
              </button>

              <div>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.3rem 0.75rem',
                  borderRadius: '9999px',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  background: 'rgba(245, 158, 11, 0.15)',
                  color: '#fbbf24',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  marginBottom: '1rem',
                  letterSpacing: '0.04em'
                }}>
                  ★ B DIGITIZING STUDIO
                </span>
              </div>
            </div>

            <div style={{ margin: 'auto 0', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h1 style={{ fontSize: 'clamp(1.4rem, 2.5vw, 1.75rem)', fontWeight: 900, color: '#ffffff', lineHeight: 1.25, letterSpacing: '-0.02em', margin: 0 }}>
                Pro Embroidery, Vector Art & Patches
              </h1>
              
              <p style={{ color: '#cbd5e1', fontSize: '0.85rem', lineHeight: 1.6, margin: 0 }}>
                Commercial embroidery digitizing, clean vector redraws, and physical custom patches with express 4–12 hour dispatch.
              </p>

              <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', padding: 0, margin: '0.5rem 0 0', listStyle: 'none' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.84rem', color: '#e2e8f0' }}>
                  <span style={{ color: '#34d399', fontWeight: 800 }}>✓</span> 100% Machine-Tested Precision
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.84rem', color: '#e2e8f0' }}>
                  <span style={{ color: '#34d399', fontWeight: 800 }}>✓</span> Unlimited Free Revisions for 30 Days
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.84rem', color: '#e2e8f0' }}>
                  <span style={{ color: '#34d399', fontWeight: 800 }}>✓</span> Instant Direct Download (.DST, .PES, .AI, .SVG)
                </li>
              </ul>
            </div>

            <div style={{ paddingTop: '1rem', borderTop: '1px solid rgba(255, 255, 255, 0.1)', fontSize: '0.74rem', color: '#94a3b8', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Verified Client Portal</span>
              <span style={{ color: '#34d399', fontWeight: 700 }}>● 24/7 Live Support</span>
            </div>
          </div>

          {/* RIGHT PANEL: AUTHENTICATION FORM */}
          <div style={{ padding: 'clamp(1.5rem, 4vw, 2.5rem)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            
            {/* Header & Mode Switcher */}
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <h2 style={{ fontSize: '1.65rem', fontWeight: 900, color: 'var(--color-text-primary, #0f172a)', margin: 0, letterSpacing: '-0.02em' }}>
                  {mode === 'login' ? 'Welcome Back' : mode === 'signup' ? 'Create Account' : mode === 'forgot' ? 'Reset Password' : 'New Password'}
                </h2>
              </div>

              {mode === 'login' && (
                <p style={{ color: 'var(--color-text-muted, #64748b)', fontSize: '0.86rem', margin: 0 }}>
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => { setMode('signup'); setErrorMessage(''); }}
                    style={{ background: 'none', border: 'none', color: 'var(--color-primary, #ea580c)', fontWeight: 800, cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    Register free
                  </button>
                </p>
              )}

              {mode === 'signup' && (
                <p style={{ color: 'var(--color-text-muted, #64748b)', fontSize: '0.86rem', margin: 0 }}>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => { setMode('login'); setErrorMessage(''); }}
                    style={{ background: 'none', border: 'none', color: 'var(--color-primary, #ea580c)', fontWeight: 800, cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    Sign in
                  </button>
                </p>
              )}
            </div>

            {/* Error Message Box */}
            {errorMessage && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                color: '#dc2626',
                padding: '0.65rem 0.95rem',
                borderRadius: '10px',
                fontSize: '0.825rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '1.25rem'
              }}>
                <AlertCircle size={16} flexShrink={0} />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* 1. SIGN IN FORM */}
            {mode === 'login' && (
              <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group">
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-text-primary, #0f172a)', marginBottom: '0.35rem', display: 'block' }}>
                    Email Address
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted, #94a3b8)' }} />
                    <input 
                      type="email" 
                      className="form-control"
                      placeholder="name@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      style={{ paddingLeft: '2.4rem', height: '42px', fontSize: '0.9rem' }}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-text-primary, #0f172a)', margin: 0 }}>
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => { setMode('forgot'); setErrorMessage(''); }}
                      style={{ background: 'none', border: 'none', color: 'var(--color-primary, #ea580c)', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted, #94a3b8)' }} />
                    <input 
                      type="password" 
                      className="form-control"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      style={{ paddingLeft: '2.4rem', height: '42px', fontSize: '0.9rem' }}
                      required
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="btn btn-primary-orange btn-lg"
                  style={{ width: '100%', height: '44px', fontWeight: 800, fontSize: '0.95rem', marginTop: '0.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <><Loader2 size={18} className="spin-icon" style={{ animation: 'spin 1s linear infinite' }} /> Signing in...</>
                  ) : (
                    <>Sign In <ArrowRight size={18} /></>
                  )}
                </button>

                <div style={{ display: 'flex', alignItems: 'center', margin: '0.5rem 0', color: 'var(--color-text-muted)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
                  <span style={{ padding: '0 0.75rem' }}>Or continue with</span>
                  <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
                </div>

                <GoogleCustomSignInButton
                  onAuthSuccess={handleGoogleSuccess}
                  onAuthError={(err) => setErrorMessage(err)}
                />
              </form>
            )}

            {/* 2. SIGN UP FORM */}
            {mode === 'signup' && (
              <form onSubmit={handleSignupSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div className="form-group">
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '0.25rem', display: 'block' }}>
                    Full Name *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <User size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                    <input 
                      type="text" 
                      className="form-control"
                      placeholder="e.g. John Miller"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      style={{ paddingLeft: '2.4rem', height: '40px', fontSize: '0.88rem' }}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '0.25rem', display: 'block' }}>
                    Business Email *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                    <input 
                      type="email" 
                      className="form-control"
                      placeholder="john@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      style={{ paddingLeft: '2.4rem', height: '40px', fontSize: '0.88rem' }}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="form-group">
                    <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '0.25rem', display: 'block' }}>
                      Password *
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Lock size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                      <input 
                        type="password" 
                        className="form-control"
                        placeholder="Min 6 chars"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        style={{ paddingLeft: '2.2rem', height: '40px', fontSize: '0.85rem' }}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '0.25rem', display: 'block' }}>
                      Confirm *
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Lock size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                      <input 
                        type="password" 
                        className="form-control"
                        placeholder="Confirm password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        style={{ paddingLeft: '2.2rem', height: '40px', fontSize: '0.85rem' }}
                        required
                      />
                    </div>
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="btn btn-primary-orange btn-lg"
                  style={{ width: '100%', height: '44px', fontWeight: 800, fontSize: '0.95rem', marginTop: '0.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <><Loader2 size={18} className="spin-icon" style={{ animation: 'spin 1s linear infinite' }} /> Creating account...</>
                  ) : (
                    <>Create Account <ArrowRight size={18} /></>
                  )}
                </button>

                <div style={{ display: 'flex', alignItems: 'center', margin: '0.4rem 0', color: 'var(--color-text-muted)', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
                  <span style={{ padding: '0 0.6rem' }}>Or register with</span>
                  <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
                </div>

                <GoogleCustomSignInButton
                  onAuthSuccess={handleGoogleSuccess}
                  onAuthError={(err) => setErrorMessage(err)}
                />
              </form>
            )}

            {/* 3. FORGOT PASSWORD FORM */}
            {mode === 'forgot' && (
              <div>
                {forgotSubmitted ? (
                  <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                    <CheckCircle2 size={44} style={{ color: '#10b981', margin: '0 auto 0.75rem' }} />
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '0.4rem' }}>Reset Link Dispatched</h3>
                    <p style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
                      We sent a secure recovery link to <strong>{forgotEmail}</strong>. Please check your inbox and spam folder.
                    </p>
                    <button
                      type="button"
                      className="btn btn-outline btn-md"
                      onClick={() => { setMode('login'); setForgotSubmitted(false); }}
                    >
                      Back to Sign In
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleForgotSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <p style={{ fontSize: '0.86rem', color: 'var(--color-text-muted)', margin: '0 0 0.5rem' }}>
                      Enter your account email address and we'll dispatch a secure password reset link.
                    </p>
                    <div className="form-group">
                      <div style={{ position: 'relative' }}>
                        <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                        <input 
                          type="email" 
                          className="form-control"
                          placeholder="name@company.com"
                          value={forgotEmail}
                          onChange={(e) => setForgotEmail(e.target.value)}
                          style={{ paddingLeft: '2.4rem', height: '42px', fontSize: '0.9rem' }}
                          required
                        />
                      </div>
                    </div>
                    <button 
                      type="submit" 
                      className="btn btn-primary-orange btn-lg"
                      style={{ width: '100%', height: '42px', fontWeight: 800 }}
                      disabled={isLoading}
                    >
                      {isLoading ? 'Sending Link...' : 'Send Reset Link'}
                    </button>
                    <div style={{ textAlign: 'center' }}>
                      <button
                        type="button"
                        onClick={() => { setMode('login'); setErrorMessage(''); }}
                        style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer' }}
                      >
                        ← Back to Sign In
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* 4. UPDATE PASSWORD FORM */}
            {mode === 'update_password' && (
              <form onSubmit={handleUpdatePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <p style={{ fontSize: '0.86rem', color: 'var(--color-text-muted)', margin: '0 0 0.5rem' }}>
                  Please enter and confirm your new secure password below.
                </p>
                <div className="form-group">
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '0.25rem' }}>New Password</label>
                  <input 
                    type="password" 
                    className="form-control"
                    placeholder="Min 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    style={{ height: '42px', fontSize: '0.9rem' }}
                    required
                  />
                </div>
                <div className="form-group">
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '0.25rem' }}>Confirm New Password</label>
                  <input 
                    type="password" 
                    className="form-control"
                    placeholder="Re-enter new password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    style={{ height: '42px', fontSize: '0.9rem' }}
                    required
                  />
                </div>
                <button 
                  type="submit" 
                  className="btn btn-primary-orange btn-lg"
                  style={{ width: '100%', height: '42px', fontWeight: 800 }}
                  disabled={isLoading}
                >
                  {isLoading ? 'Updating...' : 'Set New Password & Sign In'}
                </button>
              </form>
            )}

          </div>

        </div>

      </div>
    </GoogleOAuthProvider>
  );
};
