'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from '../../utils/navigation';
import { useAppState } from '../../context/StateContext';
import { normalizeCategory } from '../../utils/categoryUtils';
import { 
  CheckCircle2, 
  ArrowRight, 
  Star,
  Clock, 
  ShieldCheck, 
  MoveHorizontal,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Zap,
  Layers,
  PenTool,
  Tag
} from 'lucide-react';

const SHOWCASE_SLIDES = [
  {
    id: 'portrait-embroidery',
    category: 'embroidery',
    title: 'Character & Portrait Digitizing',
    subtitle: 'Vector Graphic to High-Density Textured Sew-Out',
    beforeImg: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=900',
    afterImg: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&q=80&w=900',
    beforeTag: 'BEFORE',
    afterTag: 'AFTER'
  },
  {
    id: 'cap-3d-puff',
    category: 'embroidery',
    title: '3D Puff Raised Cap Embroidery',
    subtitle: '2D Flat Logo to High-Density Foam Cap Stitch File',
    beforeImg: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&q=80&w=900',
    afterImg: 'https://images.unsplash.com/photo-1576871337632-b9aef4c17ab9?auto=format&fit=crop&q=80&w=900',
    beforeTag: 'BEFORE',
    afterTag: 'AFTER'
  },
  {
    id: 'vector-tracing',
    category: 'vector-art',
    title: 'Raster to Scalable Vector Tracing',
    subtitle: 'Pixelated Low-Res JPG to Clean Scalable Vector Bézier Paths',
    beforeImg: 'https://images.unsplash.com/photo-1620660605929-e1fcc13bb221?auto=format&fit=crop&q=80&w=900',
    afterImg: 'https://images.unsplash.com/photo-1558655146-d09347e92766?auto=format&fit=crop&q=80&w=900',
    beforeTag: 'BEFORE',
    afterTag: 'AFTER'
  },
  {
    id: 'custom-patches',
    category: 'patches',
    title: 'Custom Physical Manufactured Patches',
    subtitle: 'Digital Emblem Artwork to Finished Velcro Embroidered Patch',
    beforeImg: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&q=80&w=900',
    afterImg: 'https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&q=80&w=900',
    beforeTag: 'BEFORE',
    afterTag: 'AFTER'
  },
  {
    id: 'jacket-back',
    category: 'embroidery',
    title: 'Full Jacket Back Master Design',
    subtitle: 'Multi-Color Artwork to 85,000-Stitch Zero-Break Sew-Out',
    beforeImg: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&q=80&w=900',
    afterImg: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&q=80&w=900',
    beforeTag: 'BEFORE',
    afterTag: 'AFTER'
  }
];

export const HeroSection = () => {
  const navigate = useNavigate();
  const { 
    protectedNavigate, 
    openOrderWizard, 
    activeHomeServiceTab = 'all', 
    heroSlides = [] 
  } = useAppState();

  const [currentSlideIdx, setCurrentSlideIdx] = useState(0);
  const [sliderPos, setSliderPos] = useState(50);
  const [isHovered, setIsHovered] = useState(false);
  const [isFading, setIsFading] = useState(false);

  // Combine DB heroSlides with built-in showcase gallery
  const activeTab = normalizeCategory(activeHomeServiceTab || 'all');
  const matchedDbSlide = (heroSlides || []).find(
    s => s.id?.toLowerCase() === activeTab || s.serviceKey?.toLowerCase() === activeTab
  );

  const displaySlides = React.useMemo(() => {
    if (matchedDbSlide && matchedDbSlide.beforeImg && matchedDbSlide.afterImg) {
      const customSlide = {
        id: matchedDbSlide.id || 'custom-db-slide',
        category: activeTab,
        title: matchedDbSlide.title || matchedDbSlide.previewTitle || 'Custom Studio Production Result',
        subtitle: matchedDbSlide.highlight || 'Original Artwork to Production Finished Quality',
        beforeImg: matchedDbSlide.beforeImg,
        afterImg: matchedDbSlide.afterImg,
        beforeTag: matchedDbSlide.beforeTag || 'BEFORE',
        afterTag: matchedDbSlide.afterTag || 'AFTER'
      };
      return [customSlide, ...SHOWCASE_SLIDES.filter(s => s.id !== customSlide.id)];
    }
    return SHOWCASE_SLIDES;
  }, [matchedDbSlide, activeTab]);

  // Auto-rotation timer: switches slide every 5 seconds (5000ms)
  useEffect(() => {
    if (isHovered) return; // Pause timer on hover

    const interval = setInterval(() => {
      setIsFading(true);
      setTimeout(() => {
        setCurrentSlideIdx(prev => (prev + 1) % displaySlides.length);
        setIsFading(false);
      }, 250);
    }, 5000);

    return () => clearInterval(interval);
  }, [isHovered, displaySlides.length]);

  const currentSlide = displaySlides[currentSlideIdx] || displaySlides[0];

  const handleDotClick = (idx) => {
    if (idx === currentSlideIdx) return;
    setIsFading(true);
    setTimeout(() => {
      setCurrentSlideIdx(idx);
      setIsFading(false);
    }, 200);
  };

  const handlePrev = () => {
    setIsFading(true);
    setTimeout(() => {
      setCurrentSlideIdx(prev => (prev === 0 ? displaySlides.length - 1 : prev - 1));
      setIsFading(false);
    }, 200);
  };

  const handleNext = () => {
    setIsFading(true);
    setTimeout(() => {
      setCurrentSlideIdx(prev => (prev + 1) % displaySlides.length);
      setIsFading(false);
    }, 200);
  };

  const handleLaunchOrder = () => {
    if (openOrderWizard) {
      openOrderWizard({ type: 'all' });
    } else if (protectedNavigate) {
      protectedNavigate('customer', true, { type: 'all' });
    } else {
      navigate('/order');
    }
  };

  const handleViewPricing = () => {
    navigate('/pricing');
  };

  return (
    <section style={{
      background: 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 60%, #e2e8f0 100%)',
      color: 'var(--navy-950, #0f172a)',
      padding: '4rem 0 5rem',
      position: 'relative',
      overflow: 'hidden',
      borderBottom: '1px solid rgba(0, 0, 0, 0.06)'
    }}>
      
      {/* Background Soft Glow Accents */}
      <div style={{
        position: 'absolute',
        top: '-10%',
        left: '-5%',
        width: '600px',
        height: '600px',
        background: 'radial-gradient(circle, rgba(234, 88, 12, 0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
        zIndex: 0
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-10%',
        right: '-5%',
        width: '600px',
        height: '600px',
        background: 'radial-gradient(circle, rgba(37, 99, 235, 0.06) 0%, transparent 70%)',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      <style dangerouslySetInnerHTML={{__html: `
        .hero-pulse-dot {
          width: 9px;
          height: 9px;
          border-radius: 50%;
          background: #ea580c;
          box-shadow: 0 0 10px rgba(234, 88, 12, 0.8);
          display: inline-block;
          animation: pulseGlow 1.8s infinite ease-in-out;
        }
        @keyframes pulseGlow {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.35); opacity: 0.5; }
        }
        @keyframes progressCountdown {
          from { width: 0%; }
          to { width: 100%; }
        }
        @media (max-width: 1024px) {
          .hero-main-grid {
            grid-template-columns: 1fr !important;
            gap: 3rem !important;
            text-align: center !important;
          }
          .hero-left-col {
            text-align: center !important;
            align-items: center !important;
          }
          .hero-cta-group {
            justify-content: center !important;
          }
          .hero-trust-row {
            justify-content: center !important;
          }
        }
      `}} />

      <div className="container" style={{ position: 'relative', zIndex: 1, maxWidth: '1240px', margin: '0 auto' }}>
        
        {/* 2-Column Hero Grid */}
        <div className="hero-main-grid" style={{
          display: 'grid',
          gridTemplateColumns: '1.08fr 0.92fr',
          gap: '3.5rem',
          alignItems: 'center'
        }}>
          
          {/* Left Column: Clear, Spacious Presentation */}
          <div className="hero-left-col" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            
            {/* Top Pill Badge */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.55rem',
              background: '#ffffff',
              border: '1.5px solid #fed7aa',
              color: '#c2410c',
              padding: '0.45rem 1.15rem',
              borderRadius: '9999px',
              fontSize: '0.85rem',
              fontWeight: 800,
              boxShadow: '0 2px 8px rgba(234, 88, 12, 0.08)',
              marginBottom: '1.5rem'
            }}>
              <span className="hero-pulse-dot" />
              <span>Embroidery Digitizing & Custom Patch Manufacturing</span>
            </div>

            {/* Main Headline */}
            <h1 style={{
              fontSize: 'clamp(2.4rem, 4.2vw, 3.65rem)',
              fontFamily: 'var(--font-heading, "Inter", sans-serif)',
              fontWeight: 950,
              color: '#0f172a',
              lineHeight: 1.12,
              letterSpacing: '-0.03em',
              marginBottom: '1.35rem'
            }}>
              Professional <span style={{ color: 'var(--orange-500, #ea580c)' }}>Embroidery Digitizing</span> Services & <span style={{ color: 'var(--orange-600, #c2410c)' }}>Custom Patches</span>
            </h1>

            {/* Description Body */}
            <p style={{
              fontSize: '1.125rem',
              lineHeight: 1.65,
              color: '#475569',
              marginBottom: '2.25rem',
              maxWidth: '580px'
            }}>
              Convert your logo into machine-ready DST, PES, & EXP embroidery files or order custom embroidered patches with iron-on, velcro, & sew-on backings — hand-crafted by experts and delivered worldwide.
            </p>

            {/* CTA Buttons */}
            <div className="hero-cta-group" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '2.25rem' }}>
              <button
                type="button"
                onClick={handleLaunchOrder}
                style={{
                  background: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
                  color: '#ffffff',
                  border: 'none',
                  padding: '1rem 2.25rem',
                  borderRadius: '14px',
                  fontWeight: 800,
                  fontSize: '1.05rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  boxShadow: '0 8px 24px rgba(234, 88, 12, 0.35)',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 12px 28px rgba(234, 88, 12, 0.45)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(234, 88, 12, 0.35)';
                }}
              >
                <span>Order now</span>
                <ArrowRight size={18} />
              </button>

              <button
                type="button"
                onClick={handleViewPricing}
                style={{
                  background: '#ffffff',
                  color: '#0f172a',
                  border: '1.5px solid #cbd5e1',
                  padding: '1rem 2.15rem',
                  borderRadius: '14px',
                  fontWeight: 800,
                  fontSize: '1.05rem',
                  cursor: 'pointer',
                  boxShadow: '0 2px 10px rgba(0, 0, 0, 0.04)',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#f8fafc';
                  e.currentTarget.style.borderColor = '#94a3b8';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#ffffff';
                  e.currentTarget.style.borderColor = '#cbd5e1';
                }}
              >
                View pricing
              </button>
            </div>

            {/* Trust Badges Row (as seen in sample image) */}
            <div className="hero-trust-row" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.4rem 0.9rem',
                borderRadius: '9999px',
                background: '#fffbeb',
                border: '1px solid #fef3c7',
                color: '#b45309',
                fontSize: '0.85rem',
                fontWeight: 700
              }}>
                <Star size={15} fill="#f59e0b" color="#f59e0b" />
                <span>4.9/5 rated</span>
              </div>

              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.4rem 0.9rem',
                borderRadius: '9999px',
                background: '#eff6ff',
                border: '1px solid #dbeafe',
                color: '#1d4ed8',
                fontSize: '0.85rem',
                fontWeight: 700
              }}>
                <Clock size={15} color="#2563eb" />
                <span>2–12 hr delivery</span>
              </div>

              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.4rem 0.9rem',
                borderRadius: '9999px',
                background: '#ecfdf5',
                border: '1px solid #d1fae5',
                color: '#047857',
                fontSize: '0.85rem',
                fontWeight: 700
              }}>
                <CheckCircle2 size={15} color="#059669" />
                <span>Free revisions</span>
              </div>
            </div>

          </div>

          {/* Right Column: Prominent, Larger, Crisp Before/After Showcase Card */}
          <div 
            style={{ width: '100%', display: 'flex', justifyContent: 'center' }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <div style={{
              background: '#ffffff',
              borderRadius: '26px',
              padding: '1.75rem',
              boxShadow: '0 25px 60px rgba(15, 23, 42, 0.12), 0 4px 16px rgba(0, 0, 0, 0.04)',
              border: '1px solid rgba(226, 232, 240, 0.9)',
              width: '100%',
              maxWidth: '620px',
              position: 'relative'
            }}>
              
              {/* Top Mini Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--orange-600, #ea580c)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {currentSlide.title}
                </span>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8' }}>
                  {currentSlideIdx + 1} / {displaySlides.length}
                </span>
              </div>

              {/* Side-by-Side / Interactive Comparison Image Box */}
              <div 
                style={{
                  position: 'relative',
                  width: '100%',
                  aspectRatio: '16/10',
                  borderRadius: '18px',
                  overflow: 'hidden',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  cursor: 'ew-resize',
                  opacity: isFading ? 0.3 : 1,
                  transition: 'opacity 0.25s ease-in-out',
                  userSelect: 'none'
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
                {/* AFTER Finished Image (Full Box) */}
                <img 
                  src={currentSlide.afterImg} 
                  alt="After Finished Product" 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                  draggable="false" 
                />
                
                {/* BEFORE Image Overlay with interactive ClipPath */}
                <div style={{ 
                  position: 'absolute', 
                  top: 0, 
                  left: 0, 
                  bottom: 0, 
                  right: 0,
                  width: '100%',
                  height: '100%',
                  clipPath: `polygon(0 0, ${sliderPos}% 0, ${sliderPos}% 100%, 0 100%)`,
                }}>
                  <img 
                    src={currentSlide.beforeImg} 
                    alt="Before Original Artwork" 
                    style={{ 
                      width: '100%', 
                      height: '100%', 
                      objectFit: 'cover'
                    }} 
                    draggable="false" 
                  />
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    bottom: 0,
                    right: 0,
                    width: '3px',
                    background: '#ffffff',
                    boxShadow: '0 0 10px rgba(0,0,0,0.3)'
                  }} />
                </div>

                {/* Central Interactive Divider Handle */}
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: `${sliderPos}%`,
                  transform: 'translateX(-50%)',
                  pointerEvents: 'none'
                }}>
                  <div style={{
                    transform: 'translateY(-50%)',
                    width: '34px',
                    height: '34px',
                    background: 'var(--orange-500, #ea580c)',
                    color: '#ffffff',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 14px rgba(234, 88, 12, 0.5)',
                    border: '3px solid #ffffff'
                  }}>
                    <MoveHorizontal size={16} />
                  </div>
                </div>

                {/* Quick Arrow Controls on Hover */}
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handlePrev(); }}
                  style={{
                    position: 'absolute',
                    left: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'rgba(255, 255, 255, 0.85)',
                    border: 'none',
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                    zIndex: 10
                  }}
                  title="Previous Sample"
                >
                  <ChevronLeft size={18} color="#0f172a" />
                </button>

                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleNext(); }}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'rgba(255, 255, 255, 0.85)',
                    border: 'none',
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                    zIndex: 10
                  }}
                  title="Next Sample"
                >
                  <ChevronRight size={18} color="#0f172a" />
                </button>
              </div>

              {/* Bottom Row: BEFORE | Pagination Dots (5-second auto rotating) | AFTER */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '1.25rem',
                paddingTop: '0.75rem',
                borderTop: '1px solid #f1f5f9'
              }}>
                {/* BEFORE Label */}
                <span style={{
                  fontWeight: 900,
                  fontSize: '0.85rem',
                  letterSpacing: '0.08em',
                  color: '#0f172a',
                  textTransform: 'uppercase'
                }}>
                  {currentSlide.beforeTag || 'BEFORE'}
                </span>

                {/* Interactive Pagination Dots with 5-Second Active Indicator */}
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}>
                  {displaySlides.map((slide, idx) => {
                    const isActive = idx === currentSlideIdx;
                    return (
                      <button
                        key={slide.id || idx}
                        type="button"
                        onClick={() => handleDotClick(idx)}
                        style={{
                          height: '8px',
                          width: isActive ? '24px' : '8px',
                          borderRadius: '9999px',
                          border: 'none',
                          background: isActive ? 'var(--orange-500, #ea580c)' : '#cbd5e1',
                          cursor: 'pointer',
                          transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                          padding: 0,
                          position: 'relative',
                          overflow: 'hidden'
                        }}
                        title={`View sample ${idx + 1}: ${slide.title}`}
                      />
                    );
                  })}
                </div>

                {/* AFTER Label */}
                <span style={{
                  fontWeight: 900,
                  fontSize: '0.85rem',
                  letterSpacing: '0.08em',
                  color: '#0f172a',
                  textTransform: 'uppercase'
                }}>
                  {currentSlide.afterTag || 'AFTER'}
                </span>
              </div>

            </div>
          </div>

        </div>

      </div>
    </section>
  );
};

export default HeroSection;
