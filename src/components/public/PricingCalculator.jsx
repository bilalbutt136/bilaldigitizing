'use client';

import React from 'react';
import { useAppState } from '../../context/StateContext';
import {
  CheckCircle,
  Tag,
  Sparkles,
  Layers,
  PenTool,
  ArrowRight
} from 'lucide-react';

import { PackageCard } from './PackageCard';
import { normalizeCategory, matchCategory } from '../../utils/categoryUtils';

export const PricingCalculator = () => {
  const { pricingCards = [], patchCards = [], protectedNavigate, openOrderWizard, activeHomeServiceTab, setActiveHomeServiceTab, homePageConfig = {} } = useAppState();
  
  const dbSettings = homePageConfig?.settings || {};
  const badgeText = dbSettings.pricing_badge || 'Clear & Transparent Pricing';
  const subAll = dbSettings.pricing_sub_all || 'Select from our three core studio services below. Simple, flat-rate starting prices with zero hidden fees and no surprises.';
  const subCat = dbSettings.pricing_sub_cat || 'Select a package below to view our affordable, high-quality options.';
  const staticCards = homePageConfig?.pricingStaticCards || [];

  // Initialize with global state
  const activeCategory = normalizeCategory(activeHomeServiceTab || 'all');

  const handleSelectPackage = (cat) => {
    const cId = (cat.id || '').toLowerCase();
    const cCat = (cat.category || '').toLowerCase();
    const cTitle = (cat.title || '').toLowerCase();

    let tierKey = 'standard';
    if (cId.includes('basic') || cTitle.includes('basic')) tierKey = 'basic';
    else if (cId.includes('premium') || cTitle.includes('premium')) tierKey = 'premium';
    else if (cId.includes('standard') || cTitle.includes('standard')) tierKey = 'standard';

    let type = 'embroidery';
    if (cCat === 'vector' || cId.includes('vector') || cTitle.includes('vector')) {
      type = 'vector';
    } else if (cCat === 'patches' || cId.includes('patch') || cTitle.includes('patch')) {
      type = 'patch';
    }

    if (openOrderWizard) {
      openOrderWizard({
        tierKey,
        type,
        category: cat.category,
        title: cat.title,
        rate: cat.rate
      });
    } else {
      protectedNavigate('customer', true, {
        tierKey,
        type,
        category: cat.category,
        title: cat.title,
        rate: cat.rate
      });
    }
  };

  const allCards = [...(pricingCards || []), ...(patchCards || [])];
  
  const cardsToRender = activeCategory === 'all'
    ? allCards
    : allCards.filter(c => matchCategory(c.category || c.service_type, activeCategory));

  return (
    <section id="pricing" style={{ 
      padding: '5.5rem 0', 
      background: 'var(--bg-main)',
      color: 'var(--text-main)', 
      fontFamily: 'var(--font-body, "Inter", sans-serif)',
      position: 'relative',
      overflow: 'hidden',
      borderTop: '1px solid var(--border-color)'
    }}>
      <div className="container">

        <div style={{ textAlign: 'center', maxWidth: '750px', margin: '0 auto 3.5rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            background: 'var(--orange-50)',
            border: '1px solid var(--orange-200)',
            color: 'var(--orange-700)',
            padding: '0.35rem 0.95rem',
            borderRadius: '9999px',
            fontSize: '0.85rem',
            fontWeight: '800',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: '1rem',
          }}>
            <Sparkles size={16} />
            {badgeText}
          </div>
          <h2 style={{
            fontSize: 'clamp(2rem, 3.5vw, 2.75rem)',
            fontFamily: 'var(--font-heading)',
            fontWeight: '900',
            color: 'var(--navy-950)',
            margin: '0 0 1rem 0',
            lineHeight: '1.2',
            letterSpacing: '-0.02em'
          }}>
            {activeCategory === 'all' ? (
              <>Choose Your <span style={{ color: 'var(--orange-500)' }}>Service</span></>
            ) : (
              <>Choose Your <span style={{ color: 'var(--orange-500)' }}>Package</span></>
            )}
          </h2>
          <p style={{
            fontSize: '1.1rem',
            color: 'var(--text-muted)',
            lineHeight: '1.65',
            margin: '0 auto',
          }}>
            {activeCategory === 'all' ? subAll : subCat}
          </p>
        </div>

        {/* Empty State */}
        {cardsToRender.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
            <p style={{ fontSize: '1.1rem', fontWeight: 500 }}>No pricing packages available in this category yet.</p>
          </div>
        )}

        {/* Dynamic Pricing Category Cards Grid */}
        {activeCategory === 'all' ? (
          <div className="grid-responsive-3" style={{ alignItems: 'stretch' }}>
            {staticCards.length > 0 ? staticCards.filter(c => c.is_active !== false).sort((a,b)=>a.sort_order - b.sort_order).map((card, idx) => (
              <div key={card.id || idx} className="card" style={{ background: card.highlight_color ? 'linear-gradient(180deg, #ffffff 0%, #fff7ed 100%)' : '#ffffff', borderRadius: '20px', padding: '2.5rem 2rem', boxShadow: 'var(--shadow-md)', border: card.highlight_color ? '2px solid var(--orange-300)' : '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--orange-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--orange-500)' }}>
                      {card.service === 'embroidery' ? <Layers size={24} /> : card.service === 'vector' ? <PenTool size={24} /> : <Tag size={24} />}
                    </div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--navy-950)', lineHeight: 1.2, margin: 0, whiteSpace: 'pre-line' }}>{card.title}</h3>
                  </div>
                  <div style={{ color: 'var(--orange-600)', fontSize: '2.75rem', fontWeight: 900, marginBottom: '0.25rem', fontFamily: 'var(--font-heading)' }}>{card.price}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '1.75rem' }}>{card.subtitle}</div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '2.25rem' }}>
                    {card.features.map(f => (
                      <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.925rem', color: 'var(--navy-800)', fontWeight: 600 }}>
                        <CheckCircle size={17} style={{ color: '#10b981', flexShrink: 0 }} /> {f}
                      </div>
                    ))}
                  </div>
                </div>
                
                <button type="button" className="btn btn-primary-orange" onClick={() => setActiveHomeServiceTab(card.service)} style={{ width: '100%', padding: '0.85rem', fontWeight: 800, fontSize: '0.95rem' }}>
                  View Packages <ArrowRight size={16} />
                </button>
              </div>
            )) : (
              <>
                {/* Card 1: Embroidery */}
                <div className="card" style={{ background: '#ffffff', borderRadius: '20px', padding: '2.5rem 2rem', boxShadow: 'var(--shadow-md)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                      <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--orange-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--orange-500)' }}>
                        <Layers size={24} />
                      </div>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--navy-950)', lineHeight: 1.25, margin: 0 }}>Commercial Embroidery<br/>Digitizing</h3>
                    </div>
                    <div style={{ color: 'var(--orange-600)', fontSize: '2.75rem', fontWeight: 900, marginBottom: '0.25rem', fontFamily: 'var(--font-heading)' }}>$10.00</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '1.75rem' }}>STARTS $10.00 / DESIGN</div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '2.25rem' }}>
                      {['100% Manual Digitizing (No Auto-Trace)', 'Free Unlimited Revisions Included', 'DST, PES, EMB & All Formats', '4-12 Hour Express Turnaround'].map(f => (
                        <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.925rem', color: 'var(--navy-800)', fontWeight: 600 }}>
                          <CheckCircle size={17} style={{ color: '#10b981', flexShrink: 0 }} /> {f}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <button type="button" className="btn btn-outline" onClick={() => setActiveHomeServiceTab('embroidery')} style={{ width: '100%', padding: '0.85rem', fontWeight: 800, fontSize: '0.95rem' }}>
                    View Packages <ArrowRight size={16} />
                  </button>
                </div>

                {/* Card 2: Vector */}
                <div className="card" style={{ background: 'linear-gradient(180deg, #ffffff 0%, #fff7ed 100%)', borderRadius: '20px', padding: '2.5rem 2rem', boxShadow: 'var(--shadow-lg)', border: '2px solid var(--orange-400)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', transform: 'translateY(-6px)' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                      <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--orange-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--orange-600)' }}>
                        <PenTool size={24} />
                      </div>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--navy-950)', lineHeight: 1.25, margin: 0 }}>Raster to Scalable<br/>Vector Redraw</h3>
                    </div>
                    <div style={{ color: 'var(--orange-600)', fontSize: '2.75rem', fontWeight: 900, marginBottom: '0.25rem', fontFamily: 'var(--font-heading)' }}>$15.00</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '1.75rem' }}>STARTS $15.00 FLAT</div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '2.25rem' }}>
                      {['100% Hand-Drawn Node Paths', 'Pantone Spot Color Separation', 'Master AI, EPS, SVG, PDF Files', '6-12 Hour Fast Delivery'].map(f => (
                        <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.925rem', color: 'var(--navy-800)', fontWeight: 600 }}>
                          <CheckCircle size={17} style={{ color: '#10b981', flexShrink: 0 }} /> {f}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <button type="button" className="btn btn-primary-orange" onClick={() => setActiveHomeServiceTab('vector-art')} style={{ width: '100%', padding: '0.85rem', fontWeight: 800, fontSize: '0.95rem' }}>
                    View Packages <ArrowRight size={16} />
                  </button>
                </div>

                {/* Card 3: Patches */}
                <div className="card" style={{ background: '#ffffff', borderRadius: '20px', padding: '2.5rem 2rem', boxShadow: 'var(--shadow-md)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                      <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--orange-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--orange-500)' }}>
                        <Tag size={24} />
                      </div>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--navy-950)', lineHeight: 1.25, margin: 0 }}>Physical Custom<br/>Patches & Emblems</h3>
                    </div>
                    <div style={{ color: 'var(--orange-600)', fontSize: '2.75rem', fontWeight: 900, marginBottom: '0.25rem', fontFamily: 'var(--font-heading)' }}>$1.50</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '1.75rem' }}>STARTS $1.50 / PIECE</div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '2.25rem' }}>
                      {['Velcro, Iron-On & Peel Backings', 'Classic Merrowed Border Options', 'Embroidered, Woven & 3D PVC', 'Express Doorstep Delivery'].map(f => (
                        <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.925rem', color: 'var(--navy-800)', fontWeight: 600 }}>
                          <CheckCircle size={17} style={{ color: '#10b981', flexShrink: 0 }} /> {f}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <button type="button" className="btn btn-outline" onClick={() => setActiveHomeServiceTab('patches')} style={{ width: '100%', padding: '0.85rem', fontWeight: 800, fontSize: '0.95rem' }}>
                    View Packages <ArrowRight size={16} />
                  </button>
                </div>
              </>
            )}
          </div>
        ) : cardsToRender.length > 0 && (
          <div className="grid-responsive-3" style={{ alignItems: 'stretch' }}>
            {cardsToRender.map((cat, idx) => (
              <PackageCard 
                key={cat.id || idx} 
                cat={cat} 
                idx={idx} 
                onSelect={handleSelectPackage} 
                forceCategory={activeCategory} 
              />
            ))}
          </div>
        )}

        {/* Closing Footer Note */}
        <div style={{
          textAlign: 'center',
          padding: '0.85rem 1.5rem',
          background: 'var(--orange-50)',
          border: '1px solid var(--orange-200)',
          borderRadius: 'var(--radius-md)',
          maxWidth: '800px',
          margin: '3rem auto 0',
          color: 'var(--orange-900)',
          fontSize: '0.9rem',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem'
        }}>
          <Sparkles size={16} style={{ color: 'var(--orange-600)', flexShrink: 0 }} />
          <span>Flat rates per design. Multiple files? Add them all in one order with instant express checkout.</span>
        </div>

      </div>
    </section>
  );
};
