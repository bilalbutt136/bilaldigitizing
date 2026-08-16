'use client';

import React, { useState } from 'react';
import { Layers, PenTool, Tag, ArrowRight, CheckCircle, Sparkles, Clock, ShieldCheck, Zap } from 'lucide-react';
import { useAppState } from '../../src/context/StateContext';
import { matchCategory } from '../../src/utils/categoryUtils';

const DEFAULT_ALL_PACKAGES = {
  embroidery: [
    {
      display_order: 1,
      service_type: 'embroidery',
      badge_text: 'BASIC',
      is_popular: false,
      title: 'Left Chest & Cap Small Logo',
      subtitle: 'Commercial stitch files for caps, polos, shirts & jackets (.DST, .PES, .EMB)',
      price: 10,
      original_price: 15,
      price_unit: '/ DESIGN',
      turnaround_time: '4–12 Hours',
      button_text: 'Order Left Chest Logo',
      features: [
        'Up to 4" x 4" Dimensions',
        '100% Manual Hand-Mapped Pathing (No Auto-Trace)',
        'Cap Curved Profile Optimization',
        'Zero Thread Breaks Guaranteed',
        'All Machine Formats: Tajima .DST, Wilcom .EMB, Brother .PES',
        'Production PDF Color Sequence Sheet Included'
      ]
    },
    {
      display_order: 2,
      service_type: 'embroidery',
      badge_text: 'MOST POPULAR',
      is_popular: true,
      title: 'Mid-Size Jacket & Sleeve Design',
      subtitle: 'Medium complexity artwork up to 7" x 7" with calculated density and pull compensation.',
      price: 20,
      original_price: 30,
      price_unit: '/ DESIGN',
      turnaround_time: '6–12 Hours',
      button_text: 'Order Mid-Size Design',
      features: [
        'Up to 7" x 7" Medium Artwork Area',
        'Complex Multi-Color Layering & Pathing',
        'Underlay Pull & Push Compensation',
        'Free Unlimited Production Revisions',
        'Production PDF Color Sequence Sheet Included'
      ]
    },
    {
      display_order: 3,
      service_type: 'embroidery',
      badge_text: 'PRO / 3D PUFF',
      is_popular: false,
      title: 'Full Back & 3D Puff Foam',
      subtitle: 'High stitch count full jacket back designs up to 12" x 12" and specialty 3D puff foam.',
      price: 35,
      original_price: 50,
      price_unit: '/ DESIGN',
      turnaround_time: '8–12 Hours',
      button_text: 'Order Full Back / 3D',
      features: [
        'Up to 12" x 12" Full Back Area',
        'High Density 3D Puff Foam Layering',
        'Jacket & Hoodie Fabric Calibration',
        'Color Stops & Machine Trim Optimization',
        '24/7 Priority Master Digitizer Support'
      ]
    }
  ],
  vector_art: [
    {
      display_order: 1,
      service_type: 'vector_art',
      badge_text: 'BASIC',
      is_popular: false,
      title: 'Simple Logo & Typography Redraw',
      subtitle: 'Clean typographic logos, basic geometric shapes, and clean line work converted to vector.',
      price: 15,
      original_price: 25,
      price_unit: '/ DESIGN',
      turnaround_time: '6–12 Hours',
      button_text: 'Order Simple Redraw',
      features: [
        'Clean Bézier Curves & Anchor Nodes',
        'Sharp 100% Scalable Vector Paths',
        'Master Suite: .AI, .EPS, .SVG, .PDF',
        'Infinite Scale Without Pixelation',
        '100% Manual Hand Trace Tracing'
      ]
    },
    {
      display_order: 2,
      service_type: 'vector_art',
      badge_text: 'BEST VALUE',
      is_popular: true,
      title: 'Medium Detail Artwork with Colors',
      subtitle: 'Multi-color badges, crests, and detailed illustrations with Pantone spot color separation.',
      price: 25,
      original_price: 35,
      price_unit: '/ DESIGN',
      turnaround_time: '6–12 Hours',
      button_text: 'Order Medium Vector',
      features: [
        'Pantone (PMS) Spot Color Matching',
        'Separated Layers for Screen Printing',
        'Vinyl Cutting Smooth Cut-Paths',
        'Gradients, Blends & Textures Included',
        'High-Res 300+ DPI PDF Master Included'
      ]
    },
    {
      display_order: 3,
      service_type: 'vector_art',
      badge_text: 'MASTER DETAIL',
      is_popular: false,
      title: 'Complex Intricate Mascot & Illustration',
      subtitle: 'Highly intricate artwork, photographic traces, hand drawings, heraldic crests, and mascots.',
      price: 45,
      original_price: 65,
      price_unit: '/ DESIGN',
      turnaround_time: '12–24 Hours',
      button_text: 'Order Complex Vector',
      features: [
        'Ultra-Intricate Fine Vector Details',
        'Complete Multi-Layer Layer Organization',
        'Print-Ready Color Separations Suite',
        'All Master Source & Editable Formats',
        'Unlimited Revisions Until Press-Ready'
      ]
    }
  ],
  patches: [
    {
      display_order: 1,
      service_type: 'patches',
      badge_text: 'SAMPLE RUN',
      is_popular: false,
      title: 'Sample Batch (10–50 Pcs)',
      subtitle: 'Low-minimum run perfect for small brands, clubs, prototypes, and event samples.',
      price: 4.50,
      original_price: 6.50,
      price_unit: '/ PIECE',
      turnaround_time: '3–5 Days',
      button_text: 'Order Sample Run',
      features: [
        'Ultra-Low 10 Pieces Minimum Order',
        '12-Hour Free Digital Production Proof',
        'Velcro Hook & Loop or Iron-On Backings',
        'Custom Embroidered, Woven or 3D PVC',
        '100% Quality Inspected Before Shipping'
      ]
    },
    {
      display_order: 2,
      service_type: 'patches',
      badge_text: 'POPULAR',
      is_popular: true,
      title: 'Production Batch (100–500 Pcs)',
      subtitle: 'Standard volume for company uniforms, tactical gear, martial arts, and apparel brands.',
      price: 2.50,
      original_price: 4.00,
      price_unit: '/ PIECE',
      turnaround_time: '4–7 Days',
      button_text: 'Order Production Run',
      features: [
        'Merrowed Border or Laser-Cut Edge',
        'Up to 9 Thread Colors Included Free',
        'Free Military-Grade Backing Choice',
        'Free Doorstep Worldwide Express Shipping',
        'Free Digital Proof with Unlimited Edits'
      ]
    },
    {
      display_order: 3,
      service_type: 'patches',
      badge_text: 'WHOLESALE',
      is_popular: false,
      title: 'Wholesale Bulk Batch (500+ Pcs)',
      subtitle: 'Factory-direct wholesale pricing with volume discounts and priority factory line.',
      price: 1.50,
      original_price: 3.00,
      price_unit: '/ PIECE',
      turnaround_time: '7–10 Days',
      button_text: 'Order Bulk Wholesale',
      features: [
        'Factory Direct Wholesale Rate ($1.50/pc)',
        'Priority Dedicated Manufacturing Line',
        'Custom Retail Backer Cards Available',
        'Express Air Doorstep Global Delivery',
        'Dedicated Production QA Manager'
      ]
    }
  ]
};

const PALETTES = [
  {
    color: '#ea580c',
    bgLight: 'rgba(234, 88, 12, 0.12)',
    border: '#fed7aa',
    btnBg: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
    glowColor: 'rgba(234, 88, 12, 0.28)'
  },
  {
    color: '#2563eb',
    bgLight: 'rgba(37, 99, 235, 0.12)',
    border: '#bfdbfe',
    btnBg: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
    glowColor: 'rgba(37, 99, 235, 0.28)'
  },
  {
    color: '#059669',
    bgLight: 'rgba(16, 185, 129, 0.12)',
    border: '#a7f3d0',
    btnBg: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
    glowColor: 'rgba(5, 150, 105, 0.28)'
  },
  {
    color: '#7c3aed',
    bgLight: 'rgba(124, 58, 237, 0.12)',
    border: '#ddd6fe',
    btnBg: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
    glowColor: 'rgba(124, 58, 237, 0.28)'
  },
  {
    color: '#d97706',
    bgLight: 'rgba(217, 119, 6, 0.12)',
    border: '#fde68a',
    btnBg: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
    glowColor: 'rgba(217, 119, 6, 0.28)'
  }
];

// Universal Tier Theme: supports any number of packages
const getPackageTierTheme = (packageNumber, serviceType = 'embroidery') => {
  const norm = (serviceType || '').toLowerCase().replace('-', '_');
  let icon = Layers;
  let serviceLabel = 'EMBROIDERY DIGITIZING';
  let orderType = 'embroidery';
  
  if (norm.startsWith('vec')) {
    icon = PenTool;
    serviceLabel = 'VECTOR ART CONVERSION';
    orderType = 'vector';
  } else if (norm.startsWith('patch')) {
    icon = Tag;
    serviceLabel = 'CUSTOM MANUFACTURED PATCHES';
    orderType = 'patch';
  }

  const order = Number(packageNumber) || 1;
  const pal = PALETTES[(order - 1) % PALETTES.length];

  return {
    packageNumber: order,
    ...pal,
    icon,
    serviceLabel,
    orderType
  };
};

export default function PricingPage() {
  const { openOrderWizard, dynamicPricingTiers = [] } = useAppState();
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'embroidery' | 'vector_art' | 'patches'

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

  const getCategoryCount = (categoryKey) => {
    const dbTiers = dynamicPricingTiers.filter(t => matchCategory(t.service_type, categoryKey));
    return dbTiers.length > 0 ? dbTiers.length : (DEFAULT_ALL_PACKAGES[categoryKey] || []).length;
  };

  // Helper to build packages list dynamically from DB or defaults
  const getPackages = () => {
    if (activeTab === 'all') {
      // Core overview: 1 = Orange (Embroidery), 2 = Blue (Vector), 3 = Green (Patches)
      const dbEmb = dynamicPricingTiers.find(t => matchCategory(t.service_type, 'embroidery'));
      const dbVec = dynamicPricingTiers.find(t => matchCategory(t.service_type, 'vector_art'));
      const dbPatch = dynamicPricingTiers.find(t => matchCategory(t.service_type, 'patches'));

      const coreDefs = [
        { cat: 'embroidery', pkgNum: 1, def: DEFAULT_ALL_PACKAGES.embroidery[0], db: dbEmb },
        { cat: 'vector_art', pkgNum: 2, def: DEFAULT_ALL_PACKAGES.vector_art[1], db: dbVec },
        { cat: 'patches', pkgNum: 3, def: DEFAULT_ALL_PACKAGES.patches[2], db: dbPatch }
      ];

      return coreDefs.map(({ cat, pkgNum, def, db }) => {
        const theme = getPackageTierTheme(pkgNum, cat);
        const data = db || def;
        return {
          id: data.id || `core-${cat}`,
          serviceType: theme.orderType,
          categoryLabel: theme.serviceLabel,
          badgeText: data.badge_text || def.badge_text,
          isPopular: data.is_popular !== undefined ? data.is_popular : def.is_popular,
          title: data.title || def.title,
          subtitle: data.subtitle || def.subtitle,
          price: (data.price !== undefined && data.price !== null) ? Number(data.price) : def.price,
          originalPrice: data.original_price ? Number(data.original_price) : def.original_price,
          priceUnit: data.price_unit || def.price_unit,
          turnaround: data.turnaround_time || def.turnaround_time,
          buttonText: data.button_text || def.button_text,
          features: Array.isArray(data.features) && data.features.filter(f => f && f.trim()).length > 0
            ? data.features.filter(f => f && f.trim())
            : def.features,
          theme
        };
      });
    }

    // Specific category selected: render ALL dynamic packages in DB or defaults
    const dbTiers = dynamicPricingTiers
      .filter(t => matchCategory(t.service_type, activeTab))
      .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));

    const sourcePackages = dbTiers.length > 0 ? dbTiers : (DEFAULT_ALL_PACKAGES[activeTab] || []);

    return sourcePackages.map((data, idx) => {
      const pkgNum = idx + 1;
      const theme = getPackageTierTheme(pkgNum, activeTab);

      return {
        id: data.id || `${activeTab}-tier-${pkgNum}`,
        serviceType: theme.orderType,
        categoryLabel: `${theme.serviceLabel} · PACKAGE #${pkgNum}`,
        badgeText: data.badge_text,
        isPopular: Boolean(data.is_popular),
        title: data.title,
        subtitle: data.subtitle,
        price: (data.price !== undefined && data.price !== null) ? Number(data.price) : 0,
        originalPrice: data.original_price ? Number(data.original_price) : null,
        priceUnit: data.price_unit || (activeTab === 'patches' ? '/ PIECE' : '/ DESIGN'),
        turnaround: data.turnaround_time,
        buttonText: data.button_text || `Order ${data.title ? data.title.split(' ')[0] : 'Package'}`,
        features: Array.isArray(data.features) && data.features.filter(f => f && f.trim()).length > 0
          ? data.features.filter(f => f && f.trim())
          : [],
        theme
      };
    });
  };

  const displayedPackages = getPackages();

  const tabButtons = [
    { key: 'all', label: 'All 3 Core Services', icon: Sparkles },
    { key: 'embroidery', label: `🧵 Embroidery (${getCategoryCount('embroidery')} Packages)`, icon: Layers },
    { key: 'vector_art', label: `✒️ Vector Art (${getCategoryCount('vector_art')} Packages)`, icon: PenTool },
    { key: 'patches', label: `🏷️ Custom Patches (${getCategoryCount('patches')} Packages)`, icon: Tag }
  ];


  return (
    <main style={{ padding: '8rem 2rem 6rem', background: 'var(--navy-100)', minHeight: '100vh', color: 'var(--text-main)', fontFamily: 'var(--font-body, "Inter", sans-serif)' }}>
      <div className="container" style={{ maxWidth: '1240px', margin: '0 auto', overflow: 'visible' }}>
        
        {/* Header Hero */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
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
            Three Master Studio Services · Simple Flat Rates
          </div>

          <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 3.75rem)', fontFamily: 'var(--font-heading)', fontWeight: 900, color: 'var(--navy-900)', marginBottom: '1.25rem', lineHeight: 1.12, letterSpacing: '-0.025em' }}>
            Choose Your <span style={{ color: 'var(--orange-500)' }}>Service & Package</span>
          </h1>
          <p style={{ fontSize: '1.15rem', color: 'var(--text-muted)', maxWidth: '680px', margin: '0 auto', lineHeight: 1.65 }}>
            Factory direct rates for our three master capabilities. 100% free unlimited edits, machine sew-out guarantees, and express delivery.
          </p>

          {/* Interactive Category Tabs */}
          <div style={{
            display: 'inline-flex',
            gap: '0.5rem',
            background: '#ffffff',
            padding: '0.45rem',
            borderRadius: '9999px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.06)',
            border: '1.5px solid var(--border-color)',
            marginTop: '2rem',
            flexWrap: 'wrap',
            justifyContent: 'center'
          }}>
            {tabButtons.map(t => {
              const isActive = activeTab === t.key;
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setActiveTab(t.key)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.65rem 1.35rem',
                    borderRadius: '9999px',
                    border: 'none',
                    background: isActive ? 'var(--orange-500)' : 'transparent',
                    color: isActive ? '#ffffff' : 'var(--navy-700)',
                    fontWeight: isActive ? 900 : 700,
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: isActive ? '0 4px 14px rgba(234, 88, 12, 0.35)' : 'none'
                  }}
                >
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3 Packages Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.5rem',
          alignItems: 'stretch',
          paddingTop: '1.25rem',
          overflow: 'visible'
        }}>
          {displayedPackages.map((pkg) => {
            const IconComp = pkg.theme.icon;

            return (
              <div 
                key={pkg.id} 
                className="card" 
                style={{
                  background: '#ffffff',
                  border: pkg.isPopular ? `2px solid ${pkg.theme.color}` : '1.5px solid var(--border-color)',
                  borderRadius: '18px',
                  padding: '1.75rem 1.4rem 1.35rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: pkg.isPopular ? `0 12px 30px ${pkg.theme.glowColor}` : '0 4px 16px rgba(0, 0, 0, 0.04)',
                  transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                  position: 'relative',
                  overflow: 'visible',
                  transform: pkg.isPopular ? 'translateY(-4px)' : 'none'
                }}
              >
                {/* Top Badge Pill */}
                {pkg.badgeText && (
                  <span style={{
                    position: 'absolute',
                    top: '-12px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: pkg.theme.color,
                    color: '#ffffff',
                    padding: '0.25rem 1rem',
                    borderRadius: '9999px',
                    fontSize: '0.7rem',
                    fontWeight: 900,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    whiteSpace: 'nowrap',
                    zIndex: 20,
                    boxShadow: `0 4px 12px ${pkg.theme.glowColor}`
                  }}>
                    {pkg.badgeText}
                  </span>
                )}

                <div>
                  {/* Category Header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.85rem' }}>
                    <div style={{ background: pkg.theme.bgLight, color: pkg.theme.color, padding: '0.5rem', borderRadius: '10px', display: 'flex', flexShrink: 0 }}>
                      <IconComp size={20} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: '0.68rem', fontWeight: 800, color: pkg.theme.color, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block' }}>
                        {pkg.categoryLabel}
                      </span>
                      <h3 style={{ fontSize: '1.125rem', fontFamily: 'var(--font-heading)', fontWeight: 900, margin: '0.1rem 0 0', color: 'var(--navy-900)', lineHeight: 1.25, minHeight: '2.8rem', display: 'flex', alignItems: 'center' }}>
                        {pkg.title}
                      </h3>
                    </div>
                  </div>

                  {pkg.subtitle && (
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem', lineHeight: 1.45, minHeight: '2.8rem' }}>
                      {pkg.subtitle}
                    </p>
                  )}

                  {/* Price Box */}
                  <div style={{ marginBottom: '1.15rem', padding: '0.85rem 1rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
                      <div style={{ fontSize: '2.25rem', fontWeight: 900, color: pkg.theme.color, lineHeight: 1, letterSpacing: '-0.03em' }}>
                        ${pkg.price}
                      </div>
                      {pkg.originalPrice && (
                        <div style={{ fontSize: '1.1rem', color: 'var(--text-muted)', textDecoration: 'line-through', fontWeight: 700 }}>
                          ${pkg.originalPrice}
                        </div>
                      )}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 800, marginTop: '0.2rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      {pkg.priceUnit}
                    </div>
                  </div>

                  {/* Features Checklist */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.35rem' }}>
                    {pkg.features.map((feat, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                        <div style={{ background: '#dcfce7', color: '#16a34a', padding: '0.15rem', borderRadius: '50%', marginTop: '2px', flexShrink: 0, display: 'flex' }}>
                          <CheckCircle size={13} />
                        </div>
                        <span style={{ fontSize: '0.825rem', color: 'var(--navy-800)', fontWeight: 600, lineHeight: 1.35 }}>
                          {feat}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom Order CTA */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  <button 
                    onClick={() => handleOrder(pkg.serviceType, pkg.title, pkg.price)}
                    style={{ 
                      width: '100%', 
                      justifyContent: 'center', 
                      fontWeight: 800, 
                      fontSize: '0.9rem', 
                      padding: '0.75rem 1rem', 
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      cursor: 'pointer',
                      background: pkg.theme.btnBg,
                      color: '#ffffff',
                      border: 'none',
                      boxShadow: `0 4px 14px ${pkg.theme.glowColor}`,
                      transition: 'transform 0.2s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    <span>{pkg.buttonText}</span>
                    <ArrowRight size={15} />
                  </button>

                  {pkg.turnaround && (
                    <div style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}>
                      <Clock size={13} style={{ color: pkg.theme.color }} /> Express Delivery: {pkg.turnaround}
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
              <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--navy-900)' }}>Lightning Turnaround</div>
              <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>4 to 12 hour express production delivery</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ background: '#eff6ff', color: '#2563eb', padding: '0.65rem', borderRadius: '12px' }}>
              <Clock size={24} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--navy-900)' }}>24/7 Studio Support</div>
              <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>Direct access to master digitizing engineers</div>
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}
