'use client';

import React, { useState, useEffect, useRef } from 'react';
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
        title: 'Factory-Grade Commercial Embroidery Sew-Out',
        before_image_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=900',
        after_image_url: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&q=80&w=900',
        before_tag: 'RAW ARTWORK',
        after_tag: 'EMBROIDERY SEW-OUT',
        display_order: 1,
        is_active: true
      },
      {
        id: 'all-2',
        title: 'Precision Scalable Vector Art Redraw',
        before_image_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=900',
        after_image_url: 'https://images.unsplash.com/photo-1620660605929-e1fcc13bb221?auto=format&fit=crop&q=80&w=900',
        before_tag: 'PIXELATED RASTER',
        after_tag: 'SCALABLE VECTOR',
        display_order: 2,
        is_active: true
      },
      {
        id: 'all-3',
        title: 'Physical Manufactured Custom Patches',
        before_image_url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&q=80&w=900',
        after_image_url: 'https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&q=80&w=900',
        before_tag: 'EMBLEM DESIGN',
        after_tag: 'MANUFACTURED PATCH',
        display_order: 3,
        is_active: true
      }
    ]
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
      'Guaranteed Zero Thread Breaks on Commercial Machines'
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
        title: 'Left Chest & Polo Logo Digitizing',
        before_image_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=900',
        after_image_url: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&q=80&w=900',
        before_tag: 'ORIGINAL LOGO',
        after_tag: 'DIGITIZED SEW-OUT',
        display_order: 1,
        is_active: true
      },
      {
        id: 'emb-2',
        title: '3D Puff Raised Foam Cap Embroidery',
        before_image_url: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&q=80&w=900',
        after_image_url: 'https://images.unsplash.com/photo-1576871337632-b9aef4c17ab9?auto=format&fit=crop&q=80&w=900',
        before_tag: '2D FLAT LOGO',
        after_tag: '3D PUFF CAP',
        display_order: 2,
        is_active: true
      },
      {
        id: 'emb-3',
        title: 'Mid-Size Jacket & Sleeve Design',
        before_image_url: 'https://images.unsplash.com/photo-1620660605929-e1fcc13bb221?auto=format&fit=crop&q=80&w=900',
        after_image_url: 'https://images.unsplash.com/photo-1558655146-d09347e92766?auto=format&fit=crop&q=80&w=900',
        before_tag: 'VECTOR ARTWORK',
        after_tag: 'SATIN EMBROIDERY',
        display_order: 3,
        is_active: true
      },
      {
        id: 'emb-4',
        title: 'Full Jacket Back Master Design',
        before_image_url: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&q=80&w=900',
        after_image_url: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&q=80&w=900',
        before_tag: 'DESIGN GRAPHIC',
        after_tag: '85K STITCH SEW-OUT',
        display_order: 4,
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
      'Master Source Suite: .AI, .EPS, .SVG & High-Res 300+ DPI PDF',
      'Print, Vinyl Cut & Screen-Printing Production Ready'
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
        title: 'Blurry Logo to Razor-Sharp Vector Nodes',
        before_image_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=900',
        after_image_url: 'https://images.unsplash.com/photo-1620660605929-e1fcc13bb221?auto=format&fit=crop&q=80&w=900',
        before_tag: 'PIXELATED JPG',
        after_tag: 'CLEAN VECTOR AI/EPS',
        display_order: 1,
        is_active: true
      },
      {
        id: 'vec-2',
        title: 'Pantone Spot Color Separation for Press',
        before_image_url: 'https://images.unsplash.com/photo-1620660605929-e1fcc13bb221?auto=format&fit=crop&q=80&w=900',
        after_image_url: 'https://images.unsplash.com/photo-1558655146-d09347e92766?auto=format&fit=crop&q=80&w=900',
        before_tag: 'MULTI-TONE ART',
        after_tag: 'PMS COLOR SEPARATED',
        display_order: 2,
        is_active: true
      },
      {
        id: 'vec-3',
        title: 'Complex Mascot & Crest Illustration',
        before_image_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=900',
        after_image_url: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&q=80&w=900',
        before_tag: 'RAW SKETCH',
        after_tag: 'MASTER VECTOR ART',
        display_order: 3,
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
      'Free 12-Hour Digital Proof & Doorstep Worldwide Shipping',
      'Merrowed & Laser Cut High-Durability Borders'
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
        title: 'Tactical Hook & Loop Velcro Patch',
        before_image_url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&q=80&w=900',
        after_image_url: 'https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&q=80&w=900',
        before_tag: 'DESIGN ARTWORK',
        after_tag: 'VELCRO PATCH',
        display_order: 1,
        is_active: true
      },
      {
        id: 'pat-2',
        title: 'High-Density Merrowed Border Uniform Patch',
        before_image_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=900',
        after_image_url: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&q=80&w=900',
        before_tag: 'EMBLEM VECTOR',
        after_tag: 'MERROWED PATCH',
        display_order: 2,
        is_active: true
      },
      {
        id: 'pat-3',
        title: '3D Rubber PVC Molded Waterproof Patch',
        before_image_url: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&q=80&w=900',
        after_image_url: 'https://images.unsplash.com/photo-1576871337632-b9aef4c17ab9?auto=format&fit=crop&q=80&w=900',
        before_tag: '2D DESIGN',
        after_tag: '3D MOLDED PVC',
        display_order: 3,
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
  const [sliderPos, setSliderPos] = useState(50);
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

  // Multi-image collection parsing
  const activeShowcaseImages = React.useMemo(() => {
    let images = matchedSlide?.showcase_images || matchedSlide?.showcaseImages || matchedSlide?.trust_points?.[0]?.showcase_images || [];
    
    if (Array.isArray(images) && images.length > 0) {
      const activeList = images
        .filter(img => img.is_active !== false && (img.after_image_url || img.image_url))
        .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
      if (activeList.length > 0) {
        return activeList.map((img, i) => ({
          id: img.id || `img-${i}`,
          title: img.title || `Showcase Item #${i + 1}`,
          beforeImg: img.before_image_url || img.beforeImg || '',
          afterImg: img.after_image_url || img.image_url || img.afterImg || '',
          beforeTag: img.before_tag || img.beforeTag || 'BEFORE',
          afterTag: img.after_tag || img.afterTag || 'AFTER'
        }));
      }
    }

    // Fallback: check legacy single image in matchedSlide
    const legacyBefore = matchedSlide?.beforeImg || matchedSlide?.trust_points?.[0]?.previewBefore;
    const legacyAfter = matchedSlide?.afterImg || matchedSlide?.banner_image;
    if (legacyAfter) {
      return [{
        id: `${activeTab}-legacy-1`,
        title: previewTitle,
        beforeImg: legacyBefore || '',
        afterImg: legacyAfter,
        beforeTag: matchedSlide?.beforeTag || 'RAW ARTWORK',
        afterTag: matchedSlide?.afterTag || 'FINISHED SEW-OUT'
      }];
    }

    // Default curated collection
    return (defaultContent.showcase_images || []).map((img, i) => ({
      id: img.id || `default-${i}`,
      title: img.title,
      beforeImg: img.before_image_url,
      afterImg: img.after_image_url,
      beforeTag: img.before_tag,
      afterTag: img.after_tag
    }));
  }, [matchedSlide, defaultContent, activeTab, previewTitle]);

  // Reset slide index when activeTab changes
  useEffect(() => {
    setCurrentSlideIdx(0);
    setSliderPos(50);
  }, [activeTab]);

  // Automatic slideshow timer
  useEffect(() => {
    if (activeShowcaseImages.length <= 1) return; // Do not run slideshow if only 1 image
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
    setSliderPos(50);
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

          {/* Right Column: Interactive Before/After Multi-Image Showcase Box */}
          <div 
            style={{ width: '100%', display: 'flex', justifyContent: 'center' }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <div style={{
              background: 'rgba(15, 23, 42, 0.7)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '24px',
              padding: '1.35rem',
              boxShadow: '0 25px 60px -12px rgba(0, 0, 0, 0.7)',
              width: '100%',
              maxWidth: '650px',
              backdropFilter: 'blur(16px)',
              position: 'relative'
            }}>
              
              {/* Header Title & Slide Index Counter */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--orange-400)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.4rem', letterSpacing: '0.06em' }}>
                    <span className="blinking-green-dot" /> SHOWCASE SLIDESHOW
                  </div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#ffffff', marginTop: '2px' }}>
                    {currentImage?.title || previewTitle}
                  </div>
                </div>

                {hasMultipleImages && (
                  <span style={{
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    padding: '0.2rem 0.6rem',
                    borderRadius: '9999px',
                    color: '#94a3b8'
                  }}>
                    {currentSlideIdx + 1} / {activeShowcaseImages.length}
                  </span>
                )}
              </div>

              {/* Interactive Comparison Slider Container */}
              <div 
                style={{
                  position: 'relative',
                  width: '100%',
                  aspectRatio: '16/10',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  cursor: currentImage?.beforeImg ? 'ew-resize' : 'default',
                  userSelect: 'none',
                  background: '#090d16',
                  opacity: isFading ? 0.3 : 1,
                  transition: 'opacity 0.25s ease-in-out'
                }}
                onMouseMove={(e) => {
                  if (!currentImage?.beforeImg) return;
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
                  setSliderPos((x / rect.width) * 100);
                }}
                onTouchMove={(e) => {
                  if (!currentImage?.beforeImg) return;
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = Math.max(0, Math.min(e.touches[0].clientX - rect.left, rect.width));
                  setSliderPos((x / rect.width) * 100);
                }}
              >
                {/* After Finished Image */}
                <img 
                  src={currentImage?.afterImg || currentImage?.beforeImg} 
                  alt={currentImage?.title || "Showcase Finished"} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                  draggable="false" 
                />
                
                {/* Before Image with ClipPath (if beforeImg exists) */}
                {currentImage?.beforeImg && currentImage?.beforeImg !== currentImage?.afterImg && (
                  <>
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
                        src={currentImage.beforeImg} 
                        alt="Before" 
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
                      transform: 'translateX(-50%)',
                      pointerEvents: 'none'
                    }}>
                      <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: '34px',
                        height: '34px',
                        background: 'var(--orange-500)',
                        color: '#ffffff',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 14px rgba(0, 0, 0, 0.5)',
                        border: '2.5px solid #ffffff'
                      }}>
                        <MoveHorizontal size={16} />
                      </div>
                    </div>
                  </>
                )}

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
                        background: 'rgba(15, 23, 42, 0.75)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
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
                      onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(15, 23, 42, 0.75)'}
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
                        background: 'rgba(15, 23, 42, 0.75)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
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
                      onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(15, 23, 42, 0.75)'}
                      title="Next Showcase Image"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </>
                )}

                {/* Before Tag Badge */}
                {currentImage?.beforeImg && (
                  <span style={{
                    position: 'absolute',
                    bottom: '12px',
                    left: '12px',
                    background: 'rgba(15, 23, 42, 0.85)',
                    backdropFilter: 'blur(6px)',
                    color: '#ffffff',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '8px',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    {currentImage?.beforeTag || 'BEFORE'}
                  </span>
                )}

                {/* After Tag Badge */}
                <span style={{
                  position: 'absolute',
                  bottom: '12px',
                  right: '12px',
                  background: 'rgba(234, 88, 12, 0.9)',
                  backdropFilter: 'blur(6px)',
                  color: '#ffffff',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '8px',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  {currentImage?.afterTag || 'AFTER'}
                </span>
              </div>

              {/* Bottom Pagination Dots with Brand Orange Active Bar (if multiple images) */}
              {hasMultipleImages && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '0.45rem',
                  marginTop: '1.15rem'
                }}>
                  {activeShowcaseImages.map((imgItem, idx) => {
                    const isActive = idx === currentSlideIdx;
                    return (
                      <button
                        key={imgItem.id || idx}
                        type="button"
                        onClick={() => handleDotClick(idx)}
                        style={{
                          height: '7px',
                          width: isActive ? '24px' : '7px',
                          borderRadius: '9999px',
                          border: 'none',
                          background: isActive ? 'var(--orange-500, #ea580c)' : 'rgba(255, 255, 255, 0.25)',
                          cursor: 'pointer',
                          transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                          padding: 0,
                          boxShadow: isActive ? '0 0 10px rgba(234, 88, 12, 0.6)' : 'none'
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
