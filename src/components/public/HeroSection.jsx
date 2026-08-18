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
  Globe,
  Clock,
  ShieldCheck,
  LayoutGrid,
  Sparkles,
  Zap,
  ChevronLeft,
  ChevronRight
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

const DEFAULT_SERVICE_DATA = {
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
    slideshow_interval: 5,
    showcase_images: [
      {
        id: 'all-1',
        title: 'Commercial Embroidery Digitizing',
        image_url: 'https://qkgvgrscjlijajuzouke.supabase.co/storage/v1/object/public/portfolio-images/showcase-gallery/c41fb095-1b51-45b2-8990-30c9232002d8.png',
        display_order: 1,
        is_active: true
      },
      {
        id: 'all-2',
        title: 'Precision Embroidery Sew-Out',
        image_url: 'https://qkgvgrscjlijajuzouke.supabase.co/storage/v1/object/public/portfolio-images/showcase-gallery/9b99906f-75cc-4697-9e82-4cecf6e9de08.JPG',
        display_order: 2,
        is_active: true
      },
      {
        id: 'all-3',
        title: 'High-Density Custom Embroidery',
        image_url: 'https://qkgvgrscjlijajuzouke.supabase.co/storage/v1/object/public/portfolio-images/showcase-gallery/b8cb84c5-9241-4ce8-8a78-48a6ddf86e9a.JPG',
        display_order: 3,
        is_active: true
      }
    ]
  },
  embroidery: {
    badge: 'Factory-Grade Machine Digitizing',
    title: 'Commercial Embroidery Digitizing Services',
    highlight: 'Zero Thread Breaks. Calculated Pull Compensation. Press Ready.',
    description: 'Engineered by master digitizers with 15+ years factory experience. Hand-mapped stitch pathing for caps, left chest polos, 3D puff foam, and jacket backs with free unlimited revisions.',
    features: [
      '100% Manual Digitizing (Zero Auto-Trace Shortcuts)',
      'All Machine Formats: Tajima (.DST), Wilcom (.EMB), Brother (.PES)',
      'Guaranteed Zero Thread Breaks & Free Unlimited Production Edits'
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
    slideshow_interval: 5,
    showcase_images: [
      {
        id: 'emb-1',
        title: 'Commercial Embroidery Digitizing',
        image_url: 'https://qkgvgrscjlijajuzouke.supabase.co/storage/v1/object/public/portfolio-images/showcase-gallery/e82803b4-1dca-4138-bc49-892f57095c9a.PNG',
        display_order: 1,
        is_active: true
      },
      {
        id: 'emb-2',
        title: 'Precision Embroidery Sew-Out',
        image_url: 'https://qkgvgrscjlijajuzouke.supabase.co/storage/v1/object/public/portfolio-images/showcase-gallery/f36e7a8e-db0c-4f49-a2c8-e53dca578c0a.PNG',
        display_order: 2,
        is_active: true
      }
    ]
  },
  'vector-art': {
    badge: 'Resolution-Independent Vector Tracing',
    title: 'Raster to Scalable Vector Art Conversion',
    highlight: 'Hand-Drawn Bézier Curves. Pantone Color Separation. Press Ready.',
    description: 'Convert blurry low-res JPGs, PNGs, and sketches into razor-sharp vector graphics with clean anchor nodes, exact Pantone (PMS) matching, and separated layers for screen printing and vinyl cutting.',
    features: [
      '100% Hand-Crafted Smooth Node Paths (Zero Overlapping Lines)',
      'Pantone Solid Coated Spot Color Separation Included',
      'Master Source Suite: .AI, .EPS, .SVG & High-Res 300+ DPI PDF'
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
    slideshow_interval: 5,
    showcase_images: [
      {
        id: 'vec-1',
        title: 'Blurry Raster to Clean Scalable Vector',
        image_url: 'https://qkgvgrscjlijajuzouke.supabase.co/storage/v1/object/public/portfolio-images/showcase-gallery/86f3f965-f16c-4c22-8ef7-4f2acf3f0086.PNG',
        display_order: 1,
        is_active: true
      },
      {
        id: 'vec-2',
        title: 'Precision Vector Paths',
        image_url: 'https://qkgvgrscjlijajuzouke.supabase.co/storage/v1/object/public/portfolio-images/showcase-gallery/dcd10b4e-b7fc-41f7-8736-05c5364ae665.JPG',
        display_order: 2,
        is_active: true
      }
    ]
  },
  patches: {
    badge: 'Custom Manufactured Emblems',
    title: 'Premium Physical Custom Patches',
    highlight: 'Embroidered, Woven & 3D Molded PVC. Doorstep Delivery.',
    description: 'Custom manufactured physical patches for uniforms, tactical gear, hats, and apparel brands. Available with Velcro hook & loop, iron-on, or adhesive backings with free digital proofs before production.',
    features: [
      'Custom Embroidered, High-Density Woven & 3D Rubber PVC',
      'Military-Grade Velcro, Heat-Seal Iron-On & Peel Backings',
      'Free 12-Hour Digital Proof & Doorstep Worldwide Shipping'
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
    slideshow_interval: 5,
    showcase_images: [
      {
        id: 'pat-1',
        title: 'Manufactured Custom Patches',
        image_url: 'https://qkgvgrscjlijajuzouke.supabase.co/storage/v1/object/public/portfolio-images/showcase-gallery/b8cb84c5-9241-4ce8-8a78-48a6ddf86e9a.JPG',
        display_order: 1,
        is_active: true
      },
      {
        id: 'pat-2',
        title: 'High-Density Uniform Emblem',
        image_url: 'https://qkgvgrscjlijajuzouke.supabase.co/storage/v1/object/public/portfolio-images/showcase-gallery/c41fb095-1b51-45b2-8990-30c9232002d8.png',
        display_order: 2,
        is_active: true
      }
    ]
  }
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

  const [currentSlideIdx, setCurrentSlideIdx] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isFading, setIsFading] = useState(false);

  const activeTab = normalizeCategory(activeHomeServiceTab || 'all');
  const defaultContent = DEFAULT_SERVICE_DATA[activeTab] || DEFAULT_SERVICE_DATA.all;

  // Real-time DB Slide Override from heroSlides
  const matchedSlide = (heroSlides || []).find(
    s => s.id?.toLowerCase() === activeTab || s.serviceKey?.toLowerCase() === activeTab
  );

  const badge = matchedSlide?.badge || defaultContent.badge;
  const title = matchedSlide?.title || defaultContent.title;
  const highlight = matchedSlide?.highlight || defaultContent.highlight;
  const description = matchedSlide?.description || defaultContent.description;

  const rawFeatures = matchedSlide?.features || (matchedSlide?.trust_points?.[0]?.features) || defaultContent.features;
  const featuresList = Array.isArray(rawFeatures)
    ? rawFeatures.map(f => typeof f === 'string' ? f : f.text)
    : defaultContent.features;

  const rawStats = matchedSlide?.stats || (matchedSlide?.trust_points?.[0]?.stats) || defaultContent.stats;
  const statsList = Array.isArray(rawStats) ? rawStats : defaultContent.stats;

  const primaryCtaText = matchedSlide?.primary_cta || matchedSlide?.primaryCta || defaultContent.primary_cta;
  const primaryBtnAction = matchedSlide?.primary_btn_action || matchedSlide?.trust_points?.[0]?.primaryBtnAction || defaultContent.primary_btn_action;
  
  const secondaryCtaText = matchedSlide?.secondary_cta || matchedSlide?.secondaryCta || defaultContent.secondary_cta;
  const secondaryBtnAction = matchedSlide?.secondary_btn_action || matchedSlide?.trust_points?.[0]?.secondaryBtnAction || defaultContent.secondary_btn_action;

  const previewTitle = matchedSlide?.previewTitle || matchedSlide?.trust_points?.[0]?.previewTitle || defaultContent.previewTitle;
  const slideshowIntervalSec = Number(matchedSlide?.slideshow_interval || matchedSlide?.trust_points?.[0]?.slideshow_interval) || defaultContent.slideshow_interval || 5;

  // Multi-image collection parsing (Only uses uploaded images from admin portal / DB)
  const activeShowcaseImages = React.useMemo(() => {
    let images = matchedSlide?.showcase_images || matchedSlide?.showcaseImages || matchedSlide?.trust_points?.[0]?.showcase_images || [];
    
    if (Array.isArray(images) && images.length > 0) {
      const activeList = images
        .filter(img => img.is_active !== false && (img.image_url || img.after_image_url || img.afterImg || img.before_image_url || img.beforeImg))
        .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
      if (activeList.length > 0) {
        return activeList.map((img, i) => ({
          id: img.id || `img-${i}`,
          title: img.title || `Showcase Image #${i + 1}`,
          imageUrl: img.image_url || img.after_image_url || img.afterImg || img.before_image_url || img.beforeImg || ''
        }));
      }
    }

    // Fallback to all-services uploaded gallery if specific tab is empty
    const allSlide = (heroSlides || []).find(s => s.id?.toLowerCase() === 'all' || s.serviceKey?.toLowerCase() === 'all');
    let allImages = allSlide?.showcase_images || allSlide?.showcaseImages || allSlide?.trust_points?.[0]?.showcase_images || [];
    if (Array.isArray(allImages) && allImages.length > 0) {
      const activeAll = allImages
        .filter(img => img.is_active !== false && (img.image_url || img.after_image_url || img.afterImg))
        .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
      if (activeAll.length > 0) {
        return activeAll.map((img, i) => ({
          id: img.id || `all-img-${i}`,
          title: img.title || `Showcase Image #${i + 1}`,
          imageUrl: img.image_url || img.after_image_url || img.afterImg || ''
        }));
      }
    }

    // Fallback: check legacy single image in matchedSlide if not an unsplash url
    const legacyImg = matchedSlide?.banner_image || matchedSlide?.afterImg;
    if (legacyImg && !legacyImg.includes('unsplash.com')) {
      return [{
        id: `${activeTab}-img-1`,
        title: previewTitle,
        imageUrl: legacyImg
      }];
    }

    // Default curated real storage collection
    return (defaultContent.showcase_images || []).map((img, i) => ({
      id: img.id || `default-${i}`,
      title: img.title,
      imageUrl: img.image_url
    }));
  }, [matchedSlide, heroSlides, defaultContent, activeTab, previewTitle]);

  // Reset slide index when activeTab changes
  useEffect(() => {
    setCurrentSlideIdx(0);
  }, [activeTab]);

  // Automatic slideshow timer: changes image smoothly every 5 seconds
  useEffect(() => {
    if (activeShowcaseImages.length <= 1) return; // No slideshow if only 1 image
    if (isHovered) return; // Pause on interaction

    const timer = setInterval(() => {
      setIsFading(true);
      setTimeout(() => {
        setCurrentSlideIdx(prev => (prev + 1) % activeShowcaseImages.length);
        setIsFading(false);
      }, 250);
    }, slideshowIntervalSec * 1000);

    return () => clearInterval(timer);
  }, [isHovered, activeShowcaseImages.length, slideshowIntervalSec]);

  const currentImage = activeShowcaseImages[currentSlideIdx] || activeShowcaseImages[0];
  const hasMultipleImages = activeShowcaseImages.length > 1;

  const handleTabClick = (tabId) => {
    if (setActiveHomeServiceTab) {
      setActiveHomeServiceTab(tabId);
    }
  };

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
      setCurrentSlideIdx(prev => (prev === 0 ? activeShowcaseImages.length - 1 : prev - 1));
      setIsFading(false);
    }, 200);
  };

  const handleNext = () => {
    setIsFading(true);
    setTimeout(() => {
      setCurrentSlideIdx(prev => (prev + 1) % activeShowcaseImages.length);
      setIsFading(false);
    }, 200);
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
      padding: '2rem 0 3.25rem',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Ambient Glows */}
      <div style={{
        position: 'absolute',
        top: '-15%',
        left: '-5%',
        width: '600px',
        height: '600px',
        background: 'radial-gradient(circle, rgba(249, 115, 22, 0.12) 0%, transparent 60%)',
        pointerEvents: 'none',
        zIndex: 0
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-15%',
        right: '-5%',
        width: '550px',
        height: '550px',
        background: 'radial-gradient(circle, rgba(99, 102, 241, 0.1) 0%, transparent 60%)',
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
          animation: blink 1.4s infinite ease-in-out;
        }
        @keyframes blink {
          0%, 100% { opacity: 1; transform: scale(1.1); }
          50% { opacity: 0.35; transform: scale(0.85); }
        }
        .hero-cta-buttons-row {
          display: flex;
          flex-direction: row;
          align-items: center;
          gap: 0.85rem;
        }
        @media (max-width: 1024px) {
          .hero-grid-layout {
            grid-template-columns: 1fr !important;
            gap: 2.25rem !important;
            width: 100% !important;
            max-width: 100% !important;
          }
          .hero-left-content {
            text-align: center !important;
            width: 100% !important;
            max-width: 100% !important;
          }
          .hero-trust-badges-row {
            justify-content: center !important;
          }
          .hero-cta-buttons-row {
            justify-content: center !important;
          }
        }
        @media (max-width: 768px) {
          .hero-nav-tabs-wrapper {
            border-radius: 14px !important;
            padding: 0.35rem !important;
            gap: 0.35rem !important;
            width: 100% !important;
            max-width: 100% !important;
          }
          .hero-nav-tab-btn {
            padding: 0.45rem 0.75rem !important;
            font-size: 0.8rem !important;
            flex: 1 1 calc(50% - 0.4rem) !important;
            justify-content: center !important;
          }
          .hero-cta-buttons-row {
            flex-direction: column !important;
            width: 100% !important;
            gap: 0.75rem !important;
          }
          .hero-cta-buttons-row button {
            width: 100% !important;
            justify-content: center !important;
            white-space: normal !important;
            min-height: 48px !important;
          }
          .hero-trust-badges-row {
            display: grid !important;
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 0.75rem 0.5rem !important;
            width: 100% !important;
            justify-items: center !important;
          }
          .hero-trust-badges-row > div {
            justify-content: center !important;
            font-size: 0.78rem !important;
          }
          .hero-showcase-card {
            padding: 0.85rem !important;
            border-radius: 18px !important;
            width: 100% !important;
            max-width: 100% !important;
          }
          .hero-showcase-image-box {
            min-height: 180px !important;
            max-height: 300px !important;
            aspect-ratio: 16/10 !important;
          }
        }
      `}} />

      <div className="container" style={{ position: 'relative', zIndex: 1, maxWidth: '1360px', width: '100%', boxSizing: 'border-box' }}>
        
        {/* Top 4 Navigation Tabs Switcher */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2rem', width: '100%' }}>
          <div 
            className="hero-nav-tabs-wrapper"
            style={{
              display: 'inline-flex',
              background: 'rgba(15, 23, 42, 0.75)',
              border: '1px solid rgba(255, 255, 255, 0.14)',
              padding: '0.3rem',
              borderRadius: '9999px',
              backdropFilter: 'blur(16px)',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35)',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: '0.25rem',
              maxWidth: '100%',
              boxSizing: 'border-box'
            }}
          >
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  className="hero-nav-tab-btn"
                  onClick={() => handleTabClick(tab.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.55rem 1.35rem',
                    borderRadius: '9999px',
                    border: 'none',
                    background: isSelected 
                      ? 'linear-gradient(135deg, var(--orange-500) 0%, var(--orange-600) 100%)' 
                      : 'transparent',
                    color: isSelected ? '#ffffff' : '#94a3b8',
                    fontWeight: isSelected ? 800 : 600,
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                    boxShadow: isSelected ? '0 4px 14px rgba(249, 115, 22, 0.4)' : 'none'
                  }}
                >
                  <Icon size={15} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2-Column Hero Dynamic Presentation (Balanced 50/50 Grid - Aligned to Top) */}
        <div className="hero-grid-layout" style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '2.5rem',
          alignItems: 'flex-start',
          width: '100%',
          boxSizing: 'border-box'
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
              padding: '0.3rem 0.85rem',
              borderRadius: '9999px',
              fontSize: '0.8rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: '0.85rem'
            }}>
              <Sparkles size={13} />
              {badge}
            </div>

            {/* Dynamic Main Title */}
            <h1 style={{
              fontSize: 'clamp(1.65rem, 5vw, 2.75rem)',
              fontWeight: 900,
              lineHeight: 1.15,
              color: '#ffffff',
              marginBottom: '0.75rem',
              letterSpacing: '-0.025em',
              fontFamily: 'var(--font-heading)',
              wordBreak: 'break-word',
              overflowWrap: 'break-word'
            }}>
              {title}
            </h1>

            {/* Dynamic Highlight / Subheading */}
            <div style={{
              fontSize: 'clamp(0.88rem, 2.8vw, 1.1rem)',
              fontWeight: 700,
              color: 'var(--orange-400)',
              marginBottom: '0.75rem',
              lineHeight: 1.35,
              wordBreak: 'break-word',
              overflowWrap: 'break-word'
            }}>
              {highlight}
            </div>

            {/* Dynamic Description */}
            <p style={{
              fontSize: 'clamp(0.85rem, 2.6vw, 0.975rem)',
              lineHeight: 1.55,
              color: '#94a3b8',
              marginBottom: '1.25rem',
              maxWidth: '100%',
              wordBreak: 'break-word',
              overflowWrap: 'break-word'
            }}>
              {description}
            </p>

            {/* Service Features Checkmarks List */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              marginBottom: '1.5rem',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              padding: 'clamp(0.75rem, 2vw, 1rem) clamp(0.85rem, 2vw, 1.15rem)',
              borderRadius: '12px',
              textAlign: 'left',
              width: '100%',
              boxSizing: 'border-box'
            }}>
              {featuresList.slice(0, 3).map((featText, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.55rem', fontSize: '0.85rem', color: '#e2e8f0', fontWeight: 600, wordBreak: 'break-word' }}>
                  <CheckCircle2 size={15} style={{ color: 'var(--orange-400)', flexShrink: 0, marginTop: '2px' }} />
                  <span style={{ lineHeight: 1.4 }}>{featText}</span>
                </div>
              ))}
            </div>

            {/* CTA Buttons Group (Always Side-by-Side on Desktop/Tablet) */}
            <div className="hero-cta-buttons-row" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.85rem',
              marginBottom: '1.5rem'
            }}>
              <button 
                type="button"
                className="btn btn-primary-orange btn-lg"
                onClick={handlePrimaryAction}
                style={{ 
                  padding: '0.85rem 1.6rem',
                  fontSize: '0.95rem',
                  fontWeight: 800,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem'
                }}
              >
                <Upload size={16} />
                <span>{primaryCtaText}</span>
                <ArrowRight size={16} />
              </button>

              <button 
                type="button"
                className="btn btn-outline btn-lg"
                onClick={handleSecondaryAction}
                style={{ 
                  color: '#ffffff', 
                  borderColor: 'rgba(255, 255, 255, 0.25)',
                  padding: '0.85rem 1.4rem', 
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <span>{secondaryCtaText}</span>
              </button>
            </div>

            {/* Trust Metrics Row */}
            <div className="hero-trust-badges-row" style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '1.25rem'
            }}>
              {statsList.map((stat, i) => {
                const IconComp = ICON_MAP[stat.icon] || Star;
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <IconComp size={16} style={{ color: 'var(--orange-500)', flexShrink: 0 }} />
                    <span style={{ fontSize: '0.825rem', fontWeight: 600, color: '#e2e8f0', whiteSpace: 'nowrap' }}>
                      <strong style={{ color: 'var(--orange-400)', marginRight: '3px' }}>{stat.value}</strong>
                      {stat.label}
                    </span>
                  </div>
                );
              })}
            </div>

          </div>

          {/* Right Column: Clean, Full Showcase Image Card (Auto-rotates every 5s) */}
          <div 
            style={{ width: '100%', display: 'flex', justifyContent: 'center' }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <div 
              className="hero-showcase-card"
              style={{
                background: 'rgba(15, 23, 42, 0.75)',
                border: '1.5px solid rgba(255, 255, 255, 0.14)',
                borderRadius: '24px',
                padding: '1.35rem',
                boxShadow: '0 20px 50px -10px rgba(0, 0, 0, 0.7)',
                width: '100%',
                maxWidth: '680px',
                backdropFilter: 'blur(16px)',
                position: 'relative',
                boxSizing: 'border-box'
              }}
            >
              
              {/* Header Title & Slide Index Counter */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem', gap: '0.5rem' }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--orange-400)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.4rem', letterSpacing: '0.06em' }}>
                    <span className="blinking-green-dot" /> LIVE SHOWCASE
                  </div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#ffffff', marginTop: '1px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {(currentImage?.title || previewTitle || '').replace(/Emrboidery/gi, 'Embroidery')}
                  </div>
                </div>

                {hasMultipleImages && (
                  <span style={{
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    padding: '0.2rem 0.55rem',
                    borderRadius: '9999px',
                    color: '#cbd5e1',
                    flexShrink: 0
                  }}>
                    {currentSlideIdx + 1} / {activeShowcaseImages.length}
                  </span>
                )}
              </div>

              {/* Full, Clear Showcase Image Container (Auto-changes every 5s - Auto-Adjusted Full Image) */}
              <div 
                className="hero-showcase-image-box"
                style={{
                  position: 'relative',
                  width: '100%',
                  aspectRatio: '16/10',
                  minHeight: '220px',
                  maxHeight: '430px',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  background: 'radial-gradient(circle at center, #1e293b 0%, #090d16 100%)',
                  opacity: isFading ? 0.35 : 1,
                  transition: 'opacity 0.25s ease-in-out',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {/* Full, Auto-Adjusted Showcase Image (Never cut off or incomplete) */}
                <img 
                  src={currentImage?.imageUrl} 
                  alt={currentImage?.title || "Studio Showcase"} 
                  style={{ 
                    maxWidth: '100%', 
                    maxHeight: '100%', 
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    objectPosition: 'center',
                    display: 'block'
                  }} 
                  draggable="false" 
                />

                {/* Subtle Previous/Next Arrow Controls (if multiple images) */}
                {hasMultipleImages && (
                  <>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handlePrev(); }}
                      style={{
                        position: 'absolute',
                        left: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'rgba(15, 23, 42, 0.8)',
                        border: '1px solid rgba(255, 255, 255, 0.25)',
                        borderRadius: '50%',
                        width: '34px',
                        height: '34px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        color: '#ffffff',
                        backdropFilter: 'blur(6px)',
                        zIndex: 10,
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--orange-500)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(15, 23, 42, 0.8)'}
                      title="Previous Showcase Image"
                    >
                      <ChevronLeft size={18} />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleNext(); }}
                      style={{
                        position: 'absolute',
                        right: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'rgba(15, 23, 42, 0.8)',
                        border: '1px solid rgba(255, 255, 255, 0.25)',
                        borderRadius: '50%',
                        width: '34px',
                        height: '34px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        color: '#ffffff',
                        backdropFilter: 'blur(6px)',
                        zIndex: 10,
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--orange-500)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(15, 23, 42, 0.8)'}
                      title="Next Showcase Image"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </>
                )}
              </div>

              {/* Bottom Pagination Dots with Brand Orange Active Bar (if multiple images) */}
              {hasMultipleImages && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '0.45rem',
                  marginTop: '0.9rem'
                }}>
                  {activeShowcaseImages.map((imgItem, idx) => {
                    const isActive = idx === currentSlideIdx;
                    return (
                      <button
                        key={imgItem.id || idx}
                        type="button"
                        onClick={() => handleDotClick(idx)}
                        style={{
                          height: '6px',
                          width: isActive ? '22px' : '6px',
                          borderRadius: '9999px',
                          border: 'none',
                          background: isActive ? 'var(--orange-500, #ea580c)' : 'rgba(255, 255, 255, 0.25)',
                          cursor: 'pointer',
                          transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                          padding: 0,
                          boxShadow: isActive ? '0 0 8px rgba(234, 88, 12, 0.6)' : 'none'
                        }}
                        title={`Slide ${idx + 1}: ${imgItem.title}`}
                      />
                    );
                  })}
                </div>
              )}

            </div>
          </div>

        </div>

      </div>
    </section>
  );
};

export default HeroSection;
