'use client';

import React from 'react';
import { useAppState } from '../../context/StateContext';
import {
  CheckCircle,
  Tag,
  Sparkles,
  Zap,
  Trophy,
  Clock,
  Layers,
  PenTool,
  LayoutGrid
} from 'lucide-react';

import { useLocation } from '../../utils/navigation';
import { PackageCard } from './PackageCard';

export const PricingCalculator = () => {
  const { pricing = {}, pricingCards = [], patchCards = [], protectedNavigate, openOrderWizard, activeHomeServiceTab, setActiveHomeServiceTab, homePageConfig = {} } = useAppState();
  
  const dbSettings = homePageConfig?.settings || {};
  const badgeText = dbSettings.pricing_badge || 'Clear & Transparent Pricing';
  const titleAll = dbSettings.pricing_title_all || 'Choose Your Service';
  const subAll = dbSettings.pricing_sub_all || 'Select from our three core studio services below. Simple, flat-rate starting prices with zero hidden fees and no surprises.';
  const titleCat = dbSettings.pricing_title_cat || 'Choose Your Package';
  const subCat = dbSettings.pricing_sub_cat || 'Select a package below to view our affordable, high-quality options.';
  const staticCards = homePageConfig?.pricingStaticCards || [];

  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  
  // Initialize with URL param or global state
  const initialCategory = searchParams.get('cat') || searchParams.get('service') || (activeHomeServiceTab || 'embroidery');

  const [activeCategory, setActiveCategory] = React.useState(initialCategory);

  // Sync with global tab changes
  React.useEffect(() => {
    if (activeHomeServiceTab) {
      setActiveCategory(activeHomeServiceTab === 'patches' ? 'patch' : activeHomeServiceTab);
    }
  }, [activeHomeServiceTab]);

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

  React.useEffect(() => {
    const cat = new URLSearchParams(location.search).get('cat') || new URLSearchParams(location.search).get('service');
    if (cat) {
      setActiveCategory(cat);
    }
  }, [location.search]);

  const minFee = pricing.minOrderFee !== undefined ? parseFloat(pricing.minOrderFee).toFixed(2) : '10.00';
  const patchesFee = pricing.customPatchesStartingRate !== undefined ? parseFloat(pricing.customPatchesStartingRate).toFixed(2) : '1.50';
  const vectorFee = pricing.vectorSimpleRate !== undefined ? parseFloat(pricing.vectorSimpleRate).toFixed(2) : '15.00';

  const allCards = [...(pricingCards || []), ...(patchCards || [])];
  
  const cardsToRender = activeCategory === 'all'
    ? allCards
    : allCards.filter(c => (c.category || '').toLowerCase() === activeCategory.toLowerCase() || (c.title || '').toLowerCase().includes(activeCategory.toLowerCase()));

  return (
    <section id="pricing" style={{ 
      padding: '3.5rem 0 5.5rem', 
      background: activeCategory === 'all' ? '#f8fafc' : 'linear-gradient(135deg, #0b1329 0%, #0f172a 60%, #1e1b4b 100%)', 
      color: activeCategory === 'all' ? '#0f172a' : '#ffffff', 
      fontFamily: 'var(--font-body, "Inter", sans-serif)',
      position: 'relative',
      overflow: 'hidden',
      transition: 'background 0.3s ease, color 0.3s ease'
    }}>
      {/* Background Glow Effects */}
      <div style={{
        position: 'absolute',
        top: '-10%',
        left: '-5%',
        width: '500px',
        height: '500px',
        background: activeCategory === 'all' ? 'radial-gradient(circle, rgba(56, 189, 248, 0.05) 0%, transparent 70%)' : 'radial-gradient(circle, rgba(56, 189, 248, 0.12) 0%, transparent 70%)',
        pointerEvents: 'none',
        zIndex: 0
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-10%',
        right: '-5%',
        width: '500px',
        height: '500px',
        background: activeCategory === 'all' ? 'radial-gradient(circle, rgba(168, 85, 247, 0.05) 0%, transparent 70%)' : 'radial-gradient(circle, rgba(168, 85, 247, 0.12) 0%, transparent 70%)',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      <div className="container" style={{ position: 'relative', zIndex: 1 }}>

          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
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
              fontSize: 'clamp(2rem, 4vw, 2.75rem)',
              fontFamily: 'var(--font-heading)',
              fontWeight: '800',
              color: activeCategory === 'all' ? '#0f172a' : '#ffffff',
              margin: '0 0 1rem 0',
              lineHeight: '1.2',
            }}>
              {activeCategory === 'all' ? (
                <>Choose Your <span style={{ color: '#ff7a00' }}>Service</span></>
              ) : (
                <>Choose Your <span style={{ color: '#ff7a00' }}>Package</span></>
              )}
            </h2>
            <p style={{
              fontSize: '1.125rem',
              color: activeCategory === 'all' ? '#64748b' : '#94a3b8',
              maxWidth: '650px',
              margin: '0 auto',
            }}>
              {activeCategory === 'all' ? subAll : subCat}
            </p>
          </div>

          {/* Pricing Tabs Segmented Control (Removed to prevent duplication with Hero tabs) */}

        {/* Empty State */}
        {cardsToRender.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
            <p style={{ fontSize: '1.1rem', fontWeight: 500 }}>No pricing packages available in this category yet.</p>
          </div>
        )}

        {/* Dynamic Pricing Category Cards Grid */}
        {activeCategory === 'all' ? (
          <div className="grid-responsive-3" style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem', maxWidth: '1200px', margin: '0 auto', alignItems: 'stretch'
          }}>
            {staticCards.length > 0 ? staticCards.filter(c => c.is_active !== false).sort((a,b)=>a.sort_order - b.sort_order).map((card, idx) => (
              <div key={card.id || idx} style={{ background: card.highlight_color ? 'linear-gradient(180deg, #ffffff 0%, #ffedd5 100%)' : '#ffffff', borderRadius: '24px', padding: '2.5rem 2rem', boxShadow: card.highlight_color ? '0 20px 40px -10px rgba(234, 88, 12, 0.15)' : '0 10px 40px -10px rgba(0,0,0,0.08)', border: card.highlight_color ? '1px solid rgba(234,88,12,0.1)' : '1px solid rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', transform: card.highlight_color ? 'translateY(-10px)' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: card.highlight_color ? '#eff6ff' : (card.service === 'patch' ? '#ecfdf5' : '#fff7ed'), display: 'flex', alignItems: 'center', justifyContent: 'center', color: card.highlight_color ? '#3b82f6' : (card.service === 'patch' ? '#10b981' : '#ea580c') }}>
                    {card.service === 'embroidery' ? <Layers size={24} /> : card.service === 'vector' ? <PenTool size={24} /> : <Tag size={24} />}
                  </div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.2, margin: 0, whiteSpace: 'pre-line' }}>{card.title}</h3>
                </div>
                <div style={{ color: card.highlight_color ? '#4f46e5' : (card.service === 'patch' ? '#059669' : '#ea580c'), fontSize: '3rem', fontWeight: 900, marginBottom: '0.25rem' }}>{card.price}</div>
                <div style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '2rem' }}>{card.subtitle}</div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2.5rem', flex: 1 }}>
                  {card.features.map(f => (
                    <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.95rem', color: '#334155', fontWeight: 500 }}>
                      <CheckCircle size={18} style={{ color: '#10b981' }} /> {f}
                    </div>
                  ))}
                </div>
                
                <button type="button" onClick={() => setActiveHomeServiceTab(card.service)} style={{ width: '100%', padding: '1rem', borderRadius: '12px', background: card.highlight_color ? '#3b82f6' : (card.service === 'patch' ? '#10b981' : '#ffffff'), border: card.highlight_color ? 'none' : (card.service === 'patch' ? 'none' : '2px solid #ea580c'), color: card.highlight_color ? '#ffffff' : (card.service === 'patch' ? '#ffffff' : '#ea580c'), fontWeight: 700, fontSize: '1rem', cursor: 'pointer', transition: 'all 0.2s', boxShadow: card.highlight_color ? '0 4px 14px rgba(59, 130, 246, 0.4)' : (card.service === 'patch' ? '0 4px 14px rgba(16, 185, 129, 0.4)' : 'none') }}>
                  View Packages
                </button>
              </div>
            )) : (
              <>
                {/* Card 1: Embroidery */}
                <div style={{ background: '#ffffff', borderRadius: '24px', padding: '2.5rem 2rem', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.08)', border: '1px solid rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ea580c' }}>
                      <Layers size={24} />
                    </div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.2, margin: 0 }}>Commercial<br/>Embroidery<br/>Digitizing</h3>
                  </div>
                  <div style={{ color: '#ea580c', fontSize: '3rem', fontWeight: 900, marginBottom: '0.25rem' }}>$10.00</div>
                  <div style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '2rem' }}>STARTS $10.00</div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2.5rem', flex: 1 }}>
                    {['100% Manual Digitizing', 'Free Revisions Included', 'Machine-Ready Formats', 'Super Fast 4-12 Hrs Delivery'].map(f => (
                      <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.95rem', color: '#334155', fontWeight: 500 }}>
                        <CheckCircle size={18} style={{ color: '#10b981' }} /> {f}
                      </div>
                    ))}
                  </div>
                  
                  <button type="button" onClick={() => setActiveHomeServiceTab('embroidery')} style={{ width: '100%', padding: '1rem', borderRadius: '12px', background: '#ffffff', border: '2px solid #ea580c', color: '#ea580c', fontWeight: 700, fontSize: '1rem', cursor: 'pointer', transition: 'all 0.2s' }}>
                    View Packages
                  </button>
                </div>

                {/* Card 2: Vector */}
                <div style={{ background: 'linear-gradient(180deg, #ffffff 0%, #ffedd5 100%)', borderRadius: '24px', padding: '2.5rem 2rem', boxShadow: '0 20px 40px -10px rgba(234, 88, 12, 0.15)', border: '1px solid rgba(234,88,12,0.1)', display: 'flex', flexDirection: 'column', transform: 'translateY(-10px)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}>
                      <PenTool size={24} />
                    </div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.2, margin: 0 }}>Raster to Scalable<br/>Vector Redraw</h3>
                  </div>
                  <div style={{ color: '#4f46e5', fontSize: '3rem', fontWeight: 900, marginBottom: '0.25rem' }}>$30.00</div>
                  <div style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '2rem' }}>STARTS $15.00 FLAT</div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2.5rem', flex: 1 }}>
                    {['100% Hand-Drawn Node Paths', 'Pantone Spot Color Separation', 'Master Source Files Included', '6-12 Hrs Turnaround'].map(f => (
                      <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.95rem', color: '#334155', fontWeight: 500 }}>
                        <CheckCircle size={18} style={{ color: '#10b981' }} /> {f}
                      </div>
                    ))}
                  </div>
                  
                  <button type="button" onClick={() => setActiveHomeServiceTab('vector')} style={{ width: '100%', padding: '1rem', borderRadius: '12px', background: '#3b82f6', border: 'none', color: '#ffffff', fontWeight: 700, fontSize: '1rem', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 14px rgba(59, 130, 246, 0.4)' }}>
                    View Packages
                  </button>
                </div>

                {/* Card 3: Patches */}
                <div style={{ background: '#ffffff', borderRadius: '24px', padding: '2.5rem 2rem', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.08)', border: '1px solid rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
                      <Tag size={24} />
                    </div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.2, margin: 0 }}>Physical Custom<br/>Patches & Emblems</h3>
                  </div>
                  <div style={{ color: '#059669', fontSize: '3rem', fontWeight: 900, marginBottom: '0.25rem' }}>$1.50</div>
                  <div style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '2rem' }}>STARTS $1.50 / PATCH</div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2.5rem', flex: 1 }}>
                    {['Velcro & Iron-On Backing', 'Classic Merrowed Borders', 'Waterproof 3D Molded PVC', '3-5 Days Production'].map(f => (
                      <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.95rem', color: '#334155', fontWeight: 500 }}>
                        <CheckCircle size={18} style={{ color: '#10b981' }} /> {f}
                      </div>
                    ))}
                  </div>
                  
                  <button type="button" onClick={() => setActiveHomeServiceTab('patch')} style={{ width: '100%', padding: '1rem', borderRadius: '12px', background: '#10b981', border: 'none', color: '#ffffff', fontWeight: 700, fontSize: '1rem', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)' }}>
                    View Packages
                  </button>
                </div>
              </>
            )}
          </div>
        ) : cardsToRender.length > 0 && (
          <div className="grid-responsive-3" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.5rem',
            maxWidth: '1200px',
            margin: '0 auto',
            alignItems: 'stretch'
          }}>
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
          marginTop: '2.5rem',
          padding: '0.85rem 1.5rem',
          background: 'var(--orange-50)',
          border: '1px solid var(--orange-200)',
          borderRadius: 'var(--radius-md)',
          maxWidth: '800px',
          margin: '2.5rem auto 0',
          color: 'var(--orange-800)',
          fontSize: '0.9rem',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem'
        }}>
          <Sparkles size={16} style={{ color: '#ea580c', flexShrink: 0 }} />
          <span>Prices are per design. Mixing services? Use Add to order list and checkout once.</span>
        </div>

      </div>
    </section>
  );
};
