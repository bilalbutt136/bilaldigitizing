'use client';

import React from 'react';
import { useNavigate } from '../../utils/navigation';
import { useAppState } from '../../context/StateContext';
import { 
  Layers, 
  PenTool, 
  Tag, 
  ArrowRight,
  Clock,
  CheckCircle2,
  Truck,
  Download
} from 'lucide-react';

export const ServicesGrid = () => {
  const navigate = useNavigate();
  const { protectedNavigate, openOrderWizard } = useAppState();

  const handleOrderRedirect = (serviceType, route) => {
    if (route) {
      navigate(route);
    } else if (openOrderWizard) {
      openOrderWizard({ type: serviceType });
    } else {
      protectedNavigate('customer', true);
    }
  };

  return (
    <section id="services" style={{ padding: '5.5rem 0', background: 'var(--navy-100)' }}>
      <div className="container">
        
        {/* ==================================================================
            TOP SECTION: DIGITAL TURNAROUND SERVICES (FILE DOWNLOAD)
           ================================================================== */}
        <div style={{ textAlign: 'center', maxWidth: '780px', margin: '0 auto 3.5rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            background: 'var(--orange-50)',
            border: '1px solid var(--orange-200)',
            color: 'var(--orange-700)',
            fontWeight: 800,
            fontSize: '0.85rem',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            padding: '0.35rem 0.85rem',
            borderRadius: '9999px',
            marginBottom: '0.75rem'
          }}>
            <Download size={16} /> Digital Studio Services (Instant File Download)
          </div>

          <h2 style={{ fontSize: '2.5rem', color: 'var(--navy-900)', marginBottom: '0.75rem', fontWeight: 800 }}>
            Commercial Digitizing & Vector File Conversion
          </h2>

          <p style={{ color: 'var(--text-muted)', fontSize: '1.075rem', lineHeight: 1.6 }}>
            Hand-digitized by master pathing engineers and machine-tested for commercial multi-needle embroidery machines, single-head units, and high-resolution print production.
          </p>
        </div>

        {/* 2 Featured Digital Services Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '2rem',
          marginBottom: '5rem'
        }}>
          
          {/* Digital Service 1: Embroidery Digitizing */}
          <div 
            className="card"
            style={{
              padding: '2.5rem 2rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              background: 'var(--color-surface, var(--bg-card))',
              borderTop: '5px solid var(--orange-500)',
              borderRadius: '16px',
              boxShadow: 'var(--shadow-md)',
              transition: 'all 0.25s ease'
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                <div style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)', padding: '0.9rem', borderRadius: '12px', display: 'inline-flex' }}>
                  <Layers size={32} />
                </div>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, background: 'var(--color-primary-light)', color: 'var(--color-primary)', border: '1.5px solid var(--color-border)', padding: '0.35rem 0.85rem', borderRadius: '9999px' }}>
                  Starting $10.00
                </span>
              </div>

              <h3 style={{ fontSize: '1.5rem', marginBottom: '0.65rem', color: 'var(--color-text-primary)', fontWeight: 800 }}>
                Custom Embroidery Digitizing
              </h3>

              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '1.25rem' }}>
                Commercial machine-ready stitch files engineered for Tajima, Brother, Melco, Janome & Barudan machines with zero thread breaks and precise density underlay.
              </p>

              {/* Pricing Tiers Badge */}
              <div style={{ background: 'var(--color-subtle, var(--bg-subtle))', padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid var(--color-border)', marginBottom: '1.5rem', fontSize: '0.825rem' }}>
                <strong style={{ color: 'var(--color-text-primary)', display: 'block', marginBottom: '0.25rem' }}>Pricing Tiers:</strong>
                <span style={{ color: 'var(--color-text-secondary)' }}>Left Chest ($10) • Cap/Hat ($12) • Jacket Back ($35)</span>
              </div>

              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1.5rem 0', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CheckCircle2 size={16} style={{ color: '#10b981' }} /> Format Delivery: .DST, .PES, .EXP, .EMB, .JEF
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CheckCircle2 size={16} style={{ color: '#10b981' }} /> 3D Foam Capped Ends & Curve Distortion Fix
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CheckCircle2 size={16} style={{ color: '#10b981' }} /> Free Machine Simulation Sew-Out Proofs
                </li>
              </ul>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', borderTop: '1px solid var(--color-border)', fontSize: '0.825rem', color: 'var(--color-text-secondary)', marginBottom: '1.25rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700 }}>
                  <Clock size={15} style={{ color: 'var(--orange-500)' }} /> 8 - 12 Hours Delivery
                </span>
                <span style={{ fontWeight: 700, color: 'var(--color-success, #10b981)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Download size={14} /> Instant File Portal
                </span>
              </div>

              <button 
                className="btn btn-primary-orange"
                style={{ width: '100%', justifyContent: 'space-between', fontWeight: 800, padding: '0.75rem 1.25rem' }}
                onClick={() => handleOrderRedirect('digitizing', '/services/embroidery-digitizing')}
              >
                Configure Digitizing Order <ArrowRight size={18} />
              </button>
            </div>
          </div>

          {/* Digital Service 2: Vector Tracing & Redraw */}
          <div 
            className="card"
            style={{
              padding: '2.5rem 2rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              background: 'var(--color-surface, var(--bg-card))',
              borderTop: '5px solid #3b82f6',
              borderRadius: '16px',
              boxShadow: 'var(--shadow-md)',
              transition: 'all 0.25s ease'
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                <div style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#38bdf8', padding: '0.9rem', borderRadius: '12px', display: 'inline-flex' }}>
                  <PenTool size={32} />
                </div>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, background: 'rgba(59, 130, 246, 0.15)', color: '#38bdf8', border: '1.5px solid rgba(59, 130, 246, 0.3)', padding: '0.35rem 0.85rem', borderRadius: '9999px' }}>
                  Starting $15.00
                </span>
              </div>

              <h3 style={{ fontSize: '1.5rem', marginBottom: '0.65rem', color: 'var(--color-text-primary)', fontWeight: 800 }}>
                Vector Tracing & Redrawing
              </h3>

              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '1.25rem' }}>
                Transform pixelated JPEGs, PNGs, hand-drawn sketches, or low-res logos into 100% hand-drawn, razor-sharp scalable vector graphics for printing.
              </p>

              {/* Pricing Tiers Badge */}
              <div style={{ background: 'var(--color-subtle, var(--bg-subtle))', padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid var(--color-border)', marginBottom: '1.5rem', fontSize: '0.825rem' }}>
                <strong style={{ color: 'var(--color-text-primary)', display: 'block', marginBottom: '0.25rem' }}>Pricing Tiers:</strong>
                <span style={{ color: 'var(--color-text-secondary)' }}>Simple Redraw ($15) • Complex Mascot ($25)</span>
              </div>

              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1.5rem 0', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CheckCircle2 size={16} style={{ color: '#10b981' }} /> Vector Delivery: .AI, .EPS, .SVG, .PDF, .CDR
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CheckCircle2 size={16} style={{ color: '#10b981' }} /> 100% Hand-Drawn Infinite Resolution
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CheckCircle2 size={16} style={{ color: '#10b981' }} /> Spot Pantone & CMYK Color Separations
                </li>
              </ul>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', borderTop: '1px solid var(--color-border)', fontSize: '0.825rem', color: 'var(--color-text-secondary)', marginBottom: '1.25rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700 }}>
                  <Clock size={15} style={{ color: '#3b82f6' }} /> 6 - 12 Hours Delivery
                </span>
                <span style={{ fontWeight: 700, color: 'var(--color-success, #10b981)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Download size={14} /> Instant File Portal
                </span>
              </div>

              <button 
                className="btn btn-primary-orange"
                style={{ width: '100%', justifyContent: 'space-between', fontWeight: 800, padding: '0.75rem 1.25rem', background: '#2563eb', borderColor: '#2563eb' }}
                onClick={() => handleOrderRedirect('vector', '/services/vector-tracing')}
              >
                Configure Vector Redraw <ArrowRight size={18} />
              </button>
            </div>
          </div>

        </div>

        {/* ==================================================================
            LOWER SECTION: PHYSICAL CUSTOM PATCHES & EMBLEMS
           ================================================================== */}
        <div style={{ textAlign: 'center', maxWidth: '780px', margin: '0 auto 3.5rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            background: 'var(--color-primary-light)',
            border: '1.5px solid var(--color-border)',
            color: 'var(--color-primary)',
            fontWeight: 800,
            fontSize: '0.85rem',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            padding: '0.35rem 0.85rem',
            borderRadius: '9999px',
            marginBottom: '0.75rem'
          }}>
            <Truck size={16} /> Physical Custom Patches & Emblems (Worldwide Shipping)
          </div>

          <h2 style={{ fontSize: '2.25rem', color: 'var(--color-text-primary)', marginBottom: '0.75rem', fontWeight: 800 }}>
            Custom Manufactured Patches & Emblems
          </h2>

          <p style={{ color: 'var(--color-text-muted)', fontSize: '1.05rem', lineHeight: 1.6 }}>
            High-density embroidered, genuine leather, and 3D soft PVC custom patches manufactured with merrowed borders and shipped directly to your door.
          </p>
        </div>

        {/* Physical Patches Featured Card Container */}
        <div style={{
          maxWidth: '700px',
          margin: '0 auto'
        }}>
          
          {/* Physical Product: Custom Patches */}
          <div 
            className="card"
            style={{
              padding: '2.5rem 2.25rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              background: 'var(--color-surface, var(--bg-card))',
              border: '2px solid var(--orange-400)',
              borderRadius: '16px',
              boxShadow: 'var(--shadow-md)'
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', padding: '0.85rem', borderRadius: '12px', display: 'inline-flex' }}>
                  <Tag size={30} />
                </div>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '0.35rem 0.85rem', borderRadius: '9999px' }}>
                  Worldwide Physical Delivery
                </span>
              </div>

              <h3 style={{ fontSize: '1.6rem', marginBottom: '0.65rem', color: 'var(--color-text-primary)', fontWeight: 800 }}>
                Custom Patches & Emblems
              </h3>

              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.975rem', lineHeight: 1.6, marginBottom: '1.25rem' }}>
                Premium embroidered, genuine leather, and 3D soft tactical PVC custom patches. Choose from merrowed edges, iron-on, velcro, or sew-on backing options with precision die-cut shaping.
              </p>

              <div style={{ background: 'var(--color-subtle, var(--bg-subtle))', padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid var(--color-border)', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
                <strong style={{ color: 'var(--color-text-primary)', display: 'block', marginBottom: '0.25rem' }}>Bulk Tiered Rates:</strong>
                <span style={{ color: 'var(--color-primary)', fontWeight: 800 }}>From $1.50 / patch</span>
                <span style={{ color: 'var(--color-text-secondary)', marginLeft: '0.5rem' }}>(Volume Tier Pricing Available)</span>
              </div>
            </div>

            <div>
              <button 
                className="btn btn-primary-orange btn-lg"
                style={{ width: '100%', justifyContent: 'center', fontWeight: 800 }}
                onClick={() => handleOrderRedirect('patches', '/custom-patches')}
              >
                Configure Custom Patches Order <ArrowRight size={18} />
              </button>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
