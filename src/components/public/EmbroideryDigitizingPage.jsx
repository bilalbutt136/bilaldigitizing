'use client';

import React, { useState, useEffect } from 'react';
import { useAppState } from '../../context/StateContext';
import { matchCategory } from '../../utils/categoryUtils';
import { 
  CheckCircle, Zap, Trophy, Sparkles, Layers, Search, 
  Upload, Scissors, ArrowRight, Star, Quote, ChevronRight 
} from 'lucide-react';
import { PackageCard } from './PackageCard';
import { ServiceProcessTimelineSection } from './ServiceProcessTimelineSection';

export const EmbroideryDigitizingPage = ({ hideHero = false }) => {
  const { setIsOrderWizardOpen, openOrderWizard, dynamicPricingTiers = [], homePageConfig = {} } = useAppState();
  const dbSettings = homePageConfig?.settings || {};

  const [selectedTier, setSelectedTier] = useState('standard');

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  const defaultEmbroideryCards = [
    {
      id: 'emb-basic',
      category: 'embroidery',
      tierKey: 'basic',
      title: 'Left Chest & Cap Small Logo',
      subTitle: 'Commercial stitch files for caps, polos, shirts & jackets (.DST, .PES, .EMB)',
      icon: Zap,
      discountTag: 'BASIC',
      rate: '$10.00',
      unit: '/ design',
      delivery: '4–12 Hours',
      btnText: 'Order Left Chest ($10.00)',
      badge: 'BASIC',
      popular: false,
      features: [
        'Up to 4" x 4" Dimensions',
        '100% Hand-Mapped Stitch Pathing',
        'Cap Curved Profile Optimization',
        'Zero Thread Breaks Guaranteed',
        'All Machine Formats (.DST/.PES/.EMB)'
      ]
    },
    {
      id: 'emb-standard',
      category: 'embroidery',
      tierKey: 'standard',
      title: 'Mid-Size Jacket & Sleeve Design',
      subTitle: 'Medium complexity artwork up to 7" x 7" with calculated density and pull compensation',
      icon: Trophy,
      discountTag: 'MOST POPULAR',
      rate: '$20.00',
      unit: '/ design',
      delivery: '6–12 Hours',
      btnText: 'Order Mid-Size ($20.00)',
      badge: 'MOST POPULAR',
      popular: true,
      features: [
        'Up to 7" x 7" Medium Artwork Area',
        'Complex Multi-Color Layering',
        'Underlay Pull & Push Compensation',
        'Free Unlimited Production Revisions',
        'Production PDF Color Sequence Sheet'
      ]
    },
    {
      id: 'emb-premium',
      category: 'embroidery',
      tierKey: 'premium',
      title: 'Full Back & 3D Puff Foam',
      subTitle: 'High stitch count full jacket back designs up to 12" x 12" and specialty 3D puff foam',
      icon: Sparkles,
      discountTag: 'PRO / 3D PUFF',
      rate: '$35.00',
      unit: '/ design',
      delivery: '8–12 Hours',
      btnText: 'Order Full Back ($35.00)',
      badge: 'PRO / 3D PUFF',
      popular: false,
      features: [
        'Up to 12" x 12" Full Back Area',
        'High Density 3D Puff Foam Pathing',
        'Jacket & Hoodie Fabric Calibration',
        'Color Stops & Trim Optimization',
        '24/7 Priority Master Digitizer Support'
      ]
    }
  ];

  const dbDynamicTiers = (dynamicPricingTiers || [])
    .filter(t => matchCategory(t.service_type, 'embroidery'))
    .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));

  const mappedDynamicCards = dbDynamicTiers.map((t, idx) => ({
    id: t.id || `emb-tier-${idx}`,
    category: 'embroidery',
    service_type: 'embroidery',
    tierKey: idx === 0 ? 'basic' : idx === 1 ? 'standard' : 'premium',
    title: t.title,
    subTitle: t.subtitle,
    subtitle: t.subtitle,
    icon: idx === 0 ? Zap : idx === 1 ? Trophy : Sparkles,
    discountTag: t.badge_text || (t.is_popular ? 'MOST POPULAR' : ''),
    rate: typeof t.price === 'number' ? `$${t.price.toFixed(2)}` : (String(t.price).startsWith('$') ? String(t.price) : `$${t.price}`),
    price: t.price,
    original_price: t.original_price,
    unit: t.price_unit || '/ design',
    price_unit: t.price_unit || '/ design',
    delivery: t.turnaround_time || '4–12 Hours Express',
    turnaround_time: t.turnaround_time || '4–12 Hours Express',
    btnText: t.button_text || `Order ${t.title.split(' ')[0]} ($${t.price})`,
    button_text: t.button_text || `Order ${t.title.split(' ')[0]} ($${t.price})`,
    badge: t.badge_text || (t.is_popular ? 'MOST POPULAR' : ''),
    badge_text: t.badge_text || (t.is_popular ? 'MOST POPULAR' : ''),
    popular: Boolean(t.is_popular),
    is_popular: Boolean(t.is_popular),
    features: Array.isArray(t.features) ? t.features : []
  }));

  const activeCards = mappedDynamicCards.length > 0 ? mappedDynamicCards : defaultEmbroideryCards;



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
    <div style={{ background: 'var(--bg-main)', color: 'var(--color-text-primary)', minHeight: '100vh', paddingBottom: '5rem' }}>
      
      {/* Hero Banner */}
      {!hideHero && (
        <section style={{ 
          padding: 'clamp(2.5rem, 5vh, 3.5rem) 0', 
          background: 'var(--hero-bg, linear-gradient(135deg, #0b1329 0%, #0f172a 60%, #1e1b4b 100%))', 
          borderBottom: '1px solid var(--border-color)',
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
            background: 'var(--color-primary-light, rgba(255, 122, 0, 0.15))',
            border: '1px solid var(--border-color)',
            color: 'var(--color-primary, #ea580c)',
            fontWeight: 800,
            fontSize: '0.85rem',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            padding: '0.35rem 0.95rem',
            borderRadius: '9999px',
            marginBottom: '0.85rem'
          }}>
            <Layers size={16} /> {dbSettings.emb_hero_badge || 'DEDICATED EMBROIDERY DIGITIZING STUDIO'}
          </div>

          <h1 style={{ fontSize: 'clamp(2.2rem, 3.5vw, 2.85rem)', color: 'var(--hero-text-primary, var(--color-text-primary))', fontWeight: 900, marginBottom: '0.85rem', lineHeight: 1.15 }}>
            {dbSettings.emb_hero_title || 'Custom Embroidery Digitizing Services'}
          </h1>

          <p style={{ color: 'var(--hero-text-secondary, var(--color-text-secondary))', fontSize: '1.05rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
            {dbSettings.emb_hero_sub || 'Turn your logo artwork into precise embroidery files ready for commercial production. Every design is hand-digitized with exact stitch counts, underlay pathing, and zero needle breaks.'}
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
            color: 'var(--hero-text-primary, var(--color-text-primary))',
            marginBottom: '2.5rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <CheckCircle size={18} style={{ color: '#10b981' }} /> {dbSettings.emb_hero_value_1 || 'Accurate Stitching Pathing'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <CheckCircle size={18} style={{ color: '#10b981' }} /> {dbSettings.emb_hero_value_2 || 'Smooth Commercial Results'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <CheckCircle size={18} style={{ color: '#10b981' }} /> {dbSettings.emb_hero_value_3 || 'All Machine Formats (.DST, .PES, .EMB)'}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <button 
              className="btn btn-primary-orange btn-lg"
              onClick={handleStartOrder}
              style={{ fontWeight: 800, padding: '0.85rem 2rem', fontSize: '1.05rem' }}
            >
              {dbSettings.emb_hero_btn_primary || 'Order Digitizing Design'} <ArrowRight size={20} />
            </button>

            <a 
              href="#pricing-tiers" 
              className="btn btn-outline btn-lg"
              style={{ fontWeight: 700, padding: '0.85rem 1.75rem', color: 'var(--hero-text-primary, var(--color-text-primary))', borderColor: 'var(--border-color)' }}
            >
              {dbSettings.emb_hero_btn_secondary || 'View Pricing Tiers'}
            </a>
          </div>

          </div>
        </section>
      )}

      {/* Main Content & Packages */}
      <section id="pricing-tiers" style={{ padding: '5rem 0 6rem', background: 'var(--bg-main)', color: 'var(--color-text-primary)' }}>
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
            {activeCards.map((cat, idx) => (
              <PackageCard
                key={cat.id || idx}
                cat={cat}
                idx={idx}
                onSelect={(selectedCat) => handleSelectTier(selectedCat.tierKey || 'standard', selectedCat)}
                forceCategory="embroidery"
              />
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: '3.5rem', color: '#64748b', fontSize: '0.925rem', fontWeight: 600 }}>
            📌 <em>{dbSettings.emb_footer_text || 'Prices are flat rates per design with zero hidden charges. Need multiple designs? Click any tier package above to open your instant order form.'}</em>
          </div>

        </div>
      </section>

      {/* Dynamic 2-Column Production Process Steps & Delivery Timeline */}
      <ServiceProcessTimelineSection serviceType="embroidery" />

    </div>
  );
};
