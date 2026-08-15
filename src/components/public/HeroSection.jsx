'use client';

import React, { useState } from 'react';
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
  Sparkles,
  Zap
} from 'lucide-react';


const ICON_MAP = {
  Star,
  Globe,
  Clock,
  ShieldCheck,
  Zap,
  CheckCircle2,
  Tag,
  Layers,
  PenTool
};

export const HeroSection = () => {
  const navigate = useNavigate();
  const { 
    protectedNavigate, 
    openOrderWizard, 
    activeHomeServiceTab = 'all', 
    setActiveHomeServiceTab,
    heroSlides = []
  } = useAppState();

  const [sliderPos, setSliderPos] = useState(50);

  const activeTab = normalizeCategory(activeHomeServiceTab || 'all');

  // Fallback curated showcase data if not yet loaded from DB
  const showcaseData = {
    all: {
      badge: 'Complete Studio Capabilities',
      title: 'Commercial Embroidery, Scalable Vector Art & Custom Patches',
      highlight: 'Three Master Services. Factory-Grade Precision. 4–12 Hr Delivery.',
      description: 'From machine-ready stitch files (.DST, .PES, .EMB) and crisp spot-color vector art (.AI, .EPS, .SVG) to physical custom patches with Velcro and Iron-On backings delivered straight to your door.',
      features: [
        'Embroidery Digitizing: Starts $10.00 Flat · 100% Hand Pathing · 0 Thread Breaks',
        'Vector Art Redraw: Starts $15.00 Flat · Pantone Spot Colors · Master AI/EPS/SVG',
        'Custom Physical Patches: Starts $1.50 / Piece · Velcro & Iron-On · Doorstep Delivery'
      ],
      packages: [
        { id: 'pkg-all-1', name: 'Embroidery Digitizing', price: '$10.00', turnaround: '4–12 Hrs', description: 'Tajima .DST, Wilcom .EMB & Brother .PES with 0 thread breaks.' },
        { id: 'pkg-all-2', name: 'Vector Art Redraw', price: '$15.00', turnaround: '6–12 Hrs', description: 'Pixel-perfect Bézier node curves with Pantone spot color separation.' },
        { id: 'pkg-all-3', name: 'Custom Patches', price: '$1.50 / pc', turnaround: '3–5 Days', description: 'Embroidered, woven, and 3D PVC patches with Velcro and Iron-On.' }
      ],
      stats: [
        { value: '1,200+', label: 'Clients', icon: 'Star' },
        { value: '45+', label: 'Countries', icon: 'Globe' },
        { value: '4-Hr', label: 'Express', icon: 'Clock' },
        { value: '100%', label: 'Guaranteed', icon: 'ShieldCheck' }
      ],
      primary_cta: 'Get Started Now',
      primary_btn_action: '#pricing',
      secondary_cta: 'Explore Packages',
      secondary_btn_action: '/pricing',
      previewTitle: 'All Studio Production Results',
      beforeImg: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=800',
      afterImg: 'https://images.unsplash.com/photo-1620660605929-e1fcc13bb221?auto=format&fit=crop&q=80&w=800',
      beforeTag: 'Raw Artwork',
      afterTag: 'Finished Production'
    },
    embroidery: {
      badge: 'Factory-Grade Machine Digitizing',
      title: 'Commercial Embroidery Digitizing',
      highlight: 'Zero Thread Breaks. Calculated Pull Compensation. 4–12 Hr Turnaround.',
      description: 'Engineered by master digitizers with 15+ years factory experience. Hand-mapped stitch pathing for caps, left chest polos, 3D puff foam, and full jacket backs with free unlimited revisions.',
      features: [
        '100% Manual Digitizing (No Auto-Trace shortcuts)',
        'All Machine Formats: Tajima (.DST), Wilcom (.EMB), Brother (.PES), Melco (.EXP)',
        'Free Unlimited Production Edits & Color Sequence Sheets',
        'Packages: Left Chest ($10), Mid-Size ($20), Full Back & 3D Puff ($35)'
      ],
      packages: [
        { id: 'pkg-emb-1', name: 'Left Chest & Cap Logo', price: '$10.00', turnaround: '4–12 Hrs', description: 'Standard logos up to 4" x 4" optimized for structured caps and polos.' },
        { id: 'pkg-emb-2', name: 'Mid-Size Jacket / Sleeve', price: '$20.00', turnaround: '6–12 Hrs', description: 'Medium complexity artwork up to 7" x 7" with density compensation.' },
        { id: 'pkg-emb-3', name: 'Full Jacket Back & 3D Puff', price: '$35.00', turnaround: '8–12 Hrs', description: 'High stitch count full back designs and specialty 3D puff foam.' }
      ],
      stats: [
        { value: '100k+', label: 'Sew-Outs', icon: 'Star' },
        { value: '0', label: 'Thread Breaks', icon: 'Zap' },
        { value: '4-12 Hr', label: 'Delivery', icon: 'Clock' },
        { value: '100%', label: 'Guaranteed', icon: 'ShieldCheck' }
      ],
      primary_cta: 'Order Embroidery Digitizing',
      primary_btn_action: '/order',
      secondary_cta: 'View Embroidery Packages',
      secondary_btn_action: '/services/embroidery-digitizing',
      previewTitle: 'Raw Art to High-Density Sew-Out',
      beforeImg: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=800',
      afterImg: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&q=80&w=800',
      beforeTag: 'Original Logo',
      afterTag: 'Digitized Sew-Out'
    },
    'vector-art': {
      badge: 'Resolution-Independent Vector Tracing',
      title: 'Raster to Scalable Vector Art Conversion',
      highlight: 'Hand-Drawn Bézier Curves. Pantone Color Separation. Press Ready.',
      description: 'Convert blurry low-res JPGs, PNGs, and sketches into razor-sharp vector graphics with clean anchor nodes, exact Pantone (PMS) matching, and separated layers for screen printing and vinyl cutting.',
      features: [
        '100% Hand-Crafted Smooth Node Paths (Zero Overlapping Lines)',
        'Pantone Solid Coated Spot Color Separation Included',
        'Master Source Suite: .AI, .EPS, .SVG & High-Res 300+ DPI PDF',
        'Packages: Simple Logo ($15), Medium Detail ($25), Complex Art ($45)'
      ],
      packages: [
        { id: 'pkg-vec-1', name: 'Simple Logo & Text Redraw', price: '$15.00', turnaround: '6–12 Hrs', description: 'Clean typographic logos and basic shapes with crisp vector nodes.' },
        { id: 'pkg-vec-2', name: 'Medium Detail Artwork', price: '$25.00', turnaround: '8–12 Hrs', description: 'Multi-color logos and illustrations with Pantone spot color matching.' },
        { id: 'pkg-vec-3', name: 'Complex Intricate Art', price: '$45.00', turnaround: '12–24 Hrs', description: 'Intricate crests, photographic traces, and mascot illustrations.' }
      ],
      stats: [
        { value: '50k+', label: 'Vectors', icon: 'Star' },
        { value: 'Sharp', label: 'Cut Paths', icon: 'Zap' },
        { value: '6-12 Hr', label: 'Delivery', icon: 'Clock' },
        { value: '100%', label: 'Scale-Free', icon: 'ShieldCheck' }
      ],
      primary_cta: 'Order Vector Art Conversion',
      primary_btn_action: '/order',
      secondary_cta: 'View Vector Packages',
      secondary_btn_action: '/services/vector-tracing',
      previewTitle: 'Blurry Raster to Clean Scalable Vector',
      beforeImg: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=800',
      afterImg: 'https://images.unsplash.com/photo-1620660605929-e1fcc13bb221?auto=format&fit=crop&q=80&w=800',
      beforeTag: 'Blurry Pixelated Raster',
      afterTag: 'Sharp Vector Nodes'
    },
    patches: {
      badge: 'Custom Manufactured Emblems',
      title: 'Premium Physical Custom Patches',
      highlight: 'Embroidered, Woven & 3D Molded PVC. Doorstep Delivery.',
      description: 'Custom manufactured physical patches for uniforms, tactical gear, hats, and apparel brands. Available with Velcro hook & loop, iron-on, or adhesive backings with free digital proofs before production.',
      features: [
        'Custom Embroidered, High-Density Woven & 3D Rubber PVC',
        'Military-Grade Velcro, Heat-Seal Iron-On & Peel Backings',
        'Free 12-Hour Digital Proof & Doorstep Worldwide Shipping',
        'Quantity Tiers: Sample (10-50 pcs), Production (100-500 pcs), Bulk ($1.50/pc)'
      ],
      packages: [
        { id: 'pkg-patch-1', name: 'Sample Batch (10–50 Pcs)', price: '$4.50 / pc', turnaround: '3–5 Days', description: 'Low 10 pcs minimum with 12-Hr free proofing and Velcro / Iron-on.' },
        { id: 'pkg-patch-2', name: 'Production Batch (100–500 Pcs)', price: '$2.50 / pc', turnaround: '4–7 Days', description: 'Standard run for uniforms and apparel with merrowed borders.' },
        { id: 'pkg-patch-3', name: 'Bulk Wholesale (500+ Pcs)', price: '$1.50 / pc', turnaround: '7–10 Days', description: 'Factory wholesale pricing with priority line and free delivery.' }
      ],
      stats: [
        { value: '10 Pcs', label: 'Low MOQ', icon: 'Star' },
        { value: '12-Hr', label: 'Free Proof', icon: 'Zap' },
        { value: '3-5 Day', label: 'Production', icon: 'Clock' },
        { value: 'Global', label: 'Doorstep Delivery', icon: 'Globe' }
      ],
      primary_cta: 'Order Custom Patches',
      primary_btn_action: '/order',
      secondary_cta: 'Get Free Patch Proof',
      secondary_btn_action: '/custom-patches',
      previewTitle: 'Artwork to Physical Manufactured Patch',
      beforeImg: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=800',
      afterImg: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&q=80&w=800',
      beforeTag: 'Design Artwork',
      afterTag: 'Manufactured Patch'
    }
  };

  const currentContent = showcaseData[activeTab] || showcaseData.all;

  // Real-time DB Slide Override from heroSlides
  const matchedSlide = (heroSlides || []).find(
    s => s.id?.toLowerCase() === activeTab || s.serviceKey?.toLowerCase() === activeTab
  );

  const badge = matchedSlide?.badge || currentContent.badge;
  const title = matchedSlide?.title || currentContent.title;
  const highlight = matchedSlide?.highlight || currentContent.highlight;
  const description = matchedSlide?.description || currentContent.description;

  const rawFeatures = matchedSlide?.features || (matchedSlide?.trust_points?.[0]?.features) || currentContent.features;
  const featuresList = Array.isArray(rawFeatures)
    ? rawFeatures.map(f => typeof f === 'string' ? f : f.text)
    : currentContent.features;

  const rawPackages = matchedSlide?.packages || (matchedSlide?.trust_points?.[0]?.packages) || currentContent.packages;
  const packagesList = Array.isArray(rawPackages) ? rawPackages : (currentContent.packages || []);

  const rawStats = matchedSlide?.stats || (matchedSlide?.trust_points?.[0]?.stats) || currentContent.stats;
  const statsList = Array.isArray(rawStats) ? rawStats : currentContent.stats;

  const primaryCtaText = matchedSlide?.primary_cta || matchedSlide?.primaryCta || currentContent.primary_cta;
  const primaryBtnAction = matchedSlide?.primary_btn_action || matchedSlide?.trust_points?.[0]?.primaryBtnAction || currentContent.primary_btn_action;
  
  const secondaryCtaText = matchedSlide?.secondary_cta || matchedSlide?.secondaryCta || currentContent.secondary_cta;
  const secondaryBtnAction = matchedSlide?.secondary_btn_action || matchedSlide?.trust_points?.[0]?.secondaryBtnAction || currentContent.secondary_btn_action;

  const previewTitle = matchedSlide?.previewTitle || matchedSlide?.trust_points?.[0]?.previewTitle || currentContent.previewTitle;
  const beforeImage = matchedSlide?.beforeImg || matchedSlide?.trust_points?.[0]?.previewBefore || currentContent.beforeImg;
  const afterImage = matchedSlide?.afterImg || matchedSlide?.banner_image || currentContent.afterImg;
  const beforeTag = matchedSlide?.beforeTag || matchedSlide?.trust_points?.[0]?.previewTag || currentContent.beforeTag;
  const afterTag = matchedSlide?.afterTag || matchedSlide?.trust_points?.[0]?.previewTagAfter || currentContent.afterTag;

  const handleTabClick = (tabId) => {
    if (setActiveHomeServiceTab) {
      setActiveHomeServiceTab(tabId);
    }
    setSliderPos(50);
  };

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
      const sType = activeTab === 'patches' ? 'patch' : (activeTab === 'vector-art' ? 'vector' : (activeTab === 'embroidery' ? 'embroidery' : 'all'));
      if (openOrderWizard) openOrderWizard({ type: sType });
      else protectedNavigate('customer', true, { type: sType });
    } else {
      navigate(actionStr);
    }
  };

  const handlePrimaryAction = () => {
    resolveAction(primaryBtnAction, () => {
      const serviceType = activeTab === 'patches' ? 'patch' : (activeTab === 'vector-art' ? 'vector' : (activeTab === 'embroidery' ? 'embroidery' : 'all'));
      if (openOrderWizard) {
        openOrderWizard({ type: serviceType });
      } else {
        protectedNavigate('customer', true, { type: serviceType });
      }
    });
  };

  const handleSecondaryAction = () => {
    resolveAction(secondaryBtnAction, () => {
      if (activeTab === 'embroidery') {
        navigate('/services/embroidery-digitizing');
      } else if (activeTab === 'vector-art') {
        navigate('/services/vector-tracing');
      } else if (activeTab === 'patches') {
        navigate('/custom-patches');
      } else {
        navigate('/pricing');
      }
    });
  };

  const tabs = [
    { id: 'all', label: 'All Services', icon: LayoutGrid },
    { id: 'embroidery', label: 'Embroidery', icon: Layers },
    { id: 'vector-art', label: 'Vector Art', icon: PenTool },
    { id: 'patches', label: 'Patches', icon: Tag }
  ];

  return (
    <section style={{
      background: 'linear-gradient(135deg, var(--navy-950, #0f172a) 0%, var(--navy-900, #0f172a) 60%, #1e1b4b 100%)',
      color: '#ffffff',
      padding: '2.5rem 0 5.5rem',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Ambient Glows */}
      <div style={{
        position: 'absolute',
        top: '-15%',
        left: '-5%',
        width: '700px',
        height: '700px',
        background: 'radial-gradient(circle, rgba(249, 115, 22, 0.15) 0%, transparent 60%)',
        pointerEvents: 'none',
        zIndex: 0
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-15%',
        right: '-5%',
        width: '600px',
        height: '600px',
        background: 'radial-gradient(circle, rgba(99, 102, 241, 0.12) 0%, transparent 60%)',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      <style dangerouslySetInnerHTML={{__html: `
        .blinking-green-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #22c55e;
          box-shadow: 0 0 8px #22c55e;
          display: inline-block;
          animation: blink 1.2s infinite ease-in-out;
        }
        .blinking-red-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #ef4444;
          box-shadow: 0 0 8px #ef4444;
          display: inline-block;
          animation: blink 1.2s infinite ease-in-out 0.6s;
        }
        @keyframes blink {
          0%, 100% { opacity: 1; transform: scale(1.1); }
          50% { opacity: 0.3; transform: scale(0.8); }
        }
        @media (max-width: 1024px) {
          .hero-grid-layout {
            grid-template-columns: 1fr !important;
            gap: 3.5rem !important;
          }
          .hero-left-content {
            text-align: center !important;
          }
          .hero-trust-badges-row {
            justify-content: center !important;
          }
          .hero-cta-buttons-row {
            justify-content: center !important;
          }
        }
      `}} />

      <div className="container" style={{ position: 'relative', zIndex: 1 }}>
        
        {/* Top 4 Navigation Tabs Switcher */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '3rem' }}>
          <div style={{
            display: 'inline-flex',
            background: 'rgba(15, 23, 42, 0.75)',
            border: '1px solid rgba(255, 255, 255, 0.14)',
            padding: '0.35rem',
            borderRadius: '9999px',
            backdropFilter: 'blur(16px)',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4)',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '0.3rem'
          }}>
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleTabClick(tab.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.55rem',
                    padding: '0.65rem 1.65rem',
                    borderRadius: '9999px',
                    border: 'none',
                    background: isSelected 
                      ? 'linear-gradient(135deg, var(--orange-500) 0%, var(--orange-600) 100%)' 
                      : 'transparent',
                    color: isSelected ? '#ffffff' : '#94a3b8',
                    fontWeight: isSelected ? 800 : 600,
                    fontSize: '0.925rem',
                    cursor: 'pointer',
                    transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                    boxShadow: isSelected ? '0 4px 16px rgba(249, 115, 22, 0.45)' : 'none'
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.color = '#ffffff';
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.color = '#94a3b8';
                      e.currentTarget.style.background = 'transparent';
                    }
                  }}
                >
                  <Icon size={16} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2-Column Hero Dynamic Presentation */}
        <div className="hero-grid-layout" style={{
          display: 'grid',
          gridTemplateColumns: '1.12fr 0.88fr',
          gap: '3.5rem',
          alignItems: 'center'
        }}>
          
          {/* Left Column: Dynamic Service Copy, Benefits, Packages & CTAs */}
          <div className="hero-left-content" style={{ textAlign: 'left' }}>
            
            {/* Dynamic Badge */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              background: 'rgba(249, 115, 22, 0.15)',
              border: '1px solid rgba(249, 115, 22, 0.35)',
              color: 'var(--orange-400)',
              padding: '0.35rem 0.95rem',
              borderRadius: '9999px',
              fontSize: '0.825rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: '1.25rem'
            }}>
              <Sparkles size={14} />
              {badge}
            </div>

            {/* Dynamic Main Title */}
            <h1 style={{
              fontSize: 'clamp(2.15rem, 3.8vw, 3.25rem)',
              fontWeight: 900,
              lineHeight: 1.14,
              color: '#ffffff',
              marginBottom: '1rem',
              letterSpacing: '-0.025em',
              fontFamily: 'var(--font-heading)'
            }}>
              {title}
            </h1>

            {/* Dynamic Highlight / Subheading */}
            <div style={{
              fontSize: 'clamp(1.05rem, 1.6vw, 1.2rem)',
              fontWeight: 700,
              color: 'var(--orange-400)',
              marginBottom: '1.15rem',
              lineHeight: 1.4
            }}>
              {highlight}
            </div>

            {/* Dynamic Description */}
            <p style={{
              fontSize: '1.05rem',
              lineHeight: 1.65,
              color: '#94a3b8',
              marginBottom: '1.75rem',
              maxWidth: '640px'
            }}>
              {description}
            </p>

            {/* Dynamic Service Packages Mini-Cards */}
            {packagesList && packagesList.length > 0 && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '0.85rem',
                marginBottom: '1.75rem'
              }}>
                {packagesList.map((pkg, idx) => (
                  <div 
                    key={pkg.id || idx}
                    style={{
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '12px',
                      padding: '0.85rem 1rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.25rem'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.825rem', fontWeight: 800, color: '#f1f5f9' }}>{pkg.name}</span>
                      <span style={{ fontSize: '0.9rem', fontWeight: 900, color: 'var(--orange-400)' }}>{pkg.price}</span>
                    </div>
                    {pkg.turnaround && (
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Clock size={12} style={{ color: 'var(--orange-500)' }} /> {pkg.turnaround}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Service Features Checkmarks List */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
              marginBottom: '2.25rem',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              padding: '1.15rem 1.35rem',
              borderRadius: '14px'
            }}>
              {featuresList.map((featText, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem', fontSize: '0.925rem', color: '#e2e8f0', fontWeight: 600 }}>
                  <CheckCircle2 size={17} style={{ color: 'var(--orange-400)', flexShrink: 0, marginTop: '2px' }} />
                  <span style={{ lineHeight: 1.45 }}>{featText}</span>
                </div>
              ))}
            </div>

            {/* Trust Metrics Row */}
            <div className="hero-trust-badges-row" style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '1.5rem',
              marginBottom: '2.5rem'
            }}>
              {statsList.map((stat, i) => {
                const IconComp = ICON_MAP[stat.icon] || Star;
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <IconComp size={18} style={{ color: 'var(--orange-500)' }} />
                    <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#e2e8f0' }}>
                      <strong style={{ color: 'var(--orange-400)', marginRight: '4px' }}>{stat.value}</strong>
                      {stat.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* CTA Buttons Group */}
            <div className="hero-cta-buttons-row" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
              <button 
                type="button"
                className="btn btn-primary-orange btn-lg"
                onClick={handlePrimaryAction}
                style={{ 
                  padding: '0.95rem 2.25rem',
                  fontSize: '1.05rem',
                  fontWeight: 800
                }}
              >
                <Upload size={18} />
                {primaryCtaText}
                <ArrowRight size={18} />
              </button>

              <button 
                type="button"
                className="btn btn-outline btn-lg"
                onClick={handleSecondaryAction}
                style={{ 
                  color: '#ffffff', 
                  borderColor: 'rgba(255, 255, 255, 0.25)',
                  padding: '0.95rem 2rem', 
                  fontSize: '1.05rem',
                  fontWeight: 700
                }}
              >
                {secondaryCtaText}
              </button>
            </div>

          </div>

          {/* Right Column: Interactive Before/After Showcase Box */}
          <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
            <div style={{
              background: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '20px',
              padding: '1.25rem',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
              width: '100%',
              maxWidth: '650px',
              backdropFilter: 'blur(16px)'
            }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--orange-400)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.4rem', letterSpacing: '0.06em' }}>
                    <span className="blinking-green-dot" /> SHOWCASE
                  </div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#ffffff', marginTop: '2px' }}>
                    {previewTitle}
                  </div>
                </div>
              </div>

              {/* Interactive Comparison Slider */}
              <div 
                style={{
                  position: 'relative',
                  width: '100%',
                  aspectRatio: '16/10',
                  borderRadius: '14px',
                  overflow: 'hidden',
                  cursor: 'ew-resize',
                  userSelect: 'none',
                  background: '#090d16'
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
                {/* After Finished Image */}
                <img 
                  src={afterImage} 
                  alt="After" 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                  draggable="false" 
                />
                
                {/* Before Image with ClipPath */}
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
                    src={beforeImage} 
                    alt="Before" 
                    style={{ 
                      width: '100%', 
                      height: '100%', 
                      objectFit: 'cover',
                      filter: beforeImage === afterImage ? 'grayscale(100%) blur(4px) contrast(1.2)' : 'none'
                    }} 
                    draggable="false" 
                  />
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    bottom: 0,
                    right: 0,
                    width: '2px',
                    background: 'rgba(255, 255, 255, 0.9)'
                  }} />
                </div>

                {/* Handle Divider */}
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: `${sliderPos}%`,
                  width: '4px',
                  background: 'var(--orange-500)',
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
                    background: 'var(--orange-500)',
                    color: '#ffffff',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 14px rgba(0, 0, 0, 0.5)',
                    border: '3px solid #ffffff'
                  }}>
                    <MoveHorizontal size={18} />
                  </div>
                </div>

                {/* Before Label Badge */}
                <span style={{
                  position: 'absolute',
                  bottom: '14px',
                  left: '14px',
                  background: 'rgba(15, 23, 42, 0.88)',
                  backdropFilter: 'blur(6px)',
                  color: '#ffffff',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  padding: '0.35rem 0.75rem',
                  borderRadius: '6px',
                  letterSpacing: '0.04em',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  border: '1px solid rgba(239, 68, 68, 0.4)'
                }}>
                  <span className="blinking-red-dot" />
                  <span>{beforeTag}</span>
                </span>

                {/* After Label Badge */}
                <span style={{
                  position: 'absolute',
                  bottom: '14px',
                  right: '14px',
                  background: 'var(--orange-500)',
                  color: '#ffffff',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  padding: '0.35rem 0.75rem',
                  borderRadius: '6px',
                  letterSpacing: '0.04em',
                  boxShadow: '0 4px 12px rgba(249, 115, 22, 0.4)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}>
                  <span className="blinking-green-dot" />
                  <span>{afterTag}</span>
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
