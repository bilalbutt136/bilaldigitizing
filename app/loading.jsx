import React from 'react';

export default function Loading() {
  return (
    <div style={{
      minHeight: '70vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '3rem 1.5rem',
      background: 'var(--bg-main, #f8fafc)'
    }}>
      <style>{`
        @keyframes bdigiPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.45; }
        }
        .bdigi-skeleton {
          background: linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%);
          background-size: 200% 100%;
          animation: bdigiPulse 1.8s ease-in-out infinite;
          border-radius: 12px;
        }
      `}</style>
      
      <div style={{ width: '100%', maxWidth: '800px', display: 'flex', flexDirection: 'column', gap: '1.25rem', alignItems: 'center' }}>
        <div className="bdigi-skeleton" style={{ height: '28px', width: '160px', borderRadius: '999px' }} />
        <div className="bdigi-skeleton" style={{ height: '44px', width: '70%' }} />
        <div className="bdigi-skeleton" style={{ height: '20px', width: '85%' }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', width: '100%', marginTop: '1.5rem' }}>
          <div className="bdigi-skeleton" style={{ height: '180px', borderRadius: '16px' }} />
          <div className="bdigi-skeleton" style={{ height: '180px', borderRadius: '16px' }} />
          <div className="bdigi-skeleton" style={{ height: '180px', borderRadius: '16px' }} />
        </div>
      </div>
    </div>
  );
}
