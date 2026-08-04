'use client';

import React, { useState, useEffect } from 'react';
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
  MoveHorizontal,
  Globe,
  Clock,
  ShieldCheck
} from 'lucide-react';

const SERVICE_HERO_DATA = {
  embroidery: {
    id: 'embroidery',
    label: 'Embroidery',
    icon: Layers,
    badge: 'STARTS $10.00',
    title: 'Commercial Embroidery Digitizing',
    highlight: '100% Guaranteed',
    description: 'Convert your logos into clean, production-ready embroidery machine files (.DST, .PES, .EXP, .EMB) engineered for Tajima, Brother, Melco & Barudan multi-head machines with zero thread breaks.',
    rateLabel: 'Starting from $10.00',
    primaryCta: 'Get Started',
    secondaryCta: 'View Pricing',
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
    primaryCta: 'Get Started',
    secondaryCta: 'View Pricing',
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
    label: 'Vector Art',
    icon: PenTool,
    badge: 'STARTS $15.00',
    title: 'Raster to Scalable Vector Redraw',
    highlight: 'Hand-Traced Vector',
    description: 'Transform pixelated JPEGs, PNGs, and hand sketches into 100% resolution-independent vector graphics (.AI, .EPS, .SVG, .PDF) with Pantone spot color separation.',
    rateLabel: 'Starting from $15.00 flat',
    primaryCta: 'Get Started',
    secondaryCta: 'View Pricing',
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

const ROTATING_TEXTS = [
  "Commercial Embroidery",
  "Scalable Vector Art",
  "Custom Physical Patches"
];

export const HeroSection = () => {
  const navigate = useNavigate();
  const { 
    protectedNavigate, 
    openOrderWizard, 
    activeHomeServiceTab, 
    setActiveHomeServiceTab, 
    serviceCmsContent = {},
    heroSlides
  } = useAppState();

  const [sliderPos, setSliderPos] = useState(50);
  const [textIndex, setTextIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTextIndex((prev) => (prev + 1) % ROTATING_TEXTS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Map service key alias (e.g. 'patches' -> 'patch')
  const currentKey = activeHomeServiceTab === 'patches' ? 'patch' : (activeHomeServiceTab || 'embroidery');
  let fallbackHero = SERVICE_HERO_DATA[currentKey === 'patch' ? 'patches' : currentKey] || SERVICE_HERO_DATA.embroidery;
  
  if (heroSlides && heroSlides[currentKey]) {
     fallbackHero = { ...fallbackHero, ...heroSlides[currentKey] };
  }

  const cmsHero = serviceCmsContent[currentKey]?.hero || {};
  const activeService = {
    ...fallbackHero,
    title: cmsHero.title || fallbackHero.title,
    highlight: cmsHero.highlight || fallbackHero.highlight,
    description: cmsHero.subtext || fallbackHero.description,
    badge: cmsHero.badge || fallbackHero.badge,
    primaryCta: cmsHero.primaryCta || fallbackHero.primaryCta,
    secondaryCta: cmsHero.secondaryCta || fallbackHero.secondaryCta
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
      background: 'linear-gradient(135deg, var(--navy-950, #0f172a) 0%, var(--navy-800, #1e293b) 100%)',
      color: '#ffffff',
      padding: '4.5rem 0 6rem',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background Accent Lights */}
      <div style={{
        position: 'absolute',
        top: '-20%',
        left: '-10%',
        width: '800px',
        height: '800px',
        background: 'radial-gradient(circle, rgba(255, 122, 0, 0.12) 0%, transparent 60%)',
        pointerEvents: 'none',
        animation: 'pulse 8s ease-in-out infinite alternate'
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-20%',
        right: '-10%',
        width: '600px',
        height: '600px',
        background: 'radial-gradient(circle, rgba(255, 122, 0, 0.08) 0%, transparent 60%)',
        pointerEvents: 'none'
      }} />

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes pulse {
          0% { transform: scale(1); opacity: 0.8; }
          100% { transform: scale(1.1); opacity: 1; }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .hero-text-rotate {
          display: inline-block;
          min-width: 320px;
          animation: fadeUp 0.5s ease forwards;
        }
        @media (max-width: 768px) {
          .hero-text-rotate {
            min-width: auto;
          }
        }
      `}} />

      <div className="container" style={{ position: 'relative', zIndex: 2, maxWidth: '1280px', margin: '0 auto', padding: '0 1.5rem' }}>
        
        {/* Service Switcher Tabs */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: '3rem'
        }}>
          <div style={{
            display: 'inline-flex',
            background: 'rgba(15, 23, 42, 0.6)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            padding: '0.35rem',
            borderRadius: '9999px',
            backdropFilter: 'blur(12px)'
          }}>
            {[
              { id: 'embroidery', label: 'Embroidery', icon: Layers },
              { id: 'patch', label: 'Patches', icon: Tag },
              { id: 'vector', label: 'Vector Art', icon: PenTool }
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
                    gap: '0.5rem',
                    padding: '0.6rem 1.5rem',
                    borderRadius: '9999px',
                    border: 'none',
                    background: isActive ? 'var(--orange-500, #ff7a00)' : 'transparent',
                    color: isActive ? '#ffffff' : '#94a3b8',
                    fontWeight: isActive ? 700 : 500,
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <Icon size={16} style={{ color: isActive ? '#ffffff' : '#94a3b8' }} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Hero Content Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '4rem',
          alignItems: 'center'
        }}>
          
          {/* Left Column Text Content */}
          <div style={{ textAlign: 'left' }}>
            
            {/* Unified Headline */}
            <h1 style={{
              fontSize: 'clamp(2.2rem, 4.5vw, 3.8rem)',
              fontWeight: 800,
              lineHeight: 1.15,
              color: '#ffffff',
              marginBottom: '1rem',
              letterSpacing: '-0.02em',
              fontFamily: 'var(--font-heading, "Plus Jakarta Sans", sans-serif)'
            }}>
              Premium Embroidery, Vector Art & Patches
            </h1>
            
            {/* Animated Text Rotation */}
            <div style={{ 
              fontSize: 'clamp(1.5rem, 3vw, 2.2rem)',
              fontWeight: 700,
              marginBottom: '1.5rem',
              color: 'var(--orange-400, #ff9433)',
              minHeight: '3rem'
            }}>
              Precision <span key={textIndex} className="hero-text-rotate" style={{ color: 'var(--orange-500, #ff7a00)' }}>{ROTATING_TEXTS[textIndex]}</span>
            </div>

            {/* Description tied to the active service */}
            <p style={{
              fontSize: 'clamp(1rem, 1.2vw, 1.15rem)',
              lineHeight: 1.6,
              color: 'var(--text-muted, #94a3b8)',
              marginBottom: '2rem',
              maxWidth: '600px',
              fontFamily: 'var(--font-body, "Inter", sans-serif)'
            }}>
              {activeService.description} Delivering unmatched quality for promotional product distributors, apparel brands, and custom decoration shops globally.
            </p>

            {/* Trust Badges Row */}
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '1.5rem',
              marginBottom: '2.5rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Star size={20} style={{ color: 'var(--orange-500, #ff7a00)', fill: 'var(--orange-500, #ff7a00)' }} />
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#e2e8f0' }}>1,200+ Clients</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Globe size={20} style={{ color: 'var(--orange-500, #ff7a00)' }} />
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#e2e8f0' }}>45+ Countries</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Clock size={20} style={{ color: 'var(--orange-500, #ff7a00)' }} />
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#e2e8f0' }}>4-Hr Express</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldCheck size={20} style={{ color: 'var(--orange-500, #ff7a00)' }} />
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#e2e8f0' }}>100% Guaranteed</span>
              </div>
            </div>

            {/* Dynamic CTAs */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '1rem', 
              flexWrap: 'wrap'
            }}>
              <button 
                type="button"
                onClick={handlePrimaryClick}
                style={{ 
                  background: 'var(--orange-500, #ff7a00)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '1rem 2rem',
                  fontSize: '1.05rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 4px 14px rgba(255, 122, 0, 0.4)',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                }}
                onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(255, 122, 0, 0.6)'; }}
                onMouseOut={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(255, 122, 0, 0.4)'; }}
              >
                <Upload size={20} /> {activeService.primaryCta}
              </button>

              <button 
                type="button"
                onClick={() => navigate(activeService.secondaryRoute)}
                style={{ 
                  background: 'transparent',
                  color: '#ffffff', 
                  border: '2px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  padding: '0.9rem 1.8rem', 
                  fontSize: '1.05rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'; e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.4)'; }}
                onMouseOut={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)'; }}
              >
                 {activeService.secondaryCta} <ArrowRight size={18} />
              </button>
            </div>

          </div>

          {/* Right Column Interactive Before/After Visualizer Card */}
          <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
            <div style={{
              background: 'rgba(30, 41, 59, 0.7)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '24px',
              padding: '1.5rem',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
              width: '100%',
              maxWidth: '550px',
              backdropFilter: 'blur(16px)'
            }}>
              {/* Card Header Info */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1rem'
              }}>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--orange-400, #ff9433)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Showcase — {activeService.label}
                  </div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#ffffff', marginTop: '0.2rem' }}>
                    {activeService.previewTitle}
                  </div>
                </div>
              </div>

              {/* Split Drag Slider */}
              <div 
                style={{
                  position: 'relative',
                  width: '100%',
                  height: '320px',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  cursor: 'ew-resize',
                  userSelect: 'none',
                  boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.3)'
                }}
                onMouseMove={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
                  setSliderPos((x / rect.width) * 100);
                }}
                onTouchMove={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = Math.max(0, Math.min(e.touches[0].clientX - rect.left, rect.width));
                  setSliderPos((x / rect.width) * 100);
                }}
              >
                {/* After Image (Full width background) */}
                <img 
                  src={activeService.previewAfter} 
                  alt={activeService.previewTitle} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  draggable="false"
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
                    style={{ width: '100%', height: '100%', objectFit: 'cover', maxWidth: 'none', minWidth: '100%' }}
                    draggable="false"
                  />
                </div>

                {/* Divider Line */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  left: `${sliderPos}%`,
                  width: '4px',
                  background: 'var(--orange-500, #ff7a00)',
                  boxShadow: '0 0 12px rgba(255, 122, 0, 0.6)',
                  transform: 'translateX(-50%)'
                }}>
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '36px',
                    height: '36px',
                    background: 'var(--orange-500, #ff7a00)',
                    color: '#ffffff',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
                    border: '3px solid #ffffff'
                  }}>
                    <MoveHorizontal size={18} />
                  </div>
                </div>

                {/* Overlay Labels */}
                <span style={{
                  position: 'absolute',
                  bottom: '16px',
                  left: '16px',
                  background: 'rgba(15, 23, 42, 0.8)',
                  backdropFilter: 'blur(4px)',
                  color: '#ffffff',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  padding: '0.4rem 0.8rem',
                  borderRadius: '6px',
                  letterSpacing: '0.05em'
                }}>
                  {activeService.previewTag}
                </span>

                <span style={{
                  position: 'absolute',
                  bottom: '16px',
                  right: '16px',
                  background: 'var(--orange-500, #ff7a00)',
                  color: '#ffffff',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  padding: '0.4rem 0.8rem',
                  borderRadius: '6px',
                  letterSpacing: '0.05em',
                  boxShadow: '0 4px 12px rgba(255, 122, 0, 0.4)'
                }}>
                  {activeService.previewTagAfter}
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};



