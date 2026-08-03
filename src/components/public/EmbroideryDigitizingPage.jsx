'use client';

import React, { useState, useEffect } from 'react';
import { useAppState } from '../../context/StateContext';
import { 
  Layers, 
  CheckCircle, 
  Sparkles, 
  Zap, 
  Trophy, 
  Tag, 
  Clock, 
  ArrowRight 
} from 'lucide-react';

export const EmbroideryDigitizingPage = () => {
  const { setIsOrderWizardOpen, openOrderWizard } = useAppState();

  const [selectedTier, setSelectedTier] = useState('standard');

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  const defaultCards = [
    {
      id: 'pcard-basic',
      category: 'embroidery',
      tierKey: 'basic',
      title: 'Basic Digitizing',
      subTitle: 'Ideal for simple left chest / small logos up to 4"',
      icon: Zap,
      discountTag: 'ESSENTIAL',
      strikePrice: '$10.00',
      rate: `$5.00`,
      unit: '/ design',
      delivery: '8 - 12 Hours Express Delivery',
      btnText: 'Order Basic ($5.00)',
      badge: 'ESSENTIAL',
      popular: false,
      features: [
        'Standard turnaround (8-12 Hours)',
        '.DST / .PES machine files',
        'Essential stitch paths & underlay',
        'Free native .EMB source file',
        '100% Free Unlimited Revisions'
      ]
    },
    {
      id: 'pcard-standard',
      category: 'embroidery',
      tierKey: 'standard',
      title: 'Standard Digitizing',
      subTitle: 'Ideal for standard left chest, caps & sleeves',
      icon: Trophy,
      discountTag: 'MOST POPULAR',
      strikePrice: '$18.00',
      rate: `$10.00`,
      unit: '/ design',
      delivery: '8 - 12 Hours Express Available',
      btnText: 'Order Standard ($10.00)',
      badge: 'MOST POPULAR',
      popular: true,
      features: [
        '8-Hour Express Available',
        'Free native .EMB source files',
        '3D Puff Cap density pathing',
        'All major machine formats',
        '100% Free Unlimited Revisions'
      ]
    },
    {
      id: 'pcard-premium',
      category: 'embroidery',
      tierKey: 'premium',
      title: 'Premium Digitizing',
      subTitle: 'Ideal for Jacket Backs & Large Crests (Full Back)',
      icon: Sparkles,
      discountTag: 'VIP & COMPLEX',
      strikePrice: '$35.00',
      rate: `$20.00`,
      unit: '/ design',
      delivery: '12 - 24 Hours Priority Delivery',
      btnText: 'Order Premium ($20.00)',
      badge: 'VIP & COMPLEX',
      popular: false,
      features: [
        'Jacket back high stitch count verification',
        'Complex 3D Puff & multi-layer pathing',
        '24/7 Priority studio support',
        'Free machine simulation sew-out proof',
        '100% Free Unlimited Revisions'
      ]
    }
  ];

  const cardsToRender = defaultCards;

  const handleSelectTier = (tierKey = 'standard', cardObj = null) => {
    setSelectedTier(tierKey);
    if (openOrderWizard) {
      openOrderWizard({
        tierKey,
        type: 'embroidery',
        title: cardObj?.title || `${tierKey.toUpperCase()} Digitizing`,
        rate: cardObj?.rate
      });
    } else if (setIsOrderWizardOpen) {
      setIsOrderWizardOpen(true);
    }
  };

  const handleStartOrder = () => {
    handleSelectTier('standard');
  };

  return (
    <div style={{ background: 'var(--navy-950)', color: '#ffffff', minHeight: '100vh', paddingBottom: '5rem' }}>
      
      {/* Hero Banner */}
      <section style={{ padding: '5rem 0 4rem', background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="container" style={{ textAlign: 'center', maxWidth: '850px' }}>
          
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
            padding: '0.4rem 1rem',
            borderRadius: '9999px',
            marginBottom: '1rem'
          }}>
            <Layers size={16} /> Dedicated Embroidery Digitizing Studio
          </div>

          <h1 style={{ fontSize: '3rem', color: '#ffffff', fontWeight: 900, marginBottom: '1rem', lineHeight: 1.15 }}>
            Custom Embroidery Digitizing Services
          </h1>

          <p style={{ color: '#94a3b8', fontSize: '1.15rem', lineHeight: 1.65, marginBottom: '2rem' }}>
            Turn your logo artwork into precise embroidery files ready for commercial production. Every design is hand-digitized with exact stitch counts, underlay pathing, and zero needle breaks.
          </p>

          {/* Quick Value Badges */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1.5rem',
            fontSize: '0.95rem',
            fontWeight: 700,
            color: '#e2e8f0',
            marginBottom: '2.5rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <CheckCircle size={18} style={{ color: '#10b981' }} /> Accurate Stitching Pathing
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <CheckCircle size={18} style={{ color: '#10b981' }} /> Smooth Commercial Results
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <CheckCircle size={18} style={{ color: '#10b981' }} /> All Machine Formats (.DST, .PES, .EMB)
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <button 
              className="btn btn-primary-orange btn-lg"
              onClick={handleStartOrder}
              style={{ fontWeight: 800, padding: '0.85rem 2rem', fontSize: '1.05rem' }}
            >
              Order Digitizing Design <ArrowRight size={20} />
            </button>

            <a 
              href="#pricing-tiers" 
              className="btn btn-outline btn-lg"
              style={{ fontWeight: 700, padding: '0.85rem 1.75rem', color: '#ffffff', borderColor: 'rgba(255,255,255,0.2)' }}
            >
              View Pricing Tiers
            </a>
          </div>

        </div>
      </section>

      {/* Pricing Tiers Section */}
      <section id="pricing-tiers" style={{ padding: '3.5rem 0 5rem', background: 'var(--navy-950)' }}>
        <div className="container">

          {/* Streamlined Compact Pricing Tiers Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.5rem',
            maxWidth: '1200px',
            margin: '0 auto',
            alignItems: 'stretch'
          }}>
            {cardsToRender.map((cat, idx) => {
              const isSelected = selectedTier === cat.tierKey;
              const isPopular = cat.popular || cat.badge === 'MOST POPULAR';
              const IconComp = cat.icon || (idx === 0 ? Zap : idx === 1 ? Trophy : Sparkles);

              return (
                <div
                  key={cat.id || idx}
                  onClick={() => handleSelectTier(cat.tierKey || 'standard', cat)}
                  style={{
                    background: isSelected 
                      ? 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)' 
                      : '#0f172a',
                    border: isSelected ? '2px solid #ff7a00' : '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '16px',
                    padding: '2rem 1.5rem 1.5rem',
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    height: '100%',
                    boxShadow: isSelected ? '0 12px 30px rgba(255, 122, 0, 0.25)' : '0 4px 20px rgba(0, 0, 0, 0.2)',
                    transition: 'all 0.25s ease',
                    cursor: 'pointer'
                  }}
                >
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

                    {/* Price & Delivery Header Box */}
                    <div style={{
                      textAlign: 'center',
                      padding: '0.85rem 0.5rem',
                      borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                      marginBottom: '1.25rem'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '0.4rem' }}>
                        <span style={{ fontSize: '2.3rem', fontWeight: 900, color: '#ff7a00', lineHeight: 1 }}>
                          {cat.rate}
                        </span>
                        <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600 }}>
                          {cat.unit || '/ design'}
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

                    {/* Key Features Bullet List */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem', marginBottom: '1.5rem' }}>
                      {(cat.features || []).map((feat, fIdx) => (
                        <div key={fIdx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#cbd5e1' }}>
                          <CheckCircle size={15} style={{ color: '#10b981', flexShrink: 0 }} />
                          <span style={{ fontWeight: 500 }}>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Primary CTA Button */}
                  <div>
                    <button
                      type="button"
                      className="btn btn-block"
                      style={{
                        width: '100%',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: '0.875rem',
                        background: isSelected || isPopular
                          ? 'linear-gradient(135deg, #ff7a00 0%, #ea580c 100%)'
                          : 'rgba(255, 255, 255, 0.08)',
                        color: '#ffffff',
                        border: (isSelected || isPopular) ? 'none' : '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '9999px',
                        padding: '0.75rem 1.25rem',
                        boxShadow: (isSelected || isPopular) ? '0 4px 16px rgba(255, 122, 0, 0.35)' : 'none',
                        cursor: 'pointer'
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectTier(cat.tierKey || 'standard', cat);
                      }}
                    >
                      {cat.btnText} <ArrowRight size={16} style={{ marginLeft: '0.35rem' }} />
                    </button>
                  </div>

                </div>
              );
            })}
          </div>

          <div style={{ textAlign: 'center', marginTop: '2.5rem', color: '#94a3b8', fontSize: '0.9rem' }}>
            📌 <em>Prices are flat rates per design with zero hidden charges. Need multiple designs? Click any tier package above to open your instant order form.</em>
          </div>

        </div>
      </section>

    </div>
  );
};
