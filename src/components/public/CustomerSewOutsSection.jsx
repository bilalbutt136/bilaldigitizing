'use client';

import React, { useState } from 'react';
import { useAppState } from '../../context/StateContext';
import { Sparkles } from 'lucide-react';

export const CustomerSewOutsSection = () => {
  const { 
    activeHomeServiceTab = 'embroidery', 
    serviceCmsContent = {},
    sewOuts = [],
    portfolioSamples = []
  } = useAppState();
  
  const [isMounted, setIsMounted] = useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  const currentKey = activeHomeServiceTab === 'patches' ? 'patch' : (activeHomeServiceTab || 'embroidery');
  const cmsShowcase = isMounted ? (serviceCmsContent[currentKey]?.showcase || {}) : {};

  const showcaseTitle = cmsShowcase.title || (
    currentKey === 'vector' ? 'Vector Art Redrawing & Separation Showcase' :
    currentKey === 'patch' ? 'Physical Custom Patches & Goods Showcase' :
    'Embroidery Sew-Outs & Stitch Quality Showcase'
  );

  const showcaseSubtext = cmsShowcase.subtext || (
    currentKey === 'vector' ? 'Low-res raster JPEGs converted into resolution-independent Adobe Illustrator vector node paths.' :
    currentKey === 'patch' ? 'Custom embroidered, woven, PVC rubber, and genuine leather emblems delivered nationwide.' :
    'Real stitch-outs delivered to 3,900+ commercial embroidery shops and apparel decorators. Clean pathing, crisp satin fills, and zero thread breaks.'
  );

  const serviceCategoryMap = {
    'embroidery': 'Embroidery',
    'vector': 'Vector',
    'patch': 'Patches',
    'patches': 'Patches'
  };
  const mappedCategory = serviceCategoryMap[currentKey] || 'Embroidery';

  // 1. Gather all active database samples from sewOuts and portfolio database
  const combinedDbSamples = React.useMemo(() => {
    const fromSewOuts = (sewOuts || []).filter(s => s.is_active !== false).map(s => ({
      id: s.id,
      title: s.title,
      category: s.category === 'general' ? mappedCategory : (s.category || mappedCategory),
      stitches: s.stitch_count || 'Varies',
      formats: s.formats || 'DST, EMB',
      image: s.after_img || s.before_img || s.afterImg || s.beforeImg
    }));

    const fromPortfolio = (portfolioSamples || []).filter(p => {
      if (p.is_active === false) return false;
      const cat = (p.category || '').toLowerCase();
      if (currentKey === 'vector') return cat.includes('vector');
      if (currentKey === 'patch' || currentKey === 'patches') return cat.includes('patch');
      return cat.includes('embroid') || cat === 'general' || !cat;
    }).map(p => ({
      id: p.id,
      title: p.title,
      category: p.category || mappedCategory,
      stitches: p.stitch_count || p.stitchCount || (currentKey === 'vector' ? 'Scalable Vector' : 'Precision Stitching'),
      formats: p.formats || (currentKey === 'vector' ? 'AI, EPS, SVG' : 'DST, PES, EMB'),
      image: p.digitized_image || p.digitizedImage || p.afterImg || p.after_img || p.image || p.original_image
    }));

    const merged = [...fromSewOuts, ...fromPortfolio].filter(item => Boolean(item.image));
    return merged;
  }, [sewOuts, portfolioSamples, currentKey, mappedCategory]);

  const samplesList = combinedDbSamples;

  return (
    <section id="sew-outs" style={{ padding: '5rem 0', background: 'var(--bg-main)', borderBottom: '1px solid var(--border-color)' }}>
      <div className="container">
        
        {/* Section Header */}
        <div style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto 3.5rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            background: 'var(--orange-50)',
            border: '1.5px solid var(--orange-200)',
            color: 'var(--orange-700)',
            fontWeight: 800,
            fontSize: '0.85rem',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            padding: '0.35rem 0.95rem',
            borderRadius: '9999px',
            marginBottom: '0.85rem'
          }}>
            <Sparkles size={16} /> Verified Machine Precision
          </div>

          <h2 style={{ fontSize: '2.5rem', color: 'var(--navy-900)', marginBottom: '0.85rem', fontWeight: 800 }}>
            {showcaseTitle}
          </h2>

          <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', lineHeight: 1.65, margin: 0 }}>
            {showcaseSubtext}
          </p>
        </div>

        {/* 3-Column Product Cards Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '2rem',
          marginBottom: '3rem'
        }}>
          {samplesList.map((item) => (
            <div 
              key={item.id}
              style={{
                background: 'var(--bg-card, #ffffff)',
                border: '1px solid var(--border-color, #e2e8f0)',
                borderRadius: '16px',
                overflow: 'hidden',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05)',
                display: 'flex',
                flexDirection: 'column',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-6px)';
                e.currentTarget.style.boxShadow = '0 12px 24px -8px rgba(255, 122, 0, 0.15)';
                e.currentTarget.style.borderColor = 'var(--orange-200, #fed7aa)';
                const img = e.currentTarget.querySelector('img');
                if (img) img.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05)';
                e.currentTarget.style.borderColor = 'var(--border-color, #e2e8f0)';
                const img = e.currentTarget.querySelector('img');
                if (img) img.style.transform = 'scale(1)';
              }}
            >
              <div style={{ position: 'relative', aspectRatio: '4/3', overflow: 'hidden', backgroundColor: 'var(--navy-950)' }}>
                {item.image ? (
                  <img 
                    src={item.image} 
                    alt={item.title || 'Work Showcase Sample'}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)' }}
                  />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                    <Sparkles size={28} />
                  </div>
                )}
                
                {/* Overlay gradient for premium feel */}
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(to top, rgba(15, 23, 42, 0.4) 0%, transparent 40%)',
                  pointerEvents: 'none'
                }} />

                {/* Category Badge Top Right */}
                <div style={{
                  position: 'absolute',
                  top: '1rem',
                  right: '1rem',
                  background: 'var(--bg-card, #ffffff)',
                  color: 'var(--navy-950)',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  padding: '0.4rem 0.8rem',
                  borderRadius: '9999px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  zIndex: 2
                }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--orange-500)' }} />
                  {item.category}
                </div>
              </div>

              <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
                <h3 style={{ 
                  fontSize: '1.125rem', 
                  fontWeight: 800, 
                  color: 'var(--navy-950)', 
                  margin: '0 0 0.75rem 0',
                  lineHeight: 1.3
                }}>
                  {item.title}
                </h3>
                
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  marginTop: 'auto',
                  paddingTop: '1rem',
                  borderTop: '1px solid var(--border-color, #e2e8f0)'
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Details
                    </span>
                    <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--navy-800)' }}>
                      {item.stitchCount || item.stitches || 'N/A'}
                    </span>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', alignItems: 'flex-end' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Formats
                    </span>
                    <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--navy-800)' }}>
                      {item.formats}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
