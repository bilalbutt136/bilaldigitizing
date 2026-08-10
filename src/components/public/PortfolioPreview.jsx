'use client';

import React, { useState, useEffect } from 'react';
import { ArrowRight, Layers, PenTool, Hexagon } from 'lucide-react';
import { useAppState } from '../../context/StateContext';
import { useNavigate } from '../../utils/navigation';

export const PortfolioPreview = () => {
  const { portfolioSamples, activeHomeServiceTab, serviceCmsContent } = useAppState();
  
  const rawCategories = serviceCmsContent?.['portfolio_categories'] || [
    { key: 'all', label: 'All Portfolio' },
    { key: 'embroidery', label: 'Embroidery Digitizing' },
    { key: 'vector', label: 'Vector Art Conversion' },
    { key: 'patches', label: 'Custom Patches' }
  ];
  const categories = rawCategories.map(c => c.label);
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState('All');
  const [hoveredId, setHoveredId] = useState(null);

  useEffect(() => {
    if (activeHomeServiceTab === 'embroidery') setActiveCategory('Embroidery');
    else if (activeHomeServiceTab === 'vector') setActiveCategory('Vector Art');
    else if (activeHomeServiceTab === 'patch' || activeHomeServiceTab === 'patches') setActiveCategory('Custom Patches');
    else setActiveCategory('All');
  }, [activeHomeServiceTab]);
  
  // Responsive grid logic
  const [columns, setColumns] = useState(3);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setColumns(1);
      } else if (window.innerWidth < 1024) {
        setColumns(2);
      } else {
        setColumns(3);
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const portfolioItems = portfolioSamples || [];

  const combinedItems = portfolioItems.map(item => ({
    ...item,
    mappedCategory: (item.category || '').toLowerCase().includes('vector') ? 'Vector Art' 
                  : (item.category || '').toLowerCase().includes('patch') ? 'Custom Patches' 
                  : 'Embroidery'
  }));

  const filteredItems = activeCategory === 'All'
    ? combinedItems
    : combinedItems.filter(item => item.mappedCategory === activeCategory);

  return (
    <section style={{ backgroundColor: '#ffffff', padding: '80px 20px', fontFamily: 'var(--font-body, "Inter", sans-serif)' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div style={{
            display: 'inline-block',
            padding: '6px 16px',
            backgroundColor: 'var(--orange-50, #fff7ed)',
            color: 'var(--orange-600, #e66e00)',
            borderRadius: '9999px',
            fontSize: '14px',
            fontWeight: '600',
            marginBottom: '16px',
            letterSpacing: '0.05em',
            textTransform: 'uppercase'
          }}>
            Our Work
          </div>
          <h2 style={{
            fontFamily: 'var(--font-heading, "Plus Jakarta Sans", sans-serif)',
            fontSize: 'clamp(32px, 5vw, 48px)',
            fontWeight: '700',
            color: 'var(--navy-950, #0f172a)',
            marginBottom: '16px',
            lineHeight: '1.2'
          }}>
            Crafted with Precision
          </h2>
          <p style={{
            fontSize: '18px',
            color: 'var(--text-muted, #64748b)',
            maxWidth: '600px',
            margin: '0 auto',
            lineHeight: '1.6'
          }}>
            Explore a curated selection of our finest embroidery digitizing, vector art conversions, and custom patch creations.
          </p>
        </div>

        {/* Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          gap: '24px',
          marginBottom: '48px'
        }}>
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
                  borderRadius: '12px',
                  overflow: 'hidden',
                  aspectRatio: '4/3',
                  boxShadow: isHovered 
                    ? '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' 
                    : '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  transform: isHovered ? 'scale(1.03)' : 'scale(1)',
                  cursor: 'pointer',
                  border: isHovered ? '1px solid var(--orange-400, #ff9433)' : '1px solid transparent',
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
                    transform: isHovered ? 'scale(1.1)' : 'scale(1)',
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
                    ? 'linear-gradient(to top, rgba(15, 23, 42, 0.9) 0%, rgba(15, 23, 42, 0.4) 50%, rgba(15, 23, 42, 0.1) 100%)' 
                    : 'linear-gradient(to top, rgba(15, 23, 42, 0.8) 0%, rgba(15, 23, 42, 0) 60%)',
                  transition: 'background 0.4s ease',
                  zIndex: 1,
                  pointerEvents: 'none'
                }} />

                {/* Category Badge (Top Left) */}
                <div style={{
                  position: 'absolute',
                  top: '16px',
                  left: '16px',
                  zIndex: 2,
                  padding: '6px 12px',
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  backdropFilter: 'blur(4px)',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: 'var(--navy-950, #0f172a)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  pointerEvents: 'none'
                }}>
                  {item.mappedCategory === 'Embroidery' && <Layers size={14} style={{ color: 'var(--orange-500, #ff7a00)' }} />}
                  {item.mappedCategory === 'Vector Art' && <PenTool size={14} style={{ color: 'var(--orange-500, #ff7a00)' }} />}
                  {item.mappedCategory === 'Custom Patches' && <Hexagon size={14} style={{ color: 'var(--orange-500, #ff7a00)' }} />}
                  {item.mappedCategory}
                </div>

                {/* Title and Details (Bottom) */}
                <div style={{
                  position: 'absolute',
                  bottom: '0',
                  left: '0',
                  right: '0',
                  padding: '24px',
                  zIndex: 2,
                  transform: isHovered ? 'translateY(0)' : 'translateY(24px)',
                  transition: 'transform 0.4s ease',
                  pointerEvents: 'none'
                }}>
                  <h3 style={{
                    color: '#ffffff',
                    fontFamily: 'var(--font-heading, "Plus Jakarta Sans", sans-serif)',
                    fontSize: '20px',
                    fontWeight: '700',
                    marginBottom: '8px',
                    textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                    margin: 0
                  }}>
                    {item.title}
                  </h3>
                  
                  <div style={{
                    opacity: isHovered ? 1 : 0,
                    transition: 'opacity 0.4s ease',
                    transitionDelay: isHovered ? '0.1s' : '0s',
                    color: 'rgba(255, 255, 255, 0.8)',
                    fontSize: '14px',
                    fontWeight: '500',
                    marginTop: '8px'
                  }}>
                    {item.details || 'Premium Quality'}
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
              onClick={() => navigate('/portfolio')}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--orange-500, #ff7a00)';
                e.currentTarget.style.color = '#ffffff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = 'var(--orange-500, #ff7a00)';
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '14px 32px',
                border: '2px solid var(--orange-500, #ff7a00)',
                borderRadius: '8px',
                backgroundColor: 'transparent',
                color: 'var(--orange-500, #ff7a00)',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                fontFamily: 'var(--font-body, "Inter", sans-serif)'
              }}
            >
              View Full Portfolio
              <ArrowRight size={20} />
            </button>
          </div>
        )}

      </div>
    </section>
  );
};
