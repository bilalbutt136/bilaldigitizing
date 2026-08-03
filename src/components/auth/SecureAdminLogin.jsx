'use client';

import React, { useState } from 'react';
import { useNavigate } from '../../utils/navigation';
import { useAppState } from '../../context/StateContext';
import { ShieldCheck, Lock, Mail, ArrowRight, Home, AlertCircle } from 'lucide-react';

export const SecureAdminLogin = () => {
  const navigate = useNavigate();
  const { login, showToast } = useAppState();

  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [adminError, setAdminError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAdminError('');

    if (!adminEmail.trim() || !adminPassword.trim()) {
      setAdminError('Please enter both your master administrator email and security password key.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await login(adminEmail, adminPassword, 'admin');
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
        maxWidth: '440px',
        width: '100%',
        padding: '2.5rem',
        background: '#ffffff',
        boxShadow: 'var(--shadow-xl)',
        borderRadius: 'var(--radius-xl)'
      }}>
        
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            background: 'var(--navy-900)',
            color: 'var(--orange-500)',
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1rem',
            boxShadow: '0 4px 14px rgba(15,23,42,0.3)'
          }}>
            <ShieldCheck size={28} />
          </div>

          <h2 style={{ fontSize: '1.5rem', color: 'var(--navy-900)', marginBottom: '0.35rem' }}>
            System Operations Access
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Restricted Studio Digitizing & Admin Control Desk
          </p>
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
            <label style={{ color: 'var(--navy-900)' }}>Administrator Email</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
              <input 
                type="email" 
                className="form-control"
                placeholder="admin@example.com"
                value={adminEmail}
                onChange={(e) => { setAdminEmail(e.target.value); setAdminError(''); }}
                style={{ paddingLeft: '2.4rem' }}
                required
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '1.75rem' }}>
            <label style={{ color: 'var(--navy-900)' }}>Security Key / Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
              <input 
                type="password" 
                className="form-control"
                placeholder="Enter master password"
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
            style={{ width: '100%', marginBottom: '1rem' }}
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
