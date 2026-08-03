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
    // SERVICE 1: EMBROIDERY DIGITIZING
    {
      id: 'pcard-basic',
      category: 'embroidery',
      serviceGroup: '1. Embroidery Digitizing',
      title: 'Basic Digitizing',
      subTitle: 'Ideal for simple left-chest & small logos up to 4"',
      icon: Zap,
      discountTag: 'ESSENTIAL',
      strikePrice: '$15.00',
      rate: '$10.00',
      unit: '/ design',
      delivery: '8 - 12 Hours Delivery',
      btnText: 'Order Basic ($10.00)',
      badge: '',
      popular: false,
      features: [
        'Logos up to 4" x 4"',
        'All commercial formats (.DST, .PES, .EXP)',
        'Free machine stitch simulation proof',
        '100% Free Unlimited Revisions'
      ]
    },
    {
      id: 'pcard-standard',
      category: 'embroidery',
      serviceGroup: '1. Embroidery Digitizing',
      title: 'Standard Digitizing',
      subTitle: 'Ideal for standard chest, caps & sleeves',
      icon: Trophy,
      discountTag: 'MOST POPULAR',
      strikePrice: '$20.00',
      rate: '$15.00',
      unit: '/ design',
      delivery: '4 - 12 Hours Express',
      btnText: 'Order Standard ($15.00)',
      badge: 'MOST POPULAR',
      popular: true,
      features: [
        'Logos up to 8" x 8"',
        'Free native .EMB Wilcom source file',
        '3D Foam cap pathing & compensation',
        '100% Free Unlimited Revisions'
      ]
    },
    {
      id: 'pcard-premium',
      category: 'embroidery',
      serviceGroup: '1. Embroidery Digitizing',
      title: 'Premium Digitizing',
      subTitle: 'Ideal for jacket backs & full-back crests',
      icon: Sparkles,
      discountTag: 'FULL BACK',
      strikePrice: '$45.00',
      rate: '$35.00',
      unit: '/ design',
      delivery: '12 - 24 Hours Priority',
      btnText: 'Order Premium ($35.00)',
      badge: '',
      popular: false,
      features: [
        'Large jacket backs (9"-12"+ high stitch count)',
        'Master pathing for complex gradient shading',
        'High density underlay pathing',
        'VIP priority studio desk'
      ]
    },

    // SERVICE 2: VECTOR TRACING
    {
      id: 'pcard-vector-simple',
      category: 'vector',
      serviceGroup: '2. Vector Tracing',
      title: 'Simple Vector Redraw',
      subTitle: 'Ideal for clean logo & raster image vector redraw',
      icon: Zap,
      discountTag: 'VECTOR ART',
      strikePrice: '$25.00',
      rate: '$15.00',
      unit: '/ artwork',
      delivery: '6 - 12 Hours Delivery',
      btnText: 'Order Simple Vector ($15.00)',
      badge: '',
      popular: false,
      features: [
        'Clean logo & raster JPEG/PNG redraws',
        'Hand-drawn 100% scalable vector paths',
        'Deliverables: .AI, .EPS, .SVG, .PDF, .CDR',
        'Spot Pantone & CMYK print color separations'
      ]
    },
    {
      id: 'pcard-vector-complex',
      category: 'vector',
      serviceGroup: '2. Vector Tracing',
      title: 'Complex Vector Art',
      subTitle: 'Ideal for detailed multi-layer illustrations & mascots',
      icon: Trophy,
      discountTag: 'HIGH DETAIL',
      strikePrice: '$35.00',
      rate: '$25.00',
      unit: '/ artwork',
      delivery: '6 - 12 Hours Delivery',
      btnText: 'Order Complex Vector ($25.00)',
      badge: '',
      popular: true,
      features: [
        'Complex gradient shading & mascot redraws',
        'Ultra-precise node placement & pathing',
        'All vector deliverables included',
        '100% Free Unlimited Revisions'
      ]
    },
    {
      id: 'pcard-vector-rush',
      category: 'vector',
      serviceGroup: '2. Vector Tracing',
      title: 'Super Rush Vector',
      subTitle: 'Ideal for express emergency deadlines (2-4 Hours)',
      icon: Sparkles,
      discountTag: 'EXPRESS RUSH',
      strikePrice: '$50.00',
      rate: '$35.00',
      unit: '/ artwork',
      delivery: '2 - 4 Hours Express',
      btnText: 'Order Rush Vector ($35.00)',
      badge: '',
      popular: false,
      features: [
        'Guaranteed 2-4 Hours Turnaround',
        'Top studio vector artist assigned',
        'All print & cut vector formats',
        '24/7 VIP priority support'
      ]
    },

    // SERVICE 3: CUSTOM PATCHES
    {
      id: 'pcard-patch-woven',
      category: 'patches',
      serviceGroup: '3. Custom Patches',
      title: 'Micro Woven Patches',
      subTitle: 'Ideal for fine text, micro detail & high-density logos',
      icon: Zap,
      discountTag: 'WOVEN CRAFT',
      strikePrice: '$2.50',
      rate: '$1.50',
      unit: '/ patch',
      delivery: '7–10 Business Days',
      btnText: 'Order Woven Patches ($1.50/ea)',
      badge: '',
      popular: false,
      features: [
        'Min. Quantity: 50 Patches',
        'Flat ultra-high resolution thread weaving',
        'Iron-on, sew-on, or velcro backing',
        '100% Free Unlimited Revisions'
      ]
    },
    {
      id: 'pcard-patch-embroidered',
      category: 'patches',
      serviceGroup: '3. Custom Patches',
      title: 'Embroidered Patches',
      subTitle: 'Classic 3D raised thread texture & merrowed border',
      icon: Trophy,
      discountTag: 'MOST POPULAR',
      strikePrice: '$3.80',
      rate: '$2.50',
      unit: '/ patch',
      delivery: '7–10 Business Days',
      btnText: 'Order Embroidered ($2.50/ea)',
      badge: 'MOST POPULAR',
      popular: true,
      features: [
        'Min. Quantity: 50 Patches',
        'Classic merrowed border edge finishing',
        'Heavy-duty velcro, heat-seal, or sew-on backing',
        'Free digital proof & sample photo'
      ]
    },
    {
      id: 'pcard-patch-pvc',
      category: 'patches',
      serviceGroup: '3. Custom Patches',
      title: '3D PVC & Leather Patches',
      subTitle: 'Waterproof 3D molded rubber PVC or debossed leather',
      icon: Sparkles,
      discountTag: 'LUXURY & PVC',
      strikePrice: '$5.00',
      rate: '$3.50',
      unit: '/ patch',
      delivery: '7–10 Business Days',
      btnText: 'Order 3D PVC / Leather ($3.50/ea)',
      badge: '',
      popular: false,
      features: [
        'Min. Quantity: 50 Patches',
        'High-durability waterproof 3D molded PVC',
        'Debossed & laser-engraved luxury leather',
        'Tactical velcro hook & loop mounting'
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
              { id: 'all', label: 'All 3 Studio Services' },
              { id: 'embroidery', label: '1. Embroidery Digitizing Tiers' },
              { id: 'vector', label: '2. Vector Tracing Tiers' },
              { id: 'patches', label: '3. Custom Patches Tiers' }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveCategory(tab.id)}
                style={{
                  background: activeCategory === tab.id ? 'linear-gradient(135deg, #ff7a00 0%, #ea580c 100%)' : 'rgba(255, 255, 255, 0.08)',
                  color: '#ffffff',
                  border: activeCategory === tab.id ? '1px solid #ff7a00' : '1px solid rgba(255, 255, 255, 0.15)',
                  fontWeight: activeCategory === tab.id ? 800 : 600,
                  fontSize: '0.875rem',
                  padding: '0.55rem 1.25rem',
                  borderRadius: '9999px',
                  cursor: 'pointer',
                  boxShadow: activeCategory === tab.id ? '0 4px 14px rgba(255, 122, 0, 0.35)' : 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Pricing Category Cards Grid */}
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
