'use client';

import React, { useState } from 'react';
import { useAppState } from '../../context/StateContext';
import { 
  Globe, 
  DollarSign, 
  Layers, 
  Settings, 
  Save, 
  Plus, 
  Trash2, 
  Sparkles,
  Tag,
  Eye,
  Zap,
  Star,
  HelpCircle,
  Shield
} from 'lucide-react';
import { MediaLibraryManager } from './MediaLibraryManager';

const FALLBACK_SERVICE_CMS_CONTENT = {
  embroidery: {
    showcase: {
      samples: [
        { id: 'emb-s1', title: 'Golden Eagle Sports Polo', category: 'Left Chest', stitches: '12,450 Stitches', colors: '5 Madeira Colors', fabric: 'Pique Cotton Polo', image: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80' },
        { id: 'emb-s2', title: 'Tactical Flexfit Cap Front', category: '3D Puff Cap', stitches: '15,800 Stitches', colors: '2 Colors (3mm Foam)', fabric: 'Structured Wool Cap', image: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=800&q=80' },
        { id: 'emb-s3', title: 'Heritage Apparel Jacket Crest', category: 'Jacket Back', stitches: '48,200 Stitches', colors: '8 Madeira Colors', fabric: 'Heavy Leather & Canvas', image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80' }
      ]
    }
  },
  patch: {
    showcase: {
      samples: [
        { id: 'pat-s1', title: 'Tactical Merrowed Embroidered Patch', category: 'Overlock Edge', stitches: 'High Density Rayon', formats: 'Velcro Backing', image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80' },
        { id: 'pat-s2', title: '3D Molded Rubber PVC Patch', category: 'Tactical PVC', stitches: 'Waterproof Rubber', formats: 'Hook & Loop Backing', image: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80' },
        { id: 'pat-s3', title: 'Laser Debossed Genuine Leather Patch', category: 'Real Leather', stitches: 'Engraved Leather', formats: 'Heat Seal Iron-On', image: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=800&q=80' }
      ]
    }
  },
  vector: {
    showcase: {
      samples: [
        { id: 'vec-s1', title: 'Vintage Skull & Rose Vector', category: 'Spot Color Sep', stitches: 'N/A (Scalable Vector)', formats: 'AI, EPS, SVG, PDF', image: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=800&q=80' },
        { id: 'vec-s2', title: 'Wildcat Athletic Team Mascot', category: 'Hand-Drawn Vector', stitches: 'N/A (Scalable Vector)', formats: 'AI, EPS, SVG', image: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=800&q=80' },
        { id: 'vec-s3', title: 'Corporate Shield & Crest Redraw', category: 'Clean AI & SVG', stitches: 'N/A (Scalable Vector)', formats: 'AI, SVG, PDF', image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80' }
      ]
    }
  }
};

export const SiteCmsEditor = () => {
  const { 
    pricing, 
    setPricing,
    updatePricing, 
    pricingCards,
    setPricingCards,
    updatePricingCards,
    patchCards,
    setPatchCards,
    updatePatchCards,
    portfolioSamples,
    setPortfolioSamples,
    updatePortfolioSamples,
    sewOuts,
    setSewOuts,
    updateSewOuts,
    servicesList, 
    setServicesList,
    updateServicesList,
    heroSlides = [],
    setHeroSlides,
    updateHeroSlides, 
    siteSettings, 
    setSiteSettings,
    updateSiteSettings,
    serviceCmsContent = {},
    updateServiceCmsContent,
    showToast,
    testimonials = [],
    faqs = [],
    saveCmsData
  } = useAppState();

  const [activeSection, setActiveSection] = useState('heroslider'); // 'heroslider' | 'serviceCms' | 'portfolio' | 'pricing' | 'vector' | 'settings'
  const [activeCmsTab, setActiveCmsTab] = useState('embroidery');

  // Local draft states
  const [draftPricing, setDraftPricing] = useState({ ...pricing });
  const [draftPricingCards, setDraftPricingCards] = useState([...(pricingCards || [])]);
  const [draftPatchCards, setDraftPatchCards] = useState([...(patchCards || [])]);
  const [draftPortfolio, setDraftPortfolio] = useState([...(portfolioSamples || [])]);
  const [draftSewOuts] = useState([...(sewOuts || [])]);
  const [draftServices] = useState([...(servicesList || [])]);
  const [draftHeroSlides, setDraftHeroSlides] = useState([...(heroSlides || [])]);
  const [draftSettings, setDraftSettings] = useState({ ...siteSettings });
  const [draftServiceCms, setDraftServiceCms] = useState(JSON.parse(JSON.stringify(serviceCmsContent)));
  const [draftTestimonials, setDraftTestimonials] = useState([...(testimonials || [])]);
  const [draftFaqs, setDraftFaqs] = useState([...(faqs || [])]);

  // Handle Image Upload helper
  const handleImageUpload = (e, setUrlFn) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setUrlFn(event.target.result);
        showToast('Image uploaded successfully!', 'success');
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle Pricing Inputs
  const handlePricingChange = (key, value) => {
    const num = parseFloat(value);
    setDraftPricing(prev => ({
      ...prev,
      [key]: isNaN(num) ? value : num
    }));
  };

  const handlePricingCardChange = (id, field, value) => {
    setDraftPricingCards(prev => prev.map(card => {
      if (card.id === id) {
        if (field === 'features') {
          return { ...card, features: value.split('\n').filter(f => f.trim() !== '') };
        }
        return { ...card, [field]: value };
      }
      return card;
    }));
  };

  const handlePatchCardChange = (id, field, value) => {
    setDraftPatchCards(prev => prev.map(card => {
      if (card.id === id) {
        if (field === 'features') {
          return { ...card, features: value.split('\n').filter(f => f.trim() !== '') };
        }
        return { ...card, [field]: value };
      }
      return card;
    }));
  };

  // Handle Portfolio Showcase Edits
  const handlePortfolioChange = (id, field, value) => {
    setDraftPortfolio(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const handleAddPortfolioSample = () => {
    const newId = `port-${Date.now()}`;
    const newSample = {
      id: newId,
      title: 'New Showcase Emblem',
      category: 'Left Chest & Polo',
      stitchCount: '10,000 Stitches',
      colors: '4 Thread Colors',
      originalImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
      digitizedImage: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80',
      description: 'Enter showcase item description here.'
    };
    setDraftPortfolio(prev => [...prev, newSample]);
  };

  const handleRemovePortfolioSample = (idToRemove) => {
    setDraftPortfolio(prev => prev.filter(item => item.id !== idToRemove));
  };

  const handleImageFileUpload = (id, field, file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      handlePortfolioChange(id, field, e.target.result);
      showToast(`Uploaded ${field === 'originalImage' ? 'Before Artwork' : 'After Digitized Result'} image!`, 'success');
    };
    reader.readAsDataURL(file);
  };

  // Publish changes live to context & localStorage & Supabase DB
  const handleSaveAll = (e) => {
    e.preventDefault();

    if (typeof updatePricing === 'function') updatePricing(draftPricing);
    else if (typeof setPricing === 'function') setPricing(draftPricing);

    if (typeof updatePricingCards === 'function') updatePricingCards(draftPricingCards);
    else if (typeof setPricingCards === 'function') setPricingCards(draftPricingCards);

    if (typeof updatePatchCards === 'function') updatePatchCards(draftPatchCards);
    else if (typeof setPatchCards === 'function') setPatchCards(draftPatchCards);

    if (typeof updatePortfolioSamples === 'function') updatePortfolioSamples(draftPortfolio);
    else if (typeof setPortfolioSamples === 'function') setPortfolioSamples(draftPortfolio);

    if (typeof updateSewOuts === 'function') updateSewOuts(draftSewOuts);
    else if (typeof setSewOuts === 'function') setSewOuts(draftSewOuts);

    if (typeof updateServicesList === 'function') updateServicesList(draftServices);
    else if (typeof setServicesList === 'function') setServicesList(draftServices);

    if (typeof updateHeroSlides === 'function') updateHeroSlides(draftHeroSlides);
    else if (typeof setHeroSlides === 'function') setHeroSlides(draftHeroSlides);

    if (typeof updateSiteSettings === 'function') updateSiteSettings(draftSettings);
    else if (typeof setSiteSettings === 'function') setSiteSettings(draftSettings);

    if (typeof saveCmsData === 'function') {
      saveCmsData('testimonials', draftTestimonials);
      saveCmsData('faqs', draftFaqs);
    }

    if (typeof updateServiceCmsContent === 'function' && draftServiceCms) {
      ['embroidery', 'patch', 'vector'].forEach(srvKey => {
        ['hero', 'showcase', 'advantages', 'workflow'].forEach(secKey => {
          if (draftServiceCms[srvKey]?.[secKey]) {
            updateServiceCmsContent(srvKey, secKey, draftServiceCms[srvKey][secKey]);
          }
        });
      });
    }

    if (typeof showToast === 'function') {
      showToast('All 3 Service CMS pages, pricing & showcase content published live!', 'success');
    }
  };

  return (
    <div style={{ background: '#ffffff', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
      
      {/* CMS Header Bar */}
      <div style={{
        background: 'linear-gradient(135deg, var(--navy-950), var(--navy-900))',
        color: '#ffffff',
        padding: '1.5rem 1.75rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{ background: '#ff7a00', color: '#ffffff', padding: '0.6rem', borderRadius: 'var(--radius-sm)', display: 'flex' }}>
            <Globe size={22} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
              Website Content Management & CMS Editor
            </h2>
            <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.15rem' }}>
              Live control panel for pricing rates, public landing services, and site metadata
            </div>
          </div>
        </div>

        <button 
          onClick={handleSaveAll}
          className="btn btn-primary-orange btn-md"
          style={{ gap: '0.5rem', fontWeight: 800, background: 'linear-gradient(135deg, #ff7a00 0%, #e66e00 100%)', borderColor: '#ff7a00', color: '#ffffff' }}
        >
          <Save size={18} /> Save & Publish Live Changes
        </button>
      </div>

      {/* Sub-Navigation Tabs */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid var(--border-color)',
        background: 'var(--navy-100)',
        padding: '0 1.25rem',
        overflowX: 'auto'
      }}>
        <button
          type="button"
          onClick={() => setActiveSection('mediamanager')}
          style={{
            padding: '1rem 1.25rem',
            border: 'none',
            borderBottom: activeSection === 'mediamanager' ? '3px solid #ff7a00' : '3px solid transparent',
            background: 'none',
            fontWeight: 800,
            fontSize: '0.9rem',
            color: activeSection === 'mediamanager' ? '#ff7a00' : '#64748b',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            whiteSpace: 'nowrap'
          }}
        >
          <Globe size={18} /> Media & Image Gallery
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('heroslider')}
          style={{
            padding: '1rem 1.25rem',
            border: 'none',
            borderBottom: activeSection === 'heroslider' ? '3px solid #ff7a00' : '3px solid transparent',
            background: 'none',
            fontWeight: 800,
            fontSize: '0.9rem',
            color: activeSection === 'heroslider' ? '#ff7a00' : '#64748b',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            whiteSpace: 'nowrap'
          }}
        >
          <Sparkles size={18} /> Hero Slider & Banner CMS ({draftHeroSlides.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('serviceCms')}
          style={{
            padding: '1rem 1.25rem',
            border: 'none',
            borderBottom: activeSection === 'serviceCms' ? '3px solid #ff7a00' : '3px solid transparent',
            background: 'none',
            fontWeight: 800,
            fontSize: '0.9rem',
            color: activeSection === 'serviceCms' ? '#ff7a00' : '#64748b',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            whiteSpace: 'nowrap'
          }}
        >
          <Layers size={18} /> Service Pages & Pricing CMS
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('portfolio')}
          style={{
            padding: '1rem 1.25rem',
            border: 'none',
            borderBottom: activeSection === 'portfolio' ? '3px solid #ff7a00' : '3px solid transparent',
            background: 'none',
            fontWeight: 800,
            fontSize: '0.9rem',
            color: activeSection === 'portfolio' ? '#ff7a00' : '#64748b',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <Eye size={18} /> Before/After Showcase ({draftPortfolio.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('settings')}
          style={{
            padding: '1rem 1.25rem',
            border: 'none',
            borderBottom: activeSection === 'settings' ? '3px solid #ff7a00' : '3px solid transparent',
            background: 'none',
            fontWeight: 800,
            fontSize: '0.9rem',
            color: activeSection === 'settings' ? '#ff7a00' : '#64748b',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            whiteSpace: 'nowrap'
          }}
        >
          <Settings size={18} /> Site Contact & Metadata
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('testimonials')}
          style={{
            padding: '1rem 1.25rem',
            border: 'none',
            borderBottom: activeSection === 'testimonials' ? '3px solid #ff7a00' : '3px solid transparent',
            background: 'none',
            fontWeight: 800,
            fontSize: '0.9rem',
            color: activeSection === 'testimonials' ? '#ff7a00' : '#64748b',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            whiteSpace: 'nowrap'
          }}
        >
          <Star size={18} /> Testimonials
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('faqs')}
          style={{
            padding: '1rem 1.25rem',
            border: 'none',
            borderBottom: activeSection === 'faqs' ? '3px solid #ff7a00' : '3px solid transparent',
            background: 'none',
            fontWeight: 800,
            fontSize: '0.9rem',
            color: activeSection === 'faqs' ? '#ff7a00' : '#64748b',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            whiteSpace: 'nowrap'
          }}
        >
          <HelpCircle size={18} /> FAQs
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('trustStats')}
          style={{
            padding: '1rem 1.25rem',
            border: 'none',
            borderBottom: activeSection === 'trustStats' ? '3px solid #ff7a00' : '3px solid transparent',
            background: 'none',
            fontWeight: 800,
            fontSize: '0.9rem',
            color: activeSection === 'trustStats' ? '#ff7a00' : '#64748b',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            whiteSpace: 'nowrap'
          }}
        >
          <Shield size={18} /> Trust Stats & Global
        </button>
      </div>

      {/* Editor Body */}
      <form onSubmit={handleSaveAll} style={{ padding: '2rem' }}>

        {/* SECTION: MEDIA LIBRARY & IMAGE ASSETS MANAGER */}
        {activeSection === 'mediamanager' && (
          <MediaLibraryManager />
        )}

        {/* SECTION: HERO SLIDER & ANNOUNCEMENT BANNER MANAGER */}
        {activeSection === 'heroslider' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--navy-900)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Globe size={20} style={{ color: '#ff7a00' }} /> Homepage Hero Slider & Banner Announcement Manager
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.25rem 0 0 0' }}>
                  Create and edit hero slides, banner titles, call-to-action buttons, and trust badges dynamically.
                </p>
              </div>

              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => {
                  const newSlide = {
                    id: `slide-${Date.now()}`,
                    serviceKey: 'embroidery',
                    title: 'New Digitizing Studio Highlight',
                    highlight: '100% Guaranteed',
                    description: 'Custom digitizing & vector artwork description.',
                    rateLabel: 'Starting from $10.00',
                    primaryCta: 'Order Now'
                  };
                  setDraftHeroSlides(prev => [...prev, newSlide]);
                  showToast('Added new Hero Slide to draft!', 'info');
                }}
                style={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <Plus size={16} /> Add Hero Slide
              </button>
            </div>

            {/* Announcement Banner Notice */}
            <div className="card" style={{ padding: '1.25rem', marginBottom: '1.5rem', background: '#fff7ed', border: '1px solid var(--orange-200)', borderRadius: '12px' }}>
              <label style={{ fontSize: '0.825rem', fontWeight: 800, color: 'var(--orange-800)', display: 'block', marginBottom: '0.35rem' }}>
                📢 Top Announcement Bar Notice (Header Banner)
              </label>
              <input
                type="text"
                className="form-control"
                style={{ fontWeight: 700, color: 'var(--navy-900)' }}
                value={draftSettings.bannerNotice || ''}
                onChange={(e) => setDraftSettings(prev => ({ ...prev, bannerNotice: e.target.value }))}
                placeholder="🔥 24/7 EXPRESS DIGITIZING DELIVERED IN 4 HOURS • WILCOM MASTER EMB & DST MACHINE FILES"
              />
            </div>

            {/* Hero Slides List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {draftHeroSlides.map((slide, sIdx) => {
                const updateSlide = (field, val) => {
                  setDraftHeroSlides(prev => prev.map((item, idx) => idx === sIdx ? { ...item, [field]: val } : item));
                };

                return (
                  <div key={slide.id || sIdx} className="card" style={{ padding: '1.5rem', border: '1.5px solid var(--border-color)', background: '#ffffff', borderRadius: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                      <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--navy-900)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Sparkles size={16} style={{ color: '#ff7a00' }} /> Slide #{sIdx + 1}: {slide.title}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setDraftHeroSlides(prev => prev.filter((_, idx) => idx !== sIdx));
                          showToast('Slide removed from draft', 'info');
                        }}
                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                      >
                        <Trash2 size={15} /> Remove Slide
                      </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label style={{ fontSize: '0.78rem', fontWeight: 700 }}>Headline Title</label>
                        <input
                          type="text"
                          className="form-control"
                          style={{ fontWeight: 700 }}
                          value={slide.title || ''}
                          onChange={(e) => updateSlide('title', e.target.value)}
                        />
                      </div>

                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label style={{ fontSize: '0.78rem', fontWeight: 700 }}>Highlight Phrase</label>
                        <input
                          type="text"
                          className="form-control"
                          style={{ fontWeight: 700, color: '#ff7a00' }}
                          value={slide.highlight || ''}
                          onChange={(e) => updateSlide('highlight', e.target.value)}
                        />
                      </div>

                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label style={{ fontSize: '0.78rem', fontWeight: 700 }}>Rate Label</label>
                        <input
                          type="text"
                          className="form-control"
                          value={slide.rateLabel || ''}
                          onChange={(e) => updateSlide('rateLabel', e.target.value)}
                        />
                      </div>
                      
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label style={{ fontSize: '0.78rem', fontWeight: 700 }}>CTA Button Text</label>
                        <input
                          type="text"
                          className="form-control"
                          value={slide.primaryCta || ''}
                          onChange={(e) => updateSlide('primaryCta', e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label style={{ fontSize: '0.78rem', fontWeight: 700 }}>Description</label>
                      <textarea
                        className="form-control"
                        rows={2}
                        value={slide.description || ''}
                        onChange={(e) => updateSlide('description', e.target.value)}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* SECTION: 3-SERVICE HOMEPAGE CMS FLOW MANAGER */}
        {activeSection === 'serviceCms' && (
          <div>
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--navy-900)', marginBottom: '0.25rem' }}>
                🎨 Dynamic 3-Service Homepage CMS Manager
              </h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                Select a service below to customize its Section 1 (Hero & Overview), Section 2 (Showcase & Samples), and Section 3 (Technical Advantages) live on the homepage.
              </p>

              {/* Service Selection Tabs inside CMS Panel */}
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                {[
                  { id: 'embroidery', label: 'Embroidery Digitizing CMS' },
                  { id: 'patch', label: 'Custom Patches & Goods CMS' },
                  { id: 'vector', label: 'Vector Art Conversion CMS' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveCmsTab(tab.id)}
                    style={{
                      padding: '0.55rem 1.15rem',
                      borderRadius: '8px',
                      border: '1.5px solid',
                      borderColor: activeCmsTab === tab.id ? '#ff7a00' : 'var(--border-color)',
                      background: activeCmsTab === tab.id ? 'var(--orange-50)' : '#ffffff',
                      color: activeCmsTab === tab.id ? '#ff7a00' : 'var(--navy-900)',
                      fontWeight: 800,
                      fontSize: '0.85rem',
                      cursor: 'pointer'
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Active Service CMS Form Fields */}
            {['embroidery', 'patch', 'vector'].map(srvKey => {
              if (activeCmsTab !== srvKey) return null;
              const srvData = draftServiceCms[srvKey] || {};
              const hero = srvData.hero || {};
              const showcase = srvData.showcase || {};

              const updateHeroField = (field, val) => {
                setDraftServiceCms(prev => ({
                  ...prev,
                  [srvKey]: {
                    ...prev[srvKey],
                    hero: { ...prev[srvKey]?.hero, [field]: val }
                  }
                }));
              };

              const updateShowcaseField = (field, val) => {
                setDraftServiceCms(prev => ({
                  ...prev,
                  [srvKey]: {
                    ...prev[srvKey],
                    showcase: { ...prev[srvKey]?.showcase, [field]: val }
                  }
                }));
              };

              return (
                <div key={srvKey} style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
                  
                  {/* Block 1: Section 1 (Hero & Overview) */}
                  <div className="card" style={{ padding: '1.5rem', border: '1.5px solid var(--border-color)', background: '#ffffff' }}>
                    <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--navy-900)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Layers size={18} style={{ color: '#ff7a00' }} /> Section 1: Hero & Overview Content ({srvKey.toUpperCase()})
                    </h4>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.15rem' }}>
                      <div className="form-group">
                        <label style={{ fontSize: '0.8rem', fontWeight: 700 }}>Headline Title</label>
                        <input
                          type="text"
                          className="form-control"
                          value={hero.title || ''}
                          onChange={(e) => updateHeroField('title', e.target.value)}
                        />
                      </div>

                      <div className="form-group">
                        <label style={{ fontSize: '0.8rem', fontWeight: 700 }}>Highlight Tagline</label>
                        <input
                          type="text"
                          className="form-control"
                          value={hero.highlight || ''}
                          onChange={(e) => updateHeroField('highlight', e.target.value)}
                        />
                      </div>

                      <div className="form-group">
                        <label style={{ fontSize: '0.8rem', fontWeight: 700 }}>Rate Badge String</label>
                        <input
                          type="text"
                          className="form-control"
                          value={hero.badge || ''}
                          onChange={(e) => updateHeroField('badge', e.target.value)}
                        />
                      </div>

                      <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: 700 }}>Overview Subtext / Description</label>
                        <textarea
                          className="form-control"
                          rows={2}
                          value={hero.subtext || ''}
                          onChange={(e) => updateHeroField('subtext', e.target.value)}
                        />
                      </div>

                      <div className="form-group">
                        <label style={{ fontSize: '0.8rem', fontWeight: 700 }}>Primary CTA Label</label>
                        <input
                          type="text"
                          className="form-control"
                          value={hero.primaryCta || ''}
                          onChange={(e) => updateHeroField('primaryCta', e.target.value)}
                        />
                      </div>

                      <div className="form-group">
                        <label style={{ fontSize: '0.8rem', fontWeight: 700 }}>Secondary CTA Label</label>
                        <input
                          type="text"
                          className="form-control"
                          value={hero.secondaryCta || ''}
                          onChange={(e) => updateHeroField('secondaryCta', e.target.value)}
                        />
                      </div>

                      {/* Hero Banner Image URL with Upload Button */}
                      <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: 700 }}>Hero Banner Showcase Image URL</label>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <input
                            type="text"
                            className="form-control"
                            value={hero.bannerImage || ''}
                            onChange={(e) => updateHeroField('bannerImage', e.target.value)}
                            placeholder="https://images.unsplash.com/... or upload local image"
                          />
                          <label className="btn btn-outline btn-sm" style={{ cursor: 'pointer', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center' }}>
                            Upload Image
                            <input
                              type="file"
                              accept="image/*"
                              style={{ display: 'none' }}
                              onChange={(e) => handleImageUpload(e, (url) => updateHeroField('bannerImage', url))}
                            />
                          </label>
                        </div>
                      </div>

                      {/* Editable Trust Points / Feature Badges (4 Badges) */}
                      <div style={{ gridColumn: '1 / -1', marginTop: '0.5rem' }}>
                        <label style={{ fontSize: '0.825rem', fontWeight: 800, color: 'var(--navy-900)', display: 'block', marginBottom: '0.5rem' }}>
                          ⭐ Feature Badges & Trust Points (4 Key Highlights)
                        </label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
                          {[0, 1, 2, 3].map(tpIdx => {
                            const tpList = hero.trustPoints || [];
                            const tp = tpList[tpIdx] || {};

                            const updateTp = (field, val) => {
                              const nextTps = [...tpList];
                              nextTps[tpIdx] = { ...nextTps[tpIdx], [field]: val };
                              updateHeroField('trustPoints', nextTps);
                            };

                            return (
                              <div key={tpIdx} style={{ background: '#f8fafc', border: '1px solid var(--border-color)', padding: '0.85rem', borderRadius: '8px' }}>
                                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#ff7a00', marginBottom: '0.35rem' }}>
                                  BADGE 0{tpIdx + 1}
                                </div>
                                <div className="form-group" style={{ marginBottom: '0.4rem' }}>
                                  <label style={{ fontSize: '0.72rem' }}>Badge Title</label>
                                  <input
                                    type="text"
                                    className="form-control"
                                    style={{ fontSize: '0.825rem' }}
                                    value={tp.title || ''}
                                    onChange={(e) => updateTp('title', e.target.value)}
                                  />
                                </div>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                  <label style={{ fontSize: '0.72rem' }}>Subtext / Detail</label>
                                  <input
                                    type="text"
                                    className="form-control"
                                    style={{ fontSize: '0.825rem' }}
                                    value={tp.sub || ''}
                                    onChange={(e) => updateTp('sub', e.target.value)}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Block 2: Section 2 (Work Showcase Header) */}
                  <div className="card" style={{ padding: '1.5rem', border: '1.5px solid var(--border-color)', background: '#ffffff' }}>
                    <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--navy-900)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Eye size={18} style={{ color: '#ff7a00' }} /> Section 2: Work Showcase Header ({srvKey.toUpperCase()})
                    </h4>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.15rem' }}>
                      <div className="form-group">
                        <label style={{ fontSize: '0.8rem', fontWeight: 700 }}>Showcase Title</label>
                        <input
                          type="text"
                          className="form-control"
                          value={showcase.title || ''}
                          onChange={(e) => updateShowcaseField('title', e.target.value)}
                        />
                      </div>

                      <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: 700 }}>Showcase Description Subtext</label>
                        <textarea
                          className="form-control"
                          rows={2}
                          value={showcase.subtext || ''}
                          onChange={(e) => updateShowcaseField('subtext', e.target.value)}
                        />
                      </div>

                      {/* Editable Showcase Sample Cards (3 Items) */}
                      <div style={{ gridColumn: '1 / -1', marginTop: '0.5rem' }}>
                        <label style={{ fontSize: '0.825rem', fontWeight: 800, color: 'var(--navy-900)', display: 'block', marginBottom: '0.5rem' }}>
                          🖼️ Work Showcase Sample Showcase Items
                        </label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.85rem' }}>
                          {[0, 1, 2].map(sampleIdx => {
                            const defaultList = serviceCmsContent[srvKey]?.showcase?.samples || FALLBACK_SERVICE_CMS_CONTENT[srvKey]?.showcase?.samples || [];
                            const samplesList = (showcase.samples && showcase.samples.length > 0) ? showcase.samples : defaultList;
                            const smp = samplesList[sampleIdx] || {};
                            const currentImgVal = smp.image || smp.imageURL || smp.afterImg || '';

                            const updateSample = (field, val) => {
                              const nextSamples = [...samplesList];
                              const currentSmp = nextSamples[sampleIdx] || { id: `${srvKey}-s${sampleIdx + 1}` };
                              const updatedSmp = { 
                                ...currentSmp, 
                                [field]: val,
                                ...(field === 'image' ? { image: val, imageURL: val, afterImg: val } : {})
                              };
                              nextSamples[sampleIdx] = updatedSmp;
                              updateShowcaseField('samples', nextSamples);
                            };

                            return (
                              <div key={sampleIdx} style={{ background: '#f8fafc', border: '1px solid var(--border-color)', padding: '0.85rem', borderRadius: '8px' }}>
                                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#ff7a00', marginBottom: '0.35rem' }}>
                                  SAMPLE ITEM #{sampleIdx + 1}
                                </div>

                                <div className="form-group" style={{ marginBottom: '0.4rem' }}>
                                  <label style={{ fontSize: '0.72rem' }}>Sample Title</label>
                                  <input
                                    type="text"
                                    className="form-control"
                                    style={{ fontSize: '0.825rem' }}
                                    value={smp.title || ''}
                                    onChange={(e) => updateSample('title', e.target.value)}
                                  />
                                </div>

                                <div className="form-group" style={{ marginBottom: '0.4rem' }}>
                                  <label style={{ fontSize: '0.72rem' }}>Category Tag</label>
                                  <input
                                    type="text"
                                    className="form-control"
                                    style={{ fontSize: '0.825rem' }}
                                    value={smp.category || ''}
                                    onChange={(e) => updateSample('category', e.target.value)}
                                  />
                                </div>

                                <div className="form-group" style={{ marginBottom: 0 }}>
                                  <label style={{ fontSize: '0.72rem' }}>Image URL</label>
                                  <div style={{ display: 'flex', gap: '0.35rem' }}>
                                    <input
                                      type="text"
                                      className="form-control"
                                      style={{ fontSize: '0.78rem' }}
                                      value={currentImgVal}
                                      onChange={(e) => updateSample('image', e.target.value)}
                                      placeholder="https://... or upload local image"
                                    />
                                    <label className="btn btn-outline btn-sm" style={{ cursor: 'pointer', fontSize: '0.7rem', padding: '0.2rem 0.5rem', whiteSpace: 'nowrap' }}>
                                      Upload
                                      <input
                                        type="file"
                                        accept="image/*"
                                        style={{ display: 'none' }}
                                        onChange={(e) => handleImageUpload(e, (url) => updateSample('image', url))}
                                      />
                                    </label>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Block 3: Section 3 (4-Step How It Works Workflow) */}
                  <div className="card" style={{ padding: '1.5rem', border: '1.5px solid var(--border-color)', background: '#ffffff' }}>
                    <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--navy-900)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Zap size={18} style={{ color: '#ff7a00' }} /> Section 3: 4-Step "How It Works" Workflow ({srvKey.toUpperCase()})
                    </h4>

                    {(() => {
                      const workflow = srvData.workflow || srvData.advantages || {};
                      const steps = workflow.steps || [];

                      const updateWorkflowMain = (field, val) => {
                        setDraftServiceCms(prev => ({
                          ...prev,
                          [srvKey]: {
                            ...prev[srvKey],
                            workflow: { ...prev[srvKey]?.workflow, [field]: val }
                          }
                        }));
                      };

                      const updateWorkflowStep = (idx, field, val) => {
                        setDraftServiceCms(prev => {
                          const currentWf = prev[srvKey]?.workflow || prev[srvKey]?.advantages || {};
                          const currentSteps = [...(currentWf.steps || [])];
                          currentSteps[idx] = { ...currentSteps[idx], [field]: val };
                          return {
                            ...prev,
                            [srvKey]: {
                              ...prev[srvKey],
                              workflow: { ...currentWf, steps: currentSteps }
                            }
                          };
                        });
                      };

                      return (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.15rem' }}>
                          <div className="form-group">
                            <label style={{ fontSize: '0.8rem', fontWeight: 700 }}>Workflow Title</label>
                            <input
                              type="text"
                              className="form-control"
                              value={workflow.title || ''}
                              onChange={(e) => updateWorkflowMain('title', e.target.value)}
                            />
                          </div>

                          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                            <label style={{ fontSize: '0.8rem', fontWeight: 700 }}>Workflow Subtext</label>
                            <textarea
                              className="form-control"
                              rows={2}
                              value={workflow.subtext || ''}
                              onChange={(e) => updateWorkflowMain('subtext', e.target.value)}
                            />
                          </div>

                          {/* Editable Step 01 to Step 04 Fields */}
                          <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
                            {[0, 1, 2, 3].map(stepIdx => {
                              const st = steps[stepIdx] || {};
                              return (
                                <div key={stepIdx} style={{ background: '#f8fafc', border: '1px solid var(--border-color)', padding: '1rem', borderRadius: '8px' }}>
                                  <div style={{ fontWeight: 800, fontSize: '0.825rem', color: '#ff7a00', marginBottom: '0.5rem' }}>
                                    STEP 0{stepIdx + 1} CONFIGURATION
                                  </div>
                                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                      <label style={{ fontSize: '0.75rem', fontWeight: 700 }}>Step Title</label>
                                      <input
                                        type="text"
                                        className="form-control"
                                        style={{ fontSize: '0.85rem' }}
                                        value={st.title || ''}
                                        onChange={(e) => updateWorkflowStep(stepIdx, 'title', e.target.value)}
                                      />
                                    </div>
                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                      <label style={{ fontSize: '0.75rem', fontWeight: 700 }}>Step Description</label>
                                      <input
                                        type="text"
                                        className="form-control"
                                        style={{ fontSize: '0.85rem' }}
                                        value={st.desc || ''}
                                        onChange={(e) => updateWorkflowStep(stepIdx, 'desc', e.target.value)}
                                      />
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                </div>
              );
            })}
          </div>
        )}

        {/* SECTION: LANDING PAGE PRICING CARDS & PATCH TIERS */}
        {activeSection === 'pricing' && (
          <div>
            <div>
              <div style={{ marginBottom: '1.25rem' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--navy-900)', marginBottom: '0.25rem' }}>
                  Public Landing Page Pricing Cards
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Edit the titles, starting price strings, badge tags, and bullet points displayed directly on the home page pricing cards.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {draftPricingCards.map((card, idx) => (
                  <div 
                    key={card.id || idx}
                    className="card"
                    style={{ padding: '1.25rem', border: '1px solid var(--border-color)', background: '#f8fafc' }}
                  >
                    <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--navy-900)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Tag size={16} style={{ color: 'var(--orange-500)' }} /> Pricing Card #{idx + 1}: {card.title}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label style={{ fontSize: '0.78rem' }}>Card Title</label>
                        <input 
                          type="text" 
                          className="form-control"
                          style={{ fontWeight: 700 }}
                          value={card.title || ''}
                          onChange={(e) => handlePricingCardChange(card.id, 'title', e.target.value)}
                        />
                      </div>

                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label style={{ fontSize: '0.78rem' }}>Price Display String</label>
                        <input 
                          type="text" 
                          className="form-control"
                          style={{ fontWeight: 700, color: 'var(--orange-600)' }}
                          value={card.rate || ''}
                          onChange={(e) => handlePricingCardChange(card.id, 'rate', e.target.value)}
                        />
                      </div>

                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label style={{ fontSize: '0.78rem' }}>Price Subtitle / Unit</label>
                        <input 
                          type="text" 
                          className="form-control"
                          value={card.unit || ''}
                          onChange={(e) => handlePricingCardChange(card.id, 'unit', e.target.value)}
                        />
                      </div>

                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label style={{ fontSize: '0.78rem' }}>Badge Tag Label</label>
                        <input 
                          type="text" 
                          className="form-control"
                          value={card.badge || ''}
                          onChange={(e) => handlePricingCardChange(card.id, 'badge', e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label style={{ fontSize: '0.78rem' }}>Feature Bullet Points (One per line)</label>
                      <textarea 
                        rows={3}
                        className="form-control"
                        value={Array.isArray(card.features) ? card.features.join('\n') : (card.features || '')}
                        onChange={(e) => handlePricingCardChange(card.id, 'features', e.target.value)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Custom Patches Tiers Editor Section */}
            <div style={{ marginTop: '2.5rem', paddingTop: '2rem', borderTop: '1px solid var(--border-color)' }}>
              <div style={{ marginBottom: '1.25rem' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--navy-900)', marginBottom: '0.25rem' }}>
                  Custom Patches Pricing Tiers (Basic, Standard, Premium)
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Edit the titles, starting prices, backing options, and feature bullet points for the 3 Custom Patches cards.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {draftPatchCards.map((card, idx) => (
                  <div 
                    key={card.id || idx}
                    className="card"
                    style={{ padding: '1.25rem', border: '1px solid var(--border-color)', background: '#f8fafc' }}
                  >
                    <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--navy-900)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Tag size={16} style={{ color: 'var(--orange-500)' }} /> Custom Patch Tier #{idx + 1}: {card.title}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label style={{ fontSize: '0.78rem' }}>Patch Plan Title</label>
                        <input 
                          type="text" 
                          className="form-control"
                          style={{ fontWeight: 700 }}
                          value={card.title || ''}
                          onChange={(e) => handlePatchCardChange(card.id, 'title', e.target.value)}
                        />
                      </div>

                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label style={{ fontSize: '0.78rem' }}>Price Tag (e.g. $1.50 / patch)</label>
                        <input 
                          type="text" 
                          className="form-control"
                          style={{ fontWeight: 700, color: 'var(--orange-600)' }}
                          value={card.rate || ''}
                          onChange={(e) => handlePatchCardChange(card.id, 'rate', e.target.value)}
                        />
                      </div>

                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label style={{ fontSize: '0.78rem' }}>Subtitle / Specification</label>
                        <input 
                          type="text" 
                          className="form-control"
                          value={card.unit || ''}
                          onChange={(e) => handlePatchCardChange(card.id, 'unit', e.target.value)}
                        />
                      </div>

                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label style={{ fontSize: '0.78rem' }}>Badge Label (e.g. ESSENTIAL)</label>
                        <input 
                          type="text" 
                          className="form-control"
                          value={card.badge || ''}
                          onChange={(e) => handlePatchCardChange(card.id, 'badge', e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label style={{ fontSize: '0.78rem' }}>Feature Bullet Points (One per line)</label>
                      <textarea 
                        rows={3}
                        className="form-control"
                        value={Array.isArray(card.features) ? card.features.join('\n') : (card.features || '')}
                        onChange={(e) => handlePatchCardChange(card.id, 'features', e.target.value)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SECTION: VECTOR ART SERVICE MODULE CMS */}
        {activeSection === 'vector' && (
          <div>
            <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--navy-900)', margin: '0 0 0.25rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Zap size={20} style={{ color: 'var(--orange-500)' }} /> Vector Art Service & Pricing Configuration
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                  Manage Vector Art service header text, rates, turnaround options, and supported file formats directly for the live studio page (/vector-art).
                </p>
              </div>

              <div style={{ background: '#fff7ed', border: '1px solid var(--orange-200)', color: 'var(--orange-700)', padding: '0.4rem 0.85rem', borderRadius: '9999px', fontSize: '0.8rem', fontWeight: 700 }}>
                Live Service Route: /vector-art
              </div>
            </div>

            {/* Vector Pricing Rates Grid */}
            <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem', background: '#f8fafc', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
              <h4 style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--navy-900)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <DollarSign size={16} style={{ color: 'var(--orange-500)' }} /> Vector Conversion Pricing Tiers ($)
              </h4>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '0.825rem', fontWeight: 700 }}>Simple / Standard Redraw Rate ($)</label>
                  <input
                    type="number"
                    step="1.00"
                    className="form-control"
                    style={{ fontWeight: 800, color: 'var(--navy-900)' }}
                    value={draftPricing.vectorSimpleRate ?? 15.00}
                    onChange={(e) => handlePricingChange('vectorSimpleRate', e.target.value)}
                  />
                  <small style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Base fee for clean logos, text, 1-3 solid colors</small>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '0.825rem', fontWeight: 700 }}>Complex / Detailed Redraw Rate ($)</label>
                  <input
                    type="number"
                    step="1.00"
                    className="form-control"
                    style={{ fontWeight: 800, color: 'var(--navy-900)' }}
                    value={draftPricing.vectorComplexRate ?? 25.00}
                    onChange={(e) => handlePricingChange('vectorComplexRate', e.target.value)}
                  />
                  <small style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Mascots, gradients, multi-color illustrations</small>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '0.825rem', fontWeight: 700 }}>Express Super Rush Surcharge ($)</label>
                  <input
                    type="number"
                    step="1.00"
                    className="form-control"
                    style={{ fontWeight: 800, color: 'var(--navy-900)' }}
                    value={draftPricing.rushSurcharge ?? 10.00}
                    onChange={(e) => handlePricingChange('rushSurcharge', e.target.value)}
                  />
                  <small style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Added for 2-4 hour express delivery</small>
                </div>
              </div>
            </div>

            {/* Vector Service Content & Metadata */}
            <div className="card" style={{ padding: '1.5rem', background: '#ffffff', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
              <h4 style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--navy-900)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Globe size={16} style={{ color: 'var(--orange-500)' }} /> Vector Studio Content & Metadata
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '0.825rem', fontWeight: 700 }}>Service Page Heading Title</label>
                  <input
                    type="text"
                    className="form-control"
                    style={{ fontWeight: 700 }}
                    value={draftPricing.vectorPageTitle || 'Custom Vector Art Conversion & Redraws'}
                    onChange={(e) => setDraftPricing(prev => ({ ...prev, vectorPageTitle: e.target.value }))}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '0.825rem', fontWeight: 700 }}>Service Description & Value Statement</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    style={{ fontSize: '0.85rem', lineHeight: 1.5 }}
                    value={draftPricing.vectorPageDesc || 'Transform low-resolution JPEGs, PNGs, hand-drawn sketches, or pixelated logos into 100% hand-drawn, razor-sharp scalable vector graphics (.AI, .EPS, .SVG, .PDF, .CDR).'}
                    onChange={(e) => setDraftPricing(prev => ({ ...prev, vectorPageDesc: e.target.value }))}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: '0.825rem', fontWeight: 700 }}>Standard Turnaround Guarantee</label>
                    <input
                      type="text"
                      className="form-control"
                      value={draftPricing.vectorStandardTurnaround || '8–12 Hours Standard Delivery'}
                      onChange={(e) => setDraftPricing(prev => ({ ...prev, vectorStandardTurnaround: e.target.value }))}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: '0.825rem', fontWeight: 700 }}>Supported Vector Formats List</label>
                    <input
                      type="text"
                      className="form-control"
                      value={draftPricing.vectorFormatsList || 'AI, EPS, SVG, PDF, CDR'}
                      onChange={(e) => setDraftPricing(prev => ({ ...prev, vectorFormatsList: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECTION: BEFORE / AFTER PORTFOLIO SHOWCASE */}
        {activeSection === 'portfolio' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--navy-900)', marginBottom: '0.25rem' }}>
                  Interactive Before & After Showcase Visualizer
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Manage the interactive comparison slider items displayed on the public landing page. Add original artwork vs digitized result images.
                </p>
              </div>

              <button 
                type="button" 
                className="btn btn-outline btn-sm"
                onClick={handleAddPortfolioSample}
                style={{ gap: '0.4rem', fontWeight: 700 }}
              >
                <Plus size={16} /> Add Showcase Item
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {draftPortfolio.map((item, idx) => (
                <div 
                  key={item.id || idx}
                  className="card"
                  style={{ padding: '1.5rem', border: '1px solid var(--border-color)', background: '#f8fafc' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--navy-900)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Eye size={16} style={{ color: 'var(--orange-500)' }} /> Showcase Item #{idx + 1}: {item.title}
                    </span>

                    <button 
                      type="button"
                      onClick={() => handleRemovePortfolioSample(item.id)}
                      style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                    >
                      <Trash2 size={15} /> Remove Item
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label style={{ fontSize: '0.78rem' }}>Showcase Title</label>
                      <input 
                        type="text" 
                        className="form-control"
                        style={{ fontWeight: 700 }}
                        value={item.title || ''}
                        onChange={(e) => handlePortfolioChange(item.id, 'title', e.target.value)}
                      />
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label style={{ fontSize: '0.78rem' }}>Category Tag Badge</label>
                      <input 
                        type="text" 
                        className="form-control"
                        style={{ fontWeight: 700, color: 'var(--orange-600)' }}
                        value={item.category || ''}
                        onChange={(e) => handlePortfolioChange(item.id, 'category', e.target.value)}
                      />
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label style={{ fontSize: '0.78rem' }}>Stitch Count Badge</label>
                      <input 
                        type="text" 
                        className="form-control"
                        value={item.stitchCount || ''}
                        onChange={(e) => handlePortfolioChange(item.id, 'stitchCount', e.target.value)}
                      />
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label style={{ fontSize: '0.78rem' }}>Color Setup Badge</label>
                      <input 
                        type="text" 
                        className="form-control"
                        value={item.colors || ''}
                        onChange={(e) => handlePortfolioChange(item.id, 'colors', e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Image Pickers / Links for Before & After */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1rem' }}>
                    
                    {/* Before Image */}
                    <div style={{ background: '#ffffff', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
                      <label style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--navy-900)', display: 'block', marginBottom: '0.5rem' }}>
                        BEFORE: Original Customer Artwork Image
                      </label>
                      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <input 
                          type="text"
                          className="form-control"
                          placeholder="Image URL or upload file..."
                          value={item.originalImage || ''}
                          onChange={(e) => handlePortfolioChange(item.id, 'originalImage', e.target.value)}
                        />
                        <label className="btn btn-outline btn-sm" style={{ cursor: 'pointer', whiteSpace: 'nowrap', margin: 0 }}>
                          Upload File
                          <input 
                            type="file" 
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={(e) => handleImageFileUpload(item.id, 'originalImage', e.target.files[0])}
                          />
                        </label>
                      </div>
                      {item.originalImage && (
                        <div style={{ height: '120px', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                          <img src={item.originalImage} alt="Before preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                      )}
                    </div>

                    {/* After Image */}
                    <div style={{ background: '#ffffff', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
                      <label style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--green-700)', display: 'block', marginBottom: '0.5rem' }}>
                        AFTER: Digitized Stitch Result Image
                      </label>
                      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <input 
                          type="text"
                          className="form-control"
                          placeholder="Image URL or upload file..."
                          value={item.digitizedImage || ''}
                          onChange={(e) => handlePortfolioChange(item.id, 'digitizedImage', e.target.value)}
                        />
                        <label className="btn btn-outline btn-sm" style={{ cursor: 'pointer', whiteSpace: 'nowrap', margin: 0 }}>
                          Upload File
                          <input 
                            type="file" 
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={(e) => handleImageFileUpload(item.id, 'digitizedImage', e.target.files[0])}
                          />
                        </label>
                      </div>
                      {item.digitizedImage && (
                        <div style={{ height: '120px', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                          <img src={item.digitizedImage} alt="After preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                      )}
                    </div>

                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontSize: '0.78rem' }}>Detailed Showcase Description</label>
                    <textarea 
                      rows={2}
                      className="form-control"
                      value={item.description || ''}
                      onChange={(e) => handlePortfolioChange(item.id, 'description', e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECTION 3: SITE CONTACT & METADATA */}
        {activeSection === 'settings' && (
          <div>
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--navy-900)', marginBottom: '0.25rem' }}>
                Site-Wide Contact & Operational Metadata
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Configure global studio contact info, announcement headers, and system status displayed across header, footer, and emails.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
              
              <div className="form-group">
                <label>Studio Brand / Site Title</label>
                <input 
                  type="text" 
                  className="form-control"
                  style={{ fontWeight: 700 }}
                  value={draftSettings.siteTitle || ''}
                  onChange={(e) => setDraftSettings(prev => ({ ...prev, siteTitle: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label>Support Email Address</label>
                <input 
                  type="email" 
                  className="form-control"
                  value={draftSettings.supportEmail || ''}
                  onChange={(e) => setDraftSettings(prev => ({ ...prev, supportEmail: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label>Contact Phone Number</label>
                <input 
                  type="text" 
                  className="form-control"
                  value={draftSettings.contactPhone || ''}
                  onChange={(e) => setDraftSettings(prev => ({ ...prev, contactPhone: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label>Studio Operational Status</label>
                <input 
                  type="text" 
                  className="form-control"
                  style={{ fontWeight: 700, color: 'var(--green-700)' }}
                  value={draftSettings.operationalStatus || ''}
                  onChange={(e) => setDraftSettings(prev => ({ ...prev, operationalStatus: e.target.value }))}
                />
              </div>

              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label>Top Announcement Banner Notice</label>
                <input 
                  type="text" 
                  className="form-control"
                  value={draftSettings.bannerNotice || ''}
                  onChange={(e) => setDraftSettings(prev => ({ ...prev, bannerNotice: e.target.value }))}
                />
              </div>

            </div>
          </div>
        )}

        {/* SECTION: TESTIMONIALS */}
        {activeSection === 'testimonials' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--navy-900)', marginBottom: '0.25rem' }}>
                  Client Testimonials & Reviews
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Manage the customer reviews shown in the testimonials slider.
                </p>
              </div>
              <button 
                type="button" 
                className="btn btn-outline btn-sm"
                onClick={() => {
                  setDraftTestimonials(prev => [...prev, { id: `test-${Date.now()}`, name: 'New Client', role: 'Owner', company: 'Company LLC', rating: 5, comment: 'Great service!', service_category: 'embroidery' }]);
                }}
                style={{ gap: '0.4rem', fontWeight: 700 }}
              >
                <Plus size={16} /> Add Testimonial
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {draftTestimonials.map((item, idx) => {
                const updateTestimonial = (field, val) => {
                  setDraftTestimonials(prev => prev.map((t, i) => i === idx ? { ...t, [field]: val } : t));
                };
                return (
                  <div key={item.id || idx} className="card" style={{ padding: '1.5rem', border: '1px solid var(--border-color)', background: '#f8fafc' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--navy-900)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Star size={16} style={{ color: 'var(--orange-500)' }} /> Testimonial #{idx + 1}
                      </span>
                      <button 
                        type="button"
                        onClick={() => setDraftTestimonials(prev => prev.filter((_, i) => i !== idx))}
                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                      >
                        <Trash2 size={15} /> Remove
                      </button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label style={{ fontSize: '0.78rem' }}>Client Name</label>
                        <input type="text" className="form-control" style={{ fontWeight: 700 }} value={item.name || ''} onChange={(e) => updateTestimonial('name', e.target.value)} />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label style={{ fontSize: '0.78rem' }}>Role</label>
                        <input type="text" className="form-control" value={item.role || ''} onChange={(e) => updateTestimonial('role', e.target.value)} />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label style={{ fontSize: '0.78rem' }}>Company</label>
                        <input type="text" className="form-control" value={item.company || ''} onChange={(e) => updateTestimonial('company', e.target.value)} />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label style={{ fontSize: '0.78rem' }}>Rating (1-5)</label>
                        <input type="number" min="1" max="5" className="form-control" value={item.rating || 5} onChange={(e) => updateTestimonial('rating', parseInt(e.target.value))} />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label style={{ fontSize: '0.78rem' }}>Service Category</label>
                        <select className="form-control" value={item.service_category || 'embroidery'} onChange={(e) => updateTestimonial('service_category', e.target.value)}>
                          <option value="embroidery">Embroidery</option>
                          <option value="patch">Patches</option>
                          <option value="vector">Vector Art</option>
                        </select>
                      </div>
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label style={{ fontSize: '0.78rem' }}>Comment</label>
                      <textarea rows={2} className="form-control" value={item.comment || ''} onChange={(e) => updateTestimonial('comment', e.target.value)} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* SECTION: FAQS */}
        {activeSection === 'faqs' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--navy-900)', marginBottom: '0.25rem' }}>
                  Frequently Asked Questions (FAQs)
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Manage the FAQs grouped by category.
                </p>
              </div>
              <button 
                type="button" 
                className="btn btn-outline btn-sm"
                onClick={() => {
                  setDraftFaqs(prev => [...prev, { id: `faq-${Date.now()}`, question: 'New Question?', answer: 'Answer goes here.', category: 'General' }]);
                }}
                style={{ gap: '0.4rem', fontWeight: 700 }}
              >
                <Plus size={16} /> Add FAQ
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {draftFaqs.map((item, idx) => {
                const updateFaq = (field, val) => {
                  setDraftFaqs(prev => prev.map((f, i) => i === idx ? { ...f, [field]: val } : f));
                };
                return (
                  <div key={item.id || idx} className="card" style={{ padding: '1.5rem', border: '1px solid var(--border-color)', background: '#f8fafc' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--navy-900)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <HelpCircle size={16} style={{ color: 'var(--orange-500)' }} /> FAQ #{idx + 1}
                      </span>
                      <button 
                        type="button"
                        onClick={() => setDraftFaqs(prev => prev.filter((_, i) => i !== idx))}
                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                      >
                        <Trash2 size={15} /> Remove
                      </button>
                    </div>
                    <div className="form-group" style={{ marginBottom: '1rem' }}>
                      <label style={{ fontSize: '0.78rem' }}>Category</label>
                      <input type="text" className="form-control" value={item.category || ''} onChange={(e) => updateFaq('category', e.target.value)} />
                    </div>
                    <div className="form-group" style={{ marginBottom: '1rem' }}>
                      <label style={{ fontSize: '0.78rem' }}>Question</label>
                      <input type="text" className="form-control" style={{ fontWeight: 700 }} value={item.question || ''} onChange={(e) => updateFaq('question', e.target.value)} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label style={{ fontSize: '0.78rem' }}>Answer</label>
                      <textarea rows={2} className="form-control" value={item.answer || ''} onChange={(e) => updateFaq('answer', e.target.value)} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* SECTION: TRUST STATS & GLOBAL */}
        {activeSection === 'trustStats' && (
          <div>
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--navy-900)', marginBottom: '0.25rem' }}>
                Trust Stats & Contact Info
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Edit the 6 stats used in TrustStatsBar and footer contact info.
              </p>
            </div>

            <div className="card" style={{ padding: '1.5rem', border: '1px solid var(--border-color)', background: '#ffffff', marginBottom: '2rem' }}>
              <h4 style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--navy-900)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Shield size={16} style={{ color: 'var(--orange-500)' }} /> Trust Stats
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
                {[0, 1, 2, 3, 4, 5].map(i => {
                  const stats = draftSettings.trustStats || [
                    { label: 'Designs Delivered', value: '1M+' },
                    { label: 'Happy Clients', value: '50k+' },
                    { label: 'Countries Served', value: '120+' },
                    { label: 'Expert Digitizers', value: '150+' },
                    { label: 'Years Experience', value: '15+' },
                    { label: 'Turnaround Time', value: '4-12 Hrs' }
                  ];
                  const stat = stats[i] || { label: '', value: '' };

                  const updateStat = (field, val) => {
                    const nextStats = [...stats];
                    nextStats[i] = { ...stat, [field]: val };
                    setDraftSettings(prev => ({ ...prev, trustStats: nextStats }));
                  };

                  return (
                    <div key={i} className="form-group" style={{ marginBottom: 0, padding: '0.5rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--orange-600)' }}>Stat #{i + 1} Value</label>
                      <input type="text" className="form-control" style={{ fontWeight: 800, fontSize: '1.1rem', marginBottom: '0.5rem' }} value={stat.value || ''} onChange={(e) => updateStat('value', e.target.value)} />
                      
                      <label style={{ fontSize: '0.75rem', fontWeight: 700 }}>Label</label>
                      <input type="text" className="form-control" style={{ fontSize: '0.85rem' }} value={stat.label || ''} onChange={(e) => updateStat('label', e.target.value)} />
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="card" style={{ padding: '1.5rem', border: '1px solid var(--border-color)', background: '#ffffff' }}>
              <h4 style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--navy-900)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Globe size={16} style={{ color: 'var(--orange-500)' }} /> Footer Contact Info
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '0.78rem' }}>Email Address</label>
                  <input type="email" className="form-control" value={draftSettings.contactInfo?.email || ''} onChange={(e) => setDraftSettings(prev => ({ ...prev, contactInfo: { ...prev.contactInfo, email: e.target.value } }))} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '0.78rem' }}>Phone Number</label>
                  <input type="text" className="form-control" value={draftSettings.contactInfo?.phone || ''} onChange={(e) => setDraftSettings(prev => ({ ...prev, contactInfo: { ...prev.contactInfo, phone: e.target.value } }))} />
                </div>
                <div className="form-group" style={{ marginBottom: 0, gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: '0.78rem' }}>Physical Address</label>
                  <textarea rows={2} className="form-control" value={draftSettings.contactInfo?.address || ''} onChange={(e) => setDraftSettings(prev => ({ ...prev, contactInfo: { ...prev.contactInfo, address: e.target.value } }))} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Bar */}
        <div style={{
          marginTop: '2rem',
          paddingTop: '1.5rem',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '1rem'
        }}>
          <button 
            type="submit" 
            className="btn btn-primary-orange btn-lg"
            style={{ fontWeight: 800 }}
          >
            <Save size={18} /> Save & Publish Live Changes
          </button>
        </div>

      </form>
    </div>
  );
};
