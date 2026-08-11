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
  Sparkles
} from 'lucide-react';

export const HeroSection = () => {
  const navigate = useNavigate();
  const { 
    protectedNavigate, 
    openOrderWizard, 
    activeHomeServiceTab, 
    setActiveHomeServiceTab, 
    serviceCmsContent = {},
    heroSlides = [],
    heroGlobalSettings
  } = useAppState();

  const [sliderPos, setSliderPos] = useState(50);
  const [textIndex, setTextIndex] = useState(0);
  const [activeSampleIdx, setActiveSampleIdx] = useState(0);

  // Fallback for global settings
  const globalTitle = heroGlobalSettings?.title || "Professional Embroidery Digitizing Services & Custom Patches";
  const rotatingStr = heroGlobalSettings?.rotatingTexts || "Commercial Embroidery, Scalable Vector Art, Custom Physical Patches";
  const rotatingTextsArr = rotatingStr.split(',').map(s => s.trim());

  useEffect(() => {
    const interval = setInterval(() => {
      setTextIndex((prev) => (prev + 1) % rotatingTextsArr.length);
    }, 3200);
    return () => clearInterval(interval);
  }, [rotatingTextsArr.length]);

  // Auto switch showcase samples
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSampleIdx((prev) => (prev + 1) % 3);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  const currentKey = activeHomeServiceTab === 'patches' ? 'patch' : (activeHomeServiceTab || 'all');
  const targetKey = currentKey === 'patch' ? 'patches' : currentKey;

  // Real-time Database Content Binding
  let activeSlide = null;
  if (heroSlides && heroSlides.length > 0) {
    activeSlide = heroSlides.find(s => s.id?.toLowerCase()?.includes(targetKey) || s.serviceKey?.toLowerCase()?.includes(targetKey)) || heroSlides[0];
  }

  const activeService = activeSlide || {
    label: 'Embroidery Digitizing',
    description: 'Convert your logo into machine-ready DST, PES, & EXP embroidery files or order custom embroidered patches with iron-on, velcro, & sew-on backings — hand-crafted by experts and delivered worldwide.',
    primaryCta: 'Order now',
    secondaryCta: 'View pricing',
    previewBefore: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
    previewAfter: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80',
    previewTitle: 'Cockott Mascot Logo'
  };

  const samplePairs = [
    {
      id: 0,
      title: activeService.previewTitle || 'Cockott Mascot Design',
      beforeImg: activeService.previewBefore || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
      afterImg: activeService.previewAfter || 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80'
    },
    {
      id: 1,
      title: 'Vector Art Conversion',
      beforeImg: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=800&q=80',
      afterImg: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=800&q=80'
    },
    {
      id: 2,
      title: 'Custom 3D Tactical Emblem',
      beforeImg: 'https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=800&q=80',
      afterImg: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80'
    }
  ];

  const currentSample = samplePairs[activeSampleIdx] || samplePairs[0];

  const handlePrimaryClick = () => {
    if (openOrderWizard) {
      openOrderWizard({ type: currentKey === 'all' ? 'embroidery' : currentKey });
    } else {
      protectedNavigate('customer', true);
    }
  };

  const handleSecondaryClick = () => {
    const el = document.getElementById('pricing') || document.getElementById('pricing-tiers');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section style={{
      background: 'linear-gradient(135deg, #090d16 0%, #0f172a 50%, #1e1b4b 100%)',
      color: '#ffffff',
      padding: '3.5rem 0 5.5rem',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background Accent Glows */}
      <div style={{
        position: 'absolute',
        top: '-15%',
        left: '-10%',
        width: '700px',
        height: '700px',
        background: 'radial-gradient(circle, rgba(124, 58, 237, 0.18) 0%, transparent 65%)',
        pointerEvents: 'none',
        animation: 'pulseGlow 6s ease-in-out infinite alternate'
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-15%',
        right: '-10%',
        width: '650px',
        height: '650px',
        background: 'radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 65%)',
        pointerEvents: 'none'
      }} />

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes pulseGlow {
          0% { transform: scale(1); opacity: 0.7; }
          100% { transform: scale(1.1); opacity: 1; }
        }
        @keyframes blinkingDot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.25; transform: scale(0.8); }
        }
        @keyframes cardBlinkingBorder {
          0%, 100% {
            box-shadow: 0 15px 45px -10px rgba(124, 58, 237, 0.3), 0 0 25px rgba(168, 85, 247, 0.2);
            border-color: rgba(168, 85, 247, 0.5);
          }
          50% {
            box-shadow: 0 20px 60px -5px rgba(124, 58, 237, 0.55), 0 0 35px rgba(168, 85, 247, 0.5);
            border-color: rgba(124, 58, 237, 0.9);
          }
        }
        @keyframes redPulseText {
          0%, 100% { text-shadow: 0 0 10px rgba(239, 68, 68, 0.7); opacity: 1; }
          50% { text-shadow: 0 0 2px rgba(239, 68, 68, 0.2); opacity: 0.7; }
        }
        @keyframes greenPulseText {
          0%, 100% { text-shadow: 0 0 10px rgba(34, 197, 94, 0.7); opacity: 1; }
          50% { text-shadow: 0 0 2px rgba(34, 197, 94, 0.2); opacity: 0.7; }
        }
        .blinking-red-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #ef4444;
          box-shadow: 0 0 8px #ef4444;
          animation: blinkingDot 1.2s infinite ease-in-out;
        }
        .blinking-green-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #22c55e;
          box-shadow: 0 0 8px #22c55e;
          animation: blinkingDot 1.2s infinite ease-in-out 0.6s;
        }
        .blinking-purple-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #a855f7;
          box-shadow: 0 0 8px #a855f7;
          animation: blinkingDot 1.5s infinite ease-in-out;
        }
      `}} />

      <div className="container" style={{ position: 'relative', zIndex: 2, maxWidth: '1280px', margin: '0 auto', padding: '0 1.5rem' }}>
        
        {/* Service Switcher Category Tabs */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: '2.5rem'
        }}>
          <div style={{
            display: 'inline-flex',
            background: 'rgba(15, 23, 42, 0.75)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            padding: '0.35rem',
            borderRadius: '9999px',
            backdropFilter: 'blur(12px)',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)'
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
                    background: isActive ? 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)' : 'transparent',
                    color: isActive ? '#ffffff' : '#94a3b8',
                    fontWeight: isActive ? 700 : 500,
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    boxShadow: isActive ? '0 4px 14px rgba(124, 58, 237, 0.4)' : 'none'
                  }}
                >
                  <Icon size={16} style={{ color: isActive ? '#ffffff' : '#94a3b8' }} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Hero Main Content Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '3.5rem',
          alignItems: 'center'
        }}>
          
          {/* Left Column Text Content */}
          <div style={{ textAlign: 'left' }}>
            
            {/* Top Pill Badge */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.55rem',
              background: 'rgba(168, 85, 247, 0.12)',
              border: '1px solid rgba(168, 85, 247, 0.35)',
              padding: '0.4rem 1.1rem',
              borderRadius: '9999px',
              color: '#c084fc',
              fontSize: '0.825rem',
              fontWeight: 700,
              letterSpacing: '0.02em',
              marginBottom: '1.25rem'
            }}>
              <span className="blinking-purple-dot" />
              <span>Embroidery Digitizing & Custom Patch Manufacturing</span>
            </div>

            {/* H1 Headline */}
            <h1 style={{
              fontSize: 'clamp(2.4rem, 4.5vw, 3.6rem)',
              fontWeight: 900,
              lineHeight: 1.15,
              color: '#ffffff',
              marginBottom: '1rem',
              letterSpacing: '-0.025em',
              fontFamily: 'var(--font-heading, "Plus Jakarta Sans", sans-serif)'
            }}>
              Professional{' '}
              <span style={{
                background: 'linear-gradient(135deg, #a855f7 0%, #c084fc 40%, #60a5fa 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                Embroidery Digitizing Services & Custom Patches
              </span>
            </h1>

            {/* Description Text */}
            <p style={{
              fontSize: 'clamp(1rem, 1.15vw, 1.1rem)',
              lineHeight: 1.65,
              color: '#94a3b8',
              marginBottom: '2rem',
              maxWidth: '600px',
              fontFamily: 'var(--font-body, "Inter", sans-serif)'
            }}>
              {activeService.description || 'Convert your logo into machine-ready DST, PES, & EXP embroidery files or order custom embroidered patches with iron-on, velcro, & sew-on backings — hand-crafted by experts and delivered worldwide.'}
            </p>

            {/* Action Buttons Row */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '1rem', 
              flexWrap: 'wrap',
              marginBottom: '2.5rem'
            }}>
              {/* Primary Button */}
              <button 
                type="button"
                onClick={handlePrimaryClick}
                style={{ 
                  background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '9999px',
                  padding: '0.85rem 2.25rem',
                  fontSize: '1.05rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 8px 20px -4px rgba(124, 58, 237, 0.5)',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 28px -4px rgba(124, 58, 237, 0.7)'; }}
                onMouseOut={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 8px 20px -4px rgba(124, 58, 237, 0.5)'; }}
              >
                <span>{activeService.primaryCta || 'Order now'}</span>
                <ArrowRight size={18} />
              </button>

              {/* Secondary Button */}
              <button 
                type="button"
                onClick={handleSecondaryClick}
                style={{ 
                  background: '#ffffff',
                  color: '#0f172a', 
                  border: '1.5px solid #e2e8f0',
                  borderRadius: '14px',
                  padding: '0.85rem 1.8rem', 
                  fontSize: '1rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 4px 14px rgba(0, 0, 0, 0.08)',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseOut={(e) => { e.currentTarget.style.background = '#ffffff'; e.currentTarget.style.transform = 'none'; }}
              >
                <span>{activeService.secondaryCta || 'View pricing'}</span>
              </button>
            </div>

            {/* Bottom Value Feature Pills */}
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.85rem',
              alignItems: 'center'
            }}>
              {/* Rating Pill */}
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                background: 'rgba(254, 243, 199, 0.12)',
                border: '1px solid rgba(252, 211, 77, 0.35)',
                color: '#fbbf24',
                fontSize: '0.85rem',
                fontWeight: 700,
                padding: '0.4rem 0.95rem',
                borderRadius: '9999px'
              }}>
                <Star size={15} style={{ fill: '#fbbf24', color: '#fbbf24' }} />
                <span>4.9/5 rated</span>
              </div>

              {/* Delivery Pill */}
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                background: 'rgba(243, 232, 255, 0.12)',
                border: '1px solid rgba(233, 213, 255, 0.35)',
                color: '#c084fc',
                fontSize: '0.85rem',
                fontWeight: 700,
                padding: '0.4rem 0.95rem',
                borderRadius: '9999px'
              }}>
                <Clock size={15} />
                <span>2–12 hr delivery</span>
              </div>

              {/* Free Revisions Pill */}
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                background: 'rgba(236, 253, 245, 0.12)',
                border: '1px solid rgba(167, 243, 208, 0.35)',
                color: '#34d399',
                fontSize: '0.85rem',
                fontWeight: 700,
                padding: '0.4rem 0.95rem',
                borderRadius: '9999px'
              }}>
                <CheckCircle2 size={15} />
                <span>Free revisions</span>
              </div>
            </div>

          </div>

          {/* Right Column: Blinking Before / After Image Showcase Card */}
          <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
            <div style={{
              background: '#ffffff',
              border: '2px solid rgba(168, 85, 247, 0.5)',
              borderRadius: '28px',
              padding: '1.75rem',
              width: '100%',
              maxWidth: '560px',
              boxShadow: '0 20px 50px -10px rgba(124, 58, 237, 0.35), 0 0 30px rgba(168, 85, 247, 0.25)',
              animation: 'cardBlinkingBorder 3s infinite ease-in-out',
              position: 'relative'
            }}>
              
              {/* Inner Before / After Frame Container */}
              <div style={{
                background: '#f8fafc',
                borderRadius: '20px',
                border: '1px solid #e2e8f0',
                padding: '1.25rem',
                position: 'relative',
                overflow: 'hidden'
              }}>
                
                {/* Side by Side Images Showcase */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '1rem',
                  alignItems: 'center',
                  marginBottom: '1rem'
                }}>
                  {/* Left BEFORE Image */}
                  <div style={{
                    position: 'relative',
                    background: '#ffffff',
                    borderRadius: '16px',
                    padding: '0.75rem',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                    border: '1.5px solid #fee2e2',
                    textAlign: 'center'
                  }}>
                    <img 
                      src={currentSample.beforeImg} 
                      alt="Before Artwork" 
                      style={{
                        width: '100%',
                        height: '180px',
                        objectFit: 'contain',
                        borderRadius: '10px'
                      }}
                    />
                  </div>

                  {/* Right AFTER Image */}
                  <div style={{
                    position: 'relative',
                    background: '#ffffff',
                    borderRadius: '16px',
                    padding: '0.75rem',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                    border: '1.5px solid #dcfce7',
                    textAlign: 'center'
                  }}>
                    <img 
                      src={currentSample.afterImg} 
                      alt="After Stitching" 
                      style={{
                        width: '100%',
                        height: '180px',
                        objectFit: 'contain',
                        borderRadius: '10px'
                      }}
                    />
                  </div>
                </div>

                {/* BEFORE vs AFTER Labels & Blinking Indicators */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-around',
                  alignItems: 'center',
                  paddingTop: '0.5rem',
                  borderTop: '1px dashed #cbd5e1'
                }}>
                  {/* Red BEFORE Label */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    fontSize: '1.25rem',
                    fontWeight: 900,
                    color: '#dc2626',
                    animation: 'redPulseText 1.5s infinite ease-in-out'
                  }}>
                    <span className="blinking-red-dot" />
                    <span>Before</span>
                  </div>

                  {/* Middle Animated Connector */}
                  <div style={{ color: '#94a3b8', fontSize: '0.9rem', fontWeight: 700 }}>
                    - - - - -
                  </div>

                  {/* Green AFTER Label */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    fontSize: '1.25rem',
                    fontWeight: 900,
                    color: '#16a34a',
                    animation: 'greenPulseText 1.5s infinite ease-in-out'
                  }}>
                    <span className="blinking-green-dot" />
                    <span>After</span>
                  </div>
                </div>

              </div>

              {/* Bottom Carousel Indicator Pills */}
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '0.5rem',
                marginTop: '1.25rem'
              }}>
                {[0, 1, 2].map((idx) => {
                  const isCurrent = activeSampleIdx === idx;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveSampleIdx(idx)}
                      style={{
                        height: '8px',
                        width: isCurrent ? '28px' : '8px',
                        borderRadius: '9999px',
                        background: isCurrent ? '#7c3aed' : '#cbd5e1',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                      }}
                      title={`Sample ${idx + 1}`}
                    />
                  );
                })}
              </div>

            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
