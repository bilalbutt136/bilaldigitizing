'use client';

import React, { useState } from 'react';
import { useAppState } from '../../context/StateContext';
import {
  ArrowRight,
  Clock,
  ChevronDown,
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

  const rawTab = normalizeCategory(activeHomeServiceTab || 'embroidery');
  const activeTab = (rawTab === 'vector-art' || rawTab === 'vector') ? 'vector-art' : 'embroidery';
  const [openFaqIndex, setOpenFaqIndex] = useState(null);

  const _handleSelectTab = (tabId) => {
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
        a: 'Most embroidery digitizing packages are estimated at 4–12 hours depending on size and complexity. Any rush availability is confirmed at order time so production expectations stay accurate.'
      },
      {
        q: 'Do you provide free revisions?',
        a: 'Yes. Minor production revisions and format adjustments are free so the delivered file can be tuned for your approved size, fabric, and machine setup.'
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
      padding: '3.5rem 0 5.5rem',
      background: 'transparent',
      color: 'var(--text-main)',
      fontFamily: 'var(--font-body, "Inter", sans-serif)',
      position: 'relative'
    }}>
      <div className="container">

        {/* ====================================================================
            VIEW 2: EMBROIDERY TAB (Dynamic Embroidery Packages)
           ==================================================================== */}
        {activeTab === 'embroidery' && (
          <div>

            {/* 2. Key Benefits Grid */}
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

            {/* 5. Turnaround & Delivery Info */}
            <div style={{ background: 'var(--color-subtle, var(--bg-subtle))', border: '1px solid var(--color-border)', borderRadius: '16px', padding: '1.5rem 2rem', marginBottom: '3.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(37, 99, 235, 0.1)', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Clock size={24} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>Turnaround & Delivery Information</h4>
                  <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>Standard Delivery: 8–12 hrs | Express Rush: 4–6 hrs | Delivered straight to your client dashboard & email.</p>
                </div>
              </div>
              <button type="button" className="btn btn-sm" style={{ background: '#2563eb', borderColor: '#2563eb', color: '#ffffff', fontWeight: 800 }} onClick={() => handleLaunchOrder('embroidery')}>
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
            VIEW 3: VECTOR ART TAB
           ==================================================================== */}
        {activeTab === 'vector-art' && (
          <div>
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
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(37, 99, 235, 0.1)', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
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
                    <div style={{ color: '#2563eb', fontWeight: 800, fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '0.35rem' }}>Vector Service</div>
                    <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: '0.5rem' }}>{type.name}</h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', lineHeight: 1.5, margin: 0 }}>{type.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 5. Turnaround & Delivery Info */}
            <div style={{ background: 'var(--color-subtle, var(--bg-subtle))', border: '1px solid var(--color-border)', borderRadius: '16px', padding: '1.5rem 2rem', marginBottom: '3.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(37, 99, 235, 0.1)', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Clock size={24} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-text-primary)' }}>Turnaround & Delivery Information</h4>
                  <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>Standard Delivery: 6–12 hrs | Rush Orders: 3–6 hrs | Master Vector files (.AI, .EPS, .SVG, .PDF) available via instant download.</p>
                </div>
              </div>
              <button type="button" className="btn btn-sm" style={{ background: '#2563eb', borderColor: '#2563eb', color: '#ffffff', fontWeight: 800 }} onClick={() => handleLaunchOrder('vector')}>
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

      </div>
    </section>
  );
};

export default ServicesSection;
