'use client';

import React, { useState, useEffect } from 'react';
import { useAppState } from '../../context/StateContext';
import {
  CheckCircle,
  ArrowRight,
  Sparkles,
  Clock,
  Truck,
  FileCheck,
  Zap,
  Trophy,
  Package,
  Tag,
  Image as ImageIcon
} from 'lucide-react';

export const CustomPatchesSection = () => {
  const { openOrderWizard, setIsOrderWizardOpen, patchCards } = useAppState();

  const [selectedTier, setSelectedTier] = useState('standard');

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  const defaultPatchCards = [
    {
      id: 'pcard-patch-woven',
      category: 'patches',
      tierKey: 'basic',
      title: 'Micro Woven Patches',
      subTitle: 'Ideal for fine text, micro detail & high-density crisp logos',
      icon: Zap,
      discountTag: 'ESSENTIAL',
      strikePrice: '$2.50',
      rate: '$1.50',
      unit: '/ patch',
      delivery: '7–10 Business Days Turnaround',
      btnText: 'Order Woven ($1.50)',
      badge: 'ESSENTIAL',
      popular: false,
      features: [
        'Min. Quantity: 50 Patches',
        '7–10 Business Days Turnaround',
        'Flat ultra-high resolution thread weaving',
        'Iron-on, sew-on, or velcro backing',
        'Free digital mockup & physical sample confirmation',
        '100% Free Unlimited Revisions'
      ]
    },
    {
      id: 'pcard-patch-embroidered',
      category: 'patches',
      tierKey: 'standard',
      title: 'Embroidered Patches',
      subTitle: 'Classic 3D raised thread texture & merrowed overlock border',
      icon: Trophy,
      discountTag: 'MOST POPULAR',
      strikePrice: '$3.80',
      rate: '$2.50',
      unit: '/ patch',
      delivery: '7–10 Business Days Turnaround',
      btnText: 'Order Embroidered ($2.50)',
      badge: 'MOST POPULAR',
      popular: true,
      features: [
        'Min. Quantity: 50 Patches',
        '7–10 Business Days Turnaround',
        'Classic merrowed border edge finishing',
        'Heavy-duty velcro, heat-seal, or sew-on backing',
        'Free digital mockup & physical sample photo',
        '100% Free Unlimited Revisions'
      ]
    },
    {
      id: 'pcard-patch-pvc',
      category: 'patches',
      tierKey: 'premium',
      title: '3D PVC & Leather Patches',
      subTitle: 'Waterproof 3D molded rubber PVC or debossed genuine leather',
      icon: Sparkles,
      discountTag: 'LUXURY & PVC',
      strikePrice: '$5.00',
      rate: '$3.50',
      unit: '/ patch',
      delivery: '7–10 Business Days Turnaround',
      btnText: 'Order PVC & Leather ($3.50)',
      badge: 'LUXURY & PVC',
      popular: false,
      features: [
        'Min. Quantity: 50 Patches',
        '7–10 Business Days Turnaround',
        'High-durability waterproof 3D molded PVC',
        'Debossed & laser-engraved luxury leather',
        'Tactical velcro hook & loop mounting',
        '100% Free Unlimited Revisions'
      ]
    }
  ];

  const cardsToRender = patchCards && patchCards.length > 0 ? patchCards : defaultPatchCards;

  const handleStartOrder = (tierKey = 'standard', cardObj = null) => {
    setSelectedTier(tierKey);
    const targetTitle = cardObj?.title || (tierKey === 'basic' ? 'Micro Woven Patches' : tierKey === 'premium' ? '3D PVC & Leather Patches' : 'Embroidered Patches');
    const targetRate = cardObj?.rate || (tierKey === 'basic' ? '$1.50' : tierKey === 'premium' ? '$3.50' : '$2.50');

    if (openOrderWizard) {
      openOrderWizard({
        tierKey,
        type: 'patch',
        category: 'Custom Patches',
        title: targetTitle,
        rate: targetRate,
        quantity: 100
      });
    } else if (setIsOrderWizardOpen) {
      setIsOrderWizardOpen(true);
    }
  };

  const sampleShowcaseGrid = [
    {
      id: 'psamp-1',
      title: 'Tactical Special Forces Crest',
      category: '3D Rubber PVC',
      badgeColor: '#38bdf8',
      image: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=800&q=80',
      specs: 'Molded Waterproof Rubber PVC • Tactical Velcro Backing',
      rate: '$3.50/ea',
      tierKey: 'premium'
    },
    {
      id: 'psamp-2',
      title: 'Apex Athletic Club Crest',
      category: '100% Stitched Embroidered',
      badgeColor: '#fb923c',
      image: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80',
      specs: 'Rayon Thread Embroidery • Merrowed Overlock Edge',
      rate: '$2.50/ea',
      tierKey: 'standard'
    },
    {
      id: 'psamp-3',
      title: 'Heritage Denim Co. Insignia',
      category: 'Debossed Leather',
      badgeColor: '#a855f7',
      image: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=800&q=80',
      specs: 'Debossed Tan Leather • Therma-Bond Heat-Seal',
      rate: '$3.50/ea',
      tierKey: 'premium'
    },
    {
      id: 'psamp-4',
      title: 'Cyber Security Shield',
      category: 'Micro Woven Fine Detail',
      badgeColor: '#34d399',
      image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
      specs: 'Micro-Fine Weave • Iron-On Adhesive Backing',
      rate: '$1.50/ea',
      tierKey: 'basic'
    },
    {
      id: 'psamp-5',
      title: 'Outdoor Explorer Badge',
      category: '3D PVC Rubber',
      badgeColor: '#38bdf8',
      image: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80',
      specs: 'Waterproof All-Weather Rubber • Sew-On Channel',
      rate: '$3.50/ea',
      tierKey: 'premium'
    },
    {
      id: 'psamp-6',
      title: 'Motorcycle Club Wing Emblem',
      category: 'Merrowed Embroidered',
      badgeColor: '#fb923c',
      image: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=800&q=80',
      specs: 'Heavy Thread Density • Sew-On Heavy Felt',
      rate: '$2.50/ea',
      tierKey: 'standard'
    }
  ];

  const processSteps = [
    {
      step: '01',
      title: 'Submit Artwork & Backing Specs',
      desc: 'Send us your logo artwork, size dimensions, quantity, and preferred backing (Iron-On, Sew-On, or Velcro).'
    },
    {
      step: '02',
      title: '1:1 Scale Digital Mockup Approval',
      desc: 'Our studio master patch artists generate a 1:1 scale digital patch proof showing exact stitch paths and thread color matches within 24 hours.'
    },
    {
      step: '03',
      title: 'Physical Sample Photo Confirmation',
      desc: 'Upon digital approval, we produce an actual physical sample patch, capture high-res photographs, and share for final client sign-off.'
    },
    {
      step: '04',
      title: 'Mass Production & Express Delivery',
      desc: 'Completed patches undergo 100% quality inspection, retail poly-bagging, and express shipment directly to your doorstep in 7-10 business days.'
    }
  ];

  const timelineSpecs = [
    { label: 'Digital proof', time: '1–3 business days' },
    { label: 'Production', time: '5–10 business days', note: '(depending on quantity and design complexity)' },
    { label: 'Shipping', time: '3–5 business days' }
  ];

  return (
    <div style={{ background: 'var(--navy-950)', color: '#ffffff', minHeight: '100vh', paddingBottom: '5rem' }}>
      
      {/* SECTION 1: High-Impact Hero & Overview Banner */}
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
            <Package size={16} /> DEDICATED CUSTOM PATCHES & EMBLEMS STUDIO
          </div>

          <h1 style={{ fontSize: '3rem', color: '#ffffff', fontWeight: 900, marginBottom: '1rem', lineHeight: 1.15 }}>
            Custom Woven, Embroidered & 3D PVC Patches
          </h1>

          <p style={{ color: '#94a3b8', fontSize: '1.15rem', lineHeight: 1.65, marginBottom: '2rem' }}>
            Turn your brand logos, insignia, and artwork into high-durability physical patches. Hand-crafted precision with factory-direct pricing starting from <strong style={{ color: 'var(--orange-400)' }}>$1.50 / patch</strong>.
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
              <CheckCircle size={18} style={{ color: '#10b981' }} /> Min. Order: 50 Patches
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <CheckCircle size={18} style={{ color: '#10b981' }} /> Heavy-Duty Tactical Velcro, Heat-Seal & Sew-On
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <CheckCircle size={18} style={{ color: '#10b981' }} /> Free Physical Sample Photo Confirmation
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <button 
              className="btn btn-primary-orange btn-lg"
              onClick={() => handleStartOrder('standard')}
              style={{ fontWeight: 800, padding: '0.85rem 2rem', fontSize: '1.05rem' }}
            >
              Order Custom Patches <ArrowRight size={20} />
            </button>

            <a 
              href="#pricing-tiers" 
              className="btn btn-outline btn-lg"
              style={{ fontWeight: 700, padding: '0.85rem 1.75rem', color: '#ffffff', borderColor: 'rgba(255,255,255,0.2)' }}
            >
              View Pricing Tiers & Materials
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
                  onClick={() => handleStartOrder(cat.tierKey, cat)}
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
                          {cat.unit || '/ patch'}
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
                        handleStartOrder(cat.tierKey, cat);
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
            📌 <em>Prices are flat rates per patch with zero hidden charges. Minimum order 50 Pcs. Click any tier package above to launch your order configuration modal.</em>
          </div>

        </div>
      </section>

      {/* SECTION 2: Custom Patches Showcase & Sew-Out / Sample Grid */}
      <section style={{ padding: '5rem 0', background: '#0f172a', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="container">
          
          <div style={{ textAlign: 'center', maxWidth: '780px', margin: '0 auto 3.5rem' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: 'rgba(56, 189, 248, 0.15)',
              border: '1px solid rgba(56, 189, 248, 0.4)',
              color: '#38bdf8',
              fontWeight: 800,
              fontSize: '0.85rem',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              padding: '0.35rem 0.85rem',
              borderRadius: '9999px',
              marginBottom: '0.75rem'
            }}>
              <ImageIcon size={16} /> Production Portfolio & Sample Showcase
            </div>

            <h2 style={{ fontSize: '2.4rem', color: '#ffffff', marginBottom: '0.85rem', fontWeight: 800 }}>
              Physical Custom Patch Showcase
            </h2>

            <p style={{ color: '#94a3b8', fontSize: '1.05rem', lineHeight: 1.6 }}>
              Inspect physical patches produced by our studio. From tactical rubber PVC and merrowed embroidered emblems to luxury debossed leather.
            </p>
          </div>

          {/* Sample Cards Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '1.75rem',
            maxWidth: '1200px',
            margin: '0 auto'
          }}>
            {sampleShowcaseGrid.map(samp => (
              <div
                key={samp.id}
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'all 0.25s ease'
                }}
              >
                <div style={{ position: 'relative', height: '210px', width: '100%', overflow: 'hidden', background: '#1e293b' }}>
                  <img
                    src={samp.image}
                    alt={samp.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div style={{
                    position: 'absolute',
                    top: '12px',
                    left: '12px',
                    background: 'rgba(15, 23, 42, 0.85)',
                    backdropFilter: 'blur(4px)',
                    color: samp.badgeColor,
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    padding: '0.3rem 0.75rem',
                    borderRadius: '9999px',
                    border: `1px solid ${samp.badgeColor}44`,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em'
                  }}>
                    {samp.category}
                  </div>
                </div>

                <div style={{ padding: '1.25rem' }}>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff', margin: '0 0 0.35rem' }}>
                    {samp.title}
                  </h3>
                  <div style={{ fontSize: '0.8rem', color: '#cbd5e1', fontWeight: 600, marginBottom: '1rem', lineHeight: 1.4 }}>
                    {samp.specs}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pt: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 900, color: 'var(--orange-400)' }}>
                      Starting at {samp.rate}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleStartOrder(samp.tierKey)}
                      style={{
                        background: 'rgba(255, 122, 0, 0.15)',
                        border: '1px solid rgba(255, 122, 0, 0.35)',
                        color: 'var(--orange-400)',
                        fontSize: '0.78rem',
                        fontWeight: 800,
                        padding: '0.4rem 0.85rem',
                        borderRadius: '9999px',
                        cursor: 'pointer'
                      }}
                    >
                      Order Similar Patch →
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* SECTION 3: Step-by-Step Workflow ("How It Works" for Physical Patches) */}
      <section style={{ padding: '5rem 0', background: 'var(--navy-950)' }}>
        <div className="container">
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '2rem',
            maxWidth: '1200px',
            margin: '0 auto'
          }}>
            {/* Workflow Steps Box */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1.5px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '16px',
              padding: '2rem'
            }}>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#ffffff', marginBottom: '1.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileCheck size={22} style={{ color: 'var(--orange-400)' }} /> 4-Step Patch Production Process
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.35rem' }}>
                {processSteps.map((p, pIdx) => (
                  <div key={pIdx} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                    <div style={{
                      background: 'var(--orange-500)',
                      color: '#ffffff',
                      fontWeight: 900,
                      fontSize: '0.8rem',
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      {p.step}
                    </div>
                    <div>
                      <h4 style={{ fontSize: '0.98rem', fontWeight: 800, color: '#ffffff', margin: '0 0 0.25rem' }}>
                        {p.title}
                      </h4>
                      <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: 0, lineHeight: 1.55 }}>
                        {p.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Delivery & Timeline Specs Box */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1.5px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '16px',
              padding: '2rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <div>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#ffffff', marginBottom: '1.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Clock size={22} style={{ color: 'var(--orange-400)' }} /> Delivery & Production Timeline
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {timelineSpecs.map((spec, sIdx) => (
                    <div key={sIdx} style={{
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '12px',
                      padding: '1.15rem 1.25rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '0.5rem'
                    }}>
                      <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#e2e8f0' }}>
                        {spec.label}:
                      </span>
                      <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--orange-400)' }}>
                        {spec.time}
                        {spec.note && <span style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', fontWeight: 500 }}>{spec.note}</span>}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ marginTop: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.825rem', color: '#94a3b8' }}>
                <Truck size={18} style={{ color: 'var(--orange-400)', flexShrink: 0 }} /> Express worldwide air shipping available for all physical patch orders.
              </div>
            </div>
          </div>

          {/* Bottom Callout Banner */}
          <div style={{
            marginTop: '3.5rem',
            textAlign: 'center',
            padding: '1.5rem 2rem',
            background: 'linear-gradient(135deg, rgba(255, 122, 0, 0.15) 0%, rgba(255, 122, 0, 0.05) 100%)',
            border: '1px solid rgba(255, 122, 0, 0.35)',
            borderRadius: '16px',
            maxWidth: '1000px',
            margin: '3.5rem auto 0',
            color: '#e2e8f0',
            fontSize: '0.95rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.75rem'
          }}>
            <Sparkles size={20} style={{ color: 'var(--orange-400)', flexShrink: 0 }} />
            <span>Ready to create your custom patches? Click <strong>Order Custom Patches</strong> to configure quantities, backing options, and artwork files instantly.</span>
          </div>

        </div>
      </section>

    </div>
  );
};
