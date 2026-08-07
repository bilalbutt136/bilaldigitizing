'use client';

import React from 'react';
import { useAppState } from '../../context/StateContext';
import {
  CheckCircle,
  Tag,
  Sparkles,
  Zap,
  Trophy,
  Clock
} from 'lucide-react';

import { useLocation } from '../../utils/navigation';

export const PricingCalculator = () => {
  const { pricing = {}, pricingCards = [], protectedNavigate, openOrderWizard, activeHomeServiceTab } = useAppState();
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

  const allCards = pricingCards || [];
  const cardsToRender = activeCategory === 'all'
    ? allCards
    : allCards.filter(c => (c.category || '').toLowerCase() === activeCategory.toLowerCase() || (c.title || '').toLowerCase().includes(activeCategory.toLowerCase()));

  return (
    <section id="pricing" style={{ padding: '3.5rem 0 5.5rem', background: 'var(--navy-950)', color: '#ffffff' }}>
      <div className="container">

          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <div style={{
              display: 'inline-block',
              backgroundColor: 'rgba(255, 122, 0, 0.1)',
              color: '#ff7a00',
              padding: '6px 16px',
              borderRadius: '9999px',
              fontSize: '0.875rem',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '1rem',
              border: '1px solid rgba(255, 122, 0, 0.2)',
            }}>
              Clear & Transparent Pricing
            </div>
            <h2 style={{
              fontSize: 'clamp(2rem, 4vw, 2.75rem)',
              fontWeight: '800',
              color: '#ffffff',
              margin: '0 0 1rem 0',
              lineHeight: '1.2',
            }}>
              Choose Your <span style={{ color: '#ff7a00' }}>Service</span>
            </h2>
            <p style={{
              fontSize: '1.125rem',
              color: '#94a3b8',
              maxWidth: '650px',
              margin: '0 auto',
            }}>
              Select a service below to view our affordable, high-quality packages.
            </p>
          </div>

        {/* Empty State */}
        {cardsToRender.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
            <p style={{ fontSize: '1.1rem', fontWeight: 500 }}>No pricing packages available in this category yet.</p>
          </div>
        )}

        {/* Dynamic Pricing Category Cards Grid */}
        {cardsToRender.length > 0 && (
          <div className="grid-responsive-3" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.5rem',
            maxWidth: '1200px',
            margin: '0 auto',
            alignItems: 'stretch'
          }}>
          {cardsToRender.map((cat, idx) => {
            const isPopular = cat.popular || cat.badge === 'MOST POPULAR' || cat.badge === 'MOST POPULAR TIER';
            const IconComp = cat.icon || (idx === 0 ? Zap : idx === 1 ? Trophy : Sparkles);

            const rawRate = (cat.rate || '$2.50').replace(/\/.*$/, '').trim();
            const displayRate = rawRate.startsWith('$') ? rawRate : `$${rawRate}`;

            return (
              <div
                key={cat.id || idx}
                onClick={() => handleSelectPackage(cat)}
                style={{
                  background: isPopular
                    ? 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)'
                    : '#0f172a',
                  border: isPopular ? '2px solid #ff7a00' : '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '16px',
                  padding: '2rem 1.5rem 1.5rem',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  height: '100%',
                  boxShadow: isPopular ? '0 12px 30px rgba(255, 122, 0, 0.25)' : '0 4px 20px rgba(0, 0, 0, 0.2)',
                  transition: 'all 0.25s ease',
                  cursor: 'pointer'
                }}
              >
                {/* Top Badge Pill */}
                {isPopular && (
                  <div style={{
                    position: 'absolute',
                    top: '-14px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'linear-gradient(135deg, #ff7a00 0%, #ea580c 100%)',
                    color: '#ffffff',
                    fontSize: '0.725rem',
                    fontWeight: 800,
                    padding: '0.25rem 0.95rem',
                    borderRadius: '9999px',
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    boxShadow: '0 4px 12px rgba(255, 122, 0, 0.35)',
                    whiteSpace: 'nowrap'
                  }}>
                    ★ MOST POPULAR
                  </div>
                )}

                <div>
                  {/* Card Title & Icon Header */}
                  <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                      <IconComp size={20} style={{ color: '#ff7a00' }} />
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                        {cat.title}
                      </h3>
                    </div>
                    {cat.subTitle && (
                      <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: 0, lineHeight: 1.4 }}>
                        {cat.subTitle}
                      </p>
                    )}
                  </div>

                  {/* Refined Pricing Box */}
                  <div style={{
                    textAlign: 'center',
                    padding: '0.85rem 0.5rem',
                    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                    marginBottom: '1.25rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '0.4rem' }}>
                      <span style={{ fontSize: '2.3rem', fontWeight: 900, color: '#ff7a00', lineHeight: 1 }}>
                        {displayRate}
                      </span>
                      <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600 }}>
                        {cat.unit || (activeCategory === 'patches' ? '/ patch' : '/ design')}
                      </span>
                      {cat.strikePrice && (
                        <span style={{ fontSize: '0.85rem', color: '#64748b', textDecoration: 'line-through', marginLeft: '0.25rem' }}>
                          {cat.strikePrice}
                        </span>
                      )}
                    </div>

                    {cat.delivery && (
                      <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        fontSize: '0.775rem',
                        fontWeight: 700,
                        color: '#38bdf8',
                        background: 'rgba(56, 189, 248, 0.1)',
                        padding: '0.2rem 0.65rem',
                        borderRadius: '9999px',
                        marginTop: '0.5rem'
                      }}>
                        <Clock size={13} /> {cat.delivery}
                      </div>
                    )}
                  </div>

                  {/* Feature Bullets List */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem', marginBottom: '1.5rem' }}>
                    {(cat.features || []).map((feat, fIdx) => (
                      <div key={fIdx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#cbd5e1' }}>
                        <CheckCircle size={15} style={{ color: '#10b981', flexShrink: 0 }} />
                        <span style={{ fontWeight: 500 }}>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action CTA Button */}
                <div>
                  <button
                    type="button"
                    className="btn btn-block"
                    style={{
                      width: '100%',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '0.875rem',
                      background: isPopular
                        ? 'linear-gradient(135deg, #ff7a00 0%, #ea580c 100%)'
                        : 'rgba(255, 255, 255, 0.08)',
                      color: '#ffffff',
                      border: isPopular ? 'none' : '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '9999px',
                      padding: '0.75rem 1.25rem',
                      boxShadow: isPopular ? '0 4px 16px rgba(255, 122, 0, 0.35)' : 'none',
                      cursor: 'pointer'
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectPackage(cat);
                    }}
                  >
                    {cat.btnText || 'Order Now'}
                  </button>
                </div>

              </div>
            );
          })}
        </div>
        )}

        {/* Closing Footer Note */}
        <div style={{
          textAlign: 'center',
          marginTop: '2.5rem',
          padding: '0.85rem 1.5rem',
          background: 'rgba(255, 122, 0, 0.12)',
          border: '1px solid rgba(255, 122, 0, 0.3)',
          borderRadius: 'var(--radius-md)',
          maxWidth: '800px',
          margin: '2.5rem auto 0',
          color: '#e2e8f0',
          fontSize: '0.9rem',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem'
        }}>
          <Sparkles size={16} style={{ color: '#ff9433', flexShrink: 0 }} />
          <span>Prices are per design. Mixing services? Use Add to order list and checkout once.</span>
        </div>

      </div>
    </section>
  );
};
