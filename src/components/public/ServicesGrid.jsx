import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppState } from '../../context/StateContext';
import { 
  Layers, 
  PenTool, 
  Tag, 
  Shirt, 
  HardHat, 
  ArrowRight,
  Clock,
  Sparkles,
  CheckCircle2,
  Truck,
  Download,
  ShieldCheck,
  Package,
  FileCode
} from 'lucide-react';

export const ServicesGrid = () => {
  const navigate = useNavigate();
  const { protectedNavigate, openStoreOrderModal } = useAppState();

  const handleOrderRedirect = (serviceType, route) => {
    const el = document.getElementById('order-builder');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else if (route) {
      navigate(route);
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
              background: '#ffffff',
              borderTop: '5px solid var(--orange-500)',
              borderRadius: '16px',
              boxShadow: 'var(--shadow-md)',
              transition: 'all 0.25s ease'
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                <div style={{ background: 'rgba(249, 115, 22, 0.1)', color: 'var(--orange-600)', padding: '0.9rem', borderRadius: '12px', display: 'inline-flex' }}>
                  <Layers size={32} />
                </div>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, background: '#fff7ed', color: 'var(--orange-600)', border: '1.5px solid #ffedd5', padding: '0.35rem 0.85rem', borderRadius: '9999px' }}>
                  Starting $10.00
                </span>
              </div>

              <h3 style={{ fontSize: '1.5rem', marginBottom: '0.65rem', color: 'var(--navy-900)', fontWeight: 800 }}>
                Custom Embroidery Digitizing
              </h3>

              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '1.25rem' }}>
                Commercial machine-ready stitch files engineered for Tajima, Brother, Melco, Janome & Barudan machines with zero thread breaks and precise density underlay.
              </p>

              {/* Pricing Tiers Badge */}
              <div style={{ background: '#f8fafc', padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid var(--border-color)', marginBottom: '1.5rem', fontSize: '0.825rem' }}>
                <strong style={{ color: 'var(--navy-900)', display: 'block', marginBottom: '0.25rem' }}>Pricing Tiers:</strong>
                <span style={{ color: 'var(--navy-700)' }}>Left Chest ($10) • Cap/Hat ($12) • Jacket Back ($35)</span>
              </div>

              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1.5rem 0', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--navy-800)' }}>
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', borderTop: '1px solid var(--border-color)', fontSize: '0.825rem', color: 'var(--navy-700)', marginBottom: '1.25rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700 }}>
                  <Clock size={15} style={{ color: 'var(--orange-500)' }} /> 8 - 12 Hours Delivery
                </span>
                <span style={{ fontWeight: 700, color: 'var(--green-700)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Download size={14} /> Instant File Portal
                </span>
              </div>

              <button 
                className="btn btn-primary-orange"
                style={{ width: '100%', justifyContent: 'space-between', fontWeight: 800, padding: '0.75rem 1.25rem' }}
                onClick={() => handleOrderRedirect('digitizing', '/embroidery-digitizing')}
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
              background: '#ffffff',
              borderTop: '5px solid var(--orange-500)',
              borderRadius: '16px',
              boxShadow: 'var(--shadow-md)',
              transition: 'all 0.25s ease'
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                <div style={{ background: 'rgba(249, 115, 22, 0.1)', color: 'var(--orange-600)', padding: '0.9rem', borderRadius: '12px', display: 'inline-flex' }}>
                  <PenTool size={32} />
                </div>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, background: '#fff7ed', color: 'var(--orange-600)', border: '1.5px solid #ffedd5', padding: '0.35rem 0.85rem', borderRadius: '9999px' }}>
                  Starting $15.00
                </span>
              </div>

              <h3 style={{ fontSize: '1.5rem', marginBottom: '0.65rem', color: 'var(--navy-900)', fontWeight: 800 }}>
                Vector Tracing & Redrawing
              </h3>

              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '1.25rem' }}>
                Transform pixelated JPEGs, PNGs, hand-drawn sketches, or low-res logos into 100% hand-drawn, razor-sharp scalable vector graphics for printing.
              </p>

              {/* Pricing Tiers Badge */}
              <div style={{ background: '#f8fafc', padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid var(--border-color)', marginBottom: '1.5rem', fontSize: '0.825rem' }}>
                <strong style={{ color: 'var(--navy-900)', display: 'block', marginBottom: '0.25rem' }}>Pricing Tiers:</strong>
                <span style={{ color: 'var(--navy-700)' }}>Simple Redraw ($15) • Complex Mascot ($25)</span>
              </div>

              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1.5rem 0', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--navy-800)' }}>
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '1rem', borderTop: '1px solid var(--border-color)', fontSize: '0.825rem', color: 'var(--navy-700)', marginBottom: '1.25rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 700 }}>
                  <Clock size={15} style={{ color: 'var(--orange-500)' }} /> 6 - 12 Hours Delivery
                </span>
                <span style={{ fontWeight: 700, color: 'var(--green-700)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Download size={14} /> Instant File Portal
                </span>
              </div>

              <button 
                className="btn btn-primary-orange"
                style={{ width: '100%', justifyContent: 'space-between', fontWeight: 800, padding: '0.75rem 1.25rem' }}
                onClick={() => handleOrderRedirect('vector', '/vector-art')}
              >
                Configure Vector Redraw <ArrowRight size={18} />
              </button>
            </div>
          </div>

        </div>

        {/* ==================================================================
            LOWER SECTION: PHYSICAL CUSTOM APPAREL & MERCHANDISE SHOP
           ================================================================== */}
        <div style={{ textAlign: 'center', maxWidth: '780px', margin: '0 auto 3.5rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            background: '#fff7ed',
            border: '1.5px solid var(--orange-300)',
            color: 'var(--orange-700)',
            fontWeight: 800,
            fontSize: '0.85rem',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            padding: '0.35rem 0.85rem',
            borderRadius: '9999px',
            marginBottom: '0.75rem'
          }}>
            <Truck size={16} /> Physical Custom Apparel & Merchandise Shop (Worldwide Shipping)
          </div>

          <h2 style={{ fontSize: '2.25rem', color: 'var(--navy-900)', marginBottom: '0.75rem', fontWeight: 800 }}>
            Custom Manufactured Physical Goods
          </h2>

          <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', lineHeight: 1.6 }}>
            High-density custom patches, embroidered T-shirts, and 3D puff caps manufactured and shipped directly to your door with full quality inspection.
          </p>
        </div>

        {/* 3 Physical Shop Products Cards Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.75rem'
        }}>
          
          {/* Physical Product 1: Custom Patches */}
          <div 
            className="card"
            style={{
              padding: '2rem 1.75rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              background: '#ffffff',
              border: '1px solid var(--border-color)',
              borderRadius: '14px',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div style={{ background: 'rgba(249, 115, 22, 0.1)', color: 'var(--orange-600)', padding: '0.75rem', borderRadius: '10px', display: 'inline-flex' }}>
                  <Tag size={26} />
                </div>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', padding: '0.3rem 0.65rem', borderRadius: '9999px' }}>
                  Physical Shipping
                </span>
              </div>

              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: 'var(--navy-900)', fontWeight: 800 }}>
                Physical Custom Patches
              </h3>

              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1.5, marginBottom: '1rem' }}>
                Embroidered, genuine leather, and 3D soft PVC custom patches with merrowed borders and iron-on/velcro backing.
              </p>

              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--orange-600)', marginBottom: '1.25rem' }}>
                From $1.50 / patch (Bulk Discounts Available)
              </div>
            </div>

            <div>
              <button 
                className="btn btn-outline btn-md"
                style={{ width: '100%', justifyContent: 'center', fontWeight: 800, borderColor: 'var(--navy-300)', color: 'var(--navy-900)' }}
                onClick={() => handleOrderRedirect('patches', '/custom-patches')}
              >
                Configure Custom Patches <ArrowRight size={16} />
              </button>
            </div>
          </div>

          {/* Physical Product 2: Custom T-Shirts */}
          <div 
            className="card"
            style={{
              padding: '2rem 1.75rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              background: '#ffffff',
              border: '1px solid var(--border-color)',
              borderRadius: '14px',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div style={{ background: 'rgba(249, 115, 22, 0.1)', color: 'var(--orange-600)', padding: '0.75rem', borderRadius: '10px', display: 'inline-flex' }}>
                  <Shirt size={26} />
                </div>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', padding: '0.3rem 0.65rem', borderRadius: '9999px' }}>
                  Physical Shipping
                </span>
              </div>

              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: 'var(--navy-900)', fontWeight: 800 }}>
                Custom Embroidered T-Shirts
              </h3>

              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1.5, marginBottom: '1rem' }}>
                Quality cotton & tri-blend corporate apparel embroidered with your custom logo artwork in S-3XL sizes.
              </p>

              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--orange-600)', marginBottom: '1.25rem' }}>
                From $14.00 / shirt (S - 3XL Breakdown)
              </div>
            </div>

            <div>
              <button 
                className="btn btn-outline btn-md"
                style={{ width: '100%', justifyContent: 'center', fontWeight: 800, borderColor: 'var(--navy-300)', color: 'var(--navy-900)' }}
                onClick={() => handleOrderRedirect('tshirts', '/store')}
              >
                Configure Custom T-Shirts <ArrowRight size={16} />
              </button>
            </div>
          </div>

          {/* Physical Product 3: Custom Caps & 3D Puff Hats */}
          <div 
            className="card"
            style={{
              padding: '2rem 1.75rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              background: '#ffffff',
              border: '1px solid var(--border-color)',
              borderRadius: '14px',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div style={{ background: 'rgba(249, 115, 22, 0.1)', color: 'var(--orange-600)', padding: '0.75rem', borderRadius: '10px', display: 'inline-flex' }}>
                  <HardHat size={26} />
                </div>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', padding: '0.3rem 0.65rem', borderRadius: '9999px' }}>
                  Physical Shipping
                </span>
              </div>

              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: 'var(--navy-900)', fontWeight: 800 }}>
                Caps & 3D Puff Raised Hats
              </h3>

              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1.5, marginBottom: '1rem' }}>
                Structured snapbacks, dad hats, and beanies embroidered with heavy 3D raised foam logo pathing.
              </p>

              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--orange-600)', marginBottom: '1.25rem' }}>
                From $12.00 / cap (+ $2.00 3D Foam)
              </div>
            </div>

            <div>
              <button 
                className="btn btn-outline btn-md"
                style={{ width: '100%', justifyContent: 'center', fontWeight: 800, borderColor: 'var(--navy-300)', color: 'var(--navy-900)' }}
                onClick={() => handleOrderRedirect('caps', '/store')}
              >
                Configure Custom Caps <ArrowRight size={16} />
              </button>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
