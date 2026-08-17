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
import { PackageCard } from './PackageCard';
import { matchCategory } from '../../utils/categoryUtils';

export const CustomPatchesSection = ({ hideTabs = false, hideHero = false }) => {
  const { openOrderWizard, setIsOrderWizardOpen, patchCards = [], dynamicPricingTiers = [], serviceCmsContent = {}, portfolioSamples, homePageConfig = {} } = useAppState();
  
  const dbSettings = homePageConfig?.settings || {};

  const [selectedTier, setSelectedTier] = useState('standard');

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  const defaultPatchCards = [
    {
      id: 'patch-basic',
      category: 'patch',
      tierKey: 'basic',
      title: 'Sample Batch (10–50 Pcs)',
      subTitle: 'Low-minimum run perfect for small brands, clubs, prototypes & event samples',
      icon: Zap,
      discountTag: 'SAMPLE RUN',
      rate: '$4.50',
      unit: '/ piece',
      delivery: '3–5 Days',
      btnText: 'Order Sample Run ($4.50)',
      badge: 'SAMPLE RUN',
      popular: false,
      features: [
        'Ultra-Low 10 Pieces Minimum Order',
        '12-Hour Free Digital Production Proof',
        'Velcro Hook & Loop or Iron-On Backings',
        'Custom Embroidered, Woven or 3D PVC',
        '100% Quality Inspected Before Shipping'
      ]
    },
    {
      id: 'patch-standard',
      category: 'patch',
      tierKey: 'standard',
      title: 'Production Batch (100–500 Pcs)',
      subTitle: 'Standard volume for company uniforms, tactical gear, martial arts & apparel brands',
      icon: Trophy,
      discountTag: 'MOST POPULAR',
      rate: '$2.50',
      unit: '/ piece',
      delivery: '4–7 Days',
      btnText: 'Order Production Run ($2.50)',
      badge: 'MOST POPULAR',
      popular: true,
      features: [
        'Merrowed Border or Laser-Cut Edge',
        'Up to 9 Thread Colors Included Free',
        'Free Military-Grade Backing Choice',
        'Free Doorstep Worldwide Express Shipping',
        'Free Digital Proof with Unlimited Edits'
      ]
    },
    {
      id: 'patch-premium',
      category: 'patch',
      tierKey: 'premium',
      title: 'Wholesale Bulk Batch (500+ Pcs)',
      subTitle: 'Factory-direct wholesale pricing with volume discounts & priority factory line',
      icon: Sparkles,
      discountTag: 'WHOLESALE',
      rate: '$1.50',
      unit: '/ piece',
      delivery: '7–10 Days',
      btnText: 'Order Bulk Wholesale ($1.50)',
      badge: 'WHOLESALE',
      popular: false,
      features: [
        'Factory Direct Wholesale Rate ($1.50/pc)',
        'Priority Dedicated Manufacturing Line',
        'Custom Retail Backer Cards Available',
        'Express Air Doorstep Global Delivery',
        'Dedicated Production QA Manager'
      ]
    }
  ];

  const dbDynamicPatchTiers = (dynamicPricingTiers || [])
    .filter(t => matchCategory(t.service_type, 'patch'))
    .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));

  const mappedDynamicPatchCards = dbDynamicPatchTiers.map((t, idx) => ({
    id: t.id || `patch-tier-${idx}`,
    category: 'patch',
    service_type: 'patches',
    tierKey: idx === 0 ? 'basic' : idx === 1 ? 'standard' : 'premium',
    title: t.title,
    subTitle: t.subtitle,
    subtitle: t.subtitle,
    icon: idx === 0 ? Zap : idx === 1 ? Trophy : Sparkles,
    discountTag: t.badge_text || (t.is_popular ? 'MOST POPULAR' : ''),
    rate: typeof t.price === 'number' ? `$${t.price.toFixed(2)}` : (String(t.price).startsWith('$') ? String(t.price) : `$${t.price}`),
    price: t.price,
    original_price: t.original_price,
    unit: t.price_unit || '/ piece',
    price_unit: t.price_unit || '/ piece',
    delivery: t.turnaround_time || '4–7 Days',
    turnaround_time: t.turnaround_time || '4–7 Days',
    btnText: t.button_text || `Order ${t.title.split(' ')[0]} ($${t.price})`,
    button_text: t.button_text || `Order ${t.title.split(' ')[0]} ($${t.price})`,
    badge: t.badge_text || (t.is_popular ? 'MOST POPULAR' : ''),
    badge_text: t.badge_text || (t.is_popular ? 'MOST POPULAR' : ''),
    popular: Boolean(t.is_popular),
    is_popular: Boolean(t.is_popular),
    features: Array.isArray(t.features) ? t.features : []
  }));

  const cardsToRender = mappedDynamicPatchCards.length > 0 ? mappedDynamicPatchCards : defaultPatchCards;



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

  const sampleShowcaseGrid = portfolioSamples
    ? portfolioSamples
        .filter(s => (s.category || '').toLowerCase().includes('patch'))
        .map((s, idx) => ({
          id: s.id || `psamp-${idx}`,
          title: s.title || 'Custom Patch',
          category: s.categoryLabel || 'Custom Patch',
          badgeColor: '#fb923c',
          image: s.afterImg || s.originalImage || s.digitizedImage || 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80',
          specs: s.description || 'Custom patch specifications',
          rate: '',
          tierKey: 'standard'
        }))
    : [];

  const [processSteps, setProcessSteps] = useState([]);
  const [timelineSpecs, setTimelineSpecs] = useState([]);

  useEffect(() => {
    import('../../services/supabaseService').then(({ getCmsContent }) => {
      getCmsContent('process_steps').then(data => {
        if (data && data.length > 0) {
          setProcessSteps(data.map((item, idx) => ({
            step: String(idx + 1).padStart(2, '0'),
            title: item.title,
            desc: item.description
          })));
        }
      });
      getCmsContent('patch_timeline').then(data => {
        if (data && data.length > 0) {
          setTimelineSpecs(data.map(item => ({
            label: item.label,
            time: item.value,
            note: item.note || ''
          })));
        }
      });
    });
  }, []);

  return (
    <div style={{ background: 'var(--navy-950)', color: '#ffffff', minHeight: '100vh', paddingBottom: '5rem' }}>
      
      {/* SECTION 1: High-Impact Hero & Overview Banner */}
      {!hideHero && (
        <section style={{ 
          padding: '3rem 0 2.5rem', 
          background: 'linear-gradient(135deg, #0b1329 0%, #0f172a 60%, #1e1b4b 100%)', 
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Glowing Background Orbs */}
          <div style={{
          position: 'absolute',
          top: '-10%',
          left: '-5%',
          width: '500px',
          height: '500px',
          background: 'radial-gradient(circle, rgba(56, 189, 248, 0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 0
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-10%',
          right: '-5%',
          width: '500px',
          height: '500px',
          background: 'radial-gradient(circle, rgba(168, 85, 247, 0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 0
        }} />

        <div className="container" style={{ textAlign: 'center', maxWidth: '850px', position: 'relative', zIndex: 1 }}>
          
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
            padding: '0.35rem 0.95rem',
            borderRadius: '9999px',
            marginBottom: '0.85rem'
          }}>
            <Package size={16} /> {dbSettings.patch_hero_badge || 'DEDICATED CUSTOM PATCHES & EMBLEMS STUDIO'}
          </div>

          <h1 style={{ fontSize: 'clamp(2.2rem, 3.5vw, 2.85rem)', color: '#ffffff', fontWeight: 900, marginBottom: '0.85rem', lineHeight: 1.15 }}>
            {dbSettings.patch_hero_title || 'Custom Woven, Embroidered & 3D PVC Patches'}
          </h1>

          <p style={{ color: '#94a3b8', fontSize: '1.05rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
            {dbSettings.patch_hero_sub || 'Turn your brand logos, insignia, and artwork into high-durability physical patches. Hand-crafted precision with factory-direct pricing starting from '}
            {dbSettings.patch_hero_price && <strong style={{ color: 'var(--orange-400)' }}>{dbSettings.patch_hero_price}</strong>}
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
              <CheckCircle size={18} style={{ color: '#10b981' }} /> {dbSettings.patch_hero_value_1 || 'Min. Order: 50 Patches'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <CheckCircle size={18} style={{ color: '#10b981' }} /> {dbSettings.patch_hero_value_2 || 'Heavy-Duty Tactical Velcro, Heat-Seal & Sew-On'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <CheckCircle size={18} style={{ color: '#10b981' }} /> {dbSettings.patch_hero_value_3 || 'Free Physical Sample Photo Confirmation'}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <button 
              className="btn btn-primary-orange btn-lg"
              onClick={() => handleStartOrder('standard')}
              style={{ fontWeight: 800, padding: '0.85rem 2rem', fontSize: '1.05rem' }}
            >
              {dbSettings.patch_hero_btn_primary || 'Order Custom Patches'} <ArrowRight size={20} />
            </button>

            <a 
              href="#pricing-tiers" 
              className="btn btn-outline btn-lg"
              style={{ fontWeight: 700, padding: '0.85rem 1.75rem', color: '#ffffff', borderColor: 'rgba(255,255,255,0.2)' }}
            >
              {dbSettings.patch_hero_btn_secondary || 'View Pricing Tiers & Materials'}
            </a>
          </div>

        </div>
        </section>
      )}

      {/* Pricing Tiers Section */}
      <section id="pricing-tiers" style={{ padding: '5rem 0 6rem', background: '#f1f5f9', color: '#0f172a' }}>
        <div className="container" style={{ maxWidth: '1240px', margin: '0 auto', overflow: 'visible' }}>

          {/* Streamlined Pricing Tiers Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 290px), 1fr))',
            gap: '2rem',
            maxWidth: '1240px',
            margin: '0 auto',
            alignItems: 'stretch',
            paddingTop: '1rem',
            overflow: 'visible'
          }}>
            {cardsToRender.map((cat, idx) => (
              <PackageCard
                key={cat.id || idx}
                cat={cat}
                idx={idx}
                onSelect={(selectedCat) => handleStartOrder(selectedCat.tierKey, selectedCat)}
                forceCategory="patch"
              />
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: '3.5rem', color: '#64748b', fontSize: '0.925rem', fontWeight: 600 }}>
            📌 <em>{dbSettings.patch_footer_text || 'Prices are flat rates per patch with zero hidden charges. Low minimum order from 10 pieces. Click any tier package above to launch your instant order form.'}</em>
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

            <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.4rem)', color: '#ffffff', marginBottom: '0.85rem', fontWeight: 800 }}>
              Physical Custom Patch Showcase
            </h2>

            <p style={{ color: '#94a3b8', fontSize: '1.05rem', lineHeight: 1.6 }}>
              Inspect physical patches produced by our studio. From tactical rubber PVC and merrowed embroidered emblems to luxury debossed leather.
            </p>
          </div>

          {/* Sample Cards Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
            gap: '1.5rem',
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
