'use client';

import React, { useState, useEffect } from 'react';
import { ArrowRight, Layers, PenTool, Hexagon, Sparkles } from 'lucide-react';
import { useAppState } from '../../context/StateContext';
import { useNavigate } from '../../utils/navigation';
import { normalizeCategory } from '../../utils/categoryUtils';

export const PortfolioPreview = () => {
  const { portfolioSamples, activeHomeServiceTab, homePageConfig = {} } = useAppState();
  
  const dbSettings = homePageConfig?.settings || {};
  const badgeText = dbSettings.portfolio_badge || 'Our Work';
  const titleText = dbSettings.portfolio_title || 'Crafted with Precision';
  const subText = dbSettings.portfolio_sub || 'Explore a curated selection of our finest embroidery digitizing, vector art conversions, and custom patch creations.';
  
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState('All');
  const [hoveredId, setHoveredId] = useState(null);

  useEffect(() => {
    const norm = normalizeCategory(activeHomeServiceTab);
    if (norm === 'embroidery') setActiveCategory('Embroidery');
    else if (norm === 'vector-art') setActiveCategory('Vector Art');
    else if (norm === 'patches') setActiveCategory('Custom Patches');
    else setActiveCategory('All');
  }, [activeHomeServiceTab]);

  const portfolioItems = portfolioSamples || [];

  const combinedItems = portfolioItems
    .filter(item => item.is_active !== false)
    .map(item => ({
      ...item,
      mappedCategory: (item.category || '').toLowerCase().includes('vector') ? 'Vector Art' 
                    : (item.category || '').toLowerCase().includes('patch') ? 'Custom Patches' 
                    : 'Embroidery',
      image: item.digitized_image || item.original_image || item.after_img || item.before_img || item.afterImg || item.image || 'https://qkgvgrscjlijajuzouke.supabase.co/storage/v1/object/public/portfolio-images/showcase-gallery/c41fb095-1b51-45b2-8990-30c9232002d8.png'
    }))
    .filter(item => Boolean(item.image) && !item.image.includes('unsplash.com'));

  const filteredItems = activeCategory === 'All'
    ? combinedItems
    : combinedItems.filter(item => item.mappedCategory === activeCategory);

  return (
    <section style={{ backgroundColor: 'var(--bg-main)', padding: '5.5rem 0', fontFamily: 'var(--font-body, "Inter", sans-serif)', borderTop: '1px solid var(--border-color)' }}>
      <div className="container">
        
        {/* Header */}
        <div style={{ textAlign: 'center', maxWidth: '750px', margin: '0 auto 3.5rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.35rem 0.95rem',
            backgroundColor: 'var(--orange-50, #fff7ed)',
            color: 'var(--orange-700, #c2410c)',
            border: '1px solid var(--orange-200)',
            borderRadius: '9999px',
            fontSize: '0.85rem',
            fontWeight: '800',
            marginBottom: '1rem',
            letterSpacing: '0.08em',
            textTransform: 'uppercase'
          }}>
            <Sparkles size={15} /> {badgeText}
          </div>
          <h2 style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 'clamp(2rem, 3.5vw, 2.75rem)',
            fontWeight: '900',
            color: 'var(--navy-950, #0f172a)',
            marginBottom: '1rem',
            lineHeight: '1.2',
            letterSpacing: '-0.02em'
          }}>
            {titleText}
          </h2>
          <p style={{
            fontSize: '1.1rem',
            color: 'var(--text-muted, #64748b)',
            lineHeight: '1.65'
          }}>
            {subText}
          </p>
        </div>

        {/* Grid using Pure CSS Responsive Grid */}
        <div className="grid-responsive-3" style={{ marginBottom: '3.5rem' }}>
          {filteredItems.slice(0, 6).map((item) => {
            const isHovered = hoveredId === item.id;
            return (
              <div
                key={item.id}
                onMouseEnter={() => setHoveredId(item.id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => navigate(`/portfolio`)}
                style={{
                  position: 'relative',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  aspectRatio: '4/3',
                  boxShadow: isHovered 
                    ? 'var(--shadow-xl)' 
                    : 'var(--shadow-sm)',
                  transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                  transform: isHovered ? 'translateY(-6px)' : 'none',
                  cursor: 'pointer',
                  border: isHovered ? '1px solid var(--orange-400)' : '1px solid var(--border-color)',
                  background: '#0f172a'
                }}
              >
                {/* Background Image */}
                <img 
                  src={item.image} 
                  alt={item.title}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    transition: 'transform 0.7s ease',
                    transform: isHovered ? 'scale(1.08)' : 'scale(1)',
                  }}
                />

                {/* Overlays */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: isHovered 
                    ? 'linear-gradient(to top, rgba(15, 23, 42, 0.92) 0%, rgba(15, 23, 42, 0.4) 50%, rgba(15, 23, 42, 0.1) 100%)' 
                    : 'linear-gradient(to top, rgba(15, 23, 42, 0.8) 0%, rgba(15, 23, 42, 0) 60%)',
                  transition: 'background 0.4s ease',
                  zIndex: 1,
                  pointerEvents: 'none'
                }} />

                {/* Category Badge (Top Left) */}
                <div style={{
                  position: 'absolute',
                  top: '14px',
                  left: '14px',
                  zIndex: 2,
                  padding: '5px 12px',
                  backgroundColor: 'rgba(255, 255, 255, 0.92)',
                  backdropFilter: 'blur(8px)',
                  borderRadius: '8px',
                  fontSize: '0.75rem',
                  fontWeight: '800',
                  color: 'var(--navy-950, #0f172a)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                  pointerEvents: 'none'
                }}>
                  {item.mappedCategory === 'Embroidery' && <Layers size={13} style={{ color: 'var(--orange-500)' }} />}
                  {item.mappedCategory === 'Vector Art' && <PenTool size={13} style={{ color: 'var(--orange-500)' }} />}
                  {item.mappedCategory === 'Custom Patches' && <Hexagon size={13} style={{ color: 'var(--orange-500)' }} />}
                  {item.mappedCategory}
                </div>

                {/* Title and Details (Bottom) */}
                <div style={{
                  position: 'absolute',
                  bottom: '0',
                  left: '0',
                  right: '0',
                  padding: '20px',
                  zIndex: 2,
                  transform: isHovered ? 'translateY(0)' : 'translateY(12px)',
                  transition: 'transform 0.3s ease',
                  pointerEvents: 'none'
                }}>
                  <h3 style={{
                    color: '#ffffff',
                    fontFamily: 'var(--font-heading)',
                    fontSize: '1.15rem',
                    fontWeight: '800',
                    marginBottom: '4px',
                    textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                    margin: 0
                  }}>
                    {item.title}
                  </h3>
                  
                  <div style={{
                    opacity: isHovered ? 1 : 0.8,
                    transition: 'opacity 0.3s ease',
                    color: '#cbd5e1',
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    marginTop: '4px'
                  }}>
                    {item.details || 'Precision Production'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredItems.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
            <p style={{ fontSize: '1.1rem', fontWeight: 500 }}>No portfolio items available in this category yet.</p>
          </div>
        )}

        {/* CTA Button */}
        {filteredItems.length > 0 && (
          <div style={{ textAlign: 'center' }}>
            <button
              className="btn btn-outline btn-lg"
              onClick={() => navigate('/portfolio')}
              style={{
                fontSize: '1rem',
                fontWeight: 800,
                padding: '0.85rem 2.25rem'
              }}
            >
              View Full Portfolio
              <ArrowRight size={18} />
            </button>
          </div>
        )}

      </div>
    </section>
  );
};

