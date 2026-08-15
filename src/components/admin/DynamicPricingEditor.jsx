'use client';

import React, { useState } from 'react';
import { useAppState } from '../../context/StateContext';
import { upsertPricingTier, deletePricingTier } from '../../services/supabaseService';
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

const CORE_PACKAGES_DEFAULTS = {
  embroidery: {
    service_type: 'embroidery',
    badge_text: 'BASIC',
    is_popular: false,
    title: 'Embroidery Digitizing',
    subtitle: 'Commercial stitch files for caps, polos, shirts & jackets (.DST, .PES, .EMB)',
    price: 10,
    original_price: 15,
    price_unit: '/ DESIGN',
    turnaround_time: '4–12 Hours',
    button_text: 'Order Embroidery Now',
    features: [
      '100% Manual Hand-Mapped Pathing (No Auto-Trace)',
      'Zero Thread Breaks Guaranteed',
      'Free Unlimited Production Revisions',
      'All Machine Formats: Tajima .DST, Wilcom .EMB, Brother .PES',
      'Production PDF Color Sequence Sheet Included'
    ]
  },
  vector_art: {
    service_type: 'vector_art',
    badge_text: 'BEST VALUE',
    is_popular: true,
    title: 'Scalable Vector Art Redraw',
    subtitle: 'Raster to crisp Bézier vector nodes (.AI, .EPS, .SVG, .PDF)',
    price: 15,
    original_price: 25,
    price_unit: '/ DESIGN',
    turnaround_time: '6–12 Hours',
    button_text: 'Order Vector Art Now',
    features: [
      'Hand-Drawn Smooth Bézier Vector Nodes',
      'Pantone (PMS) Spot Color Separation',
      'Screen-Printing & Cut-Ready Layers',
      'Master Source Suite: .AI, .EPS, .SVG, .PDF',
      'Infinite 100% Crisp Resolution Scaling'
    ]
  },
  patches: {
    service_type: 'patches',
    badge_text: 'POPULAR',
    is_popular: false,
    title: 'Custom Physical Patches',
    subtitle: 'Custom manufactured physical emblems delivered straight to your door',
    price: 1.50,
    original_price: 3.00,
    price_unit: '/ PIECE',
    turnaround_time: '3–5 Days',
    button_text: 'Order Custom Patches',
    features: [
      'Embroidered, High-Density Woven & Rubber PVC',
      'Military Velcro, Heat-Seal Iron-On & Peel Backings',
      'Free 12-Hour Digital Production Proof',
      'Laser Cut & Merrowed Border Options',
      'Doorstep Worldwide Express Shipping'
    ]
  }
};

export const DynamicPricingEditor = () => {
  const {
    isAuthInitialized,
    dynamicPricingTiers = [],
    showToast,
    resetAllData
  } = useAppState();

  const [editingTier, setEditingTier] = useState(null);
  const [formData, setFormData] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  if (!isAuthInitialized) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading pricing catalog...</div>;
  }

  // Find DB records for the 3 core packages
  const dbEmb = dynamicPricingTiers.find(t => matchCategory(t.service_type, 'embroidery'));
  const dbVec = dynamicPricingTiers.find(t => matchCategory(t.service_type, 'vector_art'));
  const dbPatch = dynamicPricingTiers.find(t => matchCategory(t.service_type, 'patches'));

  const corePackages = [
    {
      key: 'embroidery',
      categoryLabel: 'EMBROIDERY DIGITIZING',
      defaultData: CORE_PACKAGES_DEFAULTS.embroidery,
      dbData: dbEmb,
      theme: {
        icon: Layers,
        color: '#ea580c',
        bgLight: 'rgba(234, 88, 12, 0.1)',
        border: '#fed7aa',
        btnBg: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)'
      }
    },
    {
      key: 'vector_art',
      categoryLabel: 'VECTOR ART CONVERSION',
      defaultData: CORE_PACKAGES_DEFAULTS.vector_art,
      dbData: dbVec,
      theme: {
        icon: PenTool,
        color: '#2563eb',
        bgLight: 'rgba(37, 99, 235, 0.1)',
        border: '#bfdbfe',
        btnBg: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)'
      }
    },
    {
      key: 'patches',
      categoryLabel: 'CUSTOM MANUFACTURED PATCHES',
      defaultData: CORE_PACKAGES_DEFAULTS.patches,
      dbData: dbPatch,
      theme: {
        icon: Tag,
        color: '#059669',
        bgLight: 'rgba(16, 185, 129, 0.1)',
        border: '#a7f3d0',
        btnBg: 'linear-gradient(135deg, #059669 0%, #047857 100%)'
      }
    }
  ];

  const handleEditCorePackage = (corePkg) => {
    const activeData = corePkg.dbData || corePkg.defaultData;
    setFormData({
      id: corePkg.dbData?.id || undefined,
      service_type: corePkg.key,
      title: activeData.title || corePkg.defaultData.title,
      subtitle: activeData.subtitle || corePkg.defaultData.subtitle,
      badge_text: activeData.badge_text || corePkg.defaultData.badge_text,
      is_popular: activeData.is_popular !== undefined ? activeData.is_popular : corePkg.defaultData.is_popular,
      price: (activeData.price !== undefined && activeData.price !== null) ? Number(activeData.price) : corePkg.defaultData.price,
      original_price: activeData.original_price ? Number(activeData.original_price) : corePkg.defaultData.original_price,
      price_unit: activeData.price_unit || corePkg.defaultData.price_unit,
      turnaround_time: activeData.turnaround_time || corePkg.defaultData.turnaround_time,
      button_text: activeData.button_text || corePkg.defaultData.button_text,
      features: Array.isArray(activeData.features) && activeData.features.length > 0 
        ? [...activeData.features] 
        : [...corePkg.defaultData.features],
      display_order: activeData.display_order || (corePkg.key === 'embroidery' ? 1 : corePkg.key === 'vector_art' ? 2 : 3)
    });
    setEditingTier(corePkg.key);
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
        price: Number(formData.price) || 0,
        original_price: formData.original_price ? Number(formData.original_price) : null,
        is_popular: Boolean(formData.is_popular),
        features: Array.isArray(formData.features) ? formData.features.filter(f => f && f.trim()) : []
      };

      const success = await upsertPricingTier(payload);
      if (success) {
        showToast('Pricing package saved & updated on live website!', 'success');
        setEditingTier(null);
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

  const getServiceTheme = (sType) => {
    const norm = (sType || '').toLowerCase().replace('-', '_');
    if (norm.startsWith('vec')) {
      return {
        label: 'VECTOR ART CONVERSION',
        color: '#2563eb',
        bgLight: 'rgba(37, 99, 235, 0.12)',
        border: '#bfdbfe',
        icon: PenTool,
        btnBg: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)'
      };
    }
    if (norm.startsWith('patch')) {
      return {
        label: 'CUSTOM MANUFACTURED PATCHES',
        color: '#059669',
        bgLight: 'rgba(16, 185, 129, 0.12)',
        border: '#a7f3d0',
        icon: Tag,
        btnBg: 'linear-gradient(135deg, #059669 0%, #047857 100%)'
      };
    }
    return {
      label: 'EMBROIDERY DIGITIZING',
      color: '#ea580c',
      bgLight: 'rgba(234, 88, 12, 0.12)',
      border: '#fed7aa',
      icon: Layers,
      btnBg: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)'
    };
  };

  return (
    <div style={{ padding: '0.5rem 0 2rem' }}>
      
      {/* Top Banner */}
      <div className="card" style={{ padding: '1.75rem 2rem', background: '#ffffff', borderRadius: '16px', marginBottom: '1.75rem', border: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.25rem' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'var(--orange-50)', border: '1px solid var(--orange-200)', color: 'var(--orange-700)', padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.5rem' }}>
              <Sparkles size={13} /> Live Storefront Packages
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--navy-900)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              Storefront Pricing Packages Editor
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: '0.35rem 0 0', maxWidth: '680px' }}>
              Directly edit the 3 master studio packages shown to customers on the <a href="/pricing" target="_blank" rel="noreferrer" style={{ color: 'var(--orange-600)', fontWeight: 700, textDecoration: 'underline' }}>Pricing Page (/pricing)</a>. Changes save to the live database in real-time.
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
              <ExternalLink size={14} /> View Live Pricing Page
            </a>
          </div>
        </div>
      </div>

      {editingTier ? (
        /* Edit Mode: Side-by-side Editor & Live Customer Preview */
        <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 0.85fr', gap: '2rem', alignItems: 'start' }}>
          
          {/* Edit Form */}
          <div className="card" style={{ padding: '2rem', background: '#fff', borderRadius: '20px', boxShadow: 'var(--shadow-md)', border: '1.5px solid var(--border-color)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--orange-600)', textTransform: 'uppercase' }}>
                  Live Package Editor
                </span>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--navy-900)', margin: '0.15rem 0 0' }}>
                  {formData.title ? `Editing: ${formData.title}` : 'Edit Package Details'}
                </h3>
              </div>
              <button 
                type="button" 
                onClick={() => setEditingTier(null)}
                style={{ background: '#f1f5f9', border: 'none', color: 'var(--text-muted)', padding: '0.5rem', borderRadius: '50%', cursor: 'pointer' }}
                title="Close editor"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              {/* Category & Badge */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '0.82rem', marginBottom: '0.35rem' }}>Service Type</label>
                  <select 
                    className="form-control" 
                    value={formData.service_type || 'embroidery'} 
                    onChange={e => setFormData({ ...formData, service_type: e.target.value })}
                    style={{ fontWeight: 700 }}
                  >
                    <option value="embroidery">Commercial Embroidery Digitizing</option>
                    <option value="vector_art">Raster to Vector Art Redraw</option>
                    <option value="patches">Custom Physical Patches</option>
                  </select>
                </div>

                <div className="form-group">
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '0.82rem', marginBottom: '0.35rem' }}>Top Badge Pill Text</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={formData.badge_text || ''} 
                    onChange={e => setFormData({ ...formData, badge_text: e.target.value })} 
                    placeholder="e.g. BASIC / BEST VALUE / POPULAR" 
                  />
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
                    placeholder="e.g. Embroidery Digitizing" 
                  />
                </div>

                <div className="form-group">
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '0.82rem', marginBottom: '0.35rem' }}>Subtitle / Scope Summary</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={formData.subtitle || ''} 
                    onChange={e => setFormData({ ...formData, subtitle: e.target.value })} 
                    placeholder="e.g. Commercial stitch files for caps and jackets..." 
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

              {/* Turnaround & Button Text */}
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
                    placeholder="e.g. Order Embroidery Now" 
                  />
                </div>
              </div>

              {/* Highlight toggle */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem 1.25rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <input 
                    type="checkbox" 
                    id="isPopularToggle" 
                    checked={formData.is_popular || false} 
                    onChange={e => setFormData({ ...formData, is_popular: e.target.checked })} 
                    style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--orange-500)' }} 
                  />
                  <label htmlFor="isPopularToggle" style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--navy-900)', cursor: 'pointer', margin: 0 }}>
                    Highlight as 'Best Value / Featured' (Elevated card with orange border)
                  </label>
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
                        placeholder="e.g. Zero Thread Breaks Guaranteed"
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

          {/* Real-time Customer Live Preview Card */}
          <div style={{ position: 'sticky', top: '2rem', overflow: 'visible', paddingTop: '1.25rem' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--navy-700)', textTransform: 'uppercase', marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Eye size={16} style={{ color: 'var(--orange-500)' }} /> Live Customer Card Preview
            </div>

            {(() => {
              const theme = getServiceTheme(formData.service_type);
              const ThemeIcon = theme.icon;

              return (
                <div style={{
                  background: '#ffffff',
                  border: formData.is_popular ? '2.5px solid var(--orange-500)' : '1.5px solid var(--border-color)',
                  borderRadius: '24px',
                  padding: '2.5rem 2rem 2rem',
                  display: 'flex',
                  flexDirection: 'column',
                  boxShadow: formData.is_popular ? '0 18px 40px rgba(234, 88, 12, 0.18)' : '0 6px 24px rgba(0, 0, 0, 0.05)',
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
                      background: formData.is_popular ? 'var(--orange-500)' : theme.color,
                      color: '#ffffff',
                      padding: '0.35rem 1.3rem',
                      borderRadius: '9999px',
                      fontSize: '0.78rem',
                      fontWeight: 900,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      whiteSpace: 'nowrap',
                      zIndex: 20,
                      boxShadow: formData.is_popular ? '0 6px 16px rgba(234, 88, 12, 0.45)' : '0 4px 14px rgba(0, 0, 0, 0.25)'
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
                          {theme.label}
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
                      background: formData.is_popular ? 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)' : theme.btnBg,
                      color: '#ffffff',
                      textAlign: 'center',
                      borderRadius: '12px',
                      fontWeight: 800,
                      fontSize: '0.95rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.4rem',
                      boxShadow: '0 4px 14px rgba(0,0,0,0.15)'
                    }}>
                      {formData.button_text || 'Order Now'} <ArrowRight size={16} />
                    </div>

                    {formData.turnaround_time && (
                      <div style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700, marginTop: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}>
                        <Clock size={13} style={{ color: 'var(--orange-500)' }} /> Express Delivery: {formData.turnaround_time}
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>

        </div>
      ) : (
        /* Overview Mode: The 3 Core Packages displayed side-by-side with Edit buttons */
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem', alignItems: 'stretch', paddingTop: '1.25rem', overflow: 'visible' }}>
            {corePackages.map((corePkg) => {
              const activeData = corePkg.dbData || corePkg.defaultData;
              const IconComp = corePkg.theme.icon;
              const isPopular = activeData.is_popular !== undefined ? activeData.is_popular : corePkg.defaultData.is_popular;
              const badgeText = activeData.badge_text || corePkg.defaultData.badge_text;
              const price = (activeData.price !== undefined && activeData.price !== null) ? activeData.price : corePkg.defaultData.price;
              const origPrice = activeData.original_price || corePkg.defaultData.original_price;
              const features = Array.isArray(activeData.features) && activeData.features.length > 0 ? activeData.features : corePkg.defaultData.features;

              return (
                <div 
                  key={corePkg.key}
                  className="card"
                  style={{
                    background: '#ffffff',
                    border: isPopular ? '2.5px solid var(--orange-500)' : '1.5px solid var(--border-color)',
                    borderRadius: '24px',
                    padding: '2.5rem 2rem 2rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: isPopular ? '0 18px 40px rgba(234, 88, 12, 0.18)' : '0 6px 24px rgba(0, 0, 0, 0.05)',
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
                      background: isPopular ? 'var(--orange-500)' : corePkg.theme.color,
                      color: '#ffffff',
                      padding: '0.35rem 1.3rem',
                      borderRadius: '9999px',
                      fontSize: '0.78rem',
                      fontWeight: 900,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      whiteSpace: 'nowrap',
                      zIndex: 20,
                      boxShadow: isPopular ? '0 6px 16px rgba(234, 88, 12, 0.45)' : '0 4px 14px rgba(0, 0, 0, 0.25)'
                    }}>
                      {badgeText}
                    </span>
                  )}

                  <div>
                    {/* Header */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                      <div style={{ background: corePkg.theme.bgLight, color: corePkg.theme.color, padding: '0.7rem', borderRadius: '12px', display: 'flex' }}>
                        <IconComp size={24} />
                      </div>
                      <div>
                        <span style={{ fontSize: '0.72rem', fontWeight: 800, color: corePkg.theme.color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                          {corePkg.categoryLabel}
                        </span>
                        <h3 style={{ fontSize: '1.35rem', fontWeight: 900, margin: '0.15rem 0 0', color: 'var(--navy-900)', lineHeight: 1.2 }}>
                          {activeData.title || corePkg.defaultData.title}
                        </h3>
                      </div>
                    </div>

                    {/* Subtitle */}
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.35rem', lineHeight: 1.5, minHeight: '40px' }}>
                      {activeData.subtitle || corePkg.defaultData.subtitle}
                    </p>

                    {/* Price */}
                    <div style={{ marginBottom: '1.5rem', padding: '1.25rem', background: '#f8fafc', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                        <div style={{ fontSize: '3rem', fontWeight: 900, color: corePkg.theme.color, lineHeight: 1, letterSpacing: '-0.03em' }}>
                          ${price}
                        </div>
                        {origPrice && (
                          <div style={{ fontSize: '1.2rem', color: 'var(--text-muted)', textDecoration: 'line-through', fontWeight: 700 }}>
                            ${origPrice}
                          </div>
                        )}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 800, marginTop: '0.35rem', textTransform: 'uppercase' }}>
                        {activeData.price_unit || corePkg.defaultData.price_unit}
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
                        <Clock size={13} style={{ color: 'var(--orange-500)' }} /> Express Delivery: {activeData.turnaround_time}
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => handleEditCorePackage(corePkg)}
                      className="btn btn-primary-orange btn-md"
                      style={{
                        width: '100%',
                        fontWeight: 800,
                        fontSize: '0.925rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        padding: '0.85rem'
                      }}
                    >
                      <Edit3 size={16} /> Edit {activeData.title}
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
