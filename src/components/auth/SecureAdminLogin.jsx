'use client';

import React, { useState } from 'react';
import { useNavigate } from '../../utils/navigation';
import { useAppState } from '../../context/StateContext';
import { ShieldCheck, Lock, Mail, ArrowRight, Home, AlertCircle, Zap } from 'lucide-react';

export const SecureAdminLogin = () => {
  const navigate = useNavigate();
  const { login, showToast } = useAppState();

  const [adminEmail, setAdminEmail] = useState('shahidbutt59191@gmail.com');
  const [adminPassword, setAdminPassword] = useState('shahid123@$');
  const [isLoading, setIsLoading] = useState(false);
  const [adminError, setAdminError] = useState('');

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setAdminError('');

    const targetEmail = (adminEmail || 'shahidbutt59191@gmail.com').trim();
    const targetPassword = (adminPassword || 'shahid123@$').trim();

    if (!targetEmail || !targetPassword) {
      setAdminError('Please enter both your master administrator email and security password key.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await login(targetEmail, targetPassword, 'admin');
      setIsLoading(false);

      if (res && !res.success) {
        setAdminError(res.error || 'Invalid administrator email or security key combination.');
        return;
      }

      navigate('/admin-portal');
      showToast('Authenticated as Master Studio Manager!', 'success');
    } catch {
      setIsLoading(false);
      setAdminError('An unexpected authentication error occurred.');
    }
  };

  const handleQuickMasterLogin = () => {
    setAdminEmail('shahidbutt59191@gmail.com');
    setAdminPassword('shahid123@$');
    setTimeout(() => {
      handleSubmit();
    }, 50);
  };

  return (
    <div style={{
      minHeight: 'calc(100vh - 140px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '3rem 1.5rem',
      background: 'var(--navy-950)',
      color: '#ffffff'
    }}>
      <div className="card" style={{
        maxWidth: '460px',
        width: '100%',
        padding: '2.5rem',
        background: '#ffffff',
        boxShadow: 'var(--shadow-xl)',
        borderRadius: 'var(--radius-xl)'
      }}>
        
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{
            background: 'linear-gradient(135deg, var(--navy-900), #ff7a00)',
            color: '#ffffff',
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '0.85rem',
            boxShadow: '0 6px 18px rgba(255,122,0,0.35)'
          }}>
            <ShieldCheck size={32} />
          </div>

          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--navy-900)', marginBottom: '0.35rem' }}>
            System Operations Access
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Restricted Studio Digitizing & Admin Control Desk
          </p>
        </div>

        {/* 1-Click Master Admin Quick Access Bar */}
        <div style={{
          background: 'linear-gradient(135deg, #fff7ed, #ffedd5)',
          border: '1.5px solid #fdba74',
          borderRadius: '12px',
          padding: '0.85rem 1rem',
          marginBottom: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.5rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#9a3412', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Master Admin Credentials Pre-loaded
            </span>
            <span className="badge badge-assigned" style={{ fontSize: '0.65rem' }}>Active</span>
          </div>

          <div style={{ fontSize: '0.8rem', color: '#431407', fontWeight: 600 }}>
            <div><strong>Email:</strong> shahidbutt59191@gmail.com</div>
            <div><strong>Password:</strong> shahid123@$</div>
          </div>

          <button
            type="button"
            onClick={handleQuickMasterLogin}
            className="btn btn-primary-orange"
            style={{
              width: '100%',
              padding: '0.5rem',
              fontSize: '0.825rem',
              fontWeight: 800,
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              marginTop: '0.2rem'
            }}
          >
            <Zap size={15} /> 1-Click Master Admin Sign In
          </button>
        </div>

        {/* Validation Error Alert Box */}
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

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label style={{ color: 'var(--navy-900)', fontWeight: 700 }}>Administrator Email</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
              <input 
                type="email" 
                className="form-control"
                placeholder="shahidbutt59191@gmail.com"
                value={adminEmail}
                onChange={(e) => { setAdminEmail(e.target.value); setAdminError(''); }}
                style={{ paddingLeft: '2.4rem' }}
                required
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '1.75rem' }}>
            <label style={{ color: 'var(--navy-900)', fontWeight: 700 }}>Security Key / Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
              <input 
                type="password" 
                className="form-control"
                placeholder="shahid123@$"
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
            {isLoading ? 'Authenticating Admin Desk...' : <>Authenticate Admin Desk <ArrowRight size={18} /></>}
          </button>
        </form>

        <div style={{ textAlign: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
          <button 
            onClick={() => navigate('/')}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.825rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <Home size={13} /> Return to Public Website
          </button>
        </div>

      </div>
    </div>
  );
};
