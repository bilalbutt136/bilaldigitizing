'use client';

import React, { useState } from 'react';
import { useAppState } from '../../context/StateContext';
import { matchCategory } from '../../utils/categoryUtils';
import { upsertPricingTier, deletePricingTier } from '../../services/supabaseService';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Save, 
  Clock, 
  X, 
  Copy, 
  ChevronUp, 
  ChevronDown, 
  Eye, 
  Layers, 
  PenTool, 
  Tag, 
  CheckCircle,
  ArrowRight,
  AlertTriangle,
  Sparkles,
  LayoutGrid
} from 'lucide-react';

const PALETTES = [
  {
    color: '#ea580c',
    bgLight: 'rgba(234, 88, 12, 0.12)',
    border: '#fed7aa',
    btnGradient: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
    glowColor: 'rgba(234, 88, 12, 0.28)'
  },
  {
    color: '#2563eb',
    bgLight: 'rgba(37, 99, 235, 0.12)',
    border: '#bfdbfe',
    btnGradient: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
    glowColor: 'rgba(37, 99, 235, 0.28)'
  },
  {
    color: '#059669',
    bgLight: 'rgba(16, 185, 129, 0.12)',
    border: '#a7f3d0',
    btnGradient: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
    glowColor: 'rgba(5, 150, 105, 0.28)'
  },
  {
    color: '#7c3aed',
    bgLight: 'rgba(124, 58, 237, 0.12)',
    border: '#ddd6fe',
    btnGradient: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
    glowColor: 'rgba(124, 58, 237, 0.28)'
  },
  {
    color: '#d97706',
    bgLight: 'rgba(217, 119, 6, 0.12)',
    border: '#fde68a',
    btnGradient: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
    glowColor: 'rgba(217, 119, 6, 0.28)'
  }
];

const DEFAULT_ALL_PACKAGES = {
  embroidery: [
    {
      display_order: 1,
      badge_text: 'BASIC',
      is_popular: false,
      title: 'Left Chest & Cap Small Logo',
      subtitle: 'Commercial stitch files for caps, polos, shirts & jackets (.DST, .PES, .EMB)',
      price: 10.00,
      original_price: 15.00,
      price_unit: '/ DESIGN',
      turnaround_time: '4–12 Hours',
      button_text: 'Order Left Chest',
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
      badge_text: 'MOST POPULAR',
      is_popular: true,
      title: 'Mid-Size Jacket & Sleeve Design',
      subtitle: 'Medium complexity artwork up to 7" x 7" with calculated density and pull compensation',
      price: 20.00,
      original_price: 30.00,
      price_unit: '/ DESIGN',
      turnaround_time: '6–12 Hours',
      button_text: 'Order Mid-Size',
      features: [
        'Up to 7" x 7" Medium Artwork Area',
        'Complex Multi-Color Layering',
        'Underlay Pull & Push Compensation',
        'Free Unlimited Production Revisions',
        'Production PDF Color Sequence Sheet'
      ]
    },
    {
      display_order: 3,
      badge_text: 'PRO / 3D PUFF',
      is_popular: false,
      title: 'Full Back & 3D Puff Foam',
      subtitle: 'High stitch count full jacket back designs up to 12" x 12" and specialty 3D puff foam',
      price: 35.00,
      original_price: 50.00,
      price_unit: '/ DESIGN',
      turnaround_time: '8–12 Hours',
      button_text: 'Order Full Back',
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
      badge_text: 'BASIC',
      is_popular: false,
      title: 'Simple Logo & Typography Redraw',
      subtitle: 'Clean typographic logos, basic geometric shapes, and clean line work converted to vector',
      price: 15.00,
      original_price: 25.00,
      price_unit: '/ DESIGN',
      turnaround_time: '6–12 Hours',
      button_text: 'Order Simple',
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
      badge_text: 'MOST POPULAR',
      is_popular: true,
      title: 'Medium Detail Artwork with Colors',
      subtitle: 'Multi-color badges, crests, and detailed illustrations with Pantone spot color separation',
      price: 25.00,
      original_price: 40.00,
      price_unit: '/ DESIGN',
      turnaround_time: '6–12 Hours',
      button_text: 'Order Medium',
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
      badge_text: 'MASTER DETAIL',
      is_popular: false,
      title: 'Complex Illustration & Mascot',
      subtitle: 'Intricate mascots, gradient-rich detailed emblems, multi-tone shading & fine line art',
      price: 45.00,
      original_price: 70.00,
      price_unit: '/ DESIGN',
      turnaround_time: '12–24 Hours',
      button_text: 'Order Complex',
      features: [
        'Ultra-Intricate Fine Vector Details',
        'Complete Multi-Layer Organization',
        'Print-Ready Color Separations',
        'All Master Source & Vector Formats',
        'VIP Priority Studio Support'
      ]
    }
  ],
  patches: [
    {
      display_order: 1,
      badge_text: 'SAMPLE RUN',
      is_popular: false,
      title: 'Sample Batch (10–50 Pcs)',
      subtitle: 'Low-minimum run perfect for small brands, clubs, prototypes & event samples',
      price: 4.50,
      original_price: 6.00,
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
      badge_text: 'MOST POPULAR',
      is_popular: true,
      title: 'Production Batch (100–500 Pcs)',
      subtitle: 'Standard volume for company uniforms, tactical gear, martial arts & apparel brands',
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
      badge_text: 'WHOLESALE',
      is_popular: false,
      title: 'Wholesale Bulk Batch (500+ Pcs)',
      subtitle: 'Factory-direct wholesale pricing with volume discounts and priority factory line',
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

const getPackageTierTheme = (idx = 0, serviceType = 'embroidery') => {
  const pal = PALETTES[idx % PALETTES.length];
  const sType = (serviceType || '').toLowerCase().replace('-', '_');
  
  let icon = Layers;
  let serviceLabel = 'EMBROIDERY DIGITIZING';

  if (sType.includes('vec')) {
    icon = PenTool;
    serviceLabel = 'VECTOR ART CONVERSION';
  } else if (sType.includes('patch')) {
    icon = Tag;
    serviceLabel = 'CUSTOM MANUFACTURED PATCHES';
  }

  return {
    packageNumber: idx + 1,
    ...pal,
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

  const [activeCategoryTab, setActiveCategoryTab] = useState('all'); // 'all' | 'embroidery' | 'vector_art' | 'patches'
  const [editingTier, setEditingTier] = useState(null);
  const [formData, setFormData] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [newFeatureInput, setNewFeatureInput] = useState('');
  const [deleteCandidate, setDeleteCandidate] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isAuthInitialized) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading pricing catalog...</div>;
  }

  // Get all packages for a specific category (from DB or fallback defaults)
  const getCategoryPackages = (categoryKey) => {
    const dbTiers = (dynamicPricingTiers || [])
      .filter(t => matchCategory(t.service_type, categoryKey))
      .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));

    if (dbTiers.length > 0) {
      return dbTiers.map((tier, idx) => ({
        ...tier,
        _isDb: true,
        _idx: idx,
        theme: getPackageTierTheme(idx, categoryKey)
      }));
    }

    const defaults = DEFAULT_ALL_PACKAGES[categoryKey] || [];
    return defaults.map((def, idx) => ({
      ...def,
      id: `default-${categoryKey}-${idx}`,
      service_type: categoryKey,
      _isDb: false,
      _idx: idx,
      theme: getPackageTierTheme(idx, categoryKey)
    }));
  };

  // Get all packages combined across all 3 services
  const getAllPackages = () => {
    const emb = getCategoryPackages('embroidery');
    const vec = getCategoryPackages('vector_art');
    const patch = getCategoryPackages('patches');
    return [...emb, ...vec, ...patch];
  };

  const currentPackages = activeCategoryTab === 'all' 
    ? getAllPackages() 
    : getCategoryPackages(activeCategoryTab);

  const handleOpenEdit = (pkg, idx) => {
    const effectiveService = pkg.service_type || (activeCategoryTab === 'all' ? 'embroidery' : activeCategoryTab);
    setFormData({
      id: pkg.id && !String(pkg.id).startsWith('default-') ? pkg.id : undefined,
      service_type: effectiveService,
      display_order: pkg.display_order || (idx + 1),
      title: pkg.title || '',
      subtitle: pkg.subtitle || '',
      badge_text: pkg.badge_text || '',
      is_popular: Boolean(pkg.is_popular),
      price: (pkg.price !== undefined && pkg.price !== null) ? Number(pkg.price) : 0,
      original_price: pkg.original_price ? Number(pkg.original_price) : null,
      price_unit: pkg.price_unit || (effectiveService === 'patches' ? '/ PIECE' : '/ DESIGN'),
      turnaround_time: pkg.turnaround_time || (effectiveService === 'patches' ? '3–5 Days' : '4–12 Hours'),
      button_text: pkg.button_text || `Order ${pkg.title ? pkg.title.split(' ')[0] : 'Package'}`,
      features: Array.isArray(pkg.features) ? [...pkg.features] : []
    });
    setNewFeatureInput('');
    setEditingTier(pkg.id || `edit-${idx}`);
  };

  const handleOpenCreate = () => {
    const targetService = activeCategoryTab === 'all' ? 'embroidery' : activeCategoryTab;
    const catPkgs = getCategoryPackages(targetService);
    const maxOrder = catPkgs.reduce((max, p) => Math.max(max, p.display_order || 0), 0);
    setFormData({
      service_type: targetService,
      display_order: maxOrder + 1,
      title: 'New Service Package',
      subtitle: 'Complete professional studio package with commercial production files',
      badge_text: 'NEW TIER',
      is_popular: false,
      price: targetService === 'patches' ? 3.50 : 20.00,
      original_price: targetService === 'patches' ? 5.00 : 30.00,
      price_unit: targetService === 'patches' ? '/ PIECE' : '/ DESIGN',
      turnaround_time: targetService === 'patches' ? '4–7 Days' : '4–12 Hours',
      button_text: 'Order Package',
      features: [
        'Commercial Production File Formats Included',
        '100% Hand-Crafted Pathing Quality',
        'Free Unlimited Revisions',
        'Direct Studio Support'
      ]
    });
    setNewFeatureInput('');
    setEditingTier('new-package');
  };

  const handleDuplicate = async (pkg) => {
    const targetService = pkg.service_type || (activeCategoryTab === 'all' ? 'embroidery' : activeCategoryTab);
    const catPkgs = getCategoryPackages(targetService);
    const maxOrder = catPkgs.reduce((max, p) => Math.max(max, p.display_order || 0), 0);
    const cloned = {
      service_type: targetService,
      display_order: maxOrder + 1,
      title: `${pkg.title} (Copy)`,
      subtitle: pkg.subtitle || '',
      badge_text: pkg.badge_text || '',
      is_popular: false,
      price: Number(pkg.price) || 0,
      original_price: pkg.original_price ? Number(pkg.original_price) : null,
      price_unit: pkg.price_unit || (targetService === 'patches' ? '/ PIECE' : '/ DESIGN'),
      turnaround_time: pkg.turnaround_time || (targetService === 'patches' ? '3–5 Days' : '4–12 Hours'),
      button_text: pkg.button_text || 'Order Package',
      features: Array.isArray(pkg.features) ? [...pkg.features] : []
    };

    setIsSaving(true);
    try {
      const ok = await upsertPricingTier(cloned);
      if (ok) {
        showToast(`Duplicated "${pkg.title}" as new package!`, 'success');
        await resetAllData();
      } else {
        showToast('Failed to duplicate package. Please try again.', 'error');
      }
    } catch (err) {
      console.error('Duplicate error:', err);
      showToast('Error duplicating package.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReorder = async (pkg, direction) => {
    const serviceKey = pkg.service_type || (activeCategoryTab === 'all' ? 'embroidery' : activeCategoryTab);
    const catPkgs = getCategoryPackages(serviceKey);
    const idx = catPkgs.findIndex(p => p.id === pkg.id);
    if (idx < 0) return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= catPkgs.length) return;

    const currentItem = catPkgs[idx];
    const targetItem = catPkgs[targetIdx];

    const currentOrder = currentItem.display_order || (idx + 1);
    const targetOrder = targetItem.display_order || (targetIdx + 1);

    setIsSaving(true);
    try {
      await upsertPricingTier({ ...currentItem, display_order: targetOrder });
      await upsertPricingTier({ ...targetItem, display_order: currentOrder });
      showToast('Packages reordered successfully!', 'success');
      await resetAllData();
    } catch (err) {
      console.error('Reorder error:', err);
      showToast('Error reordering packages.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteCandidate) return;
    setIsDeleting(true);
    try {
      if (deleteCandidate._isDb && deleteCandidate.id) {
        const ok = await deletePricingTier(deleteCandidate.id);
        if (!ok) throw new Error('Delete failed in database');
      }
      showToast(`Package "${deleteCandidate.title}" deleted!`, 'success');
      setDeleteCandidate(null);
      if (editingTier === deleteCandidate.id) setEditingTier(null);
      await resetAllData();
    } catch (err) {
      console.error('Delete error:', err);
      showToast('Error deleting package.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    if (!formData.title || !formData.title.trim()) {
      showToast('Please provide a package title.', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const targetType = formData.service_type || (activeCategoryTab === 'all' ? 'embroidery' : activeCategoryTab);
      const sanitizedType = String(targetType).toLowerCase().replace('-', '_');
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
        showToast('Failed to save pricing package. Please check connection.', 'error');
      }
    } catch (err) {
      console.error('Save pricing package error:', err);
      showToast('Error saving pricing package.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddFeature = () => {
    if (!newFeatureInput.trim()) return;
    setFormData(prev => ({
      ...prev,
      features: [...(prev.features || []), newFeatureInput.trim()]
    }));
    setNewFeatureInput('');
  };

  const handleFeatureChange = (index, val) => {
    const newFeatures = [...(formData.features || [])];
    newFeatures[index] = val;
    setFormData(prev => ({ ...prev, features: newFeatures }));
  };

  const handleMoveFeature = (index, direction) => {
    const features = [...(formData.features || [])];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= features.length) return;
    const temp = features[index];
    features[index] = features[targetIdx];
    features[targetIdx] = temp;
    setFormData(prev => ({ ...prev, features }));
  };

  const handleRemoveFeature = (index) => {
    const features = [...(formData.features || [])];
    features.splice(index, 1);
    setFormData(prev => ({ ...prev, features }));
  };

  const allPackagesCount = getAllPackages().length;
  const embPackagesCount = getCategoryPackages('embroidery').length;
  const vecPackagesCount = getCategoryPackages('vector_art').length;
  const patchPackagesCount = getCategoryPackages('patches').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Category Tabs Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'inline-flex', gap: '0.4rem', background: '#f1f5f9', padding: '0.35rem', borderRadius: '14px', flexWrap: 'wrap' }}>
          
          {/* ALL SERVICES TAB */}
          <button
            type="button"
            onClick={() => { setActiveCategoryTab('all'); setEditingTier(null); }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.65rem 1.25rem',
              borderRadius: '10px',
              border: 'none',
              background: activeCategoryTab === 'all' ? '#ffffff' : 'transparent',
              color: activeCategoryTab === 'all' ? 'var(--orange-500)' : 'var(--navy-700)',
              fontWeight: 800,
              fontSize: '0.875rem',
              cursor: 'pointer',
              boxShadow: activeCategoryTab === 'all' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none'
            }}
          >
            <Sparkles size={16} /> <span>All Services ({allPackagesCount})</span>
          </button>

          {/* EMBROIDERY TAB */}
          <button
            type="button"
            onClick={() => { setActiveCategoryTab('embroidery'); setEditingTier(null); }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.65rem 1.25rem',
              borderRadius: '10px',
              border: 'none',
              background: activeCategoryTab === 'embroidery' ? '#ffffff' : 'transparent',
              color: activeCategoryTab === 'embroidery' ? '#ea580c' : 'var(--navy-700)',
              fontWeight: 800,
              fontSize: '0.875rem',
              cursor: 'pointer',
              boxShadow: activeCategoryTab === 'embroidery' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none'
            }}
          >
            <Layers size={16} /> <span>Embroidery Digitizing ({embPackagesCount})</span>
          </button>

          {/* VECTOR ART TAB */}
          <button
            type="button"
            onClick={() => { setActiveCategoryTab('vector_art'); setEditingTier(null); }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.65rem 1.25rem',
              borderRadius: '10px',
              border: 'none',
              background: activeCategoryTab === 'vector_art' ? '#ffffff' : 'transparent',
              color: activeCategoryTab === 'vector_art' ? '#2563eb' : 'var(--navy-700)',
              fontWeight: 800,
              fontSize: '0.875rem',
              cursor: 'pointer',
              boxShadow: activeCategoryTab === 'vector_art' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none'
            }}
          >
            <PenTool size={16} /> <span>Vector Art Redraw ({vecPackagesCount})</span>
          </button>

          {/* CUSTOM PATCHES TAB */}
          <button
            type="button"
            onClick={() => { setActiveCategoryTab('patches'); setEditingTier(null); }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.65rem 1.25rem',
              borderRadius: '10px',
              border: 'none',
              background: activeCategoryTab === 'patches' ? '#ffffff' : 'transparent',
              color: activeCategoryTab === 'patches' ? '#059669' : 'var(--navy-700)',
              fontWeight: 800,
              fontSize: '0.875rem',
              cursor: 'pointer',
              boxShadow: activeCategoryTab === 'patches' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none'
            }}
          >
            <Tag size={16} /> <span>Custom Patches ({patchPackagesCount})</span>
          </button>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="btn btn-primary-orange"
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, padding: '0.7rem 1.35rem', borderRadius: '12px' }}
        >
          <Plus size={18} /> Add New Package
        </button>
      </div>

      {/* Main Content Area */}
      {!editingTier ? (
        /* Package Cards Overview Grid */
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '1.75rem',
          alignItems: 'stretch'
        }}>
          {currentPackages.map((pkg, idx) => {
            const theme = pkg.theme;
            const ThemeIcon = theme.icon;

            return (
              <div
                key={pkg.id || idx}
                style={{
                  background: '#ffffff',
                  border: pkg.is_popular ? `2.5px solid ${theme.color}` : '1.5px solid var(--border-color)',
                  borderRadius: '20px',
                  padding: '2rem 1.5rem 1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: pkg.is_popular ? `0 12px 30px ${theme.glowColor}` : '0 4px 16px rgba(0,0,0,0.04)',
                  position: 'relative'
                }}
              >
                {/* Top Badge */}
                {pkg.badge_text && (
                  <span style={{
                    position: 'absolute',
                    top: '-12px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: theme.color,
                    color: '#ffffff',
                    padding: '0.25rem 1rem',
                    borderRadius: '9999px',
                    fontSize: '0.72rem',
                    fontWeight: 900,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    boxShadow: `0 4px 10px ${theme.glowColor}`
                  }}>
                    {pkg.badge_text}
                  </span>
                )}

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ background: theme.bgLight, color: theme.color, padding: '0.5rem', borderRadius: '10px', display: 'flex' }}>
                        <ThemeIcon size={18} />
                      </div>
                      <div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: theme.color }}>
                          {activeCategoryTab === 'all' ? `${theme.serviceLabel.split(' ')[0]} #${pkg.display_order || (idx + 1)}` : `PACKAGE #${idx + 1}`}
                        </span>
                        {activeCategoryTab === 'all' && (
                          <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                            {theme.serviceLabel}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Reorder Arrows */}
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      <button
                        type="button"
                        disabled={isSaving}
                        onClick={() => handleReorder(pkg, 'up')}
                        style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '0.25rem', cursor: 'pointer' }}
                        title="Move Up"
                      >
                        <ChevronUp size={14} />
                      </button>
                      <button
                        type="button"
                        disabled={isSaving}
                        onClick={() => handleReorder(pkg, 'down')}
                        style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '0.25rem', cursor: 'pointer' }}
                        title="Move Down"
                      >
                        <ChevronDown size={14} />
                      </button>
                    </div>
                  </div>

                  <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#0f172a', margin: '0 0 0.5rem', lineHeight: 1.25 }}>
                    {pkg.title}
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0 0 1.25rem', lineHeight: 1.45, minHeight: '38px' }}>
                    {pkg.subtitle}
                  </p>

                  <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
                      <span style={{ fontSize: '2.25rem', fontWeight: 900, color: theme.color, lineHeight: 1 }}>
                        ${typeof pkg.price === 'number' ? pkg.price.toFixed(2) : pkg.price}
                      </span>
                      {pkg.original_price && (
                        <span style={{ fontSize: '1rem', color: '#94a3b8', textDecoration: 'line-through', fontWeight: 600 }}>
                          ${pkg.original_price}
                        </span>
                      )}
                      <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                        {pkg.price_unit || '/ DESIGN'}
                      </span>
                    </div>
                  </div>

                  <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Clock size={14} style={{ color: theme.color }} /> {pkg.turnaround_time || '4–12 Hours'}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
                    {(pkg.features || []).slice(0, 4).map((f, fIdx) => (
                      <div key={fIdx} style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.82rem', color: '#334155', fontWeight: 500 }}>
                        <CheckCircle size={13} style={{ color: '#10b981', flexShrink: 0 }} />
                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f}</span>
                      </div>
                    ))}
                    {(pkg.features || []).length > 4 && (
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700, paddingLeft: '1.2rem' }}>
                        + {(pkg.features || []).length - 4} more features
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: '0.5rem', paddingTop: '1rem', borderTop: '1px solid #f1f5f9' }}>
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(pkg, idx)}
                    style={{
                      background: theme.color,
                      color: '#ffffff',
                      border: 'none',
                      padding: '0.65rem 0.85rem',
                      borderRadius: '8px',
                      fontWeight: 800,
                      fontSize: '0.82rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.35rem',
                      cursor: 'pointer'
                    }}
                  >
                    <Edit3 size={14} /> Edit
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDuplicate(pkg)}
                    disabled={isSaving}
                    style={{
                      background: '#f1f5f9',
                      color: '#334155',
                      border: '1px solid #e2e8f0',
                      padding: '0.65rem 0.5rem',
                      borderRadius: '8px',
                      fontWeight: 700,
                      fontSize: '0.8rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.3rem',
                      cursor: 'pointer'
                    }}
                    title="Clone / Duplicate"
                  >
                    <Copy size={13} /> Copy
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeleteCandidate(pkg)}
                    style={{
                      background: '#fee2e2',
                      color: '#dc2626',
                      border: '1px solid #fecaca',
                      padding: '0.65rem 0.5rem',
                      borderRadius: '8px',
                      fontWeight: 700,
                      fontSize: '0.8rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.3rem',
                      cursor: 'pointer'
                    }}
                    title="Delete Package"
                  >
                    <Trash2 size={13} /> Del
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Package Editor Form Modal / View */
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.7)',
          backdropFilter: 'blur(6px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '24px',
            maxWidth: '800px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '2.5rem',
            boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
            border: '1px solid var(--border-color)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
              <div>
                <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--orange-500)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  {editingTier === 'new-package' ? 'Add New Pricing Tier' : 'Edit Package Tier'}
                </span>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--navy-900)', margin: '0.2rem 0 0' }}>
                  {formData.title || 'Service Package'}
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.25rem 0 0' }}>
                  All updates persist directly to Supabase and publish instantly to the live site.
                </p>
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

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.35rem' }}>
              
              {/* Category & Order Position */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '1rem' }}>
                <div className="form-group">
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '0.82rem', marginBottom: '0.35rem' }}>Service Category *</label>
                  <select 
                    className="form-control" 
                    value={formData.service_type || (activeCategoryTab === 'all' ? 'embroidery' : activeCategoryTab)} 
                    onChange={e => setFormData({ ...formData, service_type: e.target.value })}
                    style={{ fontWeight: 700 }}
                  >
                    <option value="embroidery">🧵 Commercial Embroidery Digitizing</option>
                    <option value="vector_art">✒️ Raster to Scalable Vector Art</option>
                    <option value="patches">🏷️ Custom Physical Patches</option>
                  </select>
                </div>

                <div className="form-group">
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '0.82rem', marginBottom: '0.35rem' }}>Display Order Position #</label>
                  <input
                    type="number"
                    min="1"
                    className="form-control"
                    value={formData.display_order || 1}
                    onChange={e => setFormData({ ...formData, display_order: parseInt(e.target.value) || 1 })}
                    style={{ fontWeight: 700 }}
                  />
                </div>
              </div>

              {/* Badge & Popular Highlight */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '0.82rem', marginBottom: '0.35rem' }}>Top Pill Badge Text</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={formData.badge_text || ''} 
                    onChange={e => setFormData({ ...formData, badge_text: e.target.value })} 
                    placeholder="e.g. BASIC / MOST POPULAR / WHOLESALE" 
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
                      Highlight as Featured (Most Popular)
                    </label>
                  </div>
                </div>
              </div>

              {/* Package Title & Subtitle */}
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
                    placeholder="e.g. Commercial stitch files for caps, polos, shirts" 
                  />
                </div>
              </div>

              {/* Pricing Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '1rem', padding: '1rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                <div className="form-group">
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '0.82rem', marginBottom: '0.35rem' }}>Price ($) *</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    min="0"
                    required
                    className="form-control" 
                    value={formData.price ?? ''} 
                    onChange={e => setFormData({ ...formData, price: e.target.value })} 
                    placeholder="e.g. 10.00"
                    style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--orange-600)' }}
                  />
                </div>

                <div className="form-group">
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '0.82rem', marginBottom: '0.35rem' }}>Strike Price ($) (Optional)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    min="0"
                    className="form-control" 
                    value={formData.original_price ?? ''} 
                    onChange={e => setFormData({ ...formData, original_price: e.target.value })} 
                    placeholder="e.g. 15.00" 
                  />
                </div>

                <div className="form-group">
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '0.82rem', marginBottom: '0.35rem' }}>Unit Label</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={formData.price_unit || ''} 
                    onChange={e => setFormData({ ...formData, price_unit: e.target.value })} 
                    placeholder="/ DESIGN or / PIECE" 
                  />
                </div>
              </div>

              {/* Turnaround Time & CTA Button Text */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '0.82rem', marginBottom: '0.35rem' }}>Turnaround & Delivery Time</label>
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

              {/* Dynamic Feature Bullets Editor */}
              <div style={{ padding: '1.25rem', background: '#f8fafc', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <label style={{ fontWeight: 800, fontSize: '0.88rem', color: 'var(--navy-900)', margin: 0 }}>
                    Package Features & Included Deliverables ({(formData.features || []).length})
                  </label>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Add, edit inline, or reorder bullet features
                  </span>
                </div>

                {/* Features List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                  {(formData.features || []).map((feat, fIdx) => (
                    <div key={fIdx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', width: '22px' }}>
                        #{fIdx + 1}
                      </span>
                      <input 
                        type="text" 
                        className="form-control" 
                        value={feat} 
                        onChange={(e) => handleFeatureChange(fIdx, e.target.value)}
                        style={{ fontSize: '0.85rem' }}
                      />
                      <button
                        type="button"
                        disabled={fIdx === 0}
                        onClick={() => handleMoveFeature(fIdx, 'up')}
                        style={{ background: '#ffffff', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '0.35rem', cursor: fIdx === 0 ? 'not-allowed' : 'pointer', opacity: fIdx === 0 ? 0.3 : 1 }}
                        title="Move feature up"
                      >
                        <ChevronUp size={14} />
                      </button>
                      <button
                        type="button"
                        disabled={fIdx === (formData.features || []).length - 1}
                        onClick={() => handleMoveFeature(fIdx, 'down')}
                        style={{ background: '#ffffff', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '0.35rem', cursor: fIdx === (formData.features || []).length - 1 ? 'not-allowed' : 'pointer', opacity: fIdx === (formData.features || []).length - 1 ? 0.3 : 1 }}
                        title="Move feature down"
                      >
                        <ChevronDown size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveFeature(fIdx)}
                        style={{ background: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '6px', padding: '0.35rem', cursor: 'pointer' }}
                        title="Remove feature"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add Feature Row */}
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Type a new feature bullet and press Add Feature..."
                    value={newFeatureInput}
                    onChange={(e) => setNewFeatureInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddFeature();
                      }
                    }}
                    style={{ fontSize: '0.85rem' }}
                  />
                  <button
                    type="button"
                    onClick={handleAddFeature}
                    className="btn btn-primary-orange btn-sm"
                    style={{ fontWeight: 800, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                  >
                    <Plus size={14} /> Add Feature
                  </button>
                </div>
              </div>

              {/* Form Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setEditingTier(null)}
                  className="btn btn-outline"
                  style={{ fontWeight: 700 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="btn btn-primary-orange"
                  style={{ fontWeight: 800, minWidth: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                >
                  <Save size={16} /> {isSaving ? 'Saving to Database...' : 'Save & Publish Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteCandidate && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(4px)',
          zIndex: 1100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '20px',
            maxWidth: '480px',
            width: '100%',
            padding: '2rem',
            boxShadow: '0 25px 50px rgba(0,0,0,0.35)',
            border: '1px solid #fee2e2'
          }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
              <AlertTriangle size={26} />
            </div>

            <h3 style={{ fontSize: '1.3rem', fontWeight: 900, color: '#991b1b', margin: '0 0 0.5rem' }}>
              Delete Service Package?
            </h3>
            <p style={{ fontSize: '0.9rem', color: '#64748b', lineHeight: 1.5, marginBottom: '1.5rem' }}>
              Are you sure you want to delete <strong>"{deleteCandidate.title}"</strong>? This will permanently remove it from the database and public pricing catalog.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteCandidate(null)}
                className="btn btn-outline"
                style={{ fontWeight: 700 }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteConfirm}
                style={{
                  background: '#dc2626',
                  color: '#ffffff',
                  border: 'none',
                  padding: '0.7rem 1.4rem',
                  borderRadius: '10px',
                  fontWeight: 800,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
              >
                <Trash2 size={16} /> {isDeleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default DynamicPricingEditor;
