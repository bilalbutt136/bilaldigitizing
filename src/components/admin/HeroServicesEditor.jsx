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
  ChevronUp,
  ChevronDown,
  Eye,
  EyeOff,
  Clock
} from 'lucide-react';

import { saveHeroServiceViaApi, getAuthHeaders } from '../../services/supabaseService';

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
    previewTitle: 'Live Studio Production Showcase',
    slideshow_interval: 5,
    showcase_images: []
  },
  embroidery: {
    id: 'embroidery',
    serviceKey: 'embroidery',
    badge: 'Factory-Grade Machine Digitizing',
    title: 'Commercial Embroidery Digitizing Services',
    highlight: 'Zero Thread Breaks. Calculated Pull Compensation. Press Ready.',
    description: 'Engineered by master digitizers with 15+ years factory experience. Hand-mapped stitch pathing for caps, left chest polos, 3D puff foam, and full jacket backs with free unlimited revisions.',
    features: [
      '100% Manual Digitizing (Zero Auto-Trace Shortcuts)',
      'All Machine Formats: Tajima (.DST), Wilcom (.EMB), Brother (.PES)',
      'Guaranteed Zero Thread Breaks & Free Unlimited Production Edits'
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
    previewTitle: 'Embroidery Digitizing & Sew-Out Showcase',
    slideshow_interval: 5,
    showcase_images: []
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
      'Master Source Suite: .AI, .EPS, .SVG & High-Res 300+ DPI PDF'
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
    previewTitle: 'Scalable Vector Redraw Showcase',
    slideshow_interval: 5,
    showcase_images: []
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
      'Free 12-Hour Digital Proof & Doorstep Worldwide Shipping'
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
    previewTitle: 'Physical Custom Patches Showcase',
    slideshow_interval: 5,
    showcase_images: []
  }
};

export const HeroServicesEditor = () => {
  const { heroSlides = [], setHeroSlides, showToast } = useAppState();
  const [selectedService, setSelectedService] = useState('all');
  const [formState, setFormState] = useState(DEFAULT_SERVICES.all);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingState, setUploadingState] = useState({});

  // Sync form state when selected service or heroSlides changes
  useEffect(() => {
    const existing = (heroSlides || []).find(
      s => s.id?.toLowerCase() === selectedService || s.serviceKey?.toLowerCase() === selectedService
    );
    const defaults = DEFAULT_SERVICES[selectedService] || DEFAULT_SERVICES.all;
    
    if (existing) {
      // Parse showcase images
      let rawImages = existing.showcase_images || existing.showcaseImages || existing.trust_points?.[0]?.showcase_images || [];
      let showcaseImages = [];

      if (Array.isArray(rawImages) && rawImages.length > 0) {
        showcaseImages = rawImages.map((img, i) => ({
          id: img.id || `img-${i}`,
          title: img.title || `Showcase Image #${i + 1}`,
          image_url: img.image_url || img.after_image_url || img.afterImg || img.before_image_url || img.beforeImg || '',
          display_order: Number(img.display_order) || (i + 1),
          is_active: img.is_active !== false
        })).filter(img => Boolean(img.image_url));
      }

      if (showcaseImages.length === 0) {
        const fallbackImg = existing.afterImg || existing.banner_image || existing.beforeImg;
        if (fallbackImg && !fallbackImg.includes('unsplash.com')) {
          showcaseImages = [
            {
              id: `${selectedService}-img-1`,
              title: existing.previewTitle || defaults.previewTitle || 'Showcase Image',
              image_url: fallbackImg,
              display_order: 1,
              is_active: true
            }
          ];
        } else {
          showcaseImages = [];
        }
      }

      setFormState({
        id: existing.id || selectedService,
        serviceKey: existing.serviceKey || selectedService,
        badge: existing.badge || defaults.badge,
        title: existing.title || defaults.title,
        highlight: existing.highlight || defaults.highlight,
        description: existing.description || defaults.description,
        features: Array.isArray(existing.features) ? existing.features.map(f => typeof f === 'string' ? f : f.text) : (existing.trust_points?.[0]?.features || defaults.features),
        stats: Array.isArray(existing.stats) ? existing.stats : (existing.trust_points?.[0]?.stats || defaults.stats),
        primary_cta: existing.primary_cta || existing.primaryCta || defaults.primary_cta,
        primary_btn_action: existing.primary_btn_action || existing.trust_points?.[0]?.primaryBtnAction || defaults.primary_btn_action,
        secondary_cta: existing.secondary_cta || existing.secondaryCta || defaults.secondary_cta,
        secondary_btn_action: existing.secondary_btn_action || existing.trust_points?.[0]?.secondaryBtnAction || defaults.secondary_btn_action,
        previewTitle: existing.previewTitle || existing.trust_points?.[0]?.previewTitle || defaults.previewTitle,
        slideshow_interval: Number(existing.slideshow_interval || existing.trust_points?.[0]?.slideshow_interval) || defaults.slideshow_interval || 5,
        showcase_images: showcaseImages
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

  // --- Showcase Multi-Image Management ---

  const handleAddShowcaseImage = () => {
    const images = formState.showcase_images || [];
    const maxOrder = images.reduce((max, img) => Math.max(max, img.display_order || 0), 0);
    const newImageItem = {
      id: `img-${Date.now()}`,
      title: `Showcase Image #${images.length + 1}`,
      image_url: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&q=80&w=1000',
      display_order: maxOrder + 1,
      is_active: true
    };
    setFormState(prev => ({
      ...prev,
      showcase_images: [...(prev.showcase_images || []), newImageItem]
    }));
  };

  const handleShowcaseImageChange = (index, field, value) => {
    setFormState(prev => {
      const images = [...(prev.showcase_images || [])];
      images[index] = { ...images[index], [field]: value };
      return { ...prev, showcase_images: images };
    });
  };

  const handleMoveShowcaseImage = (index, direction) => {
    const images = [...(formState.showcase_images || [])];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= images.length) return;

    const temp = images[index];
    images[index] = images[targetIdx];
    images[targetIdx] = temp;

    const reordered = images.map((img, i) => ({ ...img, display_order: i + 1 }));
    setFormState(prev => ({ ...prev, showcase_images: reordered }));
  };

  const handleToggleShowcaseActive = (index) => {
    setFormState(prev => {
      const images = [...(prev.showcase_images || [])];
      images[index] = { ...images[index], is_active: !images[index].is_active };
      return { ...prev, showcase_images: images };
    });
  };

  const handleDeleteShowcaseImage = (index) => {
    setFormState(prev => {
      const images = (prev.showcase_images || []).filter((_, i) => i !== index);
      const reordered = images.map((img, i) => ({ ...img, display_order: i + 1 }));
      return { ...prev, showcase_images: reordered };
    });
  };

  const handleImageFileUpload = async (file, imageIndex) => {
    if (!file) return;
    setUploadingState(prev => ({ ...prev, [imageIndex]: true }));

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'showcase-gallery');
      formData.append('bucket', 'portfolio-images');

      const authHeaders = await getAuthHeaders();
      const { 'Content-Type': _, ...headers } = authHeaders;

      const response = await fetch('/api/cloudinary/upload', {
        method: 'POST',
        headers,
        body: formData
      });

      const data = await response.json();
      if (data.url || data.secure_url) {
        const uploadedUrl = data.secure_url || data.url;
        handleShowcaseImageChange(imageIndex, 'image_url', uploadedUrl);
        showToast('Showcase image uploaded successfully!', 'success');
      } else {
        throw new Error(data.error || 'Upload returned no URL');
      }
    } catch (err) {
      console.error('Image upload failed:', err);
      showToast('Image upload failed: ' + err.message, 'error');
    } finally {
      setUploadingState(prev => ({ ...prev, [imageIndex]: false }));
    }
  };

  const handleResetToDefaults = () => {
    const defaults = DEFAULT_SERVICES[selectedService] || DEFAULT_SERVICES.all;
    setFormState(defaults);
    showToast(`Reset ${selectedService} to default settings. Click "Save & Publish" to commit.`, 'info');
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setIsSaving(true);

    try {
      const images = (formState.showcase_images || []).map((img, idx) => ({
        id: img.id || `img-${idx}`,
        title: img.title || `Showcase Image #${idx + 1}`,
        image_url: img.image_url || '',
        after_image_url: img.image_url || '',
        display_order: Number(img.display_order) || (idx + 1),
        is_active: img.is_active !== false
      }));

      const payload = {
        ...formState,
        id: selectedService,
        serviceKey: selectedService,
        slideshow_interval: Number(formState.slideshow_interval) || 5,
        showcase_images: images,
        afterImg: images[0]?.image_url || '',
        banner_image: images[0]?.image_url || ''
      };

      const result = await saveHeroServiceViaApi(payload);
      if (result.success) {
        showToast(`"${formState.title}" & ${images.length} showcase images published to live site!`, 'success');
        if (setHeroSlides) {
          setHeroSlides(prev => {
            const index = prev.findIndex(
              s => s.id?.toLowerCase() === selectedService || s.serviceKey?.toLowerCase() === selectedService
            );
            let updated;
            if (index >= 0) {
              updated = [...prev];
              updated[index] = payload;
            } else {
              updated = [...prev, payload];
            }
            if (typeof window !== 'undefined') {
              try {
                localStorage.setItem('hero_slides_live', JSON.stringify(updated));
              } catch {}
              window.dispatchEvent(new CustomEvent('hero_slides_updated', { detail: payload }));
            }
            return updated;
          });
        }
      } else {
        showToast('Failed to save service content: ' + (result.error || 'Unknown error'), 'error');
      }
    } catch (err) {
      console.error('Save service CMS error:', err);
      showToast('Error saving service CMS content: ' + err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const tabs = [
    { id: 'all', label: 'All Services', icon: LayoutGrid },
    { id: 'embroidery', label: 'Embroidery Digitizing', icon: Layers },
    { id: 'vector-art', label: 'Vector Art Conversion', icon: PenTool },
    { id: 'patches', label: 'Custom Patches', icon: Tag }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* 1. Header & Service Selector Tabs */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--navy-950)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles size={22} style={{ color: 'var(--orange-500)' }} /> Service Pages & Showcase Gallery
          </h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: '0.25rem 0 0' }}>
            Manage hero headlines, descriptions, multiple showcase slideshow images, and live site benefits.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={handleResetToDefaults}
            style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <RotateCcw size={15} /> Reset Defaults
          </button>
          
          <button
            type="button"
            className="btn btn-primary-orange btn-sm"
            onClick={handleSave}
            disabled={isSaving}
            style={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Save size={16} /> {isSaving ? 'Publishing...' : 'Save & Publish Changes'}
          </button>
        </div>
      </div>

      {/* 2. Service Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', background: '#f1f5f9', padding: '0.35rem', borderRadius: '12px', flexWrap: 'wrap' }}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isSelected = selectedService === tab.id;
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
                background: isSelected ? '#ffffff' : 'transparent',
                color: isSelected ? 'var(--orange-600)' : 'var(--navy-700)',
                fontWeight: isSelected ? 800 : 600,
                fontSize: '0.9rem',
                cursor: 'pointer',
                boxShadow: isSelected ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. Main Form Container */}
      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        {/* Section A: Headlines & Badges */}
        <div className="card" style={{ padding: '1.75rem', background: '#ffffff', border: '1px solid var(--border-color)', borderRadius: '16px' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--navy-950)', marginBottom: '1.25rem' }}>
            1. Hero Headlines, Description & Copy
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
            <div className="form-group">
              <label style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--navy-900)', marginBottom: '0.35rem', display: 'block' }}>
                Service Badge / Pill Label
              </label>
              <input
                type="text"
                className="form-control"
                value={formState.badge || ''}
                onChange={(e) => handleFieldChange('badge', e.target.value)}
                placeholder="e.g. Complete Studio Capabilities"
                required
              />
            </div>

            <div className="form-group">
              <label style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--navy-900)', marginBottom: '0.35rem', display: 'block' }}>
                Subheading / Highlight Line
              </label>
              <input
                type="text"
                className="form-control"
                value={formState.highlight || ''}
                onChange={(e) => handleFieldChange('highlight', e.target.value)}
                placeholder="e.g. Zero Thread Breaks. 4–12 Hr Delivery."
                required
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--navy-900)', marginBottom: '0.35rem', display: 'block' }}>
              Main Heading (H1/H2 Title)
            </label>
            <input
              type="text"
              className="form-control"
              value={formState.title || ''}
              onChange={(e) => handleFieldChange('title', e.target.value)}
              placeholder="e.g. Commercial Embroidery Digitizing Services"
              required
            />
          </div>

          <div className="form-group">
            <label style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--navy-900)', marginBottom: '0.35rem', display: 'block' }}>
              Service Overview Description
            </label>
            <textarea
              className="form-control"
              rows={3}
              value={formState.description || ''}
              onChange={(e) => handleFieldChange('description', e.target.value)}
              placeholder="Describe the technical details, quality assurance, formats..."
              required
            />
          </div>
        </div>

        {/* Section B: Multiple Showcase Images Slideshow Manager */}
        <div className="card" style={{ padding: '1.75rem', background: '#ffffff', border: '1.5px solid var(--orange-200)', borderRadius: '16px', boxShadow: '0 4px 20px rgba(234, 88, 12, 0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--navy-950)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ImageIcon size={20} style={{ color: 'var(--orange-500)' }} />
                2. Multiple Showcase Images (Auto-Changes Every {formState.slideshow_interval || 5}s) ({(formState.showcase_images || []).length})
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.2rem 0 0.4rem' }}>
                Upload multiple high-quality showcase images for <strong>{selectedService.toUpperCase()}</strong>. The homepage hero will automatically cycle through all active images every {formState.slideshow_interval || 5} seconds.
              </p>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.74rem', fontWeight: 800, color: 'var(--orange-600)', background: 'rgba(249, 115, 22, 0.1)', padding: '0.2rem 0.55rem', borderRadius: '6px', border: '1px solid rgba(249, 115, 22, 0.2)' }}>
                📐 Recommended Showcase Dimensions: 1200 × 750 px (16:10) or 1200 × 800 px • Format: PNG, JPG, WEBP (Max 5MB)
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              {/* Slideshow Interval Setting */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', background: '#f8fafc', padding: '0.4rem 0.8rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                <Clock size={15} style={{ color: 'var(--orange-500)' }} />
                <label style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--navy-900)', margin: 0 }}>Rotation Speed:</label>
                <select
                  value={formState.slideshow_interval || 5}
                  onChange={(e) => handleFieldChange('slideshow_interval', parseInt(e.target.value) || 5)}
                  style={{ fontWeight: 800, border: 'none', background: 'transparent', color: 'var(--orange-600)', cursor: 'pointer', outline: 'none' }}
                >
                  <option value={3}>3 Seconds</option>
                  <option value={4}>4 Seconds</option>
                  <option value={5}>5 Seconds (Default)</option>
                  <option value={6}>6 Seconds</option>
                  <option value={8}>8 Seconds</option>
                  <option value={10}>10 Seconds</option>
                </select>
              </div>

              <button
                type="button"
                onClick={handleAddShowcaseImage}
                className="btn btn-primary-orange btn-sm"
                style={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <Plus size={16} /> Add Showcase Image
              </button>
            </div>
          </div>

          {/* Grid of Showcase Image Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
            {(formState.showcase_images || []).map((item, idx) => {
              const isUploading = uploadingState[idx];

              return (
                <div
                  key={item.id || idx}
                  style={{
                    background: item.is_active ? '#ffffff' : '#f8fafc',
                    border: item.is_active ? '1.5px solid var(--border-color)' : '1.5px dashed #cbd5e1',
                    borderRadius: '16px',
                    padding: '1.25rem',
                    boxShadow: item.is_active ? '0 4px 16px rgba(0,0,0,0.04)' : 'none',
                    opacity: item.is_active ? 1 : 0.75,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '1rem',
                    transition: 'all 0.2s'
                  }}
                >
                  {/* Top Bar of Image Card */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{
                          background: item.is_active ? 'var(--orange-500)' : '#94a3b8',
                          color: '#ffffff',
                          fontSize: '0.75rem',
                          fontWeight: 900,
                          padding: '0.2rem 0.6rem',
                          borderRadius: '6px'
                        }}>
                          IMAGE #{idx + 1}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        {/* Active/Inactive Toggle */}
                        <button
                          type="button"
                          onClick={() => handleToggleShowcaseActive(idx)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            background: item.is_active ? '#ecfdf5' : '#f1f5f9',
                            color: item.is_active ? '#059669' : '#64748b',
                            border: `1px solid ${item.is_active ? '#a7f3d0' : '#e2e8f0'}`,
                            padding: '0.3rem 0.55rem',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                          title={item.is_active ? 'Click to disable from slideshow' : 'Click to enable in slideshow'}
                        >
                          {item.is_active ? <Eye size={12} /> : <EyeOff size={12} />}
                          <span>{item.is_active ? 'Active' : 'Disabled'}</span>
                        </button>

                        {/* Move Up/Down Reorder */}
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => handleMoveShowcaseImage(idx, 'up')}
                          style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '0.3rem', cursor: idx === 0 ? 'not-allowed' : 'pointer', opacity: idx === 0 ? 0.3 : 1 }}
                          title="Move Up"
                        >
                          <ChevronUp size={13} />
                        </button>
                        <button
                          type="button"
                          disabled={idx === (formState.showcase_images || []).length - 1}
                          onClick={() => handleMoveShowcaseImage(idx, 'down')}
                          style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '0.3rem', cursor: idx === (formState.showcase_images || []).length - 1 ? 'not-allowed' : 'pointer', opacity: idx === (formState.showcase_images || []).length - 1 ? 0.3 : 1 }}
                          title="Move Down"
                        >
                          <ChevronDown size={13} />
                        </button>

                        {/* Delete */}
                        <button
                          type="button"
                          onClick={() => handleDeleteShowcaseImage(idx)}
                          style={{ background: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '6px', padding: '0.3rem', cursor: 'pointer' }}
                          title="Delete Image"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    {/* Image Preview Thumbnail */}
                    {item.image_url ? (
                      <div style={{ width: '100%', height: '160px', borderRadius: '10px', overflow: 'hidden', marginBottom: '0.85rem', background: '#090d16', border: '1px solid #e2e8f0' }}>
                        <img src={item.image_url} alt="Showcase preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    ) : (
                      <div style={{ width: '100%', height: '140px', borderRadius: '10px', background: '#f1f5f9', border: '1.5px dashed #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.85rem', color: '#94a3b8', fontSize: '0.85rem' }}>
                        No Image Uploaded
                      </div>
                    )}

                    {/* Title / Caption Input */}
                    <div style={{ marginBottom: '0.75rem' }}>
                      <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--navy-900)', display: 'block', marginBottom: '0.25rem' }}>
                        Image Caption / Title
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        value={item.title || ''}
                        onChange={(e) => handleShowcaseImageChange(idx, 'title', e.target.value)}
                        placeholder="e.g. Left Chest Logo Digitizing"
                        style={{ fontSize: '0.85rem' }}
                      />
                    </div>
                  </div>

                  {/* Upload & URL Row */}
                  <div>
                    <label style={{ display: 'block', width: '100%', marginBottom: '0.5rem' }}>
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleImageFileUpload(e.target.files[0], idx);
                          }
                        }}
                      />
                      <span className="btn btn-outline btn-sm" style={{ width: '100%', fontSize: '0.8rem', fontWeight: 700, borderColor: 'var(--orange-500)', color: 'var(--orange-600)', background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', cursor: 'pointer' }}>
                        {isUploading ? <RefreshCw size={13} className="spin-icon" /> : <Upload size={13} />}
                        <span>{isUploading ? 'Uploading to Storage...' : 'Upload Image File'}</span>
                      </span>
                    </label>

                    <input
                      type="url"
                      className="form-control"
                      placeholder="Or paste direct Image URL..."
                      value={item.image_url || ''}
                      onChange={(e) => handleShowcaseImageChange(idx, 'image_url', e.target.value)}
                      style={{ fontSize: '0.8rem' }}
                    />
                  </div>

                </div>
              );
            })}
          </div>
        </div>

        {/* Section C: Service Benefits Checklist */}
        <div className="card" style={{ padding: '1.75rem', background: '#ffffff', border: '1px solid var(--border-color)', borderRadius: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--navy-950)', margin: 0 }}>
              3. Service Quality Features & Bullet Points ({(formState.features || []).length})
            </h3>
            <button
              type="button"
              className="btn btn-primary-orange btn-sm"
              onClick={handleAddFeature}
              style={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <Plus size={14} /> Add Bullet Point
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {(formState.features || []).map((feat, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <CheckCircle2 size={18} style={{ color: 'var(--orange-500)', flexShrink: 0 }} />
                <input
                  type="text"
                  className="form-control"
                  value={feat}
                  onChange={(e) => handleFeatureChange(idx, e.target.value)}
                  placeholder="Feature point description..."
                  required
                />
                <button
                  type="button"
                  onClick={() => handleRemoveFeature(idx)}
                  style={{ background: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '8px', padding: '0.6rem', cursor: 'pointer' }}
                  title="Remove feature"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Section D: Stats & CTAs */}
        <div className="card" style={{ padding: '1.75rem', background: '#ffffff', border: '1px solid var(--border-color)', borderRadius: '16px' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--navy-950)', marginBottom: '1.25rem' }}>
            4. Statistics Counters & Call To Action Buttons
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            {(formState.stats || []).map((stat, idx) => (
              <div key={idx} style={{ background: '#f8fafc', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--navy-800)', display: 'block', marginBottom: '0.35rem' }}>
                  Stat #{idx + 1} Value & Label
                </label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    className="form-control"
                    value={stat.value || ''}
                    onChange={(e) => handleStatChange(idx, 'value', e.target.value)}
                    placeholder="e.g. 100k+"
                    style={{ fontWeight: 800, color: 'var(--orange-600)' }}
                  />
                  <input
                    type="text"
                    className="form-control"
                    value={stat.label || ''}
                    onChange={(e) => handleStatChange(idx, 'label', e.target.value)}
                    placeholder="e.g. Sew-Outs"
                  />
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            <div style={{ background: '#fff7ed', padding: '1.25rem', borderRadius: '12px', border: '1px solid #fed7aa' }}>
              <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#c2410c', marginBottom: '0.75rem' }}>Primary Action Button</div>
              <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 700 }}>Button Text</label>
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
                <label style={{ fontSize: '0.78rem', fontWeight: 700 }}>Destination URL / Action</label>
                <input
                  type="text"
                  className="form-control"
                  value={formState.primary_btn_action || ''}
                  onChange={(e) => handleFieldChange('primary_btn_action', e.target.value)}
                  placeholder="e.g. /order or #pricing"
                />
              </div>
            </div>

            <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--navy-900)', marginBottom: '0.75rem' }}>Secondary Action Button</div>
              <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 700 }}>Button Text</label>
                <input
                  type="text"
                  className="form-control"
                  value={formState.secondary_cta || ''}
                  onChange={(e) => handleFieldChange('secondary_cta', e.target.value)}
                  placeholder="e.g. View Embroidery Packages"
                  required
                />
              </div>
              <div className="form-group">
                <label style={{ fontSize: '0.78rem', fontWeight: 700 }}>Destination URL / Action</label>
                <input
                  type="text"
                  className="form-control"
                  value={formState.secondary_btn_action || ''}
                  onChange={(e) => handleFieldChange('secondary_btn_action', e.target.value)}
                  placeholder="e.g. /services/embroidery-digitizing"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Save Bar */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', paddingBottom: '3rem' }}>
          <button
            type="submit"
            disabled={isSaving}
            className="btn btn-primary-orange btn-lg"
            style={{ minWidth: '240px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
          >
            <Save size={18} /> {isSaving ? 'Publishing Changes...' : 'Save & Publish Live Changes'}
          </button>
        </div>

      </form>
    </div>
  );
};

export default HeroServicesEditor;
