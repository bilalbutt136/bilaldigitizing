'use client';

import React, { useState, useEffect } from 'react';
import { useNavigate } from '../../utils/navigation';
import { useAppState } from '../../context/StateContext';
import { 
  Sparkles, 
  ArrowRight, 
  ChevronRight, 
  Zap, 
  Maximize2, 
  X, 
  CheckCircle2, 
  UploadCloud,
  Eye,
  Layers,
  PenTool,
  Tag,
  ShieldCheck,
  FileCheck
} from 'lucide-react';

const CATEGORIES = [
  { key: 'all', label: 'All Projects', icon: Sparkles },
  { key: 'embroidery', label: 'Embroidery Digitizing', icon: Layers },
  { key: 'vector', label: 'Vector Art Conversion', icon: PenTool },
  { key: 'patches', label: 'Custom Patches', icon: Tag }
];

export const PortfolioPage = () => {
  const navigate = useNavigate();
  const { portfolioSamples = [], openOrderWizard, protectedNavigate } = useAppState();

  const [activeFilter, setActiveFilter] = useState('all');
  const [activeItemModal, setActiveItemModal] = useState(null);
  const [showOriginalInModal, setShowOriginalInModal] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  // Normalize and parse items from database
  const combinedItems = (portfolioSamples || [])
    .filter(s => s.is_active !== false)
    .map((s, idx) => {
      const catLower = (s.category || '').toLowerCase();
      const mappedCategoryKey = catLower.includes('vector') ? 'vector' : catLower.includes('patch') ? 'patches' : 'embroidery';
      const mappedCategoryLabel = mappedCategoryKey === 'vector' ? 'Vector Art Redraw' : mappedCategoryKey === 'patches' ? 'Custom Patches' : 'Embroidery Digitizing';
      const finishedImg = s.digitized_image || s.digitizedImage || s.afterImg || s.after_img || s.image || s.original_image || '';
      const beforeImg = s.original_image || s.originalImage || s.beforeImg || s.before_img || '';

      return {
        id: s.id || `portfolio-${idx}`,
        categoryKey: mappedCategoryKey,
        categoryLabel: mappedCategoryLabel,
        title: s.title || 'Custom Studio Artwork',
        description: s.description || 'Precision commercial digitized file pathing and smooth production foundation.',
        afterImg: finishedImg,
        beforeImg: beforeImg,
        stitchCount: s.stitch_count || s.stitchCount || (mappedCategoryKey === 'embroidery' ? 'Commercial Density' : ''),
        colors: s.colors || (mappedCategoryKey === 'vector' ? 'Pantone Spot Colors' : 'Standard Thread Colors'),
        formats: typeof s.formats === 'string' ? s.formats : (Array.isArray(s.formats) ? s.formats.join(', ') : (mappedCategoryKey === 'vector' ? 'AI, EPS, SVG, PDF' : 'DST, PES, EMB')),
        clientType: s.client_type || s.clientType || 'Commercial Client'
      };
    })
    .filter(item => Boolean(item.afterImg));

  const filteredItems = activeFilter === 'all' 
    ? combinedItems 
    : combinedItems.filter(item => item.categoryKey === activeFilter);

  const handleStartOrder = (item) => {
    setActiveItemModal(null);
    const serviceType = item.categoryKey === 'patches' ? 'patch' : item.categoryKey === 'vector' ? 'vector' : 'embroidery';
    if (openOrderWizard) {
      openOrderWizard({
        type: serviceType,
        category: item.categoryLabel,
        title: item.title
      });
    } else {
      protectedNavigate('customer', true, { type: serviceType });
    }
  };

  return (
    <div style={{ background: 'var(--bg-main, #f8fafc)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* 1. Page Header Banner */}
      <section style={{
        background: 'linear-gradient(135deg, var(--navy-950, #0f172a) 0%, #0b1329 60%, #1e1b4b 100%)',
        color: '#ffffff',
        padding: '3.5rem 0 3rem',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Ambient Glows */}
        <div style={{
          position: 'absolute',
          top: '-15%',
          right: '-5%',
          width: '500px',
          height: '500px',
          background: 'radial-gradient(circle, rgba(249, 115, 22, 0.15) 0%, transparent 65%)',
          pointerEvents: 'none'
        }} />

        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          {/* Breadcrumbs */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem', 
            fontSize: '0.85rem', 
            color: '#94a3b8', 
            marginBottom: '1.25rem' 
          }}>
            <button 
              onClick={() => navigate('/')} 
              style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 0, fontWeight: 600 }}
            >
              Home
            </button>
            <ChevronRight size={14} />
            <span style={{ color: 'var(--orange-400)', fontWeight: 700 }}>Portfolio Showcase</span>
          </div>

          <div style={{ maxWidth: '820px' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: 'rgba(249, 115, 22, 0.15)',
              border: '1px solid rgba(249, 115, 22, 0.35)',
              color: 'var(--orange-400)',
              fontWeight: 800,
              fontSize: '0.825rem',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              padding: '0.35rem 0.95rem',
              borderRadius: '9999px',
              marginBottom: '1rem'
            }}>
              <Sparkles size={15} /> Commercial Production Gallery
            </div>

            <h1 style={{
              fontSize: 'clamp(2.2rem, 3.5vw, 3rem)',
              fontWeight: 900,
              color: '#ffffff',
              lineHeight: 1.15,
              marginBottom: '0.85rem',
              letterSpacing: '-0.02em',
              fontFamily: 'var(--font-heading)'
            }}>
              Real Production Sew-Outs & Vector Art Gallery
            </h1>

            <p style={{
              fontSize: '1.1rem',
              color: '#94a3b8',
              lineHeight: 1.6,
              margin: 0
            }}>
              Explore verified commercial embroidery stitch-outs, crisp scalable vector conversions, and physical custom patches created for apparel brands and embroidery shops worldwide.
            </p>
          </div>
        </div>
      </section>

      {/* 2. Main Content & Category Switcher */}
      <section style={{ padding: '3.5rem 0 5rem', flex: 1 }}>
        <div className="container">
          
          {/* Category Filter Tabs */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '3rem' }}>
            <div style={{
              display: 'inline-flex',
              background: 'var(--color-surface, #ffffff)',
              border: '1.5px solid var(--border-color)',
              padding: '0.35rem',
              borderRadius: '9999px',
              boxShadow: 'var(--shadow-sm)',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: '0.25rem'
            }}>
              {CATEGORIES.map(cat => {
                const IconComp = cat.icon;
                const isSelected = activeFilter === cat.key;
                const count = cat.key === 'all' 
                  ? combinedItems.length 
                  : combinedItems.filter(i => i.categoryKey === cat.key).length;

                return (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => setActiveFilter(cat.key)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.6rem 1.35rem',
                      borderRadius: '9999px',
                      border: 'none',
                      background: isSelected 
                        ? 'linear-gradient(135deg, var(--orange-500) 0%, var(--orange-600) 100%)' 
                        : 'transparent',
                      color: isSelected ? '#ffffff' : 'var(--color-text-secondary)',
                      fontWeight: isSelected ? 800 : 600,
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      boxShadow: isSelected ? '0 4px 12px var(--color-primary-glow)' : 'none'
                    }}
                  >
                    <IconComp size={15} />
                    <span>{cat.label}</span>
                    <span style={{
                      background: isSelected ? 'rgba(255, 255, 255, 0.25)' : '#f1f5f9',
                      color: isSelected ? '#ffffff' : '#64748b',
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      padding: '0.1rem 0.45rem',
                      borderRadius: '9999px'
                    }}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Portfolio Grid */}
          {filteredItems.length === 0 ? (
            <div className="card" style={{ padding: '4rem 2rem', textAlign: 'center', background: '#ffffff', border: '1.5px dashed var(--border-color)', borderRadius: '20px', maxWidth: '600px', margin: '0 auto' }}>
              <Sparkles size={40} style={{ color: 'var(--orange-500)', margin: '0 auto 1rem' }} />
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--navy-900)', marginBottom: '0.5rem' }}>
                Curating New Projects
              </h3>
              <p style={{ fontSize: '0.925rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                Our master digitizers are currently finalizing new production sew-outs for this category. Check back soon or request a custom sample for your logo.
              </p>
              <button
                type="button"
                className="btn btn-primary-orange btn-md"
                onClick={() => navigate('/order')}
              >
                Request Custom Sample
              </button>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 290px), 1fr))',
              gap: '1.5rem'
            }}>
              {filteredItems.map((item) => {
                const isVector = item.categoryKey === 'vector';
                const isPatch = item.categoryKey === 'patches';
                const badgeBg = isVector ? 'rgba(6, 182, 212, 0.12)' : isPatch ? 'rgba(168, 85, 247, 0.12)' : 'rgba(249, 115, 22, 0.12)';
                const badgeColor = isVector ? '#0891b2' : isPatch ? '#9333ea' : '#ea580c';

                return (
                  <div
                    key={item.id}
                    className="card"
                    onClick={() => {
                      setShowOriginalInModal(false);
                      setActiveItemModal(item);
                    }}
                    style={{
                      background: 'var(--color-surface, var(--bg-card))',
                      border: '1px solid var(--border-color)',
                      borderRadius: '20px',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                      boxShadow: 'var(--shadow-sm)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-6px)';
                      e.currentTarget.style.boxShadow = 'var(--shadow-xl)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                    }}
                  >
                    <div>
                      {/* Image Box */}
                      <div style={{
                        position: 'relative',
                        width: '100%',
                        height: '240px',
                        background: 'radial-gradient(circle at center, #1e293b 0%, #090d16 100%)',
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <img
                          src={item.afterImg}
                          alt={item.title}
                          style={{
                            maxWidth: '100%',
                            maxHeight: '100%',
                            objectFit: 'contain',
                            transition: 'transform 0.4s ease'
                          }}
                        />

                        {/* Top Category Badge */}
                        <div style={{ position: 'absolute', top: '12px', left: '12px' }}>
                          <span style={{
                            background: 'rgba(249, 115, 22, 0.12)',
                            color: '#ea580c',
                            border: '1px solid #ea580c40',
                            fontSize: '0.725rem',
                            fontWeight: 800,
                            padding: '0.3rem 0.75rem',
                            borderRadius: '9999px',
                            backdropFilter: 'blur(8px)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.06em'
                          }}>
                            {item.categoryLabel}
                          </span>
                        </div>

                        {/* Inspect Zoom Icon */}
                        <div style={{
                          position: 'absolute',
                          top: '12px',
                          right: '12px',
                          background: 'rgba(15, 23, 42, 0.75)',
                          color: '#ffffff',
                          borderRadius: '50%',
                          width: '32px',
                          height: '32px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backdropFilter: 'blur(6px)'
                        }}>
                          <Maximize2 size={15} />
                        </div>
                      </div>

                      {/* Content Info */}
                      <div style={{ padding: '1.5rem' }}>
                        <h3 style={{
                          fontSize: '1.15rem',
                          fontWeight: 800,
                          color: 'var(--color-text-primary)',
                          margin: '0 0 0.5rem',
                          lineHeight: 1.3
                        }}>
                          {item.title}
                        </h3>

                        <p style={{
                          fontSize: '0.875rem',
                          color: 'var(--color-text-muted)',
                          lineHeight: 1.55,
                          margin: '0 0 1rem',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden'
                        }}>
                          {item.description}
                        </p>

                        {/* Tags Pill Bar */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
                          {item.stitchCount && (
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, background: 'var(--color-subtle)', color: 'var(--color-text-secondary)', padding: '0.25rem 0.6rem', borderRadius: '6px' }}>
                              ⚡ {item.stitchCount}
                            </span>
                          )}
                          {item.formats && (
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, background: 'var(--color-subtle)', color: 'var(--color-text-secondary)', padding: '0.25rem 0.6rem', borderRadius: '6px' }}>
                              📁 {item.formats}
                            </span>
                          )}
                          {item.beforeImg && (
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', padding: '0.25rem 0.6rem', borderRadius: '6px' }}>
                              ✓ Before & After
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Card Footer Button */}
                    <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border-color)', background: 'var(--color-subtle, var(--bg-subtle))', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>
                        {item.clientType}
                      </span>
                      <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        Inspect Project <ArrowRight size={14} />
                      </span>
                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </div>
      </section>

      {/* 3. Interactive Modal Preview */}
      {activeItemModal && (
        <div 
          className="modal-overlay" 
          onClick={() => setActiveItemModal(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.8)',
            backdropFilter: 'blur(8px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem'
          }}
        >
          <div 
            className="modal-dialog"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--color-surface, var(--bg-card))',
              borderRadius: '24px',
              maxWidth: '900px',
              width: '100%',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-xl)',
              display: 'grid',
              gridTemplateColumns: '1.2fr 1fr',
              border: '1px solid var(--border-color)'
            }}
          >
            {/* Left Side: Big Image Display */}
            <div style={{
              background: 'radial-gradient(circle at center, #1e293b 0%, #090d16 100%)',
              padding: '2rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative'
            }}>
              <img 
                src={showOriginalInModal && activeItemModal.beforeImg ? activeItemModal.beforeImg : activeItemModal.afterImg} 
                alt={activeItemModal.title}
                style={{
                  maxWidth: '100%',
                  maxHeight: '400px',
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.4))'
                }}
              />

              {/* Before/After Switcher (if exists) */}
              {activeItemModal.beforeImg && (
                <div style={{
                  position: 'absolute',
                  bottom: '20px',
                  display: 'flex',
                  background: 'rgba(15, 23, 42, 0.85)',
                  padding: '4px',
                  borderRadius: '9999px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(8px)'
                }}>
                  <button
                    type="button"
                    onClick={() => setShowOriginalInModal(false)}
                    style={{
                      padding: '0.4rem 1rem',
                      borderRadius: '9999px',
                      border: 'none',
                      background: !showOriginalInModal ? 'var(--orange-500)' : 'transparent',
                      color: '#ffffff',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Digitized Result
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowOriginalInModal(true)}
                    style={{
                      padding: '0.4rem 1rem',
                      borderRadius: '9999px',
                      border: 'none',
                      background: showOriginalInModal ? 'var(--orange-500)' : 'transparent',
                      color: '#ffffff',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Original Artwork
                  </button>
                </div>
              )}
            </div>

            {/* Right Side: Specifications & Order Action */}
            <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: 'var(--color-surface, var(--bg-card))' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <span style={{
                    background: 'var(--color-primary-light)',
                    color: 'var(--color-primary)',
                    border: '1px solid var(--color-border)',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    padding: '0.3rem 0.75rem',
                    borderRadius: '9999px',
                    textTransform: 'uppercase'
                  }}>
                    {activeItemModal.categoryLabel}
                  </span>

                  <button
                    type="button"
                    onClick={() => setActiveItemModal(null)}
                    style={{ background: 'var(--color-subtle)', color: 'var(--color-text-primary)', border: 'none', borderRadius: '8px', padding: '0.4rem', cursor: 'pointer' }}
                  >
                    <X size={18} />
                  </button>
                </div>

                <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--color-text-primary)', margin: '0 0 0.75rem', lineHeight: 1.25 }}>
                  {activeItemModal.title}
                </h2>

                <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', lineHeight: 1.6, margin: '0 0 1.5rem' }}>
                  {activeItemModal.description}
                </p>

                {/* Technical Specifications Grid */}
                <div style={{ background: 'var(--color-subtle, var(--bg-subtle))', padding: '1.25rem', borderRadius: '16px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                  
                  {activeItemModal.stitchCount && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                      <span style={{ color: 'var(--color-text-muted)', fontWeight: 600 }}>Stitch Density:</span>
                      <strong style={{ color: 'var(--color-text-primary)' }}>{activeItemModal.stitchCount}</strong>
                    </div>
                  )}

                  {activeItemModal.formats && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                      <span style={{ color: 'var(--color-text-muted)', fontWeight: 600 }}>Formats Included:</span>
                      <strong style={{ color: 'var(--color-text-primary)' }}>{activeItemModal.formats}</strong>
                    </div>
                  )}

                  {activeItemModal.colors && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                      <span style={{ color: 'var(--color-text-muted)', fontWeight: 600 }}>Thread & Color:</span>
                      <strong style={{ color: 'var(--color-text-primary)' }}>{activeItemModal.colors}</strong>
                    </div>
                  )}

                  {activeItemModal.clientType && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                      <span style={{ color: 'var(--color-text-muted)', fontWeight: 600 }}>Application:</span>
                      <strong style={{ color: 'var(--color-text-primary)' }}>{activeItemModal.clientType}</strong>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Quality Guarantee:</span>
                    <strong style={{ color: '#059669', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <ShieldCheck size={15} /> 100% Machine Tested
                    </strong>
                  </div>
                </div>
              </div>

              {/* Order Button */}
              <div>
                <button
                  type="button"
                  className="btn btn-primary-orange btn-lg"
                  onClick={() => handleStartOrder(activeItemModal)}
                  style={{ width: '100%', fontWeight: 800, padding: '0.9rem', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                >
                  <UploadCloud size={18} />
                  <span>Order Design Like This</span>
                  <ArrowRight size={18} />
                </button>
                <div style={{ textAlign: 'center', fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.6rem' }}>
                  Free Unlimited Revisions · 4–12 Hour Turnaround
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default PortfolioPage;
