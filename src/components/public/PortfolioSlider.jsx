'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAppState } from '../../context/StateContext';
import { MoveHorizontal, Eye, Scissors, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';

const DEFAULT_COMPARISON_ITEMS = [
  {
    id: 'comp-1',
    title: 'Heraldic Crest & Coat of Arms',
    description: 'Crisp satin stitch outline with dense fill underlay optimized for smooth pique knit fabric.',
    before: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
    after: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80',
    stitchCount: '12,450 Stitches',
    colors: '5 Thread Colors'
  },
  {
    id: 'comp-2',
    title: 'Tactical Cap & Snapback Logo',
    description: 'Precision capped ends for foam perforations with zero thread breaks on cap frames.',
    before: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=800&q=80',
    after: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80',
    stitchCount: '15,800 Stitches',
    colors: '2 Thread Colors (3mm Foam)'
  },
  {
    id: 'comp-3',
    title: 'Corporate Polo Left Chest',
    description: 'Knit fabric pull compensation with smooth underlay foundation and zero puckering.',
    before: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80',
    after: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?auto=format&fit=crop&w=800&q=80',
    stitchCount: '6,800 Stitches',
    colors: '4 Thread Colors'
  },
  {
    id: 'comp-4',
    title: 'Vintage Skull & Rose Vector',
    description: 'Raster JPG transformed into resolution-independent AI/SVG vector with pantone color matching.',
    before: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=800&q=80',
    after: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=800&q=80',
    stitchCount: 'N/A (Clean Vector)',
    colors: '4 Screen Separation Colors'
  }
];

export const PortfolioSlider = ({ isHero = false }) => {
  const { portfolioSamples = [] } = useAppState();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sliderPos, setSliderPos] = useState(50); // 0% to 100% split
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(600);

  const comparisonItems = (portfolioSamples && portfolioSamples.length > 0)
    ? portfolioSamples.map(item => ({
        id: item.id,
        title: item.title,
        description: item.description,
        before: item.originalImage || item.beforeImg || item.before,
        after: item.digitizedImage || item.afterImg || item.after,
        stitchCount: item.stitchCount || '8,500 Stitches',
        colors: item.colors || 'Full Color'
      }))
    : DEFAULT_COMPARISON_ITEMS;

  const safeIndex = currentIndex < comparisonItems.length ? currentIndex : 0;
  const currentItem = comparisonItems[safeIndex] || comparisonItems[0];

  const handleNextImage = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % comparisonItems.length);
    setSliderPos(50);
  };

  const handlePrevImage = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + comparisonItems.length) % comparisonItems.length);
    setSliderPos(50);
  };

  useEffect(() => {
    if (containerRef.current) {
      setContainerWidth(containerRef.current.offsetWidth);
    }
    const handleResize = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleMouseMove = (e) => {
    if (!isDragging && e.type !== 'click') return;
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const percent = Math.max(5, Math.min((x / rect.width) * 100, 95));
    setSliderPos(percent);
  };

  if (!comparisonItems || comparisonItems.length === 0) return null;

  const visualizerCard = (
    <div style={{
      width: '100%',
      background: isHero ? 'transparent' : 'rgba(15, 23, 42, 0.85)',
      border: 'none',
      borderRadius: isHero ? '0px' : '24px',
      padding: isHero ? '0px' : '1.5rem',
      boxShadow: 'none',
      backdropFilter: isHero ? 'none' : 'blur(12px)'
    }}>
      {/* Visualizer Header / Tabs (Shown only when NOT in Hero mode) */}
      {!isHero && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '0.85rem',
          flexWrap: 'wrap',
          gap: '0.5rem'
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            color: '#f97316',
            fontWeight: 800,
            fontSize: '0.85rem',
            textTransform: 'uppercase',
            letterSpacing: '0.06em'
          }}>
            <Eye size={15} /> Interactive Before & After Visualizer
          </div>

          {/* Portfolio Tabs Selector */}
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {comparisonItems.map((item, idx) => (
              <button
                key={item.id || idx}
                type="button"
                onClick={() => {
                  setCurrentIndex(idx);
                  setSliderPos(50);
                }}
                style={{
                  background: safeIndex === idx ? '#f97316' : 'rgba(255, 255, 255, 0.08)',
                  color: '#ffffff',
                  border: 'none',
                  padding: '0.45rem 0.95rem',
                  borderRadius: '9999px',
                  fontWeight: 700,
                  fontSize: '0.825rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {item.title}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Drag Visualizer Box */}
      <div 
        ref={containerRef}
        style={{
          position: 'relative',
          width: '100%',
          height: isHero ? '380px' : '420px',
          borderRadius: isHero ? '24px' : '18px',
          overflow: 'hidden',
          userSelect: 'none',
          cursor: 'ew-resize',
          border: isHero ? '1.5px solid rgba(255, 255, 255, 0.15)' : '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: isHero ? '0 25px 65px rgba(0, 0, 0, 0.65)' : 'none'
        }}
        onMouseDown={() => setIsDragging(true)}
        onMouseUp={() => setIsDragging(false)}
        onMouseLeave={() => setIsDragging(false)}
        onMouseMove={handleMouseMove}
        onClick={handleMouseMove}
      >
        {/* Left Navigation Arrow Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handlePrevImage();
          }}
          style={{
            position: 'absolute',
            left: '16px',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'rgba(15, 23, 42, 0.75)',
            border: '1.5px solid rgba(255, 255, 255, 0.3)',
            color: '#ffffff',
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 25,
            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(4px)',
            transition: 'all 0.2s ease'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = '#f97316';
            e.currentTarget.style.borderColor = '#ffffff';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = 'rgba(15, 23, 42, 0.75)';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
          }}
          title="Previous Image Pair"
        >
          <ChevronLeft size={22} />
        </button>

        {/* Right Navigation Arrow Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleNextImage();
          }}
          style={{
            position: 'absolute',
            right: '16px',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'rgba(15, 23, 42, 0.75)',
            border: '1.5px solid rgba(255, 255, 255, 0.3)',
            color: '#ffffff',
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 25,
            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(4px)',
            transition: 'all 0.2s ease'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = '#f97316';
            e.currentTarget.style.borderColor = '#ffffff';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = 'rgba(15, 23, 42, 0.75)';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
          }}
          title="Next Image Pair"
        >
          <ChevronRight size={22} />
        </button>

        {/* Background Layer: Digitized Stitched Result (Right Side) */}
        <img 
          src={currentItem.after} 
          alt={`${currentItem.title} After Digitizing`}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover'
          }}
        />

        <div style={{
          position: 'absolute',
          top: '14px',
          right: '14px',
          background: 'rgba(16, 185, 129, 0.95)',
          color: '#ffffff',
          padding: '0.35rem 0.85rem',
          borderRadius: '9999px',
          fontSize: '0.78rem',
          fontWeight: 800,
          display: 'flex',
          alignItems: 'center',
          gap: '0.35rem',
          boxShadow: '0 4px 14px rgba(0,0,0,0.35)',
          zIndex: 5
        }}>
          <CheckCircle size={14} /> AFTER: Digitized Stitch
        </div>

        {/* Foreground Layer: Original Customer Image (Left Side clipped by sliderPos) */}
        <div style={{
          position: 'absolute',
          inset: 0,
          width: `${sliderPos}%`,
          overflow: 'hidden',
          borderRight: '3px solid #f97316',
          transition: isDragging ? 'none' : 'width 0.1s ease-out'
        }}>
          <img 
            src={currentItem.before} 
            alt={`${currentItem.title} Before Digitizing`}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: `${containerWidth}px`,
              height: isHero ? '380px' : '420px',
              objectFit: 'cover'
            }}
          />

          <div style={{
            position: 'absolute',
            top: '14px',
            left: '14px',
            background: 'rgba(15, 23, 42, 0.95)',
            color: '#ffffff',
            padding: '0.35rem 0.85rem',
            borderRadius: '9999px',
            fontSize: '0.78rem',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            boxShadow: '0 4px 14px rgba(0,0,0,0.35)'
          }}>
            <Scissors size={14} style={{ color: '#f97316' }} /> BEFORE: Original Art
          </div>
        </div>

        {/* Draggable Divider Handle */}
        <div style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: `${sliderPos}%`,
          transform: 'translateX(-50%)',
          width: '4px',
          background: '#f97316',
          boxShadow: '0 0 14px rgba(249, 115, 22, 0.9)',
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            background: '#f97316',
            color: '#ffffff',
            width: '34px',
            height: '34px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(0,0,0,0.4)',
            border: '2px solid #ffffff'
          }}>
            <MoveHorizontal size={18} />
          </div>
        </div>
      </div>

      {/* Sample Details (Shown only when NOT in Hero mode) */}
      {!isHero && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '0.85rem',
          paddingTop: '0.75rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          flexWrap: 'wrap',
          gap: '0.75rem'
        }}>
          <div>
            <h4 style={{ fontSize: '0.925rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>{currentItem.title}</h4>
            <p style={{ color: '#94a3b8', fontSize: '0.78rem', margin: '2px 0 0' }}>{currentItem.description}</p>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Stitch Count</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#f97316' }}>{currentItem.stitchCount}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Color Setup</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#60a5fa' }}>{currentItem.colors}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  if (isHero) return visualizerCard;

  return (
    <section id="portfolio" style={{ padding: '5rem 0', background: 'var(--navy-950)', color: '#ffffff' }}>
      <div className="container">
        {/* Header */}
        <div style={{ textAlign: 'center', maxWidth: '680px', margin: '0 auto 3rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            color: 'var(--orange-500)',
            fontWeight: 700,
            fontSize: '0.85rem',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: '0.5rem'
          }}>
            <Eye size={16} /> Interactive Before & After Visualizer
          </div>

          <h2 style={{ fontSize: '2.25rem', color: '#ffffff', marginBottom: '0.75rem' }}>
            Compare Original Artwork vs Digitized Stitches
          </h2>

          <p style={{ color: '#94a3b8', fontSize: '1rem' }}>
            Drag the handle left or right to inspect thread density, sharp satin outlines, and vector node cleanliness.
          </p>
        </div>

        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          {visualizerCard}
        </div>
      </div>
    </section>
  );
};

