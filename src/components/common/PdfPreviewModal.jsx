'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  openPdfInNewTab,
  downloadFileDirectly,
  createFrameSafePdfPreviewUrl
} from '../../utils/fileDownloader';
import { useModalBackNavigation } from '../../hooks/useModalBackNavigation';
import {
  X,
  Download,
  ExternalLink,
  Printer,
  FileText,
  Loader2,
  AlertCircle,
  ArrowLeft
} from 'lucide-react';

const PDF_WORKER_SRC = '/pdf.worker.min.mjs';

export const PdfPreviewModal = ({
  isOpen = true,
  fileUrl,
  fileName = 'Document.pdf',
  fileSize,
  onClose
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [pageCount, setPageCount] = useState(0);
  const viewerRef = useRef(null);
  const pdfDocumentRef = useRef(null);
  const loadingTaskRef = useRef(null);

  const isModalActive = Boolean(isOpen && fileUrl);
  const cleanName = fileName || 'Document.pdf';

  const { handleSafeClose } = useModalBackNavigation({
    isOpen: isModalActive,
    onClose,
    modalId: 'pdf_preview_modal'
  });

  useEffect(() => {
    if (!isModalActive) return;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') handleSafeClose();
    };

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow || 'unset';
    };
  }, [isModalActive, handleSafeClose]);

  useEffect(() => {
    if (!isModalActive) {
      setIsLoading(false);
      setHasError(false);
      setPageCount(0);
      return;
    }

    const controller = new AbortController();
    const viewerElement = viewerRef.current;
    let disposed = false;
    let preparedObjectUrl = '';

    const renderPdf = async () => {
      setIsLoading(true);
      setHasError(false);
      setPageCount(0);

      if (viewerRef.current) {
        viewerRef.current.replaceChildren();
      }

      try {
        const prepared = await createFrameSafePdfPreviewUrl(fileUrl, cleanName, controller.signal);
        if (disposed) return;

        if (prepared?.revoke && prepared?.url?.startsWith('blob:')) {
          preparedObjectUrl = prepared.url;
        }

        if (!prepared?.url) {
          throw new Error('No PDF preview URL was produced.');
        }

        const response = await fetch(prepared.url, {
          signal: controller.signal,
          credentials: 'same-origin',
          cache: 'default'
        });

        if (!response.ok) {
          throw new Error(`Unable to load PDF bytes (HTTP ${response.status}).`);
        }

        const pdfBytes = new Uint8Array(await response.arrayBuffer());
        if (disposed) return;

        const pdfjs = await import('pdfjs-dist/build/pdf.mjs');
        pdfjs.GlobalWorkerOptions.workerSrc = PDF_WORKER_SRC;

        const loadingTask = pdfjs.getDocument({
          data: pdfBytes,
          useSystemFonts: true,
          isEvalSupported: false
        });
        loadingTaskRef.current = loadingTask;

        const pdfDocument = await loadingTask.promise;
        if (disposed) {
          await pdfDocument.destroy();
          return;
        }

        pdfDocumentRef.current = pdfDocument;
        setPageCount(pdfDocument.numPages);

        const viewer = viewerRef.current;
        if (!viewer) throw new Error('PDF viewer container is unavailable.');

        viewer.replaceChildren();

        for (let pageNumber = 1; pageNumber <= pdfDocument.numPages; pageNumber += 1) {
          if (disposed) break;

          const page = await pdfDocument.getPage(pageNumber);
          const baseViewport = page.getViewport({ scale: 1 });

          const availableWidth = Math.max(
            280,
            Math.min((viewer.clientWidth || window.innerWidth || 360) - 24, 980)
          );
          const cssScale = Math.min(1.55, availableWidth / baseViewport.width);
          const outputScale = Math.min(window.devicePixelRatio || 1, 2);
          const renderViewport = page.getViewport({ scale: cssScale * outputScale });

          const pageShell = document.createElement('section');
          pageShell.setAttribute('data-pdf-page', String(pageNumber));
          pageShell.style.width = 'fit-content';
          pageShell.style.maxWidth = '100%';
          pageShell.style.margin = '0 auto 14px';
          pageShell.style.background = '#ffffff';
          pageShell.style.boxShadow = '0 6px 22px rgba(15, 23, 42, 0.16)';
          pageShell.style.borderRadius = '4px';
          pageShell.style.overflow = 'hidden';

          const canvas = document.createElement('canvas');
          canvas.setAttribute('aria-label', `PDF page ${pageNumber} of ${pdfDocument.numPages}`);
          canvas.width = Math.max(1, Math.floor(renderViewport.width));
          canvas.height = Math.max(1, Math.floor(renderViewport.height));
          canvas.style.display = 'block';
          canvas.style.width = `${Math.floor(renderViewport.width / outputScale)}px`;
          canvas.style.height = 'auto';
          canvas.style.maxWidth = '100%';
          canvas.style.background = '#ffffff';

          pageShell.appendChild(canvas);
          viewer.appendChild(pageShell);

          const context = canvas.getContext('2d', { alpha: false });
          if (!context) throw new Error('Canvas rendering is unavailable in this browser.');

          await page.render({
            canvasContext: context,
            viewport: renderViewport,
            background: 'rgb(255,255,255)'
          }).promise;

          page.cleanup();
        }

        if (!disposed) {
          setIsLoading(false);
        }
      } catch (error) {
        if (error?.name === 'AbortError' || disposed) return;
        console.error('[PdfPreviewModal] PDF.js render failed:', error);
        setIsLoading(false);
        setHasError(true);
      }
    };

    renderPdf();

    return () => {
      disposed = true;
      controller.abort();

      if (loadingTaskRef.current?.destroy) {
        try {
          loadingTaskRef.current.destroy();
        } catch {}
      }
      loadingTaskRef.current = null;

      if (pdfDocumentRef.current?.destroy) {
        try {
          pdfDocumentRef.current.destroy();
        } catch {}
      }
      pdfDocumentRef.current = null;

      if (preparedObjectUrl) {
        URL.revokeObjectURL(preparedObjectUrl);
      }

      if (viewerElement) {
        viewerElement.replaceChildren();
      }
    };
  }, [isModalActive, fileUrl, cleanName]);

  if (!isModalActive) return null;

  const handlePrint = () => {
    const canvases = Array.from(viewerRef.current?.querySelectorAll('canvas') || []);
    if (canvases.length === 0) {
      openPdfInNewTab(fileUrl, cleanName);
      return;
    }

    try {
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.left = '-10000px';
      iframe.style.top = '-10000px';
      iframe.style.width = '1px';
      iframe.style.height = '1px';
      iframe.style.border = '0';
      document.body.appendChild(iframe);

      const printDocument = iframe.contentDocument || iframe.contentWindow?.document;
      if (!printDocument) throw new Error('Print frame is unavailable.');

      const pageImages = canvases
        .map((canvas) => `<img src="${canvas.toDataURL('image/png')}" alt="PDF page" />`)
        .join('');

      printDocument.open();
      printDocument.write(`
        <!doctype html>
        <html>
          <head>
            <title>${cleanName.replace(/[<>]/g, '')}</title>
            <style>
              @page { size: auto; margin: 8mm; }
              html, body { margin: 0; padding: 0; background: #fff; }
              img {
                display: block;
                width: 100%;
                height: auto;
                object-fit: contain;
                break-after: page;
                page-break-after: always;
              }
              img:last-child {
                break-after: auto;
                page-break-after: auto;
              }
            </style>
          </head>
          <body>${pageImages}</body>
        </html>
      `);
      printDocument.close();

      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } finally {
          setTimeout(() => iframe.remove(), 1500);
        }
      }, 250);
    } catch (error) {
      console.warn('[PdfPreviewModal] Canvas print fallback:', error);
      openPdfInNewTab(fileUrl, cleanName);
    }
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
      onClick={handleSafeClose}
      style={{
        position: 'fixed',
        inset: 0,
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
      <style>{`
        @media (max-width: 640px) {
          .pdf-preview-overlay {
            padding: 0 !important;
            align-items: stretch !important;
          }
          .pdf-preview-content {
            height: 100dvh !important;
            max-height: 100dvh !important;
            border-radius: 0 !important;
            border: 0 !important;
          }
          .pdf-preview-header {
            padding: 0.6rem 0.55rem !important;
            gap: 0.4rem !important;
          }
          .pdf-preview-icon-box,
          .pdf-preview-desktop-btn {
            display: none !important;
          }
          .pdf-preview-mobile-btn {
            display: flex !important;
          }
          .pdf-preview-btn-label {
            display: none !important;
          }
          .pdf-preview-pages {
            padding: 10px 8px 24px !important;
          }
        }
        @media (min-width: 641px) {
          .pdf-preview-mobile-btn {
            display: none !important;
          }
        }
      `}</style>

      <div
        className="modal-content pdf-preview-content"
        onClick={(event) => event.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '1000px',
          height: '92vh',
          background: '#ffffff',
          borderRadius: '16px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          overflow: 'hidden',
          border: '1px solid #334155'
        }}
      >
        <div
          className="pdf-preview-header"
          style={{
            padding: '0.85rem 1.25rem',
            background: '#090d16',
            color: '#ffffff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid #1e293b',
            flexShrink: 0,
            gap: '0.75rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
            <button
              type="button"
              onClick={handleSafeClose}
              title="Return to Order Details"
              style={{
                background: '#1e293b',
                color: '#f8fafc',
                border: '1px solid #334155',
                borderRadius: '8px',
                padding: '0.45rem 0.65rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.82rem',
                fontWeight: 700,
                flexShrink: 0
              }}
            >
              <ArrowLeft size={16} />
              <span>Back</span>
            </button>

            <div
              className="pdf-preview-icon-box"
              style={{
                background: '#ea580c',
                color: '#ffffff',
                padding: '0.45rem',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <FileText size={18} />
            </div>

            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: '0.92rem',
                  fontWeight: 700,
                  color: '#f8fafc',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: '340px'
                }}
              >
                {cleanName}
              </div>
              <div
                style={{
                  fontSize: '0.72rem',
                  color: '#94a3b8',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {fileSize || 'PDF Document'}
                {pageCount > 0 ? ` • ${pageCount} page${pageCount === 1 ? '' : 's'}` : ''}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
            <button
              type="button"
              onClick={handleOpenExternal}
              title="Open PDF in browser tab"
              className="pdf-preview-desktop-btn"
              style={{
                background: '#1e293b',
                color: '#f1f5f9',
                border: '1px solid #334155',
                borderRadius: '8px',
                padding: '0.45rem 0.75rem',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
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
              className="pdf-preview-desktop-btn"
              style={{
                background: '#1e293b',
                color: '#f1f5f9',
                border: '1px solid #334155',
                borderRadius: '8px',
                padding: '0.45rem 0.75rem',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                alignItems: 'center',
                gap: '0.35rem'
              }}
            >
              <Printer size={14} /> Print
            </button>

            <button
              type="button"
              onClick={handleOpenExternal}
              title="Open in Browser"
              className="pdf-preview-mobile-btn"
              style={{
                background: '#1e293b',
                color: '#f1f5f9',
                border: '1px solid #334155',
                borderRadius: '8px',
                padding: '0.45rem',
                cursor: 'pointer',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <ExternalLink size={16} />
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
              <Download size={14} />
              <span className="pdf-preview-btn-label">Download</span>
            </button>

            <button
              type="button"
              onClick={handleSafeClose}
              title="Close"
              style={{
                background: 'transparent',
                color: '#94a3b8',
                border: 'none',
                borderRadius: '8px',
                padding: '0.4rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div
          style={{
            position: 'relative',
            flex: 1,
            minHeight: 0,
            background: '#e5e7eb',
            overflow: 'hidden'
          }}
        >
          {isLoading && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#ffffff',
                zIndex: 10,
                gap: '0.75rem'
              }}
            >
              <Loader2 size={36} className="animate-spin" style={{ color: '#ea580c' }} />
              <div style={{ fontWeight: 700, color: '#334155', fontSize: '0.9rem' }}>
                Rendering PDF securely...
              </div>
              <div style={{ color: '#64748b', fontSize: '0.76rem' }}>
                Mobile-compatible viewer
              </div>
            </div>
          )}

          {hasError && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                zIndex: 11,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '2rem',
                textAlign: 'center',
                gap: '1rem',
                background: '#ffffff'
              }}
            >
              <AlertCircle size={48} style={{ color: '#ef4444' }} />
              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
                PDF could not be rendered
              </div>
              <p style={{ color: '#64748b', maxWidth: '420px', fontSize: '0.88rem', margin: 0 }}>
                The file may be unavailable or damaged. You can still download it to your device.
              </p>
              <button
                type="button"
                onClick={handleDownload}
                style={{
                  background: '#ea580c',
                  color: '#ffffff',
                  padding: '0.65rem 1.1rem',
                  border: 0,
                  borderRadius: '8px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
              >
                <Download size={16} /> Download PDF
              </button>
            </div>
          )}

          <div
            ref={viewerRef}
            className="pdf-preview-pages"
            aria-label={`PDF preview for ${cleanName}`}
            style={{
              position: 'absolute',
              inset: 0,
              overflow: 'auto',
              WebkitOverflowScrolling: 'touch',
              padding: '14px 12px 32px',
              background: '#e5e7eb',
              overscrollBehavior: 'contain'
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default PdfPreviewModal;
