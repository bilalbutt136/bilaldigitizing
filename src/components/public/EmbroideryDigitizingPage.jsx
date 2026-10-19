'use client';

import React, { useState, useEffect } from 'react';
import { useAppState } from '../../context/StateContext';
import { matchCategory } from '../../utils/categoryUtils';
import {
  CheckCircle, Zap, Trophy, Sparkles, Layers, Search as _Search,
  Upload as _Upload, Scissors as _Scissors, ArrowRight, Star as _Star, Quote as _Quote, ChevronRight as _ChevronRight
} from 'lucide-react';
import { PackageCard } from './PackageCard';
import { ServiceProcessTimelineSection } from './ServiceProcessTimelineSection';
import { TrustStatsBar } from './TrustStatsBar';
import { WhyChooseUs } from './WhyChooseUs';
import { TestimonialsFAQ } from './TestimonialsFAQ';
import { FinalCTA } from './FinalCTA';

export const EmbroideryDigitizingPage = ({ hideHero = false }) => {
  const { setIsOrderWizardOpen, openOrderWizard, dynamicPricingTiers = [], homePageConfig = {} } = useAppState();
  const dbSettings = homePageConfig?.settings || {};

  const [_selectedTier, setSelectedTier] = useState('standard');

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
        'Optimized Stitch Pathing for Smooth Production',
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
          background: 'radial-gradient(circle, rgba(37, 99, 235, 0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 0
        }} />

        <div className="container" style={{ textAlign: 'center', maxWidth: '850px', position: 'relative', zIndex: 1 }}>

          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            background: 'rgba(37, 99, 235, 0.08)',
            border: '1px solid rgba(37, 99, 235, 0.25)',
            color: '#2563eb',
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
              className="btn btn-lg"
              onClick={handleStartOrder}
              style={{ background: '#2563eb', borderColor: '#2563eb', color: '#ffffff', fontWeight: 800, padding: '0.85rem 2rem', fontSize: '1.05rem', borderRadius: '12px', boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)' }}
            >
              {dbSettings.emb_hero_btn_primary || 'Order Embroidery Digitizing'} <ArrowRight size={20} />
            </button>

            <a
              href="/pricing"
              className="btn btn-outline btn-lg"
              style={{ fontWeight: 700, padding: '0.85rem 1.75rem', color: '#2563eb', background: 'rgba(37, 99, 235, 0.08)', borderColor: 'rgba(37, 99, 235, 0.25)', borderRadius: '12px' }}
            >
              {dbSettings.emb_hero_btn_secondary || 'View Pricing & Packages'}
            </a>
          </div>

          </div>
        </section>
      )}

      {/* Capability Advantage Details from user request */}
      <section style={{ padding: '3.5rem 0 2rem', background: 'var(--bg-main)' }}>
        <div className="container">
          <div style={{ marginBottom: '3.5rem' }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: '1.5rem', textAlign: 'center' }}>
              Embroidery Engineering Advantages
            </h3>
            <div className="grid-responsive-4">
              {[
                { title: '100% Manual Digitizing', desc: 'No automated auto-tracing shortcuts. Every stitch angle and density point is manually mapped by master digitizers.' },
                { title: 'Efficient Stitch Pathing', desc: 'Optimized sequencing, smart trim reductions, and proper push-pull compensation help reduce production interruptions.' },
                { title: 'All Machine Formats', desc: 'Full compatibility with Tajima (.DST), Wilcom (.EMB), Brother (.PES), Melco (.EXP), Barudan, and Janome.' },
                { title: '4–12 Hr Fast Delivery', desc: 'Fast turnaround with production simulation run-sheets, thread sequence charts, and free revisions.' }
              ].map((item) => (
                <div key={item.title} className="card" style={{ background: 'var(--color-surface, var(--bg-card))', padding: '1.75rem 1.5rem', borderRadius: '16px', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(37, 99, 235, 0.08)', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                    <CheckCircle size={22} />
                  </div>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: '0.5rem' }}>{item.title}</h4>
                  <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', lineHeight: 1.55, margin: 0 }}>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '3.5rem' }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: '1.5rem', textAlign: 'center' }}>
              Supported Embroidery Placements & Styles
            </h3>
            <div className="grid-responsive-4">
              {[
                { name: 'Left Chest & Polo Logos', desc: 'Precision center-out stitching designed specifically for stable front polo and corporate uniform shirts.' },
                { name: '3D Puff / Foam Caps', desc: 'High-density satin top stitches over EVA puff foam with capped endpoints for clean 3D raised hats.' },
                { name: 'Full Jacket Backs', desc: 'Large scale designs up to 100,000+ stitches engineered with lightweight underlays to prevent fabric puckering.' },
                { name: 'Applique & Micro-Text', desc: 'Crisp small lettering down to 4mm and fabric patch tack-down lines with satin border finishes.' }
              ].map((type) => (
                <div key={type.name} className="card" style={{ background: 'var(--color-surface, var(--bg-card))', padding: '1.5rem', borderRadius: '16px', border: '1.5px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
                  <div style={{ color: '#2563eb', fontWeight: 800, fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '0.35rem' }}>Embroidery Type</div>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: '0.5rem' }}>{type.name}</h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', lineHeight: 1.5, margin: 0 }}>{type.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 5 User-Attached Sections in Exact Sequence */}
      <TrustStatsBar />
      <WhyChooseUs />
      <TestimonialsFAQ />
      <FinalCTA />

    </div>
  );
};
