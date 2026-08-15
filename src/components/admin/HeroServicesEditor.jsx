'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAppState } from '../../context/StateContext';
import { 
  Save, 
  Sparkles, 
  Layers, 
  PenTool, 
  Tag, 
  LayoutGrid, 
  RotateCcw, 
  CheckCircle2, 
  Plus, 
  Trash2, 
  Image as ImageIcon,
  Upload,
  RefreshCw,
  DollarSign,
  Clock,
  Package
} from 'lucide-react';
import { saveHeroServiceViaApi } from '../../services/supabaseService';

const DEFAULT_SERVICES = {
  all: {
    id: 'all',
    serviceKey: 'all',
    badge: 'Complete Studio Capabilities',
    title: 'Commercial Embroidery, Scalable Vector Art & Custom Patches',
    highlight: 'Three Master Services. Factory-Grade Precision. 4–12 Hr Delivery.',
    description: 'From machine-ready stitch files (.DST, .PES, .EMB) and crisp spot-color vector art (.AI, .EPS, .SVG) to physical custom patches with Velcro and Iron-On backings delivered straight to your door.',
    features: [
      'Embroidery Digitizing: Starts $10.00 Flat · 100% Hand Pathing · 0 Thread Breaks',
      'Vector Art Redraw: Starts $15.00 Flat · Pantone Spot Colors · Master AI/EPS/SVG',
      'Custom Physical Patches: Starts $1.50 / Piece · Velcro & Iron-On · Doorstep Delivery'
    ],
    packages: [
      {
        id: 'pkg-all-1',
        name: 'Commercial Embroidery Digitizing',
        price: '$10.00',
        turnaround: '4–12 Hours',
        description: 'Tajima .DST, Wilcom .EMB & Brother .PES with free unlimited revisions and zero thread breaks.',
        features: ['100% Manual Digitizing', 'Free Unlimited Edits', 'PDF Sequence Sheet', 'All Formats (.DST/.PES/.EMB)']
      },
      {
        id: 'pkg-all-2',
        name: 'Scalable Vector Art Redraw',
        price: '$15.00',
        turnaround: '6–12 Hours',
        description: 'Pixel-perfect Bézier node curves with Pantone spot color separation for screen printing.',
        features: ['Hand-Drawn Vector Nodes', 'Pantone Spot Colors', 'Master Suite (.AI/.EPS/.SVG)', 'High-Res 300 DPI PDF']
      },
      {
        id: 'pkg-all-3',
        name: 'Custom Physical Manufactured Patches',
        price: '$1.50 / pc',
        turnaround: '3–5 Days',
        description: 'Embroidered, woven, and 3D PVC patches with Velcro and Iron-On backings delivered globally.',
        features: ['Embroidered / Woven / PVC', 'Velcro & Iron-On Backings', '12-Hr Free Digital Proof', 'Global Doorstep Delivery']
      }
    ],
    stats: [
      { value: '1,200+', label: 'Clients' },
      { value: '45+', label: 'Countries' },
      { value: '4-Hr', label: 'Express' },
      { value: '100%', label: 'Guaranteed' }
    ],
    primary_cta: 'Get Started Now',
    primary_btn_action: '#pricing',
    secondary_cta: 'Explore Packages',
    secondary_btn_action: '/pricing',
    previewTitle: 'All Studio Production Results',
    beforeImg: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=1000',
    afterImg: 'https://images.unsplash.com/photo-1620660605929-e1fcc13bb221?auto=format&fit=crop&q=80&w=1000',
    beforeTag: 'Raw Artwork',
    afterTag: 'Finished Production'
  },
  embroidery: {
    id: 'embroidery',
    serviceKey: 'embroidery',
    badge: 'Factory-Grade Machine Digitizing',
    title: 'Commercial Embroidery Digitizing',
    highlight: 'Zero Thread Breaks. Calculated Pull Compensation. 4–12 Hr Turnaround.',
    description: 'Engineered by master digitizers with 15+ years factory experience. Hand-mapped stitch pathing for caps, left chest polos, 3D puff foam, and full jacket backs with free unlimited revisions.',
    features: [
      '100% Manual Digitizing (No Auto-Trace shortcuts)',
      'All Machine Formats: Tajima (.DST), Wilcom (.EMB), Brother (.PES), Melco (.EXP)',
      'Free Unlimited Production Edits & Color Sequence Sheets',
      'Packages: Left Chest ($10), Mid-Size ($20), Full Back & 3D Puff ($35)'
    ],
    packages: [
      {
        id: 'pkg-emb-1',
        name: 'Left Chest & Cap Small Logo',
        price: '$10.00',
        turnaround: '4–12 Hours',
        description: 'Standard logos up to 4" x 4" optimized for structured caps, polos, and left-chest apparel.',
        features: ['Up to 4" x 4" Size', 'Cap & Flat Optimization', 'Underlay Compensation', 'Free Machine Formats']
      },
      {
        id: 'pkg-emb-2',
        name: 'Mid-Size Jacket & Sleeve Design',
        price: '$20.00',
        turnaround: '6–12 Hours',
        description: 'Medium complexity artwork up to 7" x 7" with calculated density and pull compensation.',
        features: ['Up to 7" x 7" Size', 'Complex Multi-Color Pathing', 'Unlimited Free Revisions', 'Production PDF Sheet']
      },
      {
        id: 'pkg-emb-3',
        name: 'Full Jacket Back & 3D Puff',
        price: '$35.00',
        turnaround: '8–12 Hours',
        description: 'High stitch count full back designs up to 12" x 12" and specialty 3D puff foam digitizing.',
        features: ['Up to 12" x 12" Full Back', '3D Puff Foam Layering', 'High Density Pathing', 'Priority Expedited QA']
      }
    ],
    stats: [
      { value: '100k+', label: 'Sew-Outs' },
      { value: '0', label: 'Thread Breaks' },
      { value: '4-12 Hr', label: 'Delivery' },
      { value: '100%', label: 'Guaranteed' }
    ],
    primary_cta: 'Order Embroidery Digitizing',
    primary_btn_action: '/order',
    secondary_cta: 'View Embroidery Packages',
    secondary_btn_action: '/services/embroidery-digitizing',
    previewTitle: 'Raw Art to High-Density Sew-Out',
    beforeImg: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=1000',
    afterImg: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&q=80&w=1000',
    beforeTag: 'Original Logo',
    afterTag: 'Digitized Sew-Out'
  },
  'vector-art': {
    id: 'vector-art',
    serviceKey: 'vector-art',
    badge: 'Resolution-Independent Vector Tracing',
    title: 'Raster to Scalable Vector Art Conversion',
    highlight: 'Hand-Drawn Bézier Curves. Pantone Color Separation. Press Ready.',
    description: 'Convert blurry low-res JPGs, PNGs, and sketches into razor-sharp vector graphics with clean anchor nodes, exact Pantone (PMS) matching, and separated layers for screen printing and vinyl cutting.',
    features: [
      '100% Hand-Crafted Smooth Node Paths (Zero Overlapping Lines)',
      'Pantone Solid Coated Spot Color Separation Included',
      'Master Source Suite: .AI, .EPS, .SVG & High-Res 300+ DPI PDF',
      'Packages: Simple Logo ($15), Medium Detail ($25), Complex Art ($45)'
    ],
    packages: [
      {
        id: 'pkg-vec-1',
        name: 'Simple Logo & Typography Redraw',
        price: '$15.00',
        turnaround: '6–12 Hours',
        description: 'Clean typographic logos, basic shapes, and clean line work converted to crisp vector nodes.',
        features: ['Clean Bézier Curves', 'Sharp Vector Nodes', 'AI, EPS, SVG, PDF', 'Infinite Scalability']
      },
      {
        id: 'pkg-vec-2',
        name: 'Medium Detail Artwork with Colors',
        price: '$25.00',
        turnaround: '8–12 Hours',
        description: 'Multi-color logos, badges, and detailed illustrations with Pantone spot color matching.',
        features: ['Pantone PMS Color Match', 'Separated Color Layers', 'Gradients & Blends', 'Cut-Path Vinyl Friendly']
      },
      {
        id: 'pkg-vec-3',
        name: 'Complex Intricate Illustration',
        price: '$45.00',
        turnaround: '12–24 Hours',
        description: 'Highly intricate artwork, photographic traces, crests, and mascot illustrations.',
        features: ['Intricate Fine Lines', 'Complete Layer Organization', 'Print-Ready Color Separations', 'Master Source Files']
      }
    ],
    stats: [
      { value: '50k+', label: 'Vectors' },
      { value: 'Sharp', label: 'Cut Paths' },
      { value: '6-12 Hr', label: 'Delivery' },
      { value: '100%', label: 'Scale-Free' }
    ],
    primary_cta: 'Order Vector Art Conversion',
    primary_btn_action: '/order',
    secondary_cta: 'View Vector Packages',
    secondary_btn_action: '/services/vector-tracing',
    previewTitle: 'Blurry Raster to Clean Scalable Vector',
    beforeImg: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=1000',
    afterImg: 'https://images.unsplash.com/photo-1620660605929-e1fcc13bb221?auto=format&fit=crop&q=80&w=1000',
    beforeTag: 'Blurry Pixelated Raster',
    afterTag: 'Sharp Vector Nodes'
  },
  patches: {
    id: 'patches',
    serviceKey: 'patches',
    badge: 'Custom Manufactured Emblems',
    title: 'Premium Physical Custom Patches',
    highlight: 'Embroidered, Woven & 3D Molded PVC. Doorstep Delivery.',
    description: 'Custom manufactured physical patches for uniforms, tactical gear, hats, and apparel brands. Available with Velcro hook & loop, iron-on, or adhesive backings with free digital proofs before production.',
    features: [
      'Custom Embroidered, High-Density Woven & 3D Rubber PVC',
      'Military-Grade Velcro, Heat-Seal Iron-On & Peel Backings',
      'Free 12-Hour Digital Proof & Doorstep Worldwide Shipping',
      'Quantity Tiers: Sample (10-50 pcs), Production (100-500 pcs), Bulk ($1.50/pc)'
    ],
    packages: [
      {
        id: 'pkg-patch-1',
        name: 'Sample Quantity Batch (10–50 Pcs)',
        price: '$4.50 / pc',
        turnaround: '3–5 Days',
        description: 'Low-minimum run perfect for small brands, clubs, and prototype testing before mass production.',
        features: ['Low 10 Pcs Minimum', '12-Hr Free Proofing', 'Velcro / Iron-On', '100% Quality Checked']
      },
      {
        id: 'pkg-patch-2',
        name: 'Production Batch (100–500 Pcs)',
        price: '$2.50 / pc',
        turnaround: '4–7 Days',
        description: 'Standard volume for uniform programs, merchandise, and tactical apparel.',
        features: ['Merrowed or Laser Border', 'Free Custom Backing', 'Up to 9 Thread Colors', 'Free Doorstep Shipping']
      },
      {
        id: 'pkg-patch-3',
        name: 'Wholesale Bulk Batch (500+ Pcs)',
        price: '$1.50 / pc',
        turnaround: '7–10 Days',
        description: 'Factory direct wholesale pricing with volume discounts and priority manufacturing line.',
        features: ['Factory Direct Rates', 'Custom Packaging Available', 'Express Global Delivery', 'Dedicated Production QA']
      }
    ],
    stats: [
      { value: '10 Pcs', label: 'Low MOQ' },
      { value: '12-Hr', label: 'Free Proof' },
      { value: '3-5 Day', label: 'Production' },
      { value: 'Global', label: 'Doorstep Delivery' }
    ],
    primary_cta: 'Order Custom Patches',
    primary_btn_action: '/order',
    secondary_cta: 'Get Free Patch Proof',
    secondary_btn_action: '/custom-patches',
    previewTitle: 'Artwork to Physical Manufactured Patch',
    beforeImg: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=1000',
    afterImg: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&q=80&w=1000',
    beforeTag: 'Design Artwork',
    afterTag: 'Manufactured Patch'
  }
};

export const HeroServicesEditor = () => {
  const { heroSlides = [], setHeroSlides, showToast } = useAppState();
  const [selectedService, setSelectedService] = useState('all');
  const [formState, setFormState] = useState(DEFAULT_SERVICES.all);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingState, setUploadingState] = useState({ beforeImg: false, afterImg: false });

  const beforeFileInputRef = useRef(null);
  const afterFileInputRef = useRef(null);

  // Sync form state when service tab or heroSlides changes
  useEffect(() => {
    const existing = (heroSlides || []).find(
      s => s.id?.toLowerCase() === selectedService || s.serviceKey?.toLowerCase() === selectedService
    );
    const defaults = DEFAULT_SERVICES[selectedService] || DEFAULT_SERVICES.all;
    
    if (existing) {
      setFormState({
        id: existing.id || selectedService,
        serviceKey: existing.serviceKey || selectedService,
        badge: existing.badge || defaults.badge,
        title: existing.title || defaults.title,
        highlight: existing.highlight || defaults.highlight,
        description: existing.description || defaults.description,
        features: Array.isArray(existing.features) ? existing.features.map(f => typeof f === 'string' ? f : f.text) : (existing.trust_points?.[0]?.features || defaults.features),
        packages: Array.isArray(existing.packages) && existing.packages.length > 0 ? existing.packages : (existing.trust_points?.[0]?.packages || defaults.packages),
        stats: Array.isArray(existing.stats) ? existing.stats : (existing.trust_points?.[0]?.stats || defaults.stats),
        primary_cta: existing.primary_cta || existing.primaryCta || defaults.primary_cta,
        primary_btn_action: existing.primary_btn_action || existing.trust_points?.[0]?.primaryBtnAction || defaults.primary_btn_action,
        secondary_cta: existing.secondary_cta || existing.secondaryCta || defaults.secondary_cta,
        secondary_btn_action: existing.secondary_btn_action || existing.trust_points?.[0]?.secondaryBtnAction || defaults.secondary_btn_action,
        previewTitle: existing.previewTitle || existing.trust_points?.[0]?.previewTitle || defaults.previewTitle,
        beforeImg: existing.beforeImg || existing.trust_points?.[0]?.previewBefore || defaults.beforeImg,
        afterImg: existing.afterImg || existing.banner_image || defaults.afterImg,
        beforeTag: existing.beforeTag || existing.trust_points?.[0]?.previewTag || defaults.beforeTag,
        afterTag: existing.afterTag || existing.trust_points?.[0]?.previewTagAfter || defaults.afterTag
      });
    } else {
      setFormState(defaults);
    }
  }, [selectedService, heroSlides]);

  const handleFieldChange = (field, value) => {
    setFormState(prev => ({ ...prev, [field]: value }));
  };

  const handleStatChange = (index, key, value) => {
    setFormState(prev => {
      const updated = [...(prev.stats || [])];
      updated[index] = { ...updated[index], [key]: value };
      return { ...prev, stats: updated };
    });
  };

  const handleFeatureChange = (index, value) => {
    setFormState(prev => {
      const updated = [...(prev.features || [])];
      updated[index] = value;
      return { ...prev, features: updated };
    });
  };

  const handleAddFeature = () => {
    setFormState(prev => ({
      ...prev,
      features: [...(prev.features || []), 'New custom feature highlight']
    }));
  };

  const handleRemoveFeature = (index) => {
    setFormState(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  // Package tier modifications
  const handlePackageChange = (index, field, value) => {
    setFormState(prev => {
      const updatedPkgs = [...(prev.packages || [])];
      updatedPkgs[index] = { ...updatedPkgs[index], [field]: value };
      return { ...prev, packages: updatedPkgs };
    });
  };

  const handleAddPackage = () => {
    setFormState(prev => ({
      ...prev,
      packages: [
        ...(prev.packages || []),
        {
          id: `pkg-${Date.now()}`,
          name: 'New Package Tier',
          price: '$20.00',
          turnaround: '6–12 Hours',
          description: 'Package tier description and scope.',
          features: ['Feature line 1', 'Feature line 2']
        }
      ]
    }));
  };

  const handleRemovePackage = (index) => {
    setFormState(prev => ({
      ...prev,
      packages: prev.packages.filter((_, i) => i !== index)
    }));
  };

  const handleImageFileUpload = async (file, targetField) => {
    if (!file) return;
    setUploadingState(prev => ({ ...prev, [targetField]: true }));

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'hero-showcase');
      formData.append('bucket', 'portfolio-images');

      const res = await fetch('/api/cloudinary/upload', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      if (data.success && data.url) {
        setFormState(prev => ({ ...prev, [targetField]: data.url }));
        showToast('Image uploaded and saved online successfully!', 'success');
      } else {
        showToast(data.error || 'Failed to upload image file.', 'error');
      }
    } catch (err) {
      console.error('Upload exception:', err);
      showToast('Network error during image upload.', 'error');
    } finally {
      setUploadingState(prev => ({ ...prev, [targetField]: false }));
    }
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();

    // 1. Form Validation
    if (!formState.title || !formState.title.trim()) {
      showToast('Please provide a valid service title.', 'error');
      return;
    }
    if (!formState.description || !formState.description.trim()) {
      showToast('Please provide a valid service description.', 'error');
      return;
    }

    setIsSaving(true);

    try {
      const updatedItem = {
        ...formState,
        id: selectedService,
        serviceKey: selectedService,
        updated_at: new Date().toISOString()
      };

      // Merge into complete heroSlides array
      const existingIdx = (heroSlides || []).findIndex(
        s => s.id?.toLowerCase() === selectedService || s.serviceKey?.toLowerCase() === selectedService
      );

      let newSlides;
      if (existingIdx >= 0) {
        newSlides = heroSlides.map((s, i) => i === existingIdx ? updatedItem : s);
      } else {
        newSlides = [...(heroSlides || []), updatedItem];
      }

      // 2. Save directly to backend API endpoint
      const result = await saveHeroServiceViaApi(updatedItem, newSlides);

      if (result && result.success) {
        // 3. Update React Global State
        if (setHeroSlides) {
          setHeroSlides(result.allSlides || newSlides);
        }
        showToast('Service updated successfully.', 'success');
      } else {
        console.error('Save failed:', result?.error);
        showToast(result?.error || 'Unable to save service. Please try again.', 'error');
      }
    } catch (err) {
      console.error('Save exception:', err);
      showToast('Unable to save service. Please try again.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetDefaults = () => {
    if (confirm(`Reset "${selectedService}" service to studio default values?`)) {
      setFormState(DEFAULT_SERVICES[selectedService] || DEFAULT_SERVICES.all);
      showToast('Form reset to default values. Click Save & Publish Service to apply.', 'info');
    }
  };

  const serviceTabs = [
    { id: 'all', label: 'All Services Overview', icon: LayoutGrid },
    { id: 'embroidery', label: 'Embroidery Digitizing', icon: Layers },
    { id: 'vector-art', label: 'Vector Art Redraw', icon: PenTool },
    { id: 'patches', label: 'Custom Physical Patches', icon: Tag }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Header Bar */}
      <div className="card" style={{ padding: '1.5rem 1.75rem', background: '#ffffff', borderRadius: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--navy-900)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sparkles size={20} style={{ color: 'var(--orange-500)' }} />
              Live Homepage Services & Showcase Control Center
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: '0.35rem 0 0' }}>
              Edit headlines, descriptions, packages, prices, trust stats, and before/after comparison images with direct Supabase persistence.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={handleResetDefaults}
              style={{ fontWeight: 700 }}
            >
              <RotateCcw size={14} /> Reset Defaults
            </button>
            <button
              type="button"
              className="btn btn-primary-orange btn-md"
              onClick={handleSave}
              disabled={isSaving}
              style={{ fontWeight: 800, minWidth: '180px' }}
            >
              <Save size={16} /> {isSaving ? 'Saving...' : 'Save & Publish Service'}
            </button>
          </div>
        </div>
      </div>

      {/* 4 Service Tabs Switcher */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        background: '#f1f5f9',
        padding: '0.4rem',
        borderRadius: '12px',
        border: '1px solid var(--border-color)',
        flexWrap: 'wrap'
      }}>
        {serviceTabs.map(tab => {
          const IconComp = tab.icon;
          const isActive = selectedService === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedService(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.65rem 1.25rem',
                borderRadius: '8px',
                border: 'none',
                background: isActive ? '#ffffff' : 'transparent',
                color: isActive ? 'var(--orange-600)' : 'var(--navy-700)',
                fontWeight: isActive ? 800 : 600,
                fontSize: '0.9rem',
                cursor: 'pointer',
                boxShadow: isActive ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.18s ease'
              }}
            >
              <IconComp size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Edit Form */}
      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
        
        {/* Section 1: Core Service Information */}
        <div className="card" style={{ padding: '2rem', background: '#ffffff', borderRadius: '16px' }}>
          <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--navy-900)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>📝</span> Service Information & Headings
          </h4>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
            <div className="form-group">
              <label style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem', display: 'block' }}>
                Badge Pill Text
              </label>
              <input
                type="text"
                className="form-control"
                value={formState.badge || ''}
                onChange={(e) => handleFieldChange('badge', e.target.value)}
                placeholder="e.g. Factory-Grade Machine Digitizing"
                required
              />
            </div>

            <div className="form-group">
              <label style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem', display: 'block' }}>
                Highlight Subheading (Orange Accent)
              </label>
              <input
                type="text"
                className="form-control"
                value={formState.highlight || ''}
                onChange={(e) => handleFieldChange('highlight', e.target.value)}
                placeholder="e.g. Zero Thread Breaks. 4–12 Hr Turnaround."
                required
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem', display: 'block' }}>
              Main Headline (H1 / Service Title)
            </label>
            <input
              type="text"
              className="form-control"
              value={formState.title || ''}
              onChange={(e) => handleFieldChange('title', e.target.value)}
              placeholder="e.g. Commercial Embroidery Digitizing"
              required
            />
          </div>

          <div className="form-group">
            <label style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem', display: 'block' }}>
              Service Description
            </label>
            <textarea
              className="form-control"
              rows={3}
              value={formState.description || ''}
              onChange={(e) => handleFieldChange('description', e.target.value)}
              placeholder="Full service description that displays on the homepage..."
              required
            />
          </div>
        </div>

        {/* Section 2: Service Packages & Pricing Tiers */}
        <div className="card" style={{ padding: '2rem', background: '#ffffff', borderRadius: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--navy-900)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Package size={20} style={{ color: 'var(--orange-500)' }} />
                Service Packages & Starting Prices
              </h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.25rem 0 0' }}>
                Package tiers shown for this service on the homepage and services section.
              </p>
            </div>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={handleAddPackage}
              style={{ fontWeight: 700 }}
            >
              <Plus size={14} /> Add Package
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
            {(formState.packages || []).map((pkg, idx) => (
              <div
                key={pkg.id || idx}
                style={{
                  padding: '1.25rem',
                  background: '#f8fafc',
                  borderRadius: '12px',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--orange-600)', textTransform: 'uppercase' }}>
                    Package #{idx + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemovePackage(idx)}
                    style={{
                      background: '#fee2e2',
                      border: 'none',
                      color: '#dc2626',
                      padding: '0.35rem',
                      borderRadius: '6px',
                      cursor: 'pointer'
                    }}
                    title="Remove package"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                <div className="form-group">
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, display: 'block', marginBottom: '0.2rem' }}>Package Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={pkg.name || ''}
                    onChange={(e) => handlePackageChange(idx, 'name', e.target.value)}
                    placeholder="e.g. Left Chest & Cap Logo"
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <div className="form-group">
                    <label style={{ fontSize: '0.78rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.2rem' }}>
                      <DollarSign size={12} /> Price
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={pkg.price || ''}
                      onChange={(e) => handlePackageChange(idx, 'price', e.target.value)}
                      placeholder="e.g. $10.00"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label style={{ fontSize: '0.78rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.2rem' }}>
                      <Clock size={12} /> Turnaround
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={pkg.turnaround || ''}
                      onChange={(e) => handlePackageChange(idx, 'turnaround', e.target.value)}
                      placeholder="e.g. 4–12 Hours"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label style={{ fontSize: '0.78rem', fontWeight: 700, display: 'block', marginBottom: '0.2rem' }}>Short Description</label>
                  <textarea
                    className="form-control"
                    rows={2}
                    value={pkg.description || ''}
                    onChange={(e) => handlePackageChange(idx, 'description', e.target.value)}
                    placeholder="Brief package description..."
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 3: Key Features Checklist */}
        <div className="card" style={{ padding: '2rem', background: '#ffffff', borderRadius: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--navy-900)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>✅</span> Key Feature Bullet Points
            </h4>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={handleAddFeature}
              style={{ fontWeight: 700 }}
            >
              <Plus size={14} /> Add Feature Line
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {(formState.features || []).map((feat, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <CheckCircle2 size={18} style={{ color: 'var(--orange-500)', flexShrink: 0 }} />
                <input
                  type="text"
                  className="form-control"
                  value={feat || ''}
                  onChange={(e) => handleFeatureChange(idx, e.target.value)}
                  placeholder="Feature description..."
                  required
                />
                <button
                  type="button"
                  onClick={() => handleRemoveFeature(idx)}
                  style={{
                    background: '#fee2e2',
                    border: 'none',
                    color: '#dc2626',
                    padding: '0.5rem',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}
                  title="Remove feature"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Section 4: Trust Stats (4 Badges) */}
        <div className="card" style={{ padding: '2rem', background: '#ffffff', borderRadius: '16px' }}>
          <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--navy-900)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>⭐</span> Trust Badges & Metrics
          </h4>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            {(formState.stats || []).slice(0, 4).map((st, idx) => (
              <div key={idx} style={{ padding: '1rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--navy-700)', textTransform: 'uppercase', display: 'block', marginBottom: '0.35rem' }}>
                  Stat #{idx + 1}
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Value (e.g. 100k+)"
                    value={st.value || ''}
                    onChange={(e) => handleStatChange(idx, 'value', e.target.value)}
                  />
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Label (e.g. Sew-Outs)"
                    value={st.label || ''}
                    onChange={(e) => handleStatChange(idx, 'label', e.target.value)}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 5: CTA Buttons Configuration */}
        <div className="card" style={{ padding: '2rem', background: '#ffffff', borderRadius: '16px' }}>
          <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--navy-900)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>🚀</span> Call to Action Buttons & Destinations
          </h4>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div style={{ padding: '1.25rem', background: '#fff7ed', borderRadius: '12px', border: '1px solid var(--orange-200)' }}>
              <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--orange-800)', marginBottom: '0.75rem' }}>
                Primary Action Button
              </div>
              <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '0.25rem' }}>Button Text</label>
                <input
                  type="text"
                  className="form-control"
                  value={formState.primary_cta || ''}
                  onChange={(e) => handleFieldChange('primary_cta', e.target.value)}
                  placeholder="e.g. Order Embroidery Digitizing"
                  required
                />
              </div>
              <div className="form-group">
                <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '0.25rem' }}>Action Destination</label>
                <input
                  type="text"
                  className="form-control"
                  value={formState.primary_btn_action || ''}
                  onChange={(e) => handleFieldChange('primary_btn_action', e.target.value)}
                  placeholder="e.g. /order or #pricing"
                  required
                />
              </div>
            </div>

            <div style={{ padding: '1.25rem', background: '#f8fafc', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--navy-900)', marginBottom: '0.75rem' }}>
                Secondary Action Button
              </div>
              <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '0.25rem' }}>Button Text</label>
                <input
                  type="text"
                  className="form-control"
                  value={formState.secondary_cta || ''}
                  onChange={(e) => handleFieldChange('secondary_cta', e.target.value)}
                  placeholder="e.g. View Packages"
                />
              </div>
              <div className="form-group">
                <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '0.25rem' }}>Action Destination</label>
                <input
                  type="text"
                  className="form-control"
                  value={formState.secondary_btn_action || ''}
                  onChange={(e) => handleFieldChange('secondary_btn_action', e.target.value)}
                  placeholder="e.g. /pricing or /services/embroidery-digitizing"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 6: Interactive Comparison Showcase with Direct Image Upload */}
        <div className="card" style={{ padding: '2rem', background: '#ffffff', borderRadius: '16px' }}>
          <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--navy-900)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ImageIcon size={20} style={{ color: 'var(--orange-500)' }} />
            Interactive Comparison Showcase Box (Image Upload & URLs)
          </h4>

          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.35rem', display: 'block' }}>
              Showcase Header Title
            </label>
            <input
              type="text"
              className="form-control"
              value={formState.previewTitle || ''}
              onChange={(e) => handleFieldChange('previewTitle', e.target.value)}
              placeholder="e.g. Raw Art to High-Density Sew-Out"
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.25rem' }}>
            
            {/* Before Artwork Column with File Upload */}
            <div style={{ padding: '1.25rem', background: '#fff1f2', borderRadius: '12px', border: '1px solid #fecdd3' }}>
              <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#991b1b', marginBottom: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Before Image (Left Side)</span>
                <span style={{ fontSize: '0.72rem', background: '#ffe4e6', color: '#be123c', padding: '0.15rem 0.5rem', borderRadius: '6px' }}>RAW ART</span>
              </div>

              {/* Image Preview Thumbnail */}
              {formState.beforeImg && (
                <div style={{ position: 'relative', width: '100%', height: '140px', borderRadius: '8px', overflow: 'hidden', marginBottom: '0.85rem', border: '1px solid #fecdd3', background: '#000' }}>
                  <img src={formState.beforeImg} alt="Before preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              )}

              {/* Direct File Upload Button */}
              <div style={{ marginBottom: '0.85rem' }}>
                <input
                  type="file"
                  ref={beforeFileInputRef}
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleImageFileUpload(e.target.files[0], 'beforeImg');
                    }
                  }}
                />
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  style={{ width: '100%', fontWeight: 700, borderColor: '#f87171', color: '#991b1b', background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                  onClick={() => beforeFileInputRef.current?.click()}
                  disabled={uploadingState.beforeImg}
                >
                  {uploadingState.beforeImg ? (
                    <>
                      <RefreshCw size={14} className="spin-icon" /> Uploading to Storage...
                    </>
                  ) : (
                    <>
                      <Upload size={14} /> Upload Before Image File
                    </>
                  )}
                </button>
              </div>

              <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, display: 'block', marginBottom: '0.2rem' }}>Or Paste Image URL</label>
                <input
                  type="url"
                  className="form-control"
                  value={formState.beforeImg || ''}
                  onChange={(e) => handleFieldChange('beforeImg', e.target.value)}
                  placeholder="https://..."
                  required
                />
              </div>

              <div className="form-group">
                <label style={{ fontSize: '0.78rem', fontWeight: 700, display: 'block', marginBottom: '0.2rem' }}>Before Badge Tag</label>
                <input
                  type="text"
                  className="form-control"
                  value={formState.beforeTag || ''}
                  onChange={(e) => handleFieldChange('beforeTag', e.target.value)}
                  placeholder="e.g. Original Logo"
                />
              </div>
            </div>

            {/* After Finished Production Column with File Upload */}
            <div style={{ padding: '1.25rem', background: '#ecfdf5', borderRadius: '12px', border: '1px solid #a7f3d0' }}>
              <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#065f46', marginBottom: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>After Finished Image (Right Side)</span>
                <span style={{ fontSize: '0.72rem', background: '#d1fae5', color: '#047857', padding: '0.15rem 0.5rem', borderRadius: '6px' }}>FINISHED SEW-OUT</span>
              </div>

              {/* Image Preview Thumbnail */}
              {formState.afterImg && (
                <div style={{ position: 'relative', width: '100%', height: '140px', borderRadius: '8px', overflow: 'hidden', marginBottom: '0.85rem', border: '1px solid #a7f3d0', background: '#000' }}>
                  <img src={formState.afterImg} alt="After preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              )}

              {/* Direct File Upload Button */}
              <div style={{ marginBottom: '0.85rem' }}>
                <input
                  type="file"
                  ref={afterFileInputRef}
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleImageFileUpload(e.target.files[0], 'afterImg');
                    }
                  }}
                />
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  style={{ width: '100%', fontWeight: 700, borderColor: '#34d399', color: '#065f46', background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                  onClick={() => afterFileInputRef.current?.click()}
                  disabled={uploadingState.afterImg}
                >
                  {uploadingState.afterImg ? (
                    <>
                      <RefreshCw size={14} className="spin-icon" /> Uploading to Storage...
                    </>
                  ) : (
                    <>
                      <Upload size={14} /> Upload After Image File
                    </>
                  )}
                </button>
              </div>

              <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, display: 'block', marginBottom: '0.2rem' }}>Or Paste Image URL</label>
                <input
                  type="url"
                  className="form-control"
                  value={formState.afterImg || ''}
                  onChange={(e) => handleFieldChange('afterImg', e.target.value)}
                  placeholder="https://..."
                  required
                />
              </div>

              <div className="form-group">
                <label style={{ fontSize: '0.78rem', fontWeight: 700, display: 'block', marginBottom: '0.2rem' }}>After Badge Tag</label>
                <input
                  type="text"
                  className="form-control"
                  value={formState.afterTag || ''}
                  onChange={(e) => handleFieldChange('afterTag', e.target.value)}
                  placeholder="e.g. Digitized Sew-Out"
                />
              </div>
            </div>

          </div>
        </div>

        {/* Bottom Save Bar */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', paddingBottom: '2rem' }}>
          <button
            type="button"
            className="btn btn-outline"
            onClick={handleResetDefaults}
            style={{ fontWeight: 700 }}
          >
            Reset Defaults
          </button>
          <button
            type="submit"
            className="btn btn-primary-orange btn-lg"
            disabled={isSaving}
            style={{ fontWeight: 800, padding: '0.9rem 2.5rem' }}
          >
            <Save size={18} /> {isSaving ? 'Saving to Database...' : 'Save & Publish Service'}
          </button>
        </div>

      </form>

    </div>
  );
};

export default HeroServicesEditor;
