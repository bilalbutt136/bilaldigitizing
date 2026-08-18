'use client';

import React from 'react';

export default function GlobalError({ error, reset }) {
  React.useEffect(() => {
    console.error('Global Error Boundary caught:', error);
  }, [error]);

  const handleReload = () => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('bdigi_current_view');
        window.location.href = '/';
        return;
      }
    } catch {}
    if (reset) reset();
  };

  return (
    <html lang="en">
      <body style={{
        fontFamily: "'Inter', sans-serif",
        background: '#f8fafc',
        color: '#0f172a',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        textAlign: 'center'
      }}>
        <div style={{
          background: '#ffffff',
          borderRadius: '16px',
          padding: '2.5rem',
          maxWidth: '520px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
          border: '1px solid #e2e8f0'
        }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem', color: '#0f172a' }}>
            Application State Restored
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
            An unexpected session state occurred. Click below to continue.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={handleReload}
              style={{
                background: '#f97316',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '0.65rem 1.4rem',
                fontWeight: 800,
                fontSize: '0.875rem',
                cursor: 'pointer'
              }}
            >
              Return to Studio Home
            </button>
            <button
              onClick={() => {
                if (reset) reset();
                else if (typeof window !== 'undefined') window.location.reload();
              }}
              style={{
                background: '#f1f5f9',
                color: '#0f172a',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                padding: '0.65rem 1.4rem',
                fontWeight: 700,
                fontSize: '0.875rem',
                cursor: 'pointer'
              }}
            >
              Reload
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
