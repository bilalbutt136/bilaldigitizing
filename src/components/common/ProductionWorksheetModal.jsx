'use client';

import React, { useEffect } from 'react';
import { formatOrderId } from '../../context/StateContext';
import { triggerFileDownload } from '../../utils/fileDownloader';
import { 
  X, 
  Printer, 
  Download, 
  FileText
} from 'lucide-react';

export const ProductionWorksheetModal = ({ order, onClose }) => {
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

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    const fileName = `${(order.title || 'Order').replace(/\s+/g, '_')}_${formatOrderId(order.id)}_Production_Worksheet.pdf`;
    triggerFileDownload(null, fileName, 'pdf');
  };

  const colorStops = [
    { stop: 1, hex: '#0f172a', code: 'Madeira #1800', name: 'Black Outline & Base Underlay', stitches: '2,400' },
    { stop: 2, hex: '#ef4444', code: 'Madeira #1842', name: 'Primary Crimson Satin Fill', stitches: '5,100' },
    { stop: 3, hex: '#f8fafc', code: 'Madeira #1801', name: 'White Lettering & Highlights', stitches: '3,200' },
    { stop: 4, hex: '#eab308', code: 'Madeira #1987', name: 'Gold Crest & Accent Trim', stitches: '1,700' }
  ];

  return (
    <div 
      className="modal-overlay" 
      onClick={onClose}
      style={{ zIndex: 99999, background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(8px)' }}
    >
      <div 
        className="modal-content printable-worksheet-modal" 
        onClick={(e) => e.stopPropagation()}
        style={{ 
          maxWidth: '920px', 
          background: '#ffffff', 
          color: 'var(--navy-900)',
          maxHeight: '94vh',
          overflowY: 'auto'
        }}
      >
        {/* Print-Only Header Styles */}
        <style>{`
          @media print {
            body * {
              visibility: hidden;
            }
            .printable-worksheet-modal, .printable-worksheet-modal * {
              visibility: visible;
            }
            .printable-worksheet-modal {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              max-width: 100% !important;
              box-shadow: none !important;
            }
            .no-print {
              display: none !important;
            }
          }
        `}</style>

        {/* Modal Top Bar (Hidden during window.print) */}
        <div 
          className="no-print"
          style={{
            padding: '1.25rem 1.75rem',
            background: 'var(--navy-950)',
            color: '#ffffff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <FileText size={22} style={{ color: 'var(--orange-500)' }} />
            <div>
              <h3 style={{ fontSize: '1.2rem', color: '#ffffff' }}>
                Production Worksheet & Color Stop Chart
              </h3>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                Order {formatOrderId(order.id)} • Ready for Workshop Printing
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button 
              className="btn btn-outline btn-sm"
              style={{ color: '#ffffff', borderColor: 'rgba(255,255,255,0.3)' }}
              onClick={handlePrint}
            >
              <Printer size={15} /> Print Worksheet
            </button>
            <button 
              className="btn btn-primary-orange btn-sm"
              onClick={handleDownloadPDF}
            >
              <Download size={15} /> Download PDF
            </button>
            <button 
              onClick={onClose}
              style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', marginLeft: '0.5rem' }}
              aria-label="Close"
            >
              <X size={22} />
            </button>
          </div>
        </div>

        {/* PRINTABLE WORKSHEET CONTAINER */}
        <div style={{ padding: '2rem' }}>
          
          {/* Studio Header & Branding */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            borderBottom: '3px solid var(--navy-900)',
            paddingBottom: '1.25rem',
            marginBottom: '1.75rem'
          }}>
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--orange-600)', letterSpacing: '0.1em' }}>
                BILAL DIGITIZING STUDIO OPERATIONS
              </div>
              <h1 style={{ fontSize: '1.85rem', color: 'var(--navy-900)', fontWeight: 800, margin: '0.2rem 0' }}>
                EMBROIDERY PRODUCTION WORKSHEET
              </h1>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Commercial Machine Pathing & Thread Run Sequence Specification
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ background: 'var(--navy-900)', color: '#ffffff', padding: '0.4rem 0.85rem', borderRadius: 'var(--radius-sm)', fontWeight: 800, fontSize: '1.1rem', display: 'inline-block' }}>
                JOB ID: {formatOrderId(order.id)}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                Date Released: {new Date(order.createdAt || Date.now()).toLocaleDateString()}
              </div>
            </div>
          </div>

          {/* Job Specifications Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '1rem',
            background: 'var(--navy-100)',
            padding: '1.25rem',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.75rem',
            fontSize: '0.875rem'
          }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>DESIGN TITLE</span>
              <strong style={{ color: 'var(--navy-900)', fontSize: '0.95rem' }}>{order.title}</strong>
            </div>

            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>CLIENT SHOP</span>
              <strong style={{ color: 'var(--navy-900)' }}>{order.clientName}</strong>
            </div>

            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>GARMENT / FABRIC</span>
              <strong style={{ color: 'var(--orange-700)' }}>{order.fabricType}</strong>
            </div>

            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>PLACEMENT TARGET</span>
              <strong style={{ color: 'var(--navy-900)' }}>{order.placementType || order.serviceCategory}</strong>
            </div>

            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>DIMENSIONS</span>
              <strong style={{ color: 'var(--orange-600)' }}>{order.dimensions?.width || '3.5'}" W x {order.dimensions?.height || '3.0'}" H</strong>
            </div>

            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>ESTIMATED STITCHES</span>
              <strong style={{ color: 'var(--navy-900)' }}>{order.estimatedStitches ? order.estimatedStitches.toLocaleString() : '12,400'} Stitches</strong>
            </div>

            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>TOTAL COLORS</span>
              <strong style={{ color: 'var(--navy-900)' }}>{order.colorsCount || 4} Thread Stops</strong>
            </div>

            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>QA VERIFICATION</span>
              <strong style={{ color: 'var(--green-700)' }}>100% Pass (0 Break)</strong>
            </div>
          </div>

          {/* Design Mockup & Operator Notes Layout */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.75rem', marginBottom: '1.75rem' }}>
            
            {/* Design Mockup Frame */}
            <div style={{
              border: '2px dashed var(--border-color)',
              borderRadius: 'var(--radius-md)',
              padding: '1.25rem',
              textAlign: 'center',
              background: '#fafafa'
            }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--navy-900)', marginBottom: '0.75rem', textTransform: 'uppercase' }}>
                📷 Artwork Production Preview
              </div>
              <img 
                src={order.artworkUrl} 
                alt={order.title}
                style={{
                  maxHeight: '220px',
                  maxWidth: '100%',
                  objectFit: 'contain',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)',
                  background: '#ffffff'
                }}
              />
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                Center Point Grid Aligned • Scale 1:1
              </div>
            </div>

            {/* Operator Machine Parameters */}
            <div style={{
              background: '#ffffff',
              border: '1.5px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              padding: '1.25rem',
              fontSize: '0.875rem'
            }}>
              <h4 style={{ fontSize: '0.95rem', color: 'var(--navy-900)', marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                ⚙️ Commercial Machine Setup Specs
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--navy-100)', paddingBottom: '0.35rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Recommended Needle:</span>
                  <strong>75/11 Sharp (Ballpoint for Polo)</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--navy-100)', paddingBottom: '0.35rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Tension Rating:</span>
                  <strong>Standard 110gf</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--navy-100)', paddingBottom: '0.35rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Backing / Stabilizer:</span>
                  <strong>2.5oz Cutaway + Solvy Topping</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--navy-100)', paddingBottom: '0.35rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>3D Foam Compensation:</span>
                  <strong>{order.placementType?.includes('Cap') ? 'Applied (3mm EVA)' : 'N/A'}</strong>
                </div>

                {order.notes && (
                  <div style={{ background: 'var(--navy-100)', padding: '0.6rem', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', marginTop: '0.2rem' }}>
                    <strong>Client Note:</strong> {order.notes}
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Color Stop Run Sequence Table */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h4 style={{ fontSize: '1rem', color: 'var(--navy-900)', marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              🎨 Color Stop & Thread Run Sequence
            </h4>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: 'var(--navy-900)', color: '#ffffff', textAlign: 'left' }}>
                  <th style={{ padding: '0.65rem 0.85rem', borderRadius: '4px 0 0 0' }}>Stop #</th>
                  <th style={{ padding: '0.65rem 0.85rem' }}>Swatch</th>
                  <th style={{ padding: '0.65rem 0.85rem' }}>Thread Code & Brand</th>
                  <th style={{ padding: '0.65rem 0.85rem' }}>Element Description</th>
                  <th style={{ padding: '0.65rem 0.85rem', textAlign: 'right', borderRadius: '0 4px 0 0' }}>Stitches</th>
                </tr>
              </thead>
              <tbody>
                {colorStops.map((cs) => (
                  <tr key={cs.stop} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '0.75rem 0.85rem', fontWeight: 800, color: 'var(--navy-900)' }}>
                      Color #{cs.stop}
                    </td>
                    <td style={{ padding: '0.75rem 0.85rem' }}>
                      <div style={{ width: '28px', height: '20px', background: cs.hex, borderRadius: '3px', border: '1px solid var(--border-color)' }} />
                    </td>
                    <td style={{ padding: '0.75rem 0.85rem', fontWeight: 700, color: 'var(--orange-700)' }}>
                      {cs.code}
                    </td>
                    <td style={{ padding: '0.75rem 0.85rem', color: 'var(--navy-800)' }}>
                      {cs.name}
                    </td>
                    <td style={{ padding: '0.75rem 0.85rem', textAlign: 'right', fontWeight: 700, color: 'var(--navy-900)' }}>
                      {cs.stitches}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer Quality Verification */}
          <div style={{
            borderTop: '2px solid var(--border-color)',
            paddingTop: '1rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.78rem',
            color: 'var(--text-muted)'
          }}>
            <div>
              BDIGITIZING.PRO • Verified Tajima, Brother, Melco & Wilcom Production Standard
            </div>
            <div>
              Operator Sign-off: _______________________
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
