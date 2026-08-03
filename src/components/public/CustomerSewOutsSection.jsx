'use client';

import React, { useState } from 'react';
import { useAppState } from '../../context/StateContext';
import { Sparkles } from 'lucide-react';

export const CustomerSewOutsSection = () => {
  const { 
    activeHomeServiceTab = 'embroidery', 
    serviceCmsContent = {} 
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
    'Real stitch-outs delivered to 1,200+ commercial embroidery shops and apparel decorators. Clean pathing, crisp satin fills, and zero thread breaks.'
  );

  const samplesList = cmsShowcase.samples && cmsShowcase.samples.length > 0
    ? cmsShowcase.samples
    : (
      currentKey === 'vector' ? [
        { id: 'vec-s1', title: 'Vintage Skull & Rose Vector', category: 'Spot Color Sep', stitches: 'N/A (Scalable Vector)', formats: 'AI, EPS, SVG, PDF', image: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=800&q=80' },
        { id: 'vec-s2', title: 'Wildcat Athletic Team Mascot', category: 'Hand-Drawn Vector', stitches: 'N/A (Scalable Vector)', formats: 'AI, EPS, SVG', image: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=800&q=80' },
        { id: 'vec-s3', title: 'Corporate Shield & Crest Redraw', category: 'Clean AI & SVG', stitches: 'N/A (Scalable Vector)', formats: 'AI, SVG, PDF', image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80' }
      ] :
      currentKey === 'patch' ? [
        { id: 'pat-s1', title: 'Tactical Merrowed Embroidered Patch', category: 'Overlock Edge', stitches: 'High Density Rayon', formats: 'Velcro Backing', image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80' },
        { id: 'pat-s2', title: '3D Molded Rubber PVC Patch', category: 'Tactical PVC', stitches: 'Waterproof Rubber', formats: 'Hook & Loop Backing', image: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80' },
        { id: 'pat-s3', title: 'Laser Debossed Genuine Leather Patch', category: 'Real Leather', stitches: 'Engraved Leather', formats: 'Heat Seal Iron-On', image: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=800&q=80' }
      ] : [
        { id: 'emb-s1', title: 'Golden Eagle Sports Polo', category: 'Left Chest', stitches: '12,450 Stitches', formats: 'DST, PES, EMB, EXP', image: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80' },
        { id: 'emb-s2', title: 'Tactical Flexfit Cap Front', category: '3D Puff Cap', stitches: '15,800 Stitches', formats: 'DST, PES, EMB, JEF', image: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=800&q=80' },
        { id: 'emb-s3', title: 'Heritage Apparel Jacket Crest', category: 'Jacket Back', stitches: '48,200 Stitches', formats: 'DST, PES, EMB, VP3', image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80' }
      ]
    );

  const categoryFallback = currentKey === 'vector' 
    ? 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=800&q=80'
    : currentKey === 'patch'
    ? 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80'
    : 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80';

  return (
    <section id="sew-outs" style={{ padding: '5rem 0', background: '#f8fafc', borderBottom: '1px solid var(--border-color)' }}>
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
              className="card"
              style={{
                background: '#ffffff',
                border: '1.5px solid var(--border-color)',
                borderRadius: 'var(--radius-lg)',
                overflow: 'hidden',
                boxShadow: 'var(--shadow-md)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'all 0.3s ease'
              }}
            >
              <div>
                {/* Image Container with Before vs After Badge */}
                <div className="w-full h-full relative overflow-hidden" style={{ position: 'relative', height: '230px', overflow: 'hidden', background: '#0f172a' }}>
                  <img 
                    src={item.image || item.afterImg || item.beforeImg || categoryFallback} 
                    alt={item.title || 'Work Showcase Sample'}
                    className="w-full h-full object-cover"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s ease' }}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = categoryFallback;
                    }}
                    onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.08)'}
                    onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1.0)'}
                  />

                  {/* Category Pill */}
                  <span style={{
                    position: 'absolute',
                    top: '12px',
                    left: '12px',
                    background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                    border: '1.5px solid #ffffff',
                    color: '#ffffff',
                    fontSize: '0.725rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    padding: '0.35rem 0.85rem',
                    borderRadius: '9999px',
                    boxShadow: '0 4px 14px rgba(249, 115, 22, 0.45)'
                  }}>
                    {item.category}
                  </span>

                  {/* Stitch Count Badge */}
                  <span style={{
                    position: 'absolute',
                    bottom: '12px',
                    right: '12px',
                    background: '#0f172a',
                    border: '1px solid rgba(255, 255, 255, 0.25)',
                    color: '#ffffff',
                    fontSize: '0.725rem',
                    fontWeight: 800,
                    padding: '0.3rem 0.75rem',
                    borderRadius: '9999px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)'
                  }}>
                    ⚡ {item.stitchCount}
                  </span>
                </div>

                {/* Clean Card Caption Body */}
                <div style={{ padding: '1.15rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--navy-900)', margin: '0 0 0.25rem 0' }}>
                      {item.title}
                    </h3>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                      Formats: {item.formats}
                    </div>
                  </div>

                  <span style={{ fontSize: '0.75rem', fontWeight: 800, background: '#ecfdf5', color: '#047857', padding: '0.25rem 0.65rem', borderRadius: '9999px', border: '1px solid #a7f3d0' }}>
                    Verified Sew-Out
                  </span>
                </div>
              </div>

            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
