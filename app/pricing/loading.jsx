import React from 'react';

export default function PricingLoading() {
  return (
    <div style={{ padding: '60px 20px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
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
      `}</style>
      
      {/* Header Skeleton */}
      <div style={{ textAlign: 'center', marginBottom: '60px' }}>
        <div className="skeleton" style={{ height: '30px', width: '250px', margin: '0 auto 20px', borderRadius: '9999px' }} />
        <div className="skeleton" style={{ height: '50px', width: '60%', margin: '0 auto 20px' }} />
        <div className="skeleton" style={{ height: '24px', width: '50%', margin: '0 auto' }} />
      </div>

      {/* Pricing Cards Skeleton */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '30px' }}>
        {[1, 2, 3].map((i) => (
          <div key={i} style={{ 
            background: '#ffffff', 
            borderRadius: '24px', 
            padding: '40px 30px', 
            boxShadow: '0 10px 40px -10px rgba(0,0,0,0.08)',
            border: '1px solid #f1f5f9'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px' }}>
              <div className="skeleton" style={{ width: '60px', height: '60px', borderRadius: '16px' }} />
              <div>
                <div className="skeleton" style={{ height: '24px', width: '150px', marginBottom: '10px' }} />
                <div className="skeleton" style={{ height: '16px', width: '100px' }} />
              </div>
            </div>
            
            <div className="skeleton" style={{ height: '48px', width: '100%', marginBottom: '30px' }} />
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '40px' }}>
              {[1, 2, 3, 4].map(j => (
                <div key={j} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div className="skeleton" style={{ width: '20px', height: '20px', borderRadius: '50%' }} />
                  <div className="skeleton" style={{ height: '16px', width: '80%' }} />
                </div>
              ))}
            </div>
            
            <div className="skeleton" style={{ height: '50px', width: '100%', borderRadius: '12px' }} />
          </div>
        ))}
      </div>
    </div>
  );
}
