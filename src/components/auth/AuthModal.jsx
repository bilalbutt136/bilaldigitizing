'use client';

import React, { useState } from 'react';
import { useNavigate } from '../../utils/navigation';
import { useAppState } from '../../context/StateContext';
import { 
  X, 
  Lock, 
  Mail, 
  User, 
  Building2, 
  ArrowRight, 
  CheckCircle2,
  AlertCircle,
  Loader2
} from 'lucide-react';

export const AuthModal = () => {
  const navigate = useNavigate();
  const { 
    isAuthModalOpen, 
    setIsAuthModalOpen,
    authModalMode,
    setAuthModalMode,
    login,
    loginWithGoogle,
    register,
    showToast
  } = useAppState();

  // Form & Validation State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  // Signup form state
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupCompany, setSignupCompany] = useState('');

  // Forgot password state
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSubmitted, setForgotSubmitted] = useState(false);

  React.useEffect(() => {
    setAuthError('');
    setIsLoading(false);
  }, [authModalMode, isAuthModalOpen]);

  if (!isAuthModalOpen) return null;

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');

    if (!loginEmail.trim() || !loginPassword.trim()) {
      setAuthError('Please enter both your email address and password.');
      return;
    }

    setIsLoading(true);

    try {
      const result = await login(loginEmail, loginPassword);
      setIsLoading(false);

      if (result && !result.success) {
        setAuthError(result.error || 'Invalid credentials. Please verify your email and password.');
        return;
      }

      setIsAuthModalOpen(false);
      if (result?.role === 'admin') {
        navigate('/admin-portal');
      } else {
        navigate('/client-portal');
      }
    } catch (err) {
      setIsLoading(false);
      setAuthError('An unexpected authentication error occurred. Please try again.');
    }
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    if (!signupName.trim() || !signupEmail.trim() || !signupPassword.trim()) {
      setAuthError('Please fill in all required signup fields.');
      return;
    }

    setIsLoading(true);

    try {
      const result = await register(signupName, signupEmail, signupPassword, signupCompany, 'customer');
      setIsLoading(false);

      if (result && !result.success) {
        setAuthError(result.error || 'Account creation failed. Please verify your details.');
        return;
      }

      setIsAuthModalOpen(false);
      navigate('/client-portal');
    } catch (err) {
      setIsLoading(false);
      setAuthError('An unexpected registration error occurred. Please try again.');
    }
  };

  const handleForgotSubmit = (e) => {
    e.preventDefault();
    if (!forgotEmail.trim()) return;
    setForgotSubmitted(true);
    showToast(`Password reset link sent to ${forgotEmail}`, 'info');
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '460px' }}>
        
        {/* Modal Header */}
        <div style={{
          padding: '1.25rem 1.75rem',
          background: 'var(--navy-950)',
          color: '#ffffff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0'
        }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', color: '#ffffff', marginBottom: '0.15rem' }}>
              {authModalMode === 'login' ? 'Account Sign In' : authModalMode === 'signup' ? 'Create Client Account' : 'Reset Password'}
            </h3>
            <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
              BILAL DIGITIZING.PRO Studio Portal
            </div>
          </div>

          <button 
            onClick={() => { setIsAuthModalOpen(false); setAuthError(''); }}
            style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
          >
            <X size={22} />
          </button>
        </div>

        {/* Tab Controls (Login / Signup) */}
        {authModalMode !== 'forgot' && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            borderBottom: '1px solid var(--border-color)',
            background: 'var(--navy-100)'
          }}>
            <button
              type="button"
              onClick={() => { setAuthModalMode('login'); setAuthError(''); }}
              style={{
                padding: '0.85rem',
                border: 'none',
                background: authModalMode === 'login' ? '#ffffff' : 'transparent',
                color: authModalMode === 'login' ? 'var(--orange-700)' : 'var(--navy-700)',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: 'pointer',
                borderBottom: `3px solid ${authModalMode === 'login' ? 'var(--orange-600)' : 'transparent'}`
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setAuthModalMode('signup'); setAuthError(''); }}
              style={{
                padding: '0.85rem',
                border: 'none',
                background: authModalMode === 'signup' ? '#ffffff' : 'transparent',
                color: authModalMode === 'signup' ? 'var(--orange-700)' : 'var(--navy-700)',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: 'pointer',
                borderBottom: `3px solid ${authModalMode === 'signup' ? 'var(--orange-600)' : 'transparent'}`
              }}
            >
              Register New Account
            </button>
          </div>
        )}

        <div style={{ padding: '1.75rem' }}>

          {/* Validation Error Alert Box */}
          {authError && (
            <div style={{
              background: '#fef2f2',
              border: '1px solid #fca5a5',
              borderRadius: 'var(--radius-sm)',
              padding: '0.75rem 1rem',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              color: '#991b1b',
              fontSize: '0.85rem',
              fontWeight: 600
            }}>
              <AlertCircle size={18} style={{ color: '#dc2626', flexShrink: 0 }} />
              <div>{authError}</div>
            </div>
          )}

          {/* Social Sign-In Option (Google) */}
          {authModalMode !== 'forgot' && (
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {/* Continue with Google Button */}
                <button
                  type="button"
                  onClick={async () => {
                    setIsLoading(true);
                    const res = await loginWithGoogle();
                    setIsLoading(false);
                    if (res?.success) navigate('/client-portal');
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.65rem',
                    width: '100%',
                    padding: '0.7rem 1rem',
                    background: '#ffffff',
                    border: '1.5px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--navy-900)',
                    fontWeight: 700,
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                    boxShadow: 'var(--shadow-sm)',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.borderColor = 'var(--orange-500)'; }}
                  onMouseOut={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  <span>Continue with Google</span>
                </button>
              </div>

              {/* Divider */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                margin: '1.25rem 0 1rem',
                color: 'var(--text-muted)',
                fontSize: '0.72rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
                <span style={{ padding: '0 0.75rem' }}>OR CONTINUE WITH EMAIL</span>
                <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
              </div>
            </div>
          )}

          {/* MODE 1: CLEAN PUBLIC SIGN IN FORM */}
          {authModalMode === 'login' && (
            <form onSubmit={handleLoginSubmit}>
              
              {/* Email Input */}
              <div className="form-group">
                <label>Email Address</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
                  <input 
                    type="email" 
                    className="form-control"
                    placeholder="name@company.com"
                    value={loginEmail}
                    onChange={(e) => { setLoginEmail(e.target.value); setAuthError(''); }}
                    style={{ paddingLeft: '2.4rem' }}
                    required
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="form-group">
                <label>Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
                  <input 
                    type="password" 
                    className="form-control"
                    placeholder="Enter your password"
                    value={loginPassword}
                    onChange={(e) => { setLoginPassword(e.target.value); setAuthError(''); }}
                    style={{ paddingLeft: '2.4rem' }}
                    required
                  />
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '0.85rem',
                margin: '1rem 0 1.5rem'
              }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', color: 'var(--navy-800)' }}>
                  <input 
                    type="checkbox" 
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  Remember me
                </label>

                <button 
                  type="button"
                  onClick={() => { setAuthModalMode('forgot'); setAuthError(''); }}
                  style={{ background: 'none', border: 'none', color: 'var(--orange-600)', cursor: 'pointer', fontWeight: 600, fontSize: '0.825rem' }}
                >
                  Forgot Password?
                </button>
              </div>

              <button 
                type="submit" 
                className="btn btn-primary-orange btn-lg"
                style={{ width: '100%' }}
                disabled={isLoading}
              >
                {isLoading ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Loader2 size={18} className="spin-icon" style={{ animation: 'spin 1s linear infinite' }} /> Authenticating...
                  </span>
                ) : (
                  <>Sign In to Portal <ArrowRight size={18} /></>
                )}
              </button>
            </form>
          )}

          {/* MODE 2: CLIENT SIGNUP FORM */}
          {authModalMode === 'signup' && (
            <form onSubmit={handleSignupSubmit}>
              
              <div className="form-group">
                <label>Full Name *</label>
                <input 
                  type="text" 
                  className="form-control"
                  placeholder="e.g. John Miller"
                  value={signupName}
                  onChange={(e) => setSignupName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Company / Brand Name</label>
                <input 
                  type="text" 
                  className="form-control"
                  placeholder="e.g. Apex Apparel Co."
                  value={signupCompany}
                  onChange={(e) => setSignupCompany(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Business Email *</label>
                <input 
                  type="email" 
                  className="form-control"
                  placeholder="john@apexapparel.com"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label>Create Password *</label>
                <input 
                  type="password" 
                  className="form-control"
                  placeholder="Min 6 characters"
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  required
                />
              </div>

              <button 
                type="submit" 
                className="btn btn-primary-orange btn-lg"
                style={{ width: '100%' }}
              >
                Create Client Account <ArrowRight size={18} />
              </button>
            </form>
          )}

          {/* MODE 3: FORGOT PASSWORD */}
          {authModalMode === 'forgot' && (
            <div>
              {!forgotSubmitted ? (
                <form onSubmit={handleForgotSubmit}>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                    Enter your registered email address and we'll send you a password reset link.
                  </p>

                  <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                    <label>Email Address</label>
                    <input 
                      type="email" 
                      className="form-control"
                      placeholder="name@company.com"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      required
                    />
                  </div>

                  <button type="submit" className="btn btn-primary-orange btn-lg" style={{ width: '100%' }}>
                    Send Password Reset Link
                  </button>
                </form>
              ) : (
                <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                  <CheckCircle2 size={48} style={{ color: 'var(--green-500)', marginBottom: '0.75rem' }} />
                  <h4 style={{ color: 'var(--navy-900)', marginBottom: '0.5rem' }}>Reset Link Dispatched!</h4>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                    We sent a recovery link to <strong>{forgotEmail}</strong>.
                  </p>
                </div>
              )}

              <div style={{ textAlign: 'center', marginTop: '1.25rem' }}>
                <button 
                  type="button" 
                  className="btn btn-outline btn-sm"
                  onClick={() => { setAuthModalMode('login'); setAuthError(''); }}
                >
                  Back to Sign In
                </button>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
