'use client';

import React, { useCallback, useRef, useState } from 'react';
import { useNavigate } from '../../utils/navigation';
import { useAppState } from '../../context/StateContext';
import {
  ShieldCheck,
  Lock,
  Mail,
  ArrowRight,
  Home,
  AlertCircle,
  Loader2,
  Smartphone,
  KeyRound,
  Copy,
  CheckCircle2
} from 'lucide-react';
import {
  beginAdminMfaEnrollment,
  getAdminMfaPolicy,
  getAdminMfaStatus,
  verifyAdminMfaCode
} from '../../services/adminMfaService';
import MobileAdminConsole from '../admin/MobileAdminConsole';

export const SecureAdminLogin = () => {
  const navigate = useNavigate();
  const {
    login,
    showToast,
    isAuthInitialized,
    isAuthenticated,
    authUser,
    setCurrentView
  } = useAppState();

  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [adminError, setAdminError] = useState('');
  const [mfaStage, setMfaStage] = useState('password');
  const [mfaFactorId, setMfaFactorId] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [mfaEnrollment, setMfaEnrollment] = useState(null);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [viewportReady, setViewportReady] = useState(false);
  const preparationRef = useRef(null);

  React.useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const media = window.matchMedia('(max-width: 900px)');
    const syncViewport = () => {
      setIsMobileViewport(media.matches);
      setViewportReady(true);
    };

    syncViewport();
    media.addEventListener?.('change', syncViewport);
    return () => media.removeEventListener?.('change', syncViewport);
  }, []);

  const openVerifiedAdminArea = useCallback(() => {
    if (isMobileViewport) {
      setCurrentView?.('admin');
      setMfaStage('mobile-console');
      return;
    }

    navigate('/admin-portal', { replace: true });
  }, [isMobileViewport, navigate, setCurrentView]);

  const prepareAdminMfa = useCallback(async () => {
    if (preparationRef.current) return preparationRef.current;

    const task = (async () => {
      setIsLoading(true);
      setAdminError('');
      setMfaStage('checking');

      const policy = await getAdminMfaPolicy();
      if (policy.success && policy.enabled === false) {
        openVerifiedAdminArea();
        return true;
      }

      const status = await getAdminMfaStatus();
      if (!status.success) {
        setAdminError(status.error || 'Unable to verify administrator MFA status.');
        setMfaStage('password');
        return false;
      }

      if (status.currentLevel === 'aal2') {
        openVerifiedAdminArea();
        return true;
      }

      if (status.hasVerifiedFactor) {
        setMfaFactorId(status.verifiedFactors[0].id);
        setMfaEnrollment(null);
        setMfaCode('');
        setMfaStage('challenge');
        return false;
      }

      const enrollment = await beginAdminMfaEnrollment();
      if (!enrollment.success) {
        setAdminError(enrollment.error || 'Unable to start authenticator setup.');
        setMfaStage('password');
        return false;
      }

      setMfaFactorId(enrollment.factorId);
      setMfaEnrollment(enrollment);
      setMfaCode('');
      setMfaStage('enroll');
      return false;
    })();

    preparationRef.current = task;
    try {
      return await task;
    } finally {
      preparationRef.current = null;
      setIsLoading(false);
    }
  }, [openVerifiedAdminArea]);

  React.useEffect(() => {
    if (!isAuthInitialized || !viewportReady) return;
    if (isAuthenticated && authUser?.role === 'admin') {
      prepareAdminMfa();
    }
  }, [isAuthInitialized, isAuthenticated, authUser?.role, viewportReady, prepareAdminMfa]);

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    setAdminError('');

    const targetEmail = (adminEmail || '').trim();
    const targetPassword = (adminPassword || '').trim();

    if (!targetEmail || !targetPassword) {
      setAdminError('Please enter both your administrator email and security password key.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await login(targetEmail, targetPassword, 'admin');

      if (res && !res.success) {
        setAdminError(res.error || 'Invalid administrator email or security key combination.');
        setIsLoading(false);
        return;
      }

      setAdminPassword('');
      await prepareAdminMfa();
    } catch {
      setAdminError('An unexpected authentication error occurred.');
      setIsLoading(false);
    }
  };

  const handleVerifyMfa = async (e) => {
    e?.preventDefault?.();
    setAdminError('');

    if (!/^\d{6}$/.test(String(mfaCode || '').trim())) {
      setAdminError('Enter the 6-digit code from your authenticator app.');
      return;
    }

    setIsLoading(true);
    const result = await verifyAdminMfaCode(mfaFactorId, mfaCode);
    setIsLoading(false);

    if (!result.success) {
      setAdminError(result.error || 'The authenticator code is invalid or expired.');
      setMfaCode('');
      return;
    }

    showToast('Administrator multi-factor verification complete.', 'success');
    openVerifiedAdminArea();
  };

  const handleCopySecret = async () => {
    const secret = mfaEnrollment?.secret;
    if (!secret || typeof navigator === 'undefined' || !navigator.clipboard) return;

    try {
      await navigator.clipboard.writeText(secret);
      setCopiedSecret(true);
      window.setTimeout(() => setCopiedSecret(false), 1800);
    } catch {
      setAdminError('Could not copy the setup key automatically. You can select and copy it manually.');
    }
  };

  const qrCode = mfaEnrollment?.qrCode || '';
  const qrCodeSrc = qrCode.startsWith('<svg')
    ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(qrCode)}`
    : qrCode;

  if (!isAuthInitialized || !viewportReady || mfaStage === 'checking') {
    return (
      <div style={{
        minHeight: 'calc(100vh - 140px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-main)',
        color: 'var(--color-text-primary)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <Loader2 className="animate-spin" size={34} style={{ color: 'var(--color-primary)' }} />
          <div style={{ marginTop: '0.8rem', fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            Verifying administrator security...
          </div>
        </div>
      </div>
    );
  }

  if (mfaStage === 'mobile-console') {
    return <MobileAdminConsole />;
  }

  const isMfaStep = mfaStage === 'challenge' || mfaStage === 'enroll';

  return (
    <div style={{
      minHeight: 'calc(100vh - 140px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1rem',
      background: 'var(--bg-main)',
      color: 'var(--color-text-primary)'
    }}>
      <div className="card" style={{
        maxWidth: isMfaStep ? '500px' : '440px',
        width: '100%',
        padding: 'clamp(1.25rem, 5vw, 2.5rem)',
        background: 'var(--bg-card)',
        boxShadow: 'var(--shadow-xl)',
        borderRadius: 'var(--radius-xl)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{
            background: 'linear-gradient(135deg, var(--color-surface-elevated, var(--navy-900)), var(--color-primary))',
            color: 'var(--color-text-on-primary, #ffffff)',
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '0.85rem',
            boxShadow: '0 6px 18px var(--color-primary-glow)'
          }}>
            {isMfaStep ? <Smartphone size={30} /> : <ShieldCheck size={32} />}
          </div>

          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--navy-900)', marginBottom: '0.35rem' }}>
            {mfaStage === 'enroll'
              ? 'Protect Your Admin Account'
              : (mfaStage === 'challenge' ? 'Two-Step Verification' : 'System Operations Access')}
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            {mfaStage === 'enroll'
              ? 'Admin access requires an authenticator app before the control desk can open.'
              : (mfaStage === 'challenge'
                ? 'Enter the current 6-digit code from your authenticator app.'
                : 'Restricted Studio Digitizing & Admin Control Desk')}
          </p>
        </div>

        {adminError && (
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
            <div>{adminError}</div>
          </div>
        )}

        {mfaStage === 'password' && (
          <form onSubmit={handleSubmit}>
            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label style={{ color: 'var(--navy-900)', fontWeight: 700 }}>Administrator Email</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
                <input
                  type="email"
                  name="email"
                  id="admin-email"
                  autoComplete="email"
                  className="form-control"
                  placeholder="Administrator email"
                  value={adminEmail}
                  onChange={(e) => { setAdminEmail(e.target.value); setAdminError(''); }}
                  style={{ paddingLeft: '2.4rem' }}
                  required
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '1.75rem' }}>
              <label htmlFor="admin-password" style={{ color: 'var(--navy-900)', fontWeight: 700 }}>Security Key / Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
                <input
                  type="password"
                  name="password"
                  id="admin-password"
                  autoComplete="current-password"
                  className="form-control"
                  placeholder="••••••••••••"
                  value={adminPassword}
                  onChange={(e) => { setAdminPassword(e.target.value); setAdminError(''); }}
                  style={{ paddingLeft: '2.4rem' }}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-navy btn-lg"
              style={{ width: '100%', marginBottom: '1rem', fontWeight: 800 }}
              disabled={isLoading}
            >
              {isLoading ? <><Loader2 size={18} className="animate-spin" /> Authenticating...</> : <>Continue Secure Login <ArrowRight size={18} /></>}
            </button>
          </form>
        )}

        {mfaStage === 'enroll' && (
          <form onSubmit={handleVerifyMfa}>
            <div style={{ background: 'var(--color-subtle, #f8fafc)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '1rem', marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--navy-900)', marginBottom: '0.6rem' }}>
                1. Add BDigitizing to your authenticator
              </div>

              {qrCodeSrc && (
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.9rem' }}>
                  <img
                    src={qrCodeSrc}
                    alt="Authenticator setup QR code"
                    width="200"
                    height="200"
                    style={{ width: '200px', maxWidth: '70vw', height: 'auto', background: '#ffffff', borderRadius: '12px', padding: '8px', border: '1px solid #e2e8f0' }}
                  />
                </div>
              )}

              {mfaEnrollment?.uri && (
                <a
                  href={mfaEnrollment.uri}
                  style={{ display: 'block', textAlign: 'center', fontSize: '0.8rem', fontWeight: 800, color: 'var(--color-primary)', marginBottom: '0.75rem' }}
                >
                  Open in authenticator app on this phone
                </a>
              )}

              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                If you cannot scan the QR code, enter this setup key manually:
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <code style={{ flex: 1, minWidth: 0, overflowWrap: 'anywhere', padding: '0.65rem', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', fontSize: '0.78rem', fontWeight: 800 }}>
                  {mfaEnrollment?.secret}
                </code>
                <button type="button" onClick={handleCopySecret} className="btn btn-outline btn-sm" title="Copy setup key">
                  {copiedSecret ? <CheckCircle2 size={15} /> : <Copy size={15} />}
                </button>
              </div>
            </div>

            <div style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--navy-900)', marginBottom: '0.45rem' }}>
              2. Enter the 6-digit code
            </div>
            <div style={{ position: 'relative', marginBottom: '1rem' }}>
              <KeyRound size={17} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6}"
                maxLength={6}
                className="form-control"
                placeholder="123456"
                value={mfaCode}
                onChange={(e) => { setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6)); setAdminError(''); }}
                style={{ paddingLeft: '2.5rem', letterSpacing: '0.25rem', fontWeight: 900, textAlign: 'center' }}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary-orange btn-lg" style={{ width: '100%', fontWeight: 800 }} disabled={isLoading}>
              {isLoading ? <><Loader2 size={18} className="animate-spin" /> Verifying...</> : <>Enable MFA & Open Admin Desk <ShieldCheck size={18} /></>}
            </button>
          </form>
        )}

        {mfaStage === 'challenge' && (
          <form onSubmit={handleVerifyMfa}>
            <div style={{ background: 'var(--color-subtle, #f8fafc)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '0.85rem 1rem', marginBottom: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Your password was accepted. Administrator privileges remain locked until the second factor is verified.
            </div>

            <div style={{ position: 'relative', marginBottom: '1rem' }}>
              <KeyRound size={17} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6}"
                maxLength={6}
                className="form-control"
                placeholder="123456"
                value={mfaCode}
                onChange={(e) => { setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6)); setAdminError(''); }}
                style={{ paddingLeft: '2.5rem', letterSpacing: '0.25rem', fontWeight: 900, textAlign: 'center' }}
                autoFocus
                required
              />
            </div>

            <button type="submit" className="btn btn-primary-orange btn-lg" style={{ width: '100%', fontWeight: 800 }} disabled={isLoading}>
              {isLoading ? <><Loader2 size={18} className="animate-spin" /> Verifying...</> : <>Verify & Open Admin Desk <ArrowRight size={18} /></>}
            </button>
          </form>
        )}

        <div style={{ textAlign: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: '1rem' }}>
          <button
            type="button"
            onClick={() => navigate('/')}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.825rem', cursor: 'pointer', display: 'inline-flex', fontStyle: 'italic', alignItems: 'center', gap: '0.35rem' }}
          >
            <Home size={13} /> Return to Public Website
          </button>
        </div>
      </div>
    </div>
  );
};
