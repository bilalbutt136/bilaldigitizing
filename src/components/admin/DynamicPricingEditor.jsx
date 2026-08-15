'use client';

import React, { useState } from 'react';
import { useAppState } from '../../context/StateContext';
import { upsertPricingTier } from '../../services/supabaseService';
import { matchCategory } from '../../utils/categoryUtils';
import { 
  Plus, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  Save, 
  X, 
  Layers, 
  PenTool, 
  Tag, 
  Sparkles,
  ArrowRight,
  Clock,
  Eye,
  Check,
  ExternalLink
} from 'lucide-react';

// Default 3 packages for each of the 3 core services (Total 9 packages)
const DEFAULT_ALL_PACKAGES = {
  embroidery: [
    {
      display_order: 1,
      service_type: 'embroidery',
      badge_text: 'BASIC',
      is_popular: false,
      title: 'Left Chest & Cap Small Logo',
      subtitle: 'Standard logos up to 4" x 4" optimized for structured caps, polos, and apparel.',
      price: 10,
      original_price: 15,
      price_unit: '/ DESIGN',
      turnaround_time: '4–12 Hours',
      button_text: 'Order Left Chest Logo',
      features: [
        'Up to 4" x 4" Dimensions',
        '100% Hand-Mapped Stitch Pathing',
        'Cap Curved Profile Optimization',
        'Zero Thread Breaks Guaranteed',
        'All Machine Formats (.DST/.PES/.EMB)'
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
        'Up to 7" x 7" Medium Artwork',
        'Complex Multi-Color Layering',
        'Underlay Pull & Push Compensation',
        'Free Unlimited Production Revisions',
        'Production PDF Color Sequence Sheet'
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
        'High Density 3D Puff Foam Pathing',
        'Jacket & Hoodie Fabric Calibration',
        'Color Stops & Trim Optimization',
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
        'Sharp 100% Scalable Paths',
        'Master Suite: .AI, .EPS, .SVG, .PDF',
        'Infinite Scale Without Pixelation',
        '100% Manual Hand Trace'
      ]
    },
    {
      display_order: 2,
      service_type: 'vector_art',
      badge_text: 'BEST VALUE',
      is_popular: true,
      title: 'Medium Detail Artwork',
      subtitle: 'Multi-color badges, crests, and detailed illustrations with Pantone spot color separation.',
      price: 25,
      original_price: 35,
      price_unit: '/ DESIGN',
      turnaround_time: '6–12 Hours',
      button_text: 'Order Medium Vector',
      features: [
        'Pantone (PMS) Color Matching',
        'Separated Layers for Screen Printing',
        'Vinyl Cutting Smooth Cut-Paths',
        'Gradients, Blends & Textures',
        'High-Res 300+ DPI PDF Included'
      ]
    },
    {
      display_order: 3,
      service_type: 'vector_art',
      badge_text: 'MASTER DETAIL',
      is_popular: false,
      title: 'Complex Illustration & Mascot',
      subtitle: 'Highly intricate artwork, photographic traces, hand drawings, heraldic crests, and mascots.',
      price: 45,
      original_price: 65,
      price_unit: '/ DESIGN',
      turnaround_time: '12–24 Hours',
      button_text: 'Order Complex Vector',
      features: [
        'Ultra-Intricate Fine Details',
        'Complete Layer Organization',
        'Print-Ready Color Separations',
        'All Master Editable Formats',
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
        'Ultra-Low 10 Pieces Minimum',
        '12-Hour Free Digital Proofing',
        'Velcro, Iron-On or Peel Backings',
        'Embroidered, Woven or 3D PVC',
        '100% Quality Inspected'
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
        'Merrowed or Laser-Cut Borders',
        'Up to 9 Thread Colors Included',
        'Free Military-Grade Backing Choice',
        'Free Doorstep Worldwide Shipping',
        'Free Digital Proof with Revisions'
      ]
    },
    {
      display_order: 3,
      service_type: 'patches',
      badge_text: 'WHOLESALE',
      is_popular: false,
      title: 'Wholesale Bulk (500+ Pcs)',
      subtitle: 'Factory-direct wholesale pricing with volume discounts and priority factory line.',
      price: 1.50,
      original_price: 3.00,
      price_unit: '/ PIECE',
      turnaround_time: '7–10 Days',
      button_text: 'Order Bulk Wholesale',
      features: [
        'Factory Direct Wholesale Rate',
        'Priority Dedicated Production Line',
        'Custom Retail Backer Cards Available',
        'Express Air Doorstep Delivery',
        'Dedicated Production QA Manager'
      ]
    }
  ]
};

// Unified Tier Theme: Package 1 = Orange, Package 2 = Blue, Package 3 = Green
export const getPackageTierTheme = (packageNumber, serviceType = 'embroidery') => {
  const norm = (serviceType || '').toLowerCase().replace('-', '_');
  let icon = Layers;
  let serviceLabel = 'EMBROIDERY DIGITIZING';
  
  if (norm.startsWith('vec')) {
    icon = PenTool;
    serviceLabel = 'VECTOR ART CONVERSION';
  } else if (norm.startsWith('patch')) {
    icon = Tag;
    serviceLabel = 'CUSTOM MANUFACTURED PATCHES';
  }

  const order = Number(packageNumber) || 1;

  if (order === 1) {
    // Package #1: ORANGE THEME
    return {
      name: 'orange',
      packageNumber: 1,
      color: '#ea580c',
      bgLight: 'rgba(234, 88, 12, 0.12)',
      border: '#fed7aa',
      btnBg: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
      glowColor: 'rgba(234, 88, 12, 0.28)',
      icon,
      serviceLabel
    };
  }

  if (order === 2) {
    // Package #2: BLUE THEME
    return {
      name: 'blue',
      packageNumber: 2,
      color: '#2563eb',
      bgLight: 'rgba(37, 99, 235, 0.12)',
      border: '#bfdbfe',
      btnBg: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
      glowColor: 'rgba(37, 99, 235, 0.28)',
      icon,
      serviceLabel
    };
  }

  // Package #3: GREEN THEME
  return {
    name: 'green',
    packageNumber: 3,
    color: '#059669',
    bgLight: 'rgba(16, 185, 129, 0.12)',
    border: '#a7f3d0',
    btnBg: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
    glowColor: 'rgba(5, 150, 105, 0.28)',
    icon,
    serviceLabel
  };
};

export const DynamicPricingEditor = () => {
  const {
    isAuthInitialized,
    dynamicPricingTiers = [],
    setDynamicPricingTiers,
    showToast,
    resetAllData
  } = useAppState();

  const [activeCategoryTab, setActiveCategoryTab] = useState('embroidery'); // 'embroidery' | 'vector_art' | 'patches'
  const [editingTier, setEditingTier] = useState(null);
  const [formData, setFormData] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  if (!isAuthInitialized) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading pricing catalog...</div>;
  }

  // Helper to get the 3 packages for a given service category
  const getPackagesForCategory = (categoryKey) => {
    const defaults = DEFAULT_ALL_PACKAGES[categoryKey] || [];
    const dbTiers = dynamicPricingTiers
      .filter(t => matchCategory(t.service_type, categoryKey))
      .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));

    return defaults.map((defPkg, idx) => {
      const matchedDb = dbTiers[idx] || dbTiers.find(t => t.display_order === defPkg.display_order) || null;
      const pkgNum = idx + 1;
      return {
        key: `${categoryKey}-${pkgNum}`,
        packageNumber: pkgNum,
        categoryKey,
        defaultData: defPkg,
        dbData: matchedDb,
        data: matchedDb || defPkg,
        theme: getPackageTierTheme(pkgNum, categoryKey)
      };
    });
  };

  const handleEditPackage = (pkgObj) => {
    const activeData = pkgObj.dbData || pkgObj.defaultData;
    setFormData({
      id: pkgObj.dbData?.id || undefined,
      service_type: pkgObj.categoryKey,
      display_order: pkgObj.defaultData.display_order,
      title: activeData.title || pkgObj.defaultData.title,
      subtitle: activeData.subtitle || pkgObj.defaultData.subtitle,
      badge_text: activeData.badge_text || pkgObj.defaultData.badge_text,
      is_popular: activeData.is_popular !== undefined ? activeData.is_popular : pkgObj.defaultData.is_popular,
      price: (activeData.price !== undefined && activeData.price !== null) ? Number(activeData.price) : pkgObj.defaultData.price,
      original_price: activeData.original_price ? Number(activeData.original_price) : pkgObj.defaultData.original_price,
      price_unit: activeData.price_unit || pkgObj.defaultData.price_unit,
      turnaround_time: activeData.turnaround_time || pkgObj.defaultData.turnaround_time,
      button_text: activeData.button_text || pkgObj.defaultData.button_text,
      features: Array.isArray(activeData.features) && activeData.features.length > 0 
        ? [...activeData.features] 
        : [...pkgObj.defaultData.features]
    });
    setEditingTier(pkgObj.key);
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    if (!formData.title || !formData.title.trim()) {
      showToast('Please provide a package title.', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const sanitizedType = (formData.service_type || 'embroidery').toLowerCase().replace('-', '_');
      const normalizedServiceType = sanitizedType.startsWith('vec') 
        ? 'vector_art' 
        : sanitizedType.startsWith('patch') 
          ? 'patches' 
          : 'embroidery';

      const payload = {
        ...formData,
        service_type: normalizedServiceType,
        display_order: Number(formData.display_order) || 1,
        price: Number(formData.price) || 0,
        original_price: formData.original_price ? Number(formData.original_price) : null,
        is_popular: Boolean(formData.is_popular),
        features: Array.isArray(formData.features) ? formData.features.filter(f => f && f.trim()) : []
      };

      const success = await upsertPricingTier(payload);
      if (success) {
        showToast(`"${formData.title}" saved & updated on live website!`, 'success');
        setEditingTier(null);
        if (setDynamicPricingTiers) {
          setDynamicPricingTiers(prev => {
            const index = prev.findIndex(t => 
              t.service_type === normalizedServiceType && 
              Number(t.display_order) === Number(payload.display_order)
            );
            if (index >= 0) {
              const updated = [...prev];
              updated[index] = { ...updated[index], ...payload };
              return updated;
            }
            return [...prev, payload];
          });
        }
        await resetAllData();
      } else {
        showToast('Failed to save pricing package. Please check Supabase connection.', 'error');
      }
    } catch (err) {
      console.error('Save pricing package error:', err);
      showToast('Error saving pricing package.', 'error');
    } finally {
      setIsSaving(false);
    }
  };


  const handleFeatureChange = (index, val) => {
    const newFeatures = [...(formData.features || [])];
    newFeatures[index] = val;
    setFormData({ ...formData, features: newFeatures });
  };

  const addFeature = () => setFormData({ ...formData, features: [...(formData.features || []), ''] });
  const removeFeature = (index) => {
    const newFeatures = (formData.features || []).filter((_, i) => i !== index);
    setFormData({ ...formData, features: newFeatures });
  };

  const categories = [
    { key: 'embroidery', label: 'Embroidery Digitizing (3 Packages)', icon: Layers, count: 3 },
    { key: 'vector_art', label: 'Vector Art Conversion (3 Packages)', icon: PenTool, count: 3 },
    { key: 'patches', label: 'Custom Patches (3 Packages)', icon: Tag, count: 3 }
  ];

  return (
    <div style={{ padding: '0.5rem 0 2rem' }}>
      
      {/* Top Banner */}
      <div className="card" style={{ padding: '1.75rem 2rem', background: '#ffffff', borderRadius: '16px', marginBottom: '1.75rem', border: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.25rem' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'var(--orange-50)', border: '1px solid var(--orange-200)', color: 'var(--orange-700)', padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.5rem' }}>
              <Sparkles size={13} /> Single Source of Truth · 9 Studio Packages
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--navy-900)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              Master Service Packages Manager
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: '0.35rem 0 0', maxWidth: '700px' }}>
              Every service has 3 packages styled in <strong>Orange (Pkg #1)</strong>, <strong>Blue (Pkg #2)</strong>, and <strong>Green (Pkg #3)</strong>. Changes made here immediately update the <strong>Public Pricing Page</strong> and the respective <strong>Service Page</strong> simultaneously.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.65rem' }}>
            <a 
              href="/pricing" 
              target="_blank" 
              rel="noreferrer" 
              className="btn btn-outline btn-sm"
              style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <ExternalLink size={14} /> Open Live /pricing
            </a>
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div style={{
        display: 'flex',
        gap: '0.6rem',
        background: '#f1f5f9',
        padding: '0.4rem',
        borderRadius: '14px',
        border: '1px solid var(--border-color)',
        marginBottom: '2rem',
        flexWrap: 'wrap'
      }}>
        {categories.map(cat => {
          const IconComp = cat.icon;
          const isActive = activeCategoryTab === cat.key;
          return (
            <button
              key={cat.key}
              type="button"
              onClick={() => {
                setActiveCategoryTab(cat.key);
                setEditingTier(null);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                padding: '0.8rem 1.4rem',
                borderRadius: '10px',
                border: 'none',
                background: isActive ? '#ffffff' : 'transparent',
                color: isActive ? 'var(--navy-900)' : 'var(--navy-600)',
                fontWeight: isActive ? 900 : 700,
                fontSize: '0.925rem',
                cursor: 'pointer',
                boxShadow: isActive ? '0 4px 12px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.18s ease'
              }}
            >
              <IconComp size={18} style={{ color: isActive ? 'var(--orange-500)' : 'inherit' }} />
              <span>{cat.label}</span>
              <span style={{
                background: isActive ? 'var(--orange-100)' : '#e2e8f0',
                color: isActive ? 'var(--orange-700)' : 'var(--text-muted)',
                fontSize: '0.72rem',
                fontWeight: 800,
                padding: '0.15rem 0.5rem',
                borderRadius: '9999px'
              }}>
                {cat.count}
              </span>
            </button>
          );
        })}
      </div>

      {editingTier ? (
        /* ========================================================================= */
        /* EDIT MODE: Side-by-Side Split View with Sticky Customer Sidebar Preview   */
        /* ========================================================================= */
        <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 0.85fr', gap: '2rem', alignItems: 'start' }}>
          
          {/* Left Column: Form Controls */}
          <div className="card" style={{ padding: '2.25rem', background: '#fff', borderRadius: '20px', boxShadow: 'var(--shadow-md)', border: '1.5px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--orange-600)', textTransform: 'uppercase' }}>
                  Live Package Editor · Package #{formData.display_order || 1}
                </span>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--navy-900)', margin: '0.15rem 0 0' }}>
                  {formData.title ? `Editing: ${formData.title}` : 'Edit Package Details'}
                </h3>
              </div>
              <button 
                type="button" 
                onClick={() => setEditingTier(null)}
                style={{ background: '#f1f5f9', border: 'none', color: 'var(--text-muted)', padding: '0.55rem', borderRadius: '50%', cursor: 'pointer' }}
                title="Close editor"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              {/* Service & Tier Position */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '1rem' }}>
                <div className="form-group">
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '0.82rem', marginBottom: '0.35rem' }}>Service Category *</label>
                  <select 
                    className="form-control" 
                    value={formData.service_type || 'embroidery'} 
                    onChange={e => setFormData({ ...formData, service_type: e.target.value })}
                    style={{ fontWeight: 700 }}
                  >
                    <option value="embroidery">🧵 Commercial Embroidery Digitizing</option>
                    <option value="vector_art">✒️ Raster to Scalable Vector Art</option>
                    <option value="patches">🏷️ Custom Physical Patches</option>
                  </select>
                </div>

                <div className="form-group">
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '0.82rem', marginBottom: '0.35rem' }}>Package Position #</label>
                  <select 
                    className="form-control" 
                    value={formData.display_order || 1} 
                    onChange={e => setFormData({ ...formData, display_order: parseInt(e.target.value) || 1 })}
                    style={{ fontWeight: 700 }}
                  >
                    <option value={1}>Package #1 (Orange Theme - Basic / Entry)</option>
                    <option value={2}>Package #2 (Blue Theme - Mid-Tier / Popular)</option>
                    <option value={3}>Package #3 (Green Theme - Pro / Wholesale)</option>
                  </select>
                </div>
              </div>

              {/* Badge & Popular toggle */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '0.82rem', marginBottom: '0.35rem' }}>Top Badge Pill Text</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={formData.badge_text || ''} 
                    onChange={e => setFormData({ ...formData, badge_text: e.target.value })} 
                    placeholder="e.g. BASIC / MOST POPULAR / PRO TIER" 
                  />
                </div>

                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.7rem 1rem', background: '#f8fafc', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                    <input 
                      type="checkbox" 
                      id="isPopularToggle" 
                      checked={formData.is_popular || false} 
                      onChange={e => setFormData({ ...formData, is_popular: e.target.checked })} 
                      style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--orange-500)' }} 
                    />
                    <label htmlFor="isPopularToggle" style={{ fontWeight: 800, fontSize: '0.82rem', color: 'var(--navy-900)', cursor: 'pointer', margin: 0 }}>
                      Highlight as 'Featured / Most Popular'
                    </label>
                  </div>
                </div>
              </div>

              {/* Title & Subtitle */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '0.82rem', marginBottom: '0.35rem' }}>Package Title *</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    required 
                    value={formData.title || ''} 
                    onChange={e => setFormData({ ...formData, title: e.target.value })} 
                    placeholder="e.g. Left Chest & Cap Small Logo" 
                  />
                </div>

                <div className="form-group">
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '0.82rem', marginBottom: '0.35rem' }}>Subtitle / Scope Summary</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={formData.subtitle || ''} 
                    onChange={e => setFormData({ ...formData, subtitle: e.target.value })} 
                    placeholder="e.g. Standard logos up to 4x4 inches..." 
                  />
                </div>
              </div>

              {/* Pricing row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '0.82rem', marginBottom: '0.35rem' }}>Active Price ($) *</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    className="form-control" 
                    required 
                    value={formData.price !== undefined ? formData.price : 0} 
                    onChange={e => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })} 
                  />
                </div>

                <div className="form-group">
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '0.82rem', marginBottom: '0.35rem' }}>Original Strikethrough ($)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    className="form-control" 
                    value={formData.original_price || ''} 
                    onChange={e => setFormData({ ...formData, original_price: e.target.value ? parseFloat(e.target.value) : null })} 
                    placeholder="e.g. 15.00" 
                  />
                </div>

                <div className="form-group">
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '0.82rem', marginBottom: '0.35rem' }}>Price Unit</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={formData.price_unit || ''} 
                    onChange={e => setFormData({ ...formData, price_unit: e.target.value })} 
                    placeholder="e.g. / DESIGN or / PIECE" 
                  />
                </div>
              </div>

              {/* Turnaround & CTA Button */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '0.82rem', marginBottom: '0.35rem' }}>Express Delivery Turnaround</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={formData.turnaround_time || ''} 
                    onChange={e => setFormData({ ...formData, turnaround_time: e.target.value })} 
                    placeholder="e.g. 4–12 Hours or 3–5 Days" 
                  />
                </div>

                <div className="form-group">
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '0.82rem', marginBottom: '0.35rem' }}>CTA Button Text</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={formData.button_text || ''} 
                    onChange={e => setFormData({ ...formData, button_text: e.target.value })} 
                    placeholder="e.g. Order Left Chest Logo" 
                  />
                </div>
              </div>

              {/* Features Bullet List */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <label style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--navy-900)', margin: 0 }}>
                    Feature Bullet Points Checklist
                  </label>
                  <button 
                    type="button" 
                    onClick={addFeature} 
                    className="btn btn-outline btn-sm" 
                    style={{ fontWeight: 700, fontSize: '0.75rem', padding: '0.25rem 0.65rem' }}
                  >
                    <Plus size={13} /> Add Feature Line
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {(formData.features || []).map((feat, index) => (
                    <div key={index} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <CheckCircle2 size={16} style={{ color: 'var(--orange-500)', flexShrink: 0 }} />
                      <input 
                        type="text" 
                        className="form-control" 
                        value={feat} 
                        onChange={e => handleFeatureChange(index, e.target.value)} 
                        placeholder="Feature line description..."
                      />
                      <button 
                        type="button" 
                        onClick={() => removeFeature(index)} 
                        style={{ background: '#fee2e2', border: 'none', color: '#dc2626', padding: '0.45rem', borderRadius: '8px', cursor: 'pointer', flexShrink: 0 }}
                        title="Remove feature"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-color)' }}>
                <button type="button" onClick={() => setEditingTier(null)} className="btn btn-outline">
                  Cancel
                </button>
                <button type="submit" disabled={isSaving} className="btn btn-primary-orange btn-lg" style={{ fontWeight: 800, padding: '0.85rem 2rem' }}>
                  <Save size={16} /> {isSaving ? 'Saving to Database...' : 'Save Package Changes'}
                </button>
              </div>
            </form>
          </div>

          {/* Right Column: Live Customer Sidebar Preview */}
          <div style={{ position: 'sticky', top: '2rem', overflow: 'visible', paddingTop: '1.25rem' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--navy-700)', textTransform: 'uppercase', marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Eye size={16} style={{ color: 'var(--orange-500)' }} /> Live Customer Sidebar Preview
            </div>

            {(() => {
              const theme = getPackageTierTheme(formData.display_order || 1, formData.service_type || 'embroidery');
              const ThemeIcon = theme.icon;

              return (
                <div style={{
                  background: '#ffffff',
                  border: formData.is_popular ? `2.5px solid ${theme.color}` : '1.5px solid var(--border-color)',
                  borderRadius: '24px',
                  padding: '2.5rem 2rem 2rem',
                  display: 'flex',
                  flexDirection: 'column',
                  boxShadow: formData.is_popular ? `0 18px 40px ${theme.glowColor}` : '0 6px 24px rgba(0, 0, 0, 0.05)',
                  position: 'relative',
                  overflow: 'visible'
                }}>
                  {/* Top Badge Pill */}
                  {formData.badge_text && (
                    <span style={{
                      position: 'absolute',
                      top: '-14px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      background: theme.color,
                      color: '#ffffff',
                      padding: '0.35rem 1.3rem',
                      borderRadius: '9999px',
                      fontSize: '0.78rem',
                      fontWeight: 900,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      whiteSpace: 'nowrap',
                      zIndex: 20,
                      boxShadow: `0 6px 16px ${theme.glowColor}`
                    }}>
                      {formData.badge_text}
                    </span>
                  )}

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                      <div style={{ background: theme.bgLight, color: theme.color, padding: '0.7rem', borderRadius: '12px', display: 'flex' }}>
                        <ThemeIcon size={24} />
                      </div>
                      <div>
                        <span style={{ fontSize: '0.72rem', fontWeight: 800, color: theme.color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                          {theme.serviceLabel} · PACKAGE #{formData.display_order || 1}
                        </span>
                        <h3 style={{ fontSize: '1.35rem', fontWeight: 900, margin: '0.15rem 0 0', color: 'var(--navy-900)', lineHeight: 1.2 }}>
                          {formData.title || 'Package Title'}
                        </h3>
                      </div>
                    </div>

                    {formData.subtitle && (
                      <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.35rem', lineHeight: 1.5 }}>
                        {formData.subtitle}
                      </p>
                    )}

                    {/* Price Box */}
                    <div style={{ marginBottom: '1.5rem', padding: '1.25rem', background: '#f8fafc', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                        <div style={{ fontSize: '3rem', fontWeight: 900, color: theme.color, lineHeight: 1, letterSpacing: '-0.03em' }}>
                          ${formData.price !== undefined ? formData.price : '0'}
                        </div>
                        {formData.original_price && (
                          <div style={{ fontSize: '1.2rem', color: 'var(--text-muted)', textDecoration: 'line-through', fontWeight: 700 }}>
                            ${formData.original_price}
                          </div>
                        )}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 800, marginTop: '0.35rem', textTransform: 'uppercase' }}>
                        {formData.price_unit || '/ DESIGN'}
                      </div>
                    </div>

                    {/* Features List */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginBottom: '2rem' }}>
                      {(formData.features || []).filter(f => f && f.trim()).map((feat, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
                          <div style={{ background: '#dcfce7', color: '#16a34a', padding: '0.2rem', borderRadius: '50%', marginTop: '2px', flexShrink: 0, display: 'flex' }}>
                            <Check size={12} />
                          </div>
                          <span style={{ fontSize: '0.875rem', color: 'var(--navy-900)', fontWeight: 600, lineHeight: 1.4 }}>{feat}</span>
                        </div>
                      ))}
                    </div>

                    {/* CTA Button */}
                    <div style={{
                      padding: '0.95rem',
                      background: theme.btnBg,
                      color: '#ffffff',
                      textAlign: 'center',
                      borderRadius: '12px',
                      fontWeight: 800,
                      fontSize: '0.95rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.4rem',
                      boxShadow: `0 6px 18px ${theme.glowColor}`
                    }}>
                      {formData.button_text || 'Order Now'} <ArrowRight size={16} />
                    </div>

                    {formData.turnaround_time && (
                      <div style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700, marginTop: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}>
                        <Clock size={13} style={{ color: theme.color }} /> Express Delivery: {formData.turnaround_time}
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>

        </div>
      ) : (
        /* ========================================================================= */
        /* OVERVIEW MODE: 3 Packages of the Active Service Category in Grid View     */
        /* ========================================================================= */
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem', alignItems: 'stretch', paddingTop: '1.25rem', overflow: 'visible' }}>
            {getPackagesForCategory(activeCategoryTab).map((pkgObj) => {
              const activeData = pkgObj.dbData || pkgObj.defaultData;
              const IconComp = pkgObj.theme.icon;
              const isPopular = activeData.is_popular !== undefined ? activeData.is_popular : pkgObj.defaultData.is_popular;
              const badgeText = activeData.badge_text || pkgObj.defaultData.badge_text;
              const price = (activeData.price !== undefined && activeData.price !== null) ? activeData.price : pkgObj.defaultData.price;
              const origPrice = activeData.original_price || pkgObj.defaultData.original_price;
              const features = Array.isArray(activeData.features) && activeData.features.length > 0 ? activeData.features : pkgObj.defaultData.features;

              return (
                <div 
                  key={pkgObj.key}
                  className="card"
                  style={{
                    background: '#ffffff',
                    border: isPopular ? `2.5px solid ${pkgObj.theme.color}` : '1.5px solid var(--border-color)',
                    borderRadius: '24px',
                    padding: '2.5rem 2rem 2rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: isPopular ? `0 18px 40px ${pkgObj.theme.glowColor}` : '0 6px 24px rgba(0, 0, 0, 0.05)',
                    position: 'relative',
                    overflow: 'visible'
                  }}
                >
                  {/* Top Badge Pill */}
                  {badgeText && (
                    <span style={{
                      position: 'absolute',
                      top: '-14px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      background: pkgObj.theme.color,
                      color: '#ffffff',
                      padding: '0.35rem 1.3rem',
                      borderRadius: '9999px',
                      fontSize: '0.78rem',
                      fontWeight: 900,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      whiteSpace: 'nowrap',
                      zIndex: 20,
                      boxShadow: `0 6px 16px ${pkgObj.theme.glowColor}`
                    }}>
                      {badgeText}
                    </span>
                  )}

                  <div>
                    {/* Header */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                      <div style={{ background: pkgObj.theme.bgLight, color: pkgObj.theme.color, padding: '0.7rem', borderRadius: '12px', display: 'flex' }}>
                        <IconComp size={24} />
                      </div>
                      <div>
                        <span style={{ fontSize: '0.72rem', fontWeight: 800, color: pkgObj.theme.color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                          {pkgObj.theme.serviceLabel} · PACKAGE #{pkgObj.packageNumber}
                        </span>
                        <h3 style={{ fontSize: '1.35rem', fontWeight: 900, margin: '0.15rem 0 0', color: 'var(--navy-900)', lineHeight: 1.2 }}>
                          {activeData.title || pkgObj.defaultData.title}
                        </h3>
                      </div>
                    </div>

                    {/* Subtitle */}
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.35rem', lineHeight: 1.5, minHeight: '40px' }}>
                      {activeData.subtitle || pkgObj.defaultData.subtitle}
                    </p>

                    {/* Price */}
                    <div style={{ marginBottom: '1.5rem', padding: '1.25rem', background: '#f8fafc', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                        <div style={{ fontSize: '3rem', fontWeight: 900, color: pkgObj.theme.color, lineHeight: 1, letterSpacing: '-0.03em' }}>
                          ${price}
                        </div>
                        {origPrice && (
                          <div style={{ fontSize: '1.2rem', color: 'var(--text-muted)', textDecoration: 'line-through', fontWeight: 700 }}>
                            ${origPrice}
                          </div>
                        )}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 800, marginTop: '0.35rem', textTransform: 'uppercase' }}>
                        {activeData.price_unit || pkgObj.defaultData.price_unit}
                      </div>
                    </div>

                    {/* Features list */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginBottom: '1.75rem' }}>
                      {features.map((feat, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
                          <div style={{ background: '#dcfce7', color: '#16a34a', padding: '0.2rem', borderRadius: '50%', marginTop: '2px', flexShrink: 0, display: 'flex' }}>
                            <Check size={12} />
                          </div>
                          <span style={{ fontSize: '0.85rem', color: 'var(--navy-900)', fontWeight: 600, lineHeight: 1.4 }}>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Edit Action Button */}
                  <div>
                    {activeData.turnaround_time && (
                      <div style={{ textAlign: 'center', fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}>
                        <Clock size={13} style={{ color: pkgObj.theme.color }} /> Express Delivery: {activeData.turnaround_time}
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => handleEditPackage(pkgObj)}
                      className="btn btn-primary-orange btn-md"
                      style={{
                        width: '100%',
                        fontWeight: 800,
                        fontSize: '0.925rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        padding: '0.85rem',
                        background: pkgObj.theme.btnBg
                      }}
                    >
                      <Edit3 size={16} /> Edit Package #{pkgObj.packageNumber} ({activeData.title})
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default DynamicPricingEditor;
