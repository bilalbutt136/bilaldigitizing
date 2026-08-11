'use client';

import React, { useState, useEffect } from 'react';
import { useNavigate } from '../../utils/navigation';
import { useAppState } from '../../context/StateContext';
import { normalizeCategory } from '../../utils/categoryUtils';
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
  ShieldCheck,
  LayoutGrid
} from 'lucide-react';

export const HeroSection = () => {
  const navigate = useNavigate();
  const { 
    protectedNavigate, 
    openOrderWizard, 
    activeHomeServiceTab, 
    setActiveHomeServiceTab, 
    serviceCmsContent = {},
    heroSlides,
    heroGlobalSettings
  } = useAppState();

  const [sliderPos, setSliderPos] = useState(50);
  const [textIndex, setTextIndex] = useState(0);

  // Fallback for global settings
  const globalTitle = heroGlobalSettings?.title || "Premium Embroidery, Vector Art & Patches";
  const rotatingStr = heroGlobalSettings?.rotatingTexts || "Commercial Embroidery, Scalable Vector Art, Custom Physical Patches";
  const rotatingTextsArr = rotatingStr.split(',').map(s => s.trim());

  useEffect(() => {
    const interval = setInterval(() => {
      setTextIndex((prev) => (prev + 1) % rotatingTextsArr.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [rotatingTextsArr.length]);

  const currentKey = activeHomeServiceTab === 'patches' ? 'patch' : (activeHomeServiceTab || 'all');
  const targetKey = currentKey === 'patch' ? 'patches' : currentKey;

  // Real-time Database Content Binding
  let activeSlide = null;
  if (heroSlides && heroSlides.length > 0) {
    activeSlide = heroSlides.find(s => s.id?.toLowerCase()?.includes(targetKey) || s.serviceKey?.toLowerCase()?.includes(targetKey)) || heroSlides[0];
  }

  const activeService = activeSlide;

  if (!activeService) {
    return (
      <section style={{
        background: 'linear-gradient(135deg, var(--navy-950, #0f172a) 0%, var(--navy-800, #1e293b) 100%)',
        color: '#ffffff',
        padding: '8rem 0',
        textAlign: 'center'
      }}>
        <div style={{ opacity: 0.7, fontSize: '1.2rem' }}>Loading studio configuration...</div>
      </section>
    );
  }

  const handlePrimaryClick = () => {
    if (currentKey === 'all') {
      const el = document.getElementById('pricing');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else {
      if (openOrderWizard) {
        openOrderWizard({ type: currentKey });
      } else {
        protectedNavigate('customer', true);
      }
    }
  };

  const handleSecondaryClick = () => {
    if (currentKey === 'all') {
      if (openOrderWizard) {
        openOrderWizard({ type: 'all' });
      } else {
        protectedNavigate('customer', true);
      }
    } else {
      const el = document.getElementById('pricing');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
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
        @keyframes blinkingDot {
          0%, 100% { opacity: 1; transform: scale(1.1); }
          50% { opacity: 0.25; transform: scale(0.75); }
        }
        @keyframes cardBlinkingBorder {
          0%, 100% {
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 20px rgba(255, 122, 0, 0.25);
            border-color: rgba(255, 122, 0, 0.4);
          }
          50% {
            box-shadow: 0 30px 65px -10px rgba(0, 0, 0, 0.7), 0 0 35px rgba(255, 122, 0, 0.6);
            border-color: rgba(255, 122, 0, 0.9);
          }
        }
        @keyframes handlePulseBlink {
          0%, 100% { box-shadow: 0 0 12px rgba(255, 122, 0, 0.8), 0 0 0 0 rgba(255, 122, 0, 0.4); }
          50% { box-shadow: 0 0 22px rgba(255, 122, 0, 1), 0 0 0 10px rgba(255, 122, 0, 0); }
        }
        .hero-text-rotate {
          display: inline-block;
          min-width: 320px;
          animation: fadeUp 0.5s ease forwards;
        }
        .blinking-red-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #ef4444;
          box-shadow: 0 0 8px #ef4444;
          display: inline-block;
          animation: blinkingDot 1.2s infinite ease-in-out;
        }
        .blinking-green-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #22c55e;
          box-shadow: 0 0 8px #22c55e;
          display: inline-block;
          animation: blinkingDot 1.2s infinite ease-in-out 0.6s;
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
              { id: 'all', label: 'All Services', icon: LayoutGrid },
              { id: 'embroidery', label: 'Embroidery', icon: Layers },
              { id: 'vector-art', label: 'Vector Art', icon: PenTool },
              { id: 'patches', label: 'Patches', icon: Tag }
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = normalizeCategory(activeHomeServiceTab) === normalizeCategory(tab.id);
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
              {globalTitle}
            </h1>
            
            {/* Animated Text Rotation */}
            <div style={{ 
              fontSize: 'clamp(1.5rem, 3vw, 2.2rem)',
              fontWeight: 700,
              marginBottom: '1.5rem',
              color: 'var(--orange-400, #ff9433)',
              minHeight: '3rem'
            }}>
              Precision <span key={textIndex} className="hero-text-rotate" style={{ color: 'var(--orange-500, #ff7a00)' }}>{rotatingTextsArr[textIndex]}</span>
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
                onClick={handleSecondaryClick}
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

          {/* Right Column Interactive Before/After Visualizer Card with Blinking Pulse Effect */}
          <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
            <div style={{
              background: 'rgba(30, 41, 59, 0.7)',
              border: '2px solid rgba(255, 122, 0, 0.5)',
              borderRadius: '24px',
              padding: '1.5rem',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
              width: '100%',
              maxWidth: '550px',
              backdropFilter: 'blur(16px)',
              animation: 'cardBlinkingBorder 3s infinite ease-in-out'
            }}>
              {/* Card Header Info */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1rem'
              }}>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--orange-400, #ff9433)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span className="blinking-green-dot" /> Showcase — {activeService.label}
                  </div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#ffffff', marginTop: '0.2rem' }}>
                    {activeService.previewTitle}
                  </div>
                </div>
              </div>

              {/* Split Drag Slider Visualizer */}
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

                {/* Divider Line with Blinking Pulse Handle */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  left: `${sliderPos}%`,
                  width: '4px',
                  background: 'var(--orange-500, #ff7a00)',
                  boxShadow: '0 0 16px rgba(255, 122, 0, 0.9)',
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
                    boxShadow: '0 4px 14px rgba(0, 0, 0, 0.5)',
                    border: '3px solid #ffffff',
                    animation: 'handlePulseBlink 2s infinite ease-in-out'
                  }}>
                    <MoveHorizontal size={18} />
                  </div>
                </div>

                {/* Overlay Labels with Blinking Dots */}
                <span style={{
                  position: 'absolute',
                  bottom: '16px',
                  left: '16px',
                  background: 'rgba(15, 23, 42, 0.85)',
                  backdropFilter: 'blur(4px)',
                  color: '#ffffff',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  padding: '0.4rem 0.8rem',
                  borderRadius: '6px',
                  letterSpacing: '0.05em',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  border: '1px solid rgba(239, 68, 68, 0.4)'
                }}>
                  <span className="blinking-red-dot" />
                  <span>{activeService.previewTag || 'Before'}</span>
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
                  boxShadow: '0 4px 12px rgba(255, 122, 0, 0.4)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}>
                  <span className="blinking-green-dot" />
                  <span>{activeService.previewTagAfter || 'After'}</span>
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
