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
  CheckCircle2, 
  RefreshCw, 
  Sliders, 
  Sparkles,
  Mail,
  Phone,
  Info,
  Clock,
  Tag,
  Eye,
  EyeOff,
  Zap
} from 'lucide-react';

export const SiteCmsEditor = () => {
  const { 
    pricing, 
    updatePricing, 
    pricingCards,
    updatePricingCards,
    patchCards,
    updatePatchCards,
    portfolioSamples,
    updatePortfolioSamples,
    sewOuts,
    updateSewOuts,
    servicesList, 
    updateServicesList, 
    siteSettings, 
    updateSiteSettings,
    showToast
  } = useAppState();

  const [activeSection, setActiveSection] = useState('portfolio'); // 'portfolio' | 'pricing' | 'sewouts' | 'settings'

  // Local draft states
  const [draftPricing, setDraftPricing] = useState({ ...pricing });
  const [draftPricingCards, setDraftPricingCards] = useState([...(pricingCards || [])]);
  const [draftPatchCards, setDraftPatchCards] = useState([...(patchCards || [])]);
  const [draftPortfolio, setDraftPortfolio] = useState([...(portfolioSamples || [])]);
  const [draftSewOuts, setDraftSewOuts] = useState([...(sewOuts || [])]);
  const [draftServices, setDraftServices] = useState([...(servicesList || [])]);
  const [draftSettings, setDraftSettings] = useState({ ...siteSettings });

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

  // Handle Sew-Out Card Changes
  const handleSewOutChange = (id, field, value) => {
    setDraftSewOuts(prev => prev.map(item => {
      if (item.id === id) {
        if (field === 'features') {
          return { ...item, features: typeof value === 'string' ? value.split('\n').filter(f => f.trim() !== '') : value };
        }
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const handleAddSewOut = () => {
    const newSewOut = {
      id: `sewout-${Date.now()}`,
      title: 'New Digitizing Sew-Out Proof',
      category: 'Cap & Apparel Logo',
      beforeImg: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=800&q=80',
      afterImg: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80',
      stitchCount: '10,000 Stitches',
      formats: 'DST, PES, EMB, EXP',
      features: ['Center-out embroidery pathing', '3D foam raised thread depth', 'Zero needle breaks']
    };
    setDraftSewOuts(prev => [...prev, newSewOut]);
    showToast('New Sew-Out Card added to draft!', 'info');
  };

  const handleRemoveSewOut = (idToRemove) => {
    setDraftSewOuts(prev => prev.filter(item => item.id !== idToRemove));
    showToast('Sew-Out Card removed from draft', 'info');
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

  // Handle Service Card Edit
  const handleServiceChange = (id, field, value) => {
    setDraftServices(prev => prev.map(srv => {
      if (srv.id === id) {
        return { ...srv, [field]: value };
      }
      return srv;
    }));
  };

  const handleAddService = () => {
    const newId = `srv-${Date.now()}`;
    const newServiceItem = {
      id: newId,
      title: 'New Embroidery / Vector Service',
      price: 'Starting $15.00',
      stitches: 'Custom Pathing',
      time: '12 - 24 Hours',
      icon: 'Shirt',
      desc: 'Enter service description here to display on public landing page.'
    };
    setDraftServices(prev => [...prev, newServiceItem]);
  };

  const handleRemoveService = (idToRemove) => {
    setDraftServices(prev => prev.filter(srv => srv.id !== idToRemove));
  };

  // Publish changes live to context & localStorage & Supabase DB
  const handleSaveAll = (e) => {
    e.preventDefault();
    updatePricing(draftPricing);
    updatePricingCards(draftPricingCards);
    updatePatchCards(draftPatchCards);
    updatePortfolioSamples(draftPortfolio);
    updateSewOuts(draftSewOuts);
    updateServicesList(draftServices);
    updateSiteSettings(draftSettings);
    showToast('All CMS updates, pricing & sew-outs showcase gallery published live!', 'success');
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
        padding: '0 1.25rem'
      }}>
        <button
          type="button"
          onClick={() => setActiveSection('pricing')}
          style={{
            padding: '1rem 1.25rem',
            border: 'none',
            borderBottom: activeSection === 'pricing' ? '3px solid #ff7a00' : '3px solid transparent',
            background: 'none',
            fontWeight: 800,
            fontSize: '0.9rem',
            color: activeSection === 'pricing' ? '#ff7a00' : '#64748b',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <Tag size={18} /> Pricing Cards & Tiers
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('vector')}
          style={{
            padding: '1rem 1.25rem',
            border: 'none',
            borderBottom: activeSection === 'vector' ? '3px solid #ff7a00' : '3px solid transparent',
            background: 'none',
            fontWeight: 800,
            fontSize: '0.9rem',
            color: activeSection === 'vector' ? '#ff7a00' : '#64748b',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <Zap size={18} /> Vector Art Service Module
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
            gap: '0.5rem'
          }}
        >
          <Settings size={18} /> Site Contact & Metadata
        </button>
      </div>

      {/* Editor Body */}
      <form onSubmit={handleSaveAll} style={{ padding: '2rem' }}>

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
