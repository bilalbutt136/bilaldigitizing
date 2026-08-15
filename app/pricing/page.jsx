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
        rate: typeof price === 'number' ? `$${price.toFixed(2)}` : (String(price).startsWith('$') ? String(price) : `$${price}`)
      });
    }
  };

  // Find DB records if available, with robust default packages
  const dbEmb = dynamicPricingTiers.find(t => matchCategory(t.service_type, 'embroidery'));
  const dbVec = dynamicPricingTiers.find(t => matchCategory(t.service_type, 'vector_art'));
  const dbPatch = dynamicPricingTiers.find(t => matchCategory(t.service_type, 'patches'));

  const defaultEmbFeatures = [
    '100% Manual Hand-Mapped Pathing (No Auto-Trace)',
    'Zero Thread Breaks Guaranteed',
    'Free Unlimited Production Revisions',
    'All Machine Formats: Tajima .DST, Wilcom .EMB, Brother .PES',
    'Production PDF Color Sequence Sheet Included'
  ];

  const defaultVecFeatures = [
    'Hand-Drawn Smooth Bézier Vector Nodes',
    'Pantone (PMS) Spot Color Separation',
    'Screen-Printing & Cut-Ready Layers',
    'Master Source Suite: .AI, .EPS, .SVG, .PDF',
    'Infinite 100% Crisp Resolution Scaling'
  ];

  const defaultPatchFeatures = [
    'Embroidered, High-Density Woven & Rubber PVC',
    'Military Velcro, Heat-Seal Iron-On & Peel Backings',
    'Free 12-Hour Digital Production Proof',
    'Laser Cut & Merrowed Border Options',
    'Doorstep Worldwide Express Shipping'
  ];

  const threePackages = [
    {
      id: dbEmb?.id || 'embroidery-core',
      serviceType: 'embroidery',
      badgeText: 'BASIC',
      badgeColor: '#ea580c',
      isPopular: false,
      categoryLabel: 'EMBROIDERY DIGITIZING',
      title: (dbEmb?.title && dbEmb.title !== 'Logo' && dbEmb.title !== 'Untitled') ? dbEmb.title : 'Embroidery Digitizing',
      subtitle: (dbEmb?.subtitle && dbEmb.subtitle !== 'Logo') ? dbEmb.subtitle : 'Commercial stitch files for caps, polos, shirts & jackets (.DST, .PES, .EMB)',
      price: (dbEmb?.price !== undefined && dbEmb.price > 0) ? dbEmb.price : 10,
      originalPrice: dbEmb?.original_price || 15,
      priceUnit: dbEmb?.price_unit || '/ DESIGN',
      turnaround: dbEmb?.turnaround_time || '4–12 Hours',
      features: (Array.isArray(dbEmb?.features) && dbEmb.features.filter(f => f && f.trim()).length >= 2) 
        ? dbEmb.features.filter(f => f && f.trim()) 
        : defaultEmbFeatures,
      buttonText: 'Order Embroidery Now',
      theme: {
        icon: Layers,
        color: '#ea580c',
        bgLight: 'rgba(234, 88, 12, 0.12)',
        btnStyle: { background: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)', color: '#fff', border: 'none', boxShadow: '0 6px 20px rgba(234, 88, 12, 0.35)' }
      }
    },
    {
      id: dbVec?.id || 'vector-core',
      serviceType: 'vector',
      badgeText: 'BEST VALUE',
      badgeColor: '#2563eb',
      isPopular: true,
      categoryLabel: 'VECTOR ART CONVERSION',
      title: (dbVec?.title && dbVec.title !== 'Untitled') ? dbVec.title : 'Scalable Vector Art Redraw',
      subtitle: dbVec?.subtitle || 'Raster to crisp Bézier vector nodes (.AI, .EPS, .SVG, .PDF)',
      price: (dbVec?.price !== undefined && dbVec.price > 0) ? dbVec.price : 15,
      originalPrice: dbVec?.original_price || 25,
      priceUnit: dbVec?.price_unit || '/ DESIGN',
      turnaround: dbVec?.turnaround_time || '6–12 Hours',
      features: (Array.isArray(dbVec?.features) && dbVec.features.filter(f => f && f.trim()).length >= 2) 
        ? dbVec.features.filter(f => f && f.trim()) 
        : defaultVecFeatures,
      buttonText: 'Order Vector Art Now',
      theme: {
        icon: PenTool,
        color: '#2563eb',
        bgLight: 'rgba(37, 99, 235, 0.12)',
        btnStyle: { background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', color: '#fff', border: 'none', boxShadow: '0 6px 20px rgba(37, 99, 235, 0.35)' }
      }
    },
    {
      id: dbPatch?.id || 'patches-core',
      serviceType: 'patch',
      badgeText: 'POPULAR',
      badgeColor: '#059669',
      isPopular: false,
      categoryLabel: 'CUSTOM MANUFACTURED PATCHES',
      title: (dbPatch?.title && dbPatch.title !== 'Vector tracing' && dbPatch.title !== 'Untitled') ? dbPatch.title : 'Custom Physical Patches',
      subtitle: (dbPatch?.subtitle && dbPatch.subtitle !== 'Logo into AI') ? dbPatch.subtitle : 'Custom manufactured physical emblems delivered straight to your door',
      price: (dbPatch?.price !== undefined && dbPatch.price > 0 && dbPatch.price <= 10) ? dbPatch.price : 1.50,
      originalPrice: dbPatch?.original_price || 3.00,
      priceUnit: dbPatch?.price_unit || '/ PIECE',
      turnaround: dbPatch?.turnaround_time || '3–5 Days',
      features: (Array.isArray(dbPatch?.features) && dbPatch.features.filter(f => f && f.trim()).length >= 2) 
        ? dbPatch.features.filter(f => f && f.trim()) 
        : defaultPatchFeatures,
      buttonText: 'Order Custom Patches',
      theme: {
        icon: Tag,
        color: '#059669',
        bgLight: 'rgba(16, 185, 129, 0.12)',
        btnStyle: { background: 'linear-gradient(135deg, #059669 0%, #047857 100%)', color: '#fff', border: 'none', boxShadow: '0 6px 20px rgba(16, 185, 129, 0.35)' }
      }
    }
  ];

  return (
    <main style={{ padding: '8rem 2rem 6rem', background: 'var(--navy-100)', minHeight: '100vh', color: 'var(--text-main)', fontFamily: 'var(--font-body, "Inter", sans-serif)' }}>
      <div className="container" style={{ maxWidth: '1240px', margin: '0 auto', overflow: 'visible' }}>
        
        {/* Header Hero */}
        <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
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

        {/* The 3 Core Packages Grid with Breathing Room for Top Badges */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '2.5rem',
          alignItems: 'stretch',
          paddingTop: '1.75rem',
          overflow: 'visible'
        }}>
          {threePackages.map((pkg) => {
            const IconComp = pkg.theme.icon;

            return (
              <div 
                key={pkg.id} 
                className="card" 
                style={{
                  background: '#ffffff',
                  border: pkg.isPopular ? '2.5px solid var(--orange-500)' : '1.5px solid var(--border-color)',
                  borderRadius: '24px',
                  padding: '2.75rem 2.25rem 2.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: pkg.isPopular ? '0 18px 40px rgba(234, 88, 12, 0.18)' : '0 6px 24px rgba(0, 0, 0, 0.05)',
                  transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                  position: 'relative',
                  overflow: 'visible',
                  transform: pkg.isPopular ? 'translateY(-8px)' : 'none'
                }}
              >
                {/* Top Badge Button / Pill */}
                {pkg.badgeText && (
                  <span style={{
                    position: 'absolute',
                    top: '-15px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: pkg.isPopular ? 'var(--orange-500)' : pkg.badgeColor,
                    color: '#ffffff',
                    padding: '0.4rem 1.4rem',
                    borderRadius: '9999px',
                    fontSize: '0.78rem',
                    fontWeight: 900,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    whiteSpace: 'nowrap',
                    zIndex: 20,
                    boxShadow: pkg.isPopular ? '0 6px 16px rgba(234, 88, 12, 0.45)' : '0 4px 14px rgba(0, 0, 0, 0.25)'
                  }}>
                    {pkg.badgeText}
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
                        {pkg.categoryLabel}
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
                      {pkg.originalPrice && (
                        <div style={{ fontSize: '1.35rem', color: 'var(--text-muted)', textDecoration: 'line-through', fontWeight: 700 }}>
                          ${pkg.originalPrice}
                        </div>
                      )}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 800, marginTop: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      {pkg.priceUnit}
                    </div>
                  </div>

                  {/* Features Checklist */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '2.5rem' }}>
                    {pkg.features.map((feat, i) => (
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
                    onClick={() => handleOrder(pkg.serviceType, pkg.title, pkg.price)}
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
                      cursor: 'pointer',
                      ...(pkg.theme.btnStyle || {}) 
                    }}
                  >
                    <span>{pkg.buttonText}</span>
                    <ArrowRight size={18} />
                  </button>

                  {pkg.turnaround && (
                    <div style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                      <Clock size={14} style={{ color: pkg.theme.color }} /> Express Delivery: {pkg.turnaround}
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
