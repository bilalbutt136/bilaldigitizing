'use client';

import React, { useState, useEffect } from 'react';
import { ArrowRight, Layers, PenTool, Hexagon, Sparkles, Maximize2 } from 'lucide-react';
import { useAppState } from '../../context/StateContext';
import { useNavigate } from '../../utils/navigation';
import { normalizeCategory } from '../../utils/categoryUtils';
import { PortfolioLightboxModal } from '../common/PortfolioLightboxModal';

import { supabase } from '../../lib/supabase/client';

export const PortfolioPreview = () => {
  const { 
    portfolioSamples = [], 
    setPortfolioSamples, 
    activeHomeServiceTab, 
    homePageConfig = {},
    openOrderWizard,
    protectedNavigate 
  } = useAppState();
  
  const [localItems, setLocalItems] = useState(portfolioSamples);
  const [lightboxItem, setLightboxItem] = useState(null);
  const dbSettings = homePageConfig?.settings || {};
  const badgeText = dbSettings.portfolio_badge || 'Our Work';
  const titleText = dbSettings.portfolio_title || 'Crafted with Precision';
  const subText = dbSettings.portfolio_sub || 'Explore a curated selection of our finest embroidery digitizing, vector art conversions, and custom patch creations.';
  
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState('All');
  const [hoveredId, setHoveredId] = useState(null);

  useEffect(() => {
    if (portfolioSamples && portfolioSamples.length > 0) {
      setLocalItems(portfolioSamples);
    }
  }, [portfolioSamples]);

  useEffect(() => {
    let isMounted = true;
    const syncFreshPortfolio = async () => {
      try {
        if (supabase) {
          const { data, error } = await supabase
            .from('portfolio')
            .select('*')
            .order('sort_order', { ascending: true });
          if (!error && data && data.length > 0 && isMounted) {
            setLocalItems(data);
            if (setPortfolioSamples) setPortfolioSamples(data);
            return;
          }
        }
        const res = await fetch(`/api/catalog?action=fetchAll&_t=${Date.now()}`, { cache: 'no-store' });
        const json = await res.json();
        if (json?.portfolio && isMounted) {
          setLocalItems(json.portfolio);
          if (setPortfolioSamples) setPortfolioSamples(json.portfolio);
        }
      } catch {}
    };

    syncFreshPortfolio();

    const handleSync = () => syncFreshPortfolio();
    window.addEventListener('portfolio_updated', handleSync);
    window.addEventListener('storage', handleSync);

    return () => {
      isMounted = false;
      window.removeEventListener('portfolio_updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, [setPortfolioSamples]);

  useEffect(() => {
    const norm = normalizeCategory(activeHomeServiceTab);
    if (norm === 'embroidery') setActiveCategory('Embroidery');
    else if (norm === 'vector-art') setActiveCategory('Vector Art');
    else if (norm === 'patches') setActiveCategory('Custom Patches');
    else setActiveCategory('All');
  }, [activeHomeServiceTab]);

  const activePortfolioSource = localItems && localItems.length > 0 ? localItems : portfolioSamples;
  const combinedItems = (activePortfolioSource || [])
    .filter(item => item.is_active !== false)
    .map(item => ({
      ...item,
      mappedCategory: (item.category || '').toLowerCase().includes('vector') ? 'Vector Art' 
                    : (item.category || '').toLowerCase().includes('patch') ? 'Custom Patches' 
                    : 'Embroidery',
      image: item.digitized_image || item.original_image || item.after_img || item.before_img || item.afterImg || item.image || 'https://qkgvgrscjlijajuzouke.supabase.co/storage/v1/object/public/portfolio-images/portfolio-gallery/9e3dcdd7-e3b4-4886-9f18-a94361029147.png'
    }))
    .filter(item => Boolean(item.image) && !item.image.includes('unsplash.com'));

  const filteredItems = activeCategory === 'All'
    ? combinedItems
    : combinedItems.filter(item => item.mappedCategory === activeCategory);

  const handleStartOrder = (item) => {
    setLightboxItem(null);
    const cat = (item.mappedCategory || item.category || '').toLowerCase();
    const serviceType = cat.includes('patch') ? 'patch' : cat.includes('vector') ? 'vector' : 'embroidery';
    if (openOrderWizard) {
      openOrderWizard({
        type: serviceType,
        category: item.mappedCategory || item.category || 'Embroidery',
        title: item.title
      });
    } else if (protectedNavigate) {
      protectedNavigate('customer', true, { type: serviceType });
    } else {
      navigate('/order');
    }
  };

  return (
    <section style={{ backgroundColor: 'var(--bg-main)', padding: '5.5rem 0', fontFamily: 'var(--font-body, "Inter", sans-serif)', borderTop: '1px solid var(--border-color)' }}>
      <div className="container">
        
        {/* Header */}
        <div style={{ textAlign: 'center', maxWidth: '750px', margin: '0 auto 3.5rem' }}>
          <div className="badge-pill-glow" style={{ marginBottom: '1rem' }}>
            <Sparkles size={15} style={{ color: 'var(--orange-500)' }} />
            <span>{badgeText}</span>
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
            {titleText.includes('Precision') ? (
              <>Crafted with <span className="text-gradient-orange">Precision</span></>
            ) : (
              titleText
            )}
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
          {filteredItems.slice(0, 6).map((item, idx) => {
            const isHovered = hoveredId === item.id;
            return (
              <div
                key={item.id || idx}
                className="card"
                onMouseEnter={() => setHoveredId(item.id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => setLightboxItem(item)}
                style={{
                  background: 'var(--color-surface, #ffffff)',
                  border: isHovered ? '1px solid var(--orange-400)' : '1px solid var(--border-color, #e2e8f0)',
                  borderRadius: '20px',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: isHovered ? 'var(--shadow-xl)' : 'var(--shadow-sm)',
                  transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                  transform: isHovered ? 'translateY(-6px)' : 'none',
                  cursor: 'pointer'
                }}
              >
                <div>
                  {/* Image Box - Dynamic Auto-Fitting Frame with Neutral Slate-50 Background */}
                  <div
                    className="portfolio-display-frame"
                    style={{
                      position: 'relative',
                      width: '100%',
                      aspectRatio: '4/3',
                      backgroundColor: '#f8fafc',
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '1rem',
                      borderBottom: '1px solid var(--border-color, #e2e8f0)'
                    }}
                  >
                    <img 
                      src={item.image} 
                      alt={item.title}
                      loading="lazy"
                      decoding="async"
                      style={{
                        maxWidth: '100%',
                        maxHeight: '100%',
                        width: 'auto',
                        height: 'auto',
                        objectFit: 'contain',
                        objectPosition: 'center',
                        imageRendering: '-webkit-optimize-contrast',
                        filter: 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.08))',
                        transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                        transform: isHovered ? 'scale(1.05)' : 'scale(1)'
                      }}
                      className="sharp-portfolio-img"
                    />

                    {/* Category Badge (Top Left) */}
                    <div style={{
                      position: 'absolute',
                      top: '12px',
                      left: '12px',
                      zIndex: 2,
                      padding: '4px 10px',
                      backgroundColor: 'rgba(255, 255, 255, 0.94)',
                      backdropFilter: 'blur(8px)',
                      borderRadius: '8px',
                      fontSize: '0.725rem',
                      fontWeight: '800',
                      color: 'var(--navy-950, #0f172a)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'
                    }}>
                      {item.mappedCategory === 'Embroidery' && <Layers size={13} style={{ color: 'var(--orange-500)' }} />}
                      {item.mappedCategory === 'Vector Art' && <PenTool size={13} style={{ color: 'var(--orange-500)' }} />}
                      {item.mappedCategory === 'Custom Patches' && <Hexagon size={13} style={{ color: 'var(--orange-500)' }} />}
                      {item.mappedCategory}
                    </div>

                    {/* Quick Inspect Button (Top Right) */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setLightboxItem(item);
                      }}
                      style={{
                        position: 'absolute',
                        top: '12px',
                        right: '12px',
                        background: 'rgba(15, 23, 42, 0.75)',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '50%',
                        width: '32px',
                        height: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backdropFilter: 'blur(6px)',
                        cursor: 'pointer',
                        zIndex: 3,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.1)';
                        e.currentTarget.style.background = 'var(--orange-500)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.background = 'rgba(15, 23, 42, 0.75)';
                      }}
                      title="Inspect sample in high-res"
                      aria-label="Inspect sample in high-res"
                    >
                      <Maximize2 size={14} />
                    </button>
                  </div>

                  {/* Title and Details (Bottom) */}
                  <div style={{ padding: '1.25rem' }}>
                    <h3 style={{
                      color: 'var(--color-text-primary, #0f172a)',
                      fontFamily: 'var(--font-heading)',
                      fontSize: '1.1rem',
                      fontWeight: '800',
                      marginBottom: '0.35rem',
                      lineHeight: 1.3
                    }}>
                      {item.title}
                    </h3>
                    
                    <p style={{
                      color: 'var(--color-text-muted, #64748b)',
                      fontSize: '0.825rem',
                      lineHeight: 1.5,
                      margin: 0
                    }}>
                      {item.description || (item.stitch_count ? `⚡ ${item.stitch_count}` : 'Verified commercial digitizing sample.')}
                    </p>
                  </div>
                </div>

                {/* Card Action Bar */}
                <div style={{
                  padding: '0.85rem 1.25rem',
                  borderTop: '1px solid var(--border-color, #e2e8f0)',
                  background: 'var(--color-subtle, #f8fafc)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-text-muted, #64748b)' }}>
                    {item.client_type || item.clientType || 'Commercial Grade'}
                  </span>
                  <span style={{ fontSize: '0.825rem', fontWeight: 800, color: 'var(--color-primary, #ea580c)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    Inspect Artwork <ArrowRight size={13} />
                  </span>
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

      {/* Lightbox Inspector for Home Page Portfolio Preview */}
      {lightboxItem && (
        <PortfolioLightboxModal
          item={lightboxItem}
          items={filteredItems}
          currentIndex={filteredItems.findIndex(i => i.id === lightboxItem.id)}
          onNavigate={(newIdx) => {
            if (filteredItems[newIdx]) setLightboxItem(filteredItems[newIdx]);
          }}
          onClose={() => setLightboxItem(null)}
          onOrder={handleStartOrder}
        />
      )}
    </section>
  );
};

