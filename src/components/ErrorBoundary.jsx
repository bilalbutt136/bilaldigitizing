'use client';

import React from 'react';
import { RefreshCw, Home, ShieldAlert } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });

    const isChunkError = 
      error?.name === 'ChunkLoadError' ||
      error?.message?.includes?.('Loading chunk') ||
      error?.message?.includes?.('Failed to fetch dynamically imported module') ||
      error?.message?.includes?.('_next/static/chunks');

    if (isChunkError && typeof window !== 'undefined') {
      const lastReload = sessionStorage.getItem('last_chunk_reload');
      const now = Date.now();
      if (!lastReload || (now - Number(lastReload)) > 10000) {
        sessionStorage.setItem('last_chunk_reload', String(now));
        window.location.reload();
      }
    }
  }

  handleReset = () => {
    try {
      sessionStorage.clear();
      window.location.href = '/';
    } catch {
      window.location.href = '/';
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          background: 'var(--bg-main)',
          color: 'var(--navy-900)',
          fontFamily: 'var(--font-body)'
        }}>
          <div className="card" style={{ maxWidth: '580px', width: '100%', padding: '2.5rem', textAlign: 'center', boxShadow: 'var(--shadow-xl)' }}>
            <div style={{
              background: '#ffe4e6',
              color: '#e11d48',
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1.25rem'
            }}>
              <ShieldAlert size={32} />
            </div>

            <h2 style={{ fontSize: '1.75rem', marginBottom: '0.75rem', color: 'var(--navy-900)' }}>
              Application Render Warning
            </h2>

            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
              An unexpected interface state occurred. No data was lost. You can safely return to the main dashboard or clear cached state.
            </p>

            {this.state.error && (
              <div style={{
                background: 'var(--navy-100)',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.8rem',
                color: 'var(--navy-800)',
                textAlign: 'left',
                fontFamily: 'monospace',
                marginBottom: '1.5rem',
                overflowX: 'auto'
              }}>
                {this.state.error.toString()}
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button 
                className="btn btn-primary-orange"
                onClick={() => {
                  this.setState({ hasError: false });
                  window.location.href = '/';
                }}
              >
                <Home size={16} /> Return to Home
              </button>

              <button 
                className="btn btn-outline"
                onClick={this.handleReset}
              >
                <RefreshCw size={16} /> Reset Application Cache
              </button>
            </div>

          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
