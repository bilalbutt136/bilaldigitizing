'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  ZoomIn, 
  RotateCcw, 
  ChevronLeft, 
  ChevronRight, 
  UploadCloud, 
  ArrowRight, 
  ShieldCheck 
} from 'lucide-react';

export const PortfolioLightboxModal = ({ 
  item, 
  onClose, 
  onOrder,
  items = [],
  currentIndex = -1,
  onNavigate
}) => {
  const [zoomLevel, setZoomLevel] = useState(1); // 1 = fit, 1.8 = medium zoom, 2.6 = high zoom
  const [showOriginal, setShowOriginal] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [panPos, setPanPos] = useState({ x: 0, y: 0 });
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);

  // Close on Escape, navigate with Left/Right arrows
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose?.();
      } else if (e.key === 'ArrowLeft' && onNavigate && items.length > 0 && currentIndex > 0) {
        onNavigate(currentIndex - 1);
        setZoomLevel(1);
        setPanPos({ x: 0, y: 0 });
      } else if (e.key === 'ArrowRight' && onNavigate && items.length > 0 && currentIndex < items.length - 1) {
        onNavigate(currentIndex + 1);
        setZoomLevel(1);
        setPanPos({ x: 0, y: 0 });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    const origOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = origOverflow || 'unset';
    };
  }, [onClose, onNavigate, items, currentIndex]);

  // Reset zoom & pan when item changes
  useEffect(() => {
    setZoomLevel(1);
    setPanPos({ x: 0, y: 0 });
    setShowOriginal(false);
  }, [item?.id]);

  if (!item) return null;

  const finishedImg = item.afterImg || item.digitized_image || item.digitizedImage || item.after_img || item.image || item.original_image || '';
  const beforeImg = item.beforeImg || item.original_image || item.originalImage || item.before_img || '';
  const currentImg = showOriginal && beforeImg ? beforeImg : finishedImg;

  const hasMultiple = items.length > 1 && currentIndex >= 0;
  const hasPrev = hasMultiple && currentIndex > 0;
  const hasNext = hasMultiple && currentIndex < items.length - 1;

  const handlePrev = (e) => {
    e.stopPropagation();
    if (hasPrev && onNavigate) {
      onNavigate(currentIndex - 1);
    }
  };

  const handleNext = (e) => {
    e.stopPropagation();
    if (hasNext && onNavigate) {
      onNavigate(currentIndex + 1);
    }
  };

  const handleZoomToggle = () => {
    if (zoomLevel === 1) {
      setZoomLevel(1.8);
    } else if (zoomLevel === 1.8) {
      setZoomLevel(2.6);
    } else {
      setZoomLevel(1);
      setPanPos({ x: 0, y: 0 });
    }
  };

  const handleMouseDown = (e) => {
    if (zoomLevel > 1) {
      setIsPanning(true);
      setStartPos({ x: e.clientX - panPos.x, y: e.clientY - panPos.y });
    }
  };

  const handleMouseMove = (e) => {
    if (isPanning && zoomLevel > 1) {
      setPanPos({
        x: e.clientX - startPos.x,
        y: e.clientY - startPos.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(11, 19, 41, 0.88)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'clamp(0.75rem, 2vw, 1.5rem)'
      }}
    >
      <div
        className="modal-dialog"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--color-surface, #ffffff)',
          borderRadius: '24px',
          maxWidth: '1100px',
          width: '100%',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.1)',
          border: '1px solid var(--border-color, #e2e8f0)'
        }}
      >
        {/* Top Controls Bar */}
        <div
          style={{
            padding: '1rem 1.5rem',
            borderBottom: '1px solid var(--border-color, #e2e8f0)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--color-surface, #ffffff)',
            flexWrap: 'wrap',
            gap: '0.75rem'
          }}
        >
          {/* Left: Category Badge & Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
            {item.categoryLabel && (
              <span
                style={{
                  background: 'var(--color-primary-light, rgba(249, 115, 22, 0.12))',
                  color: 'var(--color-primary, #ea580c)',
                  border: '1px solid rgba(249, 115, 22, 0.25)',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  padding: '0.25rem 0.75rem',
                  borderRadius: '9999px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  whiteSpace: 'nowrap'
                }}
              >
                {item.categoryLabel}
              </span>
            )}
            <h3
              style={{
                fontSize: '1.1rem',
                fontWeight: 800,
                color: 'var(--color-text-primary, #0f172a)',
                margin: 0,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: '380px'
              }}
            >
              {item.title || 'Studio Showcase Sample'}
            </h3>
          </div>

          {/* Right: Zoom controls, Before/After toggle, Close Button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {/* Before / After switcher if beforeImg exists */}
            {beforeImg && (
              <div
                style={{
                  display: 'inline-flex',
                  background: 'var(--color-surface-elevated, #f1f5f9)',
                  padding: '3px',
                  borderRadius: '9999px',
                  border: '1px solid var(--border-color, #e2e8f0)'
                }}
              >
                <button
                  type="button"
                  onClick={() => setShowOriginal(false)}
                  style={{
                    padding: '0.3rem 0.75rem',
                    borderRadius: '9999px',
                    border: 'none',
                    background: !showOriginal ? 'var(--color-primary, #ea580c)' : 'transparent',
                    color: !showOriginal ? '#ffffff' : 'var(--color-text-muted, #64748b)',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  Digitized Sew-Out
                </button>
                <button
                  type="button"
                  onClick={() => setShowOriginal(true)}
                  style={{
                    padding: '0.3rem 0.75rem',
                    borderRadius: '9999px',
                    border: 'none',
                    background: showOriginal ? 'var(--color-primary, #ea580c)' : 'transparent',
                    color: showOriginal ? '#ffffff' : 'var(--color-text-muted, #64748b)',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  Original Art
                </button>
              </div>
            )}

            {/* Zoom Toggle Button */}
            <button
              type="button"
              onClick={handleZoomToggle}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                background: zoomLevel > 1 ? 'var(--color-primary-light, #ffedd5)' : 'var(--color-surface-elevated, #f1f5f9)',
                color: zoomLevel > 1 ? 'var(--color-primary, #ea580c)' : 'var(--color-text-primary, #0f172a)',
                border: '1px solid var(--border-color, #e2e8f0)',
                padding: '0.4rem 0.75rem',
                borderRadius: '8px',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
              title={zoomLevel > 1 ? 'Click to reset zoom (Fit)' : 'Click to zoom in (Inspect stitches)'}
            >
              {zoomLevel === 1 ? (
                <>
                  <ZoomIn size={15} />
                  <span>Zoom Inspect</span>
                </>
              ) : (
                <>
                  <RotateCcw size={15} />
                  <span>{Math.round(zoomLevel * 100)}% Reset</span>
                </>
              )}
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'var(--color-surface-elevated, #f1f5f9)',
                color: 'var(--color-text-primary, #0f172a)',
                border: '1px solid var(--border-color, #e2e8f0)',
                borderRadius: '50%',
                width: '34px',
                height: '34px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'background 0.15s ease'
              }}
              title="Close inspection (Esc)"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Main Artwork Inspection Viewport with Neutral Light Background */}
        <div
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{
            position: 'relative',
            flex: 1,
            minHeight: '380px',
            maxHeight: '62vh',
            backgroundColor: '#f8fafc', // Neutral light slate-50 background for transparent PNG clarity
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            padding: 'clamp(1rem, 3vw, 2rem)', // Internal padding prevents samples from touching borders
            cursor: zoomLevel > 1 ? (isPanning ? 'grabbing' : 'grab') : 'zoom-in',
            userSelect: 'none'
          }}
          onClick={() => {
            if (zoomLevel === 1) handleZoomToggle();
          }}
        >
          {/* Previous Image Arrow */}
          {hasPrev && (
            <button
              type="button"
              onClick={handlePrev}
              style={{
                position: 'absolute',
                left: '16px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'rgba(255, 255, 255, 0.92)',
                border: '1px solid rgba(226, 232, 240, 0.9)',
                color: 'var(--color-text-primary, #0f172a)',
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                zIndex: 10,
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                backdropFilter: 'blur(6px)',
                transition: 'transform 0.15s ease, background 0.15s ease'
              }}
              title="Previous sample (Arrow Left)"
            >
              <ChevronLeft size={20} />
            </button>
          )}

          {/* Next Image Arrow */}
          {hasNext && (
            <button
              type="button"
              onClick={handleNext}
              style={{
                position: 'absolute',
                right: '16px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'rgba(255, 255, 255, 0.92)',
                border: '1px solid rgba(226, 232, 240, 0.9)',
                color: 'var(--color-text-primary, #0f172a)',
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                zIndex: 10,
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                backdropFilter: 'blur(6px)',
                transition: 'transform 0.15s ease, background 0.15s ease'
              }}
              title="Next sample (Arrow Right)"
            >
              <ChevronRight size={20} />
            </button>
          )}

          {/* Sample Image with Dynamic Auto-Fitting & High-DPI Crisp Rendering */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transform: `scale(${zoomLevel}) translate(${panPos.x / zoomLevel}px, ${panPos.y / zoomLevel}px)`,
              transition: isPanning ? 'none' : 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            {currentImg ? (
              <img
                src={currentImg}
                alt={item.title || 'Artwork Preview'}
                decoding="async"
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  width: 'auto',
                  height: 'auto',
                  objectFit: 'contain',
                  objectPosition: 'center',
                  imageRendering: '-webkit-optimize-contrast',
                  filter: 'drop-shadow(0 12px 28px rgba(0, 0, 0, 0.15))',
                  display: 'block'
                }}
                className="sharp-portfolio-img"
              />
            ) : (
              <div style={{ color: '#94a3b8', fontSize: '0.95rem', fontWeight: 600 }}>
                Sample image unavailable
              </div>
            )}
          </div>

          {/* Zoom Instruction Hint Pill */}
          <div
            style={{
              position: 'absolute',
              bottom: '12px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(15, 23, 42, 0.72)',
              color: '#ffffff',
              padding: '0.25rem 0.75rem',
              borderRadius: '9999px',
              fontSize: '0.72rem',
              fontWeight: 600,
              pointerEvents: 'none',
              backdropFilter: 'blur(6px)',
              letterSpacing: '0.02em'
            }}
          >
            {zoomLevel > 1 ? 'Drag to pan around stitches · Click Reset to fit' : 'Click image or button above to inspect fine stitches'}
          </div>
        </div>

        {/* Specifications & Order Action Footer */}
        <div
          style={{
            padding: '1.25rem 1.75rem',
            borderTop: '1px solid var(--border-color, #e2e8f0)',
            background: 'var(--color-surface, #ffffff)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem'
          }}
        >
          {/* Metadata Specs Pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
            {item.stitchCount && (
              <span
                style={{
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  background: 'var(--color-surface-elevated, #f1f5f9)',
                  color: 'var(--color-text-primary, #0f172a)',
                  padding: '0.3rem 0.65rem',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color, #e2e8f0)'
                }}
              >
                ⚡ {item.stitchCount}
              </span>
            )}
            {item.formats && (
              <span
                style={{
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  background: 'var(--color-surface-elevated, #f1f5f9)',
                  color: 'var(--color-text-primary, #0f172a)',
                  padding: '0.3rem 0.65rem',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color, #e2e8f0)'
                }}
              >
                📁 {item.formats}
              </span>
            )}
            {item.colors && (
              <span
                style={{
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  background: 'var(--color-surface-elevated, #f1f5f9)',
                  color: 'var(--color-text-primary, #0f172a)',
                  padding: '0.3rem 0.65rem',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color, #e2e8f0)'
                }}
              >
                🎨 {item.colors}
              </span>
            )}
            <span
              style={{
                fontSize: '0.78rem',
                fontWeight: 700,
                background: 'rgba(16, 185, 129, 0.12)',
                color: '#059669',
                padding: '0.3rem 0.65rem',
                borderRadius: '8px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}
            >
              <ShieldCheck size={14} /> 100% Machine Tested
            </span>
          </div>

          {/* Order Action Button */}
          {onOrder && (
            <button
              type="button"
              onClick={() => onOrder(item)}
              className="btn btn-primary-orange"
              style={{
                fontWeight: 800,
                fontSize: '0.875rem',
                padding: '0.65rem 1.4rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                borderRadius: '10px'
              }}
            >
              <UploadCloud size={16} />
              <span>Order Similar Design</span>
              <ArrowRight size={15} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PortfolioLightboxModal;
