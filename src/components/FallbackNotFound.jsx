'use client';

import React from 'react';
import { useAppState } from '../context/StateContext';
import { Construction, Home, UserCheck } from 'lucide-react';

export const FallbackNotFound = () => {
  const { protectedNavigate } = useAppState();

  return (
    <div style={{
      padding: '5rem 1.5rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 'calc(100vh - 200px)',
      background: 'var(--bg-main)'
    }}>
      <div className="card" style={{ maxWidth: '520px', width: '100%', padding: '2.5rem', textAlign: 'center' }}>
        <div style={{
          background: 'var(--orange-50)',
          color: 'var(--orange-600)',
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1.25rem'
        }}>
          <Construction size={32} />
        </div>

        <h2 style={{ fontSize: '1.75rem', marginBottom: '0.5rem', color: 'var(--navy-900)' }}>
          Page Under Construction / Route Fallback
        </h2>

        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '1.75rem' }}>
          The requested page route is either under active studio enhancement or redirects back to your active portal dashboard.
        </p>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            className="btn btn-primary-orange"
            onClick={() => protectedNavigate('public')}
          >
            <Home size={16} /> Return to Public Site
          </button>

          <button
            className="btn btn-primary-orange"
            onClick={() => protectedNavigate('customer')}
          >
            <UserCheck size={16} /> Go to Client Portal
          </button>
        </div>
      </div>
    </div>
  );
};
