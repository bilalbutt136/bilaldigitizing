'use client';

import React, { useEffect } from 'react';
import { formatOrderId } from '../../context/StateContext';
import { triggerFileDownload } from '../../utils/fileDownloader';
import { X, Download, Scissors } from 'lucide-react';

export const ArtworkLightboxModal = ({ order, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow || 'unset';
    };
  }, [onClose]);

  if (!order) return null;

  const imageSrc = 
    order.artworkUrl || 
    order.image_url || 
    order.logo || 
    order.url || 
    order.public_url || 
    order.uploadedFiles?.[0]?.url || 
    order.uploadedFiles?.[0]?.public_url || 
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80';

  const handleDownloadArtwork = () => {
    const fileName = order.artworkFileName || order.name || `${(order.title || 'Artwork').replace(/\s+/g, '_')}_source.png`;
    const ext = fileName.split('.').pop().toLowerCase() || 'png';
    triggerFileDownload(imageSrc, fileName, ext);
  };

  return (
    <div 
      className="modal-overlay" 
      onClick={onClose}
      style={{ zIndex: 99999, background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(8px)' }}
    >
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '900px', background: 'var(--color-surface, #111827)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.15)' }}
      >
        
        {/* Header */}
        <div style={{
          padding: '1.25rem 1.75rem',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Scissors size={20} style={{ color: 'var(--orange-500)' }} />
            <div>
              <h3 style={{ fontSize: '1.2rem', color: '#ffffff', marginBottom: '0.1rem' }}>
                Artwork Source Inspection: {order.title || 'Design Artwork'}
              </h3>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                Order ID: <strong>{formatOrderId(order.id)}</strong> • Client: {order.clientName || 'Valued Client'}
              </div>
            </div>
          </div>

          <button 
            onClick={onClose}
            style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', cursor: 'pointer' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#ffffff'; e.currentTarget.style.background = 'rgba(255,255,255,0.2)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '1.75rem' }}>
          
          {/* Main Enlarged Image View */}
          <div style={{
            background: 'rgba(0,0,0,0.5)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.5rem',
            textAlign: 'center',
            maxHeight: '520px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            marginBottom: '1.5rem'
          }}>
            <img 
              src={imageSrc} 
              alt={order.title || 'Artwork'}
              style={{
                maxHeight: '460px',
                maxWidth: '100%',
                objectFit: 'contain',
                borderRadius: 'var(--radius-sm)',
                boxShadow: '0 8px 30px rgba(0,0,0,0.5)'
              }}
            />
          </div>

          {/* Asset Metadata Bar */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '1rem',
            background: 'rgba(255,255,255,0.05)',
            padding: '1rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.85rem'
          }}>
            <div>
              <span style={{ color: '#94a3b8' }}>Placement Target:</span>
              <div style={{ fontWeight: 700, color: '#ffffff' }}>{order.serviceCategory || order.placementType || 'Standard Placement'}</div>
            </div>
            <div>
              <span style={{ color: '#94a3b8' }}>Dimensions:</span>
              <div style={{ fontWeight: 700, color: 'var(--orange-500)' }}>{order.dimensions?.width || '3.5'}" x {order.dimensions?.height || '3.0'}" inches</div>
            </div>
            <div>
              <span style={{ color: '#94a3b8' }}>Garment / Fabric:</span>
              <div style={{ fontWeight: 700, color: '#ffffff' }}>{order.fabricType || 'Cotton / Poly Pique'}</div>
            </div>
            <div>
              <span style={{ color: '#94a3b8' }}>Color Setup:</span>
              <div style={{ fontWeight: 700, color: '#ffffff' }}>{order.colorsCount || 4} Colors Auto-Isolated</div>
            </div>
          </div>

          {/* Action Footer */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button 
              onClick={handleDownloadArtwork}
              className="btn btn-primary-orange"
              style={{ gap: '0.5rem' }}
            >
              <Download size={16} /> Download High-Res Source Asset
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
