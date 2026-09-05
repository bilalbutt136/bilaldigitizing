'use client';

import React, { useState } from 'react';
import { useAppState } from '../../context/StateContext';
import {
  LayoutGrid,
  Layers,
  PenTool,
  Tag,
  CheckCircle,
  Sparkles,
  ArrowRight,
  Clock,
  ChevronDown,
  Upload,
  CheckCircle2,
  PackageCheck
} from 'lucide-react';
import { normalizeCategory, matchCategory } from '../../utils/categoryUtils';
import { PackageCard } from './PackageCard';

export const ServicesSection = () => {
  const { 
    activeHomeServiceTab = 'all', 
    setActiveHomeServiceTab, 
    openOrderWizard, 
    protectedNavigate,
    dynamicPricingTiers = []
  } = useAppState();

  const activeTab = normalizeCategory(activeHomeServiceTab || 'all');
  const [openFaqIndex, setOpenFaqIndex] = useState(null);

  const handleSelectTab = (tabId) => {
    if (setActiveHomeServiceTab) {
      setActiveHomeServiceTab(tabId);
    }
    setOpenFaqIndex(null);
  };

  const handleSelectTabAndScrollToPackages = (tabId) => {
    if (setActiveHomeServiceTab) {
      setActiveHomeServiceTab(tabId);
    }
    setOpenFaqIndex(null);
    setTimeout(() => {
      const target = document.getElementById(`${tabId}-packages-grid`) || document.getElementById('services');
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 60);
  };

  const handleLaunchOrder = (serviceType, tierKey = 'standard', pkgData = null) => {
    const sType = serviceType === 'patch' || serviceType === 'patches' 
      ? 'patch' 
      : (serviceType === 'vector' || serviceType === 'vector-art' || serviceType === 'vector_art') 
        ? 'vector' 
        : 'embroidery';

    if (openOrderWizard) {
      openOrderWizard({
        type: sType,
        tierKey,
        title: pkgData?.title || undefined,
        rate: pkgData?.price ? `$${Number(pkgData.price).toFixed(2)}` : undefined
      });
    } else if (protectedNavigate) {
      protectedNavigate('customer', true, {
        type: sType,
        tierKey,
        title: pkgData?.title || undefined,
        rate: pkgData?.price ? `$${Number(pkgData.price).toFixed(2)}` : undefined
      });
    }
  };

  // Dynamic Tiers from DB grouped by service
  const embroideryTiers = (dynamicPricingTiers || [])
    .filter(t => matchCategory(t.service_type, 'embroidery'))
    .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));

  const vectorTiers = (dynamicPricingTiers || [])
    .filter(t => matchCategory(t.service_type, 'vector'))
    .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));

  const patchTiers = (dynamicPricingTiers || [])
    .filter(t => matchCategory(t.service_type, 'patch'))
    .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));

  // Dynamic Starting Prices
  const embMinPrice = embroideryTiers.length > 0 ? Math.min(...embroideryTiers.map(t => Number(t.price) || 10)) : 10;
  const vecMinPrice = vectorTiers.length > 0 ? Math.min(...vectorTiers.map(t => Number(t.price) || 15)) : 15;
  const patchMinPrice = patchTiers.length > 0 ? Math.min(...patchTiers.map(t => Number(t.price) || 1.5)) : 1.5;

  // Dynamic Packages Text for All Services summary
  const embPackagesSummary = embroideryTiers.length > 0
    ? embroideryTiers.map(t => `${t.title.split(' ')[0]} ($${Number(t.price).toFixed(t.price % 1 === 0 ? 0 : 2)})`).join(', ')
    : 'Left Chest ($10), Mid-Size ($20), Full Back & 3D Puff ($35)';

  const vecPackagesSummary = vectorTiers.length > 0
    ? vectorTiers.map(t => `${t.title.split(' ')[0]} ($${Number(t.price).toFixed(t.price % 1 === 0 ? 0 : 2)})`).join(', ')
    : 'Simple Logo ($15), Medium Detail ($25), Complex Art ($45)';

  const patchPackagesSummary = patchTiers.length > 0
    ? patchTiers.map(t => `${t.title.split(' ')[0]} ($${Number(t.price).toFixed(t.price % 1 === 0 ? 0 : 2)})`).join(', ')
    : 'Sample Batch 50+ Pcs ($3.50), Production Batch ($2.50), Wholesale Bulk ($1.50)';

  // Structured Tiers for Luxury Overview Cards
  const embTiersList = embroideryTiers.length > 0
    ? embroideryTiers.slice(0, 3).map(t => ({
        name: t.title.replace(/\(.*?\)/g, '').trim(),
        price: `$${Number(t.price).toFixed(t.price % 1 === 0 ? 0 : 2)}`,
        unit: t.price_unit || ''
      }))
    : [
        { name: 'Left Chest / Cap', price: '$10' },
        { name: 'Mid-Size Logo', price: '$20' },
        { name: 'Full Back / 3D', price: '$35' }
      ];

  const vecTiersList = vectorTiers.length > 0
    ? vectorTiers.slice(0, 3).map(t => ({
        name: t.title.replace(/\(.*?\)/g, '').trim(),
        price: `$${Number(t.price).toFixed(t.price % 1 === 0 ? 0 : 2)}`,
        unit: t.price_unit || ''
      }))
    : [
        { name: 'Simple Logo', price: '$15' },
        { name: 'Medium Detail', price: '$25' },
        { name: 'Complex Art', price: '$40' }
      ];

  const patchTiersList = patchTiers.length > 0
    ? patchTiers.slice(0, 3).map(t => ({
        name: t.title.replace(/\(.*?\)/g, '').trim(),
        price: `$${Number(t.price).toFixed(t.price % 1 === 0 ? 0 : 2)}`,
        unit: '/ pc'
      }))
    : [
        { name: 'Sample Run (Min 50)', price: '$3.50', unit: '/ pc' },
        { name: 'Production Batch', price: '$2.50', unit: '/ pc' },
        { name: 'Wholesale Bulk', price: '$1.50', unit: '/ pc' }
      ];



  // --------------------------------------------------------------------------
  // Tailored FAQs per service
  // --------------------------------------------------------------------------
  const serviceFaqs = {
    embroidery: [
      {
        q: 'What machine file formats will I receive?',
        a: 'We deliver all major commercial and home formats including Tajima (.DST), Wilcom (.EMB), Brother (.PES), Barudan (.DAT), Melco (.EXP), Husqvarna/Pfaff (.VP3), Janome (.JEF), plus PDF stitch simulation run-sheets with exact dimensions, color sequence, and stitch counts.'
      },
      {
        q: 'How fast is your standard delivery turnaround?',
        a: 'Standard orders are delivered in 8–12 hours. Express rush orders are prioritized and delivered in 4–6 hours. We operate 24/7 so you never miss a client press deadline.'
      },
      {
        q: 'Do you provide free revisions?',
        a: 'Yes, unlimited minor revisions and format adjustments are 100% free of charge until your design sews out with zero thread breaks.'
      },
      {
        q: 'Can you digitize 3D Puff / Foam embroidery for caps?',
        a: 'Absolutely. We specialize in 3D puff embroidery. We engineer heavy satin top stitching with optimized underlay density and perforated foam caps to ensure clean, raised edges without exposed foam.'
      }
    ],
    'vector-art': [
      {
        q: 'What vector file formats are included in my order?',
        a: 'Every order includes editable master Adobe Illustrator (.AI), vector .EPS, scalable vector .SVG, print-ready 300+ DPI .PDF, and high-resolution transparent .PNG files.'
      },
      {
        q: 'Can you match exact Pantone (PMS) spot colors?',
        a: 'Yes! If you specify Pantone Solid Coated or Uncoated codes, we calibrate all vector fills and strokes to exact PMS color swatches ready for color separations.'
      },
      {
        q: 'Can you convert blurry photos or hand-drawn sketches?',
        a: 'Yes. Our artists trace every contour by hand using smooth Bézier curve nodes. We can clean up artifacts, fix symmetry, re-type text with matching fonts, and generate crisp vector art.'
      },
      {
        q: 'Are all fonts converted to vector curves/outlines?',
        a: 'Yes, all typography is converted to clean vector outlines so you can open the files on any printing computer without font missing errors.'
      }
    ],
    patches: [
      {
        q: 'What is the minimum order quantity (MOQ) for custom patches?',
        a: 'Our minimum order quantity is 50 pieces for custom embroidered, woven, or PVC patches, making it accessible for startups, clubs, and apparel brands alike with free digital proofs and sample approval.'
      },
      {
        q: 'Do I get to approve a digital proof before mass production?',
        a: 'Yes! We provide a 100% free digital proof within 12 hours of placing your order. For production runs, we also share high-resolution embroidered sample sew-out photos before shipping.'
      },
      {
        q: 'What backing options are available?',
        a: 'We offer Military-Grade Velcro (Hook & Loop), Heat-Seal Iron-On (for easy heat press application), Peel & Stick Self-Adhesive, and Plain Sew-On Plastic backing.'
      },
      {
        q: 'What is the difference between Embroidered and Woven patches?',
        a: 'Embroidered patches feature thicker threads stitched onto twill fabric with a classic textured, raised feel. Woven patches use ultra-thin threads woven together for flat, crisp rendering of intricate fine text down to 2mm.'
      }
    ]
  };

  return (
    <section id="services" style={{ 
      padding: '5.5rem 0 6rem', 
      background: 'var(--bg-main)', 
      color: 'var(--text-main)', 
      fontFamily: 'var(--font-body, "Inter", sans-serif)',
      position: 'relative',
      borderTop: '1px solid var(--border-color)',
      borderBottom: '1px solid var(--border-color)'
    }}>
      <div className="container">

        {/* Section Header */}
        <div style={{ textAlign: 'center', maxWidth: '800px', margin: '0 auto 2.75rem' }}>
          <div className="badge-pill-glow" style={{ marginBottom: '1rem' }}>
            <Sparkles size={16} style={{ color: 'var(--orange-500)' }} />
            <span>Professional Studio Services</span>
          </div>

          <h2 style={{
            fontSize: 'clamp(2.1rem, 3.8vw, 2.85rem)',
            fontFamily: 'var(--font-heading)',
            fontWeight: '900',
            color: 'var(--navy-950)',
            margin: '0 0 1rem 0',
            lineHeight: '1.18',
            letterSpacing: '-0.025em'
          }}>
            {activeTab === 'all' && (
              <>Complete <span className="text-gradient-orange">Studio Capabilities</span></>
            )}
            {activeTab === 'embroidery' && (
              <>Commercial <span className="text-gradient-orange">Embroidery Digitizing</span></>
            )}
            {activeTab === 'vector-art' && (
              <>Precision <span className="text-gradient-orange">Vector Art Conversion</span></>
            )}
            {activeTab === 'patches' && (
              <>Premium <span className="text-gradient-orange">Physical Custom Patches</span></>
            )}
          </h2>

          <p style={{
            fontSize: '1.1rem',
            color: 'var(--text-muted)',
            lineHeight: '1.65',
            margin: '0 auto',
          }}>
            {activeTab === 'all' && 'Three specialized production departments under one roof: commercial machine stitch files, scalable vector separations, and manufactured custom patches.'}
            {activeTab === 'embroidery' && 'Master machine-ready embroidery stitch files (.DST, .PES, .EMB) with zero thread breaks, calculated pull compensation, and free unlimited revisions.'}
            {activeTab === 'vector-art' && 'Clean, infinitely scalable vector graphics (.AI, .EPS, .SVG, .PDF) with hand-drawn Bézier curves and Pantone color separations ready for press.'}
            {activeTab === 'patches' && 'Custom embroidered, high-density woven, 3D molded PVC, and laser-engraved leather emblems delivered straight to your door.'}
          </p>
        </div>

        {/* ====================================================================
            VIEW 1: ALL SERVICES MASTER OVERVIEW GRID
           ==================================================================== */}
        {activeTab === 'all' && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))',
            gap: '1.75rem',
            alignItems: 'stretch'
          }}>
            {/* Service 1: Embroidery Digitizing (Flagship) */}
            <div 
              className="capability-card"
              style={{
                position: 'relative',
                padding: 'clamp(1.5rem, 2.8vw, 2rem)',
                background: 'var(--color-surface, #ffffff)',
                borderRadius: '24px',
                border: '1.5px solid rgba(234, 88, 12, 0.32)',
                boxShadow: 'var(--shadow-md, 0 8px 30px -4px rgba(234, 88, 12, 0.08))',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-8px)';
                e.currentTarget.style.boxShadow = '0 25px 50px -12px rgba(234, 88, 12, 0.25), 0 4px 16px rgba(0,0,0,0.1)';
                e.currentTarget.style.borderColor = 'var(--orange-500, #ea580c)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'var(--shadow-md, 0 8px 30px -4px rgba(234, 88, 12, 0.08))';
                e.currentTarget.style.borderColor = 'rgba(234, 88, 12, 0.32)';
              }}
            >
              {/* Top Accent Gradient Bar */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '5px',
                background: 'linear-gradient(90deg, #ea580c 0%, #f97316 50%, #fb923c 100%)'
              }} />

              <div>
                {/* Header Row: Icon, Service Badge & Starting Price */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', gap: '0.75rem' }}>
                  <div style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '16px',
                    background: 'linear-gradient(135deg, rgba(234, 88, 12, 0.18) 0%, rgba(249, 115, 22, 0.06) 100%)',
                    border: '1.5px solid rgba(234, 88, 12, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ea580c',
                    boxShadow: '0 4px 12px rgba(234, 88, 12, 0.12)'
                  }}>
                    <Layers size={26} />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.35rem' }}>
                    <span style={{
                      fontSize: '0.7rem',
                      fontWeight: 900,
                      background: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
                      color: '#ffffff',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '9999px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      boxShadow: '0 2px 8px rgba(234, 88, 12, 0.3)'
                    }}>
                      ★ Most Popular
                    </span>
                    <span style={{
                      fontSize: '0.85rem',
                      fontWeight: 800,
                      color: '#ea580c',
                      background: 'rgba(249, 115, 22, 0.1)',
                      border: '1px solid rgba(249, 115, 22, 0.25)',
                      padding: '0.2rem 0.65rem',
                      borderRadius: '8px'
                    }}>
                      Starts <strong>${embMinPrice.toFixed(2)}</strong> Flat
                    </span>
                  </div>
                </div>

                {/* Title & Description */}
                <h3 style={{
                  fontSize: '1.38rem',
                  fontWeight: 900,
                  color: 'var(--color-text-primary, var(--navy-950, #0f172a))',
                  margin: '0 0 0.45rem 0',
                  lineHeight: 1.25,
                  fontFamily: 'var(--font-heading)'
                }}>
                  Embroidery Digitizing
                </h3>

                <p style={{
                  color: 'var(--color-text-muted, #64748b)',
                  fontSize: '0.9rem',
                  lineHeight: 1.55,
                  margin: '0 0 1.2rem 0'
                }}>
                  Precision commercial stitch files (.DST, .PES, .EMB) with 100% hand pathing & 0 thread breaks guarantee.
                </p>

                {/* Production Packages & Tiers Box */}
                <div style={{
                  background: 'var(--color-subtle, rgba(15, 23, 42, 0.03))',
                  border: '1px solid var(--color-border, rgba(15, 23, 42, 0.07))',
                  borderRadius: '14px',
                  padding: '0.8rem 0.9rem',
                  marginBottom: '1.25rem'
                }}>
                  <div style={{
                    fontSize: '0.7rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: 'var(--color-text-muted, #64748b)',
                    marginBottom: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem'
                  }}>
                    <Sparkles size={12} style={{ color: '#ea580c' }} />
                    <span>Popular Production Tiers</span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                    {embTiersList.map((tier, tIdx) => (
                      <span
                        key={tIdx}
                        style={{
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          background: 'var(--color-surface, #ffffff)',
                          color: 'var(--color-text-primary, var(--navy-900, #0f172a))',
                          border: '1px solid var(--color-border, rgba(15, 23, 42, 0.1))',
                          padding: '0.28rem 0.65rem',
                          borderRadius: '8px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          boxShadow: 'var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.04))'
                        }}
                      >
                        <span>{tier.name}</span>
                        <strong style={{ color: '#ea580c', fontWeight: 900 }}>{tier.price}{tier.unit ? ` ${tier.unit}` : ''}</strong>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Quality Highlights Checklist */}
                <ul style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: '0 0 1.4rem 0',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.6rem',
                  fontSize: '0.86rem',
                  color: 'var(--color-text-secondary, var(--navy-800, #1e293b))'
                }}>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                    <div style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#059669', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <CheckCircle2 size={13} />
                    </div>
                    <span><strong>Machine Ready:</strong> Tajima .DST, Brother .PES & Wilcom .EMB</span>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                    <div style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#059669', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <CheckCircle2 size={13} />
                    </div>
                    <span><strong>0 Thread Breaks:</strong> Density & pull calibrated for caps/polos</span>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                    <div style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#059669', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <CheckCircle2 size={13} />
                    </div>
                    <span><strong>Free Revisions:</strong> Unlimited adjustments until clean sew-out</span>
                  </li>
                </ul>
              </div>

              {/* Card Footer: Turnaround & Action Buttons */}
              <div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingTop: '0.95rem',
                  borderTop: '1px solid var(--color-border, rgba(15, 23, 42, 0.08))',
                  fontSize: '0.82rem',
                  color: 'var(--color-text-secondary, var(--navy-700, #334155))',
                  marginBottom: '1.25rem'
                }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700 }}>
                    <Clock size={15} style={{ color: '#ea580c' }} /> 4–12h Turnaround
                  </span>
                  <span style={{
                    fontWeight: 800,
                    color: '#059669',
                    background: 'rgba(16, 185, 129, 0.1)',
                    padding: '0.2rem 0.6rem',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem'
                  }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
                    Instant Download
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '0.6rem' }}>
                  <button 
                    type="button"
                    style={{
                      flex: 1,
                      background: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '12px',
                      padding: '0.8rem 1rem',
                      fontWeight: 800,
                      fontSize: '0.9rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.45rem',
                      cursor: 'pointer',
                      boxShadow: '0 4px 14px rgba(234, 88, 12, 0.35)',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.filter = 'brightness(1.08)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.filter = 'none'; }}
                    onClick={() => handleSelectTabAndScrollToPackages('embroidery')}
                  >
                    <span>Choose Package & Order</span>
                    <ArrowRight size={15} />
                  </button>
                  <button 
                    type="button"
                    style={{
                      background: 'var(--color-surface, #ffffff)',
                      color: 'var(--color-text-primary, var(--navy-800, #1e293b))',
                      border: '1.5px solid var(--color-border, #e2e8f0)',
                      borderRadius: '12px',
                      padding: '0.8rem 0.95rem',
                      fontWeight: 800,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-subtle, #f8fafc)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--color-surface, #ffffff)'; }}
                    onClick={() => handleSelectTabAndScrollToPackages('embroidery')}
                  >
                    Details
                  </button>
                </div>
              </div>
            </div>

            {/* Service 2: Vector Art Conversion */}
            <div 
              className="capability-card"
              style={{
                position: 'relative',
                padding: 'clamp(1.5rem, 2.8vw, 2rem)',
                background: 'var(--color-surface, #ffffff)',
                borderRadius: '24px',
                border: '1.5px solid rgba(37, 99, 235, 0.32)',
                boxShadow: 'var(--shadow-md, 0 8px 30px -4px rgba(37, 99, 235, 0.08))',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-8px)';
                e.currentTarget.style.boxShadow = '0 25px 50px -12px rgba(37, 99, 235, 0.25), 0 4px 16px rgba(0,0,0,0.1)';
                e.currentTarget.style.borderColor = '#2563eb';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'var(--shadow-md, 0 8px 30px -4px rgba(37, 99, 235, 0.08))';
                e.currentTarget.style.borderColor = 'rgba(37, 99, 235, 0.32)';
              }}
            >
              {/* Top Accent Gradient Bar */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '5px',
                background: 'linear-gradient(90deg, #2563eb 0%, #3b82f6 50%, #60a5fa 100%)'
              }} />

              <div>
                {/* Header Row: Icon, Service Badge & Starting Price */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', gap: '0.75rem' }}>
                  <div style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '16px',
                    background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.16) 0%, rgba(59, 130, 246, 0.06) 100%)',
                    border: '1.5px solid rgba(37, 99, 235, 0.28)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#2563eb',
                    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.12)'
                  }}>
                    <PenTool size={26} />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.35rem' }}>
                    <span style={{
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      background: 'rgba(37, 99, 235, 0.1)',
                      color: '#2563eb',
                      border: '1px solid rgba(37, 99, 235, 0.25)',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '9999px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em'
                    }}>
                      ⚡ Scalable Vector
                    </span>
                    <span style={{
                      fontSize: '0.85rem',
                      fontWeight: 800,
                      color: '#2563eb',
                      background: 'rgba(37, 99, 235, 0.08)',
                      border: '1px solid rgba(37, 99, 235, 0.25)',
                      padding: '0.2rem 0.65rem',
                      borderRadius: '8px'
                    }}>
                      Starts <strong>${vecMinPrice.toFixed(2)}</strong> Flat
                    </span>
                  </div>
                </div>

                {/* Title & Description */}
                <h3 style={{
                  fontSize: '1.38rem',
                  fontWeight: 900,
                  color: 'var(--color-text-primary, var(--navy-950, #0f172a))',
                  margin: '0 0 0.45rem 0',
                  lineHeight: 1.25,
                  fontFamily: 'var(--font-heading)'
                }}>
                  Vector Art Conversion
                </h3>

                <p style={{
                  color: 'var(--color-text-muted, #64748b)',
                  fontSize: '0.9rem',
                  lineHeight: 1.55,
                  margin: '0 0 1.2rem 0'
                }}>
                  Crisp scalable vector separations (.AI, .EPS, .SVG, .PDF) traced by hand for screen printing & signage.
                </p>

                {/* Production Packages & Tiers Box */}
                <div style={{
                  background: 'var(--color-subtle, rgba(15, 23, 42, 0.03))',
                  border: '1px solid var(--color-border, rgba(15, 23, 42, 0.07))',
                  borderRadius: '14px',
                  padding: '0.8rem 0.9rem',
                  marginBottom: '1.25rem'
                }}>
                  <div style={{
                    fontSize: '0.7rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: 'var(--color-text-muted, #64748b)',
                    marginBottom: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem'
                  }}>
                    <Sparkles size={12} style={{ color: '#2563eb' }} />
                    <span>Popular Production Tiers</span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                    {vecTiersList.map((tier, tIdx) => (
                      <span
                        key={tIdx}
                        style={{
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          background: 'var(--color-surface, #ffffff)',
                          color: 'var(--color-text-primary, var(--navy-900, #0f172a))',
                          border: '1px solid var(--color-border, rgba(15, 23, 42, 0.1))',
                          padding: '0.28rem 0.65rem',
                          borderRadius: '8px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          boxShadow: 'var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.04))'
                        }}
                      >
                        <span>{tier.name}</span>
                        <strong style={{ color: '#2563eb', fontWeight: 900 }}>{tier.price}{tier.unit ? ` ${tier.unit}` : ''}</strong>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Quality Highlights Checklist */}
                <ul style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: '0 0 1.4rem 0',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.6rem',
                  fontSize: '0.86rem',
                  color: 'var(--color-text-secondary, var(--navy-800, #1e293b))'
                }}>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                    <div style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#059669', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <CheckCircle2 size={13} />
                    </div>
                    <span><strong>Master Vector Suite:</strong> Fully editable .AI, .EPS, .SVG & Print PDF</span>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                    <div style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#059669', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <CheckCircle2 size={13} />
                    </div>
                    <span><strong>Pantone Calibrated:</strong> Spot color separation & PMS swatches</span>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                    <div style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#059669', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <CheckCircle2 size={13} />
                    </div>
                    <span><strong>Print & Cut Ready:</strong> Clean Bézier paths for vinyl & screen print</span>
                  </li>
                </ul>
              </div>

              {/* Card Footer: Turnaround & Action Buttons */}
              <div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingTop: '0.95rem',
                  borderTop: '1px solid var(--color-border, rgba(15, 23, 42, 0.08))',
                  fontSize: '0.82rem',
                  color: 'var(--color-text-secondary, var(--navy-700, #334155))',
                  marginBottom: '1.25rem'
                }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700 }}>
                    <Clock size={15} style={{ color: '#2563eb' }} /> 6–12h Turnaround
                  </span>
                  <span style={{
                    fontWeight: 800,
                    color: '#059669',
                    background: 'rgba(16, 185, 129, 0.1)',
                    padding: '0.2rem 0.6rem',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem'
                  }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
                    Instant Download
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '0.6rem' }}>
                  <button 
                    type="button"
                    style={{
                      flex: 1,
                      background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '12px',
                      padding: '0.8rem 1rem',
                      fontWeight: 800,
                      fontSize: '0.9rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.45rem',
                      cursor: 'pointer',
                      boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.filter = 'brightness(1.08)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.filter = 'none'; }}
                    onClick={() => handleSelectTabAndScrollToPackages('vector-art')}
                  >
                    <span>Choose Package & Order</span>
                    <ArrowRight size={15} />
                  </button>
                  <button 
                    type="button"
                    style={{
                      background: 'var(--color-surface, #ffffff)',
                      color: 'var(--color-text-primary, var(--navy-800, #1e293b))',
                      border: '1.5px solid var(--color-border, #e2e8f0)',
                      borderRadius: '12px',
                      padding: '0.8rem 0.95rem',
                      fontWeight: 800,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-subtle, #f8fafc)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--color-surface, #ffffff)'; }}
                    onClick={() => handleSelectTabAndScrollToPackages('vector-art')}
                  >
                    Details
                  </button>
                </div>
              </div>
            </div>

            {/* Service 3: Custom Physical Patches */}
            <div 
              className="capability-card"
              style={{
                position: 'relative',
                padding: 'clamp(1.5rem, 2.8vw, 2rem)',
                background: 'var(--color-surface, #ffffff)',
                borderRadius: '24px',
                border: '1.5px solid rgba(5, 150, 105, 0.32)',
                boxShadow: 'var(--shadow-md, 0 8px 30px -4px rgba(5, 150, 105, 0.08))',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-8px)';
                e.currentTarget.style.boxShadow = '0 25px 50px -12px rgba(5, 150, 105, 0.25), 0 4px 16px rgba(0,0,0,0.1)';
                e.currentTarget.style.borderColor = '#059669';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'var(--shadow-md, 0 8px 30px -4px rgba(5, 150, 105, 0.08))';
                e.currentTarget.style.borderColor = 'rgba(5, 150, 105, 0.32)';
              }}
            >
              {/* Top Accent Gradient Bar */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '5px',
                background: 'linear-gradient(90deg, #059669 0%, #10b981 50%, #34d399 100%)'
              }} />

              <div>
                {/* Header Row: Icon, Service Badge & Starting Price */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', gap: '0.75rem' }}>
                  <div style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '16px',
                    background: 'linear-gradient(135deg, rgba(5, 150, 105, 0.16) 0%, rgba(16, 185, 129, 0.06) 100%)',
                    border: '1.5px solid rgba(5, 150, 105, 0.28)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#059669',
                    boxShadow: '0 4px 12px rgba(5, 150, 105, 0.12)'
                  }}>
                    <Tag size={26} />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.35rem' }}>
                    <span style={{
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      background: 'rgba(5, 150, 105, 0.1)',
                      color: '#059669',
                      border: '1px solid rgba(5, 150, 105, 0.25)',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '9999px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em'
                    }}>
                      📦 Physical Delivery • Min 50 Pcs
                    </span>
                    <span style={{
                      fontSize: '0.85rem',
                      fontWeight: 800,
                      color: '#059669',
                      background: 'rgba(5, 150, 105, 0.08)',
                      border: '1px solid rgba(5, 150, 105, 0.25)',
                      padding: '0.2rem 0.65rem',
                      borderRadius: '8px'
                    }}>
                      Starts <strong>${patchMinPrice.toFixed(2)}</strong> / Pc
                    </span>
                  </div>
                </div>

                {/* Title & Description */}
                <h3 style={{
                  fontSize: '1.38rem',
                  fontWeight: 900,
                  color: 'var(--color-text-primary, var(--navy-950, #0f172a))',
                  margin: '0 0 0.45rem 0',
                  lineHeight: 1.25,
                  fontFamily: 'var(--font-heading)'
                }}>
                  Custom Physical Patches
                </h3>

                <p style={{
                  color: 'var(--color-text-muted, #64748b)',
                  fontSize: '0.9rem',
                  lineHeight: 1.55,
                  margin: '0 0 1.2rem 0'
                }}>
                  Custom embroidered, high-density woven, and 3D molded PVC emblems manufactured & shipped to your door.
                </p>

                {/* Production Packages & Tiers Box */}
                <div style={{
                  background: 'var(--color-subtle, rgba(15, 23, 42, 0.03))',
                  border: '1px solid var(--color-border, rgba(15, 23, 42, 0.07))',
                  borderRadius: '14px',
                  padding: '0.8rem 0.9rem',
                  marginBottom: '1.25rem'
                }}>
                  <div style={{
                    fontSize: '0.7rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: 'var(--color-text-muted, #64748b)',
                    marginBottom: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem'
                  }}>
                    <Sparkles size={12} style={{ color: '#059669' }} />
                    <span>Popular Production Tiers</span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                    {patchTiersList.map((tier, tIdx) => (
                      <span
                        key={tIdx}
                        style={{
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          background: 'var(--color-surface, #ffffff)',
                          color: 'var(--color-text-primary, var(--navy-900, #0f172a))',
                          border: '1px solid var(--color-border, rgba(15, 23, 42, 0.1))',
                          padding: '0.28rem 0.65rem',
                          borderRadius: '8px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          boxShadow: 'var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.04))'
                        }}
                      >
                        <span>{tier.name}</span>
                        <strong style={{ color: '#059669', fontWeight: 900 }}>{tier.price}{tier.unit ? ` ${tier.unit}` : ''}</strong>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Quality Highlights Checklist */}
                <ul style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: '0 0 1.4rem 0',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.6rem',
                  fontSize: '0.86rem',
                  color: 'var(--color-text-secondary, var(--navy-800, #1e293b))'
                }}>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                    <div style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#059669', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <CheckCircle2 size={13} />
                    </div>
                    <span><strong>Min 50 Pcs MOQ:</strong> Free digital proof & physical sample sew-out photo</span>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                    <div style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#059669', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <CheckCircle2 size={13} />
                    </div>
                    <span><strong>Versatile Backings:</strong> Velcro (Hook & Loop), Iron-On & Peel/Stick</span>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                    <div style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#059669', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <CheckCircle2 size={13} />
                    </div>
                    <span><strong>Doorstep Delivery:</strong> Express tracked worldwide courier shipping</span>
                  </li>
                </ul>
              </div>

              {/* Card Footer: Turnaround & Action Buttons */}
              <div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingTop: '0.95rem',
                  borderTop: '1px solid var(--color-border, rgba(15, 23, 42, 0.08))',
                  fontSize: '0.82rem',
                  color: 'var(--color-text-secondary, var(--navy-700, #334155))',
                  marginBottom: '1.25rem'
                }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700 }}>
                    <Clock size={15} style={{ color: '#059669' }} /> 3–5 Days Production
                  </span>
                  <span style={{
                    fontWeight: 800,
                    color: '#059669',
                    background: 'rgba(16, 185, 129, 0.1)',
                    padding: '0.2rem 0.6rem',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem'
                  }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
                    Global Delivery
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '0.6rem' }}>
                  <button 
                    type="button"
                    style={{
                      flex: 1,
                      background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '12px',
                      padding: '0.8rem 1rem',
                      fontWeight: 800,
                      fontSize: '0.9rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.45rem',
                      cursor: 'pointer',
                      boxShadow: '0 4px 14px rgba(5, 150, 105, 0.35)',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.filter = 'brightness(1.08)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.filter = 'none'; }}
                    onClick={() => handleSelectTabAndScrollToPackages('patches')}
                  >
                    <span>Choose Package & Order</span>
                    <ArrowRight size={15} />
                  </button>
                  <button 
                    type="button"
                    style={{
                      background: 'var(--color-surface, #ffffff)',
                      color: 'var(--color-text-primary, var(--navy-800, #1e293b))',
                      border: '1.5px solid var(--color-border, #e2e8f0)',
                      borderRadius: '12px',
                      padding: '0.8rem 0.95rem',
                      fontWeight: 800,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-subtle, #f8fafc)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--color-surface, #ffffff)'; }}
                    onClick={() => handleSelectTabAndScrollToPackages('patches')}
                  >
                    Details
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ====================================================================
            VIEW 2: EMBROIDERY TAB (Dynamic Embroidery Packages)
           ==================================================================== */}
        {activeTab === 'embroidery' && (
          <div>
            {/* 1. Introduction Banner */}
            <div className="theme-service-banner" style={{
              background: 'var(--banner-bg)',
              color: 'var(--text-main)',
              borderRadius: '24px',
              padding: '3rem 2.5rem',
              marginBottom: '3.5rem',
              border: '1.5px solid var(--banner-border)',
              boxShadow: 'var(--shadow-lg)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{ maxWidth: '820px' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(249, 115, 22, 0.12)', border: '1px solid rgba(249, 115, 22, 0.3)', color: 'var(--orange-600)', padding: '0.35rem 0.95rem', borderRadius: '9999px', fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1.25rem' }}>
                  <Layers size={16} /> Factory-Grade Machine Embroidery Digitizing
                </div>
                <h3 style={{ fontSize: 'clamp(1.85rem, 3.2vw, 2.4rem)', fontWeight: 900, marginBottom: '1rem', lineHeight: 1.2, color: 'var(--banner-title)' }}>
                  Engineered For Smooth Running With Zero Thread Breaks
                </h3>
                <p style={{ color: 'var(--banner-desc)', fontSize: '1.05rem', lineHeight: 1.65, marginBottom: '2rem' }}>
                  We convert your logos and artwork into high-efficiency stitch files designed specifically for your fabric type (caps, pique polos, fleece hoodies, performance wear, or leather) and machine make.
                </p>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="btn btn-primary-orange btn-lg"
                    onClick={() => handleLaunchOrder('embroidery')}
                    style={{ fontWeight: 800, padding: '0.85rem 2rem' }}
                  >
                    <Upload size={18} /> Order Embroidery Digitizing
                  </button>
                </div>
              </div>
            </div>

            {/* 2. Key Benefits Grid */}
            <div style={{ marginBottom: '3.5rem' }}>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: '1.5rem', textAlign: 'center' }}>
                Embroidery Engineering Advantages
              </h3>
              <div className="grid-responsive-4">
                {[
                  { title: '100% Manual Digitizing', desc: 'No automated auto-tracing shortcuts. Every stitch angle and density point is manually mapped by master digitizers.' },
                  { title: 'Zero Thread Breaks', desc: 'Optimized stitch pathing, smart trim count reductions, and proper push-pull compensation ensure fast runs.' },
                  { title: 'All Machine Formats', desc: 'Full compatibility with Tajima (.DST), Wilcom (.EMB), Brother (.PES), Melco (.EXP), Barudan, and Janome.' },
                  { title: '4–12 Hr Fast Delivery', desc: 'Fast turnaround with production simulation run-sheets, thread sequence charts, and free revisions.' }
                ].map((item) => (
                  <div key={item.title} className="card" style={{ background: 'var(--color-surface, var(--bg-card))', padding: '1.75rem 1.5rem', borderRadius: '16px', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--color-primary-light)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                      <CheckCircle2 size={22} />
                    </div>
                    <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: '0.5rem' }}>{item.title}</h4>
                    <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', lineHeight: 1.55, margin: 0 }}>{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. Types of Embroidery Available */}
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
                    <div style={{ color: 'var(--color-primary)', fontWeight: 800, fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '0.35rem' }}>Embroidery Type</div>
                    <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: '0.5rem' }}>{type.name}</h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', lineHeight: 1.5, margin: 0 }}>{type.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 4. Packages & Pricing Grid (Dynamic from DB) */}
            <div id="embroidery-packages-grid" style={{ marginBottom: '3.5rem', scrollMarginTop: '110px' }}>
              <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
                <h3 style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--color-text-primary)', marginBottom: '0.4rem' }}>
                  Choose Your Embroidery Package to Start ({embroideryTiers.length} Tiers)
                </h3>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.925rem', margin: 0 }}>
                  Select any package tier below to launch your order instantly with pre-configured settings.
                </p>
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
                gap: '1.5rem',
                alignItems: 'stretch'
              }}>
                {embroideryTiers.map((pkg, idx) => (
                  <PackageCard
                    key={pkg.id || idx}
                    cat={pkg}
                    idx={idx}
                    onSelect={(selectedPkg) => handleLaunchOrder('embroidery', idx === 0 ? 'basic' : idx === 1 ? 'standard' : 'premium', selectedPkg)}
                    forceCategory="embroidery"
                  />
                ))}
              </div>
            </div>

            {/* 5. Turnaround & Delivery Info */}
            <div style={{ background: 'var(--color-subtle, var(--bg-subtle))', border: '1px solid var(--color-border)', borderRadius: '16px', padding: '1.5rem 2rem', marginBottom: '3.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--color-primary-light)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Clock size={24} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>Turnaround & Delivery Information</h4>
                  <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>Standard Delivery: 8–12 hrs | Express Rush: 4–6 hrs | Delivered straight to your client dashboard & email.</p>
                </div>
              </div>
              <button type="button" className="btn btn-primary-orange btn-sm" onClick={() => handleLaunchOrder('embroidery')}>
                Get Started Now <ArrowRight size={14} />
              </button>
            </div>

            {/* 6. Tailored Embroidery FAQs */}
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: '1.5rem', textAlign: 'center' }}>
                Frequently Asked Questions — Embroidery
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {serviceFaqs.embroidery.map((faq, idx) => {
                  const isOpen = openFaqIndex === idx;
                  return (
                    <div key={faq.q} className="card" style={{ background: 'var(--color-surface, var(--bg-card))', borderRadius: '14px', border: isOpen ? '1.5px solid var(--color-primary)' : '1px solid var(--color-border)', overflow: 'hidden' }}>
                      <button
                        type="button"
                        onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                        style={{ width: '100%', padding: '1.25rem 1.5rem', background: 'none', border: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', textAlign: 'left', fontWeight: 700, fontSize: '1rem', color: isOpen ? 'var(--color-primary)' : 'var(--color-text-primary)' }}
                      >
                        <span>{faq.q}</span>
                        <ChevronDown size={18} style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0, color: 'var(--color-primary)' }} />
                      </button>
                      {isOpen && (
                        <div style={{ padding: '0 1.5rem 1.25rem', fontSize: '0.925rem', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
                          {faq.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ====================================================================
            VIEW 3: VECTOR ART TAB (Dynamic Vector Packages)
           ==================================================================== */}
        {activeTab === 'vector-art' && (
          <div>
            {/* 1. Introduction Banner */}
            <div className="theme-service-banner" style={{
              background: 'var(--banner-bg)',
              color: 'var(--text-main)',
              borderRadius: '24px',
              padding: '3rem 2.5rem',
              marginBottom: '3.5rem',
              border: '1.5px solid var(--banner-border)',
              boxShadow: 'var(--shadow-lg)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{ maxWidth: '820px' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(59, 130, 246, 0.15)', border: '1px solid rgba(59, 130, 246, 0.3)', color: '#38bdf8', padding: '0.35rem 0.95rem', borderRadius: '9999px', fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1.25rem' }}>
                  <PenTool size={16} /> Precision Vector Redraw & Color Separation
                </div>
                <h3 style={{ fontSize: 'clamp(1.85rem, 3.2vw, 2.4rem)', fontWeight: 900, marginBottom: '1rem', lineHeight: 1.2, color: 'var(--banner-title)' }}>
                  Infinitely Scalable Vector Art Ready For Any Print Application
                </h3>
                <p style={{ color: 'var(--banner-desc)', fontSize: '1.05rem', lineHeight: 1.65, marginBottom: '2rem' }}>
                  Convert blurry low-resolution JPEGs, pixelated PNGs, photographs, or hand sketches into razor-sharp scalable vector artwork with clean Bézier nodes, exact Pantone color matching, and separated print layers.
                </p>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="btn btn-primary-orange btn-lg"
                    onClick={() => handleLaunchOrder('vector')}
                    style={{ fontWeight: 800, padding: '0.85rem 2rem', background: '#2563eb', borderColor: '#2563eb' }}
                  >
                    <Upload size={18} /> Order Vector Art Conversion
                  </button>
                </div>
              </div>
            </div>

            {/* 2. Key Benefits Grid */}
            <div style={{ marginBottom: '3.5rem' }}>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: '1.5rem', textAlign: 'center' }}>
                Vector Engineering Advantages
              </h3>
              <div className="grid-responsive-4">
                {[
                  { title: '100% Hand-Drawn Nodes', desc: 'Smooth Bézier curve paths drawn with minimal anchor points for razor-sharp vinyl cutters and print presses.' },
                  { title: 'Pantone (PMS) Separation', desc: 'Clean layer separation calibrated to exact Pantone spot colors for screen printing and DTF presses.' },
                  { title: 'Master File Suite', desc: 'Deliverables include editable Adobe Illustrator (.AI), vector .EPS, scalable .SVG, and high-res print PDF.' },
                  { title: '6–12 Hr Fast Delivery', desc: 'Rapid turnaround with free unlimited node corrections, text edits, and color swatch variations.' }
                ].map((item) => (
                  <div key={item.title} className="card" style={{ background: 'var(--color-surface, var(--bg-card))', padding: '1.75rem 1.5rem', borderRadius: '16px', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.15)', color: '#38bdf8', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                      <CheckCircle2 size={22} />
                    </div>
                    <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: '0.5rem' }}>{item.title}</h4>
                    <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', lineHeight: 1.55, margin: 0 }}>{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. Available Vector Services */}
            <div style={{ marginBottom: '3.5rem' }}>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: '1.5rem', textAlign: 'center' }}>
                Available Vector Art Services
              </h3>
              <div className="grid-responsive-4">
                {[
                  { name: 'Blurry Logo Vector Redraw', desc: 'Convert pixelated raster logos, screenshots, and web graphics into crisp high-resolution vectors.' },
                  { name: 'Screen Print Color Separation', desc: 'Multi-color spot plate separations with registration marks, chokes, and spreads for screen printers.' },
                  { name: 'Vinyl Cut & Laser Line Art', desc: 'Single-line closed cut paths optimized for vinyl plotters, laser engraving machines, and CNC routers.' },
                  { name: 'Artwork Modifications & Fonts', desc: 'Font matching, custom re-lettering, color tweaks, and layout adaptations for apparel templates.' }
                ].map((type) => (
                  <div key={type.name} className="card" style={{ background: 'var(--color-surface, var(--bg-card))', padding: '1.5rem', borderRadius: '16px', border: '1.5px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
                    <div style={{ color: '#38bdf8', fontWeight: 800, fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '0.35rem' }}>Vector Service</div>
                    <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: '0.5rem' }}>{type.name}</h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', lineHeight: 1.5, margin: 0 }}>{type.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 4. Packages & Pricing Grid (Dynamic from DB) */}
            <div id="vector-art-packages-grid" style={{ marginBottom: '3.5rem', scrollMarginTop: '110px' }}>
              <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
                <h3 style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--color-text-primary)', marginBottom: '0.4rem' }}>
                  Choose Your Vector Art Package to Start ({vectorTiers.length} Tiers)
                </h3>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.925rem', margin: 0 }}>
                  Select any package tier below to launch your order instantly with pre-configured settings.
                </p>
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
                gap: '1.5rem',
                alignItems: 'stretch'
              }}>
                {vectorTiers.map((pkg, idx) => (
                  <PackageCard
                    key={pkg.id || idx}
                    cat={pkg}
                    idx={idx}
                    onSelect={(selectedPkg) => handleLaunchOrder('vector', idx === 0 ? 'basic' : idx === 1 ? 'standard' : 'premium', selectedPkg)}
                    forceCategory="vector"
                  />
                ))}
              </div>
            </div>

            {/* 5. Turnaround & Delivery Info */}
            <div style={{ background: 'var(--color-subtle, var(--bg-subtle))', border: '1px solid var(--color-border)', borderRadius: '16px', padding: '1.5rem 2rem', marginBottom: '3.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.15)', color: '#38bdf8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Clock size={24} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>Turnaround & Delivery Information</h4>
                  <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>Standard Delivery: 6–12 hrs | Rush Orders: 3–6 hrs | Master Vector files (.AI, .EPS, .SVG, .PDF) available via instant download.</p>
                </div>
              </div>
              <button type="button" className="btn btn-primary-orange btn-sm" style={{ background: '#2563eb', borderColor: '#2563eb' }} onClick={() => handleLaunchOrder('vector')}>
                Get Started Now <ArrowRight size={14} />
              </button>
            </div>

            {/* 6. Tailored Vector FAQs */}
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: '1.5rem', textAlign: 'center' }}>
                Frequently Asked Questions — Vector Art
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {serviceFaqs['vector-art'].map((faq, idx) => {
                  const isOpen = openFaqIndex === idx;
                  return (
                    <div key={faq.q} className="card" style={{ background: 'var(--color-surface, var(--bg-card))', borderRadius: '14px', border: isOpen ? '1.5px solid #3b82f6' : '1px solid var(--color-border)', overflow: 'hidden' }}>
                      <button
                        type="button"
                        onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                        style={{ width: '100%', padding: '1.25rem 1.5rem', background: 'none', border: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', textAlign: 'left', fontWeight: 700, fontSize: '1rem', color: isOpen ? '#38bdf8' : 'var(--color-text-primary)' }}
                      >
                        <span>{faq.q}</span>
                        <ChevronDown size={18} style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0, color: '#38bdf8' }} />
                      </button>
                      {isOpen && (
                        <div style={{ padding: '0 1.5rem 1.25rem', fontSize: '0.925rem', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
                          {faq.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ====================================================================
            VIEW 4: PATCHES TAB (Dynamic Patches Packages)
           ==================================================================== */}
        {activeTab === 'patches' && (
          <div>
            {/* 1. Introduction Banner */}
            <div className="theme-service-banner" style={{
              background: 'var(--banner-bg)',
              color: 'var(--text-main)',
              borderRadius: '24px',
              padding: '3rem 2.5rem',
              marginBottom: '3.5rem',
              border: '1.5px solid var(--banner-border)',
              boxShadow: 'var(--shadow-lg)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{ maxWidth: '820px' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#34d399', padding: '0.35rem 0.95rem', borderRadius: '9999px', fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1.25rem' }}>
                  <Tag size={16} /> Premium Custom Physical Patches & Emblems
                </div>
                <h3 style={{ fontSize: 'clamp(1.85rem, 3.2vw, 2.4rem)', fontWeight: 900, marginBottom: '1rem', lineHeight: 1.2, color: 'var(--banner-title)' }}>
                  Custom Embroidered, Woven & 3D Molded PVC Patches
                </h3>
                <p style={{ color: 'var(--banner-desc)', fontSize: '1.05rem', lineHeight: 1.65, marginBottom: '2rem' }}>
                  Elevate your uniforms, headwear, jackets, and tactical gear with commercial-quality custom patches. Available with Velcro hook & loop, iron-on, or adhesive backings delivered to your doorstep.
                </p>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="btn btn-primary-orange btn-lg"
                    onClick={() => handleLaunchOrder('patch')}
                    style={{ fontWeight: 800, padding: '0.85rem 2rem', background: '#059669', borderColor: '#059669' }}
                  >
                    <Upload size={18} /> Order Custom Patches
                  </button>
                </div>
              </div>
            </div>

            {/* 2. Types of Patches Available */}
            <div style={{ marginBottom: '3.5rem' }}>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: '1.5rem', textAlign: 'center' }}>
                Patch Types & Manufacturing Materials
              </h3>
              <div className="grid-responsive-4">
                {[
                  { name: 'Custom Embroidered Patches', desc: 'Classic textured 3D embroidery threads stitched over durable twill fabric. Ideal for hats, jackets, and uniforms.' },
                  { name: 'High-Definition Woven Patches', desc: 'Ultra-thin woven threads creating flat, crisp surfaces capable of rendering micro-details and tiny text.' },
                  { name: '3D Molded PVC Rubber Patches', desc: '100% waterproof, flexible, and rugged molded PVC rubber with raised 3D dimensional layers.' },
                  { name: 'Laser Leather & Sublimated Patches', desc: 'Genuine leather, faux leather engraved emblems, and full-color photo-realistic printed patches.' }
                ].map((type) => (
                  <div key={type.name} className="card" style={{ background: 'var(--color-surface, var(--bg-card))', padding: '1.5rem', borderRadius: '16px', border: '1.5px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
                    <div style={{ color: '#34d399', fontWeight: 800, fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '0.35rem' }}>Patch Style</div>
                    <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: '0.5rem' }}>{type.name}</h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', lineHeight: 1.5, margin: 0 }}>{type.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. Backing & Border Options */}
            <div style={{ marginBottom: '3.5rem' }}>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: '1.5rem', textAlign: 'center' }}>
                Backing & Border Finishes
              </h3>
              <div className="grid-responsive-4">
                {[
                  { title: 'Velcro (Hook & Loop)', desc: 'Military-grade hook backing pre-attached for easy swapping on tactical vests, hats, and jackets.' },
                  { title: 'Heat-Seal Iron-On', desc: 'Industrial heat-activated adhesive backing for fast application with a standard home iron or heat press.' },
                  { title: 'Peel & Stick Adhesive', desc: 'Convenient sticky backing for temporary application on clothing, packaging, event passes, or flat surfaces.' },
                  { title: 'Merrowed / Laser Cut Border', desc: 'Traditional heavy wrap-around merrowed border or ultra-clean laser heat-sealed custom shape edges.' }
                ].map((opt) => (
                  <div key={opt.title} className="card" style={{ background: 'var(--color-surface, var(--bg-card))', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.75rem' }}>
                      <CheckCircle2 size={20} />
                    </div>
                    <h4 style={{ fontSize: '1.025rem', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: '0.35rem' }}>{opt.title}</h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', lineHeight: 1.5, margin: 0 }}>{opt.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 4. Packages & Quantity Pricing Tiers (Dynamic from DB) */}
            <div id="patches-packages-grid" style={{ marginBottom: '3.5rem', scrollMarginTop: '110px' }}>
              <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
                <h3 style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--color-text-primary)', marginBottom: '0.4rem' }}>
                  Choose Your Custom Patches Package to Start ({patchTiers.length} Tiers)
                </h3>
                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.925rem', margin: 0 }}>
                  Select any quantity tier below to launch your patch order instantly with pre-configured volume pricing.
                </p>
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
                gap: '1.5rem',
                alignItems: 'stretch'
              }}>
                {patchTiers.map((pkg, idx) => (
                  <PackageCard
                    key={pkg.id || idx}
                    cat={pkg}
                    idx={idx}
                    onSelect={(selectedPkg) => handleLaunchOrder('patch', idx === 0 ? 'basic' : idx === 1 ? 'standard' : 'premium', selectedPkg)}
                    forceCategory="patch"
                  />
                ))}
              </div>
            </div>

            {/* 5. Turnaround & Delivery Info */}
            <div style={{ background: 'var(--color-subtle, var(--bg-subtle))', border: '1px solid var(--color-border)', borderRadius: '16px', padding: '1.5rem 2rem', marginBottom: '3.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <PackageCheck size={24} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>Free Digital Proof & Doorstep Shipping</h4>
                  <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>Free digital mockups in 12 hours | Physical production in 3–5 days | Express tracked worldwide delivery.</p>
                </div>
              </div>
              <button type="button" className="btn btn-primary-orange btn-sm" style={{ background: '#059669', borderColor: '#059669' }} onClick={() => handleLaunchOrder('patch')}>
                Get Instant Proof <ArrowRight size={14} />
              </button>
            </div>

            {/* 6. Tailored Patches FAQs */}
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: '1.5rem', textAlign: 'center' }}>
                Frequently Asked Questions — Custom Patches
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {serviceFaqs.patches.map((faq, idx) => {
                  const isOpen = openFaqIndex === idx;
                  return (
                    <div key={faq.q} className="card" style={{ background: 'var(--color-surface, var(--bg-card))', borderRadius: '14px', border: isOpen ? '1.5px solid #10b981' : '1px solid var(--color-border)', overflow: 'hidden' }}>
                      <button
                        type="button"
                        onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                        style={{ width: '100%', padding: '1.25rem 1.5rem', background: 'none', border: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', textAlign: 'left', fontWeight: 700, fontSize: '1rem', color: isOpen ? '#34d399' : 'var(--color-text-primary)' }}
                      >
                        <span>{faq.q}</span>
                        <ChevronDown size={18} style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0, color: '#34d399' }} />
                      </button>
                      {isOpen && (
                        <div style={{ padding: '0 1.5rem 1.25rem', fontSize: '0.925rem', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
                          {faq.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

      </div>
    </section>
  );
};

export default ServicesSection;
