'use client';

import React, { useEffect } from 'react';
import { RefreshCw, Home, AlertCircle, RotateCcw } from 'lucide-react';

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error('Next.js Client Exception Caught:', error);
  }, [error]);

  const handleHardReset = () => {
    try {
      if (typeof window !== 'undefined') {
        sessionStorage.clear();
        window.location.href = '/';
      }
    } catch {
      window.location.href = '/';
    }
  };

  return (
    <div style={{
      minHeight: '75vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      textAlign: 'center',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
    }}>
      <div style={{
        background: '#fff7ed',
        color: '#f97316',
        width: '64px',
        height: '64px',
        borderRadius: '50%',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '1.25rem',
        border: '1px solid #ffedd5'
      }}>
        <AlertCircle size={32} />
      </div>

      <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', marginBottom: '0.5rem' }}>
        Interface State Synchronizing
      </h2>
      <p style={{ color: '#64748b', fontSize: '0.9rem', maxWidth: '480px', lineHeight: 1.55, marginBottom: '1.5rem' }}>
        A temporary client-side state discrepancy occurred. Click below to reconnect or return to the main dashboard.
      </p>

      {error?.message && (
        <div style={{
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          padding: '0.6rem 1rem',
          borderRadius: '8px',
          color: '#64748b',
          fontSize: '0.78rem',
          fontFamily: 'monospace',
          marginBottom: '1.5rem',
          maxWidth: '520px',
          overflowWrap: 'break-word'
        }}>
          {error.message}
        </div>
      )}

      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
        <button
          onClick={() => reset()}
          className="btn btn-primary-orange"
          style={{ padding: '0.6rem 1.25rem', fontWeight: 800, gap: '0.4rem', cursor: 'pointer' }}
        >
          <RefreshCw size={16} /> Reconnect Session
        </button>

        <button
          onClick={handleHardReset}
          className="btn btn-outline"
          style={{ padding: '0.6rem 1.25rem', fontWeight: 700, gap: '0.4rem', cursor: 'pointer' }}
        >
          <RotateCcw size={16} /> Reset & Home
        </button>
      </div>
    </div>
  );
}
