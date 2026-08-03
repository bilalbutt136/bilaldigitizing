'use client';

import React from 'react';
import Link from 'next/link';
import { Home, AlertTriangle, UserCheck } from 'lucide-react';

export default function NotFound() {
  return (
    <div style={{
      padding: '5rem 1.5rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 'calc(100vh - 200px)',
      background: '#f8fafc'
    }}>
      <div style={{
        maxWidth: '520px',
        width: '100%',
        padding: '2.5rem',
        textAlign: 'center',
        background: '#ffffff',
        borderRadius: '24px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 20px 40px rgba(15, 23, 42, 0.08)'
      }}>
        <div style={{
          background: '#fff7ed',
          color: '#ea580c',
          width: '72px',
          height: '72px',
          borderRadius: '50%',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1.25rem',
          boxShadow: '0 4px 12px rgba(234, 88, 12, 0.15)'
        }}>
          <AlertTriangle size={36} />
        </div>

        <h1 style={{ fontSize: '1.85rem', fontWeight: 800, marginBottom: '0.5rem', color: '#0f172a' }}>
          404 - Route Not Found
        </h1>

        <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '1.75rem' }}>
          The requested page route could not be found or has been moved to a new studio path.
        </p>

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link
            href="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: '#0f172a',
              color: '#ffffff',
              padding: '0.75rem 1.5rem',
              borderRadius: '12px',
              fontWeight: 700,
              fontSize: '0.9rem',
              textDecoration: 'none'
            }}
          >
            <Home size={16} /> Return to Homepage
          </Link>

          <Link
            href="/client-portal"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: '#ff7a00',
              color: '#ffffff',
              padding: '0.75rem 1.5rem',
              borderRadius: '12px',
              fontWeight: 700,
              fontSize: '0.9rem',
              textDecoration: 'none'
            }}
          >
            <UserCheck size={16} /> Client Portal
          </Link>
        </div>
      </div>
    </div>
  );
}
