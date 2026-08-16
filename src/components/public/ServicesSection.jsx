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
    : 'Sample Run ($4.50), Production Batch ($2.50), Wholesale Bulk ($1.50)';



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
        a: 'Our minimum order is just 10 pieces for custom embroidered, woven, or PVC patches, making it accessible for startups, clubs, and large apparel brands alike.'
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

  if (activeTab === 'all') {
    return null;
  }

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
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
            background: 'var(--orange-50)',
            border: '1px solid var(--orange-200)',
            color: 'var(--orange-700)',
            padding: '0.35rem 0.95rem',
            borderRadius: '9999px',
            fontSize: '0.85rem',
            fontWeight: '800',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: '1rem',
          }}>
            <Sparkles size={16} />
            Professional Studio Services
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
            {activeTab === 'embroidery' && (
              <>Commercial <span style={{ color: 'var(--orange-500)' }}>Embroidery Digitizing</span></>
            )}
            {activeTab === 'vector-art' && (
              <>Precision <span style={{ color: 'var(--orange-500)' }}>Vector Art Conversion</span></>
            )}
            {activeTab === 'patches' && (
              <>Premium <span style={{ color: 'var(--orange-500)' }}>Physical Custom Patches</span></>
            )}
          </h2>

          <p style={{
            fontSize: '1.1rem',
            color: 'var(--text-muted)',
            lineHeight: '1.65',
            margin: '0 auto',
          }}>
            {activeTab === 'embroidery' && 'Master machine-ready embroidery stitch files (.DST, .PES, .EMB) with zero thread breaks, calculated pull compensation, and free unlimited revisions.'}
            {activeTab === 'vector-art' && 'Clean, infinitely scalable vector graphics (.AI, .EPS, .SVG, .PDF) with hand-drawn Bézier curves and Pantone color separations ready for press.'}
            {activeTab === 'patches' && 'Custom embroidered, high-density woven, 3D molded PVC, and laser-engraved leather emblems delivered straight to your door.'}
          </p>
        </div>

        {/* ====================================================================
            VIEW 2: EMBROIDERY TAB (Dynamic Embroidery Packages)
           ==================================================================== */}
        {activeTab === 'embroidery' && (
          <div>
            {/* 1. Introduction Banner */}
            <div style={{
              background: 'linear-gradient(135deg, var(--navy-950) 0%, var(--navy-900) 100%)',
              color: '#ffffff',
              borderRadius: '24px',
              padding: '3rem 2.5rem',
              marginBottom: '3.5rem',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: 'var(--shadow-xl)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{ maxWidth: '820px' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(249, 115, 22, 0.15)', border: '1px solid rgba(249, 115, 22, 0.35)', color: 'var(--orange-400)', padding: '0.35rem 0.95rem', borderRadius: '9999px', fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1.25rem' }}>
                  <Layers size={16} /> Factory-Grade Machine Embroidery Digitizing
                </div>
                <h3 style={{ fontSize: 'clamp(1.85rem, 3.2vw, 2.4rem)', fontWeight: 900, marginBottom: '1rem', lineHeight: 1.2, color: '#ffffff' }}>
                  Engineered For Smooth Running With Zero Thread Breaks
                </h3>
                <p style={{ color: '#cbd5e1', fontSize: '1.05rem', lineHeight: 1.65, marginBottom: '2rem' }}>
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
              <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--navy-950)', marginBottom: '1.5rem', textAlign: 'center' }}>
                Embroidery Engineering Advantages
              </h3>
              <div className="grid-responsive-4">
                {[
                  { title: '100% Manual Digitizing', desc: 'No automated auto-tracing shortcuts. Every stitch angle and density point is manually mapped by master digitizers.' },
                  { title: 'Zero Thread Breaks', desc: 'Optimized stitch pathing, smart trim count reductions, and proper push-pull compensation ensure fast runs.' },
                  { title: 'All Machine Formats', desc: 'Full compatibility with Tajima (.DST), Wilcom (.EMB), Brother (.PES), Melco (.EXP), Barudan, and Janome.' },
                  { title: '4–12 Hr Fast Delivery', desc: 'Fast turnaround with production simulation run-sheets, thread sequence charts, and free revisions.' }
                ].map((item) => (
                  <div key={item.title} className="card" style={{ background: '#ffffff', padding: '1.75rem 1.5rem', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--orange-50)', color: 'var(--orange-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                      <CheckCircle2 size={22} />
                    </div>
                    <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--navy-950)', marginBottom: '0.5rem' }}>{item.title}</h4>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.55, margin: 0 }}>{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. Types of Embroidery Available */}
            <div style={{ marginBottom: '3.5rem' }}>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--navy-950)', marginBottom: '1.5rem', textAlign: 'center' }}>
                Supported Embroidery Placements & Styles
              </h3>
              <div className="grid-responsive-4">
                {[
                  { name: 'Left Chest & Polo Logos', desc: 'Precision center-out stitching designed specifically for stable front polo and corporate uniform shirts.' },
                  { name: '3D Puff / Foam Caps', desc: 'High-density satin top stitches over EVA puff foam with capped endpoints for clean 3D raised hats.' },
                  { name: 'Full Jacket Backs', desc: 'Large scale designs up to 100,000+ stitches engineered with lightweight underlays to prevent fabric puckering.' },
                  { name: 'Applique & Micro-Text', desc: 'Crisp small lettering down to 4mm and fabric patch tack-down lines with satin border finishes.' }
                ].map((type) => (
                  <div key={type.name} className="card" style={{ background: '#ffffff', padding: '1.5rem', borderRadius: '16px', border: '1.5px solid var(--orange-100)', boxShadow: 'var(--shadow-sm)' }}>
                    <div style={{ color: 'var(--orange-600)', fontWeight: 800, fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '0.35rem' }}>Embroidery Type</div>
                    <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--navy-950)', marginBottom: '0.5rem' }}>{type.name}</h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>{type.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 4. Packages & Pricing Grid (Dynamic from DB) */}
            <div style={{ marginBottom: '3.5rem' }}>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--navy-950)', marginBottom: '1.5rem', textAlign: 'center' }}>
                Embroidery Digitizing Packages ({embroideryTiers.length})
              </h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
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
            <div style={{ background: '#f8fafc', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '1.5rem 2rem', marginBottom: '3.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--orange-50)', color: 'var(--orange-600)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Clock size={24} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--navy-950)' }}>Turnaround & Delivery Information</h4>
                  <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Standard Delivery: 8–12 hrs | Express Rush: 4–6 hrs | Delivered straight to your client dashboard & email.</p>
                </div>
              </div>
              <button type="button" className="btn btn-primary-orange btn-sm" onClick={() => handleLaunchOrder('embroidery')}>
                Get Started Now <ArrowRight size={14} />
              </button>
            </div>

            {/* 6. Tailored Embroidery FAQs */}
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--navy-950)', marginBottom: '1.5rem', textAlign: 'center' }}>
                Frequently Asked Questions — Embroidery
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {serviceFaqs.embroidery.map((faq, idx) => {
                  const isOpen = openFaqIndex === idx;
                  return (
                    <div key={faq.q} className="card" style={{ background: '#ffffff', borderRadius: '14px', border: isOpen ? '1.5px solid var(--orange-400)' : '1px solid var(--border-color)', overflow: 'hidden' }}>
                      <button
                        type="button"
                        onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                        style={{ width: '100%', padding: '1.25rem 1.5rem', background: 'none', border: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', textAlign: 'left', fontWeight: 700, fontSize: '1rem', color: isOpen ? 'var(--orange-600)' : 'var(--navy-950)' }}
                      >
                        <span>{faq.q}</span>
                        <ChevronDown size={18} style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0, color: 'var(--orange-500)' }} />
                      </button>
                      {isOpen && (
                        <div style={{ padding: '0 1.5rem 1.25rem', fontSize: '0.925rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
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
            <div style={{
              background: 'linear-gradient(135deg, var(--navy-950) 0%, var(--navy-900) 100%)',
              color: '#ffffff',
              borderRadius: '24px',
              padding: '3rem 2.5rem',
              marginBottom: '3.5rem',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: 'var(--shadow-xl)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{ maxWidth: '820px' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(249, 115, 22, 0.15)', border: '1px solid rgba(249, 115, 22, 0.35)', color: 'var(--orange-400)', padding: '0.35rem 0.95rem', borderRadius: '9999px', fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1.25rem' }}>
                  <PenTool size={16} /> Precision Vector Redraw & Color Separation
                </div>
                <h3 style={{ fontSize: 'clamp(1.85rem, 3.2vw, 2.4rem)', fontWeight: 900, marginBottom: '1rem', lineHeight: 1.2, color: '#ffffff' }}>
                  Infinitely Scalable Vector Art Ready For Any Print Application
                </h3>
                <p style={{ color: '#cbd5e1', fontSize: '1.05rem', lineHeight: 1.65, marginBottom: '2rem' }}>
                  Convert blurry low-resolution JPEGs, pixelated PNGs, photographs, or hand sketches into razor-sharp scalable vector artwork with clean Bézier nodes, exact Pantone color matching, and separated print layers.
                </p>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="btn btn-primary-orange btn-lg"
                    onClick={() => handleLaunchOrder('vector')}
                    style={{ fontWeight: 800, padding: '0.85rem 2rem' }}
                  >
                    <Upload size={18} /> Order Vector Art Conversion
                  </button>
                </div>
              </div>
            </div>

            {/* 2. Key Benefits Grid */}
            <div style={{ marginBottom: '3.5rem' }}>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--navy-950)', marginBottom: '1.5rem', textAlign: 'center' }}>
                Vector Engineering Advantages
              </h3>
              <div className="grid-responsive-4">
                {[
                  { title: '100% Hand-Drawn Nodes', desc: 'Smooth Bézier curve paths drawn with minimal anchor points for razor-sharp vinyl cutters and print presses.' },
                  { title: 'Pantone (PMS) Separation', desc: 'Clean layer separation calibrated to exact Pantone spot colors for screen printing and DTF presses.' },
                  { title: 'Master File Suite', desc: 'Deliverables include editable Adobe Illustrator (.AI), vector .EPS, scalable .SVG, and high-res print PDF.' },
                  { title: '6–12 Hr Fast Delivery', desc: 'Rapid turnaround with free unlimited node corrections, text edits, and color swatch variations.' }
                ].map((item) => (
                  <div key={item.title} className="card" style={{ background: '#ffffff', padding: '1.75rem 1.5rem', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--orange-50)', color: 'var(--orange-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                      <CheckCircle2 size={22} />
                    </div>
                    <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--navy-950)', marginBottom: '0.5rem' }}>{item.title}</h4>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.55, margin: 0 }}>{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. Available Vector Services */}
            <div style={{ marginBottom: '3.5rem' }}>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--navy-950)', marginBottom: '1.5rem', textAlign: 'center' }}>
                Available Vector Art Services
              </h3>
              <div className="grid-responsive-4">
                {[
                  { name: 'Blurry Logo Vector Redraw', desc: 'Convert pixelated raster logos, screenshots, and web graphics into crisp high-resolution vectors.' },
                  { name: 'Screen Print Color Separation', desc: 'Multi-color spot plate separations with registration marks, chokes, and spreads for screen printers.' },
                  { name: 'Vinyl Cut & Laser Line Art', desc: 'Single-line closed cut paths optimized for vinyl plotters, laser engraving machines, and CNC routers.' },
                  { name: 'Artwork Modifications & Fonts', desc: 'Font matching, custom re-lettering, color tweaks, and layout adaptations for apparel templates.' }
                ].map((type) => (
                  <div key={type.name} className="card" style={{ background: '#ffffff', padding: '1.5rem', borderRadius: '16px', border: '1.5px solid var(--orange-100)', boxShadow: 'var(--shadow-sm)' }}>
                    <div style={{ color: 'var(--orange-600)', fontWeight: 800, fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '0.35rem' }}>Vector Service</div>
                    <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--navy-950)', marginBottom: '0.5rem' }}>{type.name}</h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>{type.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 4. Packages & Pricing Grid (Dynamic from DB) */}
            <div style={{ marginBottom: '3.5rem' }}>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--navy-950)', marginBottom: '1.5rem', textAlign: 'center' }}>
                Vector Art Conversion Packages ({vectorTiers.length})
              </h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
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
            <div style={{ background: '#f8fafc', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '1.5rem 2rem', marginBottom: '3.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--orange-50)', color: 'var(--orange-600)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Clock size={24} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--navy-950)' }}>Turnaround & Delivery Information</h4>
                  <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Standard Delivery: 6–12 hrs | Rush Orders: 3–6 hrs | Master Vector files (.AI, .EPS, .SVG, .PDF) available via instant download.</p>
                </div>
              </div>
              <button type="button" className="btn btn-primary-orange btn-sm" onClick={() => handleLaunchOrder('vector')}>
                Get Started Now <ArrowRight size={14} />
              </button>
            </div>

            {/* 6. Tailored Vector FAQs */}
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--navy-950)', marginBottom: '1.5rem', textAlign: 'center' }}>
                Frequently Asked Questions — Vector Art
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {serviceFaqs['vector-art'].map((faq, idx) => {
                  const isOpen = openFaqIndex === idx;
                  return (
                    <div key={faq.q} className="card" style={{ background: '#ffffff', borderRadius: '14px', border: isOpen ? '1.5px solid var(--orange-400)' : '1px solid var(--border-color)', overflow: 'hidden' }}>
                      <button
                        type="button"
                        onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                        style={{ width: '100%', padding: '1.25rem 1.5rem', background: 'none', border: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', textAlign: 'left', fontWeight: 700, fontSize: '1rem', color: isOpen ? 'var(--orange-600)' : 'var(--navy-950)' }}
                      >
                        <span>{faq.q}</span>
                        <ChevronDown size={18} style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0, color: 'var(--orange-500)' }} />
                      </button>
                      {isOpen && (
                        <div style={{ padding: '0 1.5rem 1.25rem', fontSize: '0.925rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
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
            <div style={{
              background: 'linear-gradient(135deg, var(--navy-950) 0%, var(--navy-900) 100%)',
              color: '#ffffff',
              borderRadius: '24px',
              padding: '3rem 2.5rem',
              marginBottom: '3.5rem',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: 'var(--shadow-xl)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{ maxWidth: '820px' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(249, 115, 22, 0.15)', border: '1px solid rgba(249, 115, 22, 0.35)', color: 'var(--orange-400)', padding: '0.35rem 0.95rem', borderRadius: '9999px', fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1.25rem' }}>
                  <Tag size={16} /> Premium Custom Physical Patches & Emblems
                </div>
                <h3 style={{ fontSize: 'clamp(1.85rem, 3.2vw, 2.4rem)', fontWeight: 900, marginBottom: '1rem', lineHeight: 1.2, color: '#ffffff' }}>
                  Custom Embroidered, Woven & 3D Molded PVC Patches
                </h3>
                <p style={{ color: '#cbd5e1', fontSize: '1.05rem', lineHeight: 1.65, marginBottom: '2rem' }}>
                  Elevate your uniforms, headwear, jackets, and tactical gear with commercial-quality custom patches. Available with Velcro hook & loop, iron-on, or adhesive backings delivered to your doorstep.
                </p>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="btn btn-primary-orange btn-lg"
                    onClick={() => handleLaunchOrder('patch')}
                    style={{ fontWeight: 800, padding: '0.85rem 2rem' }}
                  >
                    <Upload size={18} /> Order Custom Patches
                  </button>
                </div>
              </div>
            </div>

            {/* 2. Types of Patches Available */}
            <div style={{ marginBottom: '3.5rem' }}>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--navy-950)', marginBottom: '1.5rem', textAlign: 'center' }}>
                Patch Types & Manufacturing Materials
              </h3>
              <div className="grid-responsive-4">
                {[
                  { name: 'Custom Embroidered Patches', desc: 'Classic textured 3D embroidery threads stitched over durable twill fabric. Ideal for hats, jackets, and uniforms.' },
                  { name: 'High-Definition Woven Patches', desc: 'Ultra-thin woven threads creating flat, crisp surfaces capable of rendering micro-details and tiny text.' },
                  { name: '3D Molded PVC Rubber Patches', desc: '100% waterproof, flexible, and rugged molded PVC rubber with raised 3D dimensional layers.' },
                  { name: 'Laser Leather & Sublimated Patches', desc: 'Genuine leather, faux leather engraved emblems, and full-color photo-realistic printed patches.' }
                ].map((type) => (
                  <div key={type.name} className="card" style={{ background: '#ffffff', padding: '1.5rem', borderRadius: '16px', border: '1.5px solid var(--orange-100)', boxShadow: 'var(--shadow-sm)' }}>
                    <div style={{ color: 'var(--orange-600)', fontWeight: 800, fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '0.35rem' }}>Patch Style</div>
                    <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--navy-950)', marginBottom: '0.5rem' }}>{type.name}</h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>{type.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. Backing & Border Options */}
            <div style={{ marginBottom: '3.5rem' }}>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--navy-950)', marginBottom: '1.5rem', textAlign: 'center' }}>
                Backing & Border Finishes
              </h3>
              <div className="grid-responsive-4">
                {[
                  { title: 'Velcro (Hook & Loop)', desc: 'Military-grade hook backing pre-attached for easy swapping on tactical vests, hats, and jackets.' },
                  { title: 'Heat-Seal Iron-On', desc: 'Industrial heat-activated adhesive backing for fast application with a standard home iron or heat press.' },
                  { title: 'Peel & Stick Adhesive', desc: 'Convenient sticky backing for temporary application on clothing, packaging, event passes, or flat surfaces.' },
                  { title: 'Merrowed / Laser Cut Border', desc: 'Traditional heavy wrap-around merrowed border or ultra-clean laser heat-sealed custom shape edges.' }
                ].map((opt) => (
                  <div key={opt.title} className="card" style={{ background: '#ffffff', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'var(--orange-50)', color: 'var(--orange-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.75rem' }}>
                      <CheckCircle2 size={20} />
                    </div>
                    <h4 style={{ fontSize: '1.025rem', fontWeight: 800, color: 'var(--navy-950)', marginBottom: '0.35rem' }}>{opt.title}</h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>{opt.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 4. Packages & Quantity Pricing Tiers (Dynamic from DB) */}
            <div style={{ marginBottom: '3.5rem' }}>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--navy-950)', marginBottom: '1.5rem', textAlign: 'center' }}>
                Patches Quantity & Pricing Packages ({patchTiers.length})
              </h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
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
            <div style={{ background: '#f8fafc', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '1.5rem 2rem', marginBottom: '3.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--orange-50)', color: 'var(--orange-600)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <PackageCheck size={24} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--navy-950)' }}>Free Digital Proof & Doorstep Shipping</h4>
                  <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Free digital mockups in 12 hours | Physical production in 3–5 days | Express tracked worldwide delivery.</p>
                </div>
              </div>
              <button type="button" className="btn btn-primary-orange btn-sm" onClick={() => handleLaunchOrder('patch')}>
                Get Instant Proof <ArrowRight size={14} />
              </button>
            </div>

            {/* 6. Tailored Patches FAQs */}
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--navy-950)', marginBottom: '1.5rem', textAlign: 'center' }}>
                Frequently Asked Questions — Custom Patches
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {serviceFaqs.patches.map((faq, idx) => {
                  const isOpen = openFaqIndex === idx;
                  return (
                    <div key={faq.q} className="card" style={{ background: '#ffffff', borderRadius: '14px', border: isOpen ? '1.5px solid var(--orange-400)' : '1px solid var(--border-color)', overflow: 'hidden' }}>
                      <button
                        type="button"
                        onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                        style={{ width: '100%', padding: '1.25rem 1.5rem', background: 'none', border: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', textAlign: 'left', fontWeight: 700, fontSize: '1rem', color: isOpen ? 'var(--orange-600)' : 'var(--navy-950)' }}
                      >
                        <span>{faq.q}</span>
                        <ChevronDown size={18} style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0, color: 'var(--orange-500)' }} />
                      </button>
                      {isOpen && (
                        <div style={{ padding: '0 1.5rem 1.25rem', fontSize: '0.925rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
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
