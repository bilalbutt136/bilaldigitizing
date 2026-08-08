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
  CheckCircle2
} from 'lucide-react';
import { supabase } from '../../lib/supabase/client';
import { 
  upsertHeroContent, 
  upsertPricingTiers, 
  upsertPortfolioItems,
  upsertPatchCards 
} from '../../services/supabaseService';

export const UnifiedCmsManager = () => {
  const { 
    heroSlides = [], 
    pricingCards = [], 
    patchCards = [], 
    portfolioSamples = [],
    showToast 
  } = useAppState();

  const [activeTab, setActiveTab] = useState('hero'); // 'hero' | 'pricing' | 'portfolio'
  
  // Local Drafts
  const [draftHero, setDraftHero] = useState([...(heroSlides.length ? heroSlides : [])]);
  const [draftPricing, setDraftPricing] = useState([...(pricingCards.length ? pricingCards : [])]);
  const [draftPatches, setDraftPatches] = useState([...(patchCards.length ? patchCards : [])]);
  const [draftPortfolio, setDraftPortfolio] = useState([...(portfolioSamples.length ? portfolioSamples : [])]);

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

  const handleImageUpload = (e, callback) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        callback(event.target.result);
        showToast('Image uploaded (Base64 Draft)', 'success');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveAll = async () => {
    showToast('Saving CMS configurations...', 'info');
    try {
      if (activeTab === 'hero') {
        const res = await upsertHeroContent(draftHero);
        if (!res) throw new Error("Failed to save hero content");
      }
      else if (activeTab === 'pricing') {
        const resP = await upsertPricingTiers(draftPricing);
        const resPatch = await upsertPatchCards(draftPatches);
        if (!resP || !resPatch) throw new Error("Failed to save pricing");
      }
      else if (activeTab === 'portfolio') {
        const res = await upsertPortfolioItems(draftPortfolio);
        if (!res) throw new Error("Failed to save portfolio");
      }
      showToast('Live Website Updated Successfully!', 'success');
    } catch (err) {
      showToast('Error saving data: ' + err.message, 'error');
    }
  };

  return (
    <div className="cms-container" style={{ padding: '1rem', background: '#fff', borderRadius: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>Unified CMS Manager</h2>
        <button 
          onClick={handleSaveAll}
          className="btn btn-primary-orange"
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.25rem', fontWeight: 700, border: 'none', borderRadius: '6px', cursor: 'pointer', color: '#fff', background: '#f97316' }}
        >
          <Save size={18} /> Save & Publish Live
        </button>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
        {[
          { id: 'hero', label: 'Homepage Hero', icon: Globe },
          { id: 'pricing', label: 'Packages & Pricing', icon: DollarSign },
          { id: 'portfolio', label: 'Portfolio Showcase', icon: ImageIcon }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.25rem',
              background: activeTab === tab.id ? '#1e293b' : 'transparent',
              color: activeTab === tab.id ? '#fff' : '#64748b',
              borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem'
            }}
          >
            <tab.icon size={16} /> {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'hero' && (
        <div>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Hero Slides</h3>
          {draftHero.map((slide, idx) => (
            <div key={slide.id} style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '8px', marginBottom: '1rem', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <h4 style={{ margin: 0, color: '#1e293b' }}>Slide #{idx + 1} ({slide.label || 'New'})</h4>
                <button onClick={() => setDraftHero(draftHero.filter(s => s.id !== slide.id))} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}><Trash2 size={16} /></button>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem' }}>Internal Label</label>
                  <input className="input-field" value={slide.label || ''} onChange={e => handleHeroChange(slide.id, 'label', e.target.value)} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem' }}>Top Badge</label>
                  <input className="input-field" value={slide.badge || ''} onChange={e => handleHeroChange(slide.id, 'badge', e.target.value)} />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem' }}>Headline Title</label>
                  <input className="input-field" value={slide.title || ''} onChange={e => handleHeroChange(slide.id, 'title', e.target.value)} />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem' }}>Highlight Phrase</label>
                  <input className="input-field" value={slide.highlight || ''} onChange={e => handleHeroChange(slide.id, 'highlight', e.target.value)} />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem' }}>Description</label>
                  <textarea className="input-field" rows="3" value={slide.description || ''} onChange={e => handleHeroChange(slide.id, 'description', e.target.value)} />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem' }}>Hero Image Upload</label>
                  <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, (url) => handleHeroChange(slide.id, 'preview_after', url))} />
                  {slide.preview_after && <img src={slide.preview_after} alt="preview" style={{ marginTop: '0.5rem', maxHeight: '100px', borderRadius: '4px' }} />}
                </div>
              </div>
            </div>
          ))}
          <button 
            onClick={() => setDraftHero([...draftHero, { id: 'slide-' + Date.now(), label: 'New Slide', sort_order: draftHero.length + 1 }])}
            style={{ padding: '0.5rem 1rem', background: '#e2e8f0', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
          >
            <Plus size={16} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> Add Slide
          </button>
        </div>
      )}

      {activeTab === 'pricing' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Digitizing & Vector Tiers</h3>
            {draftPricing.map((card) => (
              <div key={card.id} style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '8px', marginBottom: '1rem', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.5rem' }}>
                  <button onClick={() => setDraftPricing(draftPricing.filter(c => c.id !== card.id))} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}><Trash2 size={16} /></button>
                </div>
                <input className="input-field" placeholder="Title" value={card.title || ''} onChange={e => handlePricingChange(card.id, 'title', e.target.value)} style={{ marginBottom: '0.5rem' }} />
                <input className="input-field" placeholder="Rate" value={card.rate || ''} onChange={e => handlePricingChange(card.id, 'rate', e.target.value)} style={{ marginBottom: '0.5rem' }} />
                <textarea className="input-field" rows="3" placeholder="Features (comma separated)" value={(card.features || []).join(', ')} onChange={e => handlePricingChange(card.id, 'features', e.target.value.split(',').map(s=>s.trim()))} />
              </div>
            ))}
            <button 
              onClick={() => setDraftPricing([...draftPricing, { id: 'price-' + Date.now(), title: 'New Tier', rate: '$0', features: [] }])}
              style={{ padding: '0.5rem 1rem', background: '#e2e8f0', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
            >
              <Plus size={16} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> Add Tier
            </button>
          </div>
          <div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Patch Tiers</h3>
            {draftPatches.map((card) => (
              <div key={card.id} style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '8px', marginBottom: '1rem', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.5rem' }}>
                  <button onClick={() => setDraftPatches(draftPatches.filter(c => c.id !== card.id))} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}><Trash2 size={16} /></button>
                </div>
                <input className="input-field" placeholder="Title" value={card.title || ''} onChange={e => handlePatchChange(card.id, 'title', e.target.value)} style={{ marginBottom: '0.5rem' }} />
                <input className="input-field" placeholder="Rate" value={card.rate || ''} onChange={e => handlePatchChange(card.id, 'rate', e.target.value)} style={{ marginBottom: '0.5rem' }} />
                <textarea className="input-field" rows="3" placeholder="Features (comma separated)" value={(card.features || []).join(', ')} onChange={e => handlePatchChange(card.id, 'features', e.target.value.split(',').map(s=>s.trim()))} />
              </div>
            ))}
            <button 
              onClick={() => setDraftPatches([...draftPatches, { id: 'patch-' + Date.now(), title: 'New Patch', rate: '$0', features: [] }])}
              style={{ padding: '0.5rem 1rem', background: '#e2e8f0', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
            >
              <Plus size={16} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> Add Patch Tier
            </button>
          </div>
        </div>
      )}

      {activeTab === 'portfolio' && (
        <div>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Portfolio Showcase</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {draftPortfolio.map((item) => (
              <div key={item.id} style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <input className="input-field" placeholder="Title" value={item.title || ''} onChange={e => handlePortfolioChange(item.id, 'title', e.target.value)} style={{ width: '80%' }} />
                  <button onClick={() => setDraftPortfolio(draftPortfolio.filter(p => p.id !== item.id))} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}><Trash2 size={16} /></button>
                </div>
                <input className="input-field" placeholder="Category" value={item.category || ''} onChange={e => handlePortfolioChange(item.id, 'category', e.target.value)} style={{ marginBottom: '0.5rem' }} />
                <div style={{ marginBottom: '0.5rem' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.25rem' }}>Image</label>
                  <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, (url) => handlePortfolioChange(item.id, 'image', url))} />
                  {item.image && <img src={item.image} alt="portfolio" style={{ marginTop: '0.5rem', maxHeight: '100px', borderRadius: '4px' }} />}
                </div>
              </div>
            ))}
          </div>
          <button 
            onClick={() => setDraftPortfolio([...draftPortfolio, { id: 'port-' + Date.now(), title: 'New Item' }])}
            style={{ marginTop: '1rem', padding: '0.5rem 1rem', background: '#e2e8f0', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
          >
            <Plus size={16} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> Add Portfolio Item
          </button>
        </div>
      )}
    </div>
  );
}
