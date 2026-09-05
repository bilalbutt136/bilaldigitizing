'use client';

import React, { useEffect, useState, useRef } from 'react';
import { openPdfInNewTab, downloadFileDirectly } from '../../utils/fileDownloader';
import { 
  X, 
  Download, 
  ExternalLink, 
  Printer, 
  FileText, 
  Loader2, 
  AlertCircle 
} from 'lucide-react';

export const PdfPreviewModal = ({ 
  isOpen = true, 
  fileUrl, 
  fileName = 'Document.pdf', 
  fileSize, 
  onClose 
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const iframeRef = useRef(null);

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

  if (!isOpen || !fileUrl) return null;

  const cleanName = fileName || 'Document.pdf';
  const previewProxyUrl = `/api/download?url=${encodeURIComponent(fileUrl)}&filename=${encodeURIComponent(cleanName)}&preview=true`;

  const handlePrint = () => {
    try {
      if (iframeRef.current?.contentWindow) {
        iframeRef.current.contentWindow.focus();
        iframeRef.current.contentWindow.print();
        return;
      }
    } catch (e) {
      console.warn('Iframe print access note:', e);
    }
    openPdfInNewTab(fileUrl, cleanName);
  };

  const handleDownload = () => {
    downloadFileDirectly(fileUrl, cleanName);
  };

  const handleOpenExternal = () => {
    openPdfInNewTab(fileUrl, cleanName);
  };

  return (
    <div 
      className="modal-overlay pdf-preview-overlay"
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 999999,
        background: 'rgba(15, 23, 42, 0.88)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        boxSizing: 'border-box'
      }}
    >
      <div 
        className="modal-content pdf-preview-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '1000px',
          height: '92vh',
          background: 'var(--color-surface, #ffffff)',
          borderRadius: '16px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          overflow: 'hidden',
          border: '1px solid var(--color-border, #334155)'
        }}
      >
        {/* Modal Top Header Bar */}
        <div style={{
          padding: '0.85rem 1.25rem',
          background: '#090d16',
          color: '#ffffff',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid #1e293b',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
            <div style={{
              background: '#ea580c',
              color: '#ffffff',
              padding: '0.45rem',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <FileText size={18} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{
                fontSize: '0.95rem',
                fontWeight: 700,
                color: '#f8fafc',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: '450px'
              }}>
                {cleanName}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                {fileSize || 'PDF Document'} • Interactive Document Preview
              </div>
            </div>
          </div>

          {/* Action Toolbar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
            <button
              type="button"
              onClick={handleOpenExternal}
              title="Open in Chrome / Browser Tab"
              style={{
                background: '#1e293b',
                color: '#f1f5f9',
                border: '1px solid #334155',
                borderRadius: '8px',
                padding: '0.45rem 0.75rem',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}
            >
              <ExternalLink size={14} /> Open in Tab
            </button>

            <button
              type="button"
              onClick={handlePrint}
              title="Print Document"
              style={{
                background: '#1e293b',
                color: '#f1f5f9',
                border: '1px solid #334155',
                borderRadius: '8px',
                padding: '0.45rem 0.75rem',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}
            >
              <Printer size={14} /> Print
            </button>

            <button
              type="button"
              onClick={handleDownload}
              title="Download PDF"
              style={{
                background: 'linear-gradient(135deg, #ff7a00, #ea580c)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '0.45rem 0.85rem',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                boxShadow: '0 2px 6px rgba(234, 88, 12, 0.3)'
              }}
            >
              <Download size={14} /> Download
            </button>

            <button
              type="button"
              onClick={onClose}
              title="Close (Esc)"
              style={{
                background: 'transparent',
                color: '#94a3b8',
                border: 'none',
                borderRadius: '8px',
                padding: '0.4rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginLeft: '0.35rem'
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Modal Iframe / Viewer Body */}
        <div style={{
          position: 'relative',
          flex: 1,
          width: '100%',
          height: '100%',
          background: 'var(--color-subtle, #f1f5f9)',
          overflow: 'hidden'
        }}>
          {isLoading && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'var(--color-surface, #ffffff)',
              zIndex: 10,
              gap: '0.75rem'
            }}>
              <Loader2 size={36} className="animate-spin" style={{ color: '#ea580c' }} />
              <div style={{ fontWeight: 600, color: 'var(--color-text-primary, #334155)', fontSize: '0.9rem' }}>
                Rendering PDF Preview...
              </div>
            </div>
          )}

          {hasError ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              padding: '2rem',
              textAlign: 'center',
              gap: '1rem',
              background: 'var(--color-surface, #ffffff)'
            }}>
              <AlertCircle size={48} style={{ color: '#ef4444' }} />
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text-primary, #0f172a)' }}>
                In-App Preview Unavailable
              </div>
              <p style={{ color: 'var(--color-text-muted, #64748b)', maxWidth: '420px', fontSize: '0.88rem', margin: 0 }}>
                This browser does not support inline embedding for this file type, or the document is protected.
              </p>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={handleOpenExternal}
                  style={{
                    background: '#0f172a',
                    color: '#ffffff',
                    padding: '0.6rem 1.1rem',
                    borderRadius: '8px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem'
                  }}
                >
                  <ExternalLink size={15} /> Open in Chrome
                </button>
                <button
                  type="button"
                  onClick={handleDownload}
                  style={{
                    background: '#ea580c',
                    color: '#ffffff',
                    padding: '0.6rem 1.1rem',
                    borderRadius: '8px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem'
                  }}
                >
                  <Download size={15} /> Download PDF
                </button>
              </div>
            </div>
          ) : (
            <iframe
              ref={iframeRef}
              src={previewProxyUrl}
              title={`PDF Preview - ${cleanName}`}
              onLoad={() => setIsLoading(false)}
              onError={() => {
                setIsLoading(false);
                setHasError(true);
              }}
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                display: 'block'
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default PdfPreviewModal;
