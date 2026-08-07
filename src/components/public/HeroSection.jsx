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
      background: 'radial-gradient(ellipse at top, var(--navy-900) 0%, var(--navy-950) 100%)',
      color: '#ffffff',
      padding: '6rem 0 8rem',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Dynamic Background Glows */}
      <div style={{
        position: 'absolute',
        top: '-10%', left: '-5%',
        width: '600px', height: '600px',
        background: 'radial-gradient(circle, rgba(249, 115, 22, 0.15) 0%, transparent 70%)',
        filter: 'blur(60px)',
        pointerEvents: 'none',
        animation: 'pulse 10s ease-in-out infinite alternate'
      }} />
      <div style={{
        position: 'absolute',
        bottom: '0', right: '-10%',
        width: '800px', height: '800px',
        background: 'radial-gradient(circle, rgba(16, 185, 129, 0.08) 0%, transparent 60%)',
        filter: 'blur(80px)',
        pointerEvents: 'none'
      }} />

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes pulse {
          0% { transform: scale(1) translate(0, 0); opacity: 0.7; }
          100% { transform: scale(1.1) translate(20px, 20px); opacity: 1; }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .hero-text-rotate {
          display: inline-block;
          min-width: 380px;
          animation: fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          background: linear-gradient(135deg, #fb923c, #ea580c);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        @media (max-width: 768px) {
          .hero-text-rotate { min-width: auto; }
        }
      `}} />

      <div className="container" style={{ position: 'relative', zIndex: 2, maxWidth: '1400px' }}>
        
        {/* Modern Pill Switcher */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '4rem' }}>
          <div className="glass-panel" style={{
            display: 'inline-flex',
            padding: '0.4rem',
            borderRadius: '9999px',
            background: 'rgba(15, 23, 42, 0.6)'
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
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    padding: '0.65rem 1.8rem', borderRadius: '9999px',
                    border: 'none',
                    background: isActive ? 'linear-gradient(135deg, var(--orange-400), var(--orange-600))' : 'transparent',
                    color: isActive ? '#ffffff' : 'var(--text-light)',
                    fontWeight: isActive ? 700 : 500,
                    fontSize: '0.95rem',
                    cursor: 'pointer',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: isActive ? '0 4px 15px rgba(249, 115, 22, 0.4)' : 'none'
                  }}
                >
                  <Icon size={18} style={{ color: isActive ? '#ffffff' : 'var(--text-light)' }} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Hero Content Split Layout */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '4rem',
          alignItems: 'center'
        }}>
          
          {/* Left Content Area */}
          <div style={{ textAlign: 'left', animation: 'fadeUp 0.8s ease-out forwards' }}>
            
            <div style={{
              display: 'inline-block',
              padding: '0.4rem 1rem',
              background: 'rgba(249, 115, 22, 0.1)',
              border: '1px solid rgba(249, 115, 22, 0.2)',
              borderRadius: '9999px',
              color: 'var(--orange-400)',
              fontWeight: 700,
              fontSize: '0.85rem',
              letterSpacing: '0.05em',
              marginBottom: '1.5rem',
              textTransform: 'uppercase'
            }}>
              {activeService.badge}
            </div>

            <h1 style={{
              fontSize: 'clamp(2.8rem, 5vw, 4.5rem)',
              fontWeight: 800,
              lineHeight: 1.1,
              color: '#ffffff',
              marginBottom: '1.5rem',
              letterSpacing: '-0.03em'
            }}>
              Uncompromising <br />
              <span key={textIndex} className="hero-text-rotate">
                {ROTATING_TEXTS[textIndex]}
              </span>
            </h1>

            <p style={{
              fontSize: 'clamp(1.1rem, 1.5vw, 1.25rem)',
              lineHeight: 1.7,
              color: 'var(--text-muted)',
              marginBottom: '2.5rem',
              maxWidth: '90%'
            }}>
              {activeService.description} Engineered for perfection. Zero thread breaks. Infinite scalability. 
            </p>

            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '3rem' }}>
              <button 
                type="button"
                onClick={handlePrimaryClick}
                className="btn btn-lg btn-primary"
              >
                <Upload size={20} /> {activeService.primaryCta}
              </button>
              <button 
                type="button"
                onClick={() => navigate(activeService.secondaryRoute)}
                className="btn btn-lg btn-outline"
                style={{ color: '#ffffff', borderColor: 'rgba(255,255,255,0.2)' }}
              >
                 {activeService.secondaryCta} <ArrowRight size={18} />
              </button>
            </div>

            {/* Metrics */}
            <div style={{ display: 'flex', gap: '2rem', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '2rem' }}>
              <div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff' }}>10k+</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Designs Delivered</div>
              </div>
              <div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff' }}>4hr</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Express Turnaround</div>
              </div>
              <div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  4.9 <Star size={16} fill="var(--orange-500)" color="var(--orange-500)" />
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Client Rating</div>
              </div>
            </div>
          </div>

          {/* Right Visualizer Glass Card */}
          <div style={{ perspective: '1000px' }}>
            <div className="glass-panel" style={{
              borderRadius: '24px',
              padding: '1.5rem',
              transform: 'rotateY(-5deg) rotateX(5deg)',
              transition: 'transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
              transformStyle: 'preserve-3d',
              border: '1px solid rgba(255,255,255,0.1)'
            }}
            onMouseOver={(e) => { e.currentTarget.style.transform = 'rotateY(0deg) rotateX(0deg)'; }}
            onMouseOut={(e) => { e.currentTarget.style.transform = 'rotateY(-5deg) rotateX(5deg)'; }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', transform: 'translateZ(20px)' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--orange-400)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Interactive Showcase
                  </div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#ffffff' }}>
                    {activeService.previewTitle}
                  </div>
                </div>
              </div>

              {/* Split Drag Slider */}
              <div 
                style={{
                  position: 'relative',
                  width: '100%',
                  height: '380px',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  cursor: 'ew-resize',
                  transform: 'translateZ(30px)',
                  boxShadow: '0 20px 40px -10px rgba(0,0,0,0.5)'
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
                <img 
                  src={activeService.previewAfter} 
                  alt={activeService.previewTitle} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  draggable="false"
                />

                <div style={{
                  position: 'absolute', top: 0, left: 0, bottom: 0,
                  width: `${sliderPos}%`, overflow: 'hidden'
                }}>
                  <img 
                    src={activeService.previewBefore} 
                    alt="Original Artwork" 
                    style={{ width: '100%', height: '100%', objectFit: 'cover', maxWidth: 'none', minWidth: '100%' }}
                    draggable="false"
                  />
                </div>

                <div style={{
                  position: 'absolute', top: 0, bottom: 0, left: `${sliderPos}%`,
                  width: '4px', background: 'var(--orange-500)',
                  boxShadow: '0 0 15px rgba(249, 115, 22, 0.8)',
                  transform: 'translateX(-50%)'
                }}>
                  <div style={{
                    position: 'absolute', top: '50%', left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '40px', height: '40px',
                    background: 'var(--orange-500)', color: '#ffffff',
                    borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.5)',
                    border: '3px solid #ffffff'
                  }}>
                    <MoveHorizontal size={20} />
                  </div>
                </div>

                <span className="badge" style={{
                  position: 'absolute', bottom: '16px', left: '16px',
                  background: 'rgba(15,23,42,0.8)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)'
                }}>
                  {activeService.previewTag}
                </span>

                <span className="badge" style={{
                  position: 'absolute', bottom: '16px', right: '16px',
                  background: 'var(--orange-500)', color: '#fff', border: '1px solid var(--orange-400)'
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



