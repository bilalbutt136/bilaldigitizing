'use client';

import React, { useState, useEffect } from 'react';
import { UploadCloud, CheckCircle, AlertCircle, X } from 'lucide-react';

export default function GlobalUploadModal() {
  const [uploads, setUploads] = useState({});
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleStart = (e) => {
      const { fileName } = e.detail;
      setUploads(prev => ({
        ...prev,
        [fileName]: { progress: 0, status: 'uploading' }
      }));
      setIsVisible(true);
    };

    const handleProgress = (e) => {
      const { fileName, progress } = e.detail;
      setUploads(prev => ({
        ...prev,
        [fileName]: { ...prev[fileName], progress, status: 'uploading' }
      }));
    };

    const handleEnd = (e) => {
      const { fileName, success } = e.detail;
      setUploads(prev => ({
        ...prev,
        [fileName]: { ...prev[fileName], progress: 100, status: success ? 'success' : 'error' }
      }));
      
      // Auto-hide after 3 seconds if all uploads are successful
      setTimeout(() => {
        setUploads(current => {
          const allDone = Object.values(current).every(u => u.status === 'success');
          if (allDone) {
            setIsVisible(false);
            // Optional: clear the list after a delay so it's fresh next time
            setTimeout(() => setUploads({}), 500); 
          }
          return current;
        });
      }, 3000);
    };

    window.addEventListener('upload:start', handleStart);
    window.addEventListener('upload:progress', handleProgress);
    window.addEventListener('upload:end', handleEnd);

    return () => {
      window.removeEventListener('upload:start', handleStart);
      window.removeEventListener('upload:progress', handleProgress);
      window.removeEventListener('upload:end', handleEnd);
    };
  }, []);

  if (!isVisible || Object.keys(uploads).length === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '2rem',
      right: '2rem',
      zIndex: 9999,
      width: '350px',
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(10px)',
      boxShadow: '0 10px 40px -10px rgba(0,0,0,0.2), 0 0 0 1px rgba(0,0,0,0.05)',
      borderRadius: '16px',
      padding: '1.5rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
      fontFamily: 'var(--font-primary, sans-serif)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h4 style={{ margin: 0, fontSize: '1rem', color: 'var(--navy-900, #0f172a)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <UploadCloud size={18} color="var(--primary-orange, #f97316)" />
          File Uploads
        </h4>
        <button onClick={() => setIsVisible(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
          <X size={16} />
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '250px', overflowY: 'auto' }}>
        {Object.entries(uploads).map(([fileName, data]) => (
          <div key={fileName} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
              <span style={{ color: '#334155', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '80%' }} title={fileName}>
                {fileName}
              </span>
              {data.status === 'success' && <CheckCircle size={14} color="#10b981" />}
              {data.status === 'error' && <AlertCircle size={14} color="#ef4444" />}
              {data.status === 'uploading' && <span style={{ color: 'var(--primary-orange, #f97316)', fontWeight: 600 }}>{data.progress}%</span>}
            </div>
            <div style={{ width: '100%', height: '6px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ 
                width: `${data.progress}%`, 
                height: '100%', 
                background: data.status === 'error' ? '#ef4444' : data.status === 'success' ? '#10b981' : 'var(--primary-orange, #f97316)',
                transition: 'width 0.2s ease-out'
              }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
