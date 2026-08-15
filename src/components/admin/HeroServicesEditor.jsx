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
  Clock,
  Sliders
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
    slideshow_interval: 5,
    showcase_images: [
      {
        id: 'all-img-1',
        title: 'Commercial Embroidery Sew-Out',
        before_image_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=1000',
        after_image_url: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&q=80&w=1000',
        before_tag: 'Raw Artwork',
        after_tag: 'Embroidery Sew-Out',
        display_order: 1,
        is_active: true
      },
      {
        id: 'all-img-2',
        title: 'Precision Scalable Vector Redraw',
        before_image_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=1000',
        after_image_url: 'https://images.unsplash.com/photo-1620660605929-e1fcc13bb221?auto=format&fit=crop&q=80&w=1000',
        before_tag: 'Pixelated Raster',
        after_tag: 'Crisp Vector Paths',
        display_order: 2,
        is_active: true
      },
      {
        id: 'all-img-3',
        title: 'Physical Manufactured Custom Patches',
        before_image_url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&q=80&w=1000',
        after_image_url: 'https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&q=80&w=1000',
        before_tag: 'Emblem Design',
        after_tag: 'Manufactured Patch',
        display_order: 3,
        is_active: true
      }
    ]
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
      'Guaranteed Zero Thread Breaks on Commercial Machines'
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
    slideshow_interval: 5,
    showcase_images: [
      {
        id: 'emb-img-1',
        title: 'Left Chest & Polo Logo Digitizing',
        before_image_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=1000',
        after_image_url: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&q=80&w=1000',
        before_tag: 'Original Logo',
        after_tag: 'Digitized Sew-Out',
        display_order: 1,
        is_active: true
      },
      {
        id: 'emb-img-2',
        title: '3D Puff Raised Foam Cap Embroidery',
        before_image_url: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&q=80&w=1000',
        after_image_url: 'https://images.unsplash.com/photo-1576871337632-b9aef4c17ab9?auto=format&fit=crop&q=80&w=1000',
        before_tag: 'Flat Artwork',
        after_tag: '3D Puff Cap',
        display_order: 2,
        is_active: true
      },
      {
        id: 'emb-img-3',
        title: 'Full Jacket Back High-Stitch Masterpiece',
        before_image_url: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&q=80&w=1000',
        after_image_url: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&q=80&w=1000',
        before_tag: 'Design Graphic',
        after_tag: '85k Stitch Sew-Out',
        display_order: 3,
        is_active: true
      }
    ]
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
      'Print, Vinyl Cut & Screen-Printing Production Ready'
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
    slideshow_interval: 5,
    showcase_images: [
      {
        id: 'vec-img-1',
        title: 'Blurry Logo to Razor-Sharp Vector Nodes',
        before_image_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=1000',
        after_image_url: 'https://images.unsplash.com/photo-1620660605929-e1fcc13bb221?auto=format&fit=crop&q=80&w=1000',
        before_tag: 'Blurry Raster',
        after_tag: 'Sharp Vector',
        display_order: 1,
        is_active: true
      },
      {
        id: 'vec-img-2',
        title: 'Pantone Spot Color Separation for Press',
        before_image_url: 'https://images.unsplash.com/photo-1620660605929-e1fcc13bb221?auto=format&fit=crop&q=80&w=1000',
        after_image_url: 'https://images.unsplash.com/photo-1558655146-d09347e92766?auto=format&fit=crop&q=80&w=1000',
        before_tag: 'Multi-Tone Art',
        after_tag: 'PMS Color Separated',
        display_order: 2,
        is_active: true
      }
    ]
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
      'Merrowed & Laser Cut High-Durability Borders'
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
    slideshow_interval: 5,
    showcase_images: [
      {
        id: 'pat-img-1',
        title: 'Tactical Hook & Loop Velcro Patch',
        before_image_url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&q=80&w=1000',
        after_image_url: 'https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&q=80&w=1000',
        before_tag: 'Design Artwork',
        after_tag: 'Manufactured Patch',
        display_order: 1,
        is_active: true
      },
      {
        id: 'pat-img-2',
        title: 'High-Density Merrowed Border Emblem',
        before_image_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=1000',
        after_image_url: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&q=80&w=1000',
        before_tag: 'Emblem Vector',
        after_tag: 'Embroidered Border',
        display_order: 2,
        is_active: true
      }
    ]
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
      let showcaseImages = existing.showcase_images || existing.showcaseImages || existing.trust_points?.[0]?.showcase_images || [];
      if (!Array.isArray(showcaseImages) || showcaseImages.length === 0) {
        // Fallback: build from beforeImg & afterImg or defaults
        const beforeImg = existing.beforeImg || existing.trust_points?.[0]?.previewBefore || defaults.showcase_images[0]?.before_image_url;
        const afterImg = existing.afterImg || existing.banner_image || defaults.showcase_images[0]?.after_image_url;
        if (afterImg) {
          showcaseImages = [
            {
              id: `${selectedService}-legacy-1`,
              title: existing.previewTitle || defaults.previewTitle,
              before_image_url: beforeImg,
              after_image_url: afterImg,
              before_tag: existing.beforeTag || 'Raw Artwork',
              after_tag: existing.afterTag || 'Finished Production',
              display_order: 1,
              is_active: true
            }
          ];
        } else {
          showcaseImages = defaults.showcase_images || [];
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
      title: `Showcase Item #${images.length + 1}`,
      before_image_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=1000',
      after_image_url: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&q=80&w=1000',
      before_tag: 'BEFORE',
      after_tag: 'AFTER',
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

    // Recalculate display_orders
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

  const handleImageFileUpload = async (file, imageIndex, field) => {
    if (!file) return;
    const uploadKey = `${imageIndex}_${field}`;
    setUploadingState(prev => ({ ...prev, [uploadKey]: true }));

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'showcase-gallery');

      const response = await fetch('/api/cloudinary/upload', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      if (data.url || data.secure_url) {
        const uploadedUrl = data.secure_url || data.url;
        handleShowcaseImageChange(imageIndex, field, uploadedUrl);
        showToast('Image uploaded successfully!', 'success');
      } else {
        throw new Error(data.error || 'Upload returned no URL');
      }
    } catch (err) {
      console.error('Image upload failed:', err);
      showToast('Image upload failed: ' + err.message, 'error');
    } finally {
      setUploadingState(prev => ({ ...prev, [uploadKey]: false }));
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
        ...img,
        display_order: Number(img.display_order) || (idx + 1),
        is_active: img.is_active !== false
      }));

      const payload = {
        ...formState,
        id: selectedService,
        serviceKey: selectedService,
        slideshow_interval: Number(formState.slideshow_interval) || 5,
        showcase_images: images,
        beforeImg: images[0]?.before_image_url || '',
        afterImg: images[0]?.after_image_url || '',
        beforeTag: images[0]?.before_tag || 'BEFORE',
        afterTag: images[0]?.after_tag || 'AFTER'
      };

      const result = await saveHeroServiceViaApi(payload);
      if (result.success) {
        showToast(`"${formState.title}" & ${images.length} showcase images published to live site!`, 'success');
        if (setHeroSlides) {
          setHeroSlides(prev => {
            const index = prev.findIndex(
              s => s.id?.toLowerCase() === selectedService || s.serviceKey?.toLowerCase() === selectedService
            );
            if (index >= 0) {
              const updated = [...prev];
              updated[index] = payload;
              return updated;
            }
            return [...prev, payload];
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
                2. Multiple Showcase Images & Slideshow Manager ({(formState.showcase_images || []).length})
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.2rem 0 0' }}>
                Upload multiple Before & After image samples for <strong>{selectedService.toUpperCase()}</strong>. The slideshow will automatically rotate through all active images on the home page.
              </p>
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

          {/* List of Showcase Images */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {(formState.showcase_images || []).map((item, idx) => {
              const beforeUploadKey = `${idx}_before_image_url`;
              const afterUploadKey = `${idx}_after_image_url`;
              const isBeforeUploading = uploadingState[beforeUploadKey];
              const isAfterUploading = uploadingState[afterUploadKey];

              return (
                <div
                  key={item.id || idx}
                  style={{
                    background: item.is_active ? '#ffffff' : '#f8fafc',
                    border: item.is_active ? '1.5px solid var(--border-color)' : '1.5px dashed #cbd5e1',
                    borderRadius: '16px',
                    padding: '1.25rem',
                    boxShadow: item.is_active ? '0 2px 10px rgba(0,0,0,0.03)' : 'none',
                    opacity: item.is_active ? 1 : 0.75,
                    transition: 'all 0.2s'
                  }}
                >
                  {/* Top Bar of Image Card */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.65rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <span style={{
                        background: item.is_active ? 'var(--orange-500)' : '#94a3b8',
                        color: '#ffffff',
                        fontSize: '0.75rem',
                        fontWeight: 900,
                        padding: '0.2rem 0.6rem',
                        borderRadius: '6px'
                      }}>
                        SLIDE #{idx + 1}
                      </span>
                      <strong style={{ fontSize: '0.95rem', color: 'var(--navy-950)' }}>
                        {item.title || `Showcase Item #${idx + 1}`}
                      </strong>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      {/* Active/Inactive Toggle */}
                      <button
                        type="button"
                        onClick={() => handleToggleShowcaseActive(idx)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          background: item.is_active ? '#ecfdf5' : '#f1f5f9',
                          color: item.is_active ? '#059669' : '#64748b',
                          border: `1px solid ${item.is_active ? '#a7f3d0' : '#e2e8f0'}`,
                          padding: '0.35rem 0.65rem',
                          borderRadius: '6px',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                        title={item.is_active ? 'Click to disable from slideshow' : 'Click to enable in slideshow'}
                      >
                        {item.is_active ? <Eye size={13} /> : <EyeOff size={13} />}
                        <span>{item.is_active ? 'Active' : 'Disabled'}</span>
                      </button>

                      {/* Move Up/Down Reorder */}
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => handleMoveShowcaseImage(idx, 'up')}
                        style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '0.35rem', cursor: idx === 0 ? 'not-allowed' : 'pointer', opacity: idx === 0 ? 0.3 : 1 }}
                        title="Move Up"
                      >
                        <ChevronUp size={14} />
                      </button>
                      <button
                        type="button"
                        disabled={idx === (formState.showcase_images || []).length - 1}
                        onClick={() => handleMoveShowcaseImage(idx, 'down')}
                        style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '0.35rem', cursor: idx === (formState.showcase_images || []).length - 1 ? 'not-allowed' : 'pointer', opacity: idx === (formState.showcase_images || []).length - 1 ? 0.3 : 1 }}
                        title="Move Down"
                      >
                        <ChevronDown size={14} />
                      </button>

                      {/* Delete */}
                      <button
                        type="button"
                        onClick={() => handleDeleteShowcaseImage(idx)}
                        style={{ background: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '6px', padding: '0.35rem', cursor: 'pointer' }}
                        title="Delete Image Slide"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Title & Tags Row */}
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--navy-800)', display: 'block', marginBottom: '0.2rem' }}>
                        Slide Title / Caption
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

                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--navy-800)', display: 'block', marginBottom: '0.2rem' }}>
                        Before Tag
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        value={item.before_tag || ''}
                        onChange={(e) => handleShowcaseImageChange(idx, 'before_tag', e.target.value)}
                        placeholder="e.g. BEFORE / RAW ART"
                        style={{ fontSize: '0.85rem' }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--navy-800)', display: 'block', marginBottom: '0.2rem' }}>
                        After Tag
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        value={item.after_tag || ''}
                        onChange={(e) => handleShowcaseImageChange(idx, 'after_tag', e.target.value)}
                        placeholder="e.g. AFTER / SEW-OUT"
                        style={{ fontSize: '0.85rem' }}
                      />
                    </div>
                  </div>

                  {/* Image Upload Columns (Before & After) */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                    
                    {/* Left: Before Image */}
                    <div style={{ padding: '1rem', background: '#fff1f2', borderRadius: '12px', border: '1px solid #fecdd3' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#991b1b' }}>Before Image (Left Side)</span>
                        <span style={{ fontSize: '0.68rem', background: '#ffe4e6', color: '#be123c', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 700 }}>RAW ART</span>
                      </div>

                      {/* Thumbnail Preview */}
                      {item.before_image_url && (
                        <div style={{ width: '100%', height: '110px', borderRadius: '8px', overflow: 'hidden', marginBottom: '0.65rem', background: '#000' }}>
                          <img src={item.before_image_url} alt="Before preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                      )}

                      {/* Upload Button */}
                      <label style={{ display: 'block', width: '100%', marginBottom: '0.5rem' }}>
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              handleImageFileUpload(e.target.files[0], idx, 'before_image_url');
                            }
                          }}
                        />
                        <span className="btn btn-outline btn-sm" style={{ width: '100%', fontSize: '0.78rem', fontWeight: 700, borderColor: '#f87171', color: '#991b1b', background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', cursor: 'pointer' }}>
                          {isBeforeUploading ? <RefreshCw size={13} className="spin-icon" /> : <Upload size={13} />}
                          <span>{isBeforeUploading ? 'Uploading...' : 'Upload File'}</span>
                        </span>
                      </label>

                      <input
                        type="url"
                        className="form-control"
                        placeholder="Or paste image URL..."
                        value={item.before_image_url || ''}
                        onChange={(e) => handleShowcaseImageChange(idx, 'before_image_url', e.target.value)}
                        style={{ fontSize: '0.8rem' }}
                      />
                    </div>

                    {/* Right: After Image */}
                    <div style={{ padding: '1rem', background: '#ecfdf5', borderRadius: '12px', border: '1px solid #a7f3d0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#065f46' }}>After Image (Right Side)</span>
                        <span style={{ fontSize: '0.68rem', background: '#d1fae5', color: '#047857', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 700 }}>FINISHED PRODUCT</span>
                      </div>

                      {/* Thumbnail Preview */}
                      {item.after_image_url && (
                        <div style={{ width: '100%', height: '110px', borderRadius: '8px', overflow: 'hidden', marginBottom: '0.65rem', background: '#000' }}>
                          <img src={item.after_image_url} alt="After preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                      )}

                      {/* Upload Button */}
                      <label style={{ display: 'block', width: '100%', marginBottom: '0.5rem' }}>
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              handleImageFileUpload(e.target.files[0], idx, 'after_image_url');
                            }
                          }}
                        />
                        <span className="btn btn-outline btn-sm" style={{ width: '100%', fontSize: '0.78rem', fontWeight: 700, borderColor: '#34d399', color: '#065f46', background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', cursor: 'pointer' }}>
                          {isAfterUploading ? <RefreshCw size={13} className="spin-icon" /> : <Upload size={13} />}
                          <span>{isAfterUploading ? 'Uploading...' : 'Upload File'}</span>
                        </span>
                      </label>

                      <input
                        type="url"
                        className="form-control"
                        placeholder="Or paste image URL..."
                        value={item.after_image_url || ''}
                        onChange={(e) => handleShowcaseImageChange(idx, 'after_image_url', e.target.value)}
                        style={{ fontSize: '0.8rem' }}
                      />
                    </div>

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
