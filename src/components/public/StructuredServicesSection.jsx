'use client';

import React from 'react';
import { useNavigate } from '../../utils/navigation';
import { useAppState } from '../../context/StateContext';
import { 
  Layers, 
  Tag, 
  PenTool, 
  ArrowRight, 
  Upload, 
  Sparkles, 
  Truck,
  Check
} from 'lucide-react';

  const navigate = useNavigate();
  const { protectedNavigate, openOrderWizard, serviceCmsContent = {} } = useAppState();

  const embHero = serviceCmsContent?.embroidery?.hero || {};
  const vecHero = serviceCmsContent?.vector?.hero || {};
  const patHero = serviceCmsContent?.patch?.hero || {};

  const handleOrderClick = (serviceType) => {
    if (openOrderWizard) {
      openOrderWizard({ type: serviceType });
    } else {
      protectedNavigate('customer', true);
    }
  };

  return (
    <section id="services-breakdown" style={{ padding: '5.5rem 0', background: 'var(--navy-100)' }}>
      <div className="container">
        
        {/* Section Header */}
        <div style={{ textAlign: 'center', maxWidth: '820px', margin: '0 auto 4rem' }}>
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
            padding: '0.35rem 0.95rem',
            borderRadius: '9999px',
            marginBottom: '1rem'
          }}>
            <Sparkles size={16} /> 3 Core Studio Services
          </div>

          <h2 style={{ fontSize: '2.5rem', color: 'var(--navy-900)', marginBottom: '0.85rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
            Complete Studio Production Capabilities
          </h2>

          <p style={{ color: 'var(--text-muted)', fontSize: '1.075rem', lineHeight: 1.65 }}>
            From commercial machine-ready embroidery digitizing to physical custom patches and resolution-independent vector graphics, our master studio team covers every aspect of apparel decoration.
          </p>
        </div>

        {/* 3 Sequential One-by-One Service Blocks */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3.5rem' }}>
          
          {/* ==================================================================
              SECTION 1: EMBROIDERY DIGITIZING
             ================================================================== */}
          <div className="card" style={{
            padding: '2.75rem',
            background: '#ffffff',
            border: '1.5px solid var(--border-color)',
            borderRadius: '20px',
            boxShadow: 'var(--shadow-md)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '2.5rem',
            alignItems: 'center'
          }}>
            {/* Left Content Column */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
                <div style={{ background: 'rgba(249, 115, 22, 0.12)', color: 'var(--orange-600)', padding: '0.75rem', borderRadius: '12px', display: 'flex' }}>
                  <Layers size={28} />
                </div>
                <div>
                  <span style={{ fontSize: '0.725rem', fontWeight: 800, background: '#fff7ed', color: 'var(--orange-700)', border: '1px solid var(--orange-200)', padding: '0.2rem 0.6rem', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    SECTION 1 — DIGITAL FILES
                  </span>
                  <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--orange-600)', marginTop: '0.2rem' }}>
                    {embHero.badge || 'STARTS $10.00 FLAT'}
                  </div>
                </div>
              </div>

              <h3 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--navy-900)', marginBottom: '0.85rem', leading: 1.2 }}>
                {embHero.title || '1. Commercial Embroidery Digitizing'}
              </h3>

              <p style={{ color: 'var(--text-muted)', fontSize: '0.975rem', lineHeight: 1.65, marginBottom: '1.5rem' }}>
                {embHero.subtext || 'Engineered by master pathing technicians for Tajima, Brother, Melco, Janome, and Barudan machines. We map precise underlay foundations and pull compensation tailored specifically to your target fabric.'}
              </p>

              {/* Feature Highlights Grid */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem' }}>
                {(embHero.trustPoints || [
                  { title: 'Machine Formats: Tajima (.DST), Brother (.PES), Melco (.EXP), Janome (.JEF), Wilcom (.EMB)' },
                  { title: 'Custom Underlay & Pull Compensation for pique cotton, fleece, jackets & structured caps' },
                  { title: 'Center-out sequencing for 3D puff foam caps with zero thread breaks' },
                  { title: 'High stitch-count jacket back crests & left-chest logos with free unlimited revisions' }
                ]).map((feat, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
                    <div style={{ background: '#dcfce7', color: '#16a34a', padding: '0.25rem', borderRadius: '50%', marginTop: '2px', flexShrink: 0 }}>
                      <Check size={14} />
                    </div>
                    <span style={{ fontSize: '0.875rem', color: 'var(--navy-800)', fontWeight: 600 }}>{feat.title || feat}</span>
                  </div>
                ))}
              </div>

              {/* CTAs */}
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <button
                  type="button"
                  className="btn btn-primary-orange btn-md"
                  onClick={() => handleOrderClick('embroidery')}
                  style={{ fontWeight: 800 }}
                >
                  <Upload size={17} /> {embHero.primaryCta || 'Order Embroidery Digitizing'} <ArrowRight size={16} />
                </button>

                <button
                  type="button"
                  className="btn btn-outline btn-md"
                  onClick={() => navigate('/services/embroidery-digitizing')}
                  style={{ fontWeight: 700 }}
                >
                  {embHero.secondaryCta || 'Explore Digitizing Rates'}
                </button>
              </div>
            </div>

            {/* Right Visual Image Showcase Column */}
            <div style={{ position: 'relative' }}>
              <div style={{ borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
                <img 
                  src={embHero.previewAfter || embHero.preview_after || "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80"} 
                  alt="Embroidery Digitizing Sewout" 
                  style={{ width: '100%', height: '320px', objectFit: 'cover', display: 'block' }}
                />
              </div>
              <div style={{
                position: 'absolute',
                bottom: '1rem',
                left: '1rem',
                right: '1rem',
                background: 'rgba(15, 23, 42, 0.88)',
                backdropFilter: 'blur(8px)',
                color: '#ffffff',
                padding: '0.85rem 1.15rem',
                borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.15)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 800 }}>Golden Eagle Polo Crest</div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>12,450 Stitches • 5 Madeira Colors</div>
                </div>
                <span style={{ fontSize: '0.725rem', background: '#ff7a00', color: '#fff', fontWeight: 800, padding: '0.2rem 0.55rem', borderRadius: '4px' }}>
                  DST / PES / EMB
                </span>
              </div>
            </div>
          </div>

          {/* ==================================================================
              SECTION 2: CUSTOM PATCHES & GOODS
             ================================================================== */}
          <div className="card" style={{
            padding: '2.75rem',
            background: '#ffffff',
            border: '1.5px solid var(--border-color)',
            borderRadius: '20px',
            boxShadow: 'var(--shadow-md)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '2.5rem',
            alignItems: 'center'
          }}>
            {/* Left Visual Image Showcase Column */}
            <div style={{ position: 'relative' }}>
              <div style={{ borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
                <img 
                  src={patHero.previewAfter || patHero.preview_after || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80"} 
                  alt="Custom Patches & Emblems Showcase" 
                  style={{ width: '100%', height: '320px', objectFit: 'cover', display: 'block' }}
                />
              </div>
              <div style={{
                position: 'absolute',
                bottom: '1rem',
                left: '1rem',
                right: '1rem',
                background: 'rgba(15, 23, 42, 0.88)',
                backdropFilter: 'blur(8px)',
                color: '#ffffff',
                padding: '0.85rem 1.15rem',
                borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.15)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 800 }}>Tactical Merrowed Embroidered Patch</div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Velcro Backing • Overlock Edge</div>
                </div>
                <span style={{ fontSize: '0.725rem', background: '#10b981', color: '#fff', fontWeight: 800, padding: '0.2rem 0.55rem', borderRadius: '4px' }}>
                  PHYSICAL GOODS
                </span>
              </div>
            </div>

            {/* Right Content Column */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
                <div style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10b981', padding: '0.75rem', borderRadius: '12px', display: 'flex' }}>
                  <Tag size={28} />
                </div>
                <div>
                  <span style={{ fontSize: '0.725rem', fontWeight: 800, background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', padding: '0.2rem 0.6rem', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    SECTION 2 — PHYSICAL PRODUCTS
                  </span>
                  <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#047857', marginTop: '0.2rem' }}>
                    {patHero.badge || 'STARTS $1.50 / PATCH'}
                  </div>
                </div>
              </div>

              <h3 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--navy-900)', marginBottom: '0.85rem', leading: 1.2 }}>
                {patHero.title || '2. Custom Patches & Physical Goods'}
              </h3>

              <p style={{ color: 'var(--text-muted)', fontSize: '0.975rem', lineHeight: 1.65, marginBottom: '1.5rem' }}>
                {patHero.subtext || 'From classic high-density embroidered patches to 3D molded waterproof PVC tactical emblems, woven labels, and laser-debossed genuine leather patches with physical shipping worldwide.'}
              </p>

              {/* Feature Highlights Grid */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem' }}>
                {(patHero.trustPoints || [
                  { title: 'Backing Options: Heavy-Duty Velcro (Hook & Loop), Iron-On Heat Seal, Sew-On Felt, Adhesive' },
                  { title: 'Border Finishes: Classic Merrowed Overlock Edge & Precision Laser Cut Shapes' },
                  { title: '100% Waterproof 3D Molded Rubber PVC for tactical uniforms, outerwear & caps' },
                  { title: 'Rustic Genuine Leather Patches with laser engraving for denim, aprons & beanies' }
                ]).map((feat, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
                    <div style={{ background: '#dcfce7', color: '#16a34a', padding: '0.25rem', borderRadius: '50%', marginTop: '2px', flexShrink: 0 }}>
                      <Check size={14} />
                    </div>
                    <span style={{ fontSize: '0.875rem', color: 'var(--navy-800)', fontWeight: 600 }}>{feat.title || feat}</span>
                  </div>
                ))}
              </div>

              {/* CTAs */}
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <button
                  type="button"
                  className="btn btn-primary-orange btn-md"
                  onClick={() => handleOrderClick('patch')}
                  style={{ fontWeight: 800 }}
                >
                  <Truck size={17} /> {patHero.primaryCta || 'Order Custom Patches'} <ArrowRight size={16} />
                </button>

                <button
                  type="button"
                  className="btn btn-outline btn-md"
                  onClick={() => navigate('/custom-patches')}
                  style={{ fontWeight: 700 }}
                >
                  {patHero.secondaryCta || 'Explore Patch Options'}
                </button>
              </div>
            </div>
          </div>

          {/* ==================================================================
              SECTION 3: VECTOR ART CONVERSION
             ================================================================== */}
          <div className="card" style={{
            padding: '2.75rem',
            background: '#ffffff',
            border: '1.5px solid var(--border-color)',
            borderRadius: '20px',
            boxShadow: 'var(--shadow-md)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '2.5rem',
            alignItems: 'center'
          }}>
            {/* Left Content Column */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
                <div style={{ background: 'rgba(59, 130, 246, 0.12)', color: '#3b82f6', padding: '0.75rem', borderRadius: '12px', display: 'flex' }}>
                  <PenTool size={28} />
                </div>
                <div>
                  <span style={{ fontSize: '0.725rem', fontWeight: 800, background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', padding: '0.2rem 0.6rem', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    SECTION 3 — VECTOR GRAPHICS
                  </span>
                  <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#1d4ed8', marginTop: '0.2rem' }}>
                    {vecHero.badge || 'STARTS $15.00 FLAT'}
                  </div>
                </div>
              </div>

              <h3 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--navy-900)', marginBottom: '0.85rem', leading: 1.2 }}>
                {vecHero.title || '3. Vector Art Conversion & Color Separation'}
              </h3>

              <p style={{ color: 'var(--text-muted)', fontSize: '0.975rem', lineHeight: 1.65, marginBottom: '1.5rem' }}>
                {vecHero.subtext || 'Transform pixelated low-resolution JPEGs, PNGs, and hand-drawn sketches into 100% scalable vector graphics ready for large format printing, screen printing, vinyl cutters, and laser engraving.'}
              </p>

              {/* Feature Highlights Grid */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem' }}>
                {(vecHero.trustPoints || [
                  { title: '100% Hand-Drawn Node-by-Node Vector Paths (Zero blurry auto-trace distortion)' },
                  { title: 'Pantone Spot Color Separation for 4-color screen printing & vinyl plotters' },
                  { title: 'Master Formats Included: Adobe Illustrator (.AI), Scalable Vector (.SVG), PostScript (.EPS), Print PDF' },
                  { title: '6-12 Hour Same-Day Turnaround with free unlimited node path revisions' }
                ]).map((feat, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
                    <div style={{ background: '#dcfce7', color: '#16a34a', padding: '0.25rem', borderRadius: '50%', marginTop: '2px', flexShrink: 0 }}>
                      <Check size={14} />
                    </div>
                    <span style={{ fontSize: '0.875rem', color: 'var(--navy-800)', fontWeight: 600 }}>{feat.title || feat}</span>
                  </div>
                ))}
              </div>

              {/* CTAs */}
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <button
                  type="button"
                  className="btn btn-primary-orange btn-md"
                  onClick={() => handleOrderClick('vector')}
                  style={{ fontWeight: 800 }}
                >
                  <PenTool size={17} /> {vecHero.primaryCta || 'Order Vector Conversion'} <ArrowRight size={16} />
                </button>

                <button
                  type="button"
                  className="btn btn-outline btn-md"
                  onClick={() => navigate('/services/vector-tracing')}
                  style={{ fontWeight: 700 }}
                >
                  {vecHero.secondaryCta || 'View Vector Rates'}
                </button>
              </div>
            </div>

            {/* Right Visual Image Showcase Column */}
            <div style={{ position: 'relative' }}>
              <div style={{ borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
                <img 
                  src={vecHero.previewAfter || vecHero.preview_after || "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=800&q=80"} 
                  alt="Vector Artwork Conversion Showcase" 
                  style={{ width: '100%', height: '320px', objectFit: 'cover', display: 'block' }}
                />
              </div>
              <div style={{
                position: 'absolute',
                bottom: '1rem',
                left: '1rem',
                right: '1rem',
                background: 'rgba(15, 23, 42, 0.88)',
                backdropFilter: 'blur(8px)',
                color: '#ffffff',
                padding: '0.85rem 1.15rem',
                borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.15)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 800 }}>Vintage Skull & Rose Vector</div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Pantone Spot Color Separation</div>
                </div>
                <span style={{ fontSize: '0.725rem', background: '#3b82f6', color: '#fff', fontWeight: 800, padding: '0.2rem 0.55rem', borderRadius: '4px' }}>
                  AI / EPS / SVG
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
