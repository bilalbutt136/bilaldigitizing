'use client';

import React, { useState } from 'react';
import { useNavigate } from '../../utils/navigation';
import { useAppState } from '../../context/StateContext';
import { 
  X, 
  Lock, 
  Mail, 
  User, 
  ArrowRight, 
  CheckCircle2,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import AppleSignin from 'react-apple-signin-auth';

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';
const APPLE_CLIENT_ID = process.env.NEXT_PUBLIC_APPLE_CLIENT_ID || '';

export const AuthModal = () => {
  const navigate = useNavigate();
  const { 
    isAuthModalOpen, 
    setIsAuthModalOpen,
    authModalMode,
    setAuthModalMode,
    login,
    loginWithGoogle,
    loginWithApple,
    register,
    requestPasswordReset,
    updatePassword,
    showToast,
    openOrderWizard,
    orderWizardInitialData,
    authModalTarget
  } = useAppState();

  // Form & Validation State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [, setAuthError] = useState('');

  // Signup form state
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [signupCompany] = useState('');

  // Forgot & Update password state
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSubmitted, setForgotSubmitted] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  // Legal Modal State (Terms / Privacy)
  const [legalModalType, setLegalModalType] = useState(null);

  // Centered Error Modal Popup State
  const [errorModalText, setErrorModalText] = useState(null);

  React.useEffect(() => {
    setAuthError('');
    setIsLoading(false);
  }, [authModalMode, isAuthModalOpen]);

  React.useEffect(() => {
    if (!isAuthModalOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (legalModalType) {
          setLegalModalType(null);
        } else if (errorModalText) {
          setErrorModalText(null);
        } else {
          setIsAuthModalOpen(false);
          setAuthError('');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow || 'unset';
    };
  }, [isAuthModalOpen, legalModalType, errorModalText, setIsAuthModalOpen]);

  if (!isAuthModalOpen) return null;

  const handleLoginSubmit = async (e) => {
    e.preventDefault();

    if (!loginEmail.trim() || !loginPassword.trim()) {
      const err = 'Please enter both your email address and password.';
      setErrorModalText(err);
      showToast(err, 'error');
      return;
    }

    setIsLoading(true);

    try {
      const result = await login(loginEmail, loginPassword);
      setIsLoading(false);

      if (result && !result.success) {
        const err = result.error || 'Invalid login credentials. Account not found or wrong password.';
        setErrorModalText(err);
        showToast(err, 'error');
        return;
      }

      setIsAuthModalOpen(false);
      if (result?.role === 'admin') {
        navigate('/admin-portal');
      } else {
        navigate('/client-portal');
        if (orderWizardInitialData || authModalTarget === 'customer') {
          setTimeout(() => {
            if (openOrderWizard) openOrderWizard();
          }, 150);
        }
      }
    } catch {
      setIsLoading(false);
      const errText = 'An unexpected authentication error occurred. Please try again.';
      setErrorModalText(errText);
      showToast(errText, 'error');
    }
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    if (!signupName.trim() || !signupEmail.trim() || !signupPassword.trim()) {
      showToast('Please fill in all required registration fields.', 'error');
      return;
    }

    if (signupPassword !== signupConfirmPassword) {
      showToast('Passwords do not match. Please verify your password confirmation.', 'error');
      return;
    }

    setIsLoading(true);

    try {
      const result = await register(signupName, signupEmail, signupPassword, signupCompany, 'customer');
      setIsLoading(false);

      if (result && !result.success) {
        const errMsg = result.error || 'Account creation failed. An account with this email may already exist.';
        setErrorModalText(errMsg);
        showToast(errMsg, 'error');
        return;
      }

      setIsAuthModalOpen(false);
      navigate('/client-portal');
      if (orderWizardInitialData || authModalTarget === 'customer') {
        setTimeout(() => {
          if (openOrderWizard) openOrderWizard();
        }, 150);
      }
    } catch {
      setIsLoading(false);
      showToast('An unexpected registration error occurred. Please try again.', 'error');
    }
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();

    if (!forgotEmail.trim()) {
      showToast('Please enter your email address.', 'error');
      return;
    }

    setIsLoading(true);
    const res = await requestPasswordReset(forgotEmail);
    setIsLoading(false);

    if (res && !res.success) {
      showToast(res.error || 'Failed to dispatch password reset link.', 'error');
      return;
    }

    setForgotSubmitted(true);
  };

  const handleUpdatePasswordSubmit = async (e) => {
    e.preventDefault();

    if (!newPassword.trim()) {
      showToast('Please enter a new password.', 'error');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      showToast('Passwords do not match. Please verify your password confirmation.', 'error');
      return;
    }

    setIsLoading(true);
    const res = await updatePassword(newPassword);
    setIsLoading(false);

    if (res && !res.success) {
      showToast(res.error || 'Failed to update password.', 'error');
      return;
    }

    setIsAuthModalOpen(false);
    navigate('/client-portal');
  };

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <div 
        className="modal-overlay" 
        onClick={() => { setIsAuthModalOpen(false); setAuthError(''); }}
        style={{ backdropFilter: 'blur(8px)', background: 'rgba(15, 23, 42, 0.75)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
      >
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()}
        style={{ 
          maxWidth: '920px', 
          width: '100%',
          maxHeight: 'calc(100vh - 40px)',
          borderRadius: '24px', 
          overflow: 'hidden',
          boxShadow: '0 25px 70px rgba(15, 23, 42, 0.35)',
          border: '1px solid rgba(226, 232, 240, 0.8)',
          background: '#ffffff',
          display: 'grid',
          gridTemplateColumns: 'minmax(300px, 390px) 1fr',
          position: 'relative'
        }}
      >
        {/* INTERACTIVE TERMS OF SERVICE & PRIVACY POLICY MODAL OVERLAY */}
        {legalModalType && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: '#ffffff',
            zIndex: 100,
            padding: '1.75rem 2rem',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            animation: 'fadeIn 0.15s ease-out'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1.5px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <div>
                <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#ff7a00', background: 'rgba(255,122,0,0.12)', padding: '0.15rem 0.5rem', borderRadius: '4px', textTransform: 'uppercase' }}>
                  LEGAL DOCUMENTATION
                </span>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--navy-900)', margin: '0.25rem 0 0' }}>
                  {legalModalType === 'terms' ? 'Terms of Service & Studio Agreement' : 'Privacy Policy & Data Protection Standards'}
                </h3>
              </div>
              <button 
                type="button" 
                onClick={() => setLegalModalType(null)} 
                style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.15s ease' }}
                onMouseOver={(e) => { e.currentTarget.style.background = '#ff7a00'; e.currentTarget.style.color = '#ffffff'; }}
                onMouseOut={(e) => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = 'var(--navy-900)'; }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ flex: 1, fontSize: '0.84rem', color: 'var(--navy-800)', lineHeight: 1.6 }}>
              {legalModalType === 'terms' ? (
                <>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--navy-900)', marginTop: '0.5rem', marginBottom: '0.25rem' }}>1. Services & Operational Scope</h4>
                  <p style={{ marginBottom: '0.85rem', color: 'var(--text-muted)' }}>
                    BILAL DIGITIZING.PRO provides custom embroidery digitizing, vector redraws, and custom patch manufacturing. Account registration establishes an agreement to abide by studio dispatch protocols and commercial production guidelines.
                  </p>

                  <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--navy-900)', marginTop: '0.5rem', marginBottom: '0.25rem' }}>2. Full Client IP & Ownership Rights</h4>
                  <p style={{ marginBottom: '0.85rem', color: 'var(--text-muted)' }}>
                    Upon settlement of your order balance, all digitized machine stitch files (.DST, .PES, .EMB, .EXP) and vectorized artwork source files (.AI, .EPS, .SVG, .PDF) become 100% your intellectual property with full commercial reproduction rights.
                  </p>

                  <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--navy-900)', marginTop: '0.5rem', marginBottom: '0.25rem' }}>3. Quality Assurance & 30-Day Free Revisions</h4>
                  <p style={{ marginBottom: '0.85rem', color: 'var(--text-muted)' }}>
                    We guarantee machine-ready precision for all commercial and home embroidery machines. We offer unlimited free revisions for 30 days post-delivery to ensure optimal sew-out quality on your garments.
                  </p>

                  <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--navy-900)', marginTop: '0.5rem', marginBottom: '0.25rem' }}>4. Delivery Timelines & Express Turnaround</h4>
                  <p style={{ marginBottom: '0.85rem', color: 'var(--text-muted)' }}>
                    Standard orders are delivered within 4 to 12 hours. Express requests are prioritized with 24/7 studio dispatch to meet urgent apparel production deadlines.
                  </p>
                </>
              ) : (
                <>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--navy-900)', marginTop: '0.5rem', marginBottom: '0.25rem' }}>1. Artwork Non-Disclosure & Confidentiality</h4>
                  <p style={{ marginBottom: '0.85rem', color: 'var(--text-muted)' }}>
                    Your uploaded artwork, custom logos, and client brand assets are strictly confidential. We maintain strict NDA protocols; your designs will never be published, sold, or distributed to third parties.
                  </p>

                  <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--navy-900)', marginTop: '0.5rem', marginBottom: '0.25rem' }}>2. Data Encryption & Payment Security</h4>
                  <p style={{ marginBottom: '0.85rem', color: 'var(--text-muted)' }}>
                    User registration data and session credentials are protected using 256-bit SSL encryption. All payment processing is routed through PCI-DSS Level 1 certified gateways (Stripe/Supabase).
                  </p>

                  <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--navy-900)', marginTop: '0.5rem', marginBottom: '0.25rem' }}>3. Cookie Usage & Portal Preferences</h4>
                  <p style={{ marginBottom: '0.85rem', color: 'var(--text-muted)' }}>
                    Essential cookies are utilized strictly to preserve active client portal authorization state, wallet balance preferences, and interactive order wizard inputs.
                  </p>
                </>
              )}
            </div>

            <div style={{ marginTop: '1rem', textAlign: 'right', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
              <button 
                type="button" 
                className="btn btn-primary-orange btn-sm" 
                onClick={() => setLegalModalType(null)} 
                style={{ borderRadius: 'var(--radius-md)', fontWeight: 800, padding: '0.5rem 1.25rem' }}
              >
                Close & Return to Form
              </button>
            </div>
          </div>
        )}

        {/* Floating Close Button */}
        <button 
          type="button"
          onClick={() => { setIsAuthModalOpen(false); setAuthError(''); }}
          style={{ 
            position: 'absolute',
            top: '1.25rem',
            right: '1.25rem',
            background: '#f1f5f9', 
            border: '1px solid var(--border-color)', 
            color: 'var(--navy-900)', 
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 10,
            transition: 'all 0.15s ease'
          }}
          onMouseOver={(e) => { e.currentTarget.style.background = '#ff7a00'; e.currentTarget.style.color = '#ffffff'; }}
          onMouseOut={(e) => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = 'var(--navy-900)'; }}
          aria-label="Close"
        >
          <X size={18} />
        </button>

        {/* LEFT PANEL: BRANDED VALUE PROPOSITION (EMBROIDERY, VECTOR ART & CUSTOM PATCHES) */}
        <div 
          className="auth-split-left-panel"
          style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
            padding: '2rem 1.75rem',
            color: '#ffffff',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative',
            overflow: 'hidden',
            borderRight: '1px solid rgba(255, 255, 255, 0.08)'
          }}
        >
          <div>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.35rem 0.85rem',
              borderRadius: '9999px',
              fontSize: '0.75rem',
              fontWeight: 700,
              background: 'rgba(245, 158, 11, 0.12)',
              color: '#fbbf24',
              border: '1px solid rgba(245, 158, 11, 0.25)',
              marginBottom: '1rem',
              letterSpacing: '0.03em'
            }}>
              ★ BILAL DIGITIZING.PRO STUDIO
            </span>
          </div>

          <div style={{ margin: 'auto 0', display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
            <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: '#ffffff', lineHeight: 1.25, letterSpacing: '-0.02em', margin: 0 }}>
              Pro Embroidery, Vector Art & Custom Patches
            </h1>
            
            <p style={{ color: '#cbd5e1', fontSize: '0.875rem', lineHeight: 1.6, margin: 0 }}>
              Your all-in-one studio for premium digital assets and production-ready files.
            </p>

            <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: 0, margin: 0, listStyle: 'none' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.875rem', color: '#e2e8f0' }}>
                <span style={{ color: '#34d399', fontWeight: 800 }}>✓</span> Custom Embroidery Digitizing (PES, DST)
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.875rem', color: '#e2e8f0' }}>
                <span style={{ color: '#34d399', fontWeight: 800 }}>✓</span> Clean Vector Art & Redraw Services
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.875rem', color: '#e2e8f0' }}>
                <span style={{ color: '#34d399', fontWeight: 800 }}>✓</span> Custom Patches & Woven Labels
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.875rem', color: '#e2e8f0' }}>
                <span style={{ color: '#34d399', fontWeight: 800 }}>✓</span> Fast 4–12 Hour Turnaround
              </li>
            </ul>
          </div>

          <div style={{ paddingTop: '1rem', borderTop: '1px solid rgba(255, 255, 255, 0.1)', fontSize: '0.75rem', color: '#94a3b8', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
            <span>Trusted by Apparel Brands Worldwide</span>
            <span style={{ color: '#34d399', fontWeight: 600 }}>● 100% Manual Quality</span>
          </div>
        </div>
        {/* RIGHT PANEL: AUTHENTICATION FORMS (COMPACT ZERO-SCROLL FITTING) */}
        <div style={{ padding: '1.5rem 1.75rem', overflowY: 'auto', maxHeight: 'calc(100vh - 40px)', boxSizing: 'border-box' }}>
          
          {/* Header section with title and quick toggle */}
          <div style={{ marginBottom: '0.9rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--navy-900)', marginBottom: '0.15rem', letterSpacing: '-0.01em' }}>
              {authModalMode === 'login' ? 'Welcome back' : authModalMode === 'signup' ? 'Create a new account' : 'Reset your password'}
            </h2>

            {authModalMode === 'signup' && (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', margin: 0 }}>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => { setAuthModalMode('login'); setAuthError(''); }}
                  style={{ background: 'none', border: 'none', color: '#ff7a00', fontWeight: 800, cursor: 'pointer', textDecoration: 'underline' }}
                >
                  Sign in
                </button>
              </p>
            )}

            {authModalMode === 'login' && (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', margin: 0 }}>
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => { setAuthModalMode('signup'); setAuthError(''); }}
                  style={{ background: 'none', border: 'none', color: '#ff7a00', fontWeight: 800, cursor: 'pointer', textDecoration: 'underline' }}
                >
                  Register free
                </button>
              </p>
            )}
          </div>

          {/* MODE 2: CLIENT SIGNUP FORM (TOP SECTION MANUAL FORM FIRST!) */}
          {authModalMode === 'signup' && (
            <form onSubmit={handleSignupSubmit} name="signupForm" method="post">
              
              {/* 1. Full Name */}
              <div className="form-group" style={{ marginBottom: '0.6rem' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--navy-900)', marginBottom: '0.2rem', display: 'block' }}>
                  Full Name *
                </label>
                <div style={{ position: 'relative' }}>
                  <User size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
                  <input 
                    type="text" 
                    name="name"
                    autoComplete="name"
                    className="form-control"
                    placeholder="e.g. John Miller"
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                    style={{ paddingLeft: '2.3rem', height: '38px', borderRadius: 'var(--radius-md)', fontSize: '0.85rem' }}
                    required
                  />
                </div>
              </div>

              {/* 2. Business Email */}
              <div className="form-group" style={{ marginBottom: '0.6rem' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--navy-900)', marginBottom: '0.2rem', display: 'block' }}>
                  Business Email *
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
                  <input 
                    type="email" 
                    name="email"
                    autoComplete="username"
                    className="form-control"
                    placeholder="john@company.com"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    style={{ paddingLeft: '2.3rem', height: '38px', borderRadius: 'var(--radius-md)', fontSize: '0.85rem' }}
                    required
                  />
                </div>
              </div>

              {/* 3. Create Password */}
              <div className="form-group" style={{ marginBottom: '0.6rem' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--navy-900)', marginBottom: '0.2rem', display: 'block' }}>
                  Create Password *
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
                  <input 
                    type="password" 
                    name="password"
                    autoComplete="new-password"
                    className="form-control"
                    placeholder="Min 6 characters"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    style={{ paddingLeft: '2.3rem', height: '38px', borderRadius: 'var(--radius-md)', fontSize: '0.85rem' }}
                    required
                  />
                </div>
              </div>

              {/* 4. Confirm Password */}
              <div className="form-group" style={{ marginBottom: '0.85rem' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--navy-900)', marginBottom: '0.2rem', display: 'block' }}>
                  Confirm Password *
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
                  <input 
                    type="password" 
                    name="confirmPassword"
                    autoComplete="new-password"
                    className="form-control"
                    placeholder="Re-enter your password"
                    value={signupConfirmPassword}
                    onChange={(e) => setSignupConfirmPassword(e.target.value)}
                    style={{ paddingLeft: '2.3rem', height: '38px', borderRadius: 'var(--radius-md)', fontSize: '0.85rem' }}
                    required
                  />
                </div>
              </div>

              <button 
                type="submit" 
                className="btn btn-primary-orange btn-lg"
                style={{ width: '100%', height: '40px', borderRadius: 'var(--radius-md)', fontWeight: 800, fontSize: '0.88rem' }}
                disabled={isLoading}
              >
                {isLoading ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Loader2 size={16} className="spin-icon" style={{ animation: 'spin 1s linear infinite' }} /> Creating Account...
                  </span>
                ) : (
                  <>Create Client Account <ArrowRight size={16} /></>
                )}
              </button>

              {/* CLEAN "OR" DIVIDER */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                margin: '0.75rem 0 0.6rem',
                color: 'var(--text-muted)',
                fontSize: '0.7rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
                <span style={{ padding: '0 0.6rem' }}>Or continue with</span>
                <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
              </div>

              {/* BOTTOM SECTION: SOCIAL LOGINS (GOOGLE & APPLE) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <GoogleLogin
                    onSuccess={async (credentialResponse) => {
                      setIsLoading(true);
                      try {
                        const res = await loginWithGoogle(credentialResponse.credential);
                        setIsLoading(false);
                        if (res?.success) {
                          setIsAuthModalOpen(false);
                          navigate('/client-portal');
                        } else if (res?.error) {
                          const errorMsg = typeof res.error === 'object' ? JSON.stringify(res.error) : res.error;
                          setErrorModalText(errorMsg === '{}' ? 'Google Auth Provider is missing or misconfigured in Supabase.' : errorMsg);
                          showToast('Authentication failed', 'error');
                        }
                      } catch (err) {
                        setIsLoading(false);
                        showToast(err?.message || 'Google Sign-In failed.', 'error');
                      }
                    }}
                    onError={() => {
                      showToast('Google Sign-In failed', 'error');
                    }}
                    auto_select={false}
                    itp_support={false}
                    shape="rectangular"
                    theme="outline"
                    text="continue_with"
                    size="large"
                    width="100%"
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', width: '100%', marginTop: '0.2rem' }}>
                  <AppleSignin
                    authOptions={{
                      clientId: APPLE_CLIENT_ID,
                      scope: 'email name',
                      redirectURI: typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : '',
                      state: 'state',
                      nonce: 'nonce',
                      usePopup: true
                    }}
                    uiType="dark"
                    className="apple-auth-btn"
                    noDefaultStyle={false}
                    buttonExtraChildren="Continue with Apple"
                    onSuccess={async (response) => {
                      if (response?.authorization?.id_token) {
                        setIsLoading(true);
                        try {
                          const res = await loginWithApple(response.authorization.id_token);
                          setIsLoading(false);
                          if (res?.success) {
                            setIsAuthModalOpen(false);
                            navigate('/client-portal');
                          } else if (res?.error) {
                            setErrorModalText(res.error);
                            showToast(res.error, 'error');
                          }
                        } catch (err) {
                          setIsLoading(false);
                          showToast(err?.message || 'Apple Sign-In failed.', 'error');
                        }
                      }
                    }}
                    onError={(error) => showToast('Apple Sign-In failed.', 'error')}
                  />
                </div>
              </div>

              <div style={{ marginTop: '0.65rem', textAlign: 'center', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                By joining, you agree to our{' '}
                <button 
                  type="button" 
                  onClick={() => setLegalModalType('terms')} 
                  style={{ background: 'none', border: 'none', padding: 0, color: '#ff7a00', textDecoration: 'underline', cursor: 'pointer', fontWeight: 700, fontSize: '0.7rem' }}
                >
                  Terms of Service
                </button>{' '}
                &{' '}
                <button 
                  type="button" 
                  onClick={() => setLegalModalType('privacy')} 
                  style={{ background: 'none', border: 'none', padding: 0, color: '#ff7a00', textDecoration: 'underline', cursor: 'pointer', fontWeight: 700, fontSize: '0.7rem' }}
                >
                  Privacy Policy
                </button>.
              </div>
            </form>
          )}

          {/* MODE 1: CLEAN PUBLIC SIGN IN FORM */}
          {authModalMode === 'login' && (
            <form onSubmit={handleLoginSubmit} name="loginForm" method="post">
              
              {/* Email Input */}
              <div className="form-group" style={{ marginBottom: '0.85rem' }}>
                <label htmlFor="email" style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--navy-900)', marginBottom: '0.2rem', display: 'block' }}>
                  Email Address
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
                  <input 
                    type="email" 
                    id="email"
                    name="email"
                    autoComplete="email"
                    className="form-control"
                    placeholder="name@company.com"
                    value={loginEmail}
                    onChange={(e) => { setLoginEmail(e.target.value); setAuthError(''); }}
                    style={{ paddingLeft: '2.3rem', height: '40px', borderRadius: 'var(--radius-md)', fontSize: '0.88rem' }}
                    required
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="form-group" style={{ marginBottom: '0.85rem' }}>
                <label htmlFor="password" style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--navy-900)', marginBottom: '0.2rem', display: 'block' }}>
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
                  <input 
                    type="password" 
                    id="password"
                    name="password"
                    autoComplete="current-password"
                    className="form-control"
                    placeholder="Enter your password"
                    value={loginPassword}
                    onChange={(e) => { setLoginPassword(e.target.value); setAuthError(''); }}
                    style={{ paddingLeft: '2.3rem', height: '40px', borderRadius: 'var(--radius-md)', fontSize: '0.88rem' }}
                    required
                  />
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '0.82rem',
                margin: '0.75rem 0 1.1rem'
              }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', color: 'var(--navy-800)', fontWeight: 600 }}>
                  <input 
                    type="checkbox" 
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    style={{ accentColor: '#ff7a00' }}
                  />
                  Remember me
                </label>

                <button 
                  type="button"
                  onClick={() => { setAuthModalMode('forgot'); setAuthError(''); }}
                  style={{ background: 'none', border: 'none', color: 'var(--orange-600)', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem' }}
                >
                  Forgot Password?
                </button>
              </div>

              <button 
                type="submit" 
                className="btn btn-primary-orange btn-lg"
                style={{ width: '100%', height: '42px', borderRadius: 'var(--radius-md)', fontWeight: 800, fontSize: '0.9rem' }}
                disabled={isLoading}
              >
                {isLoading ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Loader2 size={16} className="spin-icon" style={{ animation: 'spin 1s linear infinite' }} /> Authenticating...
                  </span>
                ) : (
                  <>Sign In to Portal <ArrowRight size={16} /></>
                )}
              </button>

              {/* CLEAN "OR" DIVIDER */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                margin: '0.85rem 0 0.7rem',
                color: 'var(--text-muted)',
                fontSize: '0.7rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
                <span style={{ padding: '0 0.6rem' }}>Or continue with</span>
                <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
              </div>

              {/* SOCIAL LOGINS FOR SIGN IN */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <GoogleLogin
                    onSuccess={async (credentialResponse) => {
                      setIsLoading(true);
                      try {
                        const res = await loginWithGoogle(credentialResponse.credential);
                        setIsLoading(false);
                        if (res?.success) {
                          setIsAuthModalOpen(false);
                          navigate('/client-portal');
                        } else if (res?.error) {
                          const errorMsg = typeof res.error === 'object' ? JSON.stringify(res.error) : res.error;
                          setErrorModalText(errorMsg === '{}' ? 'Google Auth Provider is missing or misconfigured in Supabase.' : errorMsg);
                          showToast('Authentication failed', 'error');
                        }
                      } catch (err) {
                        setIsLoading(false);
                        showToast(err?.message || 'Google Sign-In failed.', 'error');
                      }
                    }}
                    onError={() => {
                      showToast('Google Sign-In failed', 'error');
                    }}
                    auto_select={false}
                    itp_support={false}
                    shape="rectangular"
                    theme="outline"
                    text="continue_with"
                    size="large"
                    width="100%"
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', width: '100%', marginTop: '0.2rem' }}>
                  <AppleSignin
                    authOptions={{
                      clientId: APPLE_CLIENT_ID,
                      scope: 'email name',
                      redirectURI: typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : '',
                      state: 'state',
                      nonce: 'nonce',
                      usePopup: true
                    }}
                    uiType="dark"
                    className="apple-auth-btn"
                    noDefaultStyle={false}
                    buttonExtraChildren="Continue with Apple"
                    onSuccess={async (response) => {
                      if (response?.authorization?.id_token) {
                        setIsLoading(true);
                        try {
                          const res = await loginWithApple(response.authorization.id_token);
                          setIsLoading(false);
                          if (res?.success) {
                            setIsAuthModalOpen(false);
                            navigate('/client-portal');
                          } else if (res?.error) {
                            setErrorModalText(res.error);
                            showToast(res.error, 'error');
                          }
                        } catch (err) {
                          setIsLoading(false);
                          showToast(err?.message || 'Apple Sign-In failed.', 'error');
                        }
                      }
                    }}
                    onError={(error) => showToast('Apple Sign-In failed.', 'error')}
                  />
                </div>
              </div>
            </form>
          )}

          {/* MODE 3: FORGOT PASSWORD */}
          {authModalMode === 'forgot' && (
            <div>
              {!forgotSubmitted ? (
                <form onSubmit={handleForgotSubmit} name="forgotPasswordForm" method="post">
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                    Enter your registered email address and we'll send you a password reset link.
                  </p>

                  <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--navy-900)', marginBottom: '0.35rem', display: 'block' }}>
                      Email Address
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Mail size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
                      <input 
                        type="email" 
                        name="email"
                        autoComplete="email"
                        className="form-control"
                        placeholder="name@company.com"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        style={{ paddingLeft: '2.5rem', height: '44px', borderRadius: 'var(--radius-md)', fontSize: '0.9rem' }}
                        required
                      />
                    </div>
                  </div>

                  <button type="submit" className="btn btn-primary-orange btn-lg" style={{ width: '100%', height: '46px', borderRadius: 'var(--radius-md)', fontWeight: 800 }}>
                    Send Password Reset Link
                  </button>
                </form>
              ) : (
                <div style={{ textAlign: 'center', padding: '0.85rem 0' }}>
                  <CheckCircle2 size={46} style={{ color: 'var(--green-500)', marginBottom: '0.6rem' }} />
                  <h4 style={{ color: 'var(--navy-900)', marginBottom: '0.4rem', fontWeight: 800, fontSize: '1.2rem' }}>
                    Password Reset Email Sent!
                  </h4>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem', marginBottom: '1.15rem', lineHeight: 1.5 }}>
                    We have dispatched a secure password recovery link to <br />
                    <strong style={{ color: 'var(--navy-900)' }}>{forgotEmail}</strong>.
                  </p>

                  <div style={{ background: '#f8fafc', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '0.85rem 1rem', textAlign: 'left', marginBottom: '1.15rem', fontSize: '0.82rem', color: 'var(--navy-800)' }}>
                    <div style={{ fontWeight: 800, color: 'var(--navy-900)', marginBottom: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span>📬</span> Next Steps:
                    </div>
                    <p style={{ margin: 0, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                      Click the link inside your email to set a new password. If you don't see the email in your inbox within 2 minutes, please check your <strong>Spam or Junk folder</strong>.
                    </p>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.65rem', justifyContent: 'center', alignItems: 'center', marginTop: '1.1rem', flexWrap: 'wrap' }}>
                {forgotSubmitted && (
                  <button 
                    type="button" 
                    className="btn btn-primary-orange btn-sm"
                    onClick={() => setForgotSubmitted(false)}
                    style={{ borderRadius: 'var(--radius-md)', fontWeight: 800, padding: '0.45rem 1rem', fontSize: '0.825rem' }}
                  >
                    Try Again / Resend Email
                  </button>
                )}

                <button 
                  type="button" 
                  className="btn btn-outline btn-sm"
                  onClick={() => { setAuthModalMode('login'); setForgotSubmitted(false); }}
                  style={{ borderRadius: 'var(--radius-md)', fontWeight: 700, padding: '0.45rem 1rem', fontSize: '0.825rem' }}
                >
                  Back to Sign In
                </button>
              </div>
            </div>
          )}

          {/* MODE 4: UPDATE PASSWORD (EMAIL RECOVERY LINK CALLBACK) */}
          {authModalMode === 'update_password' && (
            <form onSubmit={handleUpdatePasswordSubmit} name="updatePasswordForm" method="post">
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                Enter your new secure password below to update your account credentials.
              </p>

              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--navy-900)', marginBottom: '0.3rem', display: 'block' }}>
                  New Password *
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
                  <input 
                    type="password" 
                    name="newPassword"
                    autoComplete="new-password"
                    className="form-control"
                    placeholder="Min 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    style={{ paddingLeft: '2.3rem', height: '40px', borderRadius: 'var(--radius-md)', fontSize: '0.88rem' }}
                    required
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '1.35rem' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--navy-900)', marginBottom: '0.3rem', display: 'block' }}>
                  Confirm New Password *
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
                  <input 
                    type="password" 
                    name="confirmNewPassword"
                    autoComplete="new-password"
                    className="form-control"
                    placeholder="Re-enter your new password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    style={{ paddingLeft: '2.3rem', height: '40px', borderRadius: 'var(--radius-md)', fontSize: '0.88rem' }}
                    required
                  />
                </div>
              </div>

              <button 
                type="submit" 
                className="btn btn-primary-orange btn-lg"
                style={{ width: '100%', height: '42px', borderRadius: 'var(--radius-md)', fontWeight: 800, fontSize: '0.9rem' }}
                disabled={isLoading}
              >
                {isLoading ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Loader2 size={16} className="spin-icon" style={{ animation: 'spin 1s linear infinite' }} /> Updating Password...
                  </span>
                ) : (
                  'Save New Password'
                )}
              </button>
            </form>
          )}

        </div>

      </div>

      {/* PROMINENT CENTERED LOGIN ERROR MODAL POPUP OVERLAY */}
      {errorModalText && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(8px)',
            zIndex: 30000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.25rem',
            animation: 'fadeIn 0.2s ease-out'
          }}
          onClick={() => setErrorModalText(null)}
        >
          <div 
            style={{
              maxWidth: '440px',
              width: '100%',
              background: '#ffffff',
              borderRadius: '24px',
              padding: '2rem 1.75rem',
              boxShadow: '0 25px 70px rgba(15, 23, 42, 0.45), 0 0 0 1.5px rgba(239, 68, 68, 0.3)',
              textAlign: 'center',
              position: 'relative',
              animation: 'scaleUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close X icon */}
            <button
              type="button"
              onClick={() => setErrorModalText(null)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: '#f8fafc',
                border: '1px solid var(--border-color)',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--navy-700)',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseOver={(e) => { e.currentTarget.style.background = '#f1f5f9'; }}
              onMouseOut={(e) => { e.currentTarget.style.background = '#f8fafc'; }}
            >
              <X size={16} />
            </button>

            {/* Glowing Red Warning Header Badge */}
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #fef2f2, #fee2e2)',
              border: '2px solid #fca5a5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem',
              boxShadow: '0 8px 24px rgba(239, 68, 68, 0.2)'
            }}>
              <AlertCircle size={36} style={{ color: '#dc2626' }} />
            </div>

            <h3 style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--navy-900)', marginBottom: '0.65rem', letterSpacing: '-0.01em' }}>
              Authentication Error
            </h3>

            <p style={{ fontSize: '0.925rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '1.75rem' }}>
              {typeof errorModalText === 'object' ? JSON.stringify(errorModalText) : (errorModalText === '{}' ? 'Server returned a generic error. Please check if email confirmations or providers are configured properly in Supabase.' : errorModalText)}
            </p>

            <button
              type="button"
              className="btn btn-primary-orange"
              onClick={() => setErrorModalText(null)}
              style={{
                width: '100%',
                height: '46px',
                borderRadius: '12px',
                fontWeight: 800,
                fontSize: '0.95rem',
                boxShadow: '0 6px 20px rgba(255, 122, 0, 0.35)'
              }}
            >
              OK, Got It
            </button>
          </div>
        </div>
      )}
      </div>
    </GoogleOAuthProvider>
  );
};
