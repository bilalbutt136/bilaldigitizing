'use client';

import React from 'react';
import { Layers, PenTool, Tag, ArrowRight, CheckCircle, Sparkles, Clock, ShieldCheck, Zap } from 'lucide-react';
import { useAppState } from '../../src/context/StateContext';
import { matchCategory } from '../../src/utils/categoryUtils';

export default function PricingPage() {
  const { openOrderWizard, dynamicPricingTiers = [] } = useAppState();

  const handleOrder = (serviceType, title, price) => {
    if (openOrderWizard) {
      openOrderWizard({
        tierKey: 'standard',
        type: serviceType,
        category: serviceType,
        title,
        rate: `$${price}`
      });
    }
  };

  // Extract the single primary/most popular package for each of the 3 services
  const embroideryTier = dynamicPricingTiers.find(t => matchCategory(t.service_type, 'embroidery') && t.is_popular) 
    || dynamicPricingTiers.find(t => matchCategory(t.service_type, 'embroidery'))
    || {
      id: 'default-emb',
      service_type: 'embroidery',
      title: 'Commercial Embroidery Digitizing',
      subtitle: 'Tajima .DST, Wilcom .EMB & Brother .PES with 0 thread breaks',
      badge_text: 'Most Popular',
      price: 10,
      original_price: 20,
      price_unit: '/ design',
      turnaround_time: '4–12 Hours',
      features: [
        '100% Manual Digitizing (0 Auto-Trace)',
        'Zero Thread Breaks Guaranteed',
        'Free Unlimited Revisions',
        'All Machine Formats Included'
      ],
      button_text: 'Order Embroidery',
      is_popular: true
    };

  const vectorTier = dynamicPricingTiers.find(t => matchCategory(t.service_type, 'vector_art') && t.is_popular) 
    || dynamicPricingTiers.find(t => matchCategory(t.service_type, 'vector_art'))
    || {
      id: 'default-vec',
      service_type: 'vector_art',
      title: 'Scalable Vector Art Redraw',
      subtitle: 'Raster to crisp Bézier vector nodes (.AI, .EPS, .SVG, .PDF)',
      badge_text: 'Best Value',
      price: 15,
      original_price: 25,
      price_unit: '/ design',
      turnaround_time: '6–12 Hours',
      features: [
        'Hand-Drawn Bézier Vector Nodes',
        'Pantone (PMS) Color Separation',
        'Screen-Printing & Cut-Ready Layers',
        'Master Source Suite Included'
      ],
      button_text: 'Order Vector Art',
      is_popular: false
    };

  const patchTier = dynamicPricingTiers.find(t => matchCategory(t.service_type, 'patches') && t.is_popular) 
    || dynamicPricingTiers.find(t => matchCategory(t.service_type, 'patches'))
    || {
      id: 'default-patch',
      service_type: 'patches',
      title: 'Custom Physical Patches',
      subtitle: 'Embroidered, woven & 3D PVC emblems delivered to your door',
      badge_text: 'Low 10 Pcs MOQ',
      price: 1.50,
      original_price: 3.00,
      price_unit: '/ piece',
      turnaround_time: '3–5 Days',
      features: [
        'Embroidered, Woven & Rubber PVC',
        'Military Velcro & Iron-On Backings',
        'Free 12-Hour Digital Production Proof',
        'Doorstep Worldwide Delivery'
      ],
      button_text: 'Order Custom Patches',
      is_popular: false
    };

  const threePackages = [
    {
      ...embroideryTier,
      theme: {
        label: 'Embroidery Digitizing',
        icon: Layers,
        color: 'var(--orange-600)',
        bgLight: 'rgba(249, 115, 22, 0.12)',
        btnClass: 'btn btn-primary-orange btn-lg',
        btnStyle: { boxShadow: '0 6px 20px rgba(234, 88, 12, 0.35)' },
        orderCat: 'embroidery'
      }
    },
    {
      ...vectorTier,
      theme: {
        label: 'Vector Art Conversion',
        icon: PenTool,
        color: '#2563eb',
        bgLight: 'rgba(37, 99, 235, 0.12)',
        btnClass: 'btn btn-lg',
        btnStyle: { background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', color: '#fff', border: 'none', boxShadow: '0 6px 20px rgba(37, 99, 235, 0.35)' },
        orderCat: 'vector'
      }
    },
    {
      ...patchTier,
      theme: {
        label: 'Custom Manufactured Patches',
        icon: Tag,
        color: '#059669',
        bgLight: 'rgba(16, 185, 129, 0.12)',
        btnClass: 'btn btn-lg',
        btnStyle: { background: 'linear-gradient(135deg, #059669 0%, #047857 100%)', color: '#fff', border: 'none', boxShadow: '0 6px 20px rgba(16, 185, 129, 0.35)' },
        orderCat: 'patch'
      }
    }
  ];

  return (
    <main style={{ padding: '8rem 2rem 6rem', background: 'var(--navy-100)', minHeight: '100vh', color: 'var(--text-main)', fontFamily: 'var(--font-body, "Inter", sans-serif)' }}>
      <div className="container" style={{ maxWidth: '1240px', margin: '0 auto' }}>
        
        {/* Header Hero */}
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
            background: 'var(--orange-50)',
            border: '1px solid var(--orange-200)',
            color: 'var(--orange-700)',
            padding: '0.4rem 1.1rem',
            borderRadius: '9999px',
            fontSize: '0.85rem',
            fontWeight: '800',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: '1.25rem',
            boxShadow: '0 2px 8px rgba(249, 115, 22, 0.1)'
          }}>
            <Sparkles size={16} />
            Three Core Studio Services · Simple Flat Rates
          </div>

          <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 3.75rem)', fontFamily: 'var(--font-heading)', fontWeight: 900, color: 'var(--navy-900)', marginBottom: '1.25rem', lineHeight: 1.12, letterSpacing: '-0.025em' }}>
            Choose Your <span style={{ color: 'var(--orange-500)' }}>Service</span>
          </h1>
          <p style={{ fontSize: '1.15rem', color: 'var(--text-muted)', maxWidth: '680px', margin: '0 auto', lineHeight: 1.65 }}>
            Factory direct starting rates for our three master capabilities. 100% free unlimited edits, machine sew-out guarantees, and express delivery.
          </p>
        </div>

        {/* The 3 Core Packages Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '2.5rem',
          alignItems: 'stretch'
        }}>
          {threePackages.map((pkg, idx) => {
            const IconComp = pkg.theme.icon;
            const isHighlight = pkg.is_popular || idx === 0;

            return (
              <div 
                key={pkg.id || idx} 
                className="card" 
                style={{
                  background: '#ffffff',
                  border: isHighlight ? '2.5px solid var(--orange-500)' : '1.5px solid var(--border-color)',
                  borderRadius: '24px',
                  padding: '2.75rem 2.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: isHighlight ? '0 18px 40px rgba(234, 88, 12, 0.18)' : '0 6px 24px rgba(0, 0, 0, 0.05)',
                  transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                  position: 'relative',
                  transform: isHighlight ? 'translateY(-8px)' : 'none'
                }}
              >
                {pkg.badge_text && (
                  <span style={{
                    position: 'absolute',
                    top: '-13px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: isHighlight ? 'var(--orange-500)' : 'var(--navy-900)',
                    color: '#ffffff',
                    padding: '0.35rem 1.25rem',
                    borderRadius: '9999px',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    letterSpacing: '0.06em',
                    boxShadow: isHighlight ? '0 4px 14px rgba(234, 88, 12, 0.4)' : '0 4px 10px rgba(0,0,0,0.2)'
                  }}>
                    {isHighlight ? `⭐ ${pkg.badge_text.toUpperCase()}` : pkg.badge_text.toUpperCase()}
                  </span>
                )}

                <div>
                  {/* Top Category Badge & Icon */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                    <div style={{ background: pkg.theme.bgLight, color: pkg.theme.color, padding: '0.75rem', borderRadius: '14px', display: 'flex' }}>
                      <IconComp size={26} />
                    </div>
                    <div>
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, color: pkg.theme.color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        {pkg.theme.label}
                      </span>
                      <h3 style={{ fontSize: '1.45rem', fontFamily: 'var(--font-heading)', fontWeight: 900, margin: '0.15rem 0 0', color: 'var(--navy-900)', lineHeight: 1.2 }}>
                        {pkg.title}
                      </h3>
                    </div>
                  </div>

                  {pkg.subtitle && (
                    <p style={{ fontSize: '0.925rem', color: 'var(--text-muted)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
                      {pkg.subtitle}
                    </p>
                  )}

                  {/* Price Box */}
                  <div style={{ marginBottom: '1.75rem', padding: '1.35rem', background: '#f8fafc', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                      <div style={{ fontSize: '3.25rem', fontWeight: 900, color: pkg.theme.color, lineHeight: 1, letterSpacing: '-0.03em' }}>
                        ${pkg.price}
                      </div>
                      {pkg.original_price && (
                        <div style={{ fontSize: '1.35rem', color: 'var(--text-muted)', textDecoration: 'line-through', fontWeight: 700 }}>
                          ${pkg.original_price}
                        </div>
                      )}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 800, marginTop: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      {pkg.price_unit || '/ design'}
                    </div>
                  </div>

                  {/* Features Checklist */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '2.5rem' }}>
                    {(Array.isArray(pkg.features) ? pkg.features : []).map((feat, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
                        <div style={{ background: '#dcfce7', color: '#16a34a', padding: '0.25rem', borderRadius: '50%', marginTop: '2px', flexShrink: 0 }}>
                          <CheckCircle size={14} />
                        </div>
                        <span style={{ fontSize: '0.925rem', color: 'var(--navy-800)', fontWeight: 600, lineHeight: 1.45 }}>
                          {feat}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom Order CTA */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <button 
                    onClick={() => handleOrder(pkg.theme.orderCat, pkg.title, pkg.price)}
                    className={pkg.theme.btnClass}
                    style={{ 
                      width: '100%', 
                      justifyContent: 'center', 
                      fontWeight: 800, 
                      fontSize: '1.05rem', 
                      padding: '1.15rem', 
                      borderRadius: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      ...(pkg.theme.btnStyle || {}) 
                    }}
                  >
                    <span>{pkg.button_text || 'Order Now'}</span>
                    <ArrowRight size={18} />
                  </button>

                  {pkg.turnaround_time && (
                    <div style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                      <Clock size={14} style={{ color: pkg.theme.color }} /> Express Delivery: {pkg.turnaround_time}
                    </div>
                  )}
                </div>

              </div>
            );
          })}
        </div>

        {/* Bottom Trust Guarantee Bar */}
        <div style={{
          marginTop: '4.5rem',
          padding: '2rem 2.5rem',
          background: '#ffffff',
          borderRadius: '20px',
          border: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '2rem',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ background: '#dcfce7', color: '#16a34a', padding: '0.65rem', borderRadius: '12px' }}>
              <ShieldCheck size={24} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--navy-900)' }}>100% Quality Guaranteed</div>
              <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>Free unlimited stitch edits until satisfied</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ background: '#fff7ed', color: 'var(--orange-500)', padding: '0.65rem', borderRadius: '12px' }}>
              <Zap size={24} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--navy-900)' }}>Express 4–12 Hr Delivery</div>
              <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>Urgent rush turnaround available 24/7</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ background: '#eff6ff', color: '#2563eb', padding: '0.65rem', borderRadius: '12px' }}>
              <Sparkles size={24} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--navy-900)' }}>Factory Direct Rates</div>
              <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>Zero hidden fees or middleman markups</div>
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}
