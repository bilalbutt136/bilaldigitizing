import React from 'react';

export default function PortfolioLoading() {
  return (
    <div style={{ background: 'var(--bg-main, #f8fafc)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <style>{`
        @keyframes customPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .skeleton {
          background-color: #e2e8f0;
          border-radius: 8px;
          animation: customPulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        .skeleton-dark {
          background-color: rgba(255,255,255,0.1);
          border-radius: 8px;
          animation: customPulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>

      {/* Header Banner Skeleton */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        padding: '60px 20px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
          <div className="skeleton-dark" style={{ height: '24px', width: '120px', marginBottom: '20px' }} />
          <div className="skeleton-dark" style={{ height: '30px', width: '250px', marginBottom: '20px', borderRadius: '9999px' }} />
          <div className="skeleton-dark" style={{ height: '60px', width: '50%', marginBottom: '20px' }} />
          <div className="skeleton-dark" style={{ height: '40px', width: '70%', marginBottom: '40px' }} />
          
          <div style={{ display: 'flex', gap: '20px' }}>
            <div className="skeleton-dark" style={{ height: '30px', width: '150px' }} />
            <div className="skeleton-dark" style={{ height: '30px', width: '150px' }} />
            <div className="skeleton-dark" style={{ height: '30px', width: '150px' }} />
          </div>
        </div>
      </div>

      {/* Main Content Skeleton */}
      <div style={{ padding: '40px 20px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        {/* Filter Tabs Skeleton */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '40px' }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="skeleton" style={{ height: '40px', width: '120px', borderRadius: '9999px' }} />
          ))}
        </div>

        {/* Gallery Grid Skeleton */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '30px' }}>
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} style={{ 
              background: '#ffffff', 
              borderRadius: '16px', 
              overflow: 'hidden',
              boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
              border: '1px solid #f1f5f9'
            }}>
              <div className="skeleton" style={{ height: '250px', width: '100%', borderRadius: '0' }} />
              <div style={{ padding: '20px' }}>
                <div className="skeleton" style={{ height: '24px', width: '70%', marginBottom: '10px' }} />
                <div className="skeleton" style={{ height: '16px', width: '40%', marginBottom: '20px' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #f1f5f9', paddingTop: '15px' }}>
                   <div className="skeleton" style={{ height: '14px', width: '30%' }} />
                   <div className="skeleton" style={{ height: '14px', width: '30%' }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
