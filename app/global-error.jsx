'use client';

import React from 'react';

export default function GlobalError({ error, reset }) {
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
            An unexpected error occurred. Please click below to refresh the page.
          </p>
          <button
            onClick={() => reset()}
            style={{
              background: '#f97316',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              padding: '0.6rem 1.25rem',
              fontWeight: 800,
              fontSize: '0.875rem',
              cursor: 'pointer'
            }}
          >
            Refresh Page
          </button>
        </div>
      </body>
    </html>
  );
}
