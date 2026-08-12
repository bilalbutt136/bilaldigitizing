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
  LayoutGrid,
  HeartHandshake,
  Award,
  Zap,
  TrendingUp,
  ThumbsUp
} from 'lucide-react';

const ICON_MAP = {
  Star,
  Globe,
  Clock,
  ShieldCheck,
  HeartHandshake,
  Award,
  Zap,
  TrendingUp,
  ThumbsUp,
  CheckCircle2,
  Tag
};

export const HeroSection = () => {
  const navigate = useNavigate();
  const { 
    protectedNavigate, 
    openOrderWizard, 
    activeHomeServiceTab, 
    setActiveHomeServiceTab, 
    serviceCmsContent = {},
    heroSlides,
    heroGlobalSettings,
    heroServiceText = {}
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

  const resolveAction = (actionStr, defaultBehavior) => {
    if (!actionStr) {
      defaultBehavior();
      return;
    }
    if (actionStr.startsWith('#')) {
      const el = document.getElementById(actionStr.substring(1));
      if (el) el.scrollIntoView({ behavior: 'smooth' });
      else navigate(actionStr);
    } else if (actionStr.includes('orderWizard') || actionStr === '/order') {
      if (openOrderWizard) openOrderWizard({ type: currentKey });
      else protectedNavigate('customer', true);
    } else {
      navigate(actionStr);
    }
  };

  const handlePrimaryClick = () => {
    resolveAction(activeService.primary_btn_action, () => {
      if (currentKey === 'all') {
        const el = document.getElementById('pricing');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      } else {
        if (openOrderWizard) openOrderWizard({ type: currentKey });
        else protectedNavigate('customer', true);
      }
    });
  };

  const handleSecondaryClick = () => {
    resolveAction(activeService.secondary_btn_action, () => {
      if (currentKey === 'all') {
        if (openOrderWizard) openOrderWizard({ type: 'all' });
        else protectedNavigate('customer', true);
      } else {
        const el = document.getElementById('pricing');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }
    });
  };

  const cleanHtml = (html) => {
    if (typeof html !== 'string') return html;
    return html.replace(/&nbsp;/g, ' ');
  };

  return (
    <section style={{
      background: 'linear-gradient(135deg, var(--navy-950, #0f172a) 0%, var(--navy-800, #1e293b) 100%)',
      color: '#ffffff',
      padding: '2.5rem 0 6rem',
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
        .hero-text-rotate {
          display: inline-block;
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
        @media (max-width: 1024px) {
          .hero-grid {
            grid-template-columns: 1fr !important;
            gap: 4rem !important;
          }
          .hero-left-col {
            max-width: 100% !important;
            text-align: center !important;
          }
          .hero-trust-badges {
            justify-content: center !important;
          }
          .hero-cta-group {
            justify-content: center !important;
          }
        }
      `}} />

      <div className="container" style={{ position: 'relative', zIndex: 2, maxWidth: '1500px', margin: '0 auto', padding: '0 2rem' }}>
        
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '3rem' }}>
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
                    gap: '0.6rem',
                    padding: '0.6rem 1.8rem',
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
                  <Icon size={16} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="hero-grid" style={{
          display: 'grid',
          gridTemplateColumns: '55% 45%',
          gap: '3rem',
          alignItems: 'center'
        }}>
          
          <div className="hero-left-col" style={{ textAlign: 'left' }}>
            <h1 style={{
                fontSize: 'clamp(2rem, 3.8vw, 3.2rem)',
                fontWeight: 800,
                lineHeight: 1.15,
                color: '#ffffff',
                marginBottom: '1.25rem'
              }}
              dangerouslySetInnerHTML={{ __html: cleanHtml(activeService.title || "Premium Digitizing, Vector Art & Custom Patches") }}
            />
            
            <div style={{ 
                fontSize: 'clamp(1.1rem, 2vw, 1.3rem)',
                fontWeight: 600,
                marginBottom: '1.5rem',
                color: 'var(--orange-400, #ff9433)'
              }}
              dangerouslySetInnerHTML={{ __html: cleanHtml(activeService.highlight || "Engineered for excellence, delivered in hours.") }}
            />

            <div style={{
                fontSize: '1.05rem',
                lineHeight: 1.6,
                color: '#94a3b8',
                marginBottom: '2rem'
              }}
              dangerouslySetInnerHTML={{ __html: cleanHtml(activeService.description || "Transform your brand assets with professional digitizing and vector conversion services.") }}
            />

            <div className="hero-trust-badges" style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '1.5rem',
              marginBottom: '2.5rem'
            }}>
              {(activeService.trust_points?.[0]?.stats || [
                { value: '1,200+', label: 'Clients', icon: 'Star' },
                { value: '45+', label: 'Countries', icon: 'Globe' },
                { value: '4-Hr', label: 'Express', icon: 'Clock' },
                { value: '100%', label: 'Guaranteed', icon: 'ShieldCheck' }
              ]).map((b, i) => {
                const IconComp = ICON_MAP[b.icon] || Star;
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <IconComp size={18} style={{ color: 'var(--orange-500, #ff7a00)' }} />
                    <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                      {b.value && <span style={{ color: 'var(--orange-500)' }}>{b.value} </span>}
                      {b.label}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="hero-cta-group" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
              <button 
                type="button"
                onClick={handlePrimaryClick}
                style={{ 
                  background: 'var(--orange-500, #ff7a00)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '1rem 2rem',
                  fontSize: '1rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                {activeService.primary_cta || 'Get Started'} <ArrowRight size={18} />
              </button>

              <button 
                type="button"
                onClick={handleSecondaryClick}
                style={{ 
                  background: 'transparent',
                  color: '#ffffff', 
                  border: '1.5px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '8px',
                  padding: '1rem 2rem', 
                  fontSize: '1rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                 {activeService.secondary_cta || 'View Pricing'}
              </button>
            </div>
          </div>

          <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
            <div style={{
              background: 'rgba(15, 23, 42, 0.4)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '20px',
              padding: '1.25rem',
              boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.5)',
              width: '100%',
              maxWidth: '650px',
              backdropFilter: 'blur(12px)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--orange-400, #ff9433)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span className="blinking-green-dot" /> Showcase
                  </div>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: '#ffffff' }}>
                    {activeService.trust_points?.[0]?.previewTitle || "Professional Results"}
                  </div>
                </div>
              </div>

              <div 
                style={{
                  position: 'relative',
                  width: '100%',
                  aspectRatio: '16/10',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  cursor: 'ew-resize',
                  userSelect: 'none',
                  background: '#000'
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
                {(() => {
                  const fallback = 'https://images.unsplash.com/photo-1620660605929-e1fcc13bb221?auto=format&fit=crop&q=80&w=800';
                  const imgAfter = activeService.banner_image || fallback;
                  const imgBefore = activeService.trust_points?.[0]?.previewBefore || null;
                  return (
                    <>
                      <img src={imgAfter} alt="After" style={{ width: '100%', height: '100%', objectFit: 'cover' }} draggable="false" />
                      
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
                          src={imgBefore || imgAfter} 
                          alt="Before" 
                          style={{ 
                            width: '100%', height: '100%', objectFit: 'cover',
                            filter: imgBefore ? 'none' : 'grayscale(100%) blur(4px) contrast(1.2)'
                          }} 
                          draggable="false" 
                        />
                        <div style={{
                          position: 'absolute',
                          top: 0,
                          bottom: 0,
                          right: 0,
                          width: '2px',
                          background: 'rgba(255, 255, 255, 0.8)'
                        }} />
                      </div>
                    </>
                  );
                })()}

                <div style={{
                  position: 'absolute',
                  top: '50%',
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
                  <span>{activeService.trust_points?.[0]?.previewTag || 'Before'}</span>
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
                  <span>{activeService.trust_points?.[0]?.previewTagAfter || 'After'}</span>
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
