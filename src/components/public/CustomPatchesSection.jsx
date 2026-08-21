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
import { ServiceProcessTimelineSection } from './ServiceProcessTimelineSection';
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

  const defaultPatchProcessSteps = [
    {
      step: '01',
      title: 'Submit Artwork & Custom Specs',
      desc: 'Upload your vector logo or sketch. Select patch style (embroidered, woven, or 3D PVC), backing type, border style, and dimensions.'
    },
    {
      step: '02',
      title: 'Free Digital Proof & Sample Approval',
      desc: 'Our master digitizers engineer a precision stitch-path mock-up and digital proof for your approval with unlimited free revisions.'
    },
    {
      step: '03',
      title: 'Precision Machine Production & Hand QA',
      desc: 'Manufactured with high-density Madeira threads and laser-cut edges on commercial Japanese looms, followed by 100% manual inspection.'
    },
    {
      step: '04',
      title: 'Secure Packaging & Express Doorstep Air Delivery',
      desc: 'Carefully packaged with optional retail backer cards and dispatched via express air courier (DHL/FedEx) with door-to-door tracking.'
    }
  ];

  const defaultPatchTimelineSpecs = [
    {
      label: 'Digital Production Proof',
      time: '12–24 Hours',
      note: 'Free unlimited revisions until approved'
    },
    {
      label: 'Sample Run (10–50 Pcs)',
      time: '3–5 Business Days',
      note: 'Fast prototype & club batches'
    },
    {
      label: 'Production Run (100–500 Pcs)',
      time: '5–7 Business Days',
      note: 'Uniform & commercial batch orders'
    },
    {
      label: 'Wholesale Bulk (500+ Pcs)',
      time: '7–10 Business Days',
      note: 'Priority dedicated factory line'
    },
    {
      label: 'Express Doorstep Air Shipping',
      time: '3–5 Days Worldwide',
      note: 'DHL / FedEx with live tracking'
    }
  ];

  const [processSteps, setProcessSteps] = useState(defaultPatchProcessSteps);
  const [timelineSpecs, setTimelineSpecs] = useState(defaultPatchTimelineSpecs);

  useEffect(() => {
    import('../../services/supabaseService').then(({ getCmsContent }) => {
      getCmsContent('patch_process_steps').then(data => {
        if (data && data.length > 0) {
          setProcessSteps(data.map((item, idx) => ({
            step: String(idx + 1).padStart(2, '0'),
            title: item.title,
            desc: item.description
          })));
        }
      }).catch(() => {});

      getCmsContent('patch_timeline').then(data => {
        if (data && data.length > 0) {
          setTimelineSpecs(data.map(item => ({
            label: item.label,
            time: item.value || item.time,
            note: item.note || ''
          })));
        }
      }).catch(() => {});
    });
  }, []);

  return (
    <div style={{ background: 'var(--bg-main)', color: 'var(--color-text-primary)', minHeight: '100vh', paddingBottom: '5rem' }}>
      
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

      {/* SECTION 2: Dynamic 2-Column Process & Delivery Timeline */}
      <ServiceProcessTimelineSection 
        serviceType="patches" 
        onCtaClick={() => handleStartOrder('standard')} 
      />

    </div>
  );
};
