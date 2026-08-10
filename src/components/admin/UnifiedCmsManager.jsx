'use client';

import React, { useState } from 'react';
import { useAppState } from '../../context/StateContext';
import { 
  Globe, 
  DollarSign, 
  Image as ImageIcon,
  Plus, 
  Trash2, 
  Save,
  UploadCloud,
  Layers,
  LayoutGrid,
  Users,
  MessageSquare,
  HelpCircle
} from 'lucide-react';
import { supabase } from '../../lib/supabase/client';
import { 
  upsertHeroContent, 
  upsertPortfolioItems,
  upsertSewOuts,
  upsertDigitizers,
  upsertFaqs,
  upsertTestimonials,
  saveCmsConfigToSupabase,
  uploadFileToCloudinary
} from '../../services/supabaseService';

export const UnifiedCmsManager = () => {
  const { 
    heroSlides = [], 
    portfolioSamples = [],
    sewOuts = [],
    digitizers = [],
    faqs = [],
    testimonials = [],
    heroGlobalSettings,
    showToast 
  } = useAppState();

  const [activeTab, setActiveTab] = useState('hero'); 
  
  // Local Drafts
  const [draftHeroGlobal, setDraftHeroGlobal] = useState(heroGlobalSettings || { title: 'Premium Embroidery, Vector Art & Patches', rotatingTexts: 'Commercial Embroidery, Scalable Vector Art, Custom Physical Patches' });
  const [draftHero, setDraftHero] = useState([...(heroSlides.length ? heroSlides : [])]);
  const [draftPortfolio, setDraftPortfolio] = useState([...(portfolioSamples.length ? portfolioSamples : [])]);
  const [draftSewOuts, setDraftSewOuts] = useState([...(sewOuts?.length ? sewOuts : [])]);
  const [draftDigitizers, setDraftDigitizers] = useState([...(digitizers?.length ? digitizers : [])]);
  const [draftFaqs, setDraftFaqs] = useState([...(faqs?.length ? faqs : [])]);
  const [draftTestimonials, setDraftTestimonials] = useState([...(testimonials?.length ? testimonials : [])]);

  // Handle Input Changes
  const handleHeroChange = (id, field, value) => {
    setDraftHero(prev => prev.map(slide => slide.id === id ? { ...slide, [field]: value } : slide));
  };
  
  const handlePricingChange = (id, field, value) => {
    setDraftPricing(prev => prev.map(card => card.id === id ? { ...card, [field]: value } : card));
  };

  const handlePatchChange = (id, field, value) => {
    setDraftPatches(prev => prev.map(card => card.id === id ? { ...card, [field]: value } : card));
  };

  const handlePortfolioChange = (id, field, value) => {
    setDraftPortfolio(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const handleSewOutChange = (id, field, value) => {
    setDraftSewOuts(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const handleDigitizerChange = (id, field, value) => {
    setDraftDigitizers(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const handleFaqChange = (id, field, value) => {
    setDraftFaqs(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const handleTestimonialChange = (id, field, value) => {
    setDraftTestimonials(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const handleImageUpload = (e, callback) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        callback(event.target.result);
        showToast('Image uploaded to Draft (Base64)', 'success');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveAll = async () => {
    showToast('Saving CMS configurations...', 'info');
    try {
      if (activeTab === 'hero') {
        const processedHero = await Promise.all(draftHero.map(async (slide) => {
          let newSlide = { ...slide };
          if (newSlide.previewBefore && newSlide.previewBefore.startsWith('data:image')) {
            const uploadedUrl = await uploadFileToCloudinary(newSlide.previewBefore, 'client-uploads', 'hero');
            if (uploadedUrl) newSlide.previewBefore = uploadedUrl;
          }
          if (newSlide.preview_before && newSlide.preview_before.startsWith('data:image')) {
            const uploadedUrl = await uploadFileToCloudinary(newSlide.preview_before, 'client-uploads', 'hero');
            if (uploadedUrl) newSlide.preview_before = uploadedUrl;
          }
          if (newSlide.previewAfter && newSlide.previewAfter.startsWith('data:image')) {
            const uploadedUrl = await uploadFileToCloudinary(newSlide.previewAfter, 'client-uploads', 'hero');
            if (uploadedUrl) newSlide.previewAfter = uploadedUrl;
          }
          if (newSlide.preview_after && newSlide.preview_after.startsWith('data:image')) {
            const uploadedUrl = await uploadFileToCloudinary(newSlide.preview_after, 'client-uploads', 'hero');
            if (uploadedUrl) newSlide.preview_after = uploadedUrl;
          }
          return newSlide;
        }));
        
        const res1 = await saveCmsConfigToSupabase('hero_global_settings', draftHeroGlobal);
        const res2 = await upsertHeroContent(processedHero);
        if (!res1 || !res2) throw new Error("Failed to save hero content");
      }
      else if (activeTab === 'portfolio') {
        const processedPortfolio = await Promise.all(draftPortfolio.map(async (item) => {
          let newItem = { ...item };
          
          if (newItem.originalImage && newItem.originalImage.startsWith('data:image')) {
            const uploadedUrl = await uploadFileToCloudinary(newItem.originalImage, 'client-uploads', 'portfolio');
            if (uploadedUrl) newItem.originalImage = uploadedUrl;
          }
          if (newItem.digitizedImage && newItem.digitizedImage.startsWith('data:image')) {
            const uploadedUrl = await uploadFileToCloudinary(newItem.digitizedImage, 'client-uploads', 'portfolio');
            if (uploadedUrl) newItem.digitizedImage = uploadedUrl;
          }
          if (newItem.beforeImg && newItem.beforeImg.startsWith('data:image')) {
            const uploadedUrl = await uploadFileToCloudinary(newItem.beforeImg, 'client-uploads', 'portfolio');
            if (uploadedUrl) newItem.beforeImg = uploadedUrl;
          }
          if (newItem.afterImg && newItem.afterImg.startsWith('data:image')) {
            const uploadedUrl = await uploadFileToCloudinary(newItem.afterImg, 'client-uploads', 'portfolio');
            if (uploadedUrl) newItem.afterImg = uploadedUrl;
          }
          
          return newItem;
        }));
        
        const res = await upsertPortfolioItems(processedPortfolio);
        if (!res) throw new Error("Failed to save portfolio");
      }
      else if (activeTab === 'sewouts') {
        const processedSewOuts = await Promise.all(draftSewOuts.map(async (item) => {
          let newItem = { ...item };
          if (newItem.beforeImg && newItem.beforeImg.startsWith('data:image')) {
            const uploadedUrl = await uploadFileToCloudinary(newItem.beforeImg, 'client-uploads', 'sewouts');
            if (uploadedUrl) newItem.beforeImg = uploadedUrl;
          }
          if (newItem.afterImg && newItem.afterImg.startsWith('data:image')) {
            const uploadedUrl = await uploadFileToCloudinary(newItem.afterImg, 'client-uploads', 'sewouts');
            if (uploadedUrl) newItem.afterImg = uploadedUrl;
          }
          return newItem;
        }));
        
        const res = await upsertSewOuts(processedSewOuts);
        if (!res) throw new Error("Failed to save sew outs");
      }
      else if (activeTab === 'team') {
        const res = await upsertDigitizers(draftDigitizers);
        if (!res) throw new Error("Failed to save team");
      }
      else if (activeTab === 'faqs') {
        const res = await upsertFaqs(draftFaqs);
        if (!res) throw new Error("Failed to save faqs");
      }
      else if (activeTab === 'testimonials') {
        const res = await upsertTestimonials(draftTestimonials);
        if (!res) throw new Error("Failed to save testimonials");
      }
      showToast('Live Website Updated Successfully!', 'success');
    } catch (err) {
      showToast('Error saving data: ' + err.message, 'error');
    }
  };

  return (
    <div style={{ animation: 'fadeUp 0.4s ease forwards' }}>
      
      {/* Header Bar */}
      <div className="card" style={{ padding: '1.5rem 2rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0 0 0.5rem 0', color: 'var(--navy-950)' }}>Unified CMS Engine</h2>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.95rem' }}>Edit live website content seamlessly.</p>
        </div>
        <button onClick={handleSaveAll} className="btn btn-primary-orange">
          <Save size={18} /> Save & Publish Live
        </button>
      </div>

      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        {[
          { id: 'hero', label: 'Homepage Hero', icon: Globe },
          { id: 'portfolio', label: 'Portfolio Showcase', icon: ImageIcon },
          { id: 'sewouts', label: 'Sew-Outs Gallery', icon: ImageIcon },
          { id: 'team', label: 'Team & Digitizers', icon: Users },
          { id: 'faqs', label: 'FAQs', icon: HelpCircle },
          { id: 'testimonials', label: 'Testimonials', icon: MessageSquare }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`btn ${activeTab === tab.id ? 'btn-navy' : 'btn-outline'}`}
            style={{ 
              background: activeTab === tab.id ? 'var(--navy-900)' : 'transparent',
              borderColor: activeTab === tab.id ? 'transparent' : 'var(--border-color)',
              color: activeTab === tab.id ? '#fff' : 'var(--text-muted)',
              padding: '0.75rem 1.5rem',
              boxShadow: activeTab === tab.id ? 'var(--shadow-md)' : 'none'
            }}
          >
            <tab.icon size={18} /> {tab.label}
          </button>
        ))}
      </div>

      {/* Hero Tab */}
      {activeTab === 'hero' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div className="card" style={{ padding: '2rem', borderTop: '4px solid var(--orange-500)' }}>
            <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.25rem' }}>Global Hero Settings</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
              <div className="form-group">
                <label>Main Headline Title</label>
                <input 
                  className="form-control" 
                  value={draftHeroGlobal.title || ''} 
                  onChange={e => setDraftHeroGlobal({...draftHeroGlobal, title: e.target.value})} 
                />
              </div>
              <div className="form-group">
                <label>Rotating Keywords (Comma-separated)</label>
                <input 
                  className="form-control" 
                  value={draftHeroGlobal.rotatingTexts || ''} 
                  onChange={e => setDraftHeroGlobal({...draftHeroGlobal, rotatingTexts: e.target.value})} 
                />
              </div>
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '1rem 0' }}/>

          {draftHero.map((slide, idx) => (
            <div key={slide.id} className="card" style={{ padding: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--orange-50)', color: 'var(--orange-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                    {idx + 1}
                  </div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem' }}>Service: {slide.label || 'New Service'}</h3>
                </div>
                <button onClick={() => setDraftHero(draftHero.filter(s => s.id !== slide.id))} className="btn btn-outline" style={{ borderColor: '#fca5a5', color: '#ef4444', padding: '0.5rem 1rem' }}>
                  <Trash2 size={16} /> Delete Service
                </button>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                <div className="form-group">
                  <label>Service ID (Used for URL/Routing)</label>
                  <input className="form-control" placeholder="e.g. embroidery" value={slide.id || ''} onChange={e => handleHeroChange(slide.id, 'id', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Tab Label (Appears on Switcher)</label>
                  <input className="form-control" placeholder="e.g. Embroidery" value={slide.label || ''} onChange={e => handleHeroChange(slide.id, 'label', e.target.value)} />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Top Accent Badge</label>
                  <input className="form-control" placeholder="e.g. PREMIUM STUDIO" value={slide.badge || ''} onChange={e => handleHeroChange(slide.id, 'badge', e.target.value)} />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Primary Headline Title</label>
                  <input className="form-control" placeholder="e.g. Your Complete Digitizing Studio" value={slide.title || ''} onChange={e => handleHeroChange(slide.id, 'title', e.target.value)} style={{ fontSize: '1.2rem', fontWeight: 600 }} />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Highlighted Keyword (Orange gradient text)</label>
                  <input className="form-control" placeholder="e.g. All Services" value={slide.highlight || ''} onChange={e => handleHeroChange(slide.id, 'highlight', e.target.value)} />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Supporting Description Paragraph</label>
                  <textarea className="form-control" rows="3" placeholder="Describe the service..." value={slide.description || ''} onChange={e => handleHeroChange(slide.id, 'description', e.target.value)} />
                </div>
                
                {/* CTA Buttons Editable Fields */}
                <div className="form-group">
                  <label>Primary Button (CTA 1)</label>
                  <input className="form-control" placeholder="e.g. Get Started" value={slide.primaryCta || ''} onChange={e => handleHeroChange(slide.id, 'primaryCta', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Secondary Button (CTA 2)</label>
                  <input className="form-control" placeholder="e.g. View Pricing" value={slide.secondaryCta || ''} onChange={e => handleHeroChange(slide.id, 'secondaryCta', e.target.value)} />
                </div>

                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Hero Preview Images (Before & After Slider)</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', background: 'var(--navy-50)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border-color)' }}>
                    
                    {/* Before Image */}
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 600 }}>Before Image (Original)</label>
                      <label className="btn btn-outline" style={{ width: '100%', cursor: 'pointer', display: 'flex', justifyContent: 'center' }}>
                        <UploadCloud size={18} /> Upload Before
                        <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, (url) => handleHeroChange(slide.id, 'preview_before', url))} style={{ display: 'none' }} />
                      </label>
                      {(slide.preview_before || slide.previewBefore) && (
                        <div style={{ marginTop: '1rem' }}>
                          <img src={slide.preview_before || slide.previewBefore} alt="preview before" style={{ width: '100%', maxHeight: '150px', objectFit: 'cover', borderRadius: 'var(--radius-sm)', boxShadow: 'var(--shadow-sm)' }} />
                        </div>
                      )}
                    </div>

                    {/* After Image */}
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: 600 }}>After Image (Result)</label>
                      <label className="btn btn-outline" style={{ width: '100%', cursor: 'pointer', display: 'flex', justifyContent: 'center' }}>
                        <UploadCloud size={18} /> Upload After
                        <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, (url) => handleHeroChange(slide.id, 'preview_after', url))} style={{ display: 'none' }} />
                      </label>
                      {(slide.preview_after || slide.previewAfter) && (
                        <div style={{ marginTop: '1rem' }}>
                          <img src={slide.preview_after || slide.previewAfter} alt="preview after" style={{ width: '100%', maxHeight: '150px', objectFit: 'cover', borderRadius: 'var(--radius-sm)', boxShadow: 'var(--shadow-sm)' }} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
          <button 
            onClick={() => setDraftHero([...draftHero, { id: 'service-' + Date.now(), label: 'New Service', sort_order: draftHero.length + 1 }])}
            className="btn btn-outline"
            style={{ padding: '1rem', borderStyle: 'dashed', borderWidth: '2px', justifyContent: 'center' }}
          >
            <Plus size={20} /> Add New Service Tab
          </button>
        </div>
      )}

      {/* Portfolio Tab */}
      {activeTab === 'portfolio' && (
        <div className="card" style={{ padding: '2rem' }}>
          <h3 style={{ fontSize: '1.4rem', marginBottom: '1.5rem' }}>Portfolio Showcase Gallery</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {draftPortfolio.map((item) => (
              <div key={item.id} style={{ background: 'var(--bg-main)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', position: 'relative' }}>
                <button onClick={() => setDraftPortfolio(draftPortfolio.filter(p => p.id !== item.id))} style={{ position: 'absolute', top: '10px', right: '10px', color: '#ef4444', background: '#fff', border: '1px solid #fecaca', borderRadius: '4px', cursor: 'pointer', padding: '4px' }}>
                  <Trash2 size={14} />
                </button>
                <div className="form-group" style={{ marginTop: '1rem' }}>
                  <label>Showcase Title</label>
                  <input className="form-control" placeholder="e.g. Skull Leather Patch" value={item.title || ''} onChange={e => handlePortfolioChange(item.id, 'title', e.target.value)} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label>Filter Category</label>
                    <select className="form-control" value={item.category || ''} onChange={e => handlePortfolioChange(item.id, 'category', e.target.value)}>
                      <option value="">Select Category...</option>
                      <option value="Embroidery">Embroidery Digitizing</option>
                      <option value="Vector Art">Vector Art</option>
                      <option value="Custom Patches">Custom Patches</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Client Type</label>
                    <select className="form-control" value={item.clientType || ''} onChange={e => handlePortfolioChange(item.id, 'clientType', e.target.value)}>
                      <option value="">Select Client Type...</option>
                      <option value="Commercial">Commercial</option>
                      <option value="Boutique">Boutique</option>
                      <option value="Individual">Individual</option>
                      <option value="Apparel Brand">Apparel Brand</option>
                    </select>
                  </div>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label>Stitch Count</label>
                    <input type="number" className="form-control" placeholder="e.g. 15000" value={item.stitchCount || ''} onChange={e => handlePortfolioChange(item.id, 'stitchCount', parseInt(e.target.value) || 0)} />
                  </div>
                  <div className="form-group">
                    <label>Formats (comma-separated)</label>
                    <input className="form-control" placeholder="e.g. DST, PES" value={Array.isArray(item.formats) ? item.formats.join(', ') : (item.formats || '')} onChange={e => handlePortfolioChange(item.id, 'formats', e.target.value.split(',').map(s=>s.trim()))} />
                  </div>
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea className="form-control" rows="2" placeholder="Describe this portfolio item..." value={item.description || ''} onChange={e => handlePortfolioChange(item.id, 'description', e.target.value)} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label>Original Image</label>
                    <label className="btn btn-outline btn-sm" style={{ cursor: 'pointer', width: '100%', justifyContent: 'center' }}>
                      <UploadCloud size={14} /> Upload Original
                      <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, (url) => handlePortfolioChange(item.id, 'originalImage', url))} style={{ display: 'none' }} />
                    </label>
                    {(item.originalImage || item.beforeImg) && <img src={item.originalImage || item.beforeImg} alt="original" style={{ marginTop: '0.75rem', width: '100%', height: '120px', objectFit: 'cover', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }} />}
                  </div>
                  <div className="form-group">
                    <label>Digitized/Finished Image</label>
                    <label className="btn btn-outline btn-sm" style={{ cursor: 'pointer', width: '100%', justifyContent: 'center' }}>
                      <UploadCloud size={14} /> Upload Digitized
                      <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, (url) => handlePortfolioChange(item.id, 'digitizedImage', url))} style={{ display: 'none' }} />
                    </label>
                    {(item.digitizedImage || item.afterImg) && <img src={item.digitizedImage || item.afterImg} alt="digitized" style={{ marginTop: '0.75rem', width: '100%', height: '120px', objectFit: 'cover', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }} />}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: '2rem' }}>
            <button 
              onClick={() => setDraftPortfolio([...draftPortfolio, { id: 'port-' + Date.now(), title: 'New Item' }])}
              className="btn btn-primary-orange"
            >
              <Plus size={18} /> Add New Portfolio Piece
            </button>
          </div>
        </div>
      )}

      {/* Sew-Outs Tab */}
      {activeTab === 'sewouts' && (
        <div className="card" style={{ padding: '2rem' }}>
          <h3 style={{ fontSize: '1.4rem', marginBottom: '1.5rem' }}>Sew-Outs Gallery</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {draftSewOuts.map((item) => (
              <div key={item.id} style={{ background: 'var(--bg-main)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', position: 'relative' }}>
                <button onClick={() => setDraftSewOuts(draftSewOuts.filter(p => p.id !== item.id))} style={{ position: 'absolute', top: '10px', right: '10px', color: '#ef4444', background: '#fff', border: '1px solid #fecaca', borderRadius: '4px', cursor: 'pointer', padding: '4px' }}>
                  <Trash2 size={14} />
                </button>
                <div className="form-group" style={{ marginTop: '1rem' }}>
                  <label>Title</label>
                  <input className="form-control" value={item.title || ''} onChange={e => handleSewOutChange(item.id, 'title', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>After Image URL (Base64 or Link)</label>
                  <input className="form-control" value={item.afterImg || ''} onChange={e => handleSewOutChange(item.id, 'after_img', e.target.value)} />
                </div>
              </div>
            ))}
          </div>
          <button onClick={() => setDraftSewOuts([...draftSewOuts, { id: 'sew-' + Date.now(), title: 'New Sew-Out' }])} className="btn btn-primary-orange" style={{ marginTop: '2rem' }}>
            <Plus size={18} /> Add Sew-Out
          </button>
        </div>
      )}

      {/* Team Tab */}
      {activeTab === 'team' && (
        <div className="card" style={{ padding: '2rem' }}>
          <h3 style={{ fontSize: '1.4rem', marginBottom: '1.5rem' }}>Team & Digitizers</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {draftDigitizers.map((item) => (
              <div key={item.id} style={{ background: 'var(--bg-main)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', position: 'relative' }}>
                <button onClick={() => setDraftDigitizers(draftDigitizers.filter(p => p.id !== item.id))} style={{ position: 'absolute', top: '10px', right: '10px', color: '#ef4444', background: '#fff', border: '1px solid #fecaca', borderRadius: '4px', cursor: 'pointer', padding: '4px' }}>
                  <Trash2 size={14} />
                </button>
                <div className="form-group" style={{ marginTop: '1rem' }}>
                  <label>Name</label>
                  <input className="form-control" value={item.name || ''} onChange={e => handleDigitizerChange(item.id, 'name', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Role</label>
                  <input className="form-control" value={item.role || ''} onChange={e => handleDigitizerChange(item.id, 'role', e.target.value)} />
                </div>
              </div>
            ))}
          </div>
          <button onClick={() => setDraftDigitizers([...draftDigitizers, { id: 'digi-' + Date.now(), name: 'New Team Member' }])} className="btn btn-primary-orange" style={{ marginTop: '2rem' }}>
            <Plus size={18} /> Add Team Member
          </button>
        </div>
      )}

      {/* FAQs Tab */}
      {activeTab === 'faqs' && (
        <div className="card" style={{ padding: '2rem' }}>
          <h3 style={{ fontSize: '1.4rem', marginBottom: '1.5rem' }}>Frequently Asked Questions</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {draftFaqs.map((item) => (
              <div key={item.id} style={{ background: 'var(--bg-main)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <h4 style={{ margin: 0, color: 'var(--navy-800)' }}>{item.question || 'New FAQ'}</h4>
                  <button onClick={() => setDraftFaqs(draftFaqs.filter(c => c.id !== item.id))} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}><Trash2 size={16} /></button>
                </div>
                <div className="form-group">
                  <label>Question</label>
                  <input className="form-control" value={item.question || ''} onChange={e => handleFaqChange(item.id, 'question', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Answer</label>
                  <textarea className="form-control" rows="3" value={item.answer || ''} onChange={e => handleFaqChange(item.id, 'answer', e.target.value)} />
                </div>
              </div>
            ))}
          </div>
          <button onClick={() => setDraftFaqs([...draftFaqs, { id: 'faq-' + Date.now(), question: 'New Question', answer: '' }])} className="btn btn-primary-orange" style={{ marginTop: '2rem' }}>
            <Plus size={18} /> Add FAQ
          </button>
        </div>
      )}

      {/* Testimonials Tab */}
      {activeTab === 'testimonials' && (
        <div className="card" style={{ padding: '2rem' }}>
          <h3 style={{ fontSize: '1.4rem', marginBottom: '1.5rem' }}>Testimonials</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {draftTestimonials.map((item) => (
              <div key={item.id} style={{ background: 'var(--bg-main)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', position: 'relative' }}>
                <button onClick={() => setDraftTestimonials(draftTestimonials.filter(p => p.id !== item.id))} style={{ position: 'absolute', top: '10px', right: '10px', color: '#ef4444', background: '#fff', border: '1px solid #fecaca', borderRadius: '4px', cursor: 'pointer', padding: '4px' }}>
                  <Trash2 size={14} />
                </button>
                <div className="form-group" style={{ marginTop: '1rem' }}>
                  <label>Client Name</label>
                  <input className="form-control" value={item.client_name || ''} onChange={e => handleTestimonialChange(item.id, 'client_name', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Review Text</label>
                  <textarea className="form-control" rows="3" value={item.review_text || ''} onChange={e => handleTestimonialChange(item.id, 'review_text', e.target.value)} />
                </div>
              </div>
            ))}
          </div>
          <button onClick={() => setDraftTestimonials([...draftTestimonials, { id: 'test-' + Date.now(), client_name: 'New Client', review_text: '' }])} className="btn btn-primary-orange" style={{ marginTop: '2rem' }}>
            <Plus size={18} /> Add Testimonial
          </button>
        </div>
      )}
    </div>
  );
}
