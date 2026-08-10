'use client';

import React, { useState } from 'react';
import { useAppState } from '../../context/StateContext';
import { Sparkles } from 'lucide-react';

export const CustomerSewOutsSection = () => {
  const { 
    activeHomeServiceTab = 'embroidery', 
    serviceCmsContent = {},
    sewOuts = []
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

  const serviceCategoryMap = {
    'embroidery': 'Embroidery',
    'vector': 'Vector',
    'patch': 'Patches',
    'patches': 'Patches'
  };
  const mappedCategory = serviceCategoryMap[currentKey] || 'Embroidery';

  // Default to showing active sew outs, regardless of category since the CMS doesn't assign specific categories yet.
  const dynamicSamples = sewOuts.filter(s => s.is_active !== false);

  const samplesList = dynamicSamples.length > 0 
    ? dynamicSamples.map(s => ({
        id: s.id,
        title: s.title,
        category: s.category === 'general' ? mappedCategory : (s.category || mappedCategory),
        stitches: s.stitch_count || 'Varies',
        formats: s.formats || 'DST, EMB',
        image: s.after_img || s.before_img || s.afterImg || s.beforeImg
      }))
    : (cmsShowcase.samples && cmsShowcase.samples.length > 0 ? cmsShowcase.samples : (
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
    ));

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
                <img 
                  src={item.image || item.afterImg || item.beforeImg || categoryFallback} 
                  alt={item.title || 'Work Showcase Sample'}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)' }}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = categoryFallback;
                  }}
                />
                
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
