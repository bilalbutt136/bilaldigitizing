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
  const { pricing = {}, pricingCards = [], protectedNavigate, openOrderWizard } = useAppState();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const initialCategory = searchParams.get('cat') || searchParams.get('service') || 'all';

  const [activeCategory, setActiveCategory] = React.useState(initialCategory);

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

  const defaultCards = [
    {
      id: 'pcard-basic',
      category: 'embroidery',
      title: 'Basic Digitizing Tier',
      subTitle: 'Simple Left-Chest & Small Logos',
      icon: Zap,
      discountTag: 'FAST TURNAROUND',
      strikePrice: '$15.00',
      rate: `$${minFee}`,
      unit: '/ design',
      delivery: '8 - 12 Hours Delivery',
      btnText: 'Order Basic Tier',
      badge: 'ESSENTIAL TIER',
      popular: false,
      features: [
        'Logos up to 4" x 4"',
        'All commercial formats (.DST, .PES, .EXP, .EMB)',
        'Free machine stitch simulation proof',
        '100% Free Unlimited Revisions'
      ]
    },
    {
      id: 'pcard-standard',
      category: 'embroidery',
      title: 'Standard Digitizing Tier',
      subTitle: 'Medium Chest & Cap Crests',
      icon: Trophy,
      discountTag: 'EXPRESS RUSH AVAILABLE',
      strikePrice: '$20.00',
      rate: `$${(parseFloat(minFee) + 5).toFixed(2)}`,
      unit: '/ design',
      delivery: '4 - 12 Hours Delivery',
      btnText: 'Order Standard Tier',
      badge: 'MOST POPULAR TIER',
      popular: true,
      features: [
        'Medium logos up to 8" x 8"',
        'Includes free native .EMB Wilcom source file',
        '3D Foam cap pathing & distortion compensation',
        '24/7 Priority studio support'
      ]
    },
    {
      id: 'pcard-premium',
      category: 'embroidery',
      title: 'Premium Digitizing Tier',
      subTitle: 'Jacket Backs & Large Masterpiece Crests',
      icon: Sparkles,
      discountTag: 'HIGH STITCH COUNT',
      strikePrice: '$35.00',
      rate: `$${(parseFloat(minFee) + 15).toFixed(2)}`,
      unit: '/ design',
      delivery: '12 - 24 Hours Delivery',
      btnText: 'Order Premium Tier',
      badge: 'JACKET BACK TIER',
      popular: false,
      features: [
        'Large jacket backs (9"-12"+ High Stitch Count)',
        'Master pathing for complex gradient shading',
        'High density underlay & zero thread break pathing',
        'VIP priority studio desk'
      ]
    },
    {
      id: 'pcard-vector-simple',
      category: 'vector',
      title: 'Vector Tracing Tier',
      subTitle: 'Hand-Drawn Vector Redraw',
      icon: Zap,
      discountTag: 'INFINITE RESOLUTION',
      strikePrice: '$25.00',
      rate: `$${vectorFee}`,
      unit: '/ artwork',
      delivery: '6 - 12 Hours Delivery',
      btnText: 'Order Vector Tier',
      badge: 'VECTOR TIER',
      popular: false,
      features: [
        'Clean logo & raster JPEG/PNG redraws',
        'Hand-drawn 100% scalable vector paths',
        'Deliverables: .AI, .EPS, .SVG, .PDF, .CDR',
        'Spot Pantone & CMYK print color separations'
      ]
    },
    {
      id: 'pcard-patch-tier',
      category: 'patches',
      title: 'Custom Patches Tier',
      subTitle: 'Embroidered, Leather & PVC Emblems',
      icon: Trophy,
      discountTag: 'WORLDWIDE SHIPPING',
      strikePrice: '$3.50',
      rate: `$${patchesFee}`,
      unit: '/ patch starting',
      delivery: '3 - 5 Days Shipping',
      btnText: 'Order Patches Tier',
      badge: 'BULK TIER PACKAGES',
      popular: false,
      features: [
        'Classic merrowed border & die-cut edge',
        'Iron-on, velcro, or sew-on backing options',
        'Free pre-production digital sew-out proof',
        'Volume tier discounts for 25 to 1000+ pcs'
      ]
    }
  ];

  const allCards = (pricingCards && pricingCards.length > 0) ? pricingCards.filter(c => (c.category || '').toLowerCase() !== 'store' && (c.category || '').toLowerCase() !== 'apparel') : defaultCards;
  const cardsToRender = activeCategory === 'all'
    ? allCards
    : allCards.filter(c => (c.category || '').toLowerCase() === activeCategory.toLowerCase() || (c.title || '').toLowerCase().includes(activeCategory.toLowerCase()));

  return (
    <section id="pricing" style={{ padding: '5.5rem 0', background: 'var(--navy-950)', color: '#ffffff' }}>
      <div className="container">

        {/* Header */}
        <div style={{ textAlign: 'center', maxWidth: '780px', margin: '0 auto 2.5rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            background: 'rgba(255, 122, 0, 0.15)',
            border: '1px solid rgba(255, 122, 0, 0.4)',
            color: 'var(--orange-400)',
            fontWeight: 800,
            fontSize: '0.85rem',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            padding: '0.35rem 0.85rem',
            borderRadius: '9999px',
            marginBottom: '0.75rem'
          }}>
            <Tag size={16} /> Streamlined Pricing Tier Packages
          </div>

          <h2 style={{ fontSize: '2.5rem', color: '#ffffff', marginBottom: '0.85rem', fontWeight: 800 }}>
            Embroidery & Patch Pricing Packages
          </h2>

          <p style={{ color: '#94a3b8', fontSize: '1.05rem', lineHeight: 1.65, marginBottom: '1.5rem' }}>
            Transparent flat-rate tier packages for embroidery digitizing, vector artwork redraws, and physical custom patches with zero hidden fees.
          </p>

          {/* Key Feature Bullets */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1.5rem',
            fontSize: '0.925rem',
            fontWeight: 700,
            color: '#e2e8f0',
            marginBottom: '2rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <CheckCircle size={17} style={{ color: '#10b981' }} /> Machine-Tested Pathing
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <CheckCircle size={17} style={{ color: '#10b981' }} /> All Commercial Formats (.DST, .PES, .EXP, .EMB)
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <CheckCircle size={17} style={{ color: '#10b981' }} /> Free Unlimited Revisions
            </div>
          </div>

          {/* Category Filter Pills */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '0.65rem',
            flexWrap: 'wrap'
          }}>
            {[
              { id: 'all', label: 'All Tier Packages' },
              { id: 'embroidery', label: 'Embroidery Digitizing Tiers' },
              { id: 'vector', label: 'Vector Tracing Tiers' },
              { id: 'patches', label: 'Custom Patches Tiers' }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveCategory(tab.id)}
                style={{
                  background: activeCategory === tab.id ? '#ff7a00' : 'rgba(255, 255, 255, 0.08)',
                  color: '#ffffff',
                  border: activeCategory === tab.id ? '1px solid #ff7a00' : '1px solid rgba(255, 255, 255, 0.15)',
                  fontWeight: activeCategory === tab.id ? 800 : 600,
                  fontSize: '0.875rem',
                  padding: '0.5rem 1.15rem',
                  borderRadius: '9999px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Pricing Category Cards */}
        <div className="grid-responsive-3" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))',
          gap: '1.75rem',
          maxWidth: '1200px',
          margin: '0 auto',
          alignItems: 'stretch'
        }}>
          {cardsToRender.map((cat, idx) => {
            const isPopular = cat.popular || cat.badge === 'MOST POPULAR';
            const IconComp = cat.icon || (idx === 0 ? Zap : idx === 1 ? Trophy : Sparkles);

            const rawRate = (cat.rate || '$2.50').replace(/\/.*$/, '').trim();
            const displayRate = rawRate.startsWith('$') ? rawRate : `$${rawRate}`;

            return (
              <div
                key={cat.id || idx}
                onClick={() => handleSelectPackage(cat)}
                style={{
                  background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)',
                  border: isPopular ? '2px solid #ff7a00' : '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '16px',
                  padding: '2.25rem 1.6rem 1.85rem',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  height: '100%',
                  boxShadow: isPopular ? '0 12px 30px rgba(255, 122, 0, 0.25)' : 'none',
                  transition: 'all 0.25s ease',
                  cursor: 'pointer'
                }}
              >
                {/* Top Badge Pill */}
                {cat.badge && (
                  <div style={{
                    position: 'absolute',
                    top: '-13px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: isPopular ? 'linear-gradient(135deg, #ff7a00 0%, #ea580c 100%)' : 'rgba(255, 255, 255, 0.15)',
                    color: '#ffffff',
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    padding: '0.25rem 0.95rem',
                    borderRadius: '9999px',
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    boxShadow: '0 4px 12px rgba(255, 122, 0, 0.25)',
                    whiteSpace: 'nowrap'
                  }}>
                    {cat.badge}
                  </div>
                )}

                <div>
                  {/* Card Title & Icon Header */}
                  <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <IconComp size={18} style={{ color: '#ff9433' }} />
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ffffff', letterSpacing: '-0.01em', margin: 0 }}>
                        {cat.title}
                      </h3>
                    </div>
                    {cat.subTitle && (
                      <div style={{ fontSize: '0.825rem', fontWeight: 500, color: '#94a3b8', lineHeight: 1.35 }}>
                        {cat.subTitle}
                      </div>
                    )}
                  </div>

                  {/* Refined Pricing Box */}
                  <div style={{ 
                    textAlign: 'center', 
                    padding: '0.85rem 1rem', 
                    marginBottom: '1.25rem',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    borderRadius: '12px'
                  }}>
                    {cat.discountTag && (
                      <span style={{
                        display: 'inline-block',
                        background: 'rgba(16, 185, 129, 0.2)',
                        border: '1px solid rgba(16, 185, 129, 0.4)',
                        color: '#34d399',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        padding: '0.15rem 0.5rem',
                        borderRadius: '4px',
                        marginBottom: '0.35rem'
                      }}>
                        {cat.discountTag}
                      </span>
                    )}

                    {cat.strikePrice && (
                      <div style={{ textDecoration: 'line-through', color: '#94a3b8', fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.15rem' }}>
                        {cat.strikePrice} {cat.unit || '/ design'}
                      </div>
                    )}

                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '0.35rem' }}>
                      <span style={{ fontSize: '2.1rem', fontWeight: 700, color: '#ff7a00', lineHeight: 1, letterSpacing: '-0.02em' }}>
                        {displayRate}
                      </span>
                      <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 500 }}>
                        {cat.unit || (activeCategory === 'patches' ? '/ patch' : '/ design')}
                      </span>
                    </div>

                    {cat.delivery && (
                      <div style={{ fontSize: '0.8rem', color: '#cbd5e1', fontWeight: 500, marginTop: '0.35rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}>
                        <Clock size={13} style={{ color: '#ff7a00' }} /> {cat.delivery}
                      </div>
                    )}
                  </div>

                  {/* Action CTA Button */}
                  <div style={{ marginBottom: '1.5rem' }}>
                    <button
                      className="btn btn-block"
                      style={{
                        width: '100%',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '0.875rem',
                        background: 'linear-gradient(135deg, #ff7a00 0%, #ea580c 100%)',
                        color: '#ffffff',
                        borderRadius: '9999px',
                        padding: '0.75rem 1.25rem',
                        boxShadow: isPopular ? '0 4px 16px rgba(255, 122, 0, 0.35)' : '0 2px 8px rgba(0, 0, 0, 0.2)',
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

                  {/* Divider line */}
                  <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', marginBottom: '1.15rem' }}></div>

                  {/* Feature Bullets List */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                    {(cat.features || []).map((feat, fIdx) => (
                      <div key={fIdx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#e2e8f0' }}>
                        <CheckCircle size={16} style={{ color: '#10b981', flexShrink: 0 }} />
                        <span style={{ fontWeight: 500 }}>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            );
          })}
        </div>

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
