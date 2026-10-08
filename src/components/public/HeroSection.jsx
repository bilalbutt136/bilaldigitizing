'use client';

import React, { useState, useEffect } from 'react';
import { useNavigate } from '../../utils/navigation';
import { useAppState } from '../../context/StateContext';
import { normalizeCategory } from '../../utils/categoryUtils';
import { supabase as _supabase } from '../../lib/supabase/client';
import { getOptimizedImageUrl } from '../../utils/imageOptimizer';
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
  ChevronRight,
  ZoomIn,
  X
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
    badge: 'Commercial Embroidery Digitizing Studio',
    title: 'Professional Embroidery Digitizing for Commercial Shops',
    highlight: 'Production-Ready DST, PES & EMB Files · Fast Turnaround · Free Revisions',
    description: 'Manual embroidery digitizing built for decorators, embroidery shops, uniform suppliers, and apparel production teams. Vector art conversion and custom patch manufacturing are also available from the same studio.',
    features: [
      'Embroidery Digitizing: Starts $10 · Manual Pathing · Fabric-Specific Optimization',
      'Vector Art Redraw: Starts $15.00 Flat · Pantone Spot Colors · Master AI/EPS/SVG',
      'Custom Physical Patches: 50-Piece Minimum · Digital Proof · Worldwide Shipping'
    ],
    stats: [
      { value: '4–12h', label: 'Typical Embroidery', icon: 'Clock' },
      { value: '100%', label: 'Manual Pathing', icon: 'Zap' },
      { value: 'All Formats', label: 'DST, PES, EMB & AI', icon: 'Layers' },
      { value: 'Free', label: 'Minor Revisions', icon: 'ShieldCheck' }
    ],
    primary_cta: 'Upload Artwork & Start Order',
    primary_btn_action: '/order',
    secondary_cta: 'View Pricing',
    secondary_btn_action: '/pricing',
    previewTitle: 'Live Studio Production Showcase',
    slideshow_interval: 5
  },
  embroidery: {
    badge: 'Factory-Grade Machine Digitizing',
    title: 'Commercial Embroidery Digitizing Services',
    highlight: 'Clean Commercial Sew-Outs. Calculated Pull Compensation. Production Ready.',
    description: 'Engineered by master digitizers with 11+ years factory experience. Hand-mapped stitch pathing for caps, left chest polos, 3D puff foam, and jacket backs with free unlimited revisions.',
    features: [
      '100% Manual Digitizing (Zero Auto-Trace Shortcuts)',
      'All Machine Formats: Tajima (.DST), Wilcom (.EMB), Brother (.PES)',
      'Optimized Stitch Pathing & Free Production Revisions'
    ],
    stats: [
      { value: '100%', label: 'Manual Digitizing', icon: 'Star' },
      { value: 'Clean', label: 'Sew-Out Pathing', icon: 'Zap' },
      { value: '4–12 Hr', label: 'Delivery', icon: 'Clock' },
      { value: 'Wilcom & Tajima', label: 'Industry Standard', icon: 'ShieldCheck' }
    ],
    primary_cta: 'Order Embroidery Digitizing',
    primary_btn_action: '/order',
    secondary_cta: 'View Embroidery Packages',
    secondary_btn_action: '/services/embroidery-digitizing',
    previewTitle: 'Embroidery Digitizing & Sew-Out Showcase',
    slideshow_interval: 5
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
      { value: 'Pantone', label: 'Spot Separation', icon: 'Star' },
      { value: 'Sharp', label: 'Cut Paths', icon: 'Zap' },
      { value: '6–12 Hr', label: 'Delivery', icon: 'Clock' },
      { value: 'Master Suite', label: 'AI, EPS, SVG & PDF', icon: 'ShieldCheck' }
    ],
    primary_cta: 'Order Vector Art Conversion',
    primary_btn_action: '/order',
    secondary_cta: 'View Vector Packages',
    secondary_btn_action: '/services/vector-tracing',
    previewTitle: 'Scalable Vector Redraw Showcase',
    slideshow_interval: 5
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
      { value: '50+ Pcs', label: 'Minimum Order', icon: 'Star' },
      { value: '12-Hr', label: 'Free Digital Proof', icon: 'Zap' },
      { value: 'Velcro & Iron-On', label: 'Backing Options', icon: 'ShieldCheck' },
      { value: 'Worldwide', label: 'Doorstep Shipping', icon: 'Globe' }
    ],
    primary_cta: 'Order Custom Patches',
    primary_btn_action: '/order',
    secondary_cta: 'Get Free Patch Proof',
    secondary_btn_action: '/custom-patches',
    previewTitle: 'Physical Custom Patches Showcase',
    slideshow_interval: 5
  }
};

export const HeroSection = () => {
  const navigate = useNavigate();
  const {
    protectedNavigate,
    openOrderWizard,
    activeHomeServiceTab = 'all',
    setActiveHomeServiceTab,
    heroSlides = [],
    portfolioSamples = []
  } = useAppState();

  const [currentSlideIdx, setCurrentSlideIdx] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isFading, setIsFading] = useState(false);
  const [lightboxSample, setLightboxSample] = useState(null);

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

  // Dynamic Live Showcase items strictly from the live database
  const activeShowcaseImages = React.useMemo(() => {
    const portfolioSource = portfolioSamples;

    // 1. Filter live database portfolio items by active tab category
    const categoryMatches = (portfolioSource || []).filter(item => {
      if (item.is_active === false) return false;
      const img = item.digitized_image || item.digitizedImage || item.afterImg || item.after_img || item.image || item.original_image;
      if (!img) return false;

      const cat = (item.category || '').toLowerCase();
      if (activeTab === 'all') return true;
      if (activeTab === 'embroidery') return cat.includes('embroid') || cat === 'general';
      if (activeTab === 'vector-art') return cat.includes('vector');
      if (activeTab === 'patches') return cat.includes('patch');
      return true;
    });

    if (categoryMatches.length > 0) {
      return categoryMatches.map((item, idx) => ({
        id: item.id || `live-port-${idx}`,
        title: item.title || 'Studio Production Sew-Out',
        imageUrl: item.digitized_image || item.digitizedImage || item.afterImg || item.after_img || item.image || item.original_image,
        category: item.category || 'Embroidery',
        stitchCount: item.stitch_count || item.stitchCount || '',
        formats: item.formats || ''
      }));
    }

    // 2. Custom showcase images uploaded via CMS if configured
    let customSlideImages = matchedSlide?.showcase_images || matchedSlide?.showcaseImages || matchedSlide?.trust_points?.[0]?.showcase_images || [];
    if (Array.isArray(customSlideImages) && customSlideImages.length > 0) {
      const activeCustom = customSlideImages
        .filter(img => img.is_active !== false && (img.image_url || img.after_image_url || img.afterImg))
        .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
      if (activeCustom.length > 0) {
        return activeCustom.map((img, i) => ({
          id: img.id || `custom-${i}`,
          title: img.title || `Showcase Design #${i + 1}`,
          imageUrl: img.image_url || img.after_image_url || img.afterImg || '',
          category: activeTab,
          stitchCount: '',
          formats: ''
        }));
      }
    }

    // 3. Fallback to any active portfolio items in database
    const anyActiveItems = (portfolioSource || []).filter(item => {
      if (item.is_active === false) return false;
      const img = item.digitized_image || item.digitizedImage || item.afterImg || item.after_img || item.image || item.original_image;
      return Boolean(img);
    });

    if (anyActiveItems.length > 0) {
      return anyActiveItems.map((item, idx) => ({
        id: item.id || `live-port-all-${idx}`,
        title: item.title || 'Studio Production Sew-Out',
        imageUrl: item.digitized_image || item.digitizedImage || item.afterImg || item.after_img || item.image || item.original_image,
        category: item.category || 'Embroidery',
        stitchCount: item.stitch_count || item.stitchCount || '',
        formats: item.formats || ''
      }));
    }

    return [];
  }, [portfolioSamples, activeTab, matchedSlide]);

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

  const touchStartXRef = React.useRef(null);
  const touchEndXRef = React.useRef(null);

  const handleTouchStart = (e) => {
    if (e.touches && e.touches.length > 0) {
      touchStartXRef.current = e.touches[0].clientX;
      touchEndXRef.current = e.touches[0].clientX;
      setIsHovered(true);
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches && e.touches.length > 0) {
      touchEndXRef.current = e.touches[0].clientX;
    }
  };

  const handleTouchEnd = () => {
    setIsHovered(false);
    if (touchStartXRef.current === null || touchEndXRef.current === null) return;
    const diff = touchStartXRef.current - touchEndXRef.current;
    const threshold = 40;
    if (diff > threshold) {
      handleNext();
    } else if (diff < -threshold) {
      handlePrev();
    }
    touchStartXRef.current = null;
    touchEndXRef.current = null;
  };

  const handleImageClick = () => {
    if (currentImage?.imageUrl) {
      setLightboxSample(currentImage);
    }
  };

  useEffect(() => {
    if (!lightboxSample) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setLightboxSample(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow || 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [lightboxSample]);

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
    const serviceType = activeTab === 'patches' ? 'patch' : (activeTab === 'vector-art' ? 'vector' : (activeTab === 'embroidery' ? 'embroidery' : 'all'));
    if (primaryBtnAction && primaryBtnAction.startsWith('/') && primaryBtnAction !== '/order' && !primaryBtnAction.includes('orderWizard') && !primaryBtnAction.includes('pricing')) {
      navigate(primaryBtnAction);
      return;
    }
    if (openOrderWizard) {
      openOrderWizard({ type: serviceType });
    } else if (protectedNavigate) {
      protectedNavigate('customer', true, { type: serviceType });
    } else {
      navigate('/pricing');
    }
  };

  const handleSecondaryAction = () => {
    resolveAction(secondaryBtnAction, () => {
      const targetId = activeTab !== 'all' ? `${activeTab}-packages-grid` : 'services';
      const el = document.getElementById(targetId) || document.getElementById('services');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      } else if (activeTab === 'embroidery') {
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
    <section className="theme-hero-section" style={{
      background: 'var(--hero-bg)',
      color: 'var(--hero-text-primary)',
      padding: 'clamp(1rem, 2.5vh, 2.25rem) 0',
      position: 'relative',
      overflow: 'hidden',
      boxSizing: 'border-box'
    }}>
      {/* Ambient Glows */}
      <div style={{
        position: 'absolute',
        top: '-15%',
        left: '-5%',
        width: '600px',
        height: '600px',
        background: 'radial-gradient(circle, rgba(249, 115, 22, 0.1) 0%, transparent 60%)',
        pointerEvents: 'none',
        zIndex: 0
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-15%',
        right: '-5%',
        width: '550px',
        height: '550px',
        background: 'radial-gradient(circle, rgba(99, 102, 241, 0.08) 0%, transparent 60%)',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      <style dangerouslySetInnerHTML={{__html: `
        @media (min-width: 1025px) {
          .theme-hero-section {
            min-height: calc(100vh - 72px) !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: center !important;
          }
        }
        @media (max-width: 1024px) {
          .theme-hero-section {
            min-height: auto !important;
          }
        }
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
            display: flex !important;
            flex-direction: column !important;
            gap: 1.75rem !important;
            width: 100% !important;
            max-width: 100% !important;
          }
          .hero-right-visual {
            order: 1 !important;
            width: 100% !important;
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
          }
          .hero-left-content {
            order: 2 !important;
            text-align: center !important;
            width: 100% !important;
            max-width: 100% !important;
          }
          .hero-badge-container {
            display: flex !important;
            justify-content: center !important;
          }
          .hero-highlight-row {
            justify-content: center !important;
          }
          .hero-description-text {
            margin-left: auto !important;
            margin-right: auto !important;
            max-width: 620px !important;
          }
          .hero-features-box {
            margin-left: auto !important;
            margin-right: auto !important;
            max-width: 600px !important;
          }
          .hero-trust-badges-row {
            justify-content: center !important;
            margin-left: auto !important;
            margin-right: auto !important;
          }
          .hero-cta-buttons-row {
            justify-content: center !important;
          }
        }
        .hero-nav-tab-btn:not([data-active="true"]):hover {
          background: rgba(15, 23, 42, 0.06) !important;
          color: var(--color-primary) !important;
        }
        .dark-mode .hero-nav-tab-btn:not([data-active="true"]):hover {
          background: rgba(255, 255, 255, 0.08) !important;
          color: #ffffff !important;
        }
        @media (max-width: 992px) {
          .hero-grid-layout {
            display: flex !important;
            flex-direction: column !important;
            gap: 1.5rem !important;
          }
          .hero-right-visual {
            order: 1 !important;
          }
          .hero-left-content {
            order: 2 !important;
          }
        }
        @media (max-width: 768px) {
          .hero-grid-layout {
            display: flex !important;
            flex-direction: column !important;
            gap: 1.25rem !important;
          }
          .hero-right-visual {
            order: 1 !important;
            width: 100% !important;
          }
          .hero-left-content {
            order: 2 !important;
            width: 100% !important;
          }
          .hero-nav-tabs-wrapper {
            border-radius: 14px !important;
            padding: 0.35rem !important;
            gap: 0.35rem !important;
            width: 100% !important;
            max-width: 100% !important;
            display: grid !important;
            grid-template-columns: repeat(2, 1fr) !important;
            box-sizing: border-box !important;
          }
          .hero-nav-tab-btn {
            padding: 0.55rem 0.65rem !important;
            font-size: 0.82rem !important;
            width: 100% !important;
            justify-content: center !important;
            border-radius: 10px !important;
            box-sizing: border-box !important;
          }
          .hero-cta-buttons-row {
            display: flex !important;
            flex-direction: column !important;
            width: 100% !important;
            gap: 0.65rem !important;
          }
          .hero-cta-buttons-row button {
            width: 100% !important;
            justify-content: center !important;
            white-space: normal !important;
            min-height: 48px !important;
            font-size: 0.95rem !important;
            border-radius: 12px !important;
          }
          .hero-trust-badges-row {
            display: grid !important;
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 0.65rem 0.5rem !important;
            width: 100% !important;
            justify-items: center !important;
          }
          .hero-trust-badges-row > div {
            justify-content: center !important;
            font-size: 0.75rem !important;
          }
          .hero-showcase-card {
            padding: 0.85rem !important;
            border-radius: 18px !important;
            width: 100% !important;
            max-width: 100% !important;
            box-shadow: 0 10px 30px -8px rgba(15, 23, 42, 0.15) !important;
          }
          .hero-showcase-image-box {
            min-height: 240px !important;
            max-height: 380px !important;
            aspect-ratio: 4/3 !important;
          }
          .hero-sample-mobile-hint {
            display: flex !important;
          }
          .hero-mobile-vip-banner {
            display: flex !important;
          }
        }
      `}} />

      <div className="container" style={{ position: 'relative', zIndex: 1, maxWidth: '1380px', width: '100%', boxSizing: 'border-box' }}>

        {/* Top 4 Navigation Tabs Switcher */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'clamp(0.85rem, 1.8vw, 1.25rem)', width: '100%' }}>
          <div
            className="hero-nav-tabs-wrapper"
            style={{
              display: 'inline-flex',
              background: 'var(--hero-tabs-bg, var(--color-surface))',
              border: '1px solid var(--hero-tabs-border, var(--color-border))',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              padding: '0.28rem',
              borderRadius: '9999px',
              boxShadow: 'var(--shadow-sm)',
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
                  data-active={isSelected ? 'true' : 'false'}
                  onClick={() => handleTabClick(tab.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    padding: '0.48rem 1.2rem',
                    borderRadius: '9999px',
                    border: 'none',
                    background: isSelected
                      ? 'linear-gradient(135deg, var(--color-secondary), var(--color-primary))'
                      : 'transparent',
                    color: isSelected ? 'var(--color-text-on-primary, #ffffff)' : 'var(--hero-tabs-text, var(--color-text-primary))',
                    fontWeight: isSelected ? 800 : 700,
                    fontSize: '0.84rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                    boxShadow: isSelected ? '0 4px 14px var(--color-primary-glow)' : 'none'
                  }}
                >
                  <Icon size={14} style={{ color: isSelected ? 'inherit' : 'var(--hero-tabs-icon, var(--color-primary))', opacity: isSelected ? 1 : 0.9 }} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2-Column Hero Dynamic Presentation (Balanced 50/50 Grid - Aligned to Center) */}
        <div className="hero-grid-layout" style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.05fr) minmax(0, 0.95fr)',
          gap: 'clamp(1.25rem, 2.5vw, 2.25rem)',
          alignItems: 'center',
          width: '100%',
          boxSizing: 'border-box'
        }}>

          {/* Left Column: Dynamic Service Copy, Benefits, Packages & CTAs */}
          <div className="hero-left-content" style={{ textAlign: 'left' }}>

            {/* Dynamic Badge */}
            <div className="hero-badge-container" style={{ display: 'inline-flex', marginBottom: '0.55rem' }}>
              <div className="badge-pill-glow" style={{
                background: 'var(--color-primary-light)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-primary)',
                fontWeight: 800,
                fontSize: '0.78rem',
                padding: '0.25rem 0.75rem',
                boxShadow: '0 2px 8px var(--color-primary-glow)'
              }}>
                <Sparkles size={13} style={{ color: 'var(--color-primary)' }} />
                <span>{badge}</span>
              </div>
            </div>

            {/* Dynamic Main Title */}
            <h1 className="hero-title" style={{
              fontSize: 'clamp(1.5rem, 2.7vw, 2.35rem)',
              fontWeight: 900,
              lineHeight: 1.16,
              color: 'var(--color-text-primary)',
              marginBottom: '0.45rem',
              letterSpacing: '-0.025em',
              fontFamily: 'var(--font-heading)',
              wordBreak: 'break-word',
              overflowWrap: 'break-word'
            }}>
              {title.includes('&') ? (
                <>
                  {title.split('&')[0]} & <span className="text-gradient-orange">{title.split('&')[1]}</span>
                </>
              ) : title.includes('Services') ? (
                <>
                  {title.replace('Services', '')} <span className="text-gradient-orange">Services</span>
                </>
              ) : (
                title
              )}
            </h1>

            {/* Dynamic Highlight / Subheading */}
            <div className="hero-highlight-row" style={{
              fontSize: 'clamp(0.88rem, 1.55vw, 1.05rem)',
              fontWeight: 800,
              color: 'var(--color-primary)',
              marginBottom: '0.45rem',
              lineHeight: 1.3,
              wordBreak: 'break-word',
              overflowWrap: 'break-word',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem'
            }}>
              <span className="text-gradient-orange">{highlight}</span>
            </div>

            {/* Dynamic Description */}
            <p className="hero-description-text" style={{
              fontSize: 'clamp(0.82rem, 1.3vw, 0.92rem)',
              lineHeight: 1.5,
              color: 'var(--color-text-secondary)',
              marginBottom: '0.75rem',
              maxWidth: '100%',
              wordBreak: 'break-word',
              overflowWrap: 'break-word'
            }}>
              {description}
            </p>

            {/* Service Features Checkmarks List */}
            <div className="hero-features-box" style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.4rem',
              marginBottom: '0.85rem',
              background: 'var(--color-surface, var(--bg-card))',
              border: '1px solid var(--color-border)',
              padding: 'clamp(0.65rem, 1.5vw, 0.85rem) clamp(0.85rem, 1.5vw, 1.15rem)',
              borderRadius: '14px',
              textAlign: 'left',
              width: '100%',
              boxSizing: 'border-box',
              boxShadow: 'var(--shadow-sm)'
            }}>
              {featuresList.slice(0, 3).map((featText, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.55rem', fontSize: '0.82rem', color: 'var(--color-text-primary)', fontWeight: 600, wordBreak: 'break-word' }}>
                  <div style={{ background: 'var(--color-primary-light)', border: '1px solid var(--color-border)', padding: '2px', borderRadius: '50%', display: 'flex', flexShrink: 0, marginTop: '2px' }}>
                    <CheckCircle2 size={13} style={{ color: 'var(--color-primary)' }} />
                  </div>
                  <span style={{ lineHeight: 1.42 }}>{featText}</span>
                </div>
              ))}
            </div>

            {/* CTA Buttons Group (Always Side-by-Side on Desktop/Tablet) */}
            <div className="hero-cta-buttons-row" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              marginBottom: '0.85rem'
            }}>
              <button
                type="button"
                className="btn btn-primary-orange btn-lg"
                onClick={handlePrimaryAction}
                style={{
                  background: 'linear-gradient(135deg, var(--color-secondary) 0%, var(--color-primary) 100%)',
                  color: 'var(--color-text-on-primary, #ffffff)',
                  border: 'none',
                  padding: '0.72rem 1.45rem',
                  fontSize: '0.92rem',
                  fontWeight: 800,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  borderRadius: '12px',
                  boxShadow: '0 6px 20px var(--color-primary-glow)',
                  cursor: 'pointer'
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
                  background: 'var(--color-surface, transparent)',
                  color: 'var(--color-text-primary)',
                  border: '1.5px solid var(--color-border)',
                  padding: '0.72rem 1.25rem',
                  fontSize: '0.92rem',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '12px',
                  boxShadow: 'var(--shadow-sm)',
                  cursor: 'pointer'
                }}
              >
                <span>{secondaryCtaText}</span>
              </button>
            </div>

            {/* Trust Metrics Row */}
            <div className="hero-trust-badges-row" style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '1rem'
            }}>
              {statsList.map((stat, i) => {
                const IconComp = ICON_MAP[stat.icon] || Star;
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <div style={{ background: 'var(--color-primary-light)', padding: '3px', borderRadius: '6px', display: 'flex' }}>
                      <IconComp size={13} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
                    </div>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>
                      <strong style={{ color: 'var(--color-primary)', marginRight: '3px' }}>{stat.value}</strong>
                      {stat.label}
                    </span>
                  </div>
                );
              })}
            </div>

          </div>

          {/* Right Column: Clean, Full Showcase Image Card (Auto-rotates every 5s) */}
          <div
            className="hero-right-visual"
            style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            {/* VIP Mobile Real Sew-Outs Banner */}
            <div
              className="hero-mobile-vip-banner"
              style={{
                display: 'none',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.45rem',
                marginBottom: '0.65rem',
                fontSize: '0.74rem',
                fontWeight: 800,
                color: 'var(--color-primary, #ea580c)',
                background: 'var(--color-primary-light, rgba(234, 88, 12, 0.08))',
                border: '1px solid var(--color-border)',
                padding: '0.35rem 0.85rem',
                borderRadius: '9999px',
                letterSpacing: '0.04em',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <Sparkles size={13} style={{ color: 'var(--color-primary)' }} />
              <span>100% Real Studio Sew-Out Samples</span>
            </div>

            <div
              className="hero-showcase-card"
              style={{
                background: 'var(--hero-card-bg, var(--color-surface))',
                border: '1px solid var(--hero-card-border, var(--color-border))',
                borderRadius: '20px',
                padding: '0.95rem 1.1rem',
                boxShadow: 'var(--hero-card-shadow, var(--shadow-xl))',
                width: '100%',
                maxWidth: '590px',
                position: 'relative',
                boxSizing: 'border-box'
              }}
            >

              {/* Header Title & Slide Index Counter */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.55rem', gap: '0.5rem', flexWrap: 'wrap' }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--color-primary)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.35rem', letterSpacing: '0.06em' }}>
                    <span className="blinking-green-dot" /> LIVE SHOWCASE
                  </div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--color-text-primary)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {(currentImage?.title || previewTitle || '').replace(/Emrboidery/gi, 'Embroidery')}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
                  {/* Live Specs / Stitch Count Badge (in header to never cover design) */}
                  {Boolean(currentImage?.stitchCount || currentImage?.formats) && (
                    <span style={{
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      background: 'rgba(249, 115, 22, 0.12)',
                      color: 'var(--orange-600, #ea580c)',
                      border: '1px solid rgba(249, 115, 22, 0.25)',
                      padding: '0.2rem 0.6rem',
                      borderRadius: '9999px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.3rem'
                    }}>
                      <span style={{ color: '#ea580c' }}>★</span>
                      {currentImage.stitchCount && <span>{currentImage.stitchCount}</span>}
                      {currentImage.formats && (
                        <span style={{ opacity: 0.9 }}>{currentImage.stitchCount ? '· ' : ''}{currentImage.formats}</span>
                      )}
                    </span>
                  )}

                  {hasMultipleImages && (
                    <span style={{
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      background: 'var(--color-primary-light)',
                      border: '1px solid var(--color-border)',
                      padding: '0.2rem 0.55rem',
                      borderRadius: '9999px',
                      color: 'var(--color-primary)',
                      flexShrink: 0
                    }}>
                      {currentSlideIdx + 1} / {activeShowcaseImages.length}
                    </span>
                  )}
                </div>
              </div>

              {/* Full, Clear Showcase Image Container (Fills frame edge-to-edge with ambient backdrop + 100% uncut artwork) */}
              <div
                className="hero-showcase-image-box"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onClick={handleImageClick}
                style={{
                  position: 'relative',
                  width: '100%',
                  aspectRatio: '4/3',
                  minHeight: '280px',
                  maxHeight: '440px',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.98) 0%, rgba(241,245,249,0.9) 100%)',
                  boxShadow: 'inset 0 0 0 1px rgba(0, 0, 0, 0.05), 0 8px 30px rgba(0, 0, 0, 0.06)',
                  opacity: isFading ? 0.35 : 1,
                  transition: 'opacity 0.25s ease-in-out',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: currentImage?.imageUrl ? 'zoom-in' : 'default'
                }}
                title={currentImage?.imageUrl ? 'Tap to inspect high-resolution sample' : undefined}
              >
                {/* Full, Auto-Adjusted Showcase Image or Empty State */}
                {currentImage?.imageUrl ? (
                  <>
                    {/* Ambient Blurred Artwork Backdrop: Fills entire frame edge-to-edge with rich matching hues */}
                    <div
                      aria-hidden="true"
                      style={{
                        position: 'absolute',
                        inset: '-15px',
                        backgroundImage: `url(${getOptimizedImageUrl(currentImage.imageUrl, 400)})`,
                        backgroundPosition: 'center',
                        backgroundSize: 'cover',
                        filter: 'blur(30px) saturate(1.3) brightness(0.94)',
                        opacity: 0.52,
                        transform: 'scale(1.18)',
                        pointerEvents: 'none'
                      }}
                    />
                    {/* Subtle vignette layer to elevate foreground artwork contrast */}
                    <div
                      aria-hidden="true"
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'radial-gradient(circle at center, rgba(255,255,255,0.05) 0%, rgba(15,23,42,0.12) 100%)',
                        pointerEvents: 'none',
                        zIndex: 1
                      }}
                    />

                    {/* Master Uncut Artwork: Full 100% resolution, never cropped or truncated */}
                    <img
                      src={getOptimizedImageUrl(currentImage.imageUrl, 1080)}
                      alt={currentImage?.title || "Studio Showcase"}
                      loading="lazy"
                      decoding="async"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = '/artwork-placeholder.svg';
                      }}
                      style={{
                        position: 'relative',
                        zIndex: 2,
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        objectPosition: 'center',
                        display: 'block',
                        transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                        filter: 'drop-shadow(0 8px 24px rgba(0, 0, 0, 0.16))'
                      }}
                      draggable="false"
                    />

                    {/* Tap to inspect badge */}
                    <div
                      style={{
                        position: 'absolute',
                        bottom: '10px',
                        right: '10px',
                        background: 'rgba(15, 23, 42, 0.72)',
                        backdropFilter: 'blur(8px)',
                        color: '#ffffff',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        padding: '0.24rem 0.6rem',
                        borderRadius: '9999px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        pointerEvents: 'none',
                        zIndex: 5,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.25)'
                      }}
                    >
                      <ZoomIn size={12} />
                      <span>Tap to inspect</span>
                    </div>
                  </>
                ) : (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    padding: '2rem 1.5rem',
                    gap: '0.75rem',
                    color: '#94a3b8'
                  }}>
                    <Sparkles size={32} style={{ color: 'var(--color-primary, #ea580c)' }} />
                    <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--color-text-primary)' }}>
                      Studio Production Showcase
                    </div>
                    <p style={{ fontSize: '0.82rem', margin: 0, maxWidth: '280px', color: 'var(--color-text-muted)' }}>
                      Live sew-outs and digitized machine files directly from our studio.
                    </p>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={() => navigate('/portfolio')}
                      style={{ marginTop: '0.25rem' }}
                    >
                      View Full Portfolio →
                    </button>
                  </div>
                )}

                {/* Subtle Previous/Next Arrow Controls (if multiple images) */}
                {hasMultipleImages && (
                  <>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handlePrev(); }}
                      style={{
                        position: 'absolute',
                        left: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'rgba(15, 23, 42, 0.75)',
                        border: '1px solid rgba(255, 255, 255, 0.25)',
                        borderRadius: '50%',
                        width: '36px',
                        height: '36px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        color: '#ffffff',
                        backdropFilter: 'blur(8px)',
                        zIndex: 10,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--orange-500)'; e.currentTarget.style.transform = 'translateY(-50%) scale(1.08)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(15, 23, 42, 0.75)'; e.currentTarget.style.transform = 'translateY(-50%) scale(1)'; }}
                      title="Previous Showcase Image"
                    >
                      <ChevronLeft size={18} />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleNext(); }}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'rgba(15, 23, 42, 0.75)',
                        border: '1px solid rgba(255, 255, 255, 0.25)',
                        borderRadius: '50%',
                        width: '36px',
                        height: '36px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        color: '#ffffff',
                        backdropFilter: 'blur(8px)',
                        zIndex: 10,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--orange-500)'; e.currentTarget.style.transform = 'translateY(-50%) scale(1.08)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(15, 23, 42, 0.75)'; e.currentTarget.style.transform = 'translateY(-50%) scale(1)'; }}
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
                  marginTop: '0.65rem'
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
                          width: isActive ? '24px' : '6px',
                          borderRadius: '9999px',
                          border: 'none',
                          background: isActive ? 'var(--orange-500, #ea580c)' : 'var(--color-border, rgba(148, 163, 184, 0.45))',
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

              {/* Mobile swipe and navigation hint */}
              {hasMultipleImages && (
                <div
                  className="hero-sample-mobile-hint"
                  style={{
                    display: 'none',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.35rem',
                    marginTop: '0.45rem',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    color: 'var(--color-primary)'
                  }}
                >
                  <span>✦ Swipe or tap arrows to see more samples</span>
                </div>
              )}

            </div>
          </div>

        </div>

      </div>

      {/* VIP Interactive Fullscreen Sample Lightbox */}
      {lightboxSample && (
        <div
          role="dialog"
          aria-modal="true"
          className="modal-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            background: 'rgba(9, 13, 22, 0.88)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'clamp(0.75rem, 3vw, 1.5rem)'
          }}
          onClick={() => setLightboxSample(null)}
        >
          <div
            className="hero-sample-lightbox-card"
            style={{
              background: 'var(--color-surface, #ffffff)',
              color: 'var(--color-text-primary, #0f172a)',
              borderRadius: '20px',
              maxWidth: '720px',
              width: '100%',
              maxHeight: '92vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.5)',
              border: '1px solid var(--color-border)',
              overflow: 'hidden',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Lightbox Header */}
            <div style={{
              padding: '0.9rem 1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid var(--color-border)',
              gap: '0.75rem'
            }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--color-primary)', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span className="blinking-green-dot" /> LIVE STUDIO SAMPLE
                </div>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--color-text-primary)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {(lightboxSample.title || previewTitle || '').replace(/Emrboidery/gi, 'Embroidery')}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setLightboxSample(null)}
                style={{
                  background: 'var(--color-subtle, rgba(0,0,0,0.06))',
                  border: 'none',
                  borderRadius: '50%',
                  width: '36px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: 'var(--color-text-primary)'
                }}
                aria-label="Close Preview"
              >
                <X size={18} />
              </button>
            </div>

            {/* Lightbox Image View */}
            <div style={{
              flex: 1,
              minHeight: '260px',
              maxHeight: '58vh',
              background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.98) 0%, rgba(241,245,249,0.9) 100%)',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1rem',
              overflow: 'hidden'
            }}>
              <img
                src={getOptimizedImageUrl(lightboxSample.imageUrl, 1440)}
                alt={lightboxSample.title || 'Studio Sample'}
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 10px 30px rgba(0,0,0,0.2))'
                }}
              />
            </div>

            {/* Lightbox Footer with Specs & High-Converting CTA */}
            <div style={{
              padding: '0.9rem 1.25rem',
              background: 'var(--color-surface)',
              borderTop: '1px solid var(--color-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.75rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                {lightboxSample.stitchCount && (
                  <span style={{
                    fontSize: '0.76rem',
                    fontWeight: 800,
                    background: 'rgba(249, 115, 22, 0.12)',
                    color: 'var(--orange-600, #ea580c)',
                    border: '1px solid rgba(249, 115, 22, 0.25)',
                    padding: '0.22rem 0.65rem',
                    borderRadius: '9999px'
                  }}>
                    ★ {lightboxSample.stitchCount}
                  </span>
                )}
                {lightboxSample.formats && (
                  <span style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--color-text-secondary)' }}>
                    {lightboxSample.formats}
                  </span>
                )}
              </div>

              <button
                type="button"
                className="btn btn-primary-orange"
                onClick={() => {
                  setLightboxSample(null);
                  handlePrimaryAction();
                }}
                style={{
                  background: 'linear-gradient(135deg, var(--color-secondary) 0%, var(--color-primary) 100%)',
                  color: '#ffffff',
                  padding: '0.65rem 1.3rem',
                  borderRadius: '10px',
                  fontSize: '0.88rem',
                  fontWeight: 800,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                <Upload size={15} />
                <span>Order Similar Quality</span>
                <ArrowRight size={15} />
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default HeroSection;
