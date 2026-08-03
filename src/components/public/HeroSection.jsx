'use client';

import React, { useState } from 'react';
import { useNavigate } from '../../utils/navigation';
import { useAppState } from '../../context/StateContext';
import { 
  CheckCircle2, 
  ArrowRight, 
  Upload, 
  Star,
  Tag,
  Layers,
  PenTool,
  MoveHorizontal
} from 'lucide-react';

const SERVICE_HERO_DATA = {
  embroidery: {
    id: 'embroidery',
    label: 'Embroidery Digitizing',
    icon: Layers,
    badge: 'STARTS $10.00',
    title: 'Commercial Embroidery Digitizing',
    highlight: '100% Guaranteed',
    description: 'Convert your logos into clean, production-ready embroidery machine files (.DST, .PES, .EXP, .EMB) engineered for Tajima, Brother, Melco & Barudan multi-head machines with zero thread breaks.',
    rateLabel: 'Starting from $10.00',
    trustPoints: [
      { title: '100% Manual Digitizing', sub: 'Master digitizers, zero auto-trace' },
      { title: 'Free Revisions Included', sub: '100% satisfaction guaranteed' },
      { title: 'Machine-Ready Formats', sub: 'DST, PES, EXP, EMB, JEF' },
      { title: 'Super Fast 4-12 Hrs Delivery', sub: '24/7 express rush processing' }
    ],
    primaryCta: 'Upload Embroidery Design',
    secondaryCta: 'View Digitizing Rates',
    primaryRoute: 'customer',
    secondaryRoute: '/services/embroidery-digitizing',
    previewTitle: 'Golden Eagle Sports Club Crest',
    previewDesc: 'Precision satin stitching with density compensation for cotton pique knit polos. Clean pathing eliminates fabric puckering.',
    previewBefore: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
    previewAfter: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80',
    previewTag: 'BEFORE: RASTER ART',
    previewTagAfter: 'AFTER: STITCHOUT SHEET'
  },
  patches: {
    id: 'patches',
    label: 'Custom Patches',
    icon: Tag,
    badge: 'STARTS $1.50 / PATCH',
    title: 'Physical Custom Patches & Emblems',
    highlight: 'Physical Shipping',
    description: 'Order high-density embroidered patches, 3D molded waterproof PVC emblems, woven labels, and genuine laser-engraved leather patches with physical shipping worldwide.',
    rateLabel: 'Starting from $1.50 / patch',
    trustPoints: [
      { title: 'Velcro & Iron-On Backing', sub: 'Hook & loop, heat seal or sew-on' },
      { title: 'Classic Merrowed Borders', sub: 'Overlock edges & die-cut shapes' },
      { title: 'Waterproof 3D Molded PVC', sub: 'High-durability tactical rubber' },
      { title: '3-5 Days Production', sub: 'Express physical delivery' }
    ],
    primaryCta: 'Order Custom Patches',
    secondaryCta: 'Explore Patch Tiers',
    primaryRoute: 'customer-patch',
    secondaryRoute: '/custom-patches',
    previewTitle: 'Tactical Merrowed Embroidered Patch',
    previewDesc: 'High-density rayon thread embroidery with classic overlock merrowed border edges and heavy-duty velcro backing.',
    previewBefore: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80',
    previewAfter: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
    previewTag: 'BEFORE: DESIGN SKETCH',
    previewTagAfter: 'AFTER: FINISHED PHYSICAL PATCH'
  },
  vector: {
    id: 'vector',
    label: 'Vector Art Conversion',
    icon: PenTool,
    badge: 'STARTS $15.00',
    title: 'Raster to Scalable Vector Redraw',
    highlight: 'Hand-Traced Vector',
    description: 'Transform pixelated JPEGs, PNGs, and hand sketches into 100% resolution-independent vector graphics (.AI, .EPS, .SVG, .PDF) with Pantone spot color separation.',
    rateLabel: 'Starting from $15.00 flat',
    trustPoints: [
      { title: '100% Hand-Drawn Node Paths', sub: 'Clean vectors for printing & cutting' },
      { title: 'Pantone Spot Color Separation', sub: 'Screen printing & vinyl cut ready' },
      { title: 'Master Source Files Included', sub: 'AI, EPS, SVG, PDF, CDR' },
      { title: '6-12 Hrs Turnaround', sub: 'Same-day vector delivery' }
    ],
    primaryCta: 'Upload Artwork for Vectoring',
    secondaryCta: 'View Vector Rates',
    primaryRoute: 'customer-vector',
    secondaryRoute: '/services/vector-tracing',
    previewTitle: 'Vintage Skull & Rose Vector Redraw',
    previewDesc: 'Hand-traced raster JPG converted to resolution-independent vector graphics with Pantone spot color separation.',
    previewBefore: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=800&q=80',
    previewAfter: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=800&q=80',
    previewTag: 'BEFORE: PIXELATED JPG',
    previewTagAfter: 'AFTER: SCALABLE VECTOR .AI'
  }
};

export const HeroSection = () => {
  const navigate = useNavigate();
  const { 
    protectedNavigate, 
    openOrderWizard, 
    activeHomeServiceTab, 
    setActiveHomeServiceTab, 
    serviceCmsContent = {} 
  } = useAppState();

  const [sliderPos, setSliderPos] = useState(50);

  // Map service key alias (e.g. 'patches' -> 'patch')
  const currentKey = activeHomeServiceTab === 'patches' ? 'patch' : (activeHomeServiceTab || 'embroidery');
  const fallbackHero = SERVICE_HERO_DATA[currentKey === 'patch' ? 'patches' : currentKey] || SERVICE_HERO_DATA.embroidery;

  const cmsHero = serviceCmsContent[currentKey]?.hero || {};
  const activeService = {
    ...fallbackHero,
    title: cmsHero.title || fallbackHero.title,
    highlight: cmsHero.highlight || fallbackHero.highlight,
    description: cmsHero.subtext || fallbackHero.description,
    badge: cmsHero.badge || fallbackHero.badge,
    primaryCta: cmsHero.primaryCta || fallbackHero.primaryCta,
    secondaryCta: cmsHero.secondaryCta || fallbackHero.secondaryCta,
    trustPoints: cmsHero.trustPoints || fallbackHero.trustPoints
  };

  const handlePrimaryClick = () => {
    if (openOrderWizard) {
      openOrderWizard({ type: currentKey });
    } else {
      protectedNavigate('customer', true);
    }
  };

  return (
    <section style={{
      background: 'radial-gradient(circle at 50% 0%, #1e293b 0%, #0f172a 60%, #080d1a 100%)',
      color: '#ffffff',
      padding: '3.5rem 0 5rem',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background Accent Lights */}
      <div style={{
        position: 'absolute',
        top: '-15%',
        left: '25%',
        width: '700px',
        height: '700px',
        background: 'radial-gradient(circle, rgba(249, 115, 22, 0.16) 0%, rgba(249, 115, 22, 0) 70%)',
        pointerEvents: 'none'
      }} />

      <div className="container" style={{ position: 'relative', zIndex: 2 }}>
        
        {/* Top Interactive Service Switcher Bar */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '0.75rem',
          marginBottom: '2.5rem',
          flexWrap: 'wrap'
        }}>
          <div style={{
            display: 'inline-flex',
            background: 'rgba(15, 23, 42, 0.85)',
            border: '1.5px solid rgba(255, 255, 255, 0.12)',
            padding: '0.4rem',
            borderRadius: '9999px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
          }}>
            {[
              { id: 'embroidery', label: 'Embroidery Digitizing', icon: Layers },
              { id: 'patch', label: 'Custom Patches', icon: Tag },
              { id: 'vector', label: 'Vector Art Conversion', icon: PenTool }
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = (currentKey === 'patch' && tab.id === 'patch') || (currentKey === tab.id);
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    if (setActiveHomeServiceTab) setActiveHomeServiceTab(tab.id);
                    setSliderPos(50);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.55rem',
                    padding: '0.55rem 1.25rem',
                    borderRadius: '9999px',
                    border: 'none',
                    background: isActive ? 'linear-gradient(135deg, #ff7a00 0%, #e66e00 100%)' : 'transparent',
                    color: isActive ? '#ffffff' : '#94a3b8',
                    fontWeight: isActive ? 800 : 600,
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: isActive ? '0 4px 14px rgba(255, 122, 0, 0.4)' : 'none'
                  }}
                >
                  <Icon size={16} style={{ color: isActive ? '#ffffff' : '#94a3b8' }} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Hero 2-Column Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '2.5rem',
          alignItems: 'center'
        }}>
          
          {/* Left Column Text Content */}
          <div style={{ textAlign: 'left' }}>
            
            {/* Trustpilot & Service Badge */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.65rem',
              background: 'rgba(15, 23, 42, 0.85)',
              border: '1.5px solid rgba(16, 185, 129, 0.4)',
              padding: '0.45rem 1.25rem',
              borderRadius: '9999px',
              fontSize: '0.85rem',
              fontWeight: 800,
              color: '#ffffff',
              marginBottom: '1.25rem',
              boxShadow: '0 4px 14px rgba(0, 0, 0, 0.35)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={15} style={{ color: '#10b981', fill: '#10b981' }} />
                ))}
              </div>
              <span><strong style={{ color: '#10b981' }}>4.9/5</strong> Rating — 1,200+ Studio Clients</span>
            </div>

            {/* Main Dynamic Headline */}
            <h1 style={{
              fontSize: 'clamp(1.75rem, 5.2vw, 3.4rem)',
              fontWeight: 800,
              lineHeight: 1.18,
              color: '#ffffff',
              marginBottom: '1.15rem',
              letterSpacing: '-0.02em'
            }}>
              {activeService.title},{' '}
              <span style={{
                background: 'linear-gradient(135deg, #f97316 0%, #fb923c 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                {activeService.highlight}
              </span>
            </h1>

            {/* Subtext Description */}
            <p style={{
              fontSize: 'clamp(0.95rem, 2.5vw, 1.1rem)',
              lineHeight: 1.65,
              color: '#cbd5e1',
              marginBottom: '1.75rem',
              maxWidth: '580px'
            }}>
              {activeService.description}
            </p>

            {/* 4 Key Trust Checkmarks Grid */}
            <div className="grid-responsive-2" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
              gap: '1.15rem',
              marginBottom: '2.25rem'
            }}>
              {activeService.trustPoints.map((item, idx) => (
                <div key={idx} style={{ 
                  display: 'flex', 
                  alignItems: 'flex-start', 
                  gap: '0.75rem'
                }}>
                  <div style={{ 
                    background: 'rgba(16, 185, 129, 0.15)', 
                    border: '1.5px solid rgba(16, 185, 129, 0.35)',
                    borderRadius: '50%',
                    padding: '0.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginTop: '2px',
                    flexShrink: 0
                  }}>
                    <CheckCircle2 size={16} style={{ color: '#10b981' }} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#ffffff' }}>{item.title}</div>
                    <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '1px' }}>{item.sub}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Dynamic CTAs */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '1.15rem', 
              flexWrap: 'wrap',
              width: '100%'
            }}>
              <button 
                type="button"
                className="btn btn-primary-orange btn-lg"
                onClick={handlePrimaryClick}
                style={{ 
                  boxShadow: '0 8px 25px rgba(249, 115, 22, 0.45)',
                  padding: '1rem 2rem',
                  fontSize: '1.05rem',
                  fontWeight: 800
                }}
              >
                <Upload size={20} /> {activeService.primaryCta} <ArrowRight size={18} />
              </button>

              <button 
                type="button"
                onClick={() => navigate(activeService.secondaryRoute)}
                className="btn btn-outline btn-lg"
                style={{ 
                  color: '#ffffff', 
                  borderColor: 'rgba(255,255,255,0.3)', 
                  padding: '1rem 1.6rem', 
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  backdropFilter: 'blur(4px)',
                  cursor: 'pointer'
                }}
              >
                <Tag size={18} /> {activeService.secondaryCta}
              </button>
            </div>

          </div>

          {/* Right Column Interactive Before/After Visualizer Card */}
          <div style={{ width: '100%' }}>
            <div className="card" style={{
              background: 'rgba(15, 23, 42, 0.95)',
              border: '1.5px solid rgba(255, 122, 0, 0.35)',
              borderRadius: '20px',
              padding: '1.25rem',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)'
            }}>
              {/* Card Header Info */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1rem',
                paddingBottom: '0.75rem',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--orange-400)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    LIVE PREVIEW — {activeService.label.toUpperCase()}
                  </div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff', marginTop: '0.15rem' }}>
                    {activeService.previewTitle}
                  </div>
                </div>

                <span style={{
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  background: 'rgba(249, 115, 22, 0.15)',
                  color: 'var(--orange-400)',
                  border: '1px solid rgba(249, 115, 22, 0.3)',
                  padding: '0.25rem 0.65rem',
                  borderRadius: '9999px'
                }}>
                  {activeService.badge}
                </span>
              </div>

              {/* Split Drag Slider */}
              <div 
                style={{
                  position: 'relative',
                  width: '100%',
                  height: '280px',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  cursor: 'ew-resize',
                  userSelect: 'none'
                }}
                onMouseMove={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
                  setSliderPos((x / rect.width) * 100);
                }}
              >
                {/* After Image (Full width background) */}
                <img 
                  src={activeService.previewAfter} 
                  alt={activeService.previewTitle} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />

                {/* Before Image (Clipped overlay) */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  bottom: 0,
                  width: `${sliderPos}%`,
                  overflow: 'hidden'
                }}>
                  <img 
                    src={activeService.previewBefore} 
                    alt="Original Artwork" 
                    style={{ width: '100%', height: '100%', objectFit: 'cover', maxWidth: 'none' }}
                  />
                </div>

                {/* Divider Line */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  left: `${sliderPos}%`,
                  width: '3px',
                  background: '#ff7a00',
                  boxShadow: '0 0 10px rgba(255, 122, 0, 0.8)',
                  transform: 'translateX(-50%)'
                }}>
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '32px',
                    height: '32px',
                    background: '#ff7a00',
                    color: '#ffffff',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)'
                  }}>
                    <MoveHorizontal size={18} />
                  </div>
                </div>

                {/* Overlay Labels */}
                <span style={{
                  position: 'absolute',
                  top: '12px',
                  left: '12px',
                  background: 'rgba(15, 23, 42, 0.85)',
                  color: '#ffffff',
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  padding: '0.25rem 0.6rem',
                  borderRadius: '4px',
                  letterSpacing: '0.05em'
                }}>
                  {activeService.previewTag}
                </span>

                <span style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  background: '#ff7a00',
                  color: '#ffffff',
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  padding: '0.25rem 0.6rem',
                  borderRadius: '4px',
                  letterSpacing: '0.05em'
                }}>
                  {activeService.previewTagAfter}
                </span>
              </div>

              {/* Subtext description */}
              <p style={{
                fontSize: '0.825rem',
                color: '#94a3b8',
                lineHeight: 1.5,
                margin: '0.85rem 0 0',
                textAlign: 'center'
              }}>
                {activeService.previewDesc}
              </p>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};


